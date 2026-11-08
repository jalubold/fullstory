'use client';

import { useState, type ReactNode } from 'react';
import { Check, Copy, KeyRound } from 'lucide-react';

/** Private link that reopens this browser's albums anywhere. */
export function RecoveryLink({ url, footer }: { url: string; footer?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  return (
    <section className="rounded-[6px] border border-line bg-white p-5 sm:p-6">
      <h2 className="flex items-center gap-2.5 font-medium">
        <KeyRound size={18} strokeWidth={1.7} className="shrink-0 text-accent-dark" />
        Your private album link
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Opens your albums on another device, or after clearing your browser. Anyone with this link can open them, so keep it private.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input readOnly value={url} onFocus={(e) => e.target.select()} className="input input-sm min-w-0 flex-1 font-mono text-xs" aria-label="Private album link" />
        <button
          type="button"
          className="btn btn-secondary btn-sm shrink-0"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
      {footer && <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line pt-4 text-sm">{footer}</div>}
    </section>
  );
}
