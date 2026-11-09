import 'server-only';
import crypto from 'node:crypto';
import type { OrderItemInput } from '@/lib/commerce/pricing';
import type { OrderRow } from '../repo/orders';
import { getSetting, setSetting } from '../repo/settings';
import type { PaymentEvent, PaymentProvider } from './index';

/**
 * Creem (merchant of record). Creem prices a checkout from a product, so we
 * keep one one-time product per combination of formats and currency (created
 * on first use and remembered), and charge the exact server-computed total
 * with `custom_price`. Prices are tax-inclusive: the customer pays what we show.
 *
 * Env: CREEM_API_KEY (required), CREEM_WEBHOOK_SECRET (for webhooks),
 * CREEM_TEST_MODE=true to force the test API (also inferred from a test key),
 * CREEM_API_BASE to point at another API host (local testing).
 */

/** Currencies Creem can charge in. */
export const CREEM_CURRENCIES = ['USD', 'EUR'] as const;

type CreemOrder = { id: string; status?: string; transaction?: string | null; amount?: number; currency?: string };
type CreemCheckout = {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'expired' | string;
  request_id?: string;
  checkout_url?: string;
  order?: CreemOrder;
  metadata?: Record<string, unknown>;
};

const ITEM_NAMES: Partial<Record<OrderItemInput['kind'], string>> = {
  album: 'Everything included',
  digital_pdf: 'Digital PDF',
  digital_share: 'Private album link',
  print: 'Printed photobook',
};

/** The product an order is sold as, e.g. "Fullstory album · Digital PDF + Private album link". */
function productSpec(order: OrderRow) {
  const kinds = [...new Set(order.items.map((i) => i.kind))].sort();
  const formats = kinds.map((k) => ITEM_NAMES[k]).filter(Boolean) as string[];
  const premium = kinds.includes('premium_template');
  const name = `Fullstory album · ${formats.join(' + ')}${premium ? ' (Premium design)' : ''}`;
  const description = [
    kinds.includes('album')
      ? 'Your photo album on fullstory.pro with everything included: unlimited pages and layouts, your own music, page-turn animations, a private share link with QR code, and a high-resolution PDF.'
      : 'Your finished photo album from fullstory.pro.',
    kinds.includes('digital_pdf') ? 'Digital PDF: a high-resolution PDF of your album to download and keep.' : '',
    kinds.includes('digital_share') ? 'Private album link: a private, page-turning online album with a QR code.' : '',
    premium ? 'Includes the Premium design fee.' : '',
    'Delivered instantly after payment.',
  ]
    .filter(Boolean)
    .join(' ');
  return { key: kinds.join('+'), name, description };
}

export class CreemProvider implements PaymentProvider {
  id = 'creem' as const;
  label = 'Creem';
  isTest: boolean;
  private base: string;

  constructor(private apiKey: string) {
    this.isTest = process.env.CREEM_TEST_MODE === 'true' || apiKey.startsWith('creem_test_');
    this.base = process.env.CREEM_API_BASE || (this.isTest ? 'https://test-api.creem.io' : 'https://api.creem.io');
  }

