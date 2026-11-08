import Link from 'next/link';
import { WORDMARK } from './wordmark';

/** The FULLSTORY wordmark: "fullstory", all lowercase, in Cormorant Garamond, in the current text colour. */
export function Wordmark({ height = 26, className = '' }: { height?: number; className?: string }) {
  const [, , w, h] = WORDMARK.viewBox.split(' ').map(Number);
  return (
    <svg viewBox={WORDMARK.viewBox} height={height} width={(height * w) / h} aria-hidden className={`block overflow-visible ${className}`}>
      <path d={WORDMARK.text} fill="currentColor" />
    </svg>
  );
}

export function Logo({ href = '/', className = '', tone = 'dark', height = 26 }: { href?: string; className?: string; tone?: 'dark' | 'light'; height?: number }) {
  return (
    <Link href={href} className={`inline-flex items-center ${tone === 'dark' ? 'text-ink' : 'text-white'} ${className}`} aria-label="FULLSTORY — home">
      <Wordmark height={height} />
    </Link>
  );
}
