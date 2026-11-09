'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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
  board?: BookBoard | (string & {});
  duration?: number;
  className?: string;
  style?: CSSProperties;
  eager?: boolean;
  /** Something lying in the gutter (a ribbon bookmark). The turning leaf passes over it, never under. */
  ornament?: ReactNode;
}

const key = (s: Spread) => `${s.left?.id ?? '_'}|${s.right?.id ?? '_'}`;

/**
 * An open book that turns its page in 3D whenever `spread` changes: the leaf
 * lifts from the spine and rotates over, showing the next page on its back,
 * with light and shadow following the turn.
 */
export function FlipBook({ spread, dir, size, photos, renderWidth, endpaper = '#7A1020', board = 'red', duration = 900, className = '', style, eager, ornament }: Props) {
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
        background: board in BOARDS ? BOARDS[board as BookBoard] : board,
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
        {ornament}
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
          {fwd && <span aria-hidden className="flip-land flip-land--left" style={{ animationDuration: ms }} />}
        </div>
        <div className="relative flex-1 overflow-hidden">
          {side(baseRight, 'right')}
          {fwd && <span aria-hidden className="flip-cast flip-cast--right" style={{ animationDuration: ms }} />}
          {/* The leaf's shadow sweeping over the page it is about to land on. */}
          {!fwd && <span aria-hidden className="flip-land flip-land--right" style={{ animationDuration: ms }} />}
        </div>
        {gutter}
        {/* Inside the 3D scene, a hair above the paper: covered by the leaf as it lifts, uncovered as it lands. */}
        {ornament && <div className="pointer-events-none absolute inset-0" style={{ transform: 'translateZ(1px)' }}>{ornament}</div>}
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

export interface DragFlipHandle {
  /** Turn progress, 0 (flat) → 1 (fully turned). */
  set(progress: number): void;
  /** Finish the turn (or fall back), then call `done`. */
  release(complete: boolean, done: () => void): void;
}

/**
 * The page turn under your finger: the same book as FlipBook, but the leaf
 * follows a drag instead of playing an animation. Progress is applied straight
 * to the DOM (no re-render per pointer move), so it tracks the finger smoothly.
 */
export function DragFlip({
  from,
  to,
  dir,
  size,
  photos,
  renderWidth,
  endpaper = '#7A1020',
  board = 'red',
  progressRef,
  handleRef,
  eager,
}: {
  from: Spread;
  to: Spread;
  dir: 1 | -1;
  size: Pick<PageSize, 'widthMm' | 'heightMm'>;
  photos: PhotoMap;
  renderWidth: number;
  endpaper?: string;
  board?: BookBoard | (string & {});
  /** Progress at the moment the drag view appears (the finger may already have moved). */
  progressRef: { current: number };
  handleRef: { current: DragFlipHandle | null };
  eager?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const leaf = useRef<HTMLDivElement>(null);
  const fwd = dir === 1;
  const half = renderWidth / 2;
  const side = (page: Page | null, s: 'left' | 'right') => <BookSide page={page} side={s} size={size} photos={photos} width={half} eager={eager} endpaper={endpaper} />;

  useLayoutEffect(() => {
    let current = 0;
    const apply = (p: number) => {
      current = Math.max(0, Math.min(1, p));
      root.current?.style.setProperty('--p', String(current));
      if (leaf.current) leaf.current.style.transform = `rotateY(${(fwd ? -180 : 180) * current}deg) translateZ(${Math.sin(current * Math.PI) * 2}px)`;
    };
    const timing = (ms: number) => {
      const t = `${ms}ms cubic-bezier(0.22, 0.75, 0.25, 1)`;
      if (leaf.current) leaf.current.style.transition = `transform ${t}`;
      root.current?.querySelectorAll<HTMLElement>('[data-shade]').forEach((el) => (el.style.transition = `opacity ${t}`));
    };
    handleRef.current = {
      set(p) {
        timing(0);
        apply(p);
      },
      release(complete, done) {
        const target = complete ? 1 : 0;
        const ms = Math.round(160 + 380 * Math.abs(target - current));
        timing(ms);
        // Next frame, so the browser starts from the current angle.
        requestAnimationFrame(() => apply(target));
        let finished = false;
        const end = () => {
          if (finished) return;
          finished = true;
          done();
        };
        leaf.current?.addEventListener('transitionend', end, { once: true });
        window.setTimeout(end, ms + 120);
      },
    };
    apply(progressRef.current);
    return () => {
      handleRef.current = null;
    };
  }, [fwd, handleRef, progressRef]);

  const baseLeft = fwd ? from.left : to.left;
  const baseRight = fwd ? to.right : from.right;
  const front = fwd ? from.right : from.left;
  const back = fwd ? to.left : to.right;
  const shade = (style: CSSProperties, bg: string) => <span aria-hidden data-shade className="pointer-events-none absolute inset-0" style={{ background: bg, ...style }} />;

  return (
    <div ref={root} className="relative select-none" style={{ perspective: `${renderWidth * 2.4}px`, ['--p' as string]: 0 }}>
      <div
        aria-hidden
        className="absolute rounded-[3px]"
        style={{
          inset: '0.8% -0.9% -1.6% -0.9%',
          background: board in BOARDS ? BOARDS[board as BookBoard] : board,
          boxShadow: '0 36px 70px -26px rgb(19 8 10 / .55), 0 8px 18px -8px rgb(19 8 10 / .3)',
        }}
      />
      <div className="relative flex rounded-[2px]" style={{ transformStyle: 'preserve-3d' }}>
        <div className="relative flex-1 overflow-hidden">
          {side(baseLeft, 'left')}
          {/* fwd: the leaf's shadow sweeping over the page it lands on; back: the shadow left as it lifts */}
          {fwd
            ? shade({ opacity: 'calc(max(0, var(--p) - 0.45) * 1.8)' }, 'linear-gradient(270deg, rgb(0 0 0 / 0.3), rgb(0 0 0 / 0.06) 55%, transparent)')
            : shade({ opacity: 'calc((1 - var(--p)) * 0.9)' }, 'linear-gradient(270deg, rgb(0 0 0 / 0.28), transparent 70%)')}
        </div>
        <div className="relative flex-1 overflow-hidden">
          {side(baseRight, 'right')}
          {fwd
            ? shade({ opacity: 'calc((1 - var(--p)) * 0.9)' }, 'linear-gradient(90deg, rgb(0 0 0 / 0.28), transparent 70%)')
            : shade({ opacity: 'calc(max(0, var(--p) - 0.45) * 1.8)' }, 'linear-gradient(90deg, rgb(0 0 0 / 0.3), rgb(0 0 0 / 0.06) 55%, transparent)')}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-[6%] -translate-x-1/2 spread-gutter" />
        <div ref={leaf} className="absolute top-0 z-30 h-full w-1/2 will-change-transform" style={{ left: fwd ? '50%' : 0, transformOrigin: fwd ? '0% 50%' : '100% 50%', transformStyle: 'preserve-3d' }}>
          <div className="flip-face">
            {side(front, fwd ? 'right' : 'left')}
            {shade({ opacity: 'calc(var(--p) * 1.8)' }, `linear-gradient(${fwd ? 90 : 270}deg, rgb(0 0 0 / 0.35), rgb(0 0 0 / 0.05) 40%, rgb(255 255 255 / 0.12))`)}
          </div>
          <div className="flip-face flip-face--back">
            {side(back, fwd ? 'left' : 'right')}
            {shade({ opacity: 'calc(1 - var(--p))' }, `linear-gradient(${fwd ? 270 : 90}deg, rgb(0 0 0 / 0.3), rgb(0 0 0 / 0.04) 45%, rgb(255 255 255 / 0.1))`)}
          </div>
        </div>
      </div>
    </div>
  );
}
