import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { FlaskConical } from 'lucide-react';
import { TestPayment } from '@/components/commerce/TestPayment';
import { money } from '@/components/dashboard/format';
import { Logo } from '@/components/ui/Logo';
import { requireUser } from '@/lib/server/auth';
import { testPaymentsAllowed } from '@/lib/server/payments';
import { getOwnedOrder } from '@/lib/server/repo/orders';

export const metadata: Metadata = { title: 'Test payment', robots: { index: false } };

async function Content({ params, searchParams }: { params: Promise<{ orderId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { orderId } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/checkout/test/${orderId}`);
  const order = await getOwnedOrder(user.id, orderId);
  if (!order || order.provider !== 'test' || !testPaymentsAllowed() || sp.session !== order.provider_session_id) notFound();
  return (
    <div className="rounded-3xl border border-line bg-white p-8">
      <div className="flex items-start gap-3 rounded-2xl bg-warning-soft p-4 text-sm text-warning">
        <FlaskConical size={18} className="mt-0.5 shrink-0" />
        <p>
          <strong>Test payment provider.</strong> No card is charged and no money moves. Set CREEM_API_KEY to accept real payments.
        </p>
      </div>
      <p className="mt-6 text-sm text-muted">Order {order.number}</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {order.lines.map((l, i) => (
          <li key={i} className="flex justify-between"><span>{l.label}{l.quantity > 1 ? ` × ${l.quantity}` : ''}</span><span>{money(l.amount, order.currency)}</span></li>
        ))}
        {order.amount_shipping > 0 && <li className="flex justify-between"><span>Shipping</span><span>{money(order.amount_shipping, order.currency)}</span></li>}
      </ul>
      <p className="mt-4 flex justify-between border-t border-line pt-4 font-medium"><span>Total</span><span>{money(order.amount_total, order.currency)}</span></p>
      <div className="mt-8">
        <TestPayment orderId={order.id} session={order.provider_session_id!} cancelHref={`/projects/${order.project_id}/checkout?cancelled=${order.id}`} />
      </div>
    </div>
  );
}

export default function TestCheckoutPage({ params, searchParams }: PageProps<'/checkout/test/[orderId]'>) {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line"><div className="container-page flex h-16 items-center"><Logo /></div></header>
      <main className="mx-auto max-w-md px-5 py-12">
        <h1 className="mb-6 font-serif text-4xl">Complete payment</h1>
        <Suspense fallback={<div className="h-80 skeleton rounded-3xl" />}>
          <Content params={params} searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
