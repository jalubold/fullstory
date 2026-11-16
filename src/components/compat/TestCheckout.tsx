'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Locale } from '@/lib/compat/i18n';
import { UI } from '@/lib/compat/ui-strings';

/** Development-only checkout: choose the outcome. No money moves. */
export function TestCheckout({ token, orderId, session, locale }: { token: string; orderId: string; session: string; locale: Locale }) {
  const t = UI[locale].checkout;
  const router = useRouter();
  const [busy, setBusy] = useState<'paid' | 'failed' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const complete = async (outcome: 'paid' | 'failed') => {
    setBusy(outcome);
    setError(null);
    const res = await fetch(`/api/compat/p/${token}/test-payment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, session, outcome }) });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? t.error);
      setBusy(null);
      return;
    }
    router.push(outcome === 'paid' ? `/compatible/s/${token}/blueprint` : `/compatible/s/${token}?payment=failed`);
  };
  return (
    <div className="grid gap-2.5">
      <button type="button" disabled={!!busy} onClick={() => complete('paid')} className="awc-btn awc-btn-primary w-full">
        {busy === 'paid' && <Loader2 size={16} className="animate-spin" aria-hidden />} {t.success}
      </button>
      <button type="button" disabled={!!busy} onClick={() => complete('failed')} className="awc-btn awc-btn-secondary w-full">
        {busy === 'failed' && <Loader2 size={16} className="animate-spin" aria-hidden />} {t.fail}
      </button>
      {error && <p className="text-sm text-[#a3302a]" role="alert">{error}</p>}
    </div>
  );
}
