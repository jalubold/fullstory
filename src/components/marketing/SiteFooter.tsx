import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
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
      { href: '/explore', label: 'Inspiration gallery' },
      ...CATEGORIES.slice(0, 4).map((c) => ({ href: `/templates/category/${c.id}`, label: `${c.label} albums` })),
    ],
  },
  {
    title: 'FULLSTORY',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/faq', label: 'FAQ' },
      { href: '/login', label: 'Log in' },
      { href: '/dashboard', label: 'My albums' },
      { href: '/dashboard/orders', label: 'Track an order' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-paper-2/60">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-5 font-serif text-2xl leading-snug text-ink">Your photos. Your story. Your book.</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Turn your favourite memories into beautiful photo albums — designed by you, in your browser.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="eyebrow">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink-soft transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {2026} FULLSTORY. All rights reserved.</p>
          <p>Template sample photography courtesy of photographers on Unsplash.</p>
        </div>
      </div>
    </footer>
  );
}
