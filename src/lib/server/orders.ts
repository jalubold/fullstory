import 'server-only';
import { z } from 'zod';
import { countPhotoFrames, usedPhotoIds } from '@/lib/album/geometry';
import { getCatalog, getSize, isCurrency, type Currency } from '@/lib/commerce/catalog';
import { normalisePageCount, quote, type OrderItemInput } from '@/lib/commerce/pricing';
import { currencyForCountry } from '@/lib/commerce/region';
import { getTemplate } from '@/lib/templates';
import { updateProfile, type SessionUser } from './auth';
import { appUrl } from './env';
import { HttpError } from './http';
import { getPaymentProvider } from './payments';
import { sql } from './db';
import { ensureShare, getOrder, insertOrder, isAlbumOrder, setProviderSession, transitionOrder, type OrderRow, type PhotoManifestEntry } from './repo/orders';
import type { PhotoRow } from './repo/photos';
import { getProject, projectVersion, unlockProject, updateProjectMeta, type ProjectRow } from './repo/projects';
import type { AlbumDocument } from '@/lib/album/types';

export const orderRequestSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().trim().email().max(200),
  /** Ignored: the currency comes from the visitor's country. Kept so older clients still validate. */
  currency: z.string().optional(),
  pdf: z.boolean().default(false),
  share: z.boolean().default(false),
  print: z
    .object({
      sizeId: z.string(),
      coverId: z.string(),
      quantity: z.number().int().min(1).max(100),
      shippingId: z.string(),
      address: z.object({
        name: z.string().trim().min(2).max(120),
        line1: z.string().trim().min(2).max(200),
        line2: z.string().trim().max(200).optional(),
        city: z.string().trim().min(1).max(120),
        region: z.string().trim().max(120).optional(),
        postalCode: z.string().trim().min(2).max(20),
        country: z.string().length(2),
        phone: z.string().trim().max(40).optional(),
      }),
    })
    .nullable()
    .optional(),
});

export type OrderRequest = z.infer<typeof orderRequestSchema>;

/** The currency a visitor in `country` is charged in. */
export function checkoutCurrency(country: string | null): Currency {
  return currencyForCountry(country, getCatalog().currencies);
}

/** Validates a checkout request, prices it on the server, snapshots the album and opens a payment session. */
export async function createCheckout(user: SessionUser, req: OrderRequest, ctx: { country: string | null }): Promise<{ orderId: string; url: string }> {
  const catalog = getCatalog();
  const provider = getPaymentProvider();
  if (!provider) throw new HttpError(503, 'Payments are not configured on this site yet.');
  const currency = checkoutCurrency(ctx.country);
  if (!isCurrency(currency)) throw new HttpError(400, 'Unsupported currency.');
  const project = await getProject(user.id, req.projectId);
  if (!project) throw new HttpError(404, 'Project not found.');
  const doc = project.document;

  const items: OrderItemInput[] = [];
  if (req.pdf) items.push({ kind: 'digital_pdf' });
  if (req.share) items.push({ kind: 'digital_share' });
  let printOptions = null;
  if (req.print) {
    const size = getSize(req.print.sizeId);
    if (!size || size.orientation !== doc.orientation) throw new HttpError(400, 'That size isn’t available for this album.');
    if (!catalog.covers.some((c) => c.id === req.print!.coverId)) throw new HttpError(400, 'Unknown cover type.');
    if (!catalog.shipping.some((s) => s.id === req.print!.shippingId)) throw new HttpError(400, 'Unknown shipping option.');
    if (!catalog.shippingCountries.includes(req.print.address.country)) throw new HttpError(400, 'We don’t ship to that country yet.');
    const pageCount = normalisePageCount(doc.pages.length);
    items.push({ kind: 'print', sizeId: size.id, coverId: req.print.coverId, pageCount, quantity: Math.min(catalog.print.maxQuantity, req.print.quantity) });
    printOptions = { sizeId: size.id, coverId: req.print.coverId, quantity: Math.min(catalog.print.maxQuantity, req.print.quantity), pageCount, shippingId: req.print.shippingId };
  }
  if (!items.length) throw new HttpError(400, 'Choose at least one format.');
  if (doc.templateId && getTemplate(doc.templateId)?.tier === 'premium') items.push({ kind: 'premium_template' });
  if (countPhotoFrames(doc).filled === 0) throw new HttpError(400, 'Add at least one photo to your album before ordering.');

  const q = quote(items, currency, printOptions?.shippingId ?? null, catalog);
  await updateProfile(user, { email: req.email, name: req.print?.address.name ?? null });

  // Photo manifest: lets exports find the exact files even if the photos are later removed from the project.
  const manifest = await photoManifest(doc, user.id);

  const order = await insertOrder({
    userId: user.id,
    projectId: project.id,
    currency,
    items,
    lines: q.lines,
    subtotal: q.subtotal,
    shipping: q.shipping?.amount ?? 0,
    total: q.total,
    provider: provider.id,
    doc,
    manifest,
    address: req.print?.address ?? null,
    print: printOptions,
    email: req.email,
  });

  const base = appUrl();
  const orderUrl = `${base}/orders/${order.id}`;
  const session = await provider.createCheckout(order, {
    // Stripe fills in its placeholder; Creem appends its own checkout details.
    successUrl: provider.id === 'stripe' ? `${orderUrl}?session_id={CHECKOUT_SESSION_ID}` : orderUrl,
    cancelUrl: `${base}/projects/${project.id}/checkout?cancelled=${order.id}`,
    email: req.email,
  });
  await setProviderSession(order.id, session.sessionId);
  return { orderId: order.id, url: session.url };
}

