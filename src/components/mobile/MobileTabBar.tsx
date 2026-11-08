'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, ChevronRight, HelpCircle, Home, Info, LayoutGrid, Menu, Plus, Sparkles, Tag, X } from 'lucide-react';

/**
 * The phone and tablet navigation: an app-style tab bar pinned to the bottom,
 * within thumb reach, with a plus button as the centre action. Secondary
 * pages live in a "More" sheet. Hidden on screens where a page brings its own
 * bottom action bar (a template's detail page, starting an album).
 */

const HIDE_ON = [/^\/templates\/[^/]+$/, /^\/create\/new/];
const isTemplateList = (p: string) => p === '/templates' || p.startsWith('/templates/categor');

const MORE = [
  { href: '/explore', label: 'Inspiration', icon: Sparkles },
  { href: '/pricing', label: 'Pricing', icon: Tag },
  { href: '/how-it-works', label: 'How it works', icon: BookOpen },
  { href: '/faq', label: 'Questions', icon: HelpCircle },
  { href: '/about', label: 'About Fullstory', icon: Info },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMore(false);
  }
  const hidden = HIDE_ON.some((r) => r.test(pathname));

  useEffect(() => {
    if (!more) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMore(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [more]);

  if (hidden) return null;

  const tabs = [
    { href: '/', label: 'Home', icon: Home, active: pathname === '/' },
    { href: '/templates', label: 'Designs', icon: LayoutGrid, active: isTemplateList(pathname) },
    { href: '/dashboard', label: 'Albums', icon: BookOpen, active: pathname.startsWith('/dashboard') || pathname.startsWith('/orders') },
  ];
  const tab = (t: (typeof tabs)[number]) => (
    <Link key={t.href} href={t.href} aria-current={t.active ? 'page' : undefined} className={`flex flex-1 flex-col items-center justify-center gap-1 pt-2 pb-1 transition-colors active:opacity-60 ${t.active ? 'text-accent' : 'text-ink-soft'}`}>
      <t.icon size={22} strokeWidth={t.active ? 2 : 1.6} />
      <span className={`text-[10px] leading-none ${t.active ? 'font-semibold' : 'font-medium'}`}>{t.label}</span>
    </Link>
  );

  return (
    <>
      {/* Keeps the end of every page clear of the bar. */}
      <div aria-hidden className="h-[calc(4.25rem+env(safe-area-inset-bottom))] lg:hidden" />
      <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 lg:hidden">
        <div className="mx-auto flex h-[4.25rem] max-w-xl items-stretch px-2">
          {tab(tabs[0])}
          {tab(tabs[1])}
          <Link href="/create" aria-label="Begin a new book" className="group flex flex-1 items-center justify-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-white shadow-[0_10px_20px_-8px_rgb(142_17_38/0.75)] transition-transform group-active:scale-90">
              <Plus size={24} strokeWidth={2.2} />
            </span>
          </Link>
          {tab(tabs[2])}
          <button type="button" onClick={() => setMore(true)} aria-expanded={more} className={`flex flex-1 flex-col items-center justify-center gap-1 pt-2 pb-1 transition-colors active:opacity-60 ${more ? 'text-accent' : 'text-ink-soft'}`}>
            <Menu size={22} strokeWidth={1.6} />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>

      {more &&
        createPortal(
          <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="More">
            <button type="button" aria-label="Close" onClick={() => setMore(false)} className="animate-fade-in absolute inset-0 bg-ink/40" />
            <div className="animate-sheet-up absolute inset-x-0 bottom-0 rounded-t-[18px] bg-paper pb-[max(1rem,env(safe-area-inset-bottom))] shadow-pop">
              <span aria-hidden className="mx-auto mt-2.5 block h-1 w-10 rounded-full bg-line-strong" />
              <div className="flex items-center justify-between px-5 pb-2 pt-3">
                <p className="font-serif text-2xl">More</p>
                <button type="button" onClick={() => setMore(false)} aria-label="Close" className="-mr-2 grid h-10 w-10 place-items-center text-muted active:text-ink">
                  <X size={20} />
                </button>
              </div>
              <ul className="mx-4 overflow-hidden rounded-[12px] border border-line bg-white">
                {MORE.map(({ href, label, icon: Icon }) => (
                  <li key={href} className="border-b border-line last:border-0">
                    <Link href={href} className="flex items-center gap-3.5 px-4 py-3.5 text-[15px] active:bg-paper-2">
                      <span className="grid h-8 w-8 place-items-center rounded-[8px] bg-accent-soft text-accent">
                        <Icon size={16} />
                      </span>
                      <span className="flex-1">{label}</span>
                      <ChevronRight size={17} className="text-faint" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/create" className="btn btn-primary btn-lg mx-4 mt-4 flex text-[0.75rem] uppercase tracking-[0.18em]">
                <Plus size={16} /> Begin a new book
              </Link>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
