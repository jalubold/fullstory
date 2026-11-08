'use client';

import Link from 'next/link';
import { ClothScreen } from '@/components/ui/ClothScreen';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ClothScreen kicker="An interruption" title={<>Something slipped <span className="italic">out of place.</span></>}>
      <p className="mx-auto mt-5 max-w-sm text-white/70">
        {/setup|not configured/i.test(error.message) ? error.message : 'Your saved work is safe. Try again — it usually works the second time.'}
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <button type="button" onClick={reset} className="btn btn-light btn-lg text-[0.75rem] uppercase tracking-[0.2em]">
          Try again
        </button>
        <Link href="/" className="text-[0.75rem] font-medium uppercase tracking-[0.2em] text-white">
          <span className="link-underline">Go home</span>
        </Link>
      </div>
      {error.digest && <p className="mt-10 font-mono text-[0.6875rem] text-white/40">Reference {error.digest}</p>}
    </ClothScreen>
  );
}
