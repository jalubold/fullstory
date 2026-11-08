'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

export const NAV = [
  { href: '/templates', label: 'Collection' },
  { href: '/explore', label: 'Inspiration' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
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

export function MobileMenu({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    // Close the menu after navigation (derived state, no effect needed).
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  return (
    <div className="lg:hidden">
      <button type="button" className="btn btn-ghost btn-sm -mr-2 px-2.5 group-data-[dark=true]/header:text-white group-data-[dark=true]/header:hover:bg-white/10" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 md:top-[4.5rem] overflow-y-auto border-t border-line bg-paper px-5 pb-10 pt-4 animate-fade-up">
          <nav aria-label="Mobile" className="flex flex-col">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-baseline justify-between border-b border-line py-4 font-serif text-3xl">
                {item.label}
              </Link>
            ))}
            <Link href="/templates/categories" className="flex items-baseline justify-between border-b border-line py-4 font-serif text-3xl">
              Categories
            </Link>
            <Link href="/about" className="flex items-baseline justify-between border-b border-line py-4 font-serif text-3xl">
              About
            </Link>
            <Link href="/faq" className="flex items-baseline justify-between border-b border-line py-4 font-serif text-3xl">
              FAQ
            </Link>
          </nav>
          <div className="mt-6 flex flex-col gap-3">{children}</div>
        </div>
      )}
    </div>
  );
}
