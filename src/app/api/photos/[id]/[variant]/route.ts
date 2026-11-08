import { getUser } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/http';
import { getPhoto, type PhotoVariant } from '@/lib/server/repo/photos';
import { servePhoto } from '@/lib/server/serve-photo';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string; variant: string }> }) {
  try {
    const { id, variant } = await ctx.params;
    if (!['display', 'thumb', 'original'].includes(variant)) return new Response('Not found', { status: 404 });
    const user = await getUser();
    if (!user) return new Response('Unauthorized', { status: 401 });
    const photo = /^[0-9a-f-]{36}$/i.test(id) ? await getPhoto(id) : null;
    if (!photo || photo.user_id !== user.id) return new Response('Not found', { status: 404 });
    return servePhoto(photo, variant as PhotoVariant);
  } catch (e) {
    return errorResponse(e);
  }
}
