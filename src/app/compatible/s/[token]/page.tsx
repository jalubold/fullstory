import type { Metadata } from 'next';
import { connection } from 'next/server';
import { headers } from 'next/headers';
import { Suspense } from 'react';
import { Quiz } from '@/components/compat/Quiz';
import { CompatHeader, FlowScreen } from '@/components/compat/Shell';
import { InvalidLink, ResultsStage, WaitingStage } from '@/components/compat/Stages';
import { countryFromHeaders } from '@/lib/commerce/region';
import { getQuestionSet } from '@/lib/compat/questions';
import { buildPreview } from '@/lib/compat/report';
import { blueprintPrice } from '@/lib/compat/server/payments';
import { loadBlueprint, loadView } from '@/lib/compat/server/view';
import { appUrl } from '@/lib/server/env';

export const metadata: Metadata = { title: 'Your test', robots: { index: false, follow: false }, referrer: 'no-referrer' };

async function Hub({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Private, per-request data: never prerendered.
  await connection();
  const { token } = await params;
  const payment = (await searchParams).payment;
  const found = await loadView(token);
  if (!found) return <InvalidLink />;
  const { view, ctx } = found;
  const privateUrl = `${appUrl()}/compatible/s/${token}`;

  if (view.stage === 'answering') {
    const set = getQuestionSet(view.questionSet);
    return (
      <FlowScreen>
        <Quiz
          token={token}
          name={view.name}
          partnerName={view.partnerName}
          role={view.role}
          questions={set.questions.map((q) => ({ id: q.id, dimension: q.dimension, prompt: q.prompt, options: q.options.map((o) => ({ id: o.id, label: o.label })) }))}
          dimensions={set.dimensions.map((d) => ({ id: d.id, label: d.label }))}
          initialAnswers={view.myAnswers}
        />
      </FlowScreen>
    );
  }

  if (view.stage === 'waiting') {
    return (
      <FlowScreen>
        <WaitingStage view={view} privateUrl={privateUrl} />
      </FlowScreen>
    );
  }

  const blueprint = await loadBlueprint(ctx);
  if (!blueprint) return <InvalidLink />;
  const price = blueprintPrice(countryFromHeaders(await headers())).label;
  return (
    <main id="main" className="flex-1">
      <div className="awc-container py-10 md:py-16">
        <ResultsStage view={view} preview={buildPreview(blueprint)} price={price} notice={payment === 'failed' ? 'That payment didn’t go through — nothing was charged. You can try again below.' : payment === 'cancelled' ? 'Checkout was cancelled — nothing was charged.' : undefined} privateUrl={privateUrl} siteUrl={`${appUrl()}/compatible`} />
      </div>
    </main>
  );
}

export default function ParticipantPage({ params, searchParams }: PageProps<'/compatible/s/[token]'>) {
  return (
    <>
      <CompatHeader />
      <Suspense fallback={<div className="flex flex-1 items-center justify-center py-32"><span className="awc-pulse awc-serif text-2xl italic text-awc-wine">One moment…</span></div>}>
        <Hub params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
