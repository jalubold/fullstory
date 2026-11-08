import { getPhoto, MAX_DERIVATIVE_BYTES, MAX_ORIGINAL_BYTES, variantContentType, variantKey, type PhotoVariant } from '@/lib/server/repo/photos';
import { authed, HttpError, json } from '@/lib/server/http';
import { storage } from '@/lib/server/storage';

/** Upload sink for the local filesystem storage driver (development). */
export const PUT = authed<{ id: string; variant: string }>(async (req, { params, user }) => {
  const variant = params.variant as PhotoVariant;
  if (!['original', 'display', 'thumb'].includes(variant)) throw new HttpError(404, 'Unknown variant');
  const photo = await getPhoto(params.id);
  if (!photo || photo.user_id !== user.id) throw new HttpError(404, 'Photo not found.');
  const buf = Buffer.from(await req.arrayBuffer());
  const limit = variant === 'original' ? MAX_ORIGINAL_BYTES : MAX_DERIVATIVE_BYTES;
  if (!buf.length || buf.length > limit) throw new HttpError(413, 'File is too large.');
  await storage().put(variantKey(photo, variant), buf, variantContentType(photo, variant));
  return json({ ok: true });
});
