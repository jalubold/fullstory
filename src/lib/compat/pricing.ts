/**
 * The Relationship Blueprint is a one-time purchase per couple: one payment
 * unlocks the full report for both participants. No subscriptions.
 *
 * Amounts are in minor units (ISO 4217: both USD and IDR have two decimals,
 * which is also how Stripe expects IDR).
 */

export type CompatCurrency = 'USD' | 'IDR';

export const BLUEPRINT_PRICES: Record<CompatCurrency, number> = {
  USD: 999, // $9.99
  IDR: 3_900_000, // Rp39.000
};

export const BLUEPRINT_PRODUCT = {
  key: 'compat-blueprint',
  name: 'The Relationship Blueprint',
  description:
    'The complete Relationship Blueprint from Are We Compatible?: a personalised analysis across five dimensions, both individual profiles, detailed answer comparisons, blind spots, conversation starters, an action plan and a downloadable PDF. One payment unlocks it for both participants.',
};

/** Indonesia pays in rupiah when the payment provider can charge it; everyone else in US dollars. */
export function blueprintCurrency(country: string | null | undefined, providerCurrencies: readonly string[] | null): CompatCurrency {
  const canIdr = providerCurrencies === null || providerCurrencies.includes('IDR');
  return country?.toUpperCase() === 'ID' && canIdr ? 'IDR' : 'USD';
}

export function formatPrice(amount: number, currency: CompatCurrency | string): string {
  if (currency === 'IDR') return `Rp${Math.round(amount / 100).toLocaleString('id-ID')}`;
  if (currency === 'USD') return `$${(amount / 100).toFixed(2)}`;
  return `${(amount / 100).toFixed(2)} ${currency}`;
}
