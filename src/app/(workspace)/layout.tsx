import Link from 'next/link';
import { Suspense } from 'react';
import { LogOut, Plus } from 'lucide-react';
import { WorkspaceNav } from '@/components/dashboard/WorkspaceNav';
import { Logo } from '@/components/ui/Logo';
import { getUser } from '@/lib/server/auth';

async function UserMenu() {
  const user = await getUser().catch(() => null);
  if (!user) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-right text-xs leading-tight sm:block">
        <span className="block text-ink">{user.name ?? user.email}</span>
        {user.name && <span className="text-muted">{user.email}</span>}
      </span>
      {user.isAdmin && <Link href="/admin/orders" className="btn btn-ghost btn-sm">Admin</Link>}
      <form action="/auth/signout" method="post">
        <button type="submit" className="btn btn-ghost btn-sm !p-2" aria-label="Log out" title="Log out">
          <LogOut size={17} />
        </button>
      </form>
    </div>
  );
}

export default function WorkspaceLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Logo href="/dashboard" />
            <Link href="/templates" className="hidden text-sm text-muted hover:text-ink md:inline">Templates</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/create" className="btn btn-primary btn-sm">
              <Plus size={15} /> <span className="hidden sm:inline">Create New Album</span>
            </Link>
            <Suspense fallback={null}>
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </header>
      <div className="container-page flex gap-10 py-8 lg:py-10">
        <Suspense fallback={<div className="hidden w-60 shrink-0 lg:block" />}>
          <WorkspaceNav />
        </Suspense>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
