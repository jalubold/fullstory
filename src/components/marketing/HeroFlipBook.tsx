'use client';

import { useEffect, useRef, useState } from 'react';
import { FlipBook, type Spread } from '@/components/album/FlipBook';
import type { Page, PageSize, PhotoMap } from '@/lib/album/types';

/**
 * The hero's open book, lying on the cloth: it turns its own pages forward then
 * back, pauses on hover, and keeps a satin ribbon in the gutter.
 */
export function HeroFlipBook({ pages, size, photos, interval = 3800 }: { pages: Page[]; size: PageSize; photos: PhotoMap; interval?: number }) {
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
    <div ref={box} className="relative" onPointerEnter={() => (paused.current = true)} onPointerLeave={() => (paused.current = false)}>
      <FlipBook
        spread={spreads[i]}
        dir={dir}
        size={size}
        photos={photos}
        renderWidth={w}
        duration={1500}
        board="ink"
        endpaper="#1b1214"
        eager
        ornament={
          // satin ribbon bookmark lying in the gutter, hanging past the bottom edge
          <span aria-hidden className="ribbon pointer-events-none absolute z-[25]" style={{ left: 'calc(50% + 0.6%)', top: '-1.2%', width: '2.1%', height: '114%' }} />
        }
      />
    </div>
  );
}
