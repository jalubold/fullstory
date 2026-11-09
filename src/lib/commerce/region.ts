import type { Currency } from './catalog';

/** Europe — EU/EEA, the UK, Switzerland and neighbours — pays in euros; everyone else in US dollars. */
const EURO_REGION = new Set([
  // EU
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // EEA, UK, Switzerland and other European countries & territories
  'IS', 'LI', 'NO', 'GB', 'CH', 'AD', 'MC', 'SM', 'VA', 'AL', 'BA', 'ME', 'MK', 'RS', 'XK', 'MD', 'UA', 'GI', 'IM', 'JE', 'GG', 'FO', 'AX',
  // French & other EU outermost regions
  'GF', 'GP', 'MQ', 'RE', 'YT', 'PM', 'BL', 'MF',
]);

/**
 * The currency a visitor pays in, from their country (ISO 3166 alpha-2, e.g. Vercel's
 * `x-vercel-ip-country`). Falls back to the first offered currency when unknown.
 */
export function currencyForCountry(country: string | null | undefined, offered: readonly Currency[]): Currency {
  const want: Currency = country && EURO_REGION.has(country.toUpperCase()) ? 'EUR' : 'USD';
  return offered.includes(want) ? want : offered[0];
}

/** The visitor's country from request headers (set by Vercel at the edge; absent locally). */
export function countryFromHeaders(h: { get(name: string): string | null }): string | null {
  return h.get('x-vercel-ip-country');
}
