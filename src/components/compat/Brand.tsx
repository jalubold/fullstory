import { useId, type CSSProperties, type ReactNode } from 'react';
import type { SignatureId } from '@/lib/compat/types';
import { initial } from './initial';

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
  /** Who hasn't answered yet: their circle is dashed and breathing, and nothing overlaps. */
  pending?: 'a' | 'b' | 'both' | null;
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
    const waiting = pending === role || pending === 'both';
    const fill = waiting ? 'none' : role === 'a' ? (dark ? 'rgb(232 198 204 / 0.14)' : 'rgb(169 77 101 / 0.1)') : dark ? 'rgb(228 237 245 / 0.12)' : 'rgb(47 111 159 / 0.08)';
    // On the wine background the brand colours are too dark to read, so both people get a lighter tint.
    const stroke = role === 'a' ? (dark ? '#e8a9b9' : 'var(--color-awc-wine)') : dark ? '#9fc3e2' : 'var(--color-awc-slate)';
    const name = names[role];
    return (
      <g key={role} className={`awc-venn-${role} ${waiting ? 'awc-breathe' : ''}`} style={{ '--awc-venn-shift': `${role === 'a' ? -d / 2 - 20 : d / 2 + 20}px` } as CSSProperties}>
        <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth="2" strokeDasharray={waiting ? '6 7' : undefined} />
        <text x={cx + (role === 'a' ? -1 : 1) * r * 0.42} y={cy + 6} textAnchor="middle" fontFamily="var(--font-awc-serif)" fontSize="22" fill={ink} opacity={waiting ? 0.65 : 1}>
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

/**
 * Line-art emblem for each relationship signature. Each is a variation on the
 * two-circle motif, so the seven read as one family.
 */
export function SignatureGlyph({ id, size = 152, className = '' }: { id: SignatureId; size?: number; className?: string }) {
  const wine = 'var(--color-awc-wine)';
  const slate = 'var(--color-awc-slate)';
  const fa = 'rgb(169 77 101 / 0.12)';
  const fb = 'rgb(47 111 159 / 0.1)';
  const a = { fill: fa, stroke: wine, strokeWidth: 1.8 };
  const b = { fill: fb, stroke: slate, strokeWidth: 1.8 };
  const line = { fill: 'none', stroke: 'var(--color-awc-ink-soft)', strokeWidth: 1.6, strokeLinecap: 'round' as const };
  let art: ReactNode;
  switch (id) {
    case 'mirror':
      art = (
        <>
          <circle cx="55" cy="42" r="26" {...a} />
          <circle cx="65" cy="42" r="26" {...b} />
          <line x1="60" y1="6" x2="60" y2="78" {...line} strokeDasharray="2 5" />
        </>
      );
      break;
    case 'puzzle':
      art = (
        <>
          <rect x="60" y="20" width="38" height="44" rx="7" {...b} />
          <path d="M28 20h30a2 2 0 0 1 2 2v13a7 7 0 1 1 0 14v13a2 2 0 0 1-2 2H28a6 6 0 0 1-6-6V26a6 6 0 0 1 6-6z" fill="#f5e6e9" stroke={wine} strokeWidth="1.8" />
        </>
      );
      break;
    case 'anchors':
      art = (
        <>
          <circle cx="48" cy="36" r="22" {...a} />
          <circle cx="72" cy="36" r="22" {...b} />
          <line x1="18" y1="60" x2="102" y2="60" {...line} strokeWidth="2.4" />
          <line x1="34" y1="68" x2="86" y2="68" {...line} opacity="0.45" />
          <line x1="48" y1="75" x2="72" y2="75" {...line} opacity="0.25" />
        </>
      );
      break;
    case 'bridge':
      art = (
        <>
          <circle cx="32" cy="54" r="17" {...a} />
          <circle cx="88" cy="54" r="17" {...b} />
          <path d="M32 37Q60 4 88 37" {...line} strokeWidth="2.2" />
          <path d="M45 26v8M60 20v9M75 26v8" {...line} opacity="0.5" />
        </>
      );
      break;
    case 'explorers':
      art = (
        <>
          <circle cx="36" cy="50" r="21" {...a} />
          <circle cx="92" cy="28" r="12" {...b} />
          <path d="M56 42Q70 20 79 26" {...line} strokeDasharray="1 5" strokeWidth="2" />
          <circle cx="64" cy="66" r="1.6" fill={wine} />
          <circle cx="104" cy="58" r="1.6" fill={slate} />
          <circle cx="16" cy="16" r="1.6" fill={slate} />
          <path d="M72 8v6M69 11h6" {...line} strokeWidth="1.3" />
        </>
      );
      break;
    case 'conversation':
      art = (
        <>
          <circle cx="49" cy="30" r="20" {...a} />
          <circle cx="71" cy="30" r="20" {...b} />
          <path d="M22 62q9-7 19 0t19 0 19 0 19 0" {...line} />
          <path d="M32 72q7-5 14 0t14 0 14 0 14 0" {...line} opacity="0.45" />
        </>
      );
      break;
    default:
      art = (
        <>
          <circle cx="46" cy="32" r="20" {...a} />
          <circle cx="74" cy="32" r="20" {...b} />
          <line x1="26" y1="58" x2="94" y2="58" {...line} strokeWidth="2.2" />
          <path d="M60 58l9 15H51z" fill="none" stroke="var(--color-awc-ink-soft)" strokeWidth="1.6" strokeLinejoin="round" />
        </>
      );
  }
  return (
    <svg viewBox="0 0 120 84" width={size} height={(size * 84) / 120} className={className} aria-hidden>
      {art}
    </svg>
  );
}
