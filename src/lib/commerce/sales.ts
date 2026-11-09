import { formatMoney, getCatalog, priceIn, type Currency } from './catalog';

/**
 * Sales pages are prerendered once per currency (see proxy.ts, which picks the
 * visitor's version from their country), so the currency is part of the URL.
 */

/** URL slugs of the currencies sales pages exist in, e.g. ["usd", "eur"]. */
export function currencySlugs(): string[] {
  return getCatalog().currencies.map((c) => c.toLowerCase());
}

export function currencyFromSlug(slug: string): Currency | null {
  const code = slug.toUpperCase();
  return (getCatalog().currencies as string[]).includes(code) ? (code as Currency) : null;
}

/** The album price in a currency, formatted for display — e.g. "$19" or "€19". */
export function albumPrice(currency: Currency): string {
  const amount = priceIn(getCatalog().album.price, currency);
  return amount === null ? '' : formatMoney(amount, currency);
}
