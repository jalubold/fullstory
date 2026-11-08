'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Copy, Loader2 } from 'lucide-react';
import { forgetBrowserAction } from '@/lib/server/actions/account';

/**
 * "Forget this browser" removes access to every album here — so it asks first,
 * and offers the private album link (the only way back) before going ahead.
 */
export function ForgetBrowser({ recoveryUrl }: { recoveryUrl: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-ink-soft underline underline-offset-4 hover:text-danger">
        Forget this browser
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-5">
          <button type="button" aria-label="Cancel" onClick={() => !busy && setOpen(false)} className="animate-fade-in absolute inset-0 bg-ink/45" />
          <div role="alertdialog" aria-modal="true" aria-labelledby="forget-title" aria-describedby="forget-text" className="animate-fade-up relative w-full max-w-md rounded-[6px] bg-card p-6 text-left shadow-pop sm:p-7">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-danger-soft text-danger">
              <AlertTriangle size={20} />
            </span>
            <h2 id="forget-title" className="mt-4 font-serif text-[1.75rem] leading-tight">
              Are you sure?
            </h2>
            <p id="forget-text" className="mt-2 text-sm leading-relaxed text-ink-soft">
              Forgetting this browser removes <span className="font-medium text-ink">all your albums</span> from it. The only way to get them back is your private album link — copy it first and keep it somewhere safe.
            </p>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(recoveryUrl);
                setCopied(true);
              }}
              className="btn btn-secondary mt-5 w-full"
            >
              {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />} {copied ? 'Album link copied' : 'Copy my private album link'}
            </button>
            <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row">
              <button ref={cancel} type="button" onClick={() => setOpen(false)} disabled={busy} className="btn btn-secondary flex-1">
                Keep my albums here
              </button>
              <form action={forgetBrowserAction} onSubmit={() => setBusy(true)} className="flex-1">
                <button type="submit" disabled={busy} className="btn w-full bg-danger text-white hover:bg-danger/90">
                  {busy && <Loader2 size={15} className="animate-spin" />} Yes, forget this browser
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
