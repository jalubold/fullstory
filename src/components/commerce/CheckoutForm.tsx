'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, Check, Download, Link2, Loader2, Lock, Minus, Plus, QrCode } from 'lucide-react';
import type { Catalog, Currency } from '@/lib/commerce/catalog';
import { normalisePageCount, quote, type OrderItemInput } from '@/lib/commerce/pricing';
import type { Orientation } from '@/lib/album/types';

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', CA: 'Canada', GB: 'United Kingdom', IE: 'Ireland', DE: 'Germany', FR: 'France', NL: 'Netherlands', BE: 'Belgium', LU: 'Luxembourg',
  AT: 'Austria', CH: 'Switzerland', ES: 'Spain', PT: 'Portugal', IT: 'Italy', DK: 'Denmark', SE: 'Sweden', NO: 'Norway', FI: 'Finland', PL: 'Poland',
  CZ: 'Czechia', AU: 'Australia', NZ: 'New Zealand',
};

function fmt(amount: number, currency: Currency) {
  const loc = currency === 'GBP' ? 'en-GB' : currency === 'EUR' ? 'en-IE' : 'en-US';
  return new Intl.NumberFormat(loc, { style: 'currency', currency, minimumFractionDigits: amount % 100 === 0 ? 0 : 2 }).format(amount / 100);
}

interface Props {
  projectId: string;
  catalog: Catalog;
  /** Set by the server from the visitor's country. */
  currency: Currency;
  orientation: Orientation;
  sizeId: string;
  pageCount: number;
  premium: boolean;
  provider: { id: string; label: string; isTest: boolean } | null;
  defaultName: string;
  defaultEmail: string;
}

