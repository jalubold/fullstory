import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';
import { HeaderShell } from './HeaderShell';
import { MobileMenu, NavLinks } from './NavLinks';

const side = 'text-[0.6875rem] font-medium uppercase tracking-[0.2em] transition-colors';

function Inner() {
  return (
    <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 md:h-[4.5rem]">
      <div className="flex items-center">
        <Suspense fallback={<nav aria-label="Main" className="hidden lg:flex" />}>
          <NavLinks />
        </Suspense>
        <div className="lg:hidden">
          <Logo height={28} className="group-data-[dark=true]/header:text-white" />
        </div>
      </div>
      <div className="hidden lg:block">
        <Logo height={30} className="group-data-[dark=true]/header:text-white" />
      </div>
      <div className="flex items-center justify-end gap-5">
        <Link href="/dashboard" className={`${side} hidden text-ink-soft hover:text-accent sm:inline-flex group-data-[dark=true]/header:text-white/75 group-data-[dark=true]/header:hover:text-white`}>
          My albums
        </Link>
        <Link href="/create" className="btn btn-primary btn-sm hidden uppercase tracking-[0.16em] !text-[0.6875rem] sm:inline-flex group-data-[dark=true]/header:bg-white group-data-[dark=true]/header:text-ink group-data-[dark=true]/header:hover:bg-ink group-data-[dark=true]/header:hover:text-white">
          Begin your book
        </Link>
        <Suspense fallback={null}>
          <MobileMenu>
            <Link href="/create" className="btn btn-primary btn-lg">Begin your book</Link>
            <Link href="/dashboard" className="btn btn-secondary btn-lg">My albums</Link>
          </MobileMenu>
        </Suspense>
      </div>
    </div>
  );
}

function StaticShell({ children }: { children: ReactNode }) {
  return <header className="group/header sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-md">{children}</header>;
}

export function SiteHeader() {
  return (
    <Suspense
      fallback={
        <StaticShell>
          <Inner />
        </StaticShell>
      }
    >
      <HeaderShell>
        <Inner />
      </HeaderShell>
    </Suspense>
  );
}
