'use client';

import { useEffect, useState } from 'react';
import { parseRevealed, REVEAL_COOKIE, REVEAL_MAX } from '@/lib/compat/reveal';
import { Venn } from './Brand';

/** Remembers that this browser has seen these results, so the curtain plays only once. */
function rememberReveal(key: string) {
  const seen = parseRevealed(document.cookie.match(new RegExp(`(?:^|;\\s*)${REVEAL_COOKIE}=([^;]*)`))?.[1]);
  if (seen.includes(key)) return;
  document.cookie = `${REVEAL_COOKIE}=${[key, ...seen].slice(0, REVEAL_MAX).join('.')}; path=/; max-age=${400 * 86400}; samesite=lax`;
}

/**
 * The first look at the results: a wine curtain where the two circles slide
 * together, then it lifts to show the page underneath. Pure CSS timing, so it
 * also plays on a cold page load; tap anywhere to skip.
 */
export function Reveal({ revealKey, names, overlap, ready, skip }: { revealKey: string; names: { a: string; b: string }; overlap: number; ready: string; skip: string }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    rememberReveal(revealKey);
    const timer = setTimeout(() => setGone(true), 3700);
    return () => clearTimeout(timer);
  }, [revealKey]);
  if (gone) return null;
  return (
    <div className="awc-reveal fixed inset-0 z-[60] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-awc-wine-deep px-6 text-center text-white" onClick={() => setGone(true)} role="status">
      <Venn names={names} overlap={overlap} size={300} tone="dark" className="h-auto w-[15rem] sm:w-[19rem]" />
      <p className="awc-reveal-names awc-serif mt-3 text-balance text-[2.2rem] leading-tight sm:text-5xl">
        {names.a} <em className="text-awc-blush">&</em> {names.b}
      </p>
      <p className="awc-reveal-ready mt-4 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-awc-blush">{ready}</p>
      <p className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] text-xs text-white/40">{skip}</p>
    </div>
  );
}
