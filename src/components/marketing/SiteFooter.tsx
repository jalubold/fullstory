import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Wordmark } from '@/components/ui/Logo';
import { printEnabled } from '@/lib/commerce/catalog';

const COLUMNS = [
  {
    title: 'Create',
    links: [
      { href: '/create', label: 'Begin a new book' },
      { href: '/templates', label: 'Designs' },
      { href: '/pricing', label: 'Pricing' },
    ],
  },
  {
    title: 'Help',
    links: [
      { href: '/how-it-works', label: 'How it works' },
      { href: '/faq', label: 'Questions' },
      { href: '/dashboard', label: printEnabled() ? 'My albums & orders' : 'My albums' },
    ],
  },
  {
    title: 'Studio',
    links: [
      { href: '/explore', label: 'Inspiration' },
      { href: '/about', label: 'About' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line-strong bg-paper">
      <div className="container-page pt-10 lg:pt-20">
        {/* Phones get every link from the tab bar and its "More" sheet, so the footer stays a quiet sign-off there. */}
        <div className="hidden gap-12 sm:grid lg:grid-cols-[1.3fr_2fr]">
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
        <div className="grid gap-3 py-6 text-xs leading-relaxed text-muted sm:mt-16 sm:gap-6 sm:border-t sm:border-line-strong sm:py-8 md:grid-cols-[auto_1fr_auto] md:items-baseline md:gap-10">
          <p className="smallcaps hidden !text-ink sm:block">Colophon</p>
          <p className="hidden max-w-2xl sm:block">
            FULLSTORY is a studio for making photobooks in your browser — no account, nothing to install. Set in Cormorant Garamond and Inter.
            Template sample photography courtesy of photographers on Unsplash.
          </p>
          <p className="folio not-italic">© 2026 FULLSTORY</p>
        </div>
      </div>
    </footer>
  );
}
