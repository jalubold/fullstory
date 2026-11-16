import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CompatFooter, CompatHeader } from '@/components/compat/Shell';
import { RelationChip } from '@/components/compat/Visuals';
import { isLocale, type Locale } from '@/lib/compat/i18n';
import { RETENTION_DAYS } from '@/lib/compat/retention';
import type { Relation } from '@/lib/compat/types';
import { UI } from '@/lib/compat/ui-strings';

const localeOf = (lang: string): Locale => (isLocale(lang) ? lang : 'en');

export async function generateMetadata({ params }: PageProps<'/compatible/[lang]/how-it-works'>): Promise<Metadata> {
  const t = UI[localeOf((await params).lang)].meta;
  return { title: t.how, description: t.howDescription };
}

const RELATION_VALUES: Array<[Relation, string]> = [
  ['shared', '100'],
  ['close', '≈ 75–85'],
  ['complementary', '80'],
  ['different', '45–60'],
  ['tension', '15'],
];

/** One prerendered version per language (generateStaticParams in the layout); opt out of unknown-param validation. */
export const instant = false;

export default async function HowItWorks({ params }: PageProps<'/compatible/[lang]/how-it-works'>) {
  const locale = localeOf((await params).lang);
  const t = UI[locale].how;
  return (
    <>
      <CompatHeader
        locale={locale}
        right={
          <Link href="/compatible/start" className="awc-btn awc-btn-primary min-h-0 px-4 py-2.5 text-sm">
            {UI[locale].shell.start}
          </Link>
        }
      />
      <main id="main" className="flex-1">
        <article className="awc-container max-w-3xl py-12 md:py-20">
          <p className="awc-eyebrow">{t.eyebrow}</p>
          <h1 className="awc-serif mt-4 text-5xl leading-[1.05] md:text-6xl">{t.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-awc-ink-soft">{t.lead}</p>

          <section className="mt-16">
            <h2 className="awc-serif text-3xl">{t.questionsTitle}</h2>
            <p className="mt-4 leading-relaxed text-awc-ink-soft">{t.questionsBody}</p>
          </section>

          <section id="scoring" className="mt-16 scroll-mt-24">
            <h2 className="awc-serif text-3xl">{t.scoringTitle}</h2>
            <p className="mt-4 leading-relaxed text-awc-ink-soft">{t.scoringLead}</p>
            <div className="mt-6 divide-y divide-awc-line overflow-hidden rounded-2xl border border-awc-line bg-white">
              {RELATION_VALUES.map(([r, v]) => (
                <div key={r} className="grid gap-2 p-4 sm:grid-cols-[11rem_4.5rem_1fr] sm:items-baseline sm:gap-4 sm:p-5">
                  <span>
                    <RelationChip relation={r} locale={locale} />
                  </span>
                  <span className="awc-serif text-lg tabular-nums">{v}</span>
                  <span className="text-[0.9375rem] leading-relaxed text-awc-ink-soft">{t.relationNotes[r]}</span>
                </div>
              ))}
            </div>
            <ul className="mt-6 space-y-3 leading-relaxed text-awc-ink-soft">
              {t.rules.map(([strong, rest]) => (
                <li key={strong}>
                  <strong className="text-awc-ink">{strong}</strong> {rest}
                </li>
              ))}
            </ul>
            <p className="mt-6 leading-relaxed text-awc-ink-soft">{t.evidence}</p>
            <p className="mt-6 rounded-2xl bg-awc-cream-2 p-5 text-[0.9375rem] leading-relaxed text-awc-ink-soft">
              <strong className="text-awc-ink">{t.caveatStrong}</strong> {t.caveat}
            </p>
          </section>

          <section id="privacy" className="mt-16 scroll-mt-24">
            <h2 className="awc-serif text-3xl">{t.privacyTitle}</h2>
            <ul className="mt-5 space-y-4 leading-relaxed text-awc-ink-soft">
              {t.privacy(RETENTION_DAYS.open, Math.round(RETENTION_DAYS.complete / 30)).map(([strong, rest]) => (
                <li key={strong}>
                  <strong className="text-awc-ink">{strong}</strong> {rest}
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-16 rounded-[1.75rem] bg-awc-blush-soft p-8 text-center">
            <h2 className="awc-serif text-3xl">{t.ready}</h2>
            <Link href="/compatible/start" className="awc-btn awc-btn-primary mt-6 px-8">
              {t.cta} <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </article>
      </main>
      <CompatFooter locale={locale} />
    </>
  );
}
