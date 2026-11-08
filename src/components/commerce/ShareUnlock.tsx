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
      className="space-y-4"
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
      <label className="label" htmlFor="pw">Password</label>
      <input id="pw" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />} View album
      </button>
    </form>
  );
}
