import 'server-only';
import { z } from 'zod';
import { countPhotoFrames, usedPhotoIds } from '@/lib/album/geometry';
import { getCatalog, getSize, isCurrency, type Currency } from '@/lib/commerce/catalog';
import { normalisePageCount, quote, type OrderItemInput } from '@/lib/commerce/pricing';
import { getTemplate } from '@/lib/templates';
import { updateProfile, type SessionUser } from './auth';
import { appUrl } from './env';
import { HttpError } from './http';
import { getPaymentProvider } from './payments';
import { sql } from './db';
import { ensureShare, getOrder, insertOrder, setProviderSession, transitionOrder, type OrderRow, type PhotoManifestEntry } from './repo/orders';
import type { PhotoRow } from './repo/photos';
import { getProject, updateProjectMeta } from './repo/projects';

export const orderRequestSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().trim().email().max(200),
  currency: z.string(),
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

/** Validates a checkout request, prices it on the server, snapshots the album and opens a payment session. */
export async function createCheckout(user: SessionUser, req: OrderRequest): Promise<{ orderId: string; url: string }> {
  const catalog = getCatalog();
  const provider = getPaymentProvider();
  if (!provider) throw new HttpError(503, 'Payments are not configured on this site yet.');
  if (!isCurrency(req.currency)) throw new HttpError(400, 'Unsupported currency.');
  const currency = req.currency as Currency;
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
  const ids = [...usedPhotoIds(doc)].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const photos = ids.length ? await sql<PhotoRow>(`select * from photos where id = any($1::uuid[]) and user_id = $2 and status = 'ready'`, [ids, user.id]) : [];
  const manifest: Record<string, PhotoManifestEntry> = Object.fromEntries(
    photos.map((p) => [p.id, { storage_prefix: p.storage_prefix, original_ext: p.original_ext, width: p.width, height: p.height }]),
  );

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
  const session = await provider.createCheckout(order, {
    successUrl: `${base}/orders/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}/projects/${project.id}/checkout?cancelled=${order.id}`,
    email: req.email,
  });
  await setProviderSession(order.id, session.sessionId);
  return { orderId: order.id, url: session.url };
}

/** Side effects of a confirmed payment. Safe to call more than once. */
export async function onOrderPaid(order: OrderRow) {
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
