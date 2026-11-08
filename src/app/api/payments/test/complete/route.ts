import { z } from 'zod';
import { authed, HttpError, json, readJson } from '@/lib/server/http';
import { applyPaymentResult } from '@/lib/server/orders';
import { testPaymentsAllowed } from '@/lib/server/payments';
import { getOwnedOrder } from '@/lib/server/repo/orders';

const schema = z.object({ orderId: z.string().uuid(), session: z.string(), outcome: z.enum(['paid', 'failed']) });

/** Completes a TEST checkout. Only available when test payments are allowed and only for test orders. */
export const POST = authed(async (req, { user }) => {
  if (!testPaymentsAllowed()) throw new HttpError(403, 'Test payments are disabled.');
  const body = schema.parse(await readJson(req));
  const order = await getOwnedOrder(user.id, body.orderId);
  if (!order || order.provider !== 'test' || order.provider_session_id !== body.session) throw new HttpError(404, 'Test session not found.');
  const updated = await applyPaymentResult(order.id, body.outcome, { paymentId: body.outcome === 'paid' ? `test_pay_${order.number}` : null });
  return json({ status: updated?.status });
});
