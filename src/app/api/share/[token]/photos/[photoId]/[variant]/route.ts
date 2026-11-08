import { errorResponse } from '@/lib/server/http';
import { getShareByToken } from '@/lib/server/repo/orders';
import { servePhoto } from '@/lib/server/serve-photo';
import { shareAccess } from '@/lib/server/shares';

/** Photos for a shared album: only those in the shared order’s snapshot, only while the link is valid. */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string; photoId: string; variant: string }> }) {
  try {
    const { token, photoId, variant } = await ctx.params;
    if (variant !== 'display' && variant !== 'thumb') return new Response('Not found', { status: 404 });
    const access = await shareAccess(await getShareByToken(token));
    if (access.state !== 'ok') return new Response('Not available', { status: 403 });
    const m = access.order.photo_manifest?.[photoId];
    if (!m) return new Response('Not found', { status: 404 });
    return servePhoto({ storage_prefix: m.storage_prefix, original_ext: m.original_ext, content_type: 'image/jpeg' } as never, variant);
  } catch (e) {
    return errorResponse(e);
  }
}
