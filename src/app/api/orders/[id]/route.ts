import { authed, HttpError, json } from '@/lib/server/http';
import { syncOrder } from '@/lib/server/orders';
import { getOwnedOrder } from '@/lib/server/repo/orders';

/** Order status for polling; reconciles with the payment provider while pending. */
export const GET = authed<{ id: string }>(async (_req, { params, user }) => {
  let order = await getOwnedOrder(user.id, params.id);
  if (!order) throw new HttpError(404, 'Order not found.');
  order = await syncOrder(order);
  return json({ id: order.id, status: order.status, fulfillmentStatus: order.fulfillment_status });
});
