import Link from 'next/link';
import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { WorkspaceNav } from '@/components/dashboard/WorkspaceNav';
import { Logo } from '@/components/ui/Logo';
import { printEnabled } from '@/lib/commerce/catalog';

export default function WorkspaceLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Logo href="/" />
            <Link href="/templates" className="hidden text-sm text-muted hover:text-ink md:inline">Templates</Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted sm:inline">Albums saved in this browser</span>
            <Link href="/create" className="btn btn-primary btn-sm">
              <Plus size={15} /> <span className="hidden sm:inline">Create New Album</span>
            </Link>
          </div>
        </div>
      </header>
      <div className="container-page flex flex-col gap-0 py-6 lg:flex-row lg:gap-10 lg:py-10">
        <Suspense fallback={<div className="hidden w-60 shrink-0 lg:block" />}>
          <WorkspaceNav printOn={printEnabled()} />
        </Suspense>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
