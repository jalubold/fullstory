'use client';

import { useState } from 'react';
import { Check, Copy, KeyRound } from 'lucide-react';

/** Private link that reopens this browser's albums anywhere. */
export function RecoveryLink({ url, compact = false }: { url: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={compact ? '' : 'rounded-2xl border border-line bg-white p-6'}>
      <div className="flex items-start gap-3">
        <KeyRound size={20} strokeWidth={1.6} className="mt-0.5 shrink-0 text-accent-dark" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">Your private album link</p>
          <p className="mt-1 text-sm text-ink-soft">
            Your albums are saved in this browser — no account needed. Keep this link somewhere safe to open them on another device or
            if you clear your browser. Anyone with the link can open your albums.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input readOnly value={url} onFocus={(e) => e.target.select()} className="input input-sm font-mono text-xs" aria-label="Private album link" />
            <button
              type="button"
              className="btn btn-secondary btn-sm shrink-0"
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
