'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, EyeOff, Loader2 } from 'lucide-react';
import type { Locale } from '@/lib/compat/i18n';
import { track } from '@/lib/compat/track';
import { UI } from '@/lib/compat/ui-strings';

export function JoinFlow({ invite, inviterName, locale }: { invite: string; inviterName: string; locale: Locale }) {
  const t = UI[locale].join;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; url?: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Read the field itself rather than React state: on a slow phone the name
    // may have been typed before this page's scripts finished loading.
    const name = String(new FormData(e.currentTarget).get('name') ?? '').trim();
    if (busy) return;
    if (!name) {
      setError({ message: UI[locale].errors.name });
      e.currentTarget.querySelector('input')?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/compat/invites/${invite}/claim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ message: data.error ?? t.error, url: data.url });
        setBusy(false);
        return;
      }
      track('compat_join', { locale });
      router.push(data.url);
    } catch {
      setError({ message: t.error });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="awc-anim-in">
      <p className="awc-eyebrow">{t.eyebrow(inviterName)}</p>
      <h1 className="awc-serif mt-4 text-[2.4rem] leading-[1.06] sm:text-5xl">
        {t.titleA(inviterName)} <em className="text-awc-wine">{t.titleEm}</em>
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-awc-ink-soft">
        {t.lead(inviterName)}
      </p>
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-awc-blush-soft/60 p-4 text-[0.9375rem] leading-relaxed text-awc-ink">
        <EyeOff size={18} className="mt-0.5 shrink-0 text-awc-wine" aria-hidden />
        <p>{t.hidden(inviterName)}</p>
      </div>
      <label htmlFor="awc-join-name" className="mt-8 block text-sm font-semibold text-awc-ink">
        {t.label}
      </label>
      <input id="awc-join-name" name="name" className="awc-input mt-2" onInput={() => error && setError(null)} placeholder={UI[locale].start.namePlaceholder} autoComplete="given-name" maxLength={40} enterKeyHint="go" required />
      {error && (
        <p className="mt-3 text-sm text-[#a3302a]" role="alert">
          {error.message}{' '}
          {error.url && (
            <a href={error.url} className="font-semibold underline underline-offset-2">
              {t.openOwn}
            </a>
          )}
        </p>
      )}
      <button type="submit" disabled={busy} className="awc-btn awc-btn-primary mt-6 w-full text-base">
        {busy && <Loader2 size={18} className="animate-spin" aria-hidden />}
        {busy ? t.busy : t.submit}
        {!busy && <ArrowRight size={18} aria-hidden />}
      </button>
      <p className="mt-4 text-center text-[0.8125rem] text-awc-muted">{t.facts}</p>
    </form>
  );
}
