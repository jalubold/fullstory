import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { MobileTabBar } from '@/components/mobile/MobileTabBar';

export default function WorkspaceLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="container-page flex h-14 items-center justify-between gap-4 lg:h-16">
          <div className="flex items-center gap-6">
            <Logo href="/" />
            <Link href="/templates" className="hidden text-sm text-muted hover:text-ink md:inline">
              Templates
            </Link>
          </div>
          <Link href="/create" className="btn btn-primary btn-sm hidden text-[0.6875rem] uppercase tracking-[0.16em] lg:inline-flex">
            <Plus size={15} /> Create your own
          </Link>
        </div>
      </header>
      <main className="container-page py-7 pb-10 lg:py-14 lg:pb-24">{children}</main>
      <Suspense fallback={null}>
        <MobileTabBar />
      </Suspense>
    </div>
  );
}
