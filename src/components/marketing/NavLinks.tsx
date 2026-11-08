'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Logo } from '@/components/ui/Logo';
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

const MOBILE_LINKS = [
  ...NAV,
  { href: '/templates/categories', label: 'Categories' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/**
 * Full-screen menu for phones and tablets, styled as a table of contents.
 * Rendered into <body> through a portal: the sticky header uses
 * backdrop-filter, which would otherwise trap a fixed overlay inside it.
 */
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
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="-mr-2 grid h-10 w-10 place-items-center rounded-[2px] text-ink transition-colors hover:bg-paper-2 group-data-[dark=true]/header:text-white group-data-[dark=true]/header:hover:bg-white/10"
        aria-expanded={open}
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <Menu size={21} strokeWidth={1.6} />
      </button>
      {open &&
        createPortal(
          <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[80] flex flex-col bg-paper text-ink animate-fade-up lg:hidden">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5 md:h-[4.5rem] md:px-8">
              <Logo height={28} />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="-mr-2 grid h-10 w-10 place-items-center rounded-[2px] hover:bg-paper-2">
                <X size={21} strokeWidth={1.6} />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 pt-3 md:px-8">
              <p className="smallcaps pb-2">Contents</p>
              {MOBILE_LINKS.map((item, i) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className="group flex items-baseline gap-4 border-b border-line py-4"
                  >
                    <span className="numeral w-9 shrink-0 text-lg">{ROMAN[i]}.</span>
                    <span className={`font-serif text-[2rem] leading-none transition-colors group-hover:text-accent ${active ? 'text-accent' : ''}`}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="flex shrink-0 flex-col gap-3 border-t border-line px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-8" onClick={() => setOpen(false)}>
              {children}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
