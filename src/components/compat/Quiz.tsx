'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, Lock, Pencil } from 'lucide-react';
import type { Locale } from '@/lib/compat/i18n';
import { track } from '@/lib/compat/track';
import { UI } from '@/lib/compat/ui-strings';

export interface QuizQuestion {
  id: string;
  dimension: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
}

interface Props {
  token: string;
  name: string;
  partnerName: string | null;
  role: 'a' | 'b';
  questions: QuizQuestion[];
  dimensions: Array<{ id: string; label: string }>;
  initialAnswers: Record<string, string>;
  locale: Locale;
}

type Screen = { kind: 'intro' } | { kind: 'question'; index: number; dir: 'next' | 'back' } | { kind: 'review' };

const LETTERS = 'ABCDE';

export function Quiz({ token, name, partnerName, role, questions, dimensions, initialAnswers, locale }: Props) {
  const t = UI[locale].quiz;
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const answered = questions.filter((q) => answers[q.id]).length;
  const [screen, setScreen] = useState<Screen>(() => {
    const first = questions.findIndex((q) => !initialAnswers[q.id]);
    if (first === -1) return { kind: 'review' };
    return first === 0 ? { kind: 'intro' } : { kind: 'question', index: first, dir: 'next' };
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnToReview, setReturnToReview] = useState(false);
  const latest = useRef(answers);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (keepalive = false) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = null;
      return fetch(`/api/compat/p/${token}/answers`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: latest.current }), keepalive }).catch(() => {});
    },
    [token],
  );

  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden' && saveTimer.current) void save(true);
    };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, [save]);

  const go = useCallback((s: Screen) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setScreen(s);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const choose = useCallback(
    (qIndex: number, optionId: string) => {
      const q = questions[qIndex];
      const next = { ...latest.current, [q.id]: optionId };
      latest.current = next;
      setAnswers(next);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void save(), 500);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => {
        if (returnToReview) {
          setReturnToReview(false);
          go({ kind: 'review' });
          return;
        }
        if (qIndex < questions.length - 1) return go({ kind: 'question', index: qIndex + 1, dir: 'next' });
        const missing = questions.findIndex((x) => !next[x.id]);
        go(missing === -1 ? { kind: 'review' } : { kind: 'question', index: missing, dir: 'next' });
      }, 320);
    },
    [questions, save, go, returnToReview],
  );

  // Keyboard: 1–5 / A–E choose, ← back, → forward (if answered).
  useEffect(() => {
    if (screen.kind !== 'question') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const q = questions[screen.index];
      const k = e.key.toUpperCase();
      const n = /^[1-5]$/.test(k) ? Number(k) - 1 : LETTERS.indexOf(k);
      if (n >= 0 && n < q.options.length) {
        e.preventDefault();
        choose(screen.index, q.options[n].id);
      } else if (e.key === 'ArrowLeft' && screen.index > 0) go({ kind: 'question', index: screen.index - 1, dir: 'back' });
      else if (e.key === 'ArrowRight' && answers[q.id] && screen.index < questions.length - 1) go({ kind: 'question', index: screen.index + 1, dir: 'next' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, questions, answers, choose, go]);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/compat/p/${token}/answers`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: latest.current, submit: true }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t.error);
      track('compat_submit', { role, locale });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
      setSubmitting(false);
    }
  }

  if (screen.kind === 'intro') {
    return (
      <div className="awc-anim-in flex flex-1 flex-col justify-center py-6">
        <p className="awc-eyebrow">{t.hello(name)}</p>
        <h1 className="awc-serif mt-4 text-[2.4rem] leading-[1.08] sm:text-5xl">
          {t.introA} <em className="text-awc-wine">{t.introB}</em>
        </h1>
        <ul className="mt-8 space-y-4 text-[1.0625rem] leading-relaxed text-awc-ink-soft">
          <li className="flex gap-3"><span className="awc-numeral mt-0.5 w-6 text-xl">i</span>{t.rule1}</li>
          <li className="flex gap-3"><span className="awc-numeral mt-0.5 w-6 text-xl">ii</span>{t.rule2}</li>
          <li className="flex gap-3">
            <span className="awc-numeral mt-0.5 w-6 text-xl">iii</span>
            {partnerName ? t.rule3Named(partnerName) : t.rule3}
          </li>
        </ul>
        <button
          type="button"
          onClick={() => {
            track('compat_quiz_begin', { role, locale });
            go({ kind: 'question', index: 0, dir: 'next' });
          }}
          className="awc-btn awc-btn-primary mt-10 w-full text-base sm:w-auto sm:self-start sm:px-10"
        >
          {t.ready} <ArrowRight size={18} aria-hidden />
        </button>
      </div>
    );
  }

  if (screen.kind === 'review') {
    const complete = answered === questions.length;
    return (
      <div className="awc-anim-in py-2">
        <p className="awc-eyebrow">{t.reviewEyebrow}</p>
        <h1 className="awc-serif mt-3 text-[2.1rem] leading-tight sm:text-4xl">{t.reviewTitle}</h1>
        <p className="mt-3 flex items-start gap-2 text-awc-ink-soft">
          <Lock size={16} className="mt-1 shrink-0 text-awc-wine" aria-hidden />
          {t.reviewLock}
        </p>
        <ol className="mt-7 divide-y divide-awc-line overflow-hidden rounded-2xl border border-awc-line bg-white">
          {questions.map((q, i) => {
            const opt = q.options.find((o) => o.id === answers[q.id]);
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => {
                    setReturnToReview(true);
                    go({ kind: 'question', index: i, dir: 'back' });
                  }}
                  className="group flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-awc-cream sm:px-5"
                >
                  <span className="awc-numeral w-6 shrink-0 pt-0.5 text-base">{String(i + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.8125rem] text-awc-muted">{q.prompt}</span>
                    <span className={`mt-0.5 block text-[0.9375rem] ${opt ? 'font-semibold text-awc-ink' : 'italic text-awc-wine'}`}>{opt?.label ?? t.notAnswered}</span>
                  </span>
                  <Pencil size={15} className="mt-1 shrink-0 text-awc-muted opacity-60 group-hover:text-awc-wine group-hover:opacity-100" aria-label={t.change} />
                </button>
              </li>
            );
          })}
        </ol>
        {error && <p className="mt-4 text-sm text-[#a3302a]" role="alert">{error}</p>}
        <div className="sticky bottom-0 -mx-5 mt-6 bg-gradient-to-t from-awc-cream via-awc-cream to-awc-cream/0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 sm:static sm:mx-0 sm:bg-none sm:px-0">
          <button type="button" onClick={submit} disabled={!complete || submitting} className="awc-btn awc-btn-primary w-full text-base">
            {submitting ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Check size={18} aria-hidden />}
            {submitting ? t.submitting : complete ? t.submit : t.left(questions.length - answered)}
          </button>
        </div>
      </div>
    );
  }

  const q = questions[screen.index];
  const dimIndex = dimensions.findIndex((d) => d.id === q.dimension);
  const inDim = questions.filter((x) => x.dimension === q.dimension);
  const posInDim = inDim.findIndex((x) => x.id === q.id);
  const selected = answers[q.id];

  return (
    <div className="flex flex-1 flex-col">
      {/* Progress: five dimensions, four questions each */}
      <div className="flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answered} aria-label={t.progress(answered, questions.length)}>
        {dimensions.map((d) => {
          const qs = questions.filter((x) => x.dimension === d.id);
          return (
            <div key={d.id} className="flex flex-1 gap-0.5">
              {qs.map((x) => (
                <span key={x.id} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${x.id === q.id ? 'bg-awc-wine-deep' : answers[x.id] ? 'bg-awc-wine' : 'bg-awc-blush-soft'}`} />
              ))}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-[0.8125rem]">
        <span className="font-semibold text-awc-wine">
          {dimensions[dimIndex]?.label} · {t.of(posInDim + 1, inDim.length)}
        </span>
        <span className="tabular-nums text-awc-muted">
          {screen.index + 1} / {questions.length}
        </span>
      </div>

      <div key={q.id} className={`${screen.dir === 'next' ? 'awc-anim-next' : 'awc-anim-back'} flex flex-1 flex-col pt-8 sm:pt-12`}>
        <span className="awc-numeral text-5xl sm:text-6xl">{String(screen.index + 1).padStart(2, '0')}</span>
        <h1 className="awc-serif mt-4 text-[1.8rem] leading-[1.15] text-awc-ink sm:text-[2.4rem]">{q.prompt}</h1>
        <div className="mt-8 grid gap-2.5" role="radiogroup" aria-label={q.prompt}>
          {q.options.map((o, i) => {
            const isSel = selected === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={isSel}
                onClick={() => choose(screen.index, o.id)}
                className={`group flex min-h-[3.75rem] w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 sm:px-5 ${isSel ? 'border-awc-wine bg-awc-blush-soft/60 shadow-[0_0_0_3px_rgb(169_77_101/0.12)]' : 'border-awc-line bg-white hover:-translate-y-px hover:border-awc-line-strong hover:shadow-[var(--shadow-awc-card)]'}`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${isSel ? 'border-awc-wine bg-awc-wine text-white' : 'border-awc-line-strong text-awc-muted group-hover:border-awc-wine group-hover:text-awc-wine'}`}>
                  {isSel ? <Check size={14} strokeWidth={3} className="awc-anim-pop" /> : LETTERS[i]}
                </span>
                <span className="text-[1rem] leading-snug text-awc-ink sm:text-[1.0625rem]">{o.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={() => (screen.index === 0 ? go({ kind: 'intro' }) : go({ kind: 'question', index: screen.index - 1, dir: 'back' }))}
          className="awc-btn awc-btn-ghost -ml-3 min-h-0 px-3 py-2 text-sm"
        >
          <ArrowLeft size={16} aria-hidden /> {t.back}
        </button>
        {selected && (
          <button
            type="button"
            onClick={() => (screen.index === questions.length - 1 || returnToReview ? (setReturnToReview(false), go({ kind: 'review' })) : go({ kind: 'question', index: screen.index + 1, dir: 'next' }))}
            className="awc-btn awc-btn-ghost -mr-3 min-h-0 px-3 py-2 text-sm"
          >
            {screen.index === questions.length - 1 || returnToReview ? t.review : t.next} <ArrowRight size={16} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
