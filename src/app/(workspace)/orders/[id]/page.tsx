import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AlertCircle, CheckCircle2, Clock, Download, ExternalLink, Link2, Package, RotateCcw } from 'lucide-react';
import { BookCover } from '@/components/album/Book';
import { DownloadButton, OrderStatusPoller, ShareManager } from '@/components/dashboard/OrderClient';
import { date, FULFILLMENT_LABEL, FULFILLMENT_STEPS, money, PAYMENT_LABEL } from '@/components/dashboard/format';
import { getSize, getCatalog } from '@/lib/commerce/catalog';
import { requireUser } from '@/lib/server/auth';
import { appUrl } from '@/lib/server/env';
import { syncOrder } from '@/lib/server/orders';
import { documentPhotoMap } from '@/lib/server/repo/projects';
import { getOwnedOrder, getShareForOrder, hasItem } from '@/lib/server/repo/orders';

export const metadata: Metadata = { title: 'Order', robots: { index: false } };

async function Order({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/orders/${id}`);
  let order = await getOwnedOrder(user.id, id);
  if (!order) notFound();
  order = await syncOrder(order);
  const doc = order.document_snapshot;
  const photos = await documentPhotoMap(doc);
  const share = order.status === 'paid' ? await getShareForOrder(order.id) : null;
  const status = PAYMENT_LABEL[order.status];
  const print = order.print_options;
  const size = print ? getSize(print.sizeId) : null;
  const cover = print ? getCatalog().covers.find((c) => c.id === print.coverId) : null;
  const stepIndex = FULFILLMENT_STEPS.findIndex((s) => s.id === order!.fulfillment_status);

  return (
    <div className="space-y-8">
      <OrderStatusPoller orderId={order.id} status={order.status} />
      <div className="flex flex-col gap-6 rounded-[4px] border border-line bg-white p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="grid h-36 w-36 shrink-0 place-items-center rounded-[4px] bg-paper-2">
          <BookCover page={doc.cover} size={doc.size} photos={photos} renderWidth={160} style={{ width: doc.orientation === 'landscape' ? '84%' : doc.orientation === 'portrait' ? '56%' : '70%' }} />
        </div>
        <div className="flex-1">
          <span className={`badge ${status.cls}`}>{status.label}</span>
          <h1 className="mt-3 font-serif text-4xl">
            {order.status === 'paid' ? 'Thank you — your order is confirmed.' : order.status === 'pending' ? 'Confirming your payment…' : order.status === 'failed' ? 'Your payment didn’t go through.' : order.status === 'refunded' ? 'This order was refunded.' : 'This order was cancelled.'}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Order {order.number} · placed {date(order.created_at)} · {money(order.amount_total, order.currency)}
          </p>
          {order.status === 'pending' && <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft"><Clock size={15} /> This page updates automatically as soon as your payment is confirmed.</p>}
          {order.status === 'failed' && (
            <Link href={`/projects/${order.project_id}/checkout`} className="btn btn-primary btn-sm mt-4"><RotateCcw size={14} /> Try again</Link>
          )}
        </div>
      </div>

      {order.status === 'paid' && hasItem(order, 'digital_pdf') && (
        <section className="rounded-[4px] border border-line bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3"><Download size={20} className="text-accent-dark" /><h2 className="font-serif text-2xl">Digital PDF</h2></div>
          <p className="mb-5 mt-2 text-sm text-ink-soft">A high-resolution PDF of your album — cover, every page and back cover.</p>
          <DownloadButton orderId={order.id} />
        </section>
      )}

      {order.status === 'paid' && share && (
        <section className="rounded-[4px] border border-line bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3"><Link2 size={20} className="text-accent-dark" /><h2 className="font-serif text-2xl">Shareable album</h2></div>
          <p className="mb-5 mt-2 text-sm text-ink-soft">Send this link to family and friends. You control who can see it and for how long.</p>
          <ShareManager
            origin={appUrl()}
            canDownload={hasItem(order, 'digital_pdf')}
            share={{ id: share.id, token: share.token, access: share.access, enabled: share.enabled, allowDownload: share.allow_download, expiresAt: share.expires_at ? new Date(share.expires_at).toISOString() : null, views: share.view_count, hasPassword: !!share.password_hash }}
          />
        </section>
      )}

      {print && (
        <section className="rounded-[4px] border border-line bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3"><Package size={20} className="text-accent-dark" /><h2 className="font-serif text-2xl">Printed photobook</h2></div>
          <p className="mt-2 text-sm text-ink-soft">
            {print.quantity} × {cover?.label} · {size?.label} · {print.pageCount} pages
          </p>
          {order.status === 'paid' && order.fulfillment_status !== 'cancelled' ? (
            <ol className="mt-6 grid gap-4 sm:grid-cols-4">
              {FULFILLMENT_STEPS.map((s, i) => (
                <li key={s.id} className="flex items-center gap-3 sm:flex-col sm:items-start">
                  <span className={`grid h-8 w-8 place-items-center rounded-full ${i <= stepIndex ? 'bg-ink text-paper' : 'bg-paper-2 text-faint'}`}>
                    {i <= stepIndex ? <CheckCircle2 size={16} /> : i + 1}
                  </span>
                  <span className={`text-sm ${i <= stepIndex ? 'text-ink' : 'text-muted'}`}>{s.label}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-muted">Status: {FULFILLMENT_LABEL[order.fulfillment_status ?? 'awaiting_payment']}</p>
          )}
          {order.tracking_number && (
            <p className="mt-5 text-sm">
              Tracking: {order.carrier} {order.tracking_number}{' '}
              {order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">Track parcel <ExternalLink size={12} /></a>}
            </p>
          )}
          {order.shipping_address && (
            <div className="mt-6 rounded-xl bg-paper p-4 text-sm text-ink-soft">
              <p className="eyebrow mb-2">Ship to</p>
              <p>{order.shipping_address.name}</p>
              <p>{order.shipping_address.line1}{order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ''}</p>
              <p>{order.shipping_address.postalCode} {order.shipping_address.city}{order.shipping_address.region ? `, ${order.shipping_address.region}` : ''}</p>
              <p>{order.shipping_address.country}</p>
            </div>
          )}
        </section>
      )}

      <section className="rounded-[4px] border border-line bg-white p-6 sm:p-8">
        <h2 className="font-serif text-2xl">Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          {order.lines.map((l, i) => (
            <div key={i} className="flex justify-between gap-4">
              <dt>{l.label}{l.quantity > 1 ? ` × ${l.quantity}` : ''}{l.detail && <span className="block text-xs text-muted">{l.detail}</span>}</dt>
              <dd className="tabular-nums">{money(l.amount, order.currency)}</dd>
            </div>
          ))}
          {order.amount_shipping > 0 && <div className="flex justify-between"><dt>Shipping</dt><dd className="tabular-nums">{money(order.amount_shipping, order.currency)}</dd></div>}
          <div className="flex justify-between border-t border-line pt-3 font-medium"><dt>Total</dt><dd className="tabular-nums">{money(order.amount_total, order.currency)}</dd></div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          {order.receipt_url && <a href={order.receipt_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">View receipt <ExternalLink size={13} /></a>}
          <Link href={`/projects/${order.project_id}/edit`} className="btn btn-ghost btn-sm">Open album in editor</Link>
        </div>
        {order.provider === 'test' && <p className="mt-4 flex items-center gap-2 text-xs text-warning"><AlertCircle size={13} /> Test-mode order — no real payment was taken.</p>}
      </section>
    </div>
  );
}

export default function OrderPage({ params }: PageProps<'/orders/[id]'>) {
  return (
    <Suspense fallback={<div className="h-96 skeleton rounded-[4px]" />}>
      <Order params={params} />
    </Suspense>
  );
}
