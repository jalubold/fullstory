import type { CSSProperties, ReactNode } from 'react';
import type { DimensionId } from '@/lib/compat/types';

/**
 * Hand-drawn illustrations for the landing page, in two "pens": wine for
 * person A, slate for person B. Plain SVG with no hooks, so they render on
 * the server and inside client components alike. Strokes marked .awc-draw
 * draw themselves in (see compat.css) and sit still under reduced motion.
 */

const INK = 'var(--color-awc-ink)';
const A = 'var(--color-awc-wine)';
const B = 'var(--color-awc-slate)';
const cap = { strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const line = { fill: 'none', ...cap } as const;
const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

/** Words underlined (pen A), circled (pen B) or struck through (pen A) by hand. */
export function Marked({ kind, children, delay = 0 }: { kind: 'underline' | 'circle' | 'strike'; children: ReactNode; delay?: number }) {
  if (kind === 'strike') {
    return (
      <span className="relative inline-block whitespace-nowrap">
        {children}
        <svg aria-hidden viewBox="0 0 200 20" preserveAspectRatio="none" className="pointer-events-none absolute left-[-3%] top-[48%] h-[0.32em] w-[106%] -translate-y-1/2 text-awc-wine">
          <path pathLength={1} className="awc-draw" style={d(delay)} d="M3 13 C 46 8, 104 12, 150 8 S 186 7, 197 9" stroke="currentColor" strokeWidth="3.2" {...line} />
          <path pathLength={1} className="awc-draw" style={d(delay + 320)} d="M10 7 C 70 11, 132 6, 192 12" stroke="currentColor" strokeWidth="2.2" opacity="0.75" {...line} />
        </svg>
      </span>
    );
  }
  return (
    <span className={`relative inline-block whitespace-nowrap ${kind === 'circle' ? 'mx-[0.1em]' : ''}`}>
      {children}
      {kind === 'underline' ? (
        <svg aria-hidden viewBox="0 0 200 18" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-[0.14em] left-[-3%] h-[0.3em] w-[106%] text-awc-wine">
          <path pathLength={1} className="awc-draw" style={d(delay)} d="M3 11 C 40 5, 80 4.5, 118 6.5 S 178 9.5, 197 5" stroke="currentColor" strokeWidth="3.4" {...line} />
          <path pathLength={1} className="awc-draw" style={d(delay + 260)} d="M18 14.5 C 70 11, 128 11.5, 184 10" stroke="currentColor" strokeWidth="2" opacity="0.7" {...line} />
        </svg>
      ) : (
        <svg aria-hidden viewBox="0 0 200 64" preserveAspectRatio="none" className="pointer-events-none absolute -inset-x-[0.2em] -inset-y-[0.1em] h-[calc(100%+0.2em)] w-[calc(100%+0.4em)] text-awc-slate">
          <path pathLength={1} className="awc-draw" style={d(delay)} d="M18 40 C 4 26, 30 5, 104 5 C 166 5, 198 16, 197 33 C 196 50, 152 60, 96 59 C 40 58, 2 49, 3 31 C 4 17, 30 10, 60 8" stroke="currentColor" strokeWidth="2.6" {...line} />
        </svg>
      )}
    </span>
  );
}

/** A hand-drawn tick in a person's pen. */
export function Tick({ role, delay = 0, className = '' }: { role: 'a' | 'b'; delay?: number; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className}>
      <path pathLength={1} className="awc-draw" style={d(delay)} d="M3.5 13 C 5.5 14, 7.6 16.4, 9.2 19.6 C 12.2 12.6, 16 7.6, 21.5 3.2" stroke={role === 'a' ? A : B} strokeWidth="2.8" {...line} />
    </svg>
  );
}

/** A hand-drawn checkbox outline. */
export function Box({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className}>
      <path d="M4.2 4.8 C 9 4.2, 15 4.4, 19.6 4.4 C 19.9 9.4, 19.7 14.6, 19.8 19.4 C 14.8 19.8, 9.2 19.6, 4.6 19.7 C 4.2 14.6, 4.4 9.6, 4.2 4.8 Z" stroke="var(--color-awc-line-strong)" strokeWidth="1.4" {...line} />
    </svg>
  );
}

