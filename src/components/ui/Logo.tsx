import Link from 'next/link';
import { WORDMARK } from './wordmark';

/**
 * The FULLSTORY wordmark: "Fullstory" in Cormorant Garamond, with the second
 * "l" drawn as a ribbon bookmark hanging below the line — the place you keep
 * in a story. The letters take the current text colour; the ribbon is deep red
 * (or ink on red backgrounds).
 */
export function Wordmark({ height = 26, ribbon = 'var(--ribbon, var(--color-accent))', className = '' }: { height?: number; ribbon?: string; className?: string }) {
  const [, , w, h] = WORDMARK.viewBox.split(' ').map(Number);
  return (
    <svg viewBox={WORDMARK.viewBox} height={height} width={(height * w) / h} aria-hidden className={`block overflow-visible ${className}`}>
      <path d={WORDMARK.text} fill="currentColor" />
      <path d={WORDMARK.ribbon} fill={ribbon} style={{ transformBox: 'fill-box' }} className="origin-top transition-transform duration-500 ease-[var(--ease-soft)] group-hover:scale-y-[1.12]" />
    </svg>
  );
}

/** The ribbon alone — used where the full wordmark doesn't fit (editor toolbar, favicon). */
export function RibbonMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className={className}>
      <rect width="64" height="64" rx="14" fill="var(--color-card)" stroke="var(--color-line)" />
      <path d="M24 0H40V51.2L32 43.5L24 51.2Z" fill="var(--color-accent)" style={{ transformBox: 'fill-box' }} className="origin-top transition-transform duration-500 group-hover:scale-y-110" />
    </svg>
  );
}

export function Logo({
  href = '/',
  className = '',
  compact = false,
  tone = 'dark',
  height = 26,
}: {
  href?: string;
  className?: string;
  compact?: boolean;
  tone?: 'dark' | 'light';
  height?: number;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center ${tone === 'dark' ? 'text-ink' : 'text-white'} ${className}`}
      aria-label="FULLSTORY — home"
    >
      {compact ? <RibbonMark /> : <Wordmark height={height} ribbon={tone === 'light' ? 'var(--color-ink)' : undefined} />}
    </Link>
  );
}
