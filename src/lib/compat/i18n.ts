/**
 * Languages for Are We Compatible?. Pure module: safe in the proxy, server and browser.
 *
 * The language is a viewing preference, never part of the data: answers are
 * stored as option ids, so two people can take the same assessment in
 * different languages and each read the results in their own.
 */

export const LOCALES = ['en', 'id'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Set by the language switcher; overrides the IP-based default. */
export const LOCALE_COOKIE = 'awc_lang';

export const LOCALE_NAMES: Record<Locale, { short: string; name: string; intl: string }> = {
  en: { short: 'EN', name: 'English', intl: 'en-GB' },
  id: { short: 'ID', name: 'Bahasa Indonesia', intl: 'id-ID' },
};

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as readonly string[]).includes(v);

/** Indonesia → Bahasa Indonesia; everyone else → English. */
export function localeForCountry(country: string | null | undefined): Locale | null {
  if (!country) return null;
  return country.toUpperCase() === 'ID' ? 'id' : 'en';
}

/**
 * Picks the language for a request: the visitor's explicit choice (cookie),
 * else their country from the IP (Vercel's x-vercel-ip-country), else the
 * browser's Accept-Language (useful locally, where there is no country), else English.
 */
export function pickLocale(input: { cookie?: string | null; country?: string | null; acceptLanguage?: string | null }): Locale {
  if (isLocale(input.cookie)) return input.cookie;
  const byCountry = localeForCountry(input.country);
  if (byCountry) return byCountry;
  const primary = input.acceptLanguage?.split(',')[0]?.trim().toLowerCase() ?? '';
  if (primary.startsWith('id') || primary.startsWith('in')) return 'id';
  return DEFAULT_LOCALE;
}

/** The language of a request (route handlers, proxy). */
export function localeFromRequest(req: { headers: { get(name: string): string | null } }): Locale {
  const cookie = req.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`))?.[1] ?? null;
  return pickLocale({ cookie, country: req.headers.get('x-vercel-ip-country'), acceptLanguage: req.headers.get('accept-language') });
}
