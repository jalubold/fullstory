import { ensureExport, serveExport } from '@/lib/server/exports';
import { errorResponse, HttpError } from '@/lib/server/http';
import { getShareByToken, hasItem } from '@/lib/server/repo/orders';
import { shareAccess } from '@/lib/server/shares';

export const maxDuration = 300;

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const share = await getShareByToken(token);
    const access = await shareAccess(share);
    if (access.state !== 'ok' || !share?.allow_download) throw new HttpError(403, 'Downloads aren’t enabled for this album.');
    if (!hasItem(access.order, 'digital_pdf')) throw new HttpError(403, 'No PDF is available for this album.');
    const key = await ensureExport(access.order, 'digital');
    return serveExport(access.order, 'digital', key);
  } catch (e) {
    return errorResponse(e);
  }
}
