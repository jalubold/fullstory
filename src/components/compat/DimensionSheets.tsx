'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { DimensionId } from '@/lib/compat/types';
import { Box, DimDoodle, HandArrow, Tick } from './Doodles';

export interface Sheet {
  id: DimensionId;
  label: string;
  /** One-word name for the tab. */
  short: string;
  /** "4 questions", already in the reader's language. */
  countLabel: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  /** The two example answers, ticked by A and B. */
  a: string;
  b: string;
  /** How the engine reads this pair. */
  reading: { label: string; score: number; note: string; tone: 'good' | 'warn' | 'neutral' };
  /** The other topics asked in this dimension. */
  also: string[];
}

export interface SheetStrings {
  tabs: string;
  no: string;
  read: string;
  also: string;
  next: string;
}

const TONE = { good: 'text-awc-sage', warn: 'text-awc-amber', neutral: 'text-awc-slate' } as const;

/**
 * "Five dimensions", shown as a paper questionnaire filled in by two pens: one
 * real question per dimension, two real answers, and the engine's own reading
 * of that pair in the margin.
 */
export function DimensionSheets({ sheets, names, strings }: { sheets: Sheet[]; names: { a: string; b: string }; strings: SheetStrings }) {
  const [i, setI] = useState(0);
  const s = sheets[i];
  const n = String(i + 1).padStart(2, '0');
  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-12">
      {/* Index of dimensions */}
      <div role="tablist" aria-label={strings.tabs} className="awc-snap -mx-4 flex gap-2 px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
        {sheets.map((x, k) => {
          const on = k === i;
          return (
            <button
              key={x.id}
              type="button"
              role="tab"
              id={`dim-tab-${x.id}`}
              aria-selected={on}
              aria-controls="dim-sheet"
              onClick={() => setI(k)}
              className={`group flex shrink-0 items-baseline gap-3 rounded-full border px-4 py-2.5 text-left transition-colors lg:rounded-none lg:border-0 lg:border-b lg:px-1 lg:py-4 ${
                on ? 'border-awc-wine bg-awc-wine text-white lg:border-awc-line lg:bg-transparent lg:text-awc-ink' : 'border-awc-line-strong bg-white text-awc-ink-soft hover:text-awc-ink lg:border-awc-line lg:bg-transparent'
              }`}
            >
              <span className={`awc-numeral text-[1.05rem] lg:text-2xl ${on ? 'text-white lg:text-awc-wine' : 'text-awc-muted group-hover:text-awc-wine'}`}>{String(k + 1).padStart(2, '0')}</span>
              <span className="whitespace-nowrap text-sm font-semibold lg:hidden">{x.short}</span>
              <span className={`awc-serif hidden text-[1.2rem] leading-snug lg:inline ${on ? '' : 'opacity-70'}`}>{x.label}</span>
              {on && <span aria-hidden className="ml-auto hidden h-px w-8 self-center bg-awc-wine lg:block" />}
            </button>
          );
        })}
      </div>

      {/* The sheet */}
      <div className="relative">
        <div aria-hidden className="absolute inset-0 translate-x-2 translate-y-3 rotate-[1.6deg] rounded-[0.6rem] border border-awc-line bg-awc-cream-2" />
        <div aria-hidden className="absolute inset-0 -translate-x-1 translate-y-1.5 -rotate-[1deg] rounded-[0.6rem] border border-awc-line bg-[#fbf8f3]" />
        <article id="dim-sheet" role="tabpanel" aria-labelledby={`dim-tab-${s.id}`} key={s.id} className="awc-paper relative overflow-hidden rounded-[0.6rem] border border-awc-line px-5 pb-6 pt-5 shadow-[var(--shadow-awc-card)] sm:px-8 sm:pb-8 sm:pt-7 md:pl-16">
          <span aria-hidden className="absolute inset-y-0 left-11 hidden w-px bg-awc-wine/25 md:block" />
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-awc-muted">
                {strings.no} {n} · {s.countLabel}
              </p>
              <h3 className="awc-serif mt-1.5 text-[1.5rem] leading-tight text-awc-ink sm:text-[1.75rem]">{s.label}</h3>
            </div>
            <DimDoodle id={s.id} className="awc-anim-pop -mr-1 -mt-1 h-16 w-20 shrink-0 sm:h-20 sm:w-28" />
          </header>

          <div className="mt-6 grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,13.5rem)] md:gap-8">
            <div>
              <p className="awc-serif text-[1.25rem] leading-snug text-awc-ink sm:text-[1.4rem]">{s.prompt}</p>
              <div className="mt-5" role="list">
                <div aria-hidden className="mb-1 flex gap-1.5 pl-0.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.12em]">
                  <span className="w-7 text-center text-awc-wine">{names.a.slice(0, 4)}</span>
                  <span className="w-7 text-center text-awc-slate">{names.b.slice(0, 4)}</span>
                </div>
                {s.options.map((o) => {
                  const byA = o.id === s.a;
                  const byB = o.id === s.b;
                  const who = [byA && names.a, byB && names.b].filter(Boolean).join(' & ');
                  return (
                    <div key={o.id} role="listitem" className={`flex items-center gap-1.5 border-b border-dashed border-awc-line py-2.5 last:border-0 ${byA || byB ? 'text-awc-ink' : 'text-awc-muted'}`}>
                      {(['a', 'b'] as const).map((r) => (
                        <span key={r} className="relative h-7 w-7 shrink-0">
                          <Box className="absolute inset-0" />
                          {(r === 'a' ? byA : byB) && <Tick role={r} delay={r === 'a' ? 150 : 650} className="absolute -right-1 -top-1.5 h-8 w-8" />}
                        </span>
                      ))}
                      <span className={`ml-2 text-[0.9375rem] leading-snug ${byA || byB ? 'font-medium' : ''}`}>
                        {o.label}
                        {who && <span className="sr-only"> — {who}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* The margin note */}
            <aside className="relative self-center rounded-xl border border-dashed border-awc-line-strong bg-white/70 p-4 md:border-0 md:bg-transparent md:p-0">
              <HandArrow flip className="absolute -left-14 -top-8 hidden h-12 w-16 text-awc-wine md:block" delay={900} />
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-awc-muted">{strings.read}</p>
              <p className={`awc-serif mt-1 text-[1.35rem] italic leading-tight ${TONE[s.reading.tone]}`}>{s.reading.label}</p>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="awc-serif text-[2.6rem] leading-none text-awc-ink">{s.reading.score}</span>
                <span className="text-sm text-awc-muted">/100</span>
              </p>
              <p className="mt-3 text-[0.875rem] leading-relaxed text-awc-ink-soft">{s.reading.note}</p>
            </aside>
          </div>

          <footer className="mt-7 flex flex-col gap-4 border-t border-awc-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.8125rem] leading-relaxed text-awc-muted">
              <span className="font-semibold text-awc-ink-soft">{strings.also}:</span> {s.also.join(' · ')}
            </p>
            <button type="button" onClick={() => setI((i + 1) % sheets.length)} className="inline-flex shrink-0 items-center gap-1.5 self-start text-sm font-semibold text-awc-wine-dark hover:text-awc-wine sm:self-auto">
              {strings.next} <ArrowRight size={15} aria-hidden />
            </button>
          </footer>
        </article>
      </div>
    </div>
  );
}
