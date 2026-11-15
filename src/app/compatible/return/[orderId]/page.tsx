import type { Metadata } from 'next';
import { connection } from 'next/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { RefreshEvery } from '@/components/compat/RefreshEvery';
import { CompatHeader, FlowScreen } from '@/components/compat/Shell';
import { getCompatOrder, syncCompatOrder } from '@/lib/compat/server/payments';
import { findByToken } from '@/lib/compat/server/repo';
import { rememberedTokens } from '@/lib/compat/server/view';

export const metadata: Metadata = { title: 'Payment', robots: { index: false, follow: false }, referrer: 'no-referrer' };

/**
 * Where the payment provider sends the buyer back. The buyer's private link
 * comes from this browser's cookie — it's never given to the provider.
 */
async function Return({ params, searchParams }: { params: Promise<{ orderId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Private, per-request data: never prerendered.
  await connection();
  const { orderId } = await params;
  const sp = await searchParams;
  let order = await getCompatOrder(orderId);
  if (!order) redirect('/compatible');
  if (!sp.cancelled) order = await syncCompatOrder(order);

  let token: string | null = null;
  for (const t of await rememberedTokens()) {
    const ctx = await findByToken(t);
    if (ctx && ctx.assessment.id === order.assessment_id) {
      token = t;
      break;
    }
  }

  if (order.status === 'paid') {
    if (token) redirect(`/compatible/s/${token}/blueprint`);
    return (
      <Message title="Thank you — it’s unlocked" body="Your Relationship Blueprint is unlocked for both of you. Open the private link you were given when you started to read it." />
    );
  }
  if (sp.cancelled || order.status === 'failed' || order.status === 'cancelled') {
    if (token) redirect(`/compatible/s/${token}?payment=${sp.cancelled ? 'cancelled' : 'failed'}`);
    return <Message title="Payment not completed" body="Nothing was charged. Open your private link to try again whenever you like." />;
  }
  return (
    <FlowScreen>
      <RefreshEvery ms={2500} />
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="awc-eyebrow">Almost there</p>
        <h1 className="awc-serif mt-3 text-4xl">Confirming your payment…</h1>
        <p className="mt-3 text-awc-ink-soft">This takes a few seconds. The page continues on its own.</p>
        <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-awc-blush-soft">
          <div className="awc-pulse h-full w-full bg-awc-wine" />
        </div>
      </div>
    </FlowScreen>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <FlowScreen>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="awc-serif text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-sm leading-relaxed text-awc-ink-soft">{body}</p>
        <Link href="/compatible" className="awc-btn awc-btn-secondary mt-8">
          Back to Are We Compatible?
        </Link>
      </div>
    </FlowScreen>
  );
}

export default function ReturnPage({ params, searchParams }: PageProps<'/compatible/return/[orderId]'>) {
  return (
    <>
      <CompatHeader />
      <Suspense fallback={<div className="flex-1" />}>
        <Return params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
