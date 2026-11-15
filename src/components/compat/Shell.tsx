import Link from 'next/link';
import type { ReactNode } from 'react';

export function Wordmark({ className = '', tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <Link href="/compatible" className={`group inline-flex items-baseline gap-[0.12em] ${tone === 'light' ? 'text-white' : 'text-awc-ink'} ${className}`} aria-label="Are We Compatible? — home">
      <span className="awc-serif text-[1.15rem] italic leading-none tracking-tight md:text-[1.3rem]">Are We Compatible</span>
      <span className={`awc-serif text-[1.15rem] leading-none md:text-[1.3rem] ${tone === 'light' ? 'text-awc-blush' : 'text-awc-wine'}`}>?</span>
    </Link>
  );
}

export function CompatHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-awc-line/70 bg-awc-cream/85 backdrop-blur-md supports-[backdrop-filter]:bg-awc-cream/70">
      <div className="awc-container flex h-14 items-center justify-between gap-4 md:h-16">
        <Wordmark />
        <div className="flex items-center gap-1 sm:gap-2">{right}</div>
      </div>
    </header>
  );
}

export function CompatFooter() {
  return (
    <footer className="border-t border-awc-line bg-awc-cream">
      <div className="awc-container flex flex-col gap-6 py-10 text-sm text-awc-muted md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <Wordmark />
          <p className="mt-3 leading-relaxed">
            Two people. Same questions. Different perspectives. For reflection and entertainment — not a psychological diagnosis or a prediction of relationship success.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          <Link href="/compatible/how-it-works" className="hover:text-awc-wine-dark">How it works</Link>
          <Link href="/compatible/how-it-works#privacy" className="hover:text-awc-wine-dark">Privacy</Link>
          <Link href="/compatible/start" className="hover:text-awc-wine-dark">Start the test</Link>
        </nav>
      </div>
    </footer>
  );
}

/** Centered, single-column screen used by the flow pages (start, join, quiz states). */
export function FlowScreen({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <div className={`awc-container flex flex-1 flex-col py-8 md:py-14 ${wide ? '' : 'max-w-xl'}`}>{children}</div>
    </main>
  );
}
