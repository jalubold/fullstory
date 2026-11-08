'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

export function TestPayment({ orderId, session, cancelHref }: { orderId: string; session: string; cancelHref: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'paid' | 'failed' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const complete = async (outcome: 'paid' | 'failed') => {
    setBusy(outcome);
    const res = await fetch('/api/payments/test/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, session, outcome }) });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? 'Something went wrong.');
      setBusy(null);
      return;
    }
    router.push(`/orders/${orderId}?session_id=${session}`);
  };
  return (
    <div className="space-y-3">
      {error && <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
      <button type="button" className="btn btn-primary btn-lg w-full" disabled={!!busy} onClick={() => complete('paid')}>
        {busy === 'paid' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Simulate successful payment
      </button>
      <button type="button" className="btn btn-secondary btn-lg w-full" disabled={!!busy} onClick={() => complete('failed')}>
        {busy === 'failed' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Simulate failed payment
      </button>
      <a href={cancelHref} className="block text-center text-sm text-muted underline underline-offset-4">Cancel and return to checkout</a>
    </div>
  );
}
