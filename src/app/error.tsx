'use client';

import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-6 text-center">
      <div className="max-w-md">
        <h1 className="font-serif text-4xl">Something went wrong.</h1>
        <p className="mt-3 text-ink-soft">
          {/setup|not configured/i.test(error.message) ? error.message : 'An unexpected error occurred. Your saved work is safe.'}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">Try again</button>
          <Link href="/" className="btn btn-secondary">Go home</Link>
        </div>
        {error.digest && <p className="mt-6 text-xs text-muted">Reference: {error.digest}</p>}
      </div>
    </div>
  );
}
