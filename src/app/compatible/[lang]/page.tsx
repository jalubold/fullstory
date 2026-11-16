import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight, EyeOff, Lock, Trash2, UserX } from 'lucide-react';
import { CompatFooter, CompatHeader } from '@/components/compat/Shell';
import { ContinueBanner, PriceTag } from '@/components/compat/LandingDynamic';
import { PersonDot } from '@/components/compat/Visuals';
import { Reveal } from '@/components/motion/Reveal';
import { getContexts } from '@/lib/compat/contexts';
import { isLocale, type Locale } from '@/lib/compat/i18n';
import { getQuestionSet } from '@/lib/compat/questions';
import { UI } from '@/lib/compat/ui-strings';

/** One prerendered version per language (generateStaticParams in the layout); opt out of unknown-param validation. */
export const instant = false;

export default async function CompatLanding({ params }: PageProps<'/compatible/[lang]'>) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : 'en';
  const t = UI[locale].landing;
  const dims = getQuestionSet(undefined, locale).dimensions;
  return (
    <>
      <CompatHeader
        locale={locale}
        right={
          <>
            <Link href="/compatible/how-it-works" className="awc-btn awc-btn-ghost hidden min-h-0 px-3 py-2 text-sm sm:inline-flex">
              {UI[locale].shell.howItWorks}
            </Link>
            <Link href="/compatible/start" className="awc-btn awc-btn-primary min-h-0 px-4 py-2.5 text-sm">
              {UI[locale].shell.start}
            </Link>
          </>
        }
      />
      <main id="main" className="flex-1">
        <Suspense fallback={null}>
          <ContinueBanner locale={locale} />
        </Suspense>

        {/* Hero */}
        <section className="awc-container grid items-center gap-12 pb-16 pt-10 md:grid-cols-[1.05fr_0.95fr] md:gap-10 md:pb-24 md:pt-20">
          <div className="awc-anim-in">
            <p className="awc-eyebrow">{t.eyebrow}</p>
            <h1 className="awc-serif mt-5 text-[2.6rem] leading-[1.04] text-awc-ink sm:text-6xl lg:text-[4.4rem]">
              {t.h1a}
              <br />
              {t.h1b}
              <br />
              <em className="text-awc-wine">{t.h1c}</em>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-awc-ink-soft">{t.lead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/compatible/start" className="awc-btn awc-btn-primary px-7 text-base">
                {t.cta} <ArrowRight size={18} aria-hidden />
              </Link>
              <Link href="/compatible/how-it-works" className="awc-btn awc-btn-ghost">
                {t.seeHow}
              </Link>
            </div>
            <p className="mt-5 text-sm text-awc-muted">{t.facts}</p>
          </div>
          <HeroPreview locale={locale} />
        </section>

        {/* How it works */}
        <section className="border-y border-awc-line bg-white/60">
          <div className="awc-container py-16 md:py-24">
            <Reveal>
              <p className="awc-eyebrow">{t.howEyebrow}</p>
              <h2 className="awc-serif mt-3 max-w-2xl text-4xl leading-tight md:text-5xl">{t.howTitle}</h2>
            </Reveal>
            <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {t.steps.map(([title, body], i) => (
                <Reveal as="li" key={title} delay={i * 90} className="border-t border-awc-line-strong pt-6">
                  <span className="awc-numeral text-5xl">0{i + 1}</span>
                  <h3 className="awc-serif mt-4 text-2xl">{title}</h3>
                  <p className="mt-2 leading-relaxed text-awc-ink-soft">{body}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Five dimensions */}
        <section className="awc-container py-16 md:py-24">
          <Reveal className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-end">
            <div>
              <p className="awc-eyebrow">{t.dimsEyebrow}</p>
              <h2 className="awc-serif mt-3 text-4xl leading-tight md:text-5xl">{t.dimsTitle}</h2>
            </div>
            <p className="text-lg leading-relaxed text-awc-ink-soft">{t.dimsLead}</p>
          </Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-awc-line bg-awc-line sm:grid-cols-2 lg:grid-cols-5">
            {dims.map((d, i) => (
              <Reveal key={d.id} delay={i * 70} className="bg-awc-cream p-6 md:p-7">
                <span className="awc-numeral text-3xl">{['i', 'ii', 'iii', 'iv', 'v'][i]}</span>
                <h3 className="awc-serif mt-5 text-xl leading-snug">{d.label}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-awc-muted">{d.description}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Not just a score */}
        <section className="bg-awc-wine-deep text-white">
          <div className="awc-container grid gap-12 py-16 md:grid-cols-2 md:py-24">
            <Reveal>
              <p className="awc-eyebrow !text-awc-blush">{t.scoreEyebrow}</p>
              <h2 className="awc-serif mt-3 text-4xl leading-tight md:text-5xl">
                {t.scoreTitleA} <em className="text-awc-blush">{t.scoreTitleB}</em>
              </h2>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-white/75">{t.scoreLead}</p>
            </Reveal>
            <Reveal delay={120} className="grid content-center gap-3">
              {t.relations.map(([title, desc]) => (
                <div key={title} className="flex items-baseline justify-between gap-6 border-b border-white/15 pb-3">
                  <span className="awc-serif text-xl">{title}</span>
                  <span className="text-right text-sm text-white/65">{desc}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* The Blueprint */}
        <section className="awc-container py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:gap-16">
            <Reveal>
              <p className="awc-eyebrow">{t.bpEyebrow}</p>
              <h2 className="awc-serif mt-3 text-4xl leading-tight md:text-5xl">{t.bpTitle}</h2>
              <p className="mt-5 text-lg leading-relaxed text-awc-ink-soft">{t.bpLead}</p>
              <ul className="mt-6 space-y-2.5 text-awc-ink-soft">
                {t.bpBullets.map((x) => (
                  <li key={x} className="flex gap-3">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-awc-wine" />
                    {x}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Suspense fallback={<span className="awc-serif text-4xl">{locale === 'id' ? 'Rp39.000' : '$9.99'}</span>}>
                  <PriceTag className="awc-serif text-4xl" />
                </Suspense>
                <span className="text-awc-muted">{t.perCouple}</span>
              </div>
            </Reveal>
            <Reveal delay={100} className="awc-card p-6 md:p-8">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-awc-muted">{t.contents}</p>
              <ol className="mt-4 divide-y divide-awc-line">
                {t.sections.map((s, i) => (
                  <li key={s} className="flex items-baseline gap-4 py-2.5">
                    <span className="awc-numeral w-7 text-lg">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 text-[0.9375rem] text-awc-ink">{s}</span>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        {/* Stages */}
        <section className="border-y border-awc-line bg-white/60">
          <div className="awc-container py-14 text-center md:py-20">
            <Reveal>
              <p className="awc-eyebrow">{t.stagesEyebrow}</p>
              <h2 className="awc-serif mx-auto mt-3 max-w-2xl text-3xl leading-tight md:text-4xl">{t.stagesTitle}</h2>
              <div className="mt-8 flex flex-wrap justify-center gap-2.5">
                {getContexts(locale).map((c) => (
                  <span key={c.id} className="rounded-full border border-awc-line-strong bg-white px-4 py-2 text-sm text-awc-ink-soft">
                    {c.label}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Privacy */}
        <section className="awc-container py-16 md:py-24">
          <Reveal>
            <p className="awc-eyebrow">{t.privacyEyebrow}</p>
            <h2 className="awc-serif mt-3 max-w-2xl text-4xl leading-tight md:text-5xl">{t.privacyTitle}</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.privacy.map(([title, body], i) => {
              const I = [EyeOff, UserX, Lock, Trash2][i];
              return (
                <Reveal key={title} delay={i * 70} className="rounded-2xl border border-awc-line bg-white p-6">
                  <I size={22} className="text-awc-wine" aria-hidden />
                  <h3 className="awc-serif mt-4 text-xl">{title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-awc-muted">{body}</p>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="awc-container pb-20 md:pb-28">
          <Reveal className="rounded-[2rem] bg-awc-blush-soft px-6 py-14 text-center md:py-20">
            <h2 className="awc-serif mx-auto max-w-2xl text-4xl leading-tight md:text-5xl">
              {t.finalTitleA} <em className="text-awc-wine">{t.finalTitleEm}</em> {t.finalTitleB}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-awc-ink-soft">{t.finalLead}</p>
            <Link href="/compatible/start" className="awc-btn awc-btn-primary mt-8 px-8 text-base">
              {t.finalCta} <ArrowRight size={18} aria-hidden />
            </Link>
          </Reveal>
        </section>
      </main>
      <CompatFooter locale={locale} />
    </>
  );
}

/** Editorial mock of a result: two answers to the same question, and the headline that follows. */
function HeroPreview({ locale }: { locale: Locale }) {
  const p = UI[locale].landing.preview;
  return (
    <div className="relative mx-auto w-full max-w-md md:max-w-none" aria-hidden>
      <div className="awc-card awc-anim-in relative z-10 p-6 md:p-7" style={{ animationDelay: '120ms' }}>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-awc-muted">{p.question}</p>
        <p className="awc-serif mt-3 text-[1.45rem] leading-snug">{p.prompt}</p>
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center gap-3 rounded-2xl border border-awc-wine/40 bg-awc-blush-soft/50 px-4 py-3">
            <PersonDot role="a" name="Maya" size="sm" />
            <span className="text-sm text-awc-ink">{p.a}</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-awc-slate/30 bg-awc-slate-soft/60 px-4 py-3">
            <PersonDot role="b" name="Daniel" size="sm" />
            <span className="text-sm text-awc-ink">{p.b}</span>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-awc-ink-soft">
          <span className="font-semibold text-awc-ink">{p.noteStrong}</span> {p.note}
        </p>
      </div>
      <div className="awc-anim-in relative z-20 -mt-6 ml-auto w-[82%] rounded-[1.5rem] bg-awc-wine-deep p-6 text-white shadow-[var(--shadow-awc-lift)] md:-mt-10 md:w-[78%]" style={{ animationDelay: '280ms' }}>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-awc-blush">Maya & Daniel</p>
        <p className="awc-serif mt-2 text-3xl">{p.signature}</p>
        <p className="mt-1 text-sm text-white/70">{p.tagline}</p>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div className="space-y-2">
            {[68, 57, 78, 90, 73].map((v, i) => (
              <div key={p.dims[i]} className="flex items-center gap-3">
                <span className="w-24 text-xs text-white/70">{p.dims[i]}</span>
                <span className="h-1.5 w-20 overflow-hidden rounded-full bg-white/15 sm:w-28">
                  <span className="block h-full rounded-full bg-awc-blush" style={{ width: `${v}%` }} />
                </span>
              </div>
            ))}
          </div>
          <div className="text-right">
            <p className="awc-serif text-5xl leading-none">
              73<span className="text-2xl text-white/60">%</span>
            </p>
            <p className="mt-1 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-white/60">{p.aligned}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
