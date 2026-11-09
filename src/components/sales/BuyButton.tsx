'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';

export type BuyTarget = { projectId: string } | { templateId: string | null; sizeId: string; title: string; pageCount?: number };

/**
 * Straight to secure checkout — no in-between screen. Sets up the album (or
 * reuses the one already started from this design) and opens the payment page.
 */
export function BuyButton({ target, label, className = 'btn btn-primary btn-lg' }: { target: BuyTarget; label: string; className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One key per visit: a retried request returns the same album instead of a copy.
  const key = useRef<string | null>(null);

  // Coming back from the payment page (browser back) must show a usable button again.
  useEffect(() => {
    const reset = () => setBusy(false);
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  const go = async () => {
    setBusy(true);
    setError(null);
    key.current ??= crypto.randomUUID();
    try {
      const res = await fetch('/api/albums/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('projectId' in target ? target : { ...target, clientKey: key.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) return window.location.assign(data.url);
      if (res.ok && data.unlocked && data.projectId) return router.push(`/projects/${data.projectId}/edit`);
      setError(data.error ?? 'We couldn’t open checkout. Please try again.');
    } catch {
      setError('The connection dropped. Please try again.');
    }
    setBusy(false);
  };

  return (
    <div>
      <button type="button" onClick={go} disabled={busy} aria-busy={busy} className={className}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
        {busy ? 'Opening secure checkout…' : label}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