  private async api<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      method,
      headers: { 'x-api-key': this.apiKey, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) {
      const msg = typeof data === 'object' && data && 'message' in data ? String((data as { message: unknown }).message) : text.slice(0, 300);
      throw new Error(`Creem ${method} ${path} failed (${res.status}): ${msg}`);
    }
    return data as T;
  }

  /** The Creem product for this order's formats and currency; created once, then reused. */
  private async productFor(order: OrderRow): Promise<string> {
    const spec = productSpec(order);
    const settingKey = `creem:${this.isTest ? 'test' : 'live'}:product:${order.currency}:${spec.key}`;
    const known = await getSetting(settingKey);
    if (known) return known;
    const product = await this.api<{ id: string }>('POST', '/v1/products', {
      name: spec.name,
      description: spec.description,
      price: Math.max(100, order.amount_total),
      currency: order.currency,
      billing_type: 'onetime',
      tax_mode: 'inclusive',
      tax_category: 'digital-goods-service',
    });
    await setSetting(settingKey, product.id);
    return product.id;
  }

  async createCheckout(order: OrderRow, { successUrl, email }: { successUrl: string; cancelUrl: string; email: string | null }) {
    if (!(CREEM_CURRENCIES as readonly string[]).includes(order.currency)) throw new Error(`Creem can't charge in ${order.currency}`);
    if (order.amount_total < 100) throw new Error('Order total is below the minimum charge');
    const productId = await this.productFor(order);
    const checkout = await this.api<CreemCheckout>('POST', '/v1/checkouts', {
      product_id: productId,
      request_id: order.id,
      units: 1,
      custom_price: order.amount_total,
      ...(email ? { customer: { email } } : {}),
      success_url: successUrl,
      metadata: { orderId: order.id, orderNumber: order.number },
    });
    if (!checkout.checkout_url) throw new Error('Creem did not return a checkout URL');
    return { url: checkout.checkout_url, sessionId: checkout.id };
  }

  /** Health check: is the API key accepted? (Looks up a checkout that doesn't exist.) */
  async ping(): Promise<'ok' | 'unauthorized' | 'unreachable'> {
    try {
      const res = await fetch(`${this.base}/v1/checkouts?checkout_id=health_check`, { headers: { 'x-api-key': this.apiKey }, cache: 'no-store' });
      return res.status === 401 || res.status === 403 ? 'unauthorized' : 'ok';
    } catch {
      return 'unreachable';
    }
  }

  async getStatus(order: OrderRow) {
    if (!order.provider_session_id) return { status: 'pending' as const };
    const c = await this.api<CreemCheckout>('GET', `/v1/checkouts?checkout_id=${encodeURIComponent(order.provider_session_id)}`);
    const belongs = !c.request_id || c.request_id === order.id;
    if (belongs && c.status === 'completed' && (!c.order || c.order.status === 'paid')) {
      // The charge must match what we priced; anything else needs a human look.
      if (c.order?.currency && c.order.currency.toUpperCase() !== order.currency) {
        console.error('[creem] currency mismatch', order.id, c.order.currency, order.currency);
        return { status: 'pending' as const };
      }
      return { status: 'paid' as const, paymentId: c.order?.transaction ?? null, receiptUrl: null };
    }
    if (c.status === 'expired') return { status: 'failed' as const };
    return { status: 'pending' as const };
  }

  async refund(order: OrderRow) {
    if (!order.provider_payment_id) throw new Error('No Creem transaction recorded for this order — refund it from the Creem dashboard.');
    await this.api('POST', '/v1/refunds', { transaction_id: order.provider_payment_id });
  }

  async parseWebhook(req: Request): Promise<PaymentEvent> {
    const secret = process.env.CREEM_WEBHOOK_SECRET;
    if (!secret) throw new Error('CREEM_WEBHOOK_SECRET is not set');
    const body = await req.text();
    verifyCreemSignature(body, req.headers, secret);
    const event = JSON.parse(body) as { id: string; eventType?: string; type?: string; object?: Record<string, unknown>; data?: Record<string, unknown> };
    const type = event.eventType ?? event.type;
    const obj = (event.object ?? event.data ?? {}) as Record<string, unknown>;
    const base = { id: String(event.id) };
    switch (type) {
      case 'checkout.completed': {
        const c = obj as unknown as CreemCheckout;
        const orderId = (typeof c.metadata?.orderId === 'string' ? c.metadata.orderId : null) ?? c.request_id ?? null;
        return { ...base, orderId, sessionId: c.id, paymentIntentId: c.order?.transaction ?? null, type: 'paid' };
      }
      case 'refund.created': {
        const checkout = typeof obj.checkout === 'object' && obj.checkout ? (obj.checkout as CreemCheckout) : null;
        const tx = typeof obj.transaction === 'object' && obj.transaction ? (obj.transaction as { id?: string; amount?: number }) : null;
        const orderId = (typeof checkout?.metadata?.orderId === 'string' ? checkout.metadata.orderId : null) ?? checkout?.request_id ?? null;
        const refunded = Number(obj.refund_amount ?? 0);
        const full = tx?.amount ? refunded >= tx.amount : true;
        return { ...base, orderId, sessionId: checkout?.id ?? (typeof obj.checkout === 'string' ? obj.checkout : null), paymentIntentId: tx?.id ?? null, type: full ? 'refunded' : 'ignored' };
      }
      case 'dispute.created':
        console.warn('[creem] dispute opened', event.id);
        return { ...base, orderId: null, type: 'ignored' };
      default:
        return { ...base, orderId: null, type: 'ignored' };
    }
  }
}

class WebhookSignatureError extends Error {}

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/**
 * Accepts both signature schemes Creem uses: Standard Webhooks
 * (webhook-id / webhook-timestamp / webhook-signature, base64 HMAC of
 * "id.timestamp.body" with a whsec_ secret) and the original `creem-signature`
 * (hex HMAC-SHA256 of the raw body).
 */
export function verifyCreemSignature(body: string, headers: Headers, secret: string, toleranceSeconds = 300) {
  const id = headers.get('webhook-id');
  const ts = headers.get('webhook-timestamp');
  const sigs = headers.get('webhook-signature');
  if (id && ts && sigs) {
    const t = Number.parseInt(ts, 10);
    if (!Number.isFinite(t) || Math.abs(Date.now() / 1000 - t) > toleranceSeconds) throw new WebhookSignatureError('Webhook timestamp out of range');
    const key = Buffer.from(secret.startsWith('whsec_') ? secret.slice(6) : secret, 'base64');
    const expected = crypto.createHmac('sha256', key).update(`${id}.${t}.${body}`).digest('base64');
    if (sigs.split(' ').some((v) => { const [ver, sig] = v.split(','); return ver === 'v1' && !!sig && safeEqual(sig, expected); })) return;
    throw new WebhookSignatureError('Invalid webhook signature');
  }
  const legacy = headers.get('creem-signature') ?? headers.get('x-creem-signature');
  if (!legacy) throw new WebhookSignatureError('Missing webhook signature');
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const given = legacy.trim().replace(/^sha256=/, '').toLowerCase();
  if (!safeEqual(given, expected)) throw new WebhookSignatureError('Invalid webhook signature');
}
