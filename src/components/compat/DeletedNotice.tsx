'use client';

import { useSyncExternalStore } from 'react';
import { Check } from 'lucide-react';

const subscribe = () => () => {};
const deletedNow = () => new URLSearchParams(window.location.search).get('deleted') === '1';

/** Confirms a deletion after the private page sends the visitor home with ?deleted=1. */
export function DeletedNotice({ message }: { message: string }) {
  const show = useSyncExternalStore(subscribe, deletedNow, () => false);
  if (!show) return null;
  return (
    <div className="awc-container pt-4">
      <p role="status" className="flex items-center gap-2.5 rounded-2xl border border-awc-sage/30 bg-awc-sage-soft px-4 py-3 text-sm text-awc-ink">
        <Check size={16} className="shrink-0 text-awc-sage" aria-hidden />
        {message}
      </p>
    </div>
  );
}
