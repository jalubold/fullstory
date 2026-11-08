import rawCatalog from '@/config/catalog.json';
import type { Orientation } from '@/lib/album/types';

export type Currency = 'USD' | 'GBP' | 'EUR';
export type Money = Partial<Record<Currency, number>>;

export interface CatalogSize {
  id: string;
  label: string;
  metricLabel: string;
  orientation: Orientation;
  widthMm: number;
  heightMm: number;
}

export interface Catalog {
  isSample: boolean;
  currencies: Currency[];
  defaultCurrency: Currency;
  pages: { min: number; max: number; step: number; default: number };
  sizes: CatalogSize[];
  covers: Array<{ id: string; label: string; description: string }>;
  digital: {
    pdf: { label: string; description: string; price: Money };
    share: { label: string; description: string; price: Money };
  };
  print: {
    /** Sell printed photobooks. When false, only digital products are offered. */
    enabled?: boolean;
    basePrice: Record<string, Record<string, Money>>;
    extraPagePrice: Record<string, Money>;
    maxQuantity: number;
    bleedMm: number;
    safeMarginMm: number;
    spine: { mmPerPage: number; minMm: number; coverWrapMm: number };
    minDpi: number;
    targetDpi: number;
    digitalDpi: number;
  };
  shipping: Array<{ id: string; label: string; estimate: string; price: Money }>;
  shippingCountries: string[];
  share: { defaultExpiryDays: number | null };
  premiumTemplate: { label: string; description: string; price: Money };
}

let cached: Catalog | null = null;

/**
 * Returns the product catalog. Server code may override the bundled JSON with
 * FULLSTORY_CATALOG_JSON (a full catalog document) without a redeploy of code.
 */
export function getCatalog(): Catalog {
  if (cached) return cached;
  let catalog = rawCatalog as unknown as Catalog;
  if (typeof process !== 'undefined' && process.env.FULLSTORY_CATALOG_JSON) {
    try {
      catalog = JSON.parse(process.env.FULLSTORY_CATALOG_JSON) as Catalog;
    } catch {
      console.error('[catalog] FULLSTORY_CATALOG_JSON is not valid JSON — using bundled catalog.');
    }
  }
  cached = catalog;
  return catalog;
}

/** Whether printed photobooks are offered at all. */
export function printEnabled(catalog = getCatalog()): boolean {
  return catalog.print.enabled !== false;
}

export function sizesFor(orientation: Orientation, catalog = getCatalog()): CatalogSize[] {
  return catalog.sizes.filter((s) => s.orientation === orientation);
}

export function getSize(id: string, catalog = getCatalog()): CatalogSize | undefined {
  return catalog.sizes.find((s) => s.id === id);
}

export function priceIn(money: Money | undefined, currency: Currency): number | null {
  const v = money?.[currency];
  return typeof v === 'number' ? v : null;
}

export function formatMoney(amount: number, currency: Currency, locale?: string): string {
  const loc = locale ?? (currency === 'GBP' ? 'en-GB' : currency === 'EUR' ? 'en-IE' : 'en-US');
  return new Intl.NumberFormat(loc, { style: 'currency', currency, minimumFractionDigits: amount % 100 === 0 ? 0 : 2 }).format(amount / 100);
}

export function isCurrency(v: unknown, catalog = getCatalog()): v is Currency {
  return typeof v === 'string' && (catalog.currencies as string[]).includes(v);
}
