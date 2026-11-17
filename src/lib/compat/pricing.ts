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
  IDR: 4_900_000, // Rp49.000
};

/**
 * What a visitor in Indonesia is charged when the payment provider can't
 * charge rupiah (Creem charges only US dollars and euros): the US-dollar
 * equivalent of Rp49.000. The price is still shown in rupiah, with a note
 * saying the charge is in dollars. Revisit if the exchange rate moves far
 * from ~16,400 IDR per USD.
 */
export const BLUEPRINT_INDONESIA_USD = 299; // US$2.99

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

export interface BlueprintQuote {
  /** What is actually charged. */
  currency: CompatCurrency;
  amount: number;
  /** The price as shown to this visitor. */
  label: string;
  /** Set when the price is shown in one currency but charged in another: the real charge, to disclose beside it. */
  chargedAs: { amount: number; currency: CompatCurrency } | null;
}

/**
 * The price for a visitor, from their country. Indonesia always sees rupiah;
 * it is charged in rupiah when the provider can, and otherwise in US dollars
 * at the equivalent amount (disclosed via `chargedAs`).
 */
export function blueprintQuote(country: string | null | undefined, providerCurrencies: readonly string[] | null): BlueprintQuote {
  const indonesia = country?.toUpperCase() === 'ID';
  const currency = blueprintCurrency(country, providerCurrencies);
  if (indonesia && currency === 'USD') {
    return { currency, amount: BLUEPRINT_INDONESIA_USD, label: formatPrice(BLUEPRINT_PRICES.IDR, 'IDR'), chargedAs: { amount: BLUEPRINT_INDONESIA_USD, currency } };
  }
  const amount = BLUEPRINT_PRICES[currency];
  return { currency, amount, label: formatPrice(amount, currency), chargedAs: null };
}

/** "US$2.99" (or "US$2,99" in Indonesian), for saying what a rupiah price is charged as. */
export function formatUsdCharge(amount: number, intl: string): string {
  return `US$${(amount / 100).toLocaleString(intl, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPrice(amount: number, currency: CompatCurrency | string): string {
  if (currency === 'IDR') return `Rp${Math.round(amount / 100).toLocaleString('id-ID')}`;
  if (currency === 'USD') return `$${(amount / 100).toFixed(2)}`;
  return `${(amount / 100).toFixed(2)} ${currency}`;
}
