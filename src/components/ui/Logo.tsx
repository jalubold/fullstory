import Link from 'next/link';

/**
 * FULLSTORY mark: an open book with a ribbon bookmark — the book, and the
 * place you keep in its story. Drawn on a deep red tile with a dark ribbon.
 */
export function LogoMark({ size = 32, tone = 'dark', className = '' }: { size?: number; tone?: 'dark' | 'light'; className?: string }) {
  const tile = tone === 'dark' ? 'url(#fs-tile)' : '#FFFFFF';
  const page = tone === 'dark' ? '#FFFFFF' : '#130C0D';
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className={className}>
      <defs>
        <linearGradient id="fs-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A8192F" />
          <stop offset="1" stopColor="#5A0814" />
        </linearGradient>
        <linearGradient id="fs-ribbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A0509" />
          <stop offset="1" stopColor="#120204" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={tile} />
      <path d="M20 12.2C16.6 10.3 12.2 9.7 8.2 10.5V28.6C12.2 27.8 16.6 28.4 20 30.3Z" fill={page} />
      <path d="M20 12.2C23.4 10.3 27.8 9.7 31.8 10.5V28.6C27.8 27.8 23.4 28.4 20 30.3Z" fill={page} opacity="0.72" />
      <path d="M24.6 10.05 27.9 9.85V33.2L26.25 31.5 24.6 33.2Z" fill="url(#fs-ribbon)" />
    </svg>
  );
}

export function Logo({ href = '/', className = '', compact = false, tone = 'dark' }: { href?: string; className?: string; compact?: boolean; tone?: 'dark' | 'light' }) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-2.5 ${tone === 'dark' ? 'text-ink' : 'text-white'} ${className}`} aria-label="FULLSTORY — home">
      <LogoMark size={30} tone={tone} className="rounded-[9px] transition-transform duration-500 ease-[var(--ease-soft)] group-hover:-rotate-6 group-hover:scale-105 group-data-[dark=true]/header:ring-1 group-data-[dark=true]/header:ring-white/20" />
      {!compact && <span className="font-serif text-[1.35rem] font-semibold leading-none tracking-[0.26em]">FULLSTORY</span>}
    </Link>
  );
}
