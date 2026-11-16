import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight, Check, Clock, Coffee, Compass, EyeOff, Handshake, HeartHandshake, Languages, Lock, MessageCircle, Plus, Sparkles, Trash2, UserX } from 'lucide-react';
import { Venn, VennMark } from '@/components/compat/Brand';
import { CompatFooter, CompatHeader } from '@/components/compat/Shell';
import { ContinueBanner, PriceTag } from '@/components/compat/LandingDynamic';
import { StickyCta } from '@/components/compat/StickyCta';
import { EvidenceBlock, PersonDot, RelationChip } from '@/components/compat/Visuals';
import { Reveal } from '@/components/motion/Reveal';
import { getContexts } from '@/lib/compat/contexts';
import { isLocale, type Locale } from '@/lib/compat/i18n';
import { getQuestionSet } from '@/lib/compat/questions';
import { horizonLabels } from '@/lib/compat/report';
import { sampleBlueprint, SAMPLE_ANSWERS } from '@/lib/compat/sample';
import type { DimensionId } from '@/lib/compat/types';
import { UI } from '@/lib/compat/ui-strings';

/** One prerendered version per language (generateStaticParams in the layout); opt out of unknown-param validation. */
export const instant = false;

const DIM_ICONS: Record<DimensionId, typeof MessageCircle> = { communication: MessageCircle, emotional: HeartHandshake, lifestyle: Coffee, future: Compass, conflict: Handshake };

