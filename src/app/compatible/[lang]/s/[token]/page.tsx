import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { Quiz } from '@/components/compat/Quiz';
import { CompatHeader, FlowScreen, ShellPlaceholder } from '@/components/compat/Shell';
import { InvalidLink, ResultsStage, WaitingStage } from '@/components/compat/Stages';
import { countryFromHeaders } from '@/lib/commerce/region';
import { isLocale, type Locale } from '@/lib/compat/i18n';
import { getQuestionSet } from '@/lib/compat/questions';
import { buildPreview } from '@/lib/compat/report';
import { blueprintPrice } from '@/lib/compat/server/payments';
import { loadBlueprint, loadView } from '@/lib/compat/server/view';
import { UI } from '@/lib/compat/ui-strings';
import { appUrl } from '@/lib/server/env';

const localeOf = (lang: string): Locale => (isLocale(lang) ? lang : 'en');

export async function generateMetadata({ params }: PageProps<'/compatible/[lang]/s/[token]'>): Promise<Metadata> {
  return { title: UI[localeOf((await params).lang)].meta.yourTest, robots: { index: false, follow: false }, referrer: 'no-referrer' };
}

async function Page({ params, searchParams }: { params: Promise<{ lang: string; token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Private, per-request data: never prerendered.
  await connection();
  const { lang, token } = await params;
  const locale = localeOf(lang);
  return (
    <>
      <CompatHeader locale={locale} />
      <Hub token={token} searchParams={searchParams} locale={locale} />
    </>
  );
}

async function Hub({ token, searchParams, locale }: { token: string; searchParams: Promise<Record<string, string | string[] | undefined>>; locale: Locale }) {
  const payment = (await searchParams).payment;
  const found = await loadView(token, locale);
  if (!found) return <InvalidLink locale={locale} />;
  const { view, ctx } = found;
  const privateUrl = `${appUrl()}/compatible/s/${token}`;
  const t = UI[locale].results;

  if (view.stage === 'answering') {
    const set = getQuestionSet(view.questionSet, locale);
    return (
      <FlowScreen>
        <Quiz
          token={token}
          name={view.name}
          partnerName={view.partnerName}
          role={view.role}
          locale={locale}
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
        <WaitingStage view={view} privateUrl={privateUrl} locale={locale} />
      </FlowScreen>
    );
  }

  const blueprint = await loadBlueprint(ctx, locale);
  if (!blueprint) return <InvalidLink locale={locale} />;
  const price = blueprintPrice(countryFromHeaders(await headers())).label;
  return (
    <main id="main" className="flex-1">
      <div className="awc-container py-10 md:py-16">
        <ResultsStage
          view={view}
          preview={buildPreview(blueprint)}
          price={price}
          privateUrl={privateUrl}
          siteUrl={`${appUrl()}/compatible`}
          locale={locale}
          notice={payment === 'failed' ? t.paymentFailed : payment === 'cancelled' ? t.paymentCancelled : undefined}
        />
      </div>
    </main>
  );
}

export default function ParticipantPage({ params, searchParams }: PageProps<'/compatible/[lang]/s/[token]'>) {
  return (
    <Suspense fallback={<ShellPlaceholder />}>
      <Page params={params} searchParams={searchParams} />
    </Suspense>
  );
}
