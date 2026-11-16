import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight, Check, Plus } from 'lucide-react';
import { SignatureGlyph, Venn, VennMark } from '@/components/compat/Brand';
import { CompatFooter, CompatHeader } from '@/components/compat/Shell';
import { ContinueBanner, PriceTag } from '@/components/compat/LandingDynamic';
import { StickyCta } from '@/components/compat/StickyCta';
import { TryIt } from '@/components/compat/TryIt';
import { DimensionSheets } from '@/components/compat/DimensionSheets';
import { Barcode, Box, Envelopes, HandArrow, Marked, StageCircles, Stamp, Tape, Tick, ZigzagEdge, ZodiacNo } from '@/components/compat/Doodles';
import { initial } from '@/components/compat/initial';
import { PersonDot, RelationChip } from '@/components/compat/Visuals';
import { Reveal } from '@/components/motion/Reveal';
import { getContexts } from '@/lib/compat/contexts';
import { isLocale, type Locale } from '@/lib/compat/i18n';
import { dimensionSheets, firstSentence, RELATION_SCALE, scoreExamples, type PairExample } from '@/lib/compat/landing';
import { horizonLabels, signatures } from '@/lib/compat/report';
import { citeShort } from '@/lib/compat/research';
import { RETENTION_DAYS } from '@/lib/compat/retention';
import { sampleBlueprint } from '@/lib/compat/sample';
import { tryQuestion } from '@/lib/compat/tryit';
import type { SignatureId } from '@/lib/compat/types';
import { UI } from '@/lib/compat/ui-strings';

/** One prerendered version per language (generateStaticParams in the layout); opt out of unknown-param validation. */
export const instant = false;

const SIGNATURE_ORDER: SignatureId[] = ['mirror', 'puzzle', 'anchors', 'bridge', 'explorers', 'conversation', 'balanced'];
/** Each card rests at a slightly different angle. */
const TILTS = [-2, 1.5, -1, 2.2, 1.6, -1.8, 1, -1.4];

