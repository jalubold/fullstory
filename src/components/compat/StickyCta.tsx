'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Phones only: keeps the primary action one tap away, but only once the hero's
 * own button has scrolled out of view (so the two never show at once), and
 * hides again near the closing call to action.
 */
export function StickyCta({ label, watchId, hideNearId }: { label: string; watchId: string; hideNearId?: string }) {
  const [heroVisible, setHeroVisible] = useState(true);
  const [endVisible, setEndVisible] = useState(false);
  useEffect(() => {
    const hero = document.getElementById(watchId);
    const end = hideNearId ? document.getElementById(hideNearId) : null;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) setHeroVisible(e.isIntersecting);
        if (e.target === end) setEndVisible(e.isIntersecting);
      }
    });
    if (hero) io.observe(hero);
    if (end) io.observe(end);
    return () => io.disconnect();
  }, [watchId, hideNearId]);
  const show = !heroVisible && !endVisible;
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
