import { formatMoney, type Currency } from '@/lib/commerce/catalog';

export const money = (amount: number, currency: string) => formatMoney(amount, currency as Currency);

export function date(iso: string | Date | null | undefined) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

export const PAYMENT_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Payment pending', cls: 'bg-warning-soft text-warning' },
  paid: { label: 'Paid', cls: 'bg-success-soft text-success' },
  failed: { label: 'Payment failed', cls: 'bg-danger-soft text-danger' },
  refunded: { label: 'Refunded', cls: 'bg-paper-2 text-ink-soft' },
  cancelled: { label: 'Cancelled', cls: 'bg-paper-2 text-ink-soft' },
};

export const FULFILLMENT_STEPS = [
  { id: 'processing', label: 'Order received' },
  { id: 'in_production', label: 'In production' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
] as const;

export const FULFILLMENT_LABEL: Record<string, string> = {
  awaiting_payment: 'Awaiting payment',
  processing: 'Order received',
  in_production: 'In production',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
