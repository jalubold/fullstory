'use client';

import { pool, uploadPhoto, validateFile } from '@/lib/client/upload';
import { useEditor } from './store';

let seq = 0;

/** Uploads files into the current project's photo library (shared by the upload step and the editor). */
export async function uploadFiles(files: File[]) {
  const st = useEditor.getState;
  const projectId = st().projectId;
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
      update({ status: 'done', progress: 1 });
      ok++;
    } catch (e) {
      update({ status: 'error', error: e instanceof Error ? e.message : 'Upload failed' });
    }
  });
  if (ok) st().toast(`${ok} ${ok === 1 ? 'photo' : 'photos'} uploaded`, 'success');
  const failed = files.length - ok;
  if (failed) st().toast(`${failed} ${failed === 1 ? 'photo' : 'photos'} couldn’t be uploaded`, 'error');
  setTimeout(() => st().setUploads((u) => u.filter((x) => x.status !== 'done')), 2500);
}
