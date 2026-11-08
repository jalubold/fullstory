'use client';

import { useEffect, useState } from 'react';
import { Download, QrCode, X } from 'lucide-react';

/** The album's QR code with downloads — scanning it opens the shared album. */
export function ShareQr({ token, size = 'md' }: { token: string; size?: 'sm' | 'md' }) {
  const src = `/api/share/${token}/qr`;
  return (
    <div className={`flex gap-4 ${size === 'sm' ? 'items-center' : 'flex-col items-center text-center sm:flex-row sm:items-center sm:text-left'}`}>
      <img src={src} alt="QR code for your shared album" className={`shrink-0 rounded-[4px] border border-line bg-white p-1.5 ${size === 'sm' ? 'h-24 w-24' : 'h-40 w-40'}`} />
      <div className="min-w-0">
        <p className="font-medium">Scan to open the album</p>
        <p className="mt-1 text-sm text-ink-soft">Print it on invitations, place cards, a frame or a thank-you note — anyone who scans it lands on your album.</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
          <a href={`${src}?download`} download className="btn btn-secondary btn-sm">
            <Download size={14} /> PNG
          </a>
          <a href={`${src}?format=svg&download`} download className="btn btn-ghost btn-sm">
            <Download size={14} /> SVG for print
          </a>
        </div>
      </div>
    </div>
  );
}

/** A small "QR code" action that opens the code in a dialog. */
export function ShareQrButton({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-ink">
        <QrCode size={13} /> QR code
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-5">
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="animate-fade-in absolute inset-0 bg-ink/45" />
          <div role="dialog" aria-modal="true" aria-label="Album QR code" className="animate-fade-up relative w-full max-w-md rounded-[6px] bg-card p-6 shadow-pop sm:p-7">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-3 top-3 grid h-10 w-10 place-items-center text-muted hover:text-ink">
              <X size={20} />
            </button>
            <h2 className="mb-5 font-serif text-[1.75rem] leading-tight">Your album’s QR code</h2>
            <ShareQr token={token} />
          </div>
        </div>
      )}
    </>
  );
}