export default async function CompatLanding({ params }: PageProps<'/compatible/[lang]'>) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : 'en';
  const t = UI[locale].landing;
  const set = getQuestionSet(undefined, locale);
  const sample = sampleBlueprint(locale);
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
          <div className="awc-container relative grid items-center gap-14 pb-16 pt-10 md:pb-24 md:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:pt-20">
            <div className="awc-anim-in">
              <p className="inline-flex items-center gap-2 rounded-full border border-awc-blush bg-white/80 py-1.5 pl-2 pr-3.5 text-[0.75rem] font-semibold text-awc-wine-dark shadow-[var(--shadow-awc-card)]">
                <VennMark size={14} />
                {t.eyebrow}
              </p>
              <h1 className="awc-serif mt-6 text-balance text-[2.75rem] leading-[1.02] tracking-[-0.025em] text-awc-ink sm:text-[3.75rem] lg:text-[4.6rem]">
                <span className="block">{t.h1a}</span>
                <span className="block">{t.h1b}</span>
                <em className="block text-awc-wine">{t.h1c}</em>
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-awc-ink-soft md:text-xl">{t.lead}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link id="hero-cta" href="/compatible/start" className="awc-btn awc-btn-primary min-h-14 px-8 text-[1.0625rem]">
                  {t.cta} <ArrowRight size={19} aria-hidden />
                </Link>
                <Link href="/compatible/how-it-works" className="awc-btn awc-btn-ghost min-h-14">
                  {t.seeHow}
                </Link>
              </div>
              <ul className="mt-9 grid grid-cols-2 gap-x-6 gap-y-3 text-[0.875rem] text-awc-ink-soft sm:flex sm:flex-wrap">
                {t.trust.map((x, i) => {
                  const I = [Clock, EyeOff, UserX, Languages][i];
                  return (
                    <li key={x} className="flex items-center gap-2">
                      <I size={16} className="shrink-0 text-awc-wine" aria-hidden />
                      {x}
                    </li>
                  );
                })}
              </ul>
            </div>
            <HeroVisual locale={locale} />
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

        {/* ───────── How it works ───────── */}
        <section className="awc-container py-20 md:py-28">
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
        </section>

        {/* ───────── Five dimensions ───────── */}
        <section className="border-y border-awc-line bg-white/60">
          <div className="awc-container py-20 md:py-28">
            <Reveal className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <p className="awc-eyebrow">{t.dimsEyebrow}</p>
                <h2 className="awc-serif mt-3 text-balance text-4xl leading-[1.08] md:text-[3.4rem]">{t.dimsTitle}</h2>
              </div>
              <p className="text-pretty text-lg leading-relaxed text-awc-ink-soft">{t.dimsLead}</p>
            </Reveal>
            <div className="awc-snap mt-12 lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible lg:px-0 lg:[&>*:nth-child(-n+3)]:col-span-2 lg:[&>*:nth-child(n+4)]:col-span-3">
              {set.dimensions.map((d, i) => {
                const I = DIM_ICONS[d.id];
                const q = set.questions.find((x) => x.dimension === d.id)!;
                return (
                  <Reveal key={d.id} delay={i * 70} className="flex w-[78%] flex-col rounded-[1.5rem] border border-awc-line bg-awc-cream p-6 transition-transform duration-300 hover:-translate-y-1 sm:w-[46%] lg:w-auto">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-awc-wine shadow-[var(--shadow-awc-card)]">
                        <I size={20} aria-hidden />
                      </span>
                      <span className="awc-numeral text-2xl">{['i', 'ii', 'iii', 'iv', 'v'][i]}</span>
                    </div>
                    <h3 className="awc-serif mt-6 text-[1.35rem] leading-snug">{d.label}</h3>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-awc-muted">{d.description}</p>
                    <p className="mt-auto border-t border-awc-line pt-4 text-[0.875rem] italic leading-snug text-awc-ink-soft">“{q.prompt}”</p>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ───────── Not just a score ───────── */}
        <section className="relative overflow-hidden bg-awc-wine-deep text-white">
          <svg aria-hidden viewBox="0 0 600 400" className="pointer-events-none absolute -right-40 -top-24 w-[720px] opacity-[0.07]">
            <circle cx="230" cy="200" r="170" fill="none" stroke="#fff" strokeWidth="2" />
            <circle cx="370" cy="200" r="170" fill="none" stroke="#fff" strokeWidth="2" />
          </svg>
          <div className="awc-container relative grid gap-12 py-20 md:grid-cols-2 md:py-28">
            <Reveal>
              <p className="awc-eyebrow !text-awc-blush">{t.scoreEyebrow}</p>
              <h2 className="awc-serif mt-3 text-balance text-4xl leading-[1.08] md:text-[3.4rem]">
                {t.scoreTitleA} <em className="text-awc-blush">{t.scoreTitleB}</em>
              </h2>
              <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-white/75">{t.scoreLead}</p>
            </Reveal>
            <Reveal delay={120} className="grid content-center gap-2.5">
              {t.relations.map(([title, desc], i) => (
                <div key={title} className="flex items-center gap-4 rounded-2xl bg-white/[0.06] px-5 py-4 ring-1 ring-white/10 transition-colors hover:bg-white/10">
                  <MiniVenn kind={i} />
                  <span className="awc-serif min-w-0 flex-1 text-[1.2rem]">{title}</span>
                  <span className="max-w-[48%] text-right text-[0.8125rem] leading-snug text-white/65">{desc}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ───────── Inside the Blueprint ───────── */}
        <section className="awc-container py-20 md:py-28">
          <Reveal className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
            <div>
              <p className="awc-eyebrow">{t.showcaseEyebrow}</p>
              <h2 className="awc-serif mt-3 text-balance text-4xl leading-[1.08] md:text-[3.4rem]">{t.showcaseTitle}</h2>
            </div>
            <div>
              <p className="text-pretty text-lg leading-relaxed text-awc-ink-soft">{t.showcaseLead}</p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-awc-blush-soft px-3 py-1 text-[0.75rem] font-semibold text-awc-wine-dark">
                <Sparkles size={13} aria-hidden /> {t.sampleBadge} · {sample.names.a} & {sample.names.b}
              </p>
            </div>
          </Reveal>
          <Showcase locale={locale} />
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

        {/* ───────── Stages + privacy ───────── */}
        <section className="awc-container py-20 md:py-28">
          <Reveal className="text-center">
            <p className="awc-eyebrow">{t.stagesEyebrow}</p>
            <h2 className="awc-serif mx-auto mt-3 max-w-2xl text-balance text-3xl leading-tight md:text-[2.6rem]">{t.stagesTitle}</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              {getContexts(locale).map((c) => (
                <span key={c.id} className="rounded-full border border-awc-line-strong bg-white px-4 py-2 text-sm text-awc-ink-soft">
                  {c.label}
                </span>
              ))}
            </div>
          </Reveal>
          <div className="mt-20 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <Reveal>
              <p className="awc-eyebrow">{t.privacyEyebrow}</p>
              <h2 className="awc-serif mt-3 text-balance text-4xl leading-[1.08] md:text-[3rem]">{t.privacyTitle}</h2>
            </Reveal>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {t.privacy.map(([title, body], i) => {
                const I = [EyeOff, UserX, Lock, Trash2][i];
                return (
                  <Reveal key={title} delay={i * 70} className="rounded-[1.25rem] border border-awc-line bg-white p-4 md:p-6">
                    <I size={20} className="text-awc-wine" aria-hidden />
                    <h3 className="awc-serif mt-3 text-[1.1rem] leading-snug md:text-xl">{title}</h3>
                    <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-awc-muted md:text-[0.9375rem]">{body}</p>
                  </Reveal>
                );
              })}
            </div>
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

/** Hero: a real result for the sample couple, with their two answers to the same question. */
function HeroVisual({ locale }: { locale: Locale }) {
  const t = UI[locale].landing;
  const bp = sampleBlueprint(locale);
  const q = getQuestionSet(undefined, locale).questions.find((x) => x.id === 'com-rhythm')!;
  const label = (id: string) => q.options.find((o) => o.id === id)!.label;
  const { names, overview } = bp;
  return (
    <div className="relative mx-auto w-full max-w-[34rem] lg:max-w-none lg:pb-16" aria-hidden>
      {/* Answer A */}
      <div className="awc-float relative z-20 mb-3 flex max-w-[86%] items-start gap-3 rounded-2xl rounded-bl-md border border-awc-wine/25 bg-white p-3.5 shadow-[var(--shadow-awc-lift)] lg:absolute lg:-left-8 lg:top-0 lg:mb-0 lg:max-w-[18rem]">
        <PersonDot role="a" name={names.a} size="sm" />
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-awc-muted">{names.a}</p>
          <p className="mt-0.5 text-[0.875rem] leading-snug text-awc-ink">{label(SAMPLE_ANSWERS.a['com-rhythm'])}</p>
        </div>
      </div>

      {/* Result card */}
      <div className="awc-anim-in relative z-10 overflow-hidden rounded-[2rem] bg-awc-wine-deep px-6 pb-7 pt-8 text-white shadow-[0_40px_80px_-30px_rgb(94_37_54/0.6)] sm:px-9 lg:ml-8 lg:mr-2 lg:mt-14" style={{ animationDelay: '150ms' }}>
        <p className="text-center text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-awc-blush">
          {names.a} & {names.b}
        </p>
        <div className="mt-2 flex justify-center">
          <Venn names={names} overlap={overview.similarity + 20} size={290} tone="dark" />
        </div>
        <p className="awc-serif text-center text-[2rem] leading-tight">{overview.signature.title}</p>
        <p className="awc-serif mt-1 text-center italic text-white/70">{overview.signature.tagline}</p>
        <div className="mt-6 grid grid-cols-[1fr_auto] items-end gap-6 border-t border-white/10 pt-5">
          <div className="space-y-2">
            {bp.dimensions.map((d) => (
              <div key={d.id} className="flex items-center gap-3">
                <span className="w-[6.5rem] truncate text-[0.6875rem] text-white/70 sm:w-32">{d.label}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                  <span className="awc-bar-fill block h-full rounded-full bg-awc-blush" style={{ width: `${d.alignment}%` }} />
                </span>
              </div>
            ))}
          </div>
          <div className="text-right">
            <p className="awc-serif text-[3.25rem] leading-none">
              {overview.alignment}
              <span className="text-2xl text-white/60">%</span>
            </p>
            <p className="mt-1 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-white/60">{t.preview.aligned}</p>
          </div>
        </div>
      </div>

      {/* Answer B */}
      <div className="awc-float-slow relative z-20 ml-auto mt-3 flex max-w-[86%] items-start gap-3 rounded-2xl rounded-br-md border border-awc-slate/25 bg-white p-3.5 shadow-[var(--shadow-awc-lift)] lg:absolute lg:-bottom-3 lg:-right-6 lg:mt-0 lg:max-w-[17rem]">
        <PersonDot role="b" name={names.b} size="sm" />
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-awc-muted">{names.b}</p>
          <p className="mt-0.5 text-[0.875rem] leading-snug text-awc-ink">{label(SAMPLE_ANSWERS.b['com-rhythm'])}</p>
        </div>
      </div>
    </div>
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

function ShowcaseCard({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <article className={`flex w-[86%] flex-col rounded-[1.5rem] border border-awc-line bg-white p-6 shadow-[var(--shadow-awc-card)] sm:w-[60%] lg:w-auto ${className}`}>
      <p className="awc-eyebrow">{label}</p>
      {children}
    </article>
  );
}

/** Real excerpts from the sample couple's Blueprint. */
function Showcase({ locale }: { locale: Locale }) {
  const t = UI[locale].landing;
  const bp = sampleBlueprint(locale);
  const profile = bp.profiles.a;
  const care = bp.emotional.items.find((i) => i.id.startsWith('care-') && i.relation === 'different') ?? bp.emotional.items[0];
  const blind = bp.blindSpots[0];
  const starter = bp.starters[1] ?? bp.starters[0];
  const action = bp.actions[0];
  const L = t.showcaseLabels;
  return (
    <div className="awc-snap mt-12 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0">
      <ShowcaseCard label={L.profile} className="lg:row-span-2">
        <div className="mt-5 flex items-center gap-3">
          <PersonDot role="a" name={profile.name} />
          <p className="awc-serif text-[1.6rem] leading-tight">{profile.headline}</p>
        </div>
        <p className="mt-4 leading-relaxed text-awc-ink-soft">{profile.summary}</p>
        <ul className="mt-5 space-y-2.5 border-t border-awc-line pt-5">
          {profile.traits.slice(0, 5).map((x) => (
            <li key={x} className="flex gap-2.5 text-[0.875rem] leading-snug text-awc-ink-soft">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-awc-wine" />
              {x}
            </li>
          ))}
        </ul>
      </ShowcaseCard>
      <ShowcaseCard label={L.care} className="lg:col-span-2">
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="awc-serif text-[1.45rem] leading-tight">{care.title}</h3>
          {care.relation && <RelationChip relation={care.relation} locale={locale} />}
        </div>
        <p className="mt-3 leading-relaxed text-awc-ink-soft">{care.body.join(' ')}</p>
        {care.evidence?.[0] && <EvidenceBlock evidence={care.evidence[0]} names={bp.names} />}
      </ShowcaseCard>
      <ShowcaseCard label={L.blind}>
        <h3 className="awc-serif mt-3 text-[1.3rem] leading-tight">{blind.title}</h3>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-awc-ink-soft">{blind.body[0]}</p>
        {blind.tip && (
          <p className="mt-4 rounded-xl bg-awc-blush-soft/60 p-3 text-[0.875rem] leading-relaxed text-awc-ink">
            <span className="awc-eyebrow mr-2">{UI[locale].blueprint.try}</span>
            {blind.tip}
          </p>
        )}
      </ShowcaseCard>
      <div className="flex w-[86%] flex-col gap-5 sm:w-[60%] lg:w-auto">
        <ShowcaseCard label={L.starter} className="!w-full">
          <p className="awc-serif mt-3 text-[1.3rem] leading-snug">“{starter.prompt}”</p>
          <p className="mt-3 text-[0.8125rem] leading-relaxed text-awc-muted">{starter.why}</p>
        </ShowcaseCard>
        <ShowcaseCard label={`${L.action} · ${horizonLabels(locale)[action.horizon]}`} className="!w-full">
          <p className="mt-3 font-semibold text-awc-ink">{action.title}</p>
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-awc-ink-soft">{action.body}</p>
        </ShowcaseCard>
      </div>
    </div>
  );
}
