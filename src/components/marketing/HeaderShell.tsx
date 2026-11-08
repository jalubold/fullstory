'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

/** Sticky header that goes dark while it sits over the homepage's dark hero. */
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
      className="group/header sticky top-0 z-50 border-b border-line/70 bg-paper/80 backdrop-blur-xl transition-colors duration-500 data-[dark=true]:border-white/10 data-[dark=true]:bg-night"
    >
      {children}
    </header>
  );
}
