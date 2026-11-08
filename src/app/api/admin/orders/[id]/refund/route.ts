import { requireAdminApi } from '@/lib/server/admin';
import { errorResponse, HttpError, json } from '@/lib/server/http';
import { applyPaymentResult } from '@/lib/server/orders';
import { getPaymentProvider } from '@/lib/server/payments';
import { addEvent, getOrder } from '@/lib/server/repo/orders';
import { sql } from '@/lib/server/db';

/** Issues a full refund through the payment provider and revokes access. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi();
    const { id } = await ctx.params;
    const order = await getOrder(id);
    if (!order) throw new HttpError(404, 'Order not found.');
    if (order.status !== 'paid') throw new HttpError(409, 'Only paid orders can be refunded.');
    const provider = getPaymentProvider(order.provider);
    if (!provider) throw new HttpError(503, 'Payment provider is not configured.');
    await provider.refund(order);
    await applyPaymentResult(order.id, 'refunded');
    await sql('update shares set enabled = false, updated_at = now() where order_id = $1', [order.id]);
    await addEvent(order.id, 'refund_requested', { by: admin.email });
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
