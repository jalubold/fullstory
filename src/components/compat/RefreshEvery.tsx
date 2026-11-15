'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Re-renders the server page on an interval (e.g. while a payment is being confirmed). Stops after ~2 minutes. */
export function RefreshEvery({ ms }: { ms: number }) {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      if (++n > 120_000 / ms) return clearInterval(id);
      router.refresh();
    }, ms);
    return () => clearInterval(id);
  }, [ms, router]);
  return null;
}
