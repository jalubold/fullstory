import 'server-only';
import crypto from 'node:crypto';
import type { AlbumDocument } from '@/lib/album/types';
import type { Currency } from '@/lib/commerce/catalog';
import type { OrderItemInput, PricedLine } from '@/lib/commerce/pricing';
import { sql, sqlOne, transaction } from '../db';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
export type FulfillmentStatus = 'awaiting_payment' | 'processing' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface PrintOptions {
  sizeId: string;
  coverId: string;
  quantity: number;
  pageCount: number;
  shippingId: string;
}

export interface PhotoManifestEntry {
  storage_prefix: string;
  original_ext: string;
  width: number;
  height: number;
}

export interface OrderRow {
  id: string;
  number: string;
  user_id: string;
  project_id: string;
  status: PaymentStatus;
  currency: Currency;
  items: OrderItemInput[];
  lines: PricedLine[];
  amount_subtotal: number;
  amount_shipping: number;
  amount_total: number;
  provider: string;
  provider_session_id: string | null;
  provider_payment_id: string | null;
  receipt_url: string | null;
  document_snapshot: AlbumDocument;
  photo_manifest: Record<string, PhotoManifestEntry>;
  shipping_address: ShippingAddress | null;
  print_options: PrintOptions | null;
  customer_email: string | null;
  fulfillment_status: FulfillmentStatus | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  refunded_at: string | null;
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function orderNumber() {
  const bytes = crypto.randomBytes(7);
  return 'FS-' + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export const hasItem = (o: Pick<OrderRow, 'items'>, kind: OrderItemInput['kind']) => o.items.some((i) => i.kind === kind);

export async function insertOrder(o: {
  userId: string;
  projectId: string;
  currency: Currency;
  items: OrderItemInput[];
  lines: PricedLine[];
  subtotal: number;
  shipping: number;
  total: number;
  provider: string;
  doc: AlbumDocument;
  manifest: Record<string, PhotoManifestEntry>;
  address: ShippingAddress | null;
  print: PrintOptions | null;
  email: string;
}): Promise<OrderRow> {
  const id = crypto.randomUUID();
  const rows = await sql<OrderRow>(
    `insert into orders (id, number, user_id, project_id, currency, items, lines, amount_subtotal, amount_shipping, amount_total, provider,
       document_snapshot, photo_manifest, shipping_address, print_options, customer_email, fulfillment_status)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) returning *`,
    [
      id,
      orderNumber(),
      o.userId,
      o.projectId,
      o.currency,
      JSON.stringify(o.items),
      JSON.stringify(o.lines),
      o.subtotal,
      o.shipping,
      o.total,
      o.provider,
      JSON.stringify(o.doc),
      JSON.stringify(o.manifest),
      o.address ? JSON.stringify(o.address) : null,
      o.print ? JSON.stringify(o.print) : null,
      o.email,
      o.print ? 'awaiting_payment' : null,
    ],
  );
  await addEvent(id, 'created', { total: o.total, currency: o.currency });
  return rows[0];
}

export async function getOrder(id: string): Promise<OrderRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return sqlOne<OrderRow>('select * from orders where id = $1', [id]);
}

export async function getOwnedOrder(userId: string, id: string): Promise<OrderRow | null> {
  const o = await getOrder(id);
  return o && o.user_id === userId ? o : null;
}

export async function listOrders(userId: string): Promise<OrderRow[]> {
  return sql<OrderRow>(
    `select id, number, user_id, project_id, status, currency, items, lines, amount_subtotal, amount_shipping, amount_total, provider, receipt_url,
            shipping_address, print_options, fulfillment_status, carrier, tracking_number, tracking_url, created_at, updated_at, paid_at, refunded_at,
            document_snapshot->'cover' as cover_page, document_snapshot->'size' as snapshot_size
     from orders where user_id = $1 order by created_at desc`,
    [userId],
  );
}

export async function listAllOrders(limit = 200): Promise<OrderRow[]> {
  return sql<OrderRow>(
    `select id, number, user_id, project_id, status, currency, items, lines, amount_total, provider, shipping_address, print_options, customer_email,
            fulfillment_status, carrier, tracking_number, tracking_url, created_at, paid_at, refunded_at
     from orders order by created_at desc limit $1`,
    [limit],
  );
}

export async function setProviderSession(id: string, sessionId: string) {
  await sql('update orders set provider_session_id = $2, updated_at = now() where id = $1', [id, sessionId]);
}

export async function addEvent(orderId: string, type: string, data?: unknown) {
  await sql('insert into order_events (order_id, type, data) values ($1, $2, $3)', [orderId, type, data ? JSON.stringify(data) : null]);
}

export async function orderEvents(orderId: string) {
  return sql<{ type: string; data: unknown; created_at: string }>('select type, data, created_at from order_events where order_id = $1 order by created_at asc', [orderId]);
}

/** Records a webhook event id; returns false if it was already processed. */
export async function claimWebhookEvent(provider: string, eventId: string): Promise<boolean> {
  const rows = await sql('insert into webhook_events (provider, event_id) values ($1, $2) on conflict do nothing returning event_id', [provider, eventId]);
  return rows.length > 0;
}

/**
 * Payment state transitions. Each is idempotent and only moves forward from
 * an allowed state, so duplicate or out-of-order webhooks are harmless.
 */
export async function transitionOrder(
  id: string,
  to: 'paid' | 'failed' | 'refunded' | 'cancelled',
  info: { paymentId?: string | null; receiptUrl?: string | null; reason?: string } = {},
): Promise<OrderRow | null> {
  const from: Record<typeof to, PaymentStatus[]> = {
    paid: ['pending', 'failed', 'cancelled'],
    failed: ['pending'],
    cancelled: ['pending'],
    refunded: ['paid'],
  };
  return transaction(async (q) => {
    const rows = await q<OrderRow>(
      `update orders set status = $2,
         provider_payment_id = coalesce($3, provider_payment_id),
         receipt_url = coalesce($4, receipt_url),
         paid_at = case when $2 = 'paid' then now() else paid_at end,
         refunded_at = case when $2 = 'refunded' then now() else refunded_at end,
         fulfillment_status = case
           when fulfillment_status is null then null
           when $2 = 'paid' then 'processing'
           when $2 = 'refunded' then 'cancelled'
           else fulfillment_status end,
         updated_at = now()
       where id = $1 and status = any($5::text[]) returning *`,
      [id, to, info.paymentId ?? null, info.receiptUrl ?? null, from[to]],
    );
    const order = rows[0] ?? null;
    if (order) await q('insert into order_events (order_id, type, data) values ($1, $2, $3)', [id, `payment_${to}`, JSON.stringify(info)]);
    return order;
  });
}

export async function updateFulfillment(id: string, patch: { status?: FulfillmentStatus; carrier?: string | null; trackingNumber?: string | null; trackingUrl?: string | null }) {
  await sql(
    `update orders set fulfillment_status = coalesce($2, fulfillment_status), carrier = coalesce($3, carrier),
       tracking_number = coalesce($4, tracking_number), tracking_url = coalesce($5, tracking_url), updated_at = now() where id = $1`,
    [id, patch.status ?? null, patch.carrier ?? null, patch.trackingNumber ?? null, patch.trackingUrl ?? null],
  );
  await addEvent(id, 'fulfillment_updated', patch);
}

/* --------------------------------- exports -------------------------------- */

export type ExportKind = 'digital' | 'print-interior' | 'print-cover';

export interface ExportRow {
  id: string;
  order_id: string;
  kind: ExportKind;
  status: 'pending' | 'ready' | 'failed';
  storage_key: string | null;
  size_bytes: number | null;
  error: string | null;
  updated_at: string;
}

export async function getExport(orderId: string, kind: ExportKind) {
  return sqlOne<ExportRow>('select * from exports where order_id = $1 and kind = $2', [orderId, kind]);
}

export async function listExports(orderId: string) {
  return sql<ExportRow>('select * from exports where order_id = $1', [orderId]);
}

export async function upsertExport(orderId: string, kind: ExportKind, patch: { status: ExportRow['status']; storageKey?: string; size?: number; error?: string }) {
  await sql(
    `insert into exports (id, order_id, kind, status, storage_key, size_bytes, error) values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (order_id, kind) do update set status = excluded.status, storage_key = coalesce(excluded.storage_key, exports.storage_key),
       size_bytes = coalesce(excluded.size_bytes, exports.size_bytes), error = excluded.error, updated_at = now()`,
    [crypto.randomUUID(), orderId, kind, patch.status, patch.storageKey ?? null, patch.size ?? null, patch.error ?? null],
  );
}

/* --------------------------------- shares --------------------------------- */

export interface ShareRow {
  id: string;
  token: string;
  order_id: string;
  user_id: string;
  project_id: string;
  title: string;
  access: 'link' | 'password';
  password_hash: string | null;
  enabled: boolean;
  allow_download: boolean;
  expires_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export async function ensureShare(order: OrderRow, title: string): Promise<ShareRow> {
  const existing = await sqlOne<ShareRow>('select * from shares where order_id = $1', [order.id]);
  if (existing) return existing;
  const token = crypto.randomBytes(18).toString('base64url');
  const rows = await sql<ShareRow>(
    `insert into shares (id, token, order_id, user_id, project_id, title) values ($1,$2,$3,$4,$5,$6)
     on conflict (order_id) do update set updated_at = now() returning *`,
    [crypto.randomUUID(), token, order.id, order.user_id, order.project_id, title.slice(0, 120)],
  );
  return rows[0];
}

export async function getShareByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(token)) return null;
  return sqlOne<ShareRow>('select * from shares where token = $1', [token]);
}

