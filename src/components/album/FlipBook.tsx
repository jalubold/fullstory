'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MutableRefObject, type ReactNode } from 'react';
import type { Page, PageSize, PhotoMap } from '@/lib/album/types';
import { BookSide, type BookBoard, BOARDS } from './Book';
import { PageView } from './PageView';

export interface Spread {
  left: Page | null;
  right: Page | null;
}

/* ------------------------------- the paper leaf -------------------------------
 *
 * A real page isn't a rigid board: when you lift it the free edge runs ahead,
 * the sheet bellies as it swings through the air, and the edge lags and curls
 * down as the page lands. The leaf is a chain of narrow strips, each hinged on
 * the last, so the sheet bends; one progress value (0 flat → 1 turned) drives
 * every strip, the face shading and the shadow it throws on the page below.
 */

const STRIPS = 10;
/** How far the free edge runs ahead of the spine early on (and lags late), in degrees. */
const LEAD = 26;
/** How much the sheet bellies mid-turn, in degrees. */
const BOW = 9;
/** Strips overlap by this much so no anti-aliased seam shows between them (px). */
const OVERLAP = 1;

/** Cumulative bend of the sheet at distance u from the spine (0) to the free edge (1). */
const bend = (u: number, p: number) => LEAD * Math.sin(2 * Math.PI * p) * u * u + BOW * Math.sin(Math.PI * p) * Math.sin(Math.PI * u);

/** Angle (degrees) of the sheet at distance u for progress p: the spine turns linearly, the paper bends around it. */
const angleAt = (u: number, p: number) => 180 * p + bend(u, p);

/** Slow lift by hand, then the page falls through the vertical and settles. */
function gravity(t: number) {
  const x = Math.max(0, Math.min(1, t));
  if (x < 0.42) return 0.5 * Math.pow(x / 0.42, 1.6);
  const s = (x - 0.42) / 0.58;
  return 0.5 + 0.5 * (1 - Math.pow(1 - s, 2.2));
}

interface LeafDom {
  strips: Array<HTMLDivElement | null>;
  fronts: Array<HTMLSpanElement | null>;
  backs: Array<HTMLSpanElement | null>;
  shadow: HTMLDivElement | null;
  landing: HTMLSpanElement | null;
  lifting: HTMLSpanElement | null;
}

const emptyDom = (): LeafDom => ({ strips: Array(STRIPS).fill(null), fronts: Array(STRIPS).fill(null), backs: Array(STRIPS).fill(null), shadow: null, landing: null, lifting: null });

/** Writes one turn state straight to the DOM — no re-render per frame. */
function paint(dom: LeafDom, p: number, dir: 1 | -1, half: number) {
  const sign = dir === 1 ? -1 : 1;
  // Paper facing away from the viewer reads darker; edge-on is darkest. The
  // shade runs continuously along the sheet, so strips never show as bands.
  const darkness = (deg: number) => (0.42 * Math.abs(Math.sin((deg * Math.PI) / 180))).toFixed(3);
  const frontDeg = dir === 1 ? 90 : 270;
  const backDeg = dir === 1 ? 270 : 90;
  let prev = 0;
  for (let k = 0; k < STRIPS; k++) {
    const phi = angleAt((k + 1) / STRIPS, p);
    const strip = dom.strips[k];
    if (strip) strip.style.transform = `rotateY(${sign * (phi - prev)}deg)`;
    const a0 = darkness(prev);
    const a1 = darkness(phi);
    prev = phi;
    const f = dom.fronts[k];
    const b = dom.backs[k];
    if (f) f.style.background = `linear-gradient(${frontDeg}deg, rgb(0 0 0 / ${a0}), rgb(0 0 0 / ${a1}))`;
    if (b) b.style.background = `linear-gradient(${backDeg}deg, rgb(0 0 0 / ${a0}), rgb(0 0 0 / ${a1}))`;
  }
  // The leaf's shadow on the table: from the spine to where its free edge hangs.
  const edge = (angleAt(1, p) * Math.PI) / 180;
  const reach = Math.abs(Math.cos(edge)) * half;
  const onSource = Math.cos(edge) > 0;
  const lift = Math.sin(edge);
  if (dom.shadow) {
    const s = dom.shadow.style;
    const towardsRight = dir === 1 ? onSource : !onSource;
    s.left = towardsRight ? `${half}px` : `${half - reach}px`;
    s.width = `${reach}px`;
    s.opacity = String(0.28 * Math.max(0, lift));
    s.background = `linear-gradient(${towardsRight ? 90 : 270}deg, rgb(0 0 0 / 0.55), rgb(0 0 0 / 0.1) 70%, transparent)`;
  }
  // The page it leaves brightens; the page it lands on darkens under the falling leaf.
  if (dom.lifting) dom.lifting.style.opacity = String(Math.max(0, 1 - p * 1.6) * 0.5);
  if (dom.landing) dom.landing.style.opacity = String(Math.max(0, p - 0.5) * 2 * 0.55 * Math.max(0.2, 1 - lift));
}

