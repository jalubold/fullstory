'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import type { Locale } from '@/lib/compat/i18n';
import { savePrefill } from '@/lib/compat/prefill';
import { track } from '@/lib/compat/track';
import type { TryQuestion } from '@/lib/compat/tryit';
import type { Relation } from '@/lib/compat/types';
import { UI } from '@/lib/compat/ui-strings';
import { Venn } from './Brand';

const LETTERS = 'ABCDE';

/** Chip dot per kind of answer pair (the label carries the meaning; the dot is decoration). */
const DOT: Record<Relation, string> = { shared: 'bg-awc-sage', close: 'bg-awc-sage', complementary: 'bg-awc-wine', different: 'bg-awc-muted', tension: 'bg-awc-amber' };

/**
 * The landing page's taste of the product: answer one real question, guess
 * what the other person would say, and see how the engine reads that pair.
 * The answer is kept so the quiz can start with it already filled in.
 */
export function TryIt({ locale, question }: { locale: Locale; question: TryQuestion }) {
  const t = UI[locale].landing.tryIt;
  const [mine, setMine] = useState<string | null>(null);
  const [guess, setGuess] = useState<string | null>(null);
  const phase = !mine ? 0 : !guess ? 1 : 2;
  const label = (id: string) => question.options.find((o) => o.id === id)?.label ?? '';
  const outcome = mine && guess ? question.outcomes[`${mine}|${guess}`] : null;
  const steps = [t.stepAnswer, t.stepGuess, t.stepRead];

  const pick = (id: string) => {
    if (!mine) {
      setMine(id);
      savePrefill(question.id, id);
      track('compat_try_answer');
    } else if (!guess) {
      setGuess(id);
      track('compat_try_guess');
    }
  };

  return (
    <section aria-label={t.eyebrow} className="relative overflow-hidden rounded-[2rem] bg-awc-wine-deep text-white shadow-[0_40px_80px_-30px_rgb(94_37_54/0.65)]">
      <svg aria-hidden viewBox="0 0 600 400" className="pointer-events-none absolute -right-48 -top-40 w-[520px] opacity-[0.07]">
        <circle cx="230" cy="200" r="170" fill="none" stroke="#fff" strokeWidth="2" />
        <circle cx="370" cy="200" r="170" fill="none" stroke="#fff" strokeWidth="2" />
      </svg>

      <div className="relative flex min-h-[31rem] flex-col p-5 sm:min-h-[36rem] sm:p-8">
        {/* Steps */}
        <ol className="flex items-center gap-2 text-[0.625rem] font-bold uppercase tracking-[0.14em]" aria-label={t.eyebrow}>
          {steps.map((s, i) => (
            <li key={s} className={`flex items-center gap-2 transition-colors duration-300 ${i <= phase ? 'text-awc-blush' : 'text-white/35'}`} aria-current={i === phase ? 'step' : undefined}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.625rem] transition-colors duration-300 ${i < phase ? 'bg-awc-blush text-awc-wine-deep' : i === phase ? 'ring-1 ring-awc-blush' : 'ring-1 ring-white/25'}`}>{i + 1}</span>
              <span className={i === phase ? '' : 'hidden sm:inline'}>{s}</span>
              {i < 2 && <span className="h-px w-3 bg-white/20 sm:w-5" />}
            </li>
          ))}
          {phase === 0 && <li className="ml-auto whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1 text-[0.625rem] tracking-[0.1em] text-white/80">{t.time}</li>}
        </ol>

        <div className="mt-3 flex justify-center">
          <Venn
            key={phase === 2 ? `r-${mine}-${guess}` : 'q'}
            names={{ a: t.you, b: phase === 2 ? t.them : null }}
            overlap={outcome ? outcome.overlap : 34}
            pending={phase === 0 ? 'both' : phase === 1 ? 'b' : null}
            size={176}
            tone="dark"
            className="h-auto w-[7.25rem] sm:w-[11rem]"
          />
        </div>

        {phase < 2 ? (
          <div key={phase} className="awc-anim-next mt-2 flex flex-1 flex-col">
            {phase === 1 && mine && (
              <p className="mb-3 self-start rounded-full bg-awc-blush px-3 py-1 text-[0.75rem] font-semibold leading-snug text-awc-wine-deep">
                {t.you}: {label(mine)}
              </p>
            )}
            <h2 className="awc-serif text-balance text-[1.4rem] leading-snug sm:text-[1.7rem]">{phase === 0 ? question.prompt : t.guessTitle}</h2>
            {phase === 1 && <p className="mt-1.5 text-[0.875rem] text-white/60">{t.guessHint}</p>}
            <div className="mt-4 grid gap-2">
              {question.options.map((o, i) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => pick(o.id)}
                  className={`group flex w-full items-center gap-3 rounded-2xl bg-white/[0.07] px-4 py-3 text-left text-[0.9375rem] leading-snug sm:py-3.5 sm:text-base ring-1 ring-white/12 transition-all duration-200 hover:-translate-y-px hover:bg-white/[0.14] focus-visible:!outline-white active:scale-[0.99] ${phase === 0 ? 'hover:ring-awc-blush/70' : 'hover:ring-[#9fc3e2]/80'}`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/30 text-[0.625rem] font-bold text-white/70 transition-colors ${phase === 0 ? 'group-hover:border-awc-blush group-hover:text-awc-blush' : 'group-hover:border-[#9fc3e2] group-hover:text-[#9fc3e2]'}`}>{LETTERS[i]}</span>
                  <span>{o.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          outcome &&
          mine &&
          guess && (
            <div key="result" className="awc-anim-next mt-2 flex flex-1 flex-col" aria-live="polite">
              <div className="space-y-1.5 text-[0.8125rem] leading-snug">
                <p className="flex gap-2">
                  <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-awc-wine ring-2 ring-white/70" />
                  <span>
                    <span className="font-semibold">{t.you}:</span> <span className="text-white/80">{label(mine)}</span>
                  </span>
                </p>
                <p className="flex gap-2">
                  <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-awc-slate ring-2 ring-white/70" />
                  <span>
                    <span className="font-semibold">
                      {t.them} ({t.yourGuess}):
                    </span>{' '}
                    <span className="text-white/80">{label(guess)}</span>
                  </span>
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <span className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-awc-blush">{t.ifRight}</span>
                <span className="awc-chip bg-white text-awc-wine-deep">
                  <span className={`h-2 w-2 rounded-full ${DOT[outcome.blindSpot ? 'tension' : outcome.relation]}`} />
                  {outcome.label}
                </span>
              </div>
              <p className="awc-serif mt-2.5 text-pretty text-[1.1rem] leading-snug text-white/95 sm:text-[1.3rem]">{outcome.note}</p>
              <div className="mt-auto pt-5">
                <Link href="/compatible/start" onClick={() => track('compat_try_cta')} className="awc-btn awc-btn-light w-full text-[0.9688rem]">
                  {t.cta} <ArrowRight size={18} aria-hidden />
                </Link>
                <div className="mt-3 flex items-start justify-between gap-4">
                  <p className="text-[0.75rem] leading-relaxed text-white/60">{t.carry}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setMine(null);
                      setGuess(null);
                    }}
                    className="inline-flex shrink-0 items-center gap-1.5 text-[0.75rem] font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline focus-visible:!outline-white"
                  >
                    <RotateCcw size={12} aria-hidden /> {t.again}
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}
