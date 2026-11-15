import { z } from 'zod';
import { compatRoute, requireParticipant } from '@/lib/compat/server/http';
import { applyCompatPayment, getCompatOrder } from '@/lib/compat/server/payments';
import { HttpError, json, readJson } from '@/lib/server/http';
import { testPaymentsAllowed } from '@/lib/server/payments';

const schema = z.object({ orderId: z.string().uuid(), session: z.string().max(80), outcome: z.enum(['paid', 'failed']) });

/** Completes a TEST checkout. Only when test payments are allowed, and only for this participant's test order. */
export const POST = compatRoute<{ token: string }>(async (req, { token }) => {
  if (!testPaymentsAllowed()) throw new HttpError(403, 'Test payments are disabled.');
  const body = schema.parse(await readJson(req, 4096));
  const { view } = await requireParticipant(token);
  const order = await getCompatOrder(body.orderId);
  if (!order || order.provider !== 'test' || order.assessment_id !== view.assessmentId || order.provider_session_id !== body.session) throw new HttpError(404, 'Test session not found.');
  const updated = await applyCompatPayment(order.id, body.outcome, { paymentId: body.outcome === 'paid' ? `test_pay_${order.number}` : null });
  return json({ status: updated?.status });
});
