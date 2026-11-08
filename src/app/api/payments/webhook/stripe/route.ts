import { applyPaymentResult } from '@/lib/server/orders';
import { getPaymentProvider } from '@/lib/server/payments';
import { claimWebhookEvent, getOrder } from '@/lib/server/repo/orders';
import { sqlOne } from '@/lib/server/db';

export async function POST(req: Request) {
  const provider = getPaymentProvider('stripe');
  if (!provider?.parseWebhook) return new Response('Stripe is not configured', { status: 503 });
  let event;
  try {
    event = await provider.parseWebhook(req);
  } catch (e) {
    console.error('[stripe] invalid webhook', e);
    return new Response('Invalid signature', { status: 400 });
  }
  if (event.type === 'ignored') return new Response('ok');
  if (!(await claimWebhookEvent('stripe', event.id))) return new Response('duplicate');
  let orderId = event.orderId;
  if (!orderId && event.paymentIntentId) {
    orderId = (await sqlOne<{ id: string }>('select id from orders where provider_payment_id = $1', [event.paymentIntentId]))?.id ?? null;
  }
  if (!orderId || !(await getOrder(orderId))) return new Response('unknown order');
  if (event.type === 'paid') {
    // Re-verify with Stripe (and fetch the receipt) rather than trusting the payload alone.
    const order = (await getOrder(orderId))!;
    const status = await provider.getStatus(order).catch(() => null);
    if (status?.status === 'paid') await applyPaymentResult(orderId, 'paid', { paymentId: status.paymentId ?? event.paymentIntentId, receiptUrl: status.receiptUrl });
  } else {
    await applyPaymentResult(orderId, event.type);
  }
  return new Response('ok');
}
