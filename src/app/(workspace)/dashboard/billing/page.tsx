import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ExternalLink } from 'lucide-react';
import { date, money, PAYMENT_LABEL } from '@/components/dashboard/format';
import { PageHeader } from '@/components/dashboard/ProjectGrid';
import { requireUser } from '@/lib/server/auth';
import { listOrders } from '@/lib/server/repo/orders';

export const metadata: Metadata = { title: 'Billing', robots: { index: false } };

async function List() {
  const user = await requireUser('/dashboard/billing');
  const orders = await listOrders(user.id);
  const paid = orders.filter((o) => o.status === 'paid');
  return (
    <>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5"><p className="eyebrow">Orders</p><p className="mt-2 font-serif text-3xl">{orders.length}</p></div>
        <div className="rounded-2xl border border-line bg-white p-5"><p className="eyebrow">Paid</p><p className="mt-2 font-serif text-3xl">{paid.length}</p></div>
        <div className="rounded-2xl border border-line bg-white p-5"><p className="eyebrow">Payment method</p><p className="mt-2 text-sm text-ink-soft">Entered securely at checkout — we never store card details.</p></div>
      </div>
      {orders.length ? (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"><span className="sr-only">Receipt</span></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-4"><Link href={`/orders/${o.id}`} className="font-medium underline-offset-4 hover:underline">{o.number}</Link></td>
                  <td className="px-5 py-4 text-ink-soft">{date(o.created_at)}</td>
                  <td className="px-5 py-4 text-ink-soft">{o.lines.map((l) => l.label.replace('Printed photobook — ', 'Print, ')).join(', ')}</td>
                  <td className="px-5 py-4 tabular-nums">{money(o.amount_total, o.currency)}</td>
                  <td className="px-5 py-4"><span className={`badge ${PAYMENT_LABEL[o.status].cls}`}>{PAYMENT_LABEL[o.status].label}</span></td>
                  <td className="px-5 py-4 text-right">{o.receipt_url ? <a href={o.receipt_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-soft hover:text-ink">Receipt <ExternalLink size={12} /></a> : <Link href={`/orders/${o.id}`} className="text-ink-soft hover:text-ink">Details</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-line-strong px-5 py-8 text-center text-sm text-muted">No payments yet.</p>
      )}
    </>
  );
}

export default function BillingPage() {
  return (
    <>
      <PageHeader title="Billing" text="Your payment history and receipts." />
      <Suspense fallback={<div className="h-60 skeleton rounded-3xl" />}>
        <List />
      </Suspense>
    </>
  );
}
