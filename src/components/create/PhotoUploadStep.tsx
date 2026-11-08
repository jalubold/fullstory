'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { BookCover, OpenBook } from '@/components/album/Book';
import { bookFinish } from '@/lib/album/color';
import { buildSpreads, countPhotoFrames } from '@/lib/album/geometry';
import { allPages, autofill } from '@/lib/album/ops';
import type { AlbumDocument, PhotoAsset, PhotoMap } from '@/lib/album/types';
import { useEditor } from '@/components/editor/store';
import { flushSave, useAutosave } from '@/components/editor/useAutosave';
import { uploadFiles } from '@/components/editor/uploads';

const NAV_FALLBACK_MS = 8000;

export function PhotoUploadStep(props: { projectId: string; title: string; status: string; doc: AlbumDocument; version: number; photos: PhotoAsset[] }) {
  const router = useRouter();
  const ready = useEditor((s) => s.projectId === props.projectId && !!s.doc);
  const photos = useEditor((s) => s.photos);
  const uploads = useEditor((s) => s.uploads);
  const doc = useEditor((s) => s.doc);
  const [autofillOn, setAutofillOn] = useState(true);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useAutosave();

  useEffect(() => {
    useEditor.getState().init({ projectId: props.projectId, title: props.title, status: props.status, doc: props.doc, version: props.version, photos: props.photos });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.projectId]);

  // Reset the button if this page is shown again later (Next keeps visited pages alive).
  useEffect(() => () => setBusy(false), []);

  if (!ready) return <div className="h-96 skeleton rounded-[4px]" />;
  const frames = countPhotoFrames(doc);
  const uploading = uploads.some((u) => u.status === 'uploading' || u.status === 'queued');

  const next = async () => {
    setBusy(true);
    const s = useEditor.getState();
    // Catch anything uploaded before auto-placement was switched on.
    if (autofillOn && s.photos.length) s.apply((d) => void autofill(d as AlbumDocument, s.photos));
    await flushSave(10_000);
    const url = `/projects/${props.projectId}/edit`;
    router.push(url);
    window.setTimeout(() => {
      if (window.location.pathname.endsWith('/photos')) window.location.assign(url);
    }, NAV_FALLBACK_MS);
  };

  const remove = async (p: PhotoAsset) => {
    const res = await fetch(`/api/photos/${p.id}`, { method: 'DELETE' });
    if (res.ok) useEditor.getState().removePhoto(p.id);
  };

  const pick = (files: File[]) => void uploadFiles(files, { autoPlace: autofillOn });

  return (
    <div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { if (e.target.files?.length) pick([...e.target.files]); e.target.value = ''; }} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) pick([...e.dataTransfer.files]); }}
        className={`group relative flex w-full flex-col items-center gap-4 overflow-hidden rounded-[4px] border border-dashed px-6 text-center transition-[padding,background-color,border-color] duration-500 ${photos.length ? 'py-10' : 'py-16'} ${over ? 'border-accent bg-accent-soft' : 'border-line-strong bg-white hover:border-accent'}`}
      >
        <span aria-hidden className="ribbon absolute left-1/2 top-0 h-12 w-4 -translate-x-1/2 transition-[height] duration-500 group-hover:h-16" />
        <span className="relative mt-8 grid h-14 w-14 place-items-center rounded-full border border-line-strong text-accent transition duration-500 group-hover:border-accent">
          <ImagePlus size={24} strokeWidth={1.5} />
        </span>
        <span className="relative font-serif text-3xl">
          {photos.length ? (
            'Add more photos'
          ) : (
            <>
              <span className="hidden sm:inline">Drop your photos here</span>
              <span className="sm:hidden">Tap to choose your photos</span>
            </>
          )}
        </span>
        <span className="relative text-sm text-muted">
          <span className="hidden sm:inline">
            or <span className="font-medium text-accent">browse your files</span> ·{' '}
          </span>
          JPEG, PNG or WebP up to 40 MB · add more any time
        </span>
      </button>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-line px-1 py-4 text-sm">
        <p>
          <span className="font-medium">{photos.length}</span> {photos.length === 1 ? 'photo' : 'photos'} uploaded · your design has <span className="font-medium">{frames.frames}</span> photo frames
        </p>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={autofillOn} onChange={(e) => setAutofillOn(e.target.checked)} className="accent-accent" />
          Place my photos into the layouts automatically
        </label>
      </div>

      {uploads.length > 0 && (
        <ul className="mt-6 grid gap-2 sm:grid-cols-2" aria-live="polite">
          {uploads.map((u) => (
            <li key={u.id} className="rounded-[4px] border border-line bg-white px-4 py-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="truncate">{u.name}</span>
                <span className={u.status === 'error' ? 'text-danger' : 'text-muted'}>{u.status === 'error' ? 'Failed' : u.status === 'done' ? 'Placed' : `${Math.round(u.progress * 100)}%`}</span>
              </div>
              {u.status === 'error' ? <p className="mt-1 text-xs text-danger">{u.error}</p> : <div className="mt-2 h-px overflow-hidden bg-line"><div className="h-full bg-accent transition-all" style={{ width: `${u.progress * 100}%` }} /></div>}
            </li>
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <div className="mt-8 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-9">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-[2px] bg-paper-2">
              <img src={p.thumbUrl} alt={p.alt ?? ''} className="h-full w-full object-cover" loading="lazy" />
              <button type="button" onClick={() => remove(p)} aria-label={`Remove ${p.alt ?? 'photo'}`} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 opacity-0 shadow transition group-hover:opacity-100 focus:opacity-100">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <LivePreview doc={doc} photos={photos} />

      <div className="sticky bottom-0 z-10 -mx-5 mt-10 flex flex-col-reverse items-center justify-between gap-4 border-t border-line bg-paper/95 px-5 py-5 backdrop-blur sm:flex-row md:mx-0 md:px-0">
        <button type="button" onClick={next} className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline" disabled={busy}>
          {photos.length ? 'I’ll arrange them myself in the editor' : 'Skip for now — I’ll add photos in the editor'}
        </button>
        <button type="button" onClick={next} disabled={busy || uploading} className="btn btn-primary btn-lg w-full text-[0.75rem] uppercase tracking-[0.2em] sm:w-auto">
          {busy ? <Loader2 size={16} className="animate-spin" /> : null}
          {uploading ? 'Placing your photos…' : busy ? 'Opening the editor…' : 'Continue to editor'} {!busy && !uploading && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}

/**
 * The album as it fills: cover and every spread, re-rendered as each photo
 * lands in its frame, so the result is visible before opening the editor.
 */
function LivePreview({ doc, photos }: { doc: AlbumDocument; photos: PhotoAsset[] }) {
  const photoMap = useMemo<PhotoMap>(() => Object.fromEntries(photos.map((p) => [p.id, p])), [photos]);
  const spreads = useMemo(() => buildSpreads(doc.pages.length), [doc.pages.length]);
  let filled = 0;
  let total = 0;
  for (const { page } of allPages(doc)) {
    for (const el of page.elements) {
      if (el.type !== 'photo') continue;
      total++;
      if (el.photoId && photoMap[el.photoId]) filled++;
    }
  }
  return (
    <section className="mt-14">
      <div className="running-head">
        <span>Your album, as it fills</span>
        <span>
          {filled} of {total} frames
        </span>
      </div>
      <div className="mt-3 h-px overflow-hidden bg-line">
        <div className="h-full bg-accent transition-[width] duration-700 ease-[var(--ease-soft)]" style={{ width: `${total ? (filled / total) * 100 : 0}%` }} />
      </div>
      <div className="live-fill mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2">
        <figure className="flex flex-col items-center justify-center sm:col-span-2">
          <BookCover page={doc.cover} size={doc.size} photos={photoMap} renderWidth={340} className="w-[min(17rem,62vw)]" />
          <figcaption className="smallcaps mt-5">Cover</figcaption>
        </figure>
        {spreads.map((s, i) => (
          <figure key={i}>
            <OpenBook left={s.left !== null ? doc.pages[s.left] : null} right={s.right !== null ? doc.pages[s.right] : null} size={doc.size} photos={photoMap} renderWidth={560} {...bookFinish(doc)} />
            <figcaption className="folio mt-4 text-center">
              {s.left !== null ? s.left + 1 : ''}
              {s.left !== null && s.right !== null ? ' — ' : ''}
              {s.right !== null ? s.right + 1 : ''}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
