'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, EyeOff, Loader2 } from 'lucide-react';
import { track } from '@/lib/compat/track';

export function JoinFlow({ invite, inviterName }: { invite: string; inviterName: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; url?: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/compat/invites/${invite}/claim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ message: data.error ?? 'Something went wrong. Please try again.', url: data.url });
        setBusy(false);
        return;
      }
      track('compat_join');
      router.push(data.url);
    } catch {
      setError({ message: 'Something went wrong. Please try again.' });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="awc-anim-in">
      <p className="awc-eyebrow">An invitation from {inviterName}</p>
      <h1 className="awc-serif mt-4 text-[2.4rem] leading-[1.06] sm:text-5xl">
        {inviterName} wants to know: <em className="text-awc-wine">are you compatible?</em>
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-awc-ink-soft">
        {inviterName} has answered 20 questions about how you talk, love, live and plan. Now it’s your turn — then you’ll both see what connects you and where you differ.
      </p>
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-awc-blush-soft/60 p-4 text-[0.9375rem] leading-relaxed text-awc-ink">
        <EyeOff size={18} className="mt-0.5 shrink-0 text-awc-wine" aria-hidden />
        <p>{inviterName}’s answers stay hidden until you’ve submitted yours, so you can answer honestly — for yourself.</p>
      </div>
      <label htmlFor="awc-join-name" className="mt-8 block text-sm font-semibold text-awc-ink">
        Your first name
      </label>
      <input id="awc-join-name" className="awc-input mt-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" autoComplete="given-name" maxLength={40} enterKeyHint="go" />
      {error && (
        <p className="mt-3 text-sm text-[#a3302a]" role="alert">
          {error.message}{' '}
          {error.url && (
            <a href={error.url} className="font-semibold underline underline-offset-2">
              Open your own test
            </a>
          )}
        </p>
      )}
      <button type="submit" disabled={!name.trim() || busy} className="awc-btn awc-btn-primary mt-6 w-full text-base">
        {busy && <Loader2 size={18} className="animate-spin" aria-hidden />}
        {busy ? 'Getting your questions ready…' : 'Start my answers'}
        {!busy && <ArrowRight size={18} aria-hidden />}
      </button>
      <p className="mt-4 text-center text-[0.8125rem] text-awc-muted">20 questions · about 6 minutes · no account needed</p>
    </form>
  );
}
