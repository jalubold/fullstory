'use client';

import { useEffect, useRef, useState } from 'react';
import { FlipBook, type Spread } from '@/components/album/FlipBook';
import type { Page, PageSize, PhotoMap } from '@/lib/album/types';

/** The hero's open book: it turns its own pages, forward then back, and pauses on hover. */
export function HeroFlipBook({ pages, size, photos, interval = 3600 }: { pages: Page[]; size: PageSize; photos: PhotoMap; interval?: number }) {
  const spreads: Spread[] = [];
  for (let i = 0; i + 1 < pages.length; i += 2) spreads.push({ left: pages[i], right: pages[i + 1] });
  const [{ i, dir }, setPos] = useState<{ i: number; dir: 1 | -1 }>({ i: 0, dir: 1 });
  const [w, setW] = useState(900);
  const paused = useRef(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => {
      if (paused.current || document.hidden) return;
      setPos((cur) => {
        let d = cur.dir;
        if (cur.i + d >= spreads.length || cur.i + d < 0) d = (d * -1) as 1 | -1;
        return { i: cur.i + d, dir: d };
      });
    }, interval);
    return () => clearInterval(t);
  }, [interval, spreads.length]);

  return (
    <div ref={box} onPointerEnter={() => (paused.current = true)} onPointerLeave={() => (paused.current = false)}>
      <FlipBook spread={spreads[i]} dir={dir} size={size} photos={photos} renderWidth={w} duration={1100} eager />
    </div>
  );
}
