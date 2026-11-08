import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';
import { HeaderShell } from './HeaderShell';
import { NavLinks } from './NavLinks';

const side = 'text-[0.6875rem] font-medium uppercase tracking-[0.2em] transition-colors';

function Inner() {
  return (
    <div className="container-page flex h-14 items-center gap-4 lg:h-[4.5rem]">
      <Logo height={28} className="shrink-0 lg:[&_svg]:h-[30px] lg:[&_svg]:w-auto group-data-[dark=true]/header:text-white" />
      <div className="ml-12 hidden lg:block">
        <Suspense fallback={<nav aria-label="Main" className="hidden lg:flex" />}>
          <NavLinks />
        </Suspense>
      </div>
      <div className="ml-auto flex items-center justify-end gap-5">
        <Link href="/dashboard" className={`${side} hidden text-ink-soft hover:text-accent lg:inline-flex group-data-[dark=true]/header:text-white/75 group-data-[dark=true]/header:hover:text-white`}>
          My albums
        </Link>
        <Link href="/create" className="btn btn-primary btn-sm hidden uppercase tracking-[0.16em] !text-[0.6875rem] lg:inline-flex group-data-[dark=true]/header:bg-white group-data-[dark=true]/header:text-ink group-data-[dark=true]/header:hover:bg-ink group-data-[dark=true]/header:hover:text-white">
          Begin your book
        </Link>
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
