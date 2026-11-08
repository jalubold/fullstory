'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check, Copy, Download, ExternalLink, Loader2 } from 'lucide-react';

export function OrderStatusPoller({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  useEffect(() => {
    if (status !== 'pending') return;
    let n = 0;
    const t = setInterval(async () => {
      n++;
      const res = await fetch(`/api/orders/${orderId}`).catch(() => null);
      const data = res?.ok ? await res.json() : null;
      if ((data && data.status !== 'pending') || n > 60) {
        clearInterval(t);
        router.refresh();
      }
    }, 2500);
    return () => clearInterval(t);
  }, [orderId, status, router]);
  return null;
}

export function DownloadButton({ orderId, label = 'Download PDF', className = 'btn btn-primary' }: { orderId: string; label?: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'preparing' | 'error'>('idle');
  const go = async () => {
    setState('preparing');
    const res = await fetch(`/api/orders/${orderId}/download`, { method: 'POST' }).catch(() => null);
    if (!res?.ok) return setState('error');
    setState('idle');
    const a = document.createElement('a');
    a.href = `/api/orders/${orderId}/download`;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  return (
    <div>
      <button type="button" onClick={go} disabled={state === 'preparing'} className={className}>
        {state === 'preparing' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        {state === 'preparing' ? 'Preparing your PDF…' : label}
      </button>
      {state === 'error' && <p className="mt-2 text-sm text-danger">We couldn’t prepare the PDF. Please try again in a moment.</p>}
      {state === 'preparing' && <p className="mt-2 text-xs text-muted">High-resolution files can take up to a minute.</p>}
    </div>
  );
}

interface ShareProps {
  share: { id: string; token: string; access: 'link' | 'password'; enabled: boolean; allowDownload: boolean; expiresAt: string | null; views: number; hasPassword: boolean };
  origin: string;
  canDownload: boolean;
}

export function ShareManager({ share, origin, canDownload }: ShareProps) {
  const router = useRouter();
  const url = `${origin}/share/${share.token}`;
  const [copied, setCopied] = useState(false);
  const [access, setAccess] = useState(share.access);
  const [password, setPassword] = useState('');
  const [enabled, setEnabled] = useState(share.enabled);
  const [allowDownload, setAllowDownload] = useState(share.allowDownload);
  const [expires, setExpires] = useState(share.expiresAt ? share.expiresAt.slice(0, 10) : '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/shares/${share.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access,
        password: access === 'password' && password ? password : undefined,
        enabled,
        allowDownload,
        expiresAt: expires ? new Date(`${expires}T23:59:59`).toISOString() : null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: 'Sharing settings saved.' } : { ok: false, text: data.error ?? 'Couldn’t save settings.' });
    if (res.ok) {
      setPassword('');
      router.refresh();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input readOnly value={url} className="input font-mono text-xs" aria-label="Share link" onFocus={(e) => e.target.select()} />
        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary btn-sm shrink-0" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
          </button>
          <a href={url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm shrink-0">
            <ExternalLink size={14} /> Open
          </a>
        </div>
      </div>
      <p className="text-xs text-muted">{share.views} {share.views === 1 ? 'view' : 'views'} so far.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="label">Who can view</legend>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2"><input type="radio" checked={access === 'link'} onChange={() => setAccess('link')} className="accent-[#25231f]" /> Anyone with the link</label>
            <label className="flex items-center gap-2"><input type="radio" checked={access === 'password'} onChange={() => setAccess('password')} className="accent-[#25231f]" /> People with the password</label>
          </div>
          {access === 'password' && (
            <input type="password" className="input input-sm mt-3" placeholder={share.hasPassword ? 'Leave blank to keep current password' : 'Choose a password'} value={password} onChange={(e) => setPassword(e.target.value)} minLength={4} />
          )}
        </fieldset>
        <div className="space-y-3">
          <label className="block">
            <span className="label">Link expires</span>
            <input type="date" className="input input-sm" value={expires} onChange={(e) => setExpires(e.target.value)} />
            <span className="mt-1 block text-xs text-muted">Leave empty to keep the link active.</span>
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="accent-[#25231f]" /> Link is active</label>
          {canDownload && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allowDownload} onChange={(e) => setAllowDownload(e.target.checked)} className="accent-[#25231f]" /> Let viewers download the PDF</label>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
          {busy && <Loader2 size={14} className="animate-spin" />} Save sharing settings
        </button>
        {msg && <p className={`text-sm ${msg.ok ? 'text-success' : 'text-danger'}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
