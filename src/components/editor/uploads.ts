'use client';

import { allPages, autofill } from '@/lib/album/ops';
import type { AlbumDocument } from '@/lib/album/types';
import { pool, uploadPhoto, validateFile } from '@/lib/client/upload';
import { useEditor } from './store';

const placedCount = (doc: AlbumDocument | null) => {
  let n = 0;
  if (doc) for (const { page } of allPages(doc)) for (const el of page.elements) if (el.type === 'photo' && el.photoId) n++;
  return n;
};

let seq = 0;

/**
 * Uploads files into the current project's photo library (shared by the upload
 * step and the editor). While the album has no photos placed yet, each photo
 * drops into the next empty frame as soon as it finishes uploading — one undo
 * step for the whole batch.
 */
export async function uploadFiles(files: File[], opts: { autoPlace?: boolean } = {}) {
  const st = useEditor.getState;
  const projectId = st().projectId;
  const autoPlace = opts.autoPlace ?? placedCount(st().doc) === 0;
  const historyKey = `autoplace:${++seq}`;
  let placed = 0;
  const items = files.map((f) => ({ id: `u${++seq}`, file: f, error: validateFile(f) }));
  st().setUploads((u) => [
    ...u.filter((x) => x.status !== 'done'),
    ...items.map((i) => ({ id: i.id, name: i.file.name, progress: 0, status: i.error ? ('error' as const) : ('queued' as const), error: i.error ?? undefined })),
  ]);
  const valid = items.filter((i) => !i.error);
  let ok = 0;
  await pool(valid, 3, async (item) => {
    const update = (patch: Partial<{ progress: number; status: 'queued' | 'uploading' | 'done' | 'error'; error: string }>) =>
      st().setUploads((u) => u.map((x) => (x.id === item.id ? { ...x, ...patch } : x)));
    update({ status: 'uploading', progress: 0.01 });
    try {
      const photo = await uploadPhoto(projectId, item.file, (p) => update({ progress: p }));
      st().addPhotos([photo]);
      if (autoPlace) {
        let n = 0;
        st().apply((d) => {
          n = autofill(d as AlbumDocument, [photo]);
        }, { key: historyKey });
        placed += n;
      }
      update({ status: 'done', progress: 1 });
      ok++;
    } catch (e) {
      update({ status: 'error', error: e instanceof Error ? e.message : 'Upload failed' });
    }
  });
  if (placed) st().toast(`${placed} ${placed === 1 ? 'photo' : 'photos'} placed on your pages · ⌘Z to undo`, 'success');
  else if (ok) st().toast(`${ok} ${ok === 1 ? 'photo' : 'photos'} uploaded`, 'success');
  const failed = files.length - ok;
  if (failed) st().toast(`${failed} ${failed === 1 ? 'photo' : 'photos'} couldn’t be uploaded`, 'error');
  setTimeout(() => st().setUploads((u) => u.filter((x) => x.status !== 'done')), 2500);
}
