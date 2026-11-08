import { getPhoto, markPhotoReady, photoAsset, variantKey } from '@/lib/server/repo/photos';
import { authed, HttpError, json } from '@/lib/server/http';
import { after } from 'next/server';
import { isHeicExt, printableOriginal } from '@/lib/server/heic';
import { storage } from '@/lib/server/storage';

export const POST = authed<{ id: string }>(async (_req, { params, user }) => {
  const photo = await getPhoto(params.id);
  if (!photo || photo.user_id !== user.id) throw new HttpError(404, 'Photo not found.');
  const store = storage();
  const present = await Promise.all((['original', 'display', 'thumb'] as const).map((v) => store.exists(variantKey(photo, v))));
  if (present.some((p) => !p)) throw new HttpError(409, 'Upload incomplete — please try again.');
  await markPhotoReady(photo.id);
  // HEIC from iPhones: make the JPEG for the PDF now, in the background, so ordering stays fast.
  if (isHeicExt(photo.original_ext)) after(() => printableOriginal(photo.storage_prefix, photo.original_ext).then(() => undefined, () => undefined));
  return json({ photo: photoAsset(photo) });
});