export async function getShareForOrder(orderId: string) {
  return sqlOne<ShareRow>('select * from shares where order_id = $1', [orderId]);
}

export async function listShares(userId: string) {
  return sql<ShareRow & { status: PaymentStatus; number: string }>(
    `select s.*, o.status, o.number from shares s join orders o on o.id = s.order_id where s.user_id = $1 order by s.created_at desc`,
    [userId],
  );
}

export async function updateShare(id: string, patch: { access?: 'link' | 'password'; passwordHash?: string | null; enabled?: boolean; expiresAt?: string | null; allowDownload?: boolean; title?: string }) {
  await sql(
    `update shares set access = coalesce($2, access),
       password_hash = case when $3::boolean then $4 else password_hash end,
       enabled = coalesce($5, enabled),
       expires_at = case when $6::boolean then $7::timestamptz else expires_at end,
       allow_download = coalesce($8, allow_download),
       title = coalesce($9, title),
       updated_at = now()
     where id = $1`,
    [
      id,
      patch.access ?? null,
      patch.passwordHash !== undefined,
      patch.passwordHash ?? null,
      patch.enabled ?? null,
      patch.expiresAt !== undefined,
      patch.expiresAt ?? null,
      patch.allowDownload ?? null,
      patch.title ?? null,
    ],
  );
}

export async function bumpShareViews(id: string) {
  await sql('update shares set view_count = view_count + 1 where id = $1', [id]);
}
