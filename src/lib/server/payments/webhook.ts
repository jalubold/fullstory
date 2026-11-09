import 'server-only';
import { sqlOne } from '../db';
import { applyPaymentResult } from '../orders';
import { claimWebhookEvent, getOrder } from '../repo/orders';
import { getPaymentProvider } from './index';

/**
 * Shared webhook handling: verify the signature, ignore duplicates, find the
 * order, and re-check payments with the provider before marking them paid.
 */
export async function handlePaymentWebhook(providerId: 'creem' | 'stripe', req: Request): Promise<Response> {
  const provider = getPaymentProvider(providerId);
  if (!provider?.parseWebhook) return new Response(`${providerId} is not configured`, { status: 503 });
  let event;
  try {
    event = await provider.parseWebhook(req);
  } catch (e) {
    console.error(`[${providerId}] invalid webhook`, e);
    return new Response('Invalid signature', { status: 400 });
  }
  if (event.type === 'ignored') return new Response('ok');
  if (!(await claimWebhookEvent(providerId, event.id))) return new Response('duplicate');
  let orderId = event.orderId;
  if (!orderId && event.sessionId) orderId = (await sqlOne<{ id: string }>('select id from orders where provider_session_id = $1', [event.sessionId]))?.id ?? null;
  if (!orderId && event.paymentIntentId) orderId = (await sqlOne<{ id: string }>('select id from orders where provider_payment_id = $1', [event.paymentIntentId]))?.id ?? null;
  const order = orderId ? await getOrder(orderId) : null;
  if (!order || order.provider !== providerId) return new Response('unknown order');
  if (event.type === 'paid') {
    // Re-verify with the provider rather than trusting the payload alone.
    const status = await provider.getStatus(order).catch(() => null);
    if (status?.status === 'paid') await applyPaymentResult(order.id, 'paid', { paymentId: status.paymentId ?? event.paymentIntentId, receiptUrl: status.receiptUrl });
  } else {
    await applyPaymentResult(order.id, event.type);
  }
  return new Response('ok');
}
