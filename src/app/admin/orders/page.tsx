import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminOrderActions } from '@/components/dashboard/AdminOrderRow';
import { date, FULFILLMENT_LABEL, money, PAYMENT_LABEL } from '@/components/dashboard/format';
import { Logo } from '@/components/ui/Logo';
import { adminLogoutAction } from '@/lib/server/actions/account';
import { requireAdminPage } from '@/lib/server/admin';
import { listAllOrders } from '@/lib/server/repo/orders';

export const metadata: Metadata = { title: 'Order management', robots: { index: false } };

async function Orders() {
  await requireAdminPage();
  const orders = await listAllOrders();
  if (!orders.length) return <p className="text-muted">No orders yet.</p>;
  return (
    <ul className="space-y-4">
      {orders.map((o) => {
        const isPrint = o.items.some((i) => i.kind === 'print');
        return (
          <li key={o.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium">{o.number} <span className="text-xs text-muted">· {o.provider}</span></p>
                <p className="text-sm text-ink-soft">{o.customer_email} · {date(o.created_at)} · {money(o.amount_total, o.currency)}</p>
                <p className="text-xs text-muted">{o.lines.map((l) => `${l.label}${l.quantity > 1 ? ` ×${l.quantity}` : ''}`).join(' · ')}</p>
                {o.shipping_address && (
                  <p className="mt-1 text-xs text-muted">
                    Ship to {o.shipping_address.name}, {o.shipping_address.line1}, {o.shipping_address.postalCode} {o.shipping_address.city}, {o.shipping_address.country}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <span className={`badge ${PAYMENT_LABEL[o.status].cls}`}>{PAYMENT_LABEL[o.status].label}</span>
                {isPrint && <span className="badge bg-accent-soft text-accent-dark">{FULFILLMENT_LABEL[o.fulfillment_status ?? 'awaiting_payment']}</span>}
              </div>
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <AdminOrderActions id={o.id} isPrint={isPrint} paid={o.status === 'paid'} fulfillment={o.fulfillment_status} carrier={o.carrier} tracking={o.tracking_number} trackingUrl={o.tracking_url} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function AdminOrdersPage() {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-white/70">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo href="/" />
          <div className="flex items-center gap-3">
            <span className="eyebrow">Admin · Orders</span>
            <form action={adminLogoutAction}>
              <button type="submit" className="btn btn-ghost btn-sm">Log out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="container-page py-10">
        <h1 className="mb-8 font-serif text-4xl">Order management</h1>
        <Suspense fallback={<div className="h-96 skeleton rounded-3xl" />}>
          <Orders />
        </Suspense>
      </main>
    </div>
  );
}
