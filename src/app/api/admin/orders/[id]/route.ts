import { z } from 'zod';
import { requireAdminApi } from '@/lib/server/admin';
import { errorResponse, HttpError, json, readJson } from '@/lib/server/http';
import { getOrder, updateFulfillment } from '@/lib/server/repo/orders';

const schema = z.object({
  status: z.enum(['processing', 'in_production', 'shipped', 'delivered', 'cancelled']).optional(),
  carrier: z.string().max(80).optional(),
  trackingNumber: z.string().max(120).optional(),
  trackingUrl: z.string().url().max(500).optional().or(z.literal('')),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminApi();
    const { id } = await ctx.params;
    const order = await getOrder(id);
    if (!order) throw new HttpError(404, 'Order not found.');
    if (order.status !== 'paid') throw new HttpError(409, 'Only paid orders can be fulfilled.');
    const body = schema.parse(await readJson(req));
    await updateFulfillment(id, { ...body, trackingUrl: body.trackingUrl || undefined });
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
