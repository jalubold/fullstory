'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

export const NAV = [
  { href: '/templates', label: 'Templates' },
  { href: '/explore', label: 'Explore' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-full px-3.5 py-2 text-[0.875rem] transition-colors ${active ? 'text-ink' : 'text-muted hover:text-ink'}`}
          >
            {item.label}
            {active && <span className="mx-auto mt-0.5 block h-px w-4 bg-accent" />}
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
    <div className="md:hidden">
      <button type="button" className="btn btn-ghost btn-sm -mr-2 px-2.5" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-line bg-paper px-5 pb-10 pt-4 animate-fade-up">
          <nav aria-label="Mobile" className="flex flex-col">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="border-b border-line py-4 font-serif text-2xl">
                {item.label}
              </Link>
            ))}
            <Link href="/templates/categories" className="border-b border-line py-4 font-serif text-2xl">
              Categories
            </Link>
            <Link href="/about" className="border-b border-line py-4 font-serif text-2xl">
              About
            </Link>
            <Link href="/faq" className="border-b border-line py-4 font-serif text-2xl">
              FAQ
            </Link>
          </nav>
          <div className="mt-6 flex flex-col gap-3">{children}</div>
        </div>
      )}
    </div>
  );
}