/** A loose arrow, as drawn in a margin. */
export function HandArrow({ className = '', flip = false, delay = 0 }: { className?: string; flip?: boolean; delay?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 90 60" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <path pathLength={1} className="awc-draw" style={d(delay)} d="M6 10 C 28 2, 62 10, 76 44" stroke="currentColor" strokeWidth="2.6" {...line} />
      <path pathLength={1} className="awc-draw" style={d(delay + 380)} d="M64 38 C 69 41, 73 44, 77 47 C 78.5 41, 80 36, 82 31" stroke="currentColor" strokeWidth="2.6" {...line} />
    </svg>
  );
}

/** One small scene per dimension, drawn in ink with the two pens as accents. */
export function DimDoodle({ id, className = '' }: { id: DimensionId; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 90" className={className}>
      {id === 'communication' && (
        <>
          <path d="M14 22 C 14 13, 20 10, 30 10 L 58 10 C 68 10, 72 15, 72 23 L 72 36 C 72 44, 67 48, 58 48 L 34 48 L 22 58 L 25 47 C 17 45, 14 41, 14 35 Z" fill="var(--color-awc-blush-soft)" stroke={A} strokeWidth="1.8" {...cap} />
          <path d="M50 44 C 50 36, 55 32, 64 32 L 92 32 C 102 32, 106 37, 106 45 L 106 58 C 106 66, 101 70, 92 70 L 90 70 L 96 80 L 80 70 L 64 70 C 55 70, 50 66, 50 58 Z" fill="var(--color-awc-slate-soft)" stroke={B} strokeWidth="1.8" {...cap} />
          <path d="M66 51 h0.1 M78 51 h0.1 M90 51 h0.1" stroke={INK} strokeWidth="4" {...line} />
          <path d="M26 24 C 36 22, 48 22, 58 24 M26 32 C 34 31, 42 31, 46 32" stroke={INK} strokeWidth="1.5" opacity="0.55" {...line} />
        </>
      )}
      {id === 'emotional' && (
        <>
          <path d="M44 76 C 22 60, 10 48, 10 34 C 10 24, 17 17, 26 17 C 34 17, 40 22, 44 30 C 48 22, 54 17, 62 17 C 71 17, 78 24, 78 34 C 78 48, 66 60, 44 76 Z" fill="var(--color-awc-blush-soft)" stroke={A} strokeWidth="1.8" {...cap} />
          <path d="M76 70 C 58 57, 48 47, 48 36 C 48 28, 54 22, 61 22 C 68 22, 73 26, 76 33 C 79 26, 84 22, 91 22 C 98 22, 104 28, 104 36 C 104 47, 94 57, 76 70 Z" stroke={B} strokeWidth="1.8" {...line} />
          <path d="M98 10 l3 6 l6 1 l-5 4 l1 6 l-5 -3 l-5 3 l1 -6 l-5 -4 l6 -1 Z" stroke={INK} strokeWidth="1.3" opacity="0.6" {...line} />
        </>
      )}
      {id === 'lifestyle' && (
        <>
          <path d="M16 38 L 20 76 C 20 80, 24 82, 28 82 L 44 82 C 48 82, 52 80, 52 76 L 56 38 Z" fill="var(--color-awc-blush-soft)" stroke={A} strokeWidth="1.8" {...cap} />
          <path d="M56 46 C 64 46, 66 52, 64 58 C 62 63, 58 64, 54 64" stroke={A} strokeWidth="1.8" {...line} />
          <path d="M66 42 L 70 78 C 70 81, 73 82, 76 82 L 92 82 C 96 82, 99 81, 99 78 L 103 42 Z" fill="var(--color-awc-slate-soft)" stroke={B} strokeWidth="1.8" {...cap} />
          <path d="M103 50 C 111 50, 112 56, 110 61 C 108 65, 105 66, 101 66" stroke={B} strokeWidth="1.8" {...line} />
          <path d="M28 30 C 24 24, 32 20, 28 12 M40 30 C 36 24, 44 20, 40 12 M80 34 C 76 28, 84 24, 80 16 M90 34 C 86 28, 94 24, 90 16" stroke={INK} strokeWidth="1.4" opacity="0.5" {...line} />
        </>
      )}
      {id === 'future' && (
        <>
          <circle cx="92" cy="22" r="10" fill="var(--color-awc-amber-soft)" stroke={INK} strokeWidth="1.4" opacity="0.8" />
          <path d="M6 70 C 30 66, 40 58, 54 50 C 66 43, 78 40, 112 40" stroke={INK} strokeWidth="1.4" opacity="0.35" {...line} />
          <path d="M10 84 C 30 76, 40 70, 52 62 C 62 55, 70 50, 82 46" stroke={A} strokeWidth="1.8" strokeDasharray="1 5" {...line} />
          <path d="M28 88 C 40 80, 50 72, 58 64 C 66 56, 74 50, 82 46" stroke={B} strokeWidth="1.8" strokeDasharray="1 5" {...line} />
          <circle cx="82" cy="46" r="4.5" fill={A} />
          <circle cx="89" cy="47" r="4.5" fill={B} />
        </>
      )}
      {id === 'conflict' && (
        <>
          <g transform="rotate(-24 60 46)">
            <rect x="18" y="34" width="84" height="26" rx="13" fill="var(--color-awc-amber-soft)" stroke={INK} strokeWidth="1.5" opacity="0.95" />
            <rect x="46" y="34" width="28" height="26" fill="#fff" stroke={INK} strokeWidth="1.2" opacity="0.9" />
            <path d="M52 41 h0.1 M60 41 h0.1 M68 41 h0.1 M52 53 h0.1 M60 53 h0.1 M68 53 h0.1 M56 47 h0.1 M64 47 h0.1" stroke={INK} strokeWidth="2.4" opacity="0.5" {...line} />
          </g>
          <path d="M12 20 C 18 16, 22 22, 28 18" stroke={A} strokeWidth="1.8" {...line} />
          <path d="M92 76 C 98 72, 102 78, 108 74" stroke={B} strokeWidth="1.8" {...line} />
        </>
      )}
    </svg>
  );
}

