import type { Metadata } from 'next';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { FlaskConical } from 'lucide-react';
import { CompatHeader, FlowScreen, ShellPlaceholder } from '@/components/compat/Shell';
import { TestCheckout } from '@/components/compat/TestCheckout';
import { isLocale, type Locale } from '@/lib/compat/i18n';
import { formatPrice } from '@/lib/compat/pricing';
import { getCompatOrder } from '@/lib/compat/server/payments';
import { loadView } from '@/lib/compat/server/view';
import { UI } from '@/lib/compat/ui-strings';
import { testPaymentsAllowed } from '@/lib/server/payments';

const localeOf = (lang: string): Locale => (isLocale(lang) ? lang : 'en');

export async function generateMetadata({ params }: PageProps<'/compatible/[lang]/s/[token]/test-checkout'>): Promise<Metadata> {
  return { title: UI[localeOf((await params).lang)].meta.testPayment, robots: { index: false, follow: false }, referrer: 'no-referrer' };
}

async function Page({ params, searchParams }: { params: Promise<{ lang: string; token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Private, per-request data: never prerendered.
  await connection();
  const { lang, token } = await params;
  const locale = localeOf(lang);
  return (
    <>
      <CompatHeader locale={locale} />
      <FlowScreen>
        <h1 className="awc-serif mb-6 text-4xl">{UI[locale].checkout.title}</h1>
        <Content token={token} searchParams={searchParams} locale={locale} />
      </FlowScreen>
    </>
  );
}

async function Content({ token, searchParams, locale }: { token: string; searchParams: Promise<Record<string, string | string[] | undefined>>; locale: Locale }) {
  const sp = await searchParams;
  const t = UI[locale].checkout;
  if (!testPaymentsAllowed() || typeof sp.order !== 'string' || typeof sp.session !== 'string') notFound();
  const found = await loadView(token, locale);
  const order = await getCompatOrder(sp.order);
  if (!found || !order || order.provider !== 'test' || order.assessment_id !== found.view.assessmentId || order.provider_session_id !== sp.session) notFound();
  return (
    <div className="awc-card p-6 sm:p-8">
      <div className="flex items-start gap-3 rounded-2xl bg-awc-amber-soft p-4 text-sm text-awc-amber">
        <FlaskConical size={18} className="mt-0.5 shrink-0" aria-hidden />
        <p>
          <strong>{t.testNoticeStrong}</strong> {t.testNotice}
        </p>
      </div>
      <p className="mt-6 text-sm text-awc-muted">{t.order(order.number)}</p>
      <div className="mt-2 flex items-baseline justify-between border-b border-awc-line pb-4">
        <span className="font-semibold">The Relationship Blueprint</span>
        <span className="awc-serif text-xl">{formatPrice(order.amount_total, order.currency)}</span>
      </div>
      <p className="mt-3 text-sm text-awc-muted">{t.once}</p>
      <div className="mt-6">
        <TestCheckout token={token} orderId={order.id} session={sp.session} locale={locale} />
      </div>
    </div>
  );
}

export default function TestCheckoutPage({ params, searchParams }: PageProps<'/compatible/[lang]/s/[token]/test-checkout'>) {
  return (
    <Suspense fallback={<ShellPlaceholder />}>
      <Page params={params} searchParams={searchParams} />
    </Suspense>
  );
}
