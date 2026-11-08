import { requireAdminApi } from '@/lib/server/admin';
import { ensureExport, serveExport } from '@/lib/server/exports';
import { errorResponse, HttpError } from '@/lib/server/http';
import { getOrder, hasItem, type ExportKind } from '@/lib/server/repo/orders';

export const maxDuration = 300;

/** Print-ready files for fulfilment (admins only, paid print orders only). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminApi();
    const { id } = await ctx.params;
    const kind = new URL(req.url).searchParams.get('kind') as ExportKind;
    if (!['print-interior', 'print-cover', 'digital'].includes(kind)) throw new HttpError(400, 'Unknown file.');
    const order = await getOrder(id);
    if (!order) throw new HttpError(404, 'Order not found.');
    if (order.status !== 'paid') throw new HttpError(402, 'Order is not paid.');
    if (kind !== 'digital' && !hasItem(order, 'print')) throw new HttpError(400, 'Not a print order.');
    const key = await ensureExport(order, kind);
    return serveExport(order, kind, key);
  } catch (e) {
    return errorResponse(e);
  }
}
