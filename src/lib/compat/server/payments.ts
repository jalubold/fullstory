import 'server-only';
import crypto from 'node:crypto';
import { sql, sqlOne, transaction } from '@/lib/server/db';
import { appUrl } from '@/lib/server/env';
import { HttpError } from '@/lib/server/http';
import { getPaymentProvider, type CheckoutOrder, type PaymentEvent, type PaymentProvider } from '@/lib/server/payments';
import { BLUEPRINT_PRICES, BLUEPRINT_PRODUCT, blueprintCurrency, formatPrice, type CompatCurrency } from '../pricing';
import type { Locale } from '../i18n';
import { UI } from '../ui-strings';
import type { ParticipantView } from './view';

/**
 * One-time payment for the Relationship Blueprint. Uses the site's payment
 * provider (Creem, Stripe or the dev-only test provider). A payment is only
 * trusted after the provider confirms it server-side — on return from
 * checkout or via a verified webhook — and it unlocks the assessment, i.e.
 * the report for BOTH participants.
 */

export interface CompatOrderRow {
  id: string;
  number: string;
  assessment_id: string | null;
  buyer_role: 'a' | 'b' | null;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  currency: string;
  amount_total: number;
  provider: string;
  provider_session_id: string | null;
  provider_payment_id: string | null;
  receipt_url: string | null;
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const orderNumber = () => 'AWC-' + Array.from(crypto.randomBytes(7), (b) => ALPHABET[b % ALPHABET.length]).join('');

export function asCheckoutOrder(o: CompatOrderRow): CheckoutOrder {
  return {
    ...o,
    amount_shipping: 0,
    lines: [{ label: BLUEPRINT_PRODUCT.name, detail: 'One payment · unlocked for both of you', quantity: 1, unitAmount: o.amount_total }],
    items: [{ kind: 'compat_blueprint' }],
    product: BLUEPRINT_PRODUCT,
  };
}

/** The price this visitor would pay (for display). */
export function blueprintPrice(country: string | null): { amount: number; currency: CompatCurrency; label: string } {
  const provider = getPaymentProvider();
  const currency = blueprintCurrency(country, provider?.currencies ?? null);
  const amount = BLUEPRINT_PRICES[currency];
  return { amount, currency, label: formatPrice(amount, currency) };
}

export async function getCompatOrder(id: string): Promise<CompatOrderRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return sqlOne<CompatOrderRow>('select * from compat_orders where id = $1', [id]);
}

export async function startCheckout(view: ParticipantView, country: string | null, locale: Locale = 'en'): Promise<{ url: string } | { unlocked: true }> {
  if (view.unlocked) return { unlocked: true };
  if (view.stage !== 'results') throw new HttpError(409, UI[locale].errors.notFinished);
  const provider = getPaymentProvider();
  if (!provider) throw new HttpError(503, UI[locale].errors.paymentsUnavailable);
  const currency = blueprintCurrency(country, provider.currencies);
  const [order] = await sql<CompatOrderRow>(
    `insert into compat_orders (id, number, assessment_id, buyer_role, currency, amount_total, provider) values ($1, $2, $3, $4, $5, $6, $7) returning *`,
    [crypto.randomUUID(), orderNumber(), view.assessmentId, view.role, currency, BLUEPRINT_PRICES[currency], provider.id],
  );
  const base = appUrl();
  // The return page finds the buyer's private link from this browser's cookie,
  // so private links are never handed to the payment provider.
  const landing = `${base}/compatible/return/${order.id}`;
  let session: { url: string; sessionId: string };
  if (provider.id === 'test') {
    const sessionId = `test_${crypto.randomBytes(12).toString('hex')}`;
    session = { url: `/compatible/s/${view.token}/test-checkout?order=${order.id}&session=${sessionId}`, sessionId };
  } else {
    session = await provider.createCheckout(asCheckoutOrder(order), {
      successUrl: provider.id === 'stripe' ? `${landing}?session_id={CHECKOUT_SESSION_ID}` : landing,
      cancelUrl: `${base}/compatible/return/${order.id}?cancelled=1`,
      email: null,
    });
  }
  await sql('update compat_orders set provider_session_id = $2, updated_at = now() where id = $1', [order.id, session.sessionId]);
  return { url: session.url };
}

