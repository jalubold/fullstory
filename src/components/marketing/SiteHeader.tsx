import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';
import { HeaderShell } from './HeaderShell';
import { MobileMenu, NavLinks } from './NavLinks';

function Inner() {
  return (
    <div className="container-page flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
      <div className="flex flex-1 items-center">
        <Logo className="group-data-[dark=true]/header:text-white" />
      </div>
      <Suspense fallback={<nav aria-label="Main" className="hidden md:flex" />}>
        <NavLinks />
      </Suspense>
      <div className="flex flex-1 items-center justify-end gap-2">
        <Link href="/dashboard" className="hidden rounded-full px-3 py-2 text-sm text-ink-soft transition-colors hover:text-ink group-data-[dark=true]/header:text-white/75 group-data-[dark=true]/header:hover:text-white sm:inline-flex">
          My albums
        </Link>
        <Link href="/create" className="btn btn-primary btn-sm hidden sm:inline-flex">
          Create Album
        </Link>
        <Suspense fallback={null}>
          <MobileMenu>
            <Link href="/dashboard" className="btn btn-secondary btn-lg">My albums</Link>
            <Link href="/create" className="btn btn-primary btn-lg">Create Album</Link>
          </MobileMenu>
        </Suspense>
      </div>
    </div>
  );
}

function StaticShell({ children }: { children: ReactNode }) {
  return <header className="group/header sticky top-0 z-50 border-b border-line/70 bg-paper/80 backdrop-blur-xl">{children}</header>;
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
