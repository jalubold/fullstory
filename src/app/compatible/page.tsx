import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight, EyeOff, Lock, Trash2, UserX } from 'lucide-react';
import { CompatFooter, CompatHeader } from '@/components/compat/Shell';
import { ContinueBanner, PriceTag } from '@/components/compat/LandingDynamic';
import { PersonDot } from '@/components/compat/Visuals';
import { Reveal } from '@/components/motion/Reveal';
import { CONTEXTS } from '@/lib/compat/contexts';
import { DIMENSIONS } from '@/lib/compat/questions/v1';

const BLUEPRINT_SECTIONS = [
  'Relationship Overview',
  'Individual Profile — You',
  'Individual Profile — Them',
  'Compatibility Breakdown',
  'What Brings You Together',
  'Where You Differ',
  'Emotional Needs',
  'Communication Dynamics',
  'Conflict & Understanding',
  'Future Expectations',
  'Relationship Strengths',
  'Potential Blind Spots',
  'Conversation Starters',
  'Practical Action Plan',
];

export default function CompatLanding() {
  return (
    <>
      <CompatHeader
        right={
          <>
            <Link href="/compatible/how-it-works" className="awc-btn awc-btn-ghost hidden min-h-0 px-3 py-2 text-sm sm:inline-flex">
              How it works
            </Link>
            <Link href="/compatible/start" className="awc-btn awc-btn-primary min-h-0 px-4 py-2.5 text-sm">
              Start the test
            </Link>
          </>
        }
      />
      <main id="main" className="flex-1">
        <Suspense fallback={null}>
          <ContinueBanner />
        </Suspense>

        {/* Hero */}
        <section className="awc-container grid items-center gap-12 pb-16 pt-10 md:grid-cols-[1.05fr_0.95fr] md:gap-10 md:pb-24 md:pt-20">
          <div className="awc-anim-in">
            <p className="awc-eyebrow">A relationship assessment for two</p>
            <h1 className="awc-serif mt-5 text-[2.6rem] leading-[1.04] text-awc-ink sm:text-6xl lg:text-[4.4rem]">
              Two people.
              <br />
              Same questions.
              <br />
              <em className="text-awc-wine">Different perspectives.</em>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-awc-ink-soft">
              Discover what connects you, where you differ, and what makes your relationship unique.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/compatible/start" className="awc-btn awc-btn-primary px-7 text-base">
                Start your test — it’s free <ArrowRight size={18} aria-hidden />
              </Link>
              <Link href="/compatible/how-it-works" className="awc-btn awc-btn-ghost">
                See how it works
              </Link>
            </div>
            <p className="mt-5 text-sm text-awc-muted">20 questions · about 6 minutes each · no account needed</p>
          </div>
          <HeroPreview />
        </section>

        {/* How it works */}
        <section className="border-y border-awc-line bg-white/60">
          <div className="awc-container py-16 md:py-24">
            <Reveal>
              <p className="awc-eyebrow">How it works</p>
              <h2 className="awc-serif mt-3 max-w-2xl text-4xl leading-tight md:text-5xl">Answer apart. Discover together.</h2>
            </Reveal>
            <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {[
                ['You answer', 'Choose your relationship stage, add your name and answer 20 honest questions. No sign-up.'],
                ['They answer, privately', 'Send your private invitation by WhatsApp or link. Neither of you sees the other’s answers before submitting your own.'],
                ['You see it together', 'The moment you’ve both finished, your results unlock for both of you — side by side, grounded in what you each said.'],
              ].map(([title, body], i) => (
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
              <p className="awc-eyebrow">What we explore</p>
              <h2 className="awc-serif mt-3 text-4xl leading-tight md:text-5xl">Five dimensions of a relationship</h2>
            </div>
            <p className="text-lg leading-relaxed text-awc-ink-soft">Four questions in each, written to explore real preferences and habits — how you text, recharge, argue, make up and imagine the future.</p>
          </Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-awc-line bg-awc-line sm:grid-cols-2 lg:grid-cols-5">
            {DIMENSIONS.map((d, i) => (
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
              <p className="awc-eyebrow !text-awc-blush">Not just a score</p>
              <h2 className="awc-serif mt-3 text-4xl leading-tight md:text-5xl">
                Same isn’t always better. <em className="text-awc-blush">Different isn’t always harder.</em>
              </h2>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-white/75">
                Two people who both avoid conflict can share a blind spot. A planner and a free spirit can fit together beautifully. We read every pair of answers for what it actually means.
              </p>
            </Reveal>
            <Reveal delay={120} className="grid content-center gap-3">
              {[
                ['Shared', 'You see it the same way.'],
                ['Complementary', 'Different answers that fit together.'],
                ['Different', 'Two perspectives, neither wrong.'],
                ['Worth discussing', 'Differences that are easy to misread.'],
                ['Shared blind spot', 'Agreement that can hide a risk.'],
              ].map(([t, d]) => (
                <div key={t} className="flex items-baseline justify-between gap-6 border-b border-white/15 pb-3">
                  <span className="awc-serif text-xl">{t}</span>
                  <span className="text-right text-sm text-white/65">{d}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* The Blueprint */}
        <section className="awc-container py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:gap-16">
            <Reveal>
              <p className="awc-eyebrow">The premium report</p>
              <h2 className="awc-serif mt-3 text-4xl leading-tight md:text-5xl">The Relationship Blueprint</h2>
              <p className="mt-5 text-lg leading-relaxed text-awc-ink-soft">
                Your free result shows the headline. The Blueprint is the whole story: a personalised analysis written from both of your answers, with fair explanations of each perspective — and what to do with them.
              </p>
              <ul className="mt-6 space-y-2.5 text-awc-ink-soft">
                {['Both individual profiles, side by side', 'Every answer compared, with what it means', 'Blind spots, conversation starters and an action plan', 'Beautiful on your phone, plus a downloadable PDF'].map((x) => (
                  <li key={x} className="flex gap-3">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-awc-wine" />
                    {x}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex items-baseline gap-3">
                <Suspense fallback={<span className="awc-serif text-4xl">$9.99</span>}>
                  <PriceTag className="awc-serif text-4xl" />
                </Suspense>
                <span className="text-awc-muted">per couple · one payment unlocks it for both of you</span>
              </div>
            </Reveal>
            <Reveal delay={100} className="awc-card p-6 md:p-8">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-awc-muted">Contents</p>
              <ol className="mt-4 divide-y divide-awc-line">
                {BLUEPRINT_SECTIONS.map((s, i) => (
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
              <p className="awc-eyebrow">For every stage</p>
              <h2 className="awc-serif mx-auto mt-3 max-w-2xl text-3xl leading-tight md:text-4xl">From the talking stage to twenty years married</h2>
              <div className="mt-8 flex flex-wrap justify-center gap-2.5">
                {CONTEXTS.map((c) => (
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
            <p className="awc-eyebrow">Private by design</p>
            <h2 className="awc-serif mt-3 max-w-2xl text-4xl leading-tight md:text-5xl">Your answers are yours</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [EyeOff, 'No peeking', 'Neither of you can see the other’s answers until you’ve both submitted.'],
              [UserX, 'No account', 'No sign-up, no password. Your private link is your key.'],
              [Lock, 'Locked answers', 'Once submitted, answers can’t be changed — results stay honest for both of you.'],
              [Trash2, 'Delete anytime', 'Either of you can permanently delete your results with one tap.'],
            ].map(([Icon, title, body], i) => {
              const I = Icon as typeof Lock;
              return (
                <Reveal key={title as string} delay={i * 70} className="rounded-2xl border border-awc-line bg-white p-6">
                  <I size={22} className="text-awc-wine" aria-hidden />
                  <h3 className="awc-serif mt-4 text-xl">{title as string}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-awc-muted">{body as string}</p>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="awc-container pb-20 md:pb-28">
          <Reveal className="rounded-[2rem] bg-awc-blush-soft px-6 py-14 text-center md:py-20">
            <h2 className="awc-serif mx-auto max-w-2xl text-4xl leading-tight md:text-5xl">
              How well do you <em className="text-awc-wine">really</em> know each other?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-awc-ink-soft">Find out in about six minutes. Free to take, free to compare.</p>
            <Link href="/compatible/start" className="awc-btn awc-btn-primary mt-8 px-8 text-base">
              Start the test <ArrowRight size={18} aria-hidden />
            </Link>
          </Reveal>
        </section>
      </main>
      <CompatFooter />
    </>
  );
}

/** Editorial mock of a result: two answers to the same question, and the headline that follows. */
function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md md:max-w-none" aria-hidden>
      <div className="awc-card awc-anim-in relative z-10 p-6 md:p-7" style={{ animationDelay: '120ms' }}>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-awc-muted">Question 01 · Communication</p>
        <p className="awc-serif mt-3 text-[1.45rem] leading-snug">On a typical day apart, how much contact feels right to you?</p>
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center gap-3 rounded-2xl border border-awc-wine/40 bg-awc-blush-soft/50 px-4 py-3">
            <PersonDot role="a" name="Maya" size="sm" />
            <span className="text-sm text-awc-ink">A steady flow — little messages throughout the day</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-awc-slate/30 bg-awc-slate-soft/60 px-4 py-3">
            <PersonDot role="b" name="Daniel" size="sm" />
            <span className="text-sm text-awc-ink">One proper catch-up is plenty</span>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-awc-ink-soft">
          <span className="font-semibold text-awc-ink">Different, not wrong.</span> Frequent messages can feel like warmth to one person and like a to-do list to another.
        </p>
      </div>
      <div className="awc-anim-in relative z-20 -mt-6 ml-auto w-[82%] rounded-[1.5rem] bg-awc-wine-deep p-6 text-white shadow-[var(--shadow-awc-lift)] md:-mt-10 md:w-[78%]" style={{ animationDelay: '280ms' }}>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-awc-blush">Maya & Daniel</p>
        <p className="awc-serif mt-2 text-3xl">The Puzzle Pieces</p>
        <p className="mt-1 text-sm text-white/70">Your differences fit together.</p>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div className="space-y-2">
            {[['Communication', 68], ['Emotional', 57], ['Lifestyle', 78], ['Future', 90], ['Conflict', 73]].map(([l, v]) => (
              <div key={l} className="flex items-center gap-3">
                <span className="w-24 text-xs text-white/70">{l}</span>
                <span className="h-1.5 w-20 overflow-hidden rounded-full bg-white/15 sm:w-28">
                  <span className="block h-full rounded-full bg-awc-blush" style={{ width: `${v}%` }} />
                </span>
              </div>
            ))}
          </div>
          <div className="text-right">
            <p className="awc-serif text-5xl leading-none">73<span className="text-2xl text-white/60">%</span></p>
            <p className="mt-1 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-white/60">aligned</p>
          </div>
        </div>
      </div>
    </div>
  );
}
