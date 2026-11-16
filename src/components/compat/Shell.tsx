import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Locale } from '@/lib/compat/i18n';
import { UI } from '@/lib/compat/ui-strings';
import { VennMark } from './Brand';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Wordmark({ className = '', tone = 'dark', locale }: { className?: string; tone?: 'dark' | 'light'; locale: Locale }) {
  return (
    <Link href="/compatible" className={`group inline-flex items-center gap-2 ${tone === 'light' ? 'text-white' : 'text-awc-ink'} ${className}`} aria-label={UI[locale].shell.home}>
      <VennMark size={18} className="shrink-0 transition-transform duration-500 group-hover:scale-110" />
      <span className="inline-flex items-baseline gap-[0.12em]">
        <span lang="en" className="awc-serif text-[1.1rem] italic leading-none tracking-tight md:text-[1.25rem]">Are We Compatible</span>
        <span className={`awc-serif text-[1.1rem] leading-none md:text-[1.25rem] ${tone === 'light' ? 'text-awc-blush' : 'text-awc-wine'}`}>?</span>
      </span>
    </Link>
  );
}

export function CompatHeader({ locale, right }: { locale: Locale; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-awc-line/70 bg-awc-cream/85 backdrop-blur-md supports-[backdrop-filter]:bg-awc-cream/70">
      <div className="awc-container flex h-14 items-center justify-between gap-3 md:h-16">
        <Wordmark locale={locale} />
        <div className="flex items-center gap-1.5 sm:gap-2">
          {right}
          <LanguageSwitcher locale={locale} label={UI[locale].shell.language} />
        </div>
      </div>
    </header>
  );
}

export function CompatFooter({ locale }: { locale: Locale }) {
  const t = UI[locale].shell;
  return (
    <footer className="border-t border-awc-line bg-awc-cream">
      <div className="awc-container flex flex-col gap-6 py-10 text-sm text-awc-muted md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <Wordmark locale={locale} />
          <p className="mt-3 leading-relaxed">{t.footer}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-3" aria-label="Footer">
          <Link href="/compatible/how-it-works" className="hover:text-awc-wine-dark">{t.howItWorks}</Link>
          <Link href="/compatible/how-it-works#privacy" className="hover:text-awc-wine-dark">{t.privacy}</Link>
          <Link href="/compatible/start" className="hover:text-awc-wine-dark">{t.start}</Link>
          <LanguageSwitcher locale={locale} label={t.language} />
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

/** Language-neutral first paint for private pages while their data (and language) streams in. */
export function ShellPlaceholder({ tone = 'cream' }: { tone?: 'cream' | 'wine' }) {
  return (
    <>
      <div className="h-14 border-b border-awc-line/70 md:h-16" />
      <div className={tone === 'wine' ? 'min-h-[60vh] bg-awc-wine-deep' : 'flex flex-1 items-center justify-center py-32'} aria-busy="true">
        {tone === 'cream' && <span className="awc-pulse h-1 w-24 rounded-full bg-awc-blush" />}
      </div>
    </>
  );
}
