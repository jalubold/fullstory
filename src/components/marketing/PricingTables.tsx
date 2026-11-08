'use client';

import { useState } from 'react';
import { BookOpen, Download, Link2, Truck } from 'lucide-react';
import type { Catalog, Currency } from '@/lib/commerce/catalog';

function fmt(amount: number | undefined, currency: Currency) {
  if (amount === undefined) return '—';
  const loc = currency === 'GBP' ? 'en-GB' : currency === 'EUR' ? 'en-IE' : 'en-US';
  return new Intl.NumberFormat(loc, { style: 'currency', currency, minimumFractionDigits: amount % 100 === 0 ? 0 : 2 }).format(amount / 100);
}

export function PricingTables({ catalog }: { catalog: Catalog }) {
  const [cur, setCur] = useState<Currency>(catalog.defaultCurrency);
  const orientations = ['square', 'landscape', 'portrait'] as const;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">Prices include all design tools and premium layouts in free templates. Taxes are calculated at checkout where applicable.</p>
        <div className="flex rounded-[3px] border border-line-strong bg-white p-0.5" role="group" aria-label="Currency">
          {catalog.currencies.map((c) => (
            <button key={c} type="button" onClick={() => setCur(c)} aria-pressed={cur === c} className={`rounded-[3px] px-3.5 py-1.5 text-xs font-medium ${cur === c ? 'bg-ink text-paper' : 'text-ink-soft'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {[
          { icon: Download, item: catalog.digital.pdf },
          { icon: Link2, item: catalog.digital.share },
        ].map(({ icon: Icon, item }) => (
          <div key={item.label} className="card flex gap-5 p-7">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[4px] bg-accent-soft text-accent-dark">
              <Icon size={22} strokeWidth={1.5} />
            </span>
            <div className="flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-serif text-2xl">{item.label}</h3>
                <p className="text-xl font-medium">{fmt(item.price[cur], cur)}</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <div className="flex items-center gap-3">
          <BookOpen size={22} strokeWidth={1.5} className="text-accent-dark" />
          <h3 className="font-serif text-3xl">Printed photobooks</h3>
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          Prices include {catalog.pages.min} pages. Add pages in steps of {catalog.pages.step}, up to {catalog.pages.max} pages.
        </p>
        <div className="mt-6 overflow-x-auto rounded-[4px] border border-line bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-4 font-medium">Size</th>
                {catalog.covers.map((c) => (
                  <th key={c.id} className="px-5 py-4 font-medium">{c.label}</th>
                ))}
                <th className="px-5 py-4 font-medium">Each extra page</th>
              </tr>
            </thead>
            <tbody>
              {orientations.flatMap((o) =>
                catalog.sizes
                  .filter((s) => s.orientation === o)
                  .map((s) => (
                    <tr key={s.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-4">
                        <p className="font-medium text-ink">{s.label}</p>
                        <p className="text-xs text-muted">
                          {s.metricLabel} · {o[0].toUpperCase() + o.slice(1)}
                        </p>
                      </td>
                      {catalog.covers.map((c) => (
                        <td key={c.id} className="px-5 py-4 tabular-nums">{fmt(catalog.print.basePrice[s.id]?.[c.id]?.[cur], cur)}</td>
                      ))}
                      <td className="px-5 py-4 tabular-nums text-ink-soft">+{fmt(catalog.print.extraPagePrice[s.id]?.[cur], cur)}</td>
                    </tr>
                  )),
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {catalog.covers.map((c) => (
            <div key={c.id} className="rounded-[4px] border border-line bg-white/60 p-5">
              <p className="font-medium">{c.label}</p>
              <p className="mt-1 text-sm text-ink-soft">{c.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-[1fr_1fr]">
        <div className="card p-7">
          <div className="flex items-center gap-3">
            <Truck size={20} strokeWidth={1.5} className="text-accent-dark" />
            <h3 className="font-serif text-2xl">Shipping</h3>
          </div>
          <ul className="mt-4 divide-y divide-line text-sm">
            {catalog.shipping.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <span>
                  <span className="font-medium">{s.label}</span> <span className="text-muted">· {s.estimate}</span>
                </span>
                <span className="tabular-nums">{fmt(s.price[cur], cur)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">We currently ship to {catalog.shippingCountries.length} countries across North America, Europe and Oceania.</p>
        </div>
        <div className="card p-7">
          <h3 className="font-serif text-2xl">Premium designs</h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Most templates are free. Designs marked Premium add a one-time {fmt(catalog.premiumTemplate.price[cur], cur)} to your order, whichever format you choose.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">Designing, saving and previewing your album is always free — you only pay when you order.</p>
        </div>
      </div>
    </div>
  );
}
