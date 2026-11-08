import { getCatalog, priceIn, type Catalog, type Currency } from './catalog';

export type OrderItemInput =
  | { kind: 'digital_pdf' }
  | { kind: 'digital_share' }
  | { kind: 'print'; sizeId: string; coverId: string; pageCount: number; quantity: number }
  | { kind: 'premium_template' };

export interface PricedLine {
  kind: OrderItemInput['kind'];
  label: string;
  detail?: string;
  quantity: number;
  unitAmount: number;
  amount: number;
}

export interface Quote {
  currency: Currency;
  lines: PricedLine[];
  shipping: { id: string; label: string; amount: number } | null;
  subtotal: number;
  total: number;
}

export class PricingError extends Error {}

/** Extra pages beyond the minimum, rounded up to the configured step. */
export function normalisePageCount(pageCount: number, catalog = getCatalog()): number {
  const { min, max, step } = catalog.pages;
  const clamped = Math.min(max, Math.max(min, pageCount));
  return min + Math.ceil((clamped - min) / step) * step;
}

export function printUnitPrice(sizeId: string, coverId: string, pageCount: number, currency: Currency, catalog = getCatalog()): number {
  const base = priceIn(catalog.print.basePrice[sizeId]?.[coverId], currency);
  const extra = priceIn(catalog.print.extraPagePrice[sizeId], currency);
  if (base === null || extra === null) throw new PricingError(`No price configured for ${sizeId}/${coverId} in ${currency}`);
  const pages = normalisePageCount(pageCount, catalog);
  return base + (pages - catalog.pages.min) * extra;
}

/** Server-authoritative price calculation. Never trust amounts sent by a client. */
export function quote(items: OrderItemInput[], currency: Currency, shippingId: string | null, catalog: Catalog = getCatalog()): Quote {
  const lines: PricedLine[] = [];
  let hasPrint = false;
  for (const item of items) {
    if (item.kind === 'premium_template') {
      const amount = priceIn(catalog.premiumTemplate.price, currency);
      if (amount === null) throw new PricingError(`No ${currency} price configured for premium designs`);
      lines.push({ kind: item.kind, label: catalog.premiumTemplate.label, quantity: 1, unitAmount: amount, amount });
    } else if (item.kind === 'digital_pdf' || item.kind === 'digital_share') {
      const p = item.kind === 'digital_pdf' ? catalog.digital.pdf : catalog.digital.share;
      const amount = priceIn(p.price, currency);
      if (amount === null) throw new PricingError(`No ${currency} price configured for ${p.label}`);
      lines.push({ kind: item.kind, label: p.label, quantity: 1, unitAmount: amount, amount });
    } else {
      hasPrint = true;
      const size = catalog.sizes.find((s) => s.id === item.sizeId);
      const cover = catalog.covers.find((c) => c.id === item.coverId);
      if (!size || !cover) throw new PricingError('Unknown print format');
      const qty = Math.max(1, Math.min(catalog.print.maxQuantity, Math.floor(item.quantity)));
      const unit = printUnitPrice(item.sizeId, item.coverId, item.pageCount, currency, catalog);
      lines.push({
        kind: 'print',
        label: `Printed photobook — ${cover.label}`,
        detail: `${size.label} · ${normalisePageCount(item.pageCount, catalog)} pages`,
        quantity: qty,
        unitAmount: unit,
        amount: unit * qty,
      });
    }
  }
  let shipping: Quote['shipping'] = null;
  if (hasPrint) {
    const opt = catalog.shipping.find((s) => s.id === shippingId) ?? catalog.shipping[0];
    const amount = priceIn(opt?.price, currency);
    if (!opt || amount === null) throw new PricingError('No shipping option configured');
    shipping = { id: opt.id, label: `${opt.label} shipping`, amount };
  }
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  return { currency, lines, shipping, subtotal, total: subtotal + (shipping?.amount ?? 0) };
}

/** Lowest configured print price for a currency (for "from" labels). */
export function lowestPrintPrice(currency: Currency, catalog = getCatalog()): number | null {
  let best: number | null = null;
  for (const covers of Object.values(catalog.print.basePrice)) {
    for (const money of Object.values(covers)) {
      const v = priceIn(money, currency);
      if (v !== null && (best === null || v < best)) best = v;
    }
  }
  return best;
}
