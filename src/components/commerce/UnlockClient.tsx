'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { isMobileDevice } from '@/lib/client/device';

/** "Unlock & start": opens secure checkout for this album. */
export function UnlockButton({ projectId, label }: { projectId: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const go = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/albums/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && data.url) return window.location.assign(data.url);
    if (res?.ok && data.unlocked) return window.location.reload();
    setBusy(false);
    setError(data.error ?? 'We couldn’t open checkout. Please try again.');
  };
  return (
    <>
      <button type="button" onClick={go} disabled={busy} className="btn btn-light btn-lg h-14 w-full text-[0.75rem] uppercase tracking-[0.18em] sm:w-auto sm:px-10">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />} {label}
      </button>
      {error && <p className="mt-3 text-sm text-white">{error}</p>}
    </>
  );
}

/** Payment confirmed: straight into the album (phones to the editor, desktops add a batch of photos first). */
export function OpenAlbum({ projectId, hasPhotos }: { projectId: string; hasPhotos: boolean }) {
  const router = useRouter();
  useEffect(() => {
    const url = isMobileDevice() || hasPhotos ? `/projects/${projectId}/edit` : `/projects/${projectId}/photos`;
    router.replace(url);
    const t = window.setTimeout(() => window.location.replace(url), 6000);
    return () => window.clearTimeout(t);
  }, [projectId, hasPhotos, router]);
  return null;
}