interface BookProps {
  size: Pick<PageSize, 'widthMm' | 'heightMm'>;
  photos: PhotoMap;
  renderWidth: number;
  endpaper: string;
  board: BookBoard | (string & {});
  eager?: boolean;
  ornament?: ReactNode;
}

function Frame({ board }: { board: BookProps['board'] }) {
  return (
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
}

const gutter = <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-[6%] -translate-x-1/2 spread-gutter" />;

/**
 * The book mid-turn: both base pages, the bending leaf (front = page leaving,
 * back = page arriving) and its shadows. `domRef` receives the elements the
 * driver paints each frame.
 */
function TurningBook({ from, to, dir, size, photos, renderWidth, endpaper, board, eager, ornament, domRef }: BookProps & { from: Spread; to: Spread; dir: 1 | -1; domRef: MutableRefObject<LeafDom> }) {
  const fwd = dir === 1;
  const half = renderWidth / 2;
  const w = half / STRIPS;
  const baseLeft = fwd ? from.left : to.left;
  const baseRight = fwd ? to.right : from.right;
  const front = fwd ? from.right : from.left;
  const back = fwd ? to.left : to.right;
  const aspect = `${size.widthMm} / ${size.heightMm}`;

  const sheet = (page: Page | null, shift: number) =>
    page ? (
      <div style={{ width: half, transform: `translateX(${shift}px)` }}>
        <PageView page={page} size={size} photos={photos} renderWidth={half} eager={eager} />
      </div>
    ) : (
      <div style={{ width: half, aspectRatio: aspect, background: endpaper, transform: `translateX(${shift}px)` }} />
    );

  // Strips are nested so each hinges on the one before it; the chain starts at the spine.
  let chain: ReactNode = null;
  for (let k = STRIPS - 1; k >= 0; k--) {
    // Each face box runs OVERLAP past the strip towards the free edge; the slices account for it.
    const frontShift = fwd ? -k * w : (k + 1) * w - half + OVERLAP;
    const backShift = fwd ? (k + 1) * w - half + OVERLAP : -k * w;
    chain = (
      <div
        key={k}
        ref={(el) => void (domRef.current.strips[k] = el)}
        className="absolute inset-y-0"
        style={{
          width: w,
          left: k === 0 ? (fwd ? 0 : half - w) : fwd ? w : -w,
          transformOrigin: fwd ? '0% 50%' : '100% 50%',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        <span className="absolute inset-y-0 overflow-hidden" style={{ left: fwd ? 0 : -OVERLAP, width: w + OVERLAP, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          {sheet(front, frontShift)}
          <span ref={(el) => void (domRef.current.fronts[k] = el)} aria-hidden className="pointer-events-none absolute inset-0" />
        </span>
        <span className="absolute inset-y-0 overflow-hidden" style={{ left: fwd ? 0 : -OVERLAP, width: w + OVERLAP, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          {sheet(back, backShift)}
          <span ref={(el) => void (domRef.current.backs[k] = el)} aria-hidden className="pointer-events-none absolute inset-0" />
        </span>
        {chain}
      </div>
    );
  }

  return (
    <div className="relative" style={{ perspective: `${renderWidth * 2.2}px`, perspectiveOrigin: '50% 40%' }}>
      <Frame board={board} />
      <div className="relative flex rounded-[2px]" style={{ transformStyle: 'preserve-3d' }}>
        <div className="relative flex-1 overflow-hidden">
          <BookSide page={baseLeft} side="left" size={size} photos={photos} width={half} eager={eager} endpaper={endpaper} />
          <span ref={(el) => void (domRef.current[fwd ? 'landing' : 'lifting'] = el)} aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity: 0, background: 'linear-gradient(270deg, rgb(0 0 0 / 0.32), rgb(0 0 0 / 0.06) 55%, transparent)' }} />
        </div>
        <div className="relative flex-1 overflow-hidden">
          <BookSide page={baseRight} side="right" size={size} photos={photos} width={half} eager={eager} endpaper={endpaper} />
          <span ref={(el) => void (domRef.current[fwd ? 'lifting' : 'landing'] = el)} aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity: 0, background: 'linear-gradient(90deg, rgb(0 0 0 / 0.32), rgb(0 0 0 / 0.06) 55%, transparent)' }} />
        </div>
        {/* the leaf's shadow on the table */}
        <div ref={(el) => void (domRef.current.shadow = el)} aria-hidden className="pointer-events-none absolute inset-y-0 z-[15]" style={{ opacity: 0, filter: 'blur(5px)' }} />
        {gutter}
        {ornament && (
          <div className="pointer-events-none absolute inset-0" style={{ transform: 'translateZ(1px)' }}>
            {ornament}
          </div>
        )}
        {/* the leaf, a hair above the paper */}
        <div className="pointer-events-none absolute inset-y-0 z-30" style={{ left: fwd ? '50%' : 0, width: half, transform: 'translateZ(2px)', transformStyle: 'preserve-3d' }}>
          {chain}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- FlipBook --------------------------------- */

interface Props extends Omit<BookProps, 'endpaper' | 'board'> {
  spread: Spread;
  /** +1 when moving forward through the book, -1 backwards. */
  dir: 1 | -1;
  endpaper?: string;
  board?: BookBoard | (string & {});
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

const key = (s: Spread) => `${s.left?.id ?? '_'}|${s.right?.id ?? '_'}`;

/**
 * An open book that turns a page whenever `spread` changes: the leaf lifts
 * from the spine, bends through the air and settles on the other side, with
 * light and shadow following the paper.
 */
export function FlipBook({ spread, dir, size, photos, renderWidth, endpaper = '#7A1020', board = 'red', duration = 1000, className = '', style, eager, ornament }: Props) {
  const [shown, setShown] = useState(spread);
  const [anim, setAnim] = useState<{ from: Spread; to: Spread; dir: 1 | -1 } | null>(null);
  const [reduced, setReduced] = useState(false);
  const dom = useRef<LeafDom>(emptyDom());

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

  // Drive the turn frame by frame.
  useLayoutEffect(() => {
    if (!anim) return;
    const half = renderWidth / 2;
    const d = anim.dir;
    const t0 = performance.now();
    let raf = 0;
    paint(dom.current, 0, d, half);
    const tick = (now: number) => {
      const t = (now - t0) / duration;
      if (t >= 1) {
        paint(dom.current, 1, d, half);
        setShown(anim.to);
        setAnim(null);
        return;
      }
      paint(dom.current, gravity(t), d, half);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim, duration]);

  if (!anim) {
    const half = renderWidth / 2;
    return (
      <div className={`relative ${className}`} style={style}>
        <Frame board={board} />
        <div className="relative flex overflow-hidden rounded-[2px]">
          <BookSide page={shown.left} side="left" size={size} photos={photos} width={half} eager={eager} endpaper={endpaper} />
          <BookSide page={shown.right} side="right" size={size} photos={photos} width={half} eager={eager} endpaper={endpaper} />
          {gutter}
        </div>
        {ornament}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={style}>
      <TurningBook from={anim.from} to={anim.to} dir={anim.dir} size={size} photos={photos} renderWidth={renderWidth} endpaper={endpaper} board={board} eager={eager} ornament={ornament} domRef={dom} />
    </div>
  );
}

/* --------------------------------- DragFlip --------------------------------- */

export interface DragFlipHandle {
  /** Turn progress, 0 (flat) → 1 (fully turned). */
  set(progress: number): void;
  /** Let go: the page falls the rest of the way (or back), then `done`. */
  release(complete: boolean, done: () => void): void;
}

/**
 * The page turn under your finger: the same bending leaf, but following a drag
 * instead of the clock. Progress is painted straight to the DOM, so the paper
 * tracks the finger without re-rendering.
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
}: Omit<BookProps, 'endpaper' | 'board' | 'ornament'> & {
  from: Spread;
  to: Spread;
  dir: 1 | -1;
  endpaper?: string;
  board?: BookBoard | (string & {});
  /** Progress at the moment the drag view appears (the finger may already have moved). */
  progressRef: { current: number };
  handleRef: { current: DragFlipHandle | null };
}) {
  const dom = useRef<LeafDom>(emptyDom());

  useLayoutEffect(() => {
    const half = renderWidth / 2;
    let current = 0;
    let raf = 0;
    const apply = (p: number) => {
      current = Math.max(0, Math.min(1, p));
      paint(dom.current, current, dir, half);
    };
    handleRef.current = {
      set(p) {
        cancelAnimationFrame(raf);
        apply(p);
      },
      release(complete, done) {
        cancelAnimationFrame(raf);
        const start = current;
        const target = complete ? 1 : 0;
        // Gravity takes it the rest of the way: a short fall for a short distance.
        const ms = 180 + 520 * Math.abs(target - start);
        const t0 = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - t0) / ms);
          // paper let go: a touch of acceleration, then it eases down
          const e = 1 - Math.pow(1 - t, 2.4);
          apply(start + (target - start) * e);
          if (t < 1) raf = requestAnimationFrame(tick);
          else done();
        };
        raf = requestAnimationFrame(tick);
      },
    };
    apply(progressRef.current);
    return () => {
      cancelAnimationFrame(raf);
      handleRef.current = null;
    };
  }, [dir, renderWidth, handleRef, progressRef]);

  return <TurningBook from={from} to={to} dir={dir} size={size} photos={photos} renderWidth={renderWidth} endpaper={endpaper} board={board} eager={eager} domRef={dom} />;
}
