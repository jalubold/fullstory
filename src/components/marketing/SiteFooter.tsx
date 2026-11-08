import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Wordmark } from '@/components/ui/Logo';
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
    <footer className="mt-auto border-t border-line-strong bg-paper">
      <div className="container-page pt-16 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Wordmark height={44} />
            <p className="mt-6 max-w-xs font-serif text-2xl leading-snug text-ink-soft">
              Your photos. Your story. <span className="italic text-accent">Your book.</span>
            </p>
            <Link href="/create" className="mt-7 inline-flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ink">
              <span className="link-underline">Begin your book</span> <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="smallcaps border-b border-line pb-3">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-ink-soft transition-colors hover:text-accent">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Colophon — the closing page of the book */}
        <div className="mt-16 grid gap-6 border-t border-line-strong py-8 text-xs leading-relaxed text-muted md:grid-cols-[auto_1fr_auto] md:items-baseline md:gap-10">
          <p className="smallcaps !text-ink">Colophon</p>
          <p className="max-w-2xl">
            FULLSTORY is a studio for making photobooks in your browser — no account, nothing to install. Set in Cormorant Garamond and Inter.
            Template sample photography courtesy of photographers on Unsplash.
          </p>
          <p className="folio not-italic">© 2026 FULLSTORY</p>
        </div>
      </div>
    </footer>
  );
}
