import { LOCALE_NAMES, LOCALES, type Locale } from '@/lib/compat/i18n';

/**
 * EN / ID toggle. Plain links to the language-prefixed address
 * (/compatible/id/…): the proxy stores the choice in a cookie — which
 * overrides the IP-based default — and redirects back to the clean address.
 * No JavaScript needed, so it works before the page has finished loading.
 *
 * `path` is the current page's path after /compatible (e.g. "/start").
 */
export function LanguageSwitcher({ locale, label, path = '', tone = 'dark' }: { locale: Locale; label: string; path?: string; tone?: 'dark' | 'light' }) {
  const base = 'flex min-h-7 items-center rounded-full px-2.5 transition-colors';
  return (
    <div role="group" aria-label={label} className={`inline-flex items-center rounded-full border p-0.5 text-[0.6875rem] font-bold tracking-[0.08em] ${tone === 'light' ? 'border-white/30' : 'border-awc-line-strong bg-white/70'}`}>
      {LOCALES.map((l) =>
        l === locale ? (
          <span key={l} lang={l} aria-current="true" title={LOCALE_NAMES[l].name} className={`${base} ${tone === 'light' ? 'bg-white text-awc-wine-deep' : 'bg-awc-wine text-white'}`}>
            {LOCALE_NAMES[l].short}
          </span>
        ) : (
          <a key={l} href={`/compatible/${l}${path}`} hrefLang={l} lang={l} title={LOCALE_NAMES[l].name} rel="nofollow" className={`${base} ${tone === 'light' ? 'text-white/80 hover:text-white' : 'text-awc-muted hover:text-awc-wine-dark'}`}>
            {LOCALE_NAMES[l].short}
          </a>
        ),
      )}
    </div>
  );
}
