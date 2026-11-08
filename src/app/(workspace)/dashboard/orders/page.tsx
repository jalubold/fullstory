import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight } from 'lucide-react';
import { date, FULFILLMENT_LABEL, money, PAYMENT_LABEL } from '@/components/dashboard/format';
import { PageHeader } from '@/components/dashboard/ProjectGrid';
import { getCatalog } from '@/lib/commerce/catalog';
import { requireUser } from '@/lib/server/auth';
import { listOrders } from '@/lib/server/repo/orders';

export const metadata: Metadata = { title: 'Print Orders', robots: { index: false } };

async function List() {
  const user = await requireUser('/dashboard/orders');
  const catalog = getCatalog();
  const orders = (await listOrders(user.id)).filter((o) => o.items.some((i) => i.kind === 'print'));
  if (!orders.length) {
    return (
      <div className="rounded-3xl border border-dashed border-line-strong bg-white/60 px-6 py-16 text-center">
        <p className="font-serif text-3xl">No print orders yet</p>
        <p className="mt-2 text-sm text-ink-soft">Printed photobooks you order will appear here, with tracking once they ship.</p>
        <Link href="/dashboard/projects" className="btn btn-secondary mt-6">Choose an album to print</Link>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {orders.map((o) => {
        const p = o.print_options;
        const size = catalog.sizes.find((s) => s.id === p?.sizeId);
        const cover = catalog.covers.find((c) => c.id === p?.coverId);
        const pay = PAYMENT_LABEL[o.status];
        return (
          <li key={o.id}>
            <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white px-5 py-5 transition hover:shadow-card">
              <div>
                <p className="font-medium">{o.number}</p>
                <p className="mt-0.5 text-sm text-ink-soft">{p?.quantity} × {cover?.label} · {size?.label} · {p?.pageCount} pages</p>
                <p className="mt-0.5 text-xs text-muted">Ordered {date(o.created_at)} · {money(o.amount_total, o.currency)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${pay.cls}`}>{pay.label}</span>
                {o.status === 'paid' && <span className="badge bg-accent-soft text-accent-dark">{FULFILLMENT_LABEL[o.fulfillment_status ?? 'processing']}</span>}
                <ArrowRight size={16} className="text-muted" />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function OrdersPage() {
  return (
    <>
      <PageHeader title="Print Orders" text="Track your printed photobooks from production to your door." />
      <Suspense fallback={<div className="h-60 skeleton rounded-3xl" />}>
        <List />
      </Suspense>
    </>
  );
}
