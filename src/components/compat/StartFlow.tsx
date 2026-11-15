'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import type { ContextInfo } from '@/lib/compat/contexts';
import { track } from '@/lib/compat/track';

export function StartFlow({ contexts }: { contexts: Array<Pick<ContextInfo, 'id' | 'label' | 'hint'>> }) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [context, setContext] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!context || !name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/compat/assessments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context, name }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong. Please try again.');
      track('compat_start', { context });
      router.push(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-2" aria-hidden>
        {[0, 1].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= step ? 'bg-awc-wine' : 'bg-awc-blush-soft'}`} />
        ))}
      </div>

      {step === 0 ? (
        <div key="ctx" className="awc-anim-next">
          <p className="awc-eyebrow">Step 1 of 2</p>
          <h1 className="awc-serif mt-3 text-[2.1rem] leading-tight sm:text-4xl">Where are you two right now?</h1>
          <p className="mt-3 text-awc-ink-soft">This helps us frame your results for your stage. The questions are the same for everyone.</p>
          <div className="mt-7 grid gap-2.5" role="radiogroup" aria-label="Relationship stage">
            {contexts.map((c) => {
              const selected = context === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setContext(c.id);
                    setTimeout(() => setStep(1), 220);
                  }}
                  className={`flex min-h-[4.25rem] items-center justify-between gap-4 rounded-2xl border bg-white px-5 py-4 text-left transition-all duration-200 ${selected ? 'border-awc-wine shadow-[0_0_0_3px_rgb(169_77_101/0.12)]' : 'border-awc-line hover:border-awc-line-strong hover:shadow-[var(--shadow-awc-card)]'}`}
                >
                  <span>
                    <span className="block text-[1.0625rem] font-semibold text-awc-ink">{c.label}</span>
                    <span className="mt-0.5 block text-sm text-awc-muted">{c.hint}</span>
                  </span>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${selected ? 'border-awc-wine bg-awc-wine text-white' : 'border-awc-line-strong'}`}>
                    {selected && <Check size={14} strokeWidth={3} className="awc-anim-pop" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <form key="name" onSubmit={submit} className="awc-anim-next">
          <button type="button" onClick={() => setStep(0)} className="awc-btn awc-btn-ghost -ml-3 mb-4 min-h-0 px-3 py-2 text-sm">
            <ArrowLeft size={16} aria-hidden /> Back
          </button>
          <p className="awc-eyebrow">Step 2 of 2</p>
          <h1 className="awc-serif mt-3 text-[2.1rem] leading-tight sm:text-4xl">What should we call you?</h1>
          <p className="mt-3 text-awc-ink-soft">Your first name is enough. The other person will see it on their invitation and in your results.</p>
          <label htmlFor="awc-name" className="sr-only">Your name</label>
          <input
            id="awc-name"
            className="awc-input mt-7"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your first name"
            autoComplete="given-name"
            autoFocus
            maxLength={40}
            enterKeyHint="go"
          />
          {error && <p className="mt-3 text-sm text-[#a3302a]" role="alert">{error}</p>}
          <button type="submit" disabled={!name.trim() || busy} className="awc-btn awc-btn-primary mt-6 w-full text-base">
            {busy ? <Loader2 size={18} className="animate-spin" aria-hidden /> : null}
            {busy ? 'Setting up…' : 'Begin the questions'}
            {!busy && <ArrowRight size={18} aria-hidden />}
          </button>
          <p className="mt-4 text-center text-[0.8125rem] leading-relaxed text-awc-muted">No account needed. We’ll give you a private link to come back to.</p>
        </form>
      )}
    </div>
  );
}
