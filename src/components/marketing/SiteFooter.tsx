import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';
import { CATEGORIES } from '@/lib/templates/taxonomy';

const COLUMNS = [
  {
    title: 'Create',
    links: [
      { href: '/create', label: 'Create an album' },
      { href: '/templates', label: 'All templates' },
      { href: '/templates/categories', label: 'Categories' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/pricing', label: 'Pricing' },
    ],
  },
  {
    title: 'Discover',
    links: [
      { href: '/explore', label: 'Inspiration' },
      ...CATEGORIES.slice(0, 4).map((c) => ({ href: `/templates/category/${c.id}`, label: `${c.label} albums` })),
    ],
  },
  {
    title: 'FULLSTORY',
    links: [
      { href: '/about', label: 'About' },
      { href: '/faq', label: 'FAQ' },
      { href: '/dashboard', label: 'My albums' },
      { href: '/dashboard/orders', label: 'Track an order' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="grain relative isolate mt-auto overflow-hidden bg-night text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-rose/10 blur-[120px]" />
      </div>
      <div className="container-page grid gap-12 pb-12 pt-20 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <LogoMark size={40} className="rounded-[11px] ring-1 ring-white/15" />
          <p className="mt-6 font-serif text-3xl leading-snug">
            Your photos. Your story. <span className="italic text-gradient">Your book.</span>
          </p>
          <Link href="/create" className="btn btn-light btn-sm mt-7">
            Start your album <ArrowRight size={14} />
          </Link>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="eyebrow !text-white/40">{col.title}</p>
            <ul className="mt-5 space-y-3">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/70 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-page select-none overflow-hidden" aria-hidden>
        <p className="translate-y-[18%] whitespace-nowrap text-center font-serif text-[clamp(4rem,17vw,15rem)] font-semibold leading-none tracking-[0.12em] text-white/[0.06]">FULLSTORY</p>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 FULLSTORY. All rights reserved.</p>
          <p>Template sample photography courtesy of photographers on Unsplash.</p>
        </div>
      </div>
    </footer>
  );
}
