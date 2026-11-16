import { useId, type CSSProperties } from 'react';
import { initial } from './Visuals';

/**
 * The brand motif: two circles that overlap — two people, and the space they
 * share. Person A is wine, person B is slate (the validated pair used across
 * the product); the overlap is where they meet.
 */

/** A stable, url()-safe id for SVG clip paths. */
const useSvgId = () => `awc${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

/** Small logo mark for the header and footer. */
export function VennMark({ size = 22, className = '' }: { size?: number; className?: string }) {
  const id = useSvgId();
  return (
    <svg width={size * 1.5} height={size} viewBox="0 0 36 24" className={className} aria-hidden>
      <defs>
        <clipPath id={id}>
          <circle cx="13" cy="12" r="10" />
        </clipPath>
      </defs>
      <circle cx="23" cy="12" r="10" fill="var(--color-awc-blush)" clipPath={`url(#${id})`} />
      <circle cx="13" cy="12" r="10" fill="none" stroke="var(--color-awc-wine)" strokeWidth="1.8" />
      <circle cx="23" cy="12" r="10" fill="none" stroke="var(--color-awc-slate)" strokeWidth="1.8" />
    </svg>
  );
}

/**
 * Two people as overlapping circles. `overlap` (0–100) sets how far the
 * circles overlap — on the results page it's the similarity indicator, and
 * the figure is labelled with the number, so the shape never stands alone.
 */
export function Venn({
  names,
  overlap,
  label,
  size = 280,
  tone = 'light',
  pending = null,
  className = '',
}: {
  names: { a: string | null; b: string | null };
  overlap: number;
  label?: string;
  size?: number;
  tone?: 'light' | 'dark';
  /** A person who hasn't finished yet: their circle is dashed and breathing, and nothing overlaps. */
  pending?: 'a' | 'b' | null;
  className?: string;
}) {
  const id = useSvgId();
  const w = 320;
  const h = 200;
  const r = 78;
  const o = Math.max(0, Math.min(100, overlap)) / 100;
  const d = r * (1.85 - 1.05 * o); // distance between centres
  const cy = h / 2;
  const dark = tone === 'dark';
  const ink = dark ? '#fff' : 'var(--color-awc-ink)';
  const side = (role: 'a' | 'b') => {
    const cx = role === 'a' ? w / 2 - d / 2 : w / 2 + d / 2;
    const waiting = pending === role;
    const fill = waiting ? 'none' : role === 'a' ? (dark ? 'rgb(232 198 204 / 0.14)' : 'rgb(169 77 101 / 0.1)') : dark ? 'rgb(228 237 245 / 0.12)' : 'rgb(47 111 159 / 0.08)';
    const stroke = role === 'a' ? 'var(--color-awc-wine)' : dark && !waiting ? '#9fc3e2' : 'var(--color-awc-slate)';
    const name = names[role];
    return (
      <g key={role} className={`awc-venn-${role} ${waiting ? 'awc-breathe' : ''}`} style={{ '--awc-venn-shift': `${role === 'a' ? -d / 2 - 20 : d / 2 + 20}px` } as CSSProperties}>
        <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth="2" strokeDasharray={waiting ? '6 7' : undefined} />
        <text x={cx + (role === 'a' ? -1 : 1) * r * 0.42} y={cy + 6} textAnchor="middle" fontFamily="var(--font-awc-serif)" fontSize="22" fill={ink} opacity={waiting ? 0.5 : 1}>
          {name ? initial(name) : '?'}
        </text>
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={size} height={(size * h) / w} className={`overflow-visible ${className}`} role="img" aria-label={label}>
      <defs>
        <clipPath id={`${id}-a`}>
          <circle cx={w / 2 - d / 2} cy={cy} r={r} />
        </clipPath>
      </defs>
      {side('a')}
      {side('b')}
      {!pending && <circle cx={w / 2 + d / 2} cy={cy} r={r} fill={dark ? 'rgb(232 198 204 / 0.32)' : 'rgb(169 77 101 / 0.18)'} clipPath={`url(#${id}-a)`} className="awc-venn-mid" />}
    </svg>
  );
}