/** Two people as two circles; the closer they sit, the more they share. */
export function StageCircles({ gap, dashed = false, className = '' }: { gap: number; dashed?: boolean; className?: string }) {
  const r = 22;
  const cx = 60;
  const dash = dashed ? '3 5' : undefined;
  return (
    <svg aria-hidden viewBox="0 0 120 64" className={className}>
      <circle cx={cx - gap / 2 + 2} cy="34" r={r} fill="var(--color-awc-blush)" opacity="0.55" />
      <circle cx={cx + gap / 2 + 2} cy="34" r={r} fill="var(--color-awc-slate-soft)" opacity="0.9" style={{ mixBlendMode: 'multiply' }} />
      <circle cx={cx - gap / 2} cy="32" r={r} fill="none" stroke={A} strokeWidth="1.8" strokeDasharray={dash} />
      <circle cx={cx + gap / 2} cy="32" r={r} fill="none" stroke={B} strokeWidth="1.8" strokeDasharray={dash} />
    </svg>
  );
}

/** Two sealed envelopes: one seal each, opened only together. */
export function Envelopes({ initials, className = '' }: { initials: { a: string; b: string }; className?: string }) {
  const env = (x: number, y: number, rot: number, color: string, fill: string, letter: string) => (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x="0" y="0" width="150" height="98" rx="6" fill="#fff" stroke={INK} strokeWidth="1.5" />
      <path d="M2 4 L 75 56 L 148 4" stroke={INK} strokeWidth="1.5" {...line} />
      <path d="M2 94 L 58 46 M148 94 L 92 46" stroke={INK} strokeWidth="1.2" opacity="0.35" {...line} />
      <path d="M75 70 C 62 70, 57 60, 59 52 C 61 44, 68 40, 75 40 C 84 40, 92 46, 91 56 C 90 65, 84 70, 75 70 Z" fill={fill} stroke={color} strokeWidth="1.6" />
      <circle cx="75" cy="55" r="9.5" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.7" />
      <text x="75" y="59.5" textAnchor="middle" fontFamily="var(--font-awc-serif)" fontSize="13" fontStyle="italic" fill="#fff">
        {letter}
      </text>
    </g>
  );
  return (
    <svg aria-hidden viewBox="0 0 300 190" className={className}>
      <path d="M40 176 C 100 184, 210 184, 270 174" stroke={INK} strokeWidth="1.2" opacity="0.18" {...line} />
      {env(22, 44, -8, A, A, initials.a)}
      {env(128, 36, 7, B, B, initials.b)}
      <path d="M150 20 l0 10 M143 25 l14 0" stroke={A} strokeWidth="1.6" {...line} />
      <path d="M270 30 l0 8 M266 34 l8 0" stroke={B} strokeWidth="1.6" {...line} />
      <path d="M16 30 C 20 26, 24 30, 28 26" stroke={INK} strokeWidth="1.3" opacity="0.4" {...line} />
    </svg>
  );
}

