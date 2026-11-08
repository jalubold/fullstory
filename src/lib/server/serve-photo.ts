import 'server-only';
import { variantContentType, variantKey, type PhotoRow, type PhotoVariant } from './repo/photos';
import { storage } from './storage';

/** Streams a stored photo variant, or redirects to a short-lived signed URL. */
export async function servePhoto(photo: PhotoRow, variant: PhotoVariant): Promise<Response> {
  const store = storage();
  const key = variantKey(photo, variant);
  const signed = await store.signedUrl(key, 3600);
  if (signed) {
    return new Response(null, { status: 302, headers: { Location: signed, 'Cache-Control': 'private, max-age=3000' } });
  }
  const data = await store.get(key);
  if (!data) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': variantContentType(photo, variant),
      'Cache-Control': 'private, max-age=31536000, immutable',
      'Content-Length': String(data.length),
    },
  });
}
