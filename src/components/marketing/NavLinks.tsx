'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const NAV = [
  { href: '/templates', label: 'Collection' },
  { href: '/explore', label: 'Inspiration' },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`relative py-2 text-[0.6875rem] font-medium uppercase tracking-[0.2em] transition-colors ${active ? 'text-accent group-data-[dark=true]/header:text-white' : 'text-ink-soft hover:text-accent group-data-[dark=true]/header:text-white/70 group-data-[dark=true]/header:hover:text-white'}`}
          >
            {item.label}
            {active && <span className="absolute inset-x-0 -bottom-px h-px bg-current" />}
          </Link>
        );
      })}
    </nav>
  );
}