type Result = 'paid' | 'failed' | 'cancelled' | 'refunded';

/** Idempotent, forward-only payment transitions; a paid order unlocks its assessment. */
export async function applyCompatPayment(orderId: string, result: Result, info: { paymentId?: string | null; receiptUrl?: string | null } = {}): Promise<CompatOrderRow | null> {
  return transaction(async (q) => {
    const from = result === 'refunded' ? ['paid'] : ['pending'];
    const [order] = await q<CompatOrderRow>(
      `update compat_orders set status = $2, updated_at = now(),
         provider_payment_id = coalesce($4, provider_payment_id), receipt_url = coalesce($5, receipt_url),
         paid_at = case when $2 = 'paid' then now() else paid_at end,
         refunded_at = case when $2 = 'refunded' then now() else refunded_at end
       where id = $1 and status = any($3::text[]) returning *`,
      [orderId, result, from, info.paymentId ?? null, info.receiptUrl ?? null],
    );
    if (!order) return (await q<CompatOrderRow>('select * from compat_orders where id = $1', [orderId]))[0] ?? null;
    if (order.assessment_id && result === 'paid') {
      await q('update compat_assessments set unlocked_at = coalesce(unlocked_at, now()), unlock_order_id = coalesce(unlock_order_id, $2), updated_at = now() where id = $1', [order.assessment_id, order.id]);
    }
    if (order.assessment_id && result === 'refunded') {
      await q('update compat_assessments set unlocked_at = null, unlock_order_id = null, updated_at = now() where id = $1 and unlock_order_id = $2', [order.assessment_id, order.id]);
    }
    if (result === 'paid') void trackPurchase(order);
    return order;
  });
}

async function trackPurchase(order: CompatOrderRow) {
  try {
    const { track } = await import('@vercel/analytics/server');
    await track('compat_purchase', { currency: order.currency, provider: order.provider });
  } catch {
    // Analytics is best-effort and only reports on Vercel.
  }
}

/** Reconciles a pending order with the provider (used when the buyer returns before the webhook). */
export async function syncCompatOrder(order: CompatOrderRow): Promise<CompatOrderRow> {
  if (order.status !== 'pending' || order.provider === 'test') return order;
  const provider = getPaymentProvider(order.provider);
  if (!provider) return order;
  try {
    const s = await provider.getStatus(asCheckoutOrder(order));
    if (s.status === 'paid') return (await applyCompatPayment(order.id, 'paid', { paymentId: s.paymentId, receiptUrl: s.receiptUrl })) ?? order;
    if (s.status === 'failed') return (await applyCompatPayment(order.id, 'failed')) ?? order;
  } catch (e) {
    console.error('[compat] order sync failed', e);
  }
  return order;
}

/**
 * Webhook events for compat orders arrive on the shared provider endpoints.
 * Returns false when the event doesn't belong to a compat order.
 */
export async function handleCompatPaymentEvent(providerId: string, provider: PaymentProvider, event: PaymentEvent): Promise<boolean> {
  let order = event.orderId ? await getCompatOrder(event.orderId) : null;
  if (!order && event.sessionId) order = await sqlOne<CompatOrderRow>('select * from compat_orders where provider_session_id = $1', [event.sessionId]);
  if (!order && event.paymentIntentId) order = await sqlOne<CompatOrderRow>('select * from compat_orders where provider_payment_id = $1', [event.paymentIntentId]);
  if (!order || order.provider !== providerId) return false;
  if (event.type === 'paid') {
    // Re-verify with the provider rather than trusting the payload alone.
    const status = await provider.getStatus(asCheckoutOrder(order)).catch(() => null);
    if (status?.status === 'paid') await applyCompatPayment(order.id, 'paid', { paymentId: status.paymentId ?? event.paymentIntentId, receiptUrl: status.receiptUrl });
  } else if (event.type !== 'ignored') {
    await applyCompatPayment(order.id, event.type);
  }
  return true;
}
