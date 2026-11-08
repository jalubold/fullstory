import { sqlOne } from '@/lib/server/db';
import { deletePhotoRow, getPhoto, variantKey } from '@/lib/server/repo/photos';
import { authed, HttpError, json } from '@/lib/server/http';
import { storage } from '@/lib/server/storage';

export const DELETE = authed<{ id: string }>(async (_req, { params, user }) => {
  const photo = await getPhoto(params.id);
  if (!photo || photo.user_id !== user.id) throw new HttpError(404, 'Photo not found.');
  await deletePhotoRow(photo.id);
  // Files can be shared by duplicated projects or referenced by order snapshots; only remove when unreferenced.
  const shared = await sqlOne('select 1 from photos where storage_prefix = $1 limit 1', [photo.storage_prefix]);
  const ordered = await sqlOne(`select 1 from orders where project_id = $1 and document_snapshot::text like $2 limit 1`, [photo.project_id, `%${photo.id}%`]);
  if (!shared && !ordered) {
    await storage().remove((['original', 'display', 'thumb'] as const).map((v) => variantKey(photo, v))).catch(() => {});
  }
  return json({ ok: true });
});
