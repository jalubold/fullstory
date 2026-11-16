'use client';

import { LOCALE_COOKIE, LOCALE_NAMES, LOCALES, type Locale } from '@/lib/compat/i18n';

/** Stores the visitor's language choice (overrides the IP-based default) and reloads. */
function switchLanguage(next: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${365 * 86400}; samesite=lax`;
  window.location.reload();
}

/**
 * EN / ID toggle. Remembers the choice in a cookie (which overrides the
 * IP-based default) and reloads so the proxy serves the chosen language.
 */
export function LanguageSwitcher({ locale, label, tone = 'dark' }: { locale: Locale; label: string; tone?: 'dark' | 'light' }) {
  const choose = (next: Locale) => {
    if (next !== locale) switchLanguage(next);
  };
  return (
    <div role="group" aria-label={label} className={`inline-flex items-center rounded-full border p-0.5 text-[0.6875rem] font-bold tracking-[0.08em] ${tone === 'light' ? 'border-white/30' : 'border-awc-line-strong bg-white/70'}`}>
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            lang={l}
            aria-pressed={active}
            title={LOCALE_NAMES[l].name}
            onClick={() => choose(l)}
            className={`min-h-7 rounded-full px-2.5 transition-colors ${active ? (tone === 'light' ? 'bg-white text-awc-wine-deep' : 'bg-awc-wine text-white') : tone === 'light' ? 'text-white/80 hover:text-white' : 'text-awc-muted hover:text-awc-wine-dark'}`}
          >
            {LOCALE_NAMES[l].short}
          </button>
        );
      })}
    </div>
  );
}
