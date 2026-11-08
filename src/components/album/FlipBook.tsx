'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { Page, PageSize, PhotoMap } from '@/lib/album/types';
import { BookSide, type BookBoard, BOARDS } from './Book';

export interface Spread {
  left: Page | null;
  right: Page | null;
}

interface Props {
  spread: Spread;
  /** +1 when moving forward through the book, -1 backwards. */
  dir: 1 | -1;
  size: Pick<PageSize, 'widthMm' | 'heightMm'>;
  photos: PhotoMap;
  renderWidth: number;
  endpaper?: string;
  board?: BookBoard;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  eager?: boolean;
}

const key = (s: Spread) => `${s.left?.id ?? '_'}|${s.right?.id ?? '_'}`;

/**
 * An open book that turns its page in 3D whenever `spread` changes: the leaf
 * lifts from the spine and rotates over, showing the next page on its back,
 * with light and shadow following the turn.
 */
export function FlipBook({ spread, dir, size, photos, renderWidth, endpaper = '#7A1020', board = 'red', duration = 900, className = '', style, eager }: Props) {
  const [shown, setShown] = useState(spread);
  const [anim, setAnim] = useState<{ from: Spread; to: Spread; dir: 1 | -1 } | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Derived state: start a turn whenever a different spread arrives.
  if (key(spread) !== key(anim ? anim.to : shown)) {
    if (reduced) {
      setShown(spread);
      setAnim(null);
    } else {
      setAnim({ from: anim ? anim.to : shown, to: spread, dir });
    }
  }

  const half = renderWidth / 2;
  const side = (page: Page | null, s: 'left' | 'right') => (
    <BookSide page={page} side={s} size={size} photos={photos} width={half} eager={eager} endpaper={endpaper} />
  );
  const frame = (
    <div
      aria-hidden
      className="absolute rounded-[3px]"
      style={{
        inset: '0.8% -0.9% -1.6% -0.9%',
        background: BOARDS[board],
        boxShadow: '0 36px 70px -26px rgb(19 8 10 / .55), 0 8px 18px -8px rgb(19 8 10 / .3)',
      }}
    />
  );
  const gutter = <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-[6%] -translate-x-1/2 spread-gutter" />;

  if (!anim) {
    return (
      <div className={`relative ${className}`} style={style}>
        {frame}
        <div className="relative flex overflow-hidden rounded-[2px]">
          {side(shown.left, 'left')}
          {side(shown.right, 'right')}
          {gutter}
        </div>
      </div>
    );
  }

  const fwd = anim.dir === 1;
  // Underneath: the side that stays + the side being revealed.
  const baseLeft = fwd ? anim.from.left : anim.to.left;
  const baseRight = fwd ? anim.to.right : anim.from.right;
  // The turning leaf: front = page leaving, back = page arriving on the other side.
  const front = fwd ? anim.from.right : anim.from.left;
  const back = fwd ? anim.to.left : anim.to.right;
  const ms = `${duration}ms`;

  return (
    <div className={`relative ${className}`} style={{ ...style, perspective: `${renderWidth * 2.4}px` }}>
      {frame}
      <div className="relative flex rounded-[2px]" style={{ transformStyle: 'preserve-3d' }}>
        <div className="relative flex-1 overflow-hidden">
          {side(baseLeft, 'left')}
          {!fwd && <span aria-hidden className="flip-cast flip-cast--left" style={{ animationDuration: ms }} />}
        </div>
        <div className="relative flex-1 overflow-hidden">
          {side(baseRight, 'right')}
          {fwd && <span aria-hidden className="flip-cast flip-cast--right" style={{ animationDuration: ms }} />}
        </div>
        {gutter}
        <div
          className={`flip-leaf ${fwd ? 'flip-leaf--fwd' : 'flip-leaf--back'}`}
          style={{ animationDuration: ms }}
          onAnimationEnd={(e) => {
            if (e.target !== e.currentTarget) return;
            setShown(anim.to);
            setAnim(null);
          }}
        >
          <div className="flip-face">
            {side(front, fwd ? 'right' : 'left')}
            <span aria-hidden className={`flip-shade ${fwd ? 'flip-shade--front-fwd' : 'flip-shade--front-back'}`} style={{ animationDuration: ms }} />
          </div>
          <div className="flip-face flip-face--back">
            {side(back, fwd ? 'left' : 'right')}
            <span aria-hidden className={`flip-shade ${fwd ? 'flip-shade--back-fwd' : 'flip-shade--back-back'}`} style={{ animationDuration: ms }} />
          </div>
        </div>
      </div>
    </div>
  );
}