/** The exact photo files an album uses, so its PDF and share link can find them. */
async function photoManifest(doc: AlbumDocument, userId: string): Promise<Record<string, PhotoManifestEntry>> {
  const ids = [...usedPhotoIds(doc)].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const photos = ids.length ? await sql<PhotoRow>(`select * from photos where id = any($1::uuid[]) and user_id = $2 and status = 'ready'`, [ids, userId]) : [];
  return Object.fromEntries(photos.map((p) => [p.id, { storage_prefix: p.storage_prefix, original_ext: p.original_ext, width: p.width, height: p.height }]));
}

/**
 * Pay-up-front: opens a checkout for one album ("everything included"). Returns
 * `unlocked` when the album is already paid for.
 */
export async function startAlbumCheckout(user: SessionUser, project: ProjectRow, ctx: { country: string | null }): Promise<{ url: string } | { unlocked: true }> {
  if (project.unlocked_at) return { unlocked: true };
  const provider = getPaymentProvider();
  if (!provider) throw new HttpError(503, 'Payments are not configured on this site yet.');
  const currency = checkoutCurrency(ctx.country);
  const items: OrderItemInput[] = [{ kind: 'album' }];
  const q = quote(items, currency, null);
  const order = await insertOrder({
    userId: user.id,
    projectId: project.id,
    currency,
    items,
    lines: q.lines,
    subtotal: q.subtotal,
    shipping: 0,
    total: q.total,
    provider: provider.id,
    doc: project.document,
    manifest: {},
    address: null,
    print: null,
    email: user.email ?? null,
  });
  const base = appUrl();
  const landing = `${base}/projects/${project.id}/unlock?order=${order.id}`;
  const session = await provider.createCheckout(order, {
    successUrl: provider.id === 'stripe' ? `${landing}&session_id={CHECKOUT_SESSION_ID}` : landing,
    cancelUrl: `${base}/projects/${project.id}/unlock`,
    email: user.email ?? null,
  });
  await setProviderSession(order.id, session.sessionId);
  return { url: session.url };
}

/**
 * Album orders follow their album: when the project has changed since the
 * order's snapshot, take a fresh snapshot (and drop the old PDF) so the PDF and
 * share link always show the latest pages. Cheap when nothing changed.
 */
export async function refreshAlbumOrder(order: OrderRow): Promise<OrderRow> {
  if (order.status !== 'paid' || !isAlbumOrder(order)) return order;
  const version = await projectVersion(order.project_id);
  if (version === null || version === order.snapshot_version) return order;
  const project = await getProject(order.user_id, order.project_id);
  if (!project) return order;
  const manifest = await photoManifest(project.document, order.user_id);
  const rows = await sql<OrderRow>(
    'update orders set document_snapshot = $2, photo_manifest = $3, snapshot_version = $4, updated_at = now() where id = $1 returning *',
    [order.id, JSON.stringify(project.document), JSON.stringify(manifest), project.version],
  );
  await sql('delete from exports where order_id = $1', [order.id]);
  return rows[0] ?? order;
}

/** Side effects of a confirmed payment. Safe to call more than once. */
export async function onOrderPaid(order: OrderRow) {
  if (isAlbumOrder(order)) {
    await unlockProject(order.project_id, order.id);
    const project = await getProject(order.user_id, order.project_id);
    await ensureShare(order, project?.title ?? order.document_snapshot.spineText ?? 'Our album');
    return;
  }
  if (order.items.some((i) => i.kind === 'digital_share')) {
    const project = await getProject(order.user_id, order.project_id);
    await ensureShare(order, project?.title ?? order.document_snapshot.spineText ?? 'Our album');
  }
  await updateProjectMeta(order.user_id, order.project_id, { status: 'completed' });
}

export async function applyPaymentResult(orderId: string, result: 'paid' | 'failed' | 'cancelled' | 'refunded', info: { paymentId?: string | null; receiptUrl?: string | null } = {}) {
  const updated = await transitionOrder(orderId, result, info);
  if (updated && result === 'paid') await onOrderPaid(updated);
  return updated ?? (await getOrder(orderId));
}

/** Reconciles a pending order with the payment provider (used when the customer returns before the webhook arrives). */
export async function syncOrder(order: OrderRow): Promise<OrderRow> {
  if (order.status !== 'pending') return order;
  const provider = getPaymentProvider(order.provider);
  if (!provider) return order;
  try {
    const s = await provider.getStatus(order);
    if (s.status === 'paid') return (await applyPaymentResult(order.id, 'paid', { paymentId: s.paymentId, receiptUrl: s.receiptUrl })) ?? order;
    if (s.status === 'failed') return (await applyPaymentResult(order.id, 'failed')) ?? order;
  } catch (e) {
    console.error('[orders] sync failed', e);
  }
  return order;
}
