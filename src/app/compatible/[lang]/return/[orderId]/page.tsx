import type { Metadata } from 'next';
import { connection } from 'next/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { RefreshEvery } from '@/components/compat/RefreshEvery';
import { CompatHeader, FlowScreen, ShellPlaceholder } from '@/components/compat/Shell';
import { isLocale, type Locale } from '@/lib/compat/i18n';
import { getCompatOrder, syncCompatOrder } from '@/lib/compat/server/payments';
import { findByToken } from '@/lib/compat/server/repo';
import { rememberedTokens } from '@/lib/compat/server/view';
import { UI } from '@/lib/compat/ui-strings';

const localeOf = (lang: string): Locale => (isLocale(lang) ? lang : 'en');

export async function generateMetadata({ params }: PageProps<'/compatible/[lang]/return/[orderId]'>): Promise<Metadata> {
  return { title: UI[localeOf((await params).lang)].meta.payment, robots: { index: false, follow: false }, referrer: 'no-referrer' };
}

/**
 * Where the payment provider sends the buyer back. The buyer's private link
 * comes from this browser's cookie — it's never given to the provider.
 */
async function Page({ params, searchParams }: { params: Promise<{ lang: string; orderId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Private, per-request data: never prerendered.
  await connection();
  const { lang, orderId } = await params;
  const locale = localeOf(lang);
  return (
    <>
      <CompatHeader locale={locale} path={`/return/${orderId}`} />
      <Return orderId={orderId} searchParams={searchParams} locale={locale} />
    </>
  );
}

async function Return({ orderId, searchParams, locale }: { orderId: string; searchParams: Promise<Record<string, string | string[] | undefined>>; locale: Locale }) {
  const sp = await searchParams;
  const t = UI[locale].checkout;
  let order = await getCompatOrder(orderId);
  if (!order) redirect('/compatible');
  if (!sp.cancelled) order = await syncCompatOrder(order);

  let token: string | null = null;
  for (const tok of await rememberedTokens()) {
    const ctx = await findByToken(tok);
    if (ctx && ctx.assessment.id === order.assessment_id) {
      token = tok;
      break;
    }
  }

  if (order.status === 'paid') {
    if (token) redirect(`/compatible/s/${token}/blueprint`);
    return <Message title={t.paidTitle} body={t.paidBody} cta={t.backHome} />;
  }
  if (sp.cancelled || order.status === 'failed' || order.status === 'cancelled') {
    if (token) redirect(`/compatible/s/${token}?payment=${sp.cancelled ? 'cancelled' : 'failed'}`);
    return <Message title={t.failedTitle} body={t.failedBody} cta={t.backHome} />;
  }
  return (
    <FlowScreen>
      <RefreshEvery ms={2500} />
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="awc-eyebrow">{t.confirmEyebrow}</p>
        <h1 className="awc-serif mt-3 text-4xl">{t.confirmTitle}</h1>
        <p className="mt-3 text-awc-ink-soft">{t.confirmBody}</p>
        <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-awc-blush-soft">
          <div className="awc-pulse h-full w-full bg-awc-wine" />
        </div>
      </div>
    </FlowScreen>
  );
}

function Message({ title, body, cta }: { title: string; body: string; cta: string }) {
  return (
    <FlowScreen>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="awc-serif text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-sm leading-relaxed text-awc-ink-soft">{body}</p>
        <Link href="/compatible" className="awc-btn awc-btn-secondary mt-8">
          {cta}
        </Link>
      </div>
    </FlowScreen>
  );
}

export default function ReturnPage({ params, searchParams }: PageProps<'/compatible/[lang]/return/[orderId]'>) {
  return (
    <Suspense fallback={<ShellPlaceholder />}>
      <Page params={params} searchParams={searchParams} />
    </Suspense>
  );
}
