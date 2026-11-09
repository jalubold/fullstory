import 'server-only';
import crypto from 'node:crypto';
import Stripe from 'stripe';
import { isProduction } from '../env';
import type { OrderRow } from '../repo/orders';
import { CreemProvider } from './creem';

export type ProviderStatus = 'paid' | 'pending' | 'failed';

export interface PaymentEvent {
  id: string;
  orderId: string | null;
  sessionId?: string | null;
  paymentIntentId?: string | null;
  type: 'paid' | 'failed' | 'cancelled' | 'refunded' | 'ignored';
}

export interface PaymentProvider {
  id: 'creem' | 'stripe' | 'test';
  label: string;
  /** Test providers never move real money; the UI labels them clearly. */
  isTest: boolean;
  createCheckout(order: OrderRow, opts: { successUrl: string; cancelUrl: string; email: string | null }): Promise<{ url: string; sessionId: string }>;
  /** Server-side verification of a checkout session's payment state. */
  getStatus(order: OrderRow): Promise<{ status: ProviderStatus; paymentId?: string | null; receiptUrl?: string | null }>;
  refund(order: OrderRow): Promise<void>;
  parseWebhook?(req: Request): Promise<PaymentEvent>;
}

/* ---------------------------------- Stripe --------------------------------- */

class StripeProvider implements PaymentProvider {
  id = 'stripe' as const;
  label = 'Stripe';
  isTest: boolean;
  private stripe: Stripe;
  constructor(secret: string) {
    this.stripe = new Stripe(secret);
    this.isTest = secret.startsWith('sk_test_');
  }

  async createCheckout(order: OrderRow, { successUrl, cancelUrl, email }: { successUrl: string; cancelUrl: string; email: string | null }) {
    const currency = order.currency.toLowerCase();
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      ...(email ? { customer_email: email } : {}),
      client_reference_id: order.id,
      metadata: { orderId: order.id, orderNumber: order.number },
      payment_intent_data: { metadata: { orderId: order.id, orderNumber: order.number } },
      line_items: order.lines.map((l) => ({
        quantity: l.quantity,
        price_data: { currency, unit_amount: l.unitAmount, product_data: { name: l.label, ...(l.detail ? { description: l.detail } : {}) } },
      })),
      ...(order.amount_shipping > 0
        ? {
            shipping_options: [
              { shipping_rate_data: { type: 'fixed_amount', display_name: 'Shipping', fixed_amount: { amount: order.amount_shipping, currency } } },
            ],
          }
        : {}),
      ...(process.env.STRIPE_AUTOMATIC_TAX === 'true' ? { automatic_tax: { enabled: true } } : {}),
      success_url: successUrl,
      cancel_url: cancelUrl,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 6,
    });
    if (!session.url) throw new Error('Stripe did not return a checkout URL');
    return { url: session.url, sessionId: session.id };
  }

  async getStatus(order: OrderRow) {
    if (!order.provider_session_id) return { status: 'pending' as const };
    const s = await this.stripe.checkout.sessions.retrieve(order.provider_session_id, { expand: ['payment_intent.latest_charge'] });
    const pi = typeof s.payment_intent === 'object' ? s.payment_intent : null;
    const charge = pi && typeof pi.latest_charge === 'object' ? pi.latest_charge : null;
    if (s.payment_status === 'paid' || s.payment_status === 'no_payment_required') {
      return { status: 'paid' as const, paymentId: pi?.id ?? (s.payment_intent as string | null), receiptUrl: charge?.receipt_url ?? null };
    }
    if (s.status === 'expired') return { status: 'failed' as const };
    return { status: 'pending' as const };
  }

  async refund(order: OrderRow) {
    if (!order.provider_payment_id) throw new Error('No payment to refund');
    await this.stripe.refunds.create({ payment_intent: order.provider_payment_id, metadata: { orderId: order.id } });
  }

  async parseWebhook(req: Request): Promise<PaymentEvent> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    const body = await req.text();
    const sig = req.headers.get('stripe-signature') ?? '';
    const event = this.stripe.webhooks.constructEvent(body, sig, secret);
    const base = { id: event.id };
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const s = event.data.object;
        const paid = s.payment_status === 'paid' || s.payment_status === 'no_payment_required';
        return { ...base, orderId: s.metadata?.orderId ?? s.client_reference_id, sessionId: s.id, paymentIntentId: s.payment_intent as string | null, type: paid ? 'paid' : 'ignored' };
      }
      case 'checkout.session.async_payment_failed': {
        const s = event.data.object;
        return { ...base, orderId: s.metadata?.orderId ?? s.client_reference_id, sessionId: s.id, type: 'failed' };
      }
      case 'checkout.session.expired': {
        const s = event.data.object;
        return { ...base, orderId: s.metadata?.orderId ?? s.client_reference_id, sessionId: s.id, type: 'cancelled' };
      }
      case 'charge.refunded': {
        const c = event.data.object;
        const fully = c.amount_refunded >= c.amount;
        return { ...base, orderId: c.metadata?.orderId ?? null, paymentIntentId: c.payment_intent as string | null, type: fully ? 'refunded' : 'ignored' };
      }
      default:
        return { ...base, orderId: null, type: 'ignored' };
    }
  }
}

/* ------------------------------- Test provider ------------------------------ */

/**
 * Development-only provider. Redirects to an on-site page that clearly says no
 * real payment happens, where the developer chooses success or failure. It is
 * disabled in production unless ALLOW_TEST_PAYMENTS=true is set explicitly.
 */
class TestProvider implements PaymentProvider {
  id = 'test' as const;
  label = 'Test payments';
  isTest = true;
  async createCheckout(order: OrderRow) {
    const sessionId = `test_${crypto.randomBytes(12).toString('hex')}`;
    return { url: `/checkout/test/${order.id}?session=${sessionId}`, sessionId };
  }
  async getStatus(order: OrderRow) {
    return { status: order.status === 'paid' ? ('paid' as const) : order.status === 'failed' ? ('failed' as const) : ('pending' as const) };
  }
  async refund() {}
}

export function testPaymentsAllowed() {
  return !isProduction || process.env.ALLOW_TEST_PAYMENTS === 'true';
}

export function getPaymentProvider(name?: string): PaymentProvider | null {
  const preferred = name ?? process.env.PAYMENT_PROVIDER ?? (process.env.CREEM_API_KEY ? 'creem' : process.env.STRIPE_SECRET_KEY ? 'stripe' : 'test');
  if (preferred === 'creem' && process.env.CREEM_API_KEY) return new CreemProvider(process.env.CREEM_API_KEY);
  if (preferred === 'stripe' && process.env.STRIPE_SECRET_KEY) return new StripeProvider(process.env.STRIPE_SECRET_KEY);
  if (preferred === 'test' && testPaymentsAllowed()) return new TestProvider();
  return null;
}