export function CheckoutForm({ projectId, catalog, currency, orientation, sizeId, pageCount, premium, provider, defaultName, defaultEmail }: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [pdf, setPdf] = useState(true);
  const [share, setShare] = useState(false);
  const [print, setPrint] = useState(false);
  const sizes = catalog.sizes.filter((s) => s.orientation === orientation);
  const [size, setSize] = useState(sizes.find((s) => s.id === sizeId)?.id ?? sizes[0]?.id);
  const [cover, setCover] = useState(catalog.covers[1]?.id ?? catalog.covers[0].id);
  const [qty, setQty] = useState(1);
  const [shipping, setShipping] = useState(catalog.shipping[0]?.id);
  const [addr, setAddr] = useState({ name: defaultName, line1: '', line2: '', city: '', region: '', postalCode: '', country: currency === 'GBP' ? 'GB' : currency === 'EUR' ? 'DE' : 'US', phone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printPages = normalisePageCount(pageCount, catalog);

  const items: OrderItemInput[] = useMemo(() => {
    const list: OrderItemInput[] = [];
    if (pdf) list.push({ kind: 'digital_pdf' });
    if (share) list.push({ kind: 'digital_share' });
    if (print && size) list.push({ kind: 'print', sizeId: size, coverId: cover, pageCount: printPages, quantity: qty });
    if (list.length && premium) list.push({ kind: 'premium_template' });
    return list;
  }, [pdf, share, print, size, cover, printPages, qty, premium]);

  const q = useMemo(() => {
    try {
      return items.length ? quote(items, currency, print ? shipping : null, catalog) : null;
    } catch {
      return null;
    }
  }, [items, currency, print, shipping, catalog]);

  const submit = async () => {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter your email so we can send your receipt and order updates.');
      return;
    }
    if (print && (!addr.name || !addr.line1 || !addr.city || !addr.postalCode)) {
      setError('Please complete your shipping address.');
      return;
    }
    setBusy(true);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        email: email.trim(),
        currency,
        pdf,
        share,
        print: print ? { sizeId: size, coverId: cover, quantity: qty, shippingId: shipping, address: { ...addr, line2: addr.line2 || undefined, region: addr.region || undefined, phone: addr.phone || undefined } } : null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setError(data.error ?? 'We couldn’t start checkout. Please try again.');
      return;
    }
    window.location.href = data.url;
  };

  const field = (key: keyof typeof addr, label: string, opts: { required?: boolean; auto?: string; half?: boolean } = {}) => (
    <div className={opts.half ? '' : 'sm:col-span-2'}>
      <label className="label" htmlFor={`a-${key}`}>
        {label}
        {!opts.required && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      <input id={`a-${key}`} className="input" autoComplete={opts.auto} required={opts.required} value={addr[key]} onChange={(e) => setAddr((a) => ({ ...a, [key]: e.target.value }))} />
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl">Choose your formats</h2>
        </div>
        <Option icon={Download} title={catalog.digital.pdf.label} text={catalog.digital.pdf.description} price={catalog.digital.pdf.price[currency]} currency={currency} checked={pdf} onChange={setPdf} />
        <Option icon={Link2} title={catalog.digital.share.label} text={catalog.digital.share.description} price={catalog.digital.share.price[currency]} currency={currency} checked={share} onChange={setShare} extra={<span className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-accent-dark"><QrCode size={14} /> QR code included — guests scan it to open the album</span>} />
        {catalog.print.enabled !== false && (
          <>
        <Option icon={BookOpen} title="Printed photobook" text={`Professionally printed and bound, ${printPages} pages.`} price={undefined} currency={currency} checked={print} onChange={setPrint} />

        {print && (
          <div className="space-y-8 rounded-[4px] border border-line bg-white p-6">
            {printPages !== pageCount && (
              <p className="flex gap-2 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                Printed books have {catalog.pages.min}–{catalog.pages.max} pages in steps of {catalog.pages.step}. {printPages - pageCount} blank {printPages - pageCount === 1 ? 'page' : 'pages'} will be added at the end.
              </p>
            )}
            <fieldset>
              <legend className="label">Size</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {sizes.map((s) => (
                  <label key={s.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm ${size === s.id ? 'border-ink' : 'border-line-strong'}`}>
                    <input type="radio" name="size" checked={size === s.id} onChange={() => setSize(s.id)} className="accent-accent" />
                    <span>
                      {s.label} <span className="text-muted">· {s.metricLabel}</span>
                      {s.id === sizeId && <span className="ml-1 text-xs text-accent-dark">(designed size)</span>}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">Cover</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {catalog.covers.map((c) => (
                  <label key={c.id} className={`cursor-pointer rounded-xl border p-4 text-sm ${cover === c.id ? 'border-ink' : 'border-line-strong'}`}>
                    <span className="flex items-center gap-2">
                      <input type="radio" name="cover" checked={cover === c.id} onChange={() => setCover(c.id)} className="accent-accent" />
                      <span className="font-medium">{c.label}</span>
                    </span>
                    <span className="mt-1.5 block text-xs text-muted">{c.description}</span>
                    {size && catalog.print.basePrice[size]?.[c.id]?.[currency] !== undefined && (
                      <span className="mt-2 block text-xs text-ink">{fmt(catalog.print.basePrice[size][c.id][currency]! + (printPages - catalog.pages.min) * (catalog.print.extraPagePrice[size]?.[currency] ?? 0), currency)}</span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex items-center justify-between">
              <span className="label !mb-0">Quantity</span>
              <div className="flex items-center gap-2">
                <button type="button" className="btn btn-secondary btn-sm !p-2" onClick={() => setQty((n) => Math.max(1, n - 1))} aria-label="Fewer copies">
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center tabular-nums" aria-live="polite">{qty}</span>
                <button type="button" className="btn btn-secondary btn-sm !p-2" onClick={() => setQty((n) => Math.min(catalog.print.maxQuantity, n + 1))} aria-label="More copies">
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <fieldset>
              <legend className="label">Delivery</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {catalog.shipping.map((s) => (
                  <label key={s.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${shipping === s.id ? 'border-ink' : 'border-line-strong'}`}>
                    <span className="flex items-center gap-3">
                      <input type="radio" name="shipping" checked={shipping === s.id} onChange={() => setShipping(s.id)} className="accent-accent" />
                      <span>
                        {s.label}
                        <span className="block text-xs text-muted">{s.estimate}</span>
                      </span>
                    </span>
                    <span>{s.price[currency] !== undefined ? fmt(s.price[currency]!, currency) : '—'}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="grid gap-4 sm:grid-cols-2">
              <legend className="label mb-3">Shipping address</legend>
              {field('name', 'Full name', { required: true, auto: 'name' })}
              {field('line1', 'Address', { required: true, auto: 'address-line1' })}
              {field('line2', 'Apartment, suite, etc.', { auto: 'address-line2' })}
              {field('city', 'City', { required: true, auto: 'address-level2', half: true })}
              {field('region', 'State / county / region', { auto: 'address-level1', half: true })}
              {field('postalCode', 'Postal code', { required: true, auto: 'postal-code', half: true })}
              <div>
                <label className="label" htmlFor="a-country">Country</label>
                <select id="a-country" className="input" value={addr.country} onChange={(e) => setAddr((a) => ({ ...a, country: e.target.value }))} autoComplete="country">
                  {catalog.shippingCountries.map((c) => (
                    <option key={c} value={c}>{COUNTRY_NAMES[c] ?? c}</option>
                  ))}
                </select>
              </div>
              {field('phone', 'Phone (for delivery questions)', { auto: 'tel' })}
            </fieldset>
          </div>
        )}
          </>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[4px] border border-line bg-white p-6">
          <h2 className="font-serif text-2xl">Order summary</h2>
          {q ? (
            <dl className="mt-5 space-y-3 text-sm">
              {q.lines.map((l, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <dt>
                    {l.label}
                    {l.quantity > 1 && ` × ${l.quantity}`}
                    {l.detail && <span className="block text-xs text-muted">{l.detail}</span>}
                  </dt>
                  <dd className="tabular-nums">{fmt(l.amount, currency)}</dd>
                </div>
              ))}
              {q.shipping && (
                <div className="flex justify-between gap-4">
                  <dt>{q.shipping.label}</dt>
                  <dd className="tabular-nums">{fmt(q.shipping.amount, currency)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">{fmt(q.total, currency)}</dd>
              </div>
              <p className="text-xs text-muted">{provider?.id === 'creem' ? 'Includes any applicable taxes.' : 'Taxes may be added at payment where applicable.'}</p>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted">{items.length ? 'Pricing for this combination isn’t configured.' : 'Choose at least one format.'}</p>
          )}
          <div className="mt-6">
            <label className="label" htmlFor="co-email">Email for your receipt</label>
            <input id="co-email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <p className="mt-1.5 text-xs text-muted">No account needed — we’ll send order updates here.</p>
          </div>
          {error && <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
          <button type="button" onClick={submit} disabled={!q || busy || !provider} className="btn btn-primary btn-lg mt-6 w-full">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />} Continue to payment
          </button>
          {provider ? (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
              <Check size={12} /> Secure checkout with {provider.label}
            </p>
          ) : (
            <p className="mt-3 text-center text-xs leading-relaxed text-muted">Ordering opens very soon. Your album is saved here — come back any time.</p>
          )}
          {provider?.isTest && <p className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-center text-xs text-warning">Test mode — no real payment will be taken.</p>}
        </div>
      </aside>
    </div>
  );
}

function Option({ icon: Icon, title, text, price, currency, checked, onChange, extra }: { icon: typeof Download; title: string; text: string; price: number | undefined; currency: Currency; checked: boolean; onChange: (v: boolean) => void; extra?: React.ReactNode }) {
  return (
    <label className={`flex cursor-pointer gap-4 rounded-[4px] border bg-white p-5 transition ${checked ? 'border-ink shadow-card' : 'border-line hover:border-line-strong'}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-accent" />
      <Icon size={22} strokeWidth={1.4} className="mt-0.5 shrink-0 text-accent-dark" />
      <span className="flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-medium">{title}</span>
          {price !== undefined && <span className="text-sm">{fmt(price, currency)}</span>}
        </span>
        <span className="mt-1 block text-sm text-ink-soft">{text}</span>
        {extra}
      </span>
    </label>
  );
}