/** A rubber stamp with its text set around the rim. */
export function Stamp({ text, className = '' }: { text: string; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 120" className={className}>
      <defs>
        <path id="awc-stamp-rim" d="M60 60 m -43 0 a 43 43 0 1 1 86 0 a 43 43 0 1 1 -86 0" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="60" r="33" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text fontSize="9" fontWeight="700" fill="currentColor" fontFamily="var(--font-awc-sans)">
        <textPath href="#awc-stamp-rim" textLength="262" lengthAdjust="spacing">{`${text.toUpperCase()} ·`}</textPath>
      </text>
      <circle cx="53" cy="60" r="12" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="67" cy="60" r="12" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/** A torn strip of tape. */
export function Tape({ className = '' }: { className?: string }) {
  return <span aria-hidden className={`awc-tape ${className}`} />;
}

/** Zigzag paper edge for the receipt (top or bottom). */
export function ZigzagEdge({ side }: { side: 'top' | 'bottom' }) {
  const id = `awc-zz-${side}`;
  return (
    <svg aria-hidden className={`absolute inset-x-0 h-2.5 w-full ${side === 'top' ? '-top-2.5' : '-bottom-2.5 rotate-180'}`}>
      <defs>
        <pattern id={id} width="14" height="10" patternUnits="userSpaceOnUse">
          <path d="M0 10 L7 0.5 L14 10 Z" fill="#fff" />
        </pattern>
      </defs>
      <rect width="100%" height="10" fill={`url(#${id})`} />
    </svg>
  );
}

/** A decorative barcode built from a word, in both pens. */
export function Barcode({ seed, className = '' }: { seed: string; className?: string }) {
  const bars: Array<{ x: number; w: number; c: string }> = [];
  let x = 0;
  for (let i = 0; i < 38; i++) {
    const code = seed.charCodeAt(i % seed.length) + i * 7;
    const w = 1 + (code % 3);
    bars.push({ x, w, c: i % 9 === 4 ? A : i % 11 === 7 ? B : INK });
    x += w + 1 + ((code >> 2) % 2);
  }
  return (
    <svg aria-hidden viewBox={`0 0 ${x} 30`} preserveAspectRatio="none" className={className}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y="0" width={b.w} height="30" fill={b.c} />
      ))}
    </svg>
  );
}

/** A zodiac wheel, struck out by hand. */
export function ZodiacNo({ className = '' }: { className?: string }) {
  const spokes = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);
  return (
    <svg aria-hidden viewBox="0 0 180 180" className={className}>
      <circle cx="90" cy="90" r="70" fill="#fff" stroke={INK} strokeWidth="1.5" />
      <circle cx="90" cy="90" r="46" fill="none" stroke={INK} strokeWidth="1.2" opacity="0.55" />
      {spokes.map((a, i) => (
        <path key={i} d={`M${90 + 46 * Math.cos(a)} ${90 + 46 * Math.sin(a)} L${90 + 70 * Math.cos(a)} ${90 + 70 * Math.sin(a)}`} stroke={INK} strokeWidth="1.1" opacity="0.55" />
      ))}
      {spokes.map((a, i) => {
        const m = a + Math.PI / 12;
        const x = 90 + 58 * Math.cos(m);
        const y = 90 + 58 * Math.sin(m);
        return i % 2 ? <circle key={i} cx={x} cy={y} r="1.8" fill={INK} opacity="0.6" /> : <path key={i} d={`M${x} ${y - 4} L${x + 1.2} ${y - 1.2} L${x + 4} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 4} L${x - 1.2} ${y + 1.2} L${x - 4} ${y} L${x - 1.2} ${y - 1.2} Z`} fill={INK} opacity="0.6" />;
      })}
      <path d="M98 76 C 88 70, 74 76, 74 90 C 74 104, 88 110, 98 104 C 88 102, 82 96, 82 90 C 82 84, 88 78, 98 76 Z" fill="var(--color-awc-amber-soft)" stroke={INK} strokeWidth="1.3" />
      <path pathLength={1} className="awc-draw" style={d(200)} d="M22 34 C 60 70, 110 118, 160 152" stroke={A} strokeWidth="4" {...line} />
      <path pathLength={1} className="awc-draw" style={d(650)} d="M158 30 C 120 72, 70 116, 24 150" stroke={A} strokeWidth="4" {...line} />
    </svg>
  );
}
