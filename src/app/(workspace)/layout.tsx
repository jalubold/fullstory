import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function WorkspaceLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Logo href="/" />
            <Link href="/templates" className="hidden text-sm text-muted hover:text-ink md:inline">
              Templates
            </Link>
          </div>
          <Link href="/create" className="btn btn-primary btn-sm text-[0.6875rem] uppercase tracking-[0.16em]">
            <Plus size={15} /> Begin a new book
          </Link>
        </div>
      </header>
      <main className="container-page py-10 pb-24 lg:py-14">{children}</main>
    </div>
  );
}
