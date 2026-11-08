'use client';

import { allPages, autofill, clearPhoto } from '@/lib/album/ops';
import type { AlbumDocument, PhotoAsset } from '@/lib/album/types';
import { completePhoto, prepareImage, registerPhoto, sendPhoto, UploadError, validateFile, withRetry } from '@/lib/client/upload';
import { useEditor, type UploadItem } from './store';

/** Photos sending bytes at once. Phones and desktops both do well with a handful in parallel. */
const NETWORK_CONCURRENCY = 4;
/** How far preparation may run ahead of the network (bounds memory with hundreds of photos). */
const LOOKAHEAD = 24;
/** UI updates are batched: one store write per tick instead of one per progress event. */
const TICK_MS = 160;

const placedCount = (doc: AlbumDocument | null) => {
  let n = 0;
  if (doc) for (const { page } of allPages(doc)) for (const el of page.elements) if (el.type === 'photo' && el.photoId) n++;
  return n;
};

class Semaphore {
  private waiting: Array<() => void> = [];
  constructor(private free: number) {}
  async acquire() {
    if (this.free > 0) {
      this.free--;
      return;
    }
    await new Promise<void>((r) => this.waiting.push(r));
  }
  release() {
    const next = this.waiting.shift();
    if (next) next();
    else this.free++;
  }
  async run<T>(fn: () => Promise<T>) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

const network = new Semaphore(NETWORK_CONCURRENCY);
const lookahead = new Semaphore(LOOKAHEAD);

/** Files kept for one-tap retry of a failed photo. */
const retryFiles = new Map<string, { file: File; autoPlace: boolean }>();

/* ----------------------------- batched store updates ----------------------------- */

const patches = new Map<string, Partial<UploadItem>>();
let tick = 0;

function flushPatches() {
  tick = 0;
  if (!patches.size) return;
  const p = new Map(patches);
  patches.clear();
  useEditor.getState().setUploads((u) => u.map((x) => (p.has(x.id) ? { ...x, ...p.get(x.id) } : x)));
}

function patch(id: string, change: Partial<UploadItem>, now = false) {
  patches.set(id, { ...patches.get(id), ...change });
  if (now) flushPatches();
  else if (!tick) tick = window.setTimeout(flushPatches, TICK_MS);
}

/* --------------------------- leaving mid-upload warning --------------------------- */

let active = 0;
const warn = (e: BeforeUnloadEvent) => {
  e.preventDefault();
  e.returnValue = '';
};
function track(delta: number) {
  const before = active;
  active += delta;
  if (!before && active) window.addEventListener('beforeunload', warn);
  if (before && !active) window.removeEventListener('beforeunload', warn);
}
export const uploadsInFlight = () => active > 0;

const messageOf = (e: unknown) => (e instanceof UploadError || e instanceof Error ? e.message : 'Upload failed');

let seq = 0;

/**
 * Adds photos to the project with an instant feel:
 *  1. each photo is decoded and resized off the main thread,
 *  2. registered, then shown and placed in the album straight away from the
 *     local copy, while
 *  3. the bytes upload in the background, a few at a time, with retries.
 * While the album has no photos placed yet, photos drop into the empty
 * frames as they arrive — one undo step for the whole batch.
 */
export async function uploadFiles(
  files: File[],
  opts: {
    autoPlace?: boolean;
    /** Called with each batch of photos as they become visible (after they're in the library). */
    onShow?: (batch: PhotoAsset[]) => void;
  } = {},
) {
  const st = useEditor.getState;
  const projectId = st().projectId;
  if (!projectId) return;
  const autoPlace = opts.autoPlace ?? placedCount(st().doc) === 0;
  const historyKey = `autoplace:${++seq}`;
  const items = files.map((file) => ({ id: `u${++seq}`, file, error: validateFile(file) }));
  for (const i of items) if (!i.error) retryFiles.set(i.id, { file: i.file, autoPlace });
  st().setUploads((u) => [
    ...u.filter((x) => x.status !== 'done'),
    ...items.map((i) => ({ id: i.id, name: i.file.name, progress: 0, status: i.error ? ('error' as const) : ('queued' as const), error: i.error ?? undefined })),
  ]);

  // New photos reach the store (and the album) in small batches, not one render per photo.
  let placed = 0;
  let fresh: PhotoAsset[] = [];
  let freshTimer = 0;
  const flushFresh = () => {
    if (freshTimer) window.clearTimeout(freshTimer);
    freshTimer = 0;
    const batch = fresh;
    fresh = [];
    const s = st();
    if (!batch.length || s.projectId !== projectId) return;
    s.addPhotos(batch);
    if (autoPlace) {
      let n = 0;
      s.apply((d) => void (n = autofill(d as AlbumDocument, batch)), { key: historyKey });
      placed += n;
    }
    opts.onShow?.(batch);
  };
  const show = (p: PhotoAsset) => {
    fresh.push(p);
    if (!freshTimer) freshTimer = window.setTimeout(flushFresh, TICK_MS);
  };
  const withdraw = (photoId: string) => {
    fresh = fresh.filter((p) => p.id !== photoId);
    const s = st();
    if (s.projectId !== projectId || !s.photoMap[photoId]) return;
    s.apply((d) => void clearPhoto(d as AlbumDocument, photoId), { key: historyKey });
    s.removePhoto(photoId);
    void fetch(`/api/photos/${photoId}`, { method: 'DELETE' }).catch(() => {});
  };

  let ok = 0;
  const valid = items.filter((i) => !i.error);
  track(valid.length);
  await Promise.all(
    valid.map(async (item) => {
      let photoId: string | null = null;
      await lookahead.acquire();
      try {
        patch(item.id, { status: 'uploading', progress: 0.02 });
        let img;
        try {
          img = await prepareImage(item.file);
        } catch {
          throw new UploadError(`“${item.file.name}” couldn’t be read. Is it a valid image?`, false);
        }
        const reg = await withRetry(() => registerPhoto(projectId, item.file, img));
        photoId = reg.photoId;
        // Visible and placed now, from the local copy; the upload continues behind it.
        show({
          id: reg.photoId,
          width: img.width,
          height: img.height,
          thumbUrl: URL.createObjectURL(img.thumb),
          displayUrl: URL.createObjectURL(img.display),
          placeholder: '#E8E2D8',
          alt: item.file.name,
        });
        patch(item.id, { photoId: reg.photoId, progress: 0.08 });
        await network.run(() => withRetry(() => sendPhoto(item.file, img, reg, (f) => patch(item.id, { progress: 0.08 + 0.88 * f }))));
        await withRetry(() => completePhoto(reg.photoId));
        patch(item.id, { status: 'done', progress: 1 });
        retryFiles.delete(item.id);
        ok++;
      } catch (e) {
        const removedByPerson = photoId && !fresh.some((p) => p.id === photoId) && !st().photoMap[photoId];
        if (removedByPerson) {
          // Deleted from the library while it was still uploading: nothing to report.
          retryFiles.delete(item.id);
          patch(item.id, { status: 'done', progress: 1 }, true);
          return;
        }
        if (photoId) withdraw(photoId);
        patch(item.id, { status: 'error', error: messageOf(e) }, true);
      } finally {
        lookahead.release();
        track(-1);
      }
    }),
  );
  flushFresh();
  flushPatches();

  const s = st();
  if (placed) s.toast(`${placed} ${placed === 1 ? 'photo' : 'photos'} placed on your pages · ⌘Z to undo`, 'success');
  else if (ok) s.toast(`${ok} ${ok === 1 ? 'photo' : 'photos'} uploaded`, 'success');
  const failed = items.filter((i) => i.error || retryFiles.has(i.id)).length;
  if (failed) s.toast(`${failed} ${failed === 1 ? 'photo' : 'photos'} couldn’t be uploaded`, 'error');
  window.setTimeout(() => useEditor.getState().setUploads((u) => u.filter((x) => x.status !== 'done')), 2500);
}

/** Tries a failed photo again. */
export function retryUpload(uploadId: string) {
  const entry = retryFiles.get(uploadId);
  useEditor.getState().setUploads((u) => u.filter((x) => x.id !== uploadId));
  retryFiles.delete(uploadId);
  if (entry) void uploadFiles([entry.file], { autoPlace: entry.autoPlace });
}

export function dismissUpload(uploadId: string) {
  retryFiles.delete(uploadId);
  useEditor.getState().setUploads((u) => u.filter((x) => x.id !== uploadId));
}

export const canRetry = (uploadId: string) => retryFiles.has(uploadId);
