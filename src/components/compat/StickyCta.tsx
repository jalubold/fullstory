'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Phones only: keeps the primary action one tap away, but only once the visitor
 * has scrolled past the hero's own button (so it never covers the hero or
 * doubles up with that button), and hides again near the closing call to action.
 */
export function StickyCta({ label, watchId, hideNearId }: { label: string; watchId: string; hideNearId?: string }) {
  const [pastHero, setPastHero] = useState(false);
  const [endVisible, setEndVisible] = useState(false);
  useEffect(() => {
    const hero = document.getElementById(watchId);
    const end = hideNearId ? document.getElementById(hideNearId) : null;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0);
        if (e.target === end) setEndVisible(e.isIntersecting);
      }
    });
    if (hero) io.observe(hero);
    if (end) io.observe(end);
    return () => io.disconnect();
  }, [watchId, hideNearId]);
  const show = pastHero && !endVisible;
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all duration-300 sm:hidden ${show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'}`}
      aria-hidden={!show}
    >
      <Link href="/compatible/start" tabIndex={show ? 0 : -1} className="awc-btn awc-btn-primary w-full shadow-[var(--shadow-awc-lift)]">
        {label} <ArrowRight size={18} aria-hidden />
      </Link>
    </div>
  );
}
