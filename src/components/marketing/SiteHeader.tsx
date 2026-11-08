import Link from 'next/link';
import { Suspense } from 'react';
import { getUser } from '@/lib/server/auth';
import { Logo } from '@/components/ui/Logo';
import { MobileMenu, NavLinks } from './NavLinks';

async function AccountLinks({ mobile = false }: { mobile?: boolean }) {
  let user = null;
  try {
    user = await getUser();
  } catch {
    user = null;
  }
  if (mobile) {
    return user ? (
      <>
        <Link href="/dashboard" className="btn btn-secondary btn-lg">My albums</Link>
        <Link href="/create" className="btn btn-primary btn-lg">Create Album</Link>
      </>
    ) : (
      <>
        <Link href="/login" className="btn btn-secondary btn-lg">Log In</Link>
        <Link href="/create" className="btn btn-primary btn-lg">Create Album</Link>
      </>
    );
  }
  return user ? (
    <Link href="/dashboard" className="hidden rounded-full px-3 py-2 text-sm text-ink-soft hover:text-ink sm:inline-flex">
      My albums
    </Link>
  ) : (
    <Link href="/login" className="hidden rounded-full px-3 py-2 text-sm text-ink-soft hover:text-ink sm:inline-flex">
      Log In
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-paper/85 backdrop-blur-md supports-[backdrop-filter]:bg-paper/75">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex flex-1 items-center">
          <Logo />
        </div>
        <Suspense fallback={<nav aria-label="Main" className="hidden md:flex" />}>
          <NavLinks />
        </Suspense>
        <div className="flex flex-1 items-center justify-end gap-2">
          <Suspense fallback={<span className="hidden w-16 sm:inline-block" />}>
            <AccountLinks />
          </Suspense>
          <Link href="/create" className="btn btn-primary btn-sm hidden sm:inline-flex">
            Create Album
          </Link>
          <Suspense fallback={null}>
            <MobileMenu>
              <Suspense fallback={null}>
                <AccountLinks mobile />
              </Suspense>
            </MobileMenu>
          </Suspense>
        </div>
      </div>
    </header>
  );
}
