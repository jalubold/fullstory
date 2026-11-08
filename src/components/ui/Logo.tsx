import Link from 'next/link';

export function Logo({ href = '/', className = '', compact = false }: { href?: string; className?: string; compact?: boolean }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2 text-ink ${className}`} aria-label="FULLSTORY home">
      <span aria-hidden className="relative inline-block h-6 w-[18px] rounded-[3px] bg-ink">
        <span className="absolute inset-y-[3px] right-[3px] w-[2px] rounded-full bg-accent" />
      </span>
      {!compact && <span className="font-serif text-[1.3rem] font-semibold tracking-[0.22em]">FULLSTORY</span>}
    </Link>
  );
}
