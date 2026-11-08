'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

/** Sticky header that turns transparent (white type, ink ribbon) while it sits over the homepage's red cloth cover. */
export function HeaderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [past, setPast] = useState(false);
  useEffect(() => {
    const on = () => setPast(window.scrollY > window.innerHeight * 0.7);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const dark = pathname === '/' && !past;
  return (
    <header
      data-dark={dark ? 'true' : 'false'}
      className="group/header sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-md transition-[background-color,border-color] duration-500 data-[dark=true]:border-white/15 data-[dark=true]:bg-transparent data-[dark=true]:backdrop-blur-none data-[dark=true]:[--ribbon:var(--color-ink)]"
    >
      {children}
    </header>
  );
}