export default async function CompatLanding({ params }: PageProps<'/compatible/[lang]'>) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : 'en';
  const t = UI[locale].landing;
  const sample = sampleBlueprint(locale);
  const scores = scoreExamples(locale);
  const sci = UI[locale].science;
  return (
    <>
      <CompatHeader
        locale={locale}
        right={
          <>
            <Link href="/compatible/how-it-works" className="awc-btn awc-btn-ghost hidden min-h-0 px-3 py-2 text-sm md:inline-flex">
              {UI[locale].shell.howItWorks}
            </Link>
            <Link href="/compatible/start" className="awc-btn awc-btn-primary hidden min-h-0 px-4 py-2.5 text-sm sm:inline-flex">
              {UI[locale].shell.start}
            </Link>
          </>
        }
      />
      <main id="main" className="flex-1 overflow-x-clip">
        <Suspense fallback={null}>
          <ContinueBanner locale={locale} />
        </Suspense>

        {/* ───────── Hero ───────── */}
        <section className="relative">
          <div aria-hidden className="awc-grain pointer-events-none absolute inset-0 [mask-image:linear-gradient(180deg,#000_40%,transparent)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <span className="awc-drift-a absolute -right-28 -top-24 h-[30rem] w-[30rem] rounded-full border border-awc-wine/15" />
            <span className="awc-drift-b absolute -top-10 right-24 h-[30rem] w-[30rem] rounded-full border border-awc-slate/15" />
          </div>
          <div className="awc-container relative grid gap-x-14 gap-y-7 pb-16 pt-7 sm:gap-y-9 md:pb-24 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.94fr)] lg:gap-y-0 lg:pt-20">
            <div className="awc-anim-in lg:col-start-1 lg:row-start-1 lg:self-end">
              <div className="flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-2 text-[0.7188rem] font-semibold uppercase tracking-[0.18em] text-awc-wine-dark">
                  <VennMark size={13} />
                  {t.eyebrow}
                </p>
                {/* Phones: the play card comes first, so keep a direct way to start within reach. */}
                <Link href="/compatible/start" className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-awc-wine-dark sm:hidden">
                  {UI[locale].shell.start} <ArrowRight size={15} aria-hidden />
                </Link>
              </div>
              <h1 className="awc-serif mt-5 text-balance text-[2.6rem] leading-[1.06] tracking-[-0.022em] text-awc-ink sm:mt-6 sm:text-[3.8rem] lg:text-[4.35rem]">
                {t.h1[0]}
                <Marked kind="strike" delay={600}>
                  <em className="text-awc-ink-soft">{t.h1[1]}</em>
                </Marked>
                {t.h1[2]}
              </h1>
              <p className="mt-6 hidden max-w-[34rem] text-pretty text-lg leading-relaxed text-awc-ink-soft sm:block md:text-xl">{t.lead}</p>
            </div>

            {/* Play: answer one real question, then guess theirs */}
            <div className="awc-anim-in relative mx-auto w-full max-w-[33rem] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:ml-auto lg:self-center" style={{ animationDelay: '140ms' }}>
              <div aria-hidden className="absolute -top-12 left-6 hidden items-end gap-1 lg:flex">
                <span className="awc-serif -rotate-3 text-[1.1rem] italic text-awc-wine">{t.tryNote}</span>
                <HandArrow className="h-10 w-14 rotate-[18deg] text-awc-wine" delay={1700} />
              </div>
              <TryIt locale={locale} question={tryQuestion(locale)} />
            </div>

            <div className="awc-anim-in lg:col-start-1 lg:row-start-2 lg:self-start lg:pt-9" style={{ animationDelay: '80ms' }}>
              <p className="mb-6 text-pretty text-lg leading-relaxed text-awc-ink-soft sm:hidden">{t.lead}</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <Link id="hero-cta" href="/compatible/start" className="awc-btn awc-btn-primary awc-cta-glow min-h-14 px-8 text-[1.0625rem]">
                  {t.cta} <ArrowRight size={19} aria-hidden />
                </Link>
                <p className="text-center text-[0.875rem] leading-snug text-awc-muted sm:max-w-[13rem] sm:text-left">{t.ctaNote}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── Topics marquee ───────── */}
        <section aria-label={t.topicsLabel} className="border-y border-awc-line bg-white/70 py-5">
          <div className="awc-marquee-wrap overflow-hidden">
            <div className="awc-marquee">
              {[0, 1].map((k) => (
                <ul key={k} aria-hidden={k === 1} className="flex shrink-0 items-center gap-3 pr-3">
                  {t.topics.map((x) => (
                    <li key={x} className="flex items-center gap-3 whitespace-nowrap">
                      <span className="awc-serif text-[1.35rem] italic text-awc-ink">{x}</span>
                      <VennMark size={11} className="opacity-70" />
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Seven signatures ───────── */}
        <section className="awc-container py-20 md:py-28">
          <Reveal className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
            <div>
              <p className="awc-eyebrow">{t.types.eyebrow}</p>
              <h2 className="awc-serif mt-3 text-balance text-4xl leading-[1.08] md:text-[3.4rem]">{t.types.title}</h2>
            </div>
            <p className="text-pretty text-lg leading-relaxed text-awc-ink-soft">{t.types.lead}</p>
          </Reveal>
          <div className="awc-snap mt-12 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0">
            {SIGNATURE_ORDER.map((id, i) => {
              const sig = signatures(locale)[id];
              return (
                <Reveal key={id} delay={i * 60} className="w-[62%] sm:w-[36%] lg:w-auto">
                  <article className="awc-type-card flex h-full flex-col rounded-[1.5rem] border border-awc-line bg-white p-4 shadow-[var(--shadow-awc-card)]" style={{ '--tilt': `${TILTS[i]}deg` } as React.CSSProperties}>
                    <div className="flex aspect-[10/7] items-center justify-center rounded-[1.1rem] bg-awc-cream-2/70">
                      <SignatureGlyph id={id} />
                    </div>
                    <p className="awc-numeral mt-4 text-base">{String(i + 1).padStart(2, '0')}</p>
                    <h3 className="awc-serif mt-1 text-[1.3rem] leading-tight">{sig.title}</h3>
                    <p className="mt-1.5 text-[0.875rem] leading-snug text-awc-muted">{sig.tagline}</p>
                  </article>
                </Reveal>
              );
            })}
            <Reveal delay={7 * 60} className="w-[62%] sm:w-[36%] lg:w-auto">
              <Link href="/compatible/start" className="awc-type-card group flex h-full flex-col rounded-[1.5rem] bg-awc-wine-deep p-4 text-white shadow-[var(--shadow-awc-card)]" style={{ '--tilt': `${TILTS[7]}deg` } as React.CSSProperties}>
                <div className="flex aspect-[10/7] items-center justify-center rounded-[1.1rem] bg-white/[0.06]">
                  <Venn names={{ a: null, b: null }} overlap={46} pending="both" size={132} tone="dark" />
                </div>
                <p className="awc-serif mt-4 text-[1.5rem] italic leading-tight text-awc-blush">{t.types.mystery}</p>
                <p className="mt-1.5 text-[0.875rem] leading-snug text-white/70">{t.types.mysteryBody}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold">
                  {t.types.mysteryCta} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ───────── How it works ───────── */}
        <section className="border-y border-awc-line bg-white/60">
          <div className="awc-container py-20 md:py-28">
          <Reveal className="max-w-2xl">
            <p className="awc-eyebrow">{t.howEyebrow}</p>
            <h2 className="awc-serif mt-3 text-balance text-4xl leading-[1.08] md:text-[3.4rem]">{t.howTitle}</h2>
          </Reveal>
          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {t.steps.map(([title, body], i) => (
              <Reveal as="li" key={title} delay={i * 110} className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-awc-line bg-white shadow-[var(--shadow-awc-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-awc-lift)]">
                <div className="flex h-48 items-center justify-center bg-awc-cream-2/70 px-6">
                  <StepVisual step={i} locale={locale} />
                </div>
                <div className="p-6 md:p-7">
                  <span className="awc-numeral text-4xl">0{i + 1}</span>
                  <h3 className="awc-serif mt-3 text-[1.6rem] leading-tight">{title}</h3>
                  <p className="mt-2 leading-relaxed text-awc-ink-soft">{body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          </div>
        </section>

        {/* ───────── Five dimensions: a questionnaire filled in by two pens ───────── */}
        <section className="overflow-x-clip">
          <div className="awc-container py-20 md:py-28">
            <Reveal className="max-w-3xl">
              <p className="awc-eyebrow">{t.dimsEyebrow}</p>
              <h2 className="awc-serif mt-3 text-balance text-4xl leading-[1.08] md:text-[3.4rem]">{t.dimsTitle}</h2>
              <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-awc-ink-soft">{t.dimsLead}</p>
            </Reveal>
            <DimensionSheets
              sheets={dimensionSheets(locale).map((x) => ({ ...x, countLabel: t.sheet.questions(x.count) }))}
              names={sample.names}
              strings={{ tabs: t.sheet.tabs, no: t.sheet.no, read: t.sheet.read, also: t.sheet.also, next: t.sheet.next }}
            />
          </div>
        </section>

        {/* ───────── Not just a score: same can score lower than different ───────── */}
        <section className="relative overflow-hidden bg-awc-wine-deep text-white">
          <svg aria-hidden viewBox="0 0 600 400" className="pointer-events-none absolute -right-40 -top-24 w-[720px] opacity-[0.07]">
            <circle cx="230" cy="200" r="170" fill="none" stroke="#fff" strokeWidth="2" />
            <circle cx="370" cy="200" r="170" fill="none" stroke="#fff" strokeWidth="2" />
          </svg>
          <div className="awc-container relative py-20 md:py-28">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-center lg:gap-16">
              <Reveal>
                <p className="awc-eyebrow !text-awc-blush">{t.scoreEyebrow}</p>
                <h2 className="awc-serif mt-3 text-balance text-4xl leading-[1.08] md:text-[3.4rem]">
                  {t.scoreTitleA} <em className="text-awc-blush">{t.scoreTitleB}</em>
                </h2>
                <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-white/75">{t.scoreLead}</p>
              </Reveal>
              <Reveal delay={120} className="grid gap-6 pt-3 sm:grid-cols-2 sm:gap-5">
                <ScoreCase title={t.scoreSame} ex={scores.same} names={sample.names} tilt={-1.4} />
                <ScoreCase title={t.scoreDiff} ex={scores.different} names={sample.names} tilt={1.2} />
              </Reveal>
            </div>
            <Reveal className="mx-auto mt-16 max-w-4xl md:mt-20">
              <p className="awc-serif mx-auto max-w-xl text-balance text-center text-[1.3rem] italic leading-snug text-awc-blush md:text-[1.6rem]">{t.scoreCaption}</p>
              <ScoreScale labels={t.relations} />
              <p className="mt-3 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-white/50">{t.scaleLabel}</p>
            </Reveal>
          </div>
        </section>

        {/* ───────── The science: the findings the scoring is built on ───────── */}
        <section className="awc-graph border-b border-awc-line">
          <div className="awc-container grid gap-12 py-20 md:py-28 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-16">
            <Reveal className="lg:sticky lg:top-28 lg:self-start">
              <p className="awc-eyebrow">{sci.eyebrow}</p>
              <h2 className="awc-serif mt-3 text-balance text-4xl leading-[1.08] md:text-[3.4rem]">
                {sci.title[0]}
                <Marked kind="underline" delay={350}>
                  {sci.title[1]}
                </Marked>
                {sci.title[2]}
              </h2>
              <p className="mt-5 max-w-md text-pretty text-lg leading-relaxed text-awc-ink-soft">{sci.lead}</p>
              <ZodiacNo className="mt-8 h-36 w-36 -rotate-6 md:h-44 md:w-44" />
              <p className="mt-8 max-w-md border-l-2 border-awc-wine pl-4 text-[0.9375rem] leading-relaxed text-awc-ink-soft">
                <strong className="text-awc-ink">{sci.caveatStrong}</strong> {sci.caveat}
              </p>
              <Link href="/compatible/how-it-works#research" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-awc-wine-dark hover:text-awc-wine">
                {sci.more} <ArrowRight size={15} aria-hidden />
              </Link>
            </Reveal>
            <ol className="grid gap-x-10 sm:grid-cols-2">
              {sci.findings.slice(0, 4).map(([title, finding, use], i) => (
                <Reveal as="li" key={title} delay={i * 80} className="border-t border-awc-ink/15 py-7 first:border-t-0 sm:[&:nth-child(2)]:border-t-0">
                  <p className="flex items-baseline justify-between gap-4">
                    <span className="awc-numeral text-[2.2rem]">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-right font-mono text-[0.625rem] uppercase leading-snug tracking-[0.12em] text-awc-muted">{citeShort(i)}</span>
                  </p>
                  <h3 className="awc-serif mt-3 text-[1.3rem] leading-snug text-awc-ink">{title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-awc-ink-soft">{finding}</p>
                  <p className="mt-4 rounded-md bg-white/85 p-3 text-[0.875rem] leading-relaxed text-awc-ink shadow-[0_1px_0_rgb(52_37_42/0.06)]">
                    <span className="awc-serif mb-0.5 block text-[0.95rem] italic text-awc-wine">{sci.use} →</span>
                    {use}
                  </p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ───────── Inside the Blueprint: real pages from a sample couple ───────── */}
        <section className="overflow-x-clip">
          <div className="awc-container py-20 md:py-28">
            <Reveal className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
              <div>
                <p className="awc-eyebrow">{t.showcaseEyebrow}</p>
                <h2 className="awc-serif mt-3 text-balance text-4xl leading-[1.08] md:text-[3.4rem]">{t.showcaseTitle}</h2>
              </div>
              <p className="text-pretty text-lg leading-relaxed text-awc-ink-soft">{t.showcaseLead}</p>
            </Reveal>
            <Showcase locale={locale} />
          </div>
        </section>

        {/* ───────── Free vs Blueprint ───────── */}
        <section className="border-y border-awc-line bg-white/60">
          <div className="awc-container py-20 md:py-28">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="awc-eyebrow">{t.compareEyebrow}</p>
              <h2 className="awc-serif mt-3 text-balance text-4xl leading-[1.08] md:text-[3.4rem]">{t.compareTitle}</h2>
            </Reveal>
            <div className="mx-auto mt-14 grid max-w-5xl items-stretch gap-6 md:grid-cols-[0.85fr_1.15fr]">
              <Reveal className="flex flex-col rounded-[1.75rem] border border-awc-line bg-awc-cream p-7 md:p-9">
                <h3 className="awc-serif text-2xl">{t.free.title}</h3>
                <p className="awc-serif mt-4 text-5xl">{t.free.price}</p>
                <ul className="mt-7 space-y-3">
                  {t.free.items.map((x) => (
                    <li key={x} className="flex gap-3 text-[0.9688rem] text-awc-ink-soft">
                      <Check size={18} className="mt-0.5 shrink-0 text-awc-sage" aria-hidden />
                      {x}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-10">
                  <Link href="/compatible/start" className="awc-btn awc-btn-secondary w-full">
                    {t.free.cta}
                  </Link>
                </div>
              </Reveal>
              <Reveal delay={100} className="relative flex flex-col overflow-hidden rounded-[1.75rem] bg-awc-wine-deep p-7 text-white shadow-[var(--shadow-awc-lift)] md:p-9">
                <svg aria-hidden viewBox="0 0 300 200" className="pointer-events-none absolute -bottom-16 -right-16 w-80 opacity-10">
                  <circle cx="115" cy="100" r="85" fill="none" stroke="#fff" strokeWidth="2" />
                  <circle cx="185" cy="100" r="85" fill="none" stroke="#fff" strokeWidth="2" />
                </svg>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="awc-serif text-2xl">{t.premium.title}</h3>
                  <span className="rounded-full bg-awc-blush px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-awc-wine-deep">{t.premium.badge}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-baseline gap-x-3">
                  <Suspense fallback={<span className="awc-serif text-5xl">{locale === 'id' ? 'Rp39.000' : '$9.99'}</span>}>
                    <PriceTag className="awc-serif text-5xl" />
                  </Suspense>
                  <span className="text-white/65">{t.perCouple}</span>
                </div>
                <ul className="relative mt-7 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {t.premium.items.map((x) => (
                    <li key={x} className="flex gap-3 text-[0.9375rem] text-white/85">
                      <Check size={18} className="mt-0.5 shrink-0 text-awc-blush" aria-hidden />
                      {x}
                    </li>
                  ))}
                </ul>
                <p className="relative mt-auto pt-8 text-[0.875rem] leading-relaxed text-white/65">{t.premium.note}</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ───────── Stages: two circles drawing closer ───────── */}
        <section className="awc-container py-20 md:py-28">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="awc-eyebrow">{t.stagesEyebrow}</p>
            <h2 className="awc-serif mx-auto mt-3 text-balance text-3xl leading-tight md:text-[2.6rem]">{t.stagesTitle}</h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-awc-ink-soft">{t.stagesLead}</p>
          </Reveal>
          <ol className="relative mx-auto mt-12 max-w-5xl md:mt-16 md:grid md:grid-cols-5 md:gap-5">
            <span aria-hidden className="absolute bottom-12 left-[3.25rem] top-12 border-l border-dashed border-awc-line-strong md:hidden" />
            <svg aria-hidden viewBox="0 0 1000 40" preserveAspectRatio="none" className="absolute inset-x-[8%] top-7 hidden h-10 w-[84%] md:block">
              <path d="M0 22 C 120 4, 220 36, 330 20 S 560 4, 670 22 S 880 36, 1000 16" fill="none" stroke="var(--color-awc-line-strong)" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
            </svg>
            {getContexts(locale).map((c, i) => (
              <Reveal as="li" key={c.id} delay={i * 90} className="relative grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-4 py-3.5 md:block md:py-0 md:text-center">
                <span className="relative z-10 mx-auto flex h-20 w-[6.5rem] items-center justify-center bg-awc-cream md:h-24 md:w-36">
                  <StageCircles gap={STAGE_GAPS[i] ?? 30} dashed={c.id === 'other'} className="h-[4.25rem] w-[7.5rem] md:h-24 md:w-36" />
                </span>
                <div className="md:mt-4">
                  <h3 className="awc-serif text-[1.25rem] leading-tight">{c.label}</h3>
                  <p className="mt-1 text-[0.8125rem] leading-snug text-awc-muted">{c.hint}</p>
                  <p className="mt-3 border-t border-dashed border-awc-line-strong pt-2.5 md:mx-auto md:max-w-[11rem]">
                    <span className="block font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-awc-muted">{t.ritual}</span>
                    <span className="awc-serif mt-0.5 block text-[1rem] italic leading-snug text-awc-wine-dark">{c.ritual.title}</span>
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* ───────── Privacy: sealed envelopes and a receipt ───────── */}
        <section className="border-y border-awc-line bg-awc-cream-2/50">
          <div className="awc-container grid gap-14 py-20 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center lg:gap-20">
            <Reveal>
              <p className="awc-eyebrow">{t.privacyEyebrow}</p>
              <h2 className="awc-serif mt-3 text-balance text-4xl leading-[1.08] md:text-[3.2rem]">{t.privacyTitle}</h2>
              <Envelopes initials={{ a: initial(sample.names.a), b: initial(sample.names.b) }} className="mt-10 w-full max-w-[26rem]" />
              <p className="awc-serif mt-5 max-w-sm text-pretty text-[1.2rem] italic leading-snug text-awc-ink-soft">{t.envelopes}</p>
            </Reveal>
            <Reveal delay={120} className="mx-auto w-full max-w-[25rem] lg:mr-0">
              <Receipt locale={locale} />
            </Reveal>
          </div>
        </section>

        {/* ───────── FAQ ───────── */}
        <section className="border-t border-awc-line bg-white/60">
          <div className="awc-container grid gap-10 py-20 md:py-28 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              <h2 className="awc-serif text-balance text-4xl leading-[1.08] md:text-[3rem]">{t.faqTitle}</h2>
            </Reveal>
            <Reveal delay={80} className="divide-y divide-awc-line border-y border-awc-line">
              {t.faq.map(([q, a]) => (
                <details key={q} className="awc-faq group py-1">
                  <summary className="flex items-center justify-between gap-6 py-4 text-left">
                    <span className="awc-serif text-[1.2rem] leading-snug text-awc-ink md:text-[1.35rem]">{q}</span>
                    <span className="awc-faq-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-awc-line-strong text-awc-wine transition-transform duration-300">
                      <Plus size={16} aria-hidden />
                    </span>
                  </summary>
                  <p className="pb-5 pr-12 leading-relaxed text-awc-ink-soft">{a}</p>
                </details>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ───────── Final CTA ───────── */}
        <section className="relative overflow-hidden bg-awc-wine-deep text-white">
          <svg aria-hidden viewBox="0 0 600 400" className="pointer-events-none absolute left-1/2 top-1/2 w-[900px] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.08]">
            <circle cx="230" cy="200" r="170" fill="none" stroke="#fff" strokeWidth="1.5" />
            <circle cx="370" cy="200" r="170" fill="none" stroke="#fff" strokeWidth="1.5" />
          </svg>
          <Reveal className="awc-container relative py-24 text-center md:py-32">
            <p className="awc-eyebrow !text-awc-blush">{t.finalEyebrow}</p>
            <h2 className="awc-serif mx-auto mt-4 max-w-3xl text-balance text-[2.6rem] leading-[1.05] md:text-[4rem]">
              {t.finalTitleA} <em className="text-awc-blush">{t.finalTitleEm}</em> {t.finalTitleB}
            </h2>
            <p className="mx-auto mt-5 max-w-md text-lg text-white/75">{t.finalLead}</p>
            <Link id="final-cta" href="/compatible/start" className="awc-btn awc-btn-light mt-10 min-h-14 px-9 text-[1.0625rem]">
              {t.finalCta} <ArrowRight size={19} aria-hidden />
            </Link>
          </Reveal>
        </section>
      </main>
      <CompatFooter locale={locale} />
      <StickyCta label={t.cta} watchId="hero-cta" hideNearId="final-cta" />
    </>
  );
}

/** Small UI vignettes for the three steps. */
function StepVisual({ step, locale }: { step: number; locale: Locale }) {
  const v = UI[locale].landing.stepVisual;
  if (step === 0) {
    return (
      <div className="w-full max-w-[16rem] space-y-2 transition-transform duration-500 group-hover:-translate-y-1">
        <div className="flex items-center gap-3 rounded-xl border border-awc-line bg-white px-3 py-2.5 opacity-60">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-awc-line-strong text-[0.5625rem] font-bold text-awc-muted">A</span>
          <span className="h-2 w-28 rounded-full bg-awc-line" />
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-awc-wine bg-awc-blush-soft/70 px-3 py-2.5 shadow-[0_0_0_3px_rgb(169_77_101/0.12)]">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-awc-wine text-white">
            <Check size={11} strokeWidth={3} aria-hidden />
          </span>
          <span className="text-[0.75rem] leading-tight text-awc-ink">{v.option}</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-awc-line bg-white px-3 py-2.5 opacity-60">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-awc-line-strong text-[0.5625rem] font-bold text-awc-muted">C</span>
          <span className="h-2 w-20 rounded-full bg-awc-line" />
        </div>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="w-full max-w-[16.5rem] rounded-2xl bg-[#e9e2d6] p-3 transition-transform duration-500 group-hover:-translate-y-1">
        <div className="ml-auto max-w-[92%] rounded-xl rounded-tr-sm bg-[#d9f6c8] px-3 py-2 text-[0.75rem] leading-snug text-[#1d2b1d] shadow-sm">
          <p className="text-[0.625rem] font-bold text-[#1f8f4e]">{v.chatFrom}</p>
          {v.chat}
          <p className="mt-1 text-right text-[0.5625rem] text-[#5f6f5f]">{v.chatTime} ✓✓</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center transition-transform duration-500 group-hover:-translate-y-1">
      <Venn names={{ a: 'A', b: 'B' }} overlap={62} size={170} />
      <span className="awc-chip -mt-1 bg-awc-sage-soft text-awc-sage">
        <Check size={12} aria-hidden /> {v.done}
      </span>
    </div>
  );
}

/** Tiny Venn glyphs illustrating each kind of answer pair. */
function MiniVenn({ kind }: { kind: number }) {
  const d = [0, 14, 18, 30, 0][kind];
  const stroke = 'rgb(255 255 255 / 0.85)';
  return (
    <svg width="44" height="28" viewBox="0 0 44 28" className="shrink-0" aria-hidden>
      <circle cx={22 - d / 2} cy="14" r="11" fill="none" stroke={stroke} strokeWidth="1.5" strokeDasharray={kind === 3 ? '3 3' : undefined} />
      <circle cx={22 + d / 2} cy="14" r="11" fill={kind === 0 || kind === 4 ? 'rgb(232 198 204 / 0.35)' : 'none'} stroke={kind === 4 ? 'var(--color-awc-amber-soft)' : stroke} strokeWidth="1.5" strokeDasharray={kind === 3 ? '3 3' : undefined} />
      {kind === 4 && <text x="22" y="18" textAnchor="middle" fontSize="11" fill="var(--color-awc-amber-soft)">!</text>}
    </svg>
  );
}

/** Where each relationship stage puts the two circles: closer as the relationship deepens. */
const STAGE_GAPS = [50, 34, 22, 10, 40];

/** A paper card: one real question, two real answers, and the score the engine gives that pair. */
function ScoreCase({ title, ex, names, tilt }: { title: string; ex: PairExample; names: { a: string; b: string }; tilt: number }) {
  const picked = ex.options.filter((o) => o.id === ex.a || o.id === ex.b);
  const tone = { good: 'text-awc-sage', warn: 'text-awc-amber', neutral: 'text-awc-slate' }[ex.reading.tone];
  return (
    <article className="relative flex flex-col rounded-[0.5rem] bg-[#fffdf9] p-5 text-awc-ink shadow-[0_30px_60px_-28px_rgb(0_0_0/0.55)] sm:p-6" style={{ rotate: `${tilt}deg` }}>
      <Tape className="absolute -top-3 left-1/2 -translate-x-1/2 -rotate-3" />
      <p className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-awc-muted">{title}</p>
      <p className="awc-serif mt-2 text-[1.05rem] leading-snug">{ex.prompt}</p>
      <ul className="mt-4 space-y-2.5">
        {picked.map((o) => (
          <li key={o.id} className="flex items-start gap-2.5">
            <span className="flex shrink-0 gap-1">
              {(['a', 'b'] as const).map((r) => (
                <span key={r} className="relative h-6 w-6" title={names[r]}>
                  <Box className="absolute inset-0" />
                  {(r === 'a' ? ex.a : ex.b) === o.id && <Tick role={r} delay={r === 'a' ? 300 : 800} className="absolute -right-1 -top-1.5 h-7 w-7" />}
                </span>
              ))}
            </span>
            <span className="pt-0.5 text-[0.875rem] font-medium leading-snug">{o.label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-5">
        <div className="flex items-end justify-between gap-3 border-t border-dashed border-awc-line-strong pt-4">
          <p className={`awc-serif text-[1.15rem] italic leading-tight ${tone}`}>{ex.reading.label}</p>
          <p className="flex shrink-0 items-baseline gap-0.5">
            <span className="awc-serif text-[3.2rem] leading-[0.85]">{ex.reading.score}</span>
            <span className="text-sm text-awc-muted">/100</span>
          </p>
        </div>
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-awc-ink-soft">{firstSentence(ex.reading.note)}</p>
      </div>
    </article>
  );
}

/** Every kind of pair on one 0–100 line, at the score the engine actually gives it. */
function ScoreScale({ labels }: { labels: Array<[string, string]> }) {
  const marks = labels.map(([title, desc], kind) => ({ title, desc, kind, value: RELATION_SCALE[kind] })).sort((a, b) => a.value - b.value);
  return (
    <div className="relative mx-auto mt-10 h-48 max-w-3xl sm:h-44">
      <div className="absolute inset-x-0 top-1/2 h-px bg-white/30" />
      {[0, 50, 100].map((v) => (
        <span key={v} className="absolute top-1/2 mt-2 -translate-x-1/2 font-mono text-[0.625rem] text-white/40" style={{ left: `${v}%` }}>
          {v}
        </span>
      ))}
      {marks.map((m, k) => {
        const up = k % 2 === 0;
        const align = m.value >= 95 ? 'right-0 items-end text-right' : m.value <= 18 ? 'left-0 items-start text-left' : '-translate-x-1/2 items-center text-center';
        return (
          <div key={m.kind} className="absolute inset-y-0" style={{ left: `${m.value}%` }}>
            <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-awc-blush ring-4 ring-awc-wine-deep" />
            <span className={`absolute h-5 border-l border-dashed border-white/30 ${up ? 'bottom-1/2 mb-1.5' : 'top-1/2 mt-1.5'}`} />
            <div className={`absolute flex w-[6.5rem] flex-col gap-1 sm:w-32 ${align} ${up ? 'bottom-1/2 mb-7' : 'top-1/2 mt-7'} ${m.value >= 95 ? 'translate-x-2' : m.value <= 18 ? '-translate-x-2' : ''}`} title={m.desc}>
              <MiniVenn kind={m.kind} />
              <p className="text-[0.8125rem] leading-tight">
                <span className="awc-serif mr-1 text-[1.05rem] text-awc-blush">{m.value}</span>
                {m.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** A page of the Blueprint, as it's printed. */
function BlueprintPage({ no, label, names, pageNo, className = '', children }: { no: number; label: string; names: { a: string; b: string }; pageNo: string; className?: string; children: React.ReactNode }) {
  return (
    <article className={`relative rounded-[0.35rem] border border-awc-line bg-white px-6 pb-4 pt-4 shadow-[var(--shadow-awc-lift)] sm:px-9 sm:pt-6 ${className}`}>
      <header className="flex items-center justify-between gap-4 border-b border-awc-line pb-3 text-[0.5938rem] font-semibold uppercase tracking-[0.2em] text-awc-muted">
        <span className="truncate">The Relationship Blueprint · {names.a} & {names.b}</span>
        <VennMark size={11} className="shrink-0" />
      </header>
      <p className="mt-5 flex items-baseline gap-2.5">
        <span className="awc-numeral text-[2rem]">{String(no).padStart(2, '0')}</span>
        <span className="awc-eyebrow">{label}</span>
      </p>
      {children}
      <footer className="mt-6 flex items-center justify-between border-t border-awc-line pt-3 text-[0.6875rem] text-awc-muted">
        <span className="awc-serif italic">Are We Compatible?</span>
        <span className="font-mono">{pageNo}</span>
      </footer>
    </article>
  );
}

/** Real excerpts from the sample couple's Blueprint, laid out as the pages, card and note they'd be. */
function Showcase({ locale }: { locale: Locale }) {
  const t = UI[locale].landing;
  const bp = sampleBlueprint(locale);
  const names = bp.names;
  const profile = bp.profiles.a;
  const care = bp.emotional.items.find((i) => i.id.startsWith('care-') && i.relation === 'different') ?? bp.emotional.items[0];
  const ev = care.evidence?.[0];
  const blind = bp.blindSpots[0];
  const starter = bp.starters[1] ?? bp.starters[0];
  const action = bp.actions[0];
  const L = t.showcaseLabels;
  return (
    <div className="relative mt-14 grid gap-10 lg:mt-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.3fr)_minmax(0,0.74fr)] lg:items-start lg:gap-0">
      {/* A profile page, tucked behind */}
      <Reveal variant="fade" className="order-3 lg:order-none lg:mt-20 lg:translate-x-10 lg:-rotate-[4deg]">
        <BlueprintPage no={2} label={L.profile} names={names} pageNo={t.pageNo(2)} className="!shadow-[var(--shadow-awc-card)]">
          <div className="mt-3 flex items-center gap-3">
            <PersonDot role="a" name={profile.name} />
            <h3 className="awc-serif text-[1.35rem] leading-tight">{profile.headline}</h3>
          </div>
          <p className="mt-3 text-[0.875rem] leading-relaxed text-awc-ink-soft">{profile.summary}</p>
          <div className="mt-5 space-y-4 lg:pr-8">
            {bp.axes.slice(0, 4).map((ax) => (
              <div key={ax.id}>
                <div className="flex justify-between gap-3 text-[0.6875rem] text-awc-muted">
                  <span>{ax.left}</span>
                  <span>{ax.right}</span>
                </div>
                <div className="relative mt-1.5 h-px bg-awc-line-strong">
                  {ax.a !== null && <span className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-awc-wine ring-2 ring-white" style={{ left: `${((ax.a + 1) / 2) * 100}%` }} />}
                </div>
              </div>
            ))}
          </div>
        </BlueprintPage>
      </Reveal>

      {/* The main page */}
      <Reveal className="relative z-10 order-1 lg:order-none">
        <Stamp text={t.sampleBadge} className="absolute -right-3 -top-9 z-20 h-24 w-24 rotate-[14deg] text-awc-wine/75 sm:-right-6 sm:h-28 sm:w-28" />
        <BlueprintPage no={7} label={L.care} names={names} pageNo={t.pageNo(7)}>
          <h3 className="awc-serif mt-3 text-[1.5rem] leading-tight sm:text-[1.8rem]">{care.title}</h3>
          {care.relation && (
            <div className="mt-3">
              <RelationChip relation={care.relation} locale={locale} />
            </div>
          )}
          <div className="mt-4 space-y-3 text-[0.9688rem] leading-[1.75] text-awc-ink-soft">
            <p>
              {care.body[0]}
              {ev && (
                <>
                  <sup className="ml-0.5 font-semibold text-awc-wine">1</sup>
                  <sup className="font-semibold text-awc-slate">,2</sup>
                </>
              )}
            </p>
            {care.body[1] && <p className="hidden sm:block">{care.body[1]}</p>}
          </div>
          {care.tip && (
            <p className="mt-4 border-l-2 border-awc-wine pl-3 text-[0.875rem] leading-relaxed text-awc-ink">
              <span className="awc-eyebrow mr-1.5">{UI[locale].blueprint.try}</span>
              {care.tip}
            </p>
          )}
          {blind && (
            <div className="mt-7 hidden sm:block">
              <p className="awc-eyebrow">{L.blind}</p>
              <h4 className="awc-serif mt-1.5 text-[1.2rem] leading-tight">{blind.title}</h4>
              <p className="mt-2 text-[0.9063rem] leading-relaxed text-awc-ink-soft">{blind.body[0]}</p>
            </div>
          )}
          {ev && (
            <div className="relative mt-7 border-t border-awc-line pt-3 text-[0.8125rem] leading-snug text-awc-ink">
              <p className="text-[0.5938rem] font-semibold uppercase tracking-[0.18em] text-awc-muted">{ev.prompt}</p>
              <p className="mt-2 flex gap-2">
                <sup className="mt-2 font-semibold text-awc-wine">1</sup>
                <span>
                  <span className="font-semibold">{names.a}:</span> “{ev.a}”
                </span>
              </p>
              <p className="mt-1.5 flex gap-2">
                <sup className="mt-2 font-semibold text-awc-slate">2</sup>
                <span>
                  <span className="font-semibold">{names.b}:</span> “{ev.b}”
                </span>
              </p>
              <div aria-hidden className="absolute -left-56 -top-4 hidden w-44 xl:block">
                <p className="awc-serif text-right text-[1.05rem] italic leading-snug text-awc-wine">{t.annotEvidence}</p>
                <HandArrow className="ml-auto mt-1 h-10 w-16 -rotate-[30deg] text-awc-wine" delay={600} />
              </div>
            </div>
          )}
        </BlueprintPage>
      </Reveal>

      {/* An index card and a sticky note */}
      <div className="relative z-20 order-2 grid gap-8 sm:grid-cols-2 lg:order-none lg:-ml-6 lg:mt-36 lg:grid-cols-1">
        <Reveal variant="fade">
          <article className="relative rotate-[2.4deg] rounded-[0.3rem] bg-[#fffefa] px-6 pb-6 pt-7 shadow-[var(--shadow-awc-lift)]">
            <Tape className="absolute -top-3 left-1/2 -translate-x-1/2 -rotate-2" />
            <p className="awc-eyebrow border-b-2 border-awc-wine/25 pb-2">{L.starter}</p>
            <p className="awc-serif mt-4 text-[1.25rem] leading-snug text-awc-ink">“{starter.prompt}”</p>
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-awc-muted">{starter.why}</p>
          </article>
        </Reveal>
        <Reveal variant="fade" delay={140}>
          <article className="relative -rotate-[2deg] bg-[#f7e9c0] px-6 pb-6 pt-5 shadow-[0_22px_32px_-20px_rgb(52_37_42/0.5)]">
            <p className="awc-eyebrow !text-awc-amber">
              {L.action} · {horizonLabels(locale)[action.horizon]}
            </p>
            <div className="mt-3 flex gap-2.5">
              <span className="relative mt-0.5 h-6 w-6 shrink-0">
                <Box className="absolute inset-0" />
                <Tick role="a" delay={500} className="absolute -right-1 -top-1.5 h-7 w-7" />
              </span>
              <p className="font-semibold leading-snug text-awc-ink">{action.title}</p>
            </div>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-awc-ink-soft">{action.body}</p>
          </article>
          <div aria-hidden className="mt-3 hidden items-start gap-1 pl-6 lg:flex">
            <HandArrow className="h-10 w-14 -scale-y-100 text-awc-wine" delay={900} />
            <p className="awc-serif mt-5 w-36 text-[1.05rem] italic leading-snug text-awc-wine">{t.annotAction}</p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/** Privacy as a receipt: everything we keep, itemised. */
function Receipt({ locale }: { locale: Locale }) {
  const r = UI[locale].landing.receipt;
  return (
    <div className="rotate-[1.2deg] drop-shadow-[0_24px_28px_rgb(52_37_42/0.14)]">
      <div className="relative bg-white px-6 pb-7 pt-7 font-mono text-[0.8125rem] text-awc-ink sm:px-8">
        <ZigzagEdge side="top" />
        <ZigzagEdge side="bottom" />
        <div className="text-center">
          <VennMark size={18} className="mx-auto" />
          <p className="mt-2 text-[0.9375rem] font-bold uppercase tracking-[0.2em]">{r.title}</p>
          <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.12em] text-awc-muted">{r.sub}</p>
        </div>
        <div className="my-5 border-t border-dashed border-awc-line-strong" />
        <ul className="space-y-2.5">
          {r.rows(RETENTION_DAYS.open, Math.round(RETENTION_DAYS.complete / 30)).map(([k, v]) => (
            <li key={k} className="awc-receipt-row">
              <span className="min-w-0 max-w-[46%] text-awc-ink-soft">{k}</span>
              <span className="awc-leader" />
              <span className="max-w-[50%] text-right font-semibold">{v}</span>
            </li>
          ))}
        </ul>
        <div className="my-5 border-t border-dashed border-awc-line-strong" />
        <p className="awc-receipt-row text-[0.9375rem] font-bold uppercase">
          <span>{r.total[0]}</span>
          <span className="awc-leader" />
          <span className="text-right text-awc-wine">{r.total[1]}</span>
        </p>
        <Barcode seed="arewecompatible" className="mx-auto mt-7 h-10 w-52" />
        <p className="mt-3 text-center text-[0.6875rem] uppercase tracking-[0.14em] text-awc-muted">{r.thanks}</p>
      </div>
    </div>
  );
}
