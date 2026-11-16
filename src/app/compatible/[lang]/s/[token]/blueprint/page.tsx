import type { Metadata } from 'next';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { BlueprintReport } from '@/components/compat/BlueprintReport';
import { CompatHeader, ShellPlaceholder } from '@/components/compat/Shell';
import { InvalidLink } from '@/components/compat/Stages';
import { isLocale, LOCALE_NAMES, type Locale } from '@/lib/compat/i18n';
import { loadBlueprint, loadView } from '@/lib/compat/server/view';
import { UI } from '@/lib/compat/ui-strings';

const localeOf = (lang: string): Locale => (isLocale(lang) ? lang : 'en');

export async function generateMetadata({ params }: PageProps<'/compatible/[lang]/s/[token]/blueprint'>): Promise<Metadata> {
  return { title: UI[localeOf((await params).lang)].meta.blueprint, robots: { index: false, follow: false }, referrer: 'no-referrer' };
}

async function Report({ params }: { params: Promise<{ lang: string; token: string }> }) {
  // Private, per-request data: never prerendered.
  await connection();
  const { lang, token } = await params;
  const locale = localeOf(lang);
  const found = await loadView(token, locale);
  if (!found) return (
    <>
      <CompatHeader locale={locale} path={`/s/${token}/blueprint`} />
      <InvalidLink locale={locale} />
    </>
  );
  // Access control: both must have finished, and the assessment must be paid for.
  if (found.view.stage !== 'results' || !found.view.unlocked) redirect(`/compatible/s/${token}`);
  const bp = await loadBlueprint(found.ctx, locale);
  if (!bp) redirect(`/compatible/s/${token}`);
  const generated = new Date().toLocaleDateString(LOCALE_NAMES[locale].intl, { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <>
      <CompatHeader locale={locale} path={`/s/${token}/blueprint`} />
      <main id="main" className="flex-1">
        <BlueprintReport bp={bp} token={token} generated={generated} locale={locale} />
      </main>
    </>
  );
}

export default function BlueprintPage({ params }: PageProps<'/compatible/[lang]/s/[token]/blueprint'>) {
  return (
    <Suspense fallback={<ShellPlaceholder tone="wine" />}>
      <Report params={params} />
    </Suspense>
  );
}
