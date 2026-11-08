import { errorResponse, HttpError } from '@/lib/server/http';
import { getUser } from '@/lib/server/auth';
import { ensureExport, serveExport } from '@/lib/server/exports';
import { getOwnedOrder, hasItem } from '@/lib/server/repo/orders';

export const maxDuration = 300;

/** Digital PDF download — only for the owner of a PAID order that includes the PDF. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const user = await getUser();
    if (!user) throw new HttpError(401, 'Please log in to download.');
    const order = await getOwnedOrder(user.id, id);
    if (!order) throw new HttpError(404, 'Order not found.');
    if (order.status !== 'paid') throw new HttpError(402, 'This download is available once payment is confirmed.');
    if (!hasItem(order, 'digital_pdf')) throw new HttpError(403, 'This order doesn’t include a digital PDF.');
    const key = await ensureExport(order, 'digital');
    return serveExport(order, 'digital', key);
  } catch (e) {
    return errorResponse(e);
  }
}

/** Prepares the PDF without downloading (lets the UI show progress first). */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const user = await getUser();
    if (!user) throw new HttpError(401, 'Please log in.');
    const order = await getOwnedOrder(user.id, id);
    if (!order) throw new HttpError(404, 'Order not found.');
    if (order.status !== 'paid' || !hasItem(order, 'digital_pdf')) throw new HttpError(402, 'Not available.');
    await ensureExport(order, 'digital');
    return Response.json({ ready: true });
  } catch (e) {
    return errorResponse(e);
  }
}
