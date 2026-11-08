'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';

interface Props {
  id: string;
  isPrint: boolean;
  paid: boolean;
  fulfillment: string | null;
  carrier: string | null;
  tracking: string | null;
  trackingUrl: string | null;
}

export function AdminOrderActions({ id, isPrint, paid, fulfillment, carrier, tracking, trackingUrl }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(fulfillment ?? 'processing');
  const [c, setC] = useState(carrier ?? '');
  const [t, setT] = useState(tracking ?? '');
  const [u, setU] = useState(trackingUrl ?? '');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const call = async (label: string, url: string, init: RequestInit) => {
    setBusy(label);
    setMsg(null);
    const res = await fetch(url, init);
    const d = await res.json().catch(() => ({}));
    setBusy(null);
    setMsg(res.ok ? 'Saved' : d.error ?? 'Failed');
    if (res.ok) router.refresh();
  };

  if (!paid) return <span className="text-xs text-muted">No actions until paid</span>;
  return (
    <div className="space-y-2">
      {isPrint && (
        <>
          <div className="flex flex-wrap gap-2">
            <a className="btn btn-secondary btn-sm" href={`/api/admin/orders/${id}/file?kind=print-interior`}><FileDown size={13} /> Interior PDF</a>
            <a className="btn btn-secondary btn-sm" href={`/api/admin/orders/${id}/file?kind=print-cover`}><FileDown size={13} /> Cover PDF</a>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <select className="input input-sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Fulfilment status">
              <option value="processing">Order received</option>
              <option value="in_production">In production</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input className="input input-sm" placeholder="Carrier" value={c} onChange={(e) => setC(e.target.value)} />
            <input className="input input-sm" placeholder="Tracking number" value={t} onChange={(e) => setT(e.target.value)} />
            <input className="input input-sm" placeholder="Tracking URL" value={u} onChange={(e) => setU(e.target.value)} />
          </div>
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {isPrint && (
          <button type="button" className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => call('save', `/api/admin/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, carrier: c || undefined, trackingNumber: t || undefined, trackingUrl: u || undefined }) })}>
            {busy === 'save' && <Loader2 size={13} className="animate-spin" />} Update
          </button>
        )}
        <button type="button" className="btn btn-sm border border-danger/30 text-danger hover:bg-danger-soft" disabled={!!busy} onClick={() => window.confirm('Refund this order in full? Access to downloads and share links will be revoked.') && call('refund', `/api/admin/orders/${id}/refund`, { method: 'POST' })}>
          {busy === 'refund' && <Loader2 size={13} className="animate-spin" />} Refund
        </button>
        {msg && <span className="text-xs text-muted">{msg}</span>}
      </div>
    </div>
  );
}
