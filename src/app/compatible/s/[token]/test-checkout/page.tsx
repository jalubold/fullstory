import type { Metadata } from 'next';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { FlaskConical } from 'lucide-react';
import { CompatHeader, FlowScreen } from '@/components/compat/Shell';
import { TestCheckout } from '@/components/compat/TestCheckout';
import { formatPrice } from '@/lib/compat/pricing';
import { getCompatOrder } from '@/lib/compat/server/payments';
import { loadView } from '@/lib/compat/server/view';
import { testPaymentsAllowed } from '@/lib/server/payments';

export const metadata: Metadata = { title: 'Test payment', robots: { index: false, follow: false }, referrer: 'no-referrer' };

async function Content({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Private, per-request data: never prerendered.
  await connection();
  const { token } = await params;
  const sp = await searchParams;
  if (!testPaymentsAllowed() || typeof sp.order !== 'string' || typeof sp.session !== 'string') notFound();
  const found = await loadView(token);
  const order = await getCompatOrder(sp.order);
  if (!found || !order || order.provider !== 'test' || order.assessment_id !== found.view.assessmentId || order.provider_session_id !== sp.session) notFound();
  return (
    <div className="awc-card p-6 sm:p-8">
      <div className="flex items-start gap-3 rounded-2xl bg-awc-amber-soft p-4 text-sm text-awc-amber">
        <FlaskConical size={18} className="mt-0.5 shrink-0" aria-hidden />
        <p>
          <strong>Test payment provider.</strong> No card is charged and no money moves. Configure Creem or Stripe to accept real payments.
        </p>
      </div>
      <p className="mt-6 text-sm text-awc-muted">Order {order.number}</p>
      <div className="mt-2 flex items-baseline justify-between border-b border-awc-line pb-4">
        <span className="font-semibold">The Relationship Blueprint</span>
        <span className="awc-serif text-xl">{formatPrice(order.amount_total, order.currency)}</span>
      </div>
      <p className="mt-3 text-sm text-awc-muted">One payment · unlocked for both of you</p>
      <div className="mt-6">
        <TestCheckout token={token} orderId={order.id} session={sp.session} />
      </div>
    </div>
  );
}

export default function TestCheckoutPage({ params, searchParams }: PageProps<'/compatible/s/[token]/test-checkout'>) {
  return (
    <>
      <CompatHeader />
      <FlowScreen>
        <h1 className="awc-serif mb-6 text-4xl">Complete payment</h1>
        <Suspense fallback={<div className="awc-card h-80" />}>
          <Content params={params} searchParams={searchParams} />
        </Suspense>
      </FlowScreen>
    </>
  );
}
