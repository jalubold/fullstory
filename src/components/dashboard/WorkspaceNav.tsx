'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, CreditCard, Download, FileClock, FolderOpen, LayoutDashboard, Package, Settings, Share2 } from 'lucide-react';

export const WORKSPACE_NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/projects', label: 'All albums', icon: FolderOpen },
  { href: '/dashboard/drafts', label: 'Drafts', icon: FileClock },
  { href: '/dashboard/completed', label: 'Completed', icon: BookOpen },
  { href: '/dashboard/downloads', label: 'Downloads', icon: Download },
  { href: '/dashboard/shared', label: 'Share links', icon: Share2 },
  { href: '/dashboard/orders', label: 'Print Orders', icon: Package },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
];

export function WorkspaceNav({ printOn = true }: { printOn?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)) || (href === '/dashboard/billing' && pathname.startsWith('/orders/'));
  return (
    <>
      <nav aria-label="Workspace" className="hidden w-60 shrink-0 lg:block">
        <ul className="sticky top-24 space-y-0.5">
          {WORKSPACE_NAV.filter((n) => printOn || n.href !== '/dashboard/orders').map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} aria-current={isActive(href) ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${isActive(href) ? 'bg-white text-ink shadow-[0_1px_2px_rgb(0_0_0/.05)]' : 'text-ink-soft hover:bg-white/60 hover:text-ink'}`}>
                <Icon size={17} strokeWidth={1.6} className={isActive(href) ? 'text-accent-dark' : ''} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Workspace" className="no-scrollbar -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 lg:hidden">
        {WORKSPACE_NAV.map(({ href, label }) => (
          <Link key={href} href={href} className="chip" data-active={isActive(href)}>
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
