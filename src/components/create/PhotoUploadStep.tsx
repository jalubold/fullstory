'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { countPhotoFrames } from '@/lib/album/geometry';
import { autofill } from '@/lib/album/ops';
import type { AlbumDocument, PhotoAsset } from '@/lib/album/types';
import { useEditor } from '@/components/editor/store';
import { useAutosave } from '@/components/editor/useAutosave';
import { uploadFiles } from '@/components/editor/uploads';

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
  const save = useAutosave();

  useEffect(() => {
    useEditor.getState().init({ projectId: props.projectId, title: props.title, status: props.status, doc: props.doc, version: props.version, photos: props.photos });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.projectId]);

  if (!ready) return <div className="h-96 skeleton rounded-3xl" />;
  const frames = countPhotoFrames(doc);
  const uploading = uploads.some((u) => u.status === 'uploading' || u.status === 'queued');

  const next = async () => {
    setBusy(true);
    const s = useEditor.getState();
    if (autofillOn && s.photos.length) s.apply((d) => void autofill(d, s.photos));
    await save();
    router.push(`/projects/${props.projectId}/edit`);
  };

  const remove = async (p: PhotoAsset) => {
    const res = await fetch(`/api/photos/${p.id}`, { method: 'DELETE' });
    if (res.ok) useEditor.getState().removePhoto(p.id);
  };

  return (
    <div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { if (e.target.files?.length) void uploadFiles([...e.target.files]); e.target.value = ''; }} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) void uploadFiles([...e.dataTransfer.files]); }}
        className={`flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-dashed px-6 py-14 text-center transition ${over ? 'border-accent bg-accent-soft/50' : 'border-line-strong bg-white hover:border-accent'}`}
      >
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent-dark">
          <ImagePlus size={26} strokeWidth={1.5} />
        </span>
        <span className="font-serif text-2xl">Drag photos here, or click to choose</span>
        <span className="text-sm text-muted">JPEG, PNG or WebP · up to 40 MB each · you can add more later</span>
      </button>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-paper-2/70 px-5 py-4 text-sm">
        <p>
          <span className="font-medium">{photos.length}</span> {photos.length === 1 ? 'photo' : 'photos'} uploaded · your design has <span className="font-medium">{frames.frames}</span> photo frames
        </p>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={autofillOn} onChange={(e) => setAutofillOn(e.target.checked)} className="accent-[#25231f]" />
          Place my photos into the layouts automatically
        </label>
      </div>

      {uploads.length > 0 && (
        <ul className="mt-6 grid gap-2 sm:grid-cols-2" aria-live="polite">
          {uploads.map((u) => (
            <li key={u.id} className="rounded-xl border border-line bg-white px-4 py-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="truncate">{u.name}</span>
                <span className={u.status === 'error' ? 'text-danger' : 'text-muted'}>{u.status === 'error' ? 'Failed' : `${Math.round(u.progress * 100)}%`}</span>
              </div>
              {u.status === 'error' ? <p className="mt-1 text-xs text-danger">{u.error}</p> : <div className="mt-2 h-1 overflow-hidden rounded-full bg-paper-2"><div className="h-full bg-accent transition-all" style={{ width: `${u.progress * 100}%` }} /></div>}
            </li>
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-paper-2">
              <img src={p.thumbUrl} alt={p.alt ?? ''} className="h-full w-full object-cover" loading="lazy" />
              <button type="button" onClick={() => remove(p)} aria-label={`Remove ${p.alt}`} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 opacity-0 shadow transition group-hover:opacity-100 focus:opacity-100">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 flex flex-col-reverse items-center justify-between gap-4 border-t border-line pt-8 sm:flex-row">
        <button type="button" onClick={next} className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline" disabled={busy}>
          Skip for now — I’ll add photos in the editor
        </button>
        <button type="button" onClick={next} disabled={busy || uploading} className="btn btn-primary btn-lg">
          {busy ? <Loader2 size={16} className="animate-spin" /> : null}
          {uploading ? 'Uploading…' : 'Continue to editor'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
