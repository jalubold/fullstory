import type { Metadata } from 'next';
import { CompatHeader, FlowScreen } from '@/components/compat/Shell';
import { StartFlow } from '@/components/compat/StartFlow';
import { getContexts } from '@/lib/compat/contexts';
import { isLocale, type Locale } from '@/lib/compat/i18n';
import { UI } from '@/lib/compat/ui-strings';

const localeOf = (lang: string): Locale => (isLocale(lang) ? lang : 'en');

export async function generateMetadata({ params }: PageProps<'/compatible/[lang]/start'>): Promise<Metadata> {
  return { title: UI[localeOf((await params).lang)].meta.start };
}

/** One prerendered version per language (generateStaticParams in the layout); opt out of unknown-param validation. */
export const instant = false;

export default async function StartPage({ params }: PageProps<'/compatible/[lang]/start'>) {
  const locale = localeOf((await params).lang);
  return (
    <>
      <CompatHeader locale={locale} path="/start" />
      <FlowScreen>
        <StartFlow locale={locale} contexts={getContexts(locale).map(({ id, label, hint }) => ({ id, label, hint }))} />
      </FlowScreen>
    </>
  );
}
