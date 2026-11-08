'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';

export function ShareUnlock({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mx-auto mt-10 max-w-xs space-y-3 text-left"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const res = await fetch(`/api/share/${token}/unlock`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
        const d = await res.json().catch(() => ({}));
        setBusy(false);
        if (!res.ok) return setError(d.error ?? 'That password isn’t right.');
        router.refresh();
      }}
    >
      <label className="smallcaps block !text-white/60" htmlFor="pw">Password</label>
      <input id="pw" type="password" className="input !border-white/20 text-center tracking-[0.2em]" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
      {error && <p role="alert" className="text-center text-sm text-[#ffd3d9]">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-light btn-lg w-full text-[0.75rem] uppercase tracking-[0.2em]">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={14} />} Open the album
      </button>
    </form>
  );
}
