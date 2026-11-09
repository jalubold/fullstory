'use client';

import { useEffect, useState } from 'react';
import { formatMoney, getCatalog } from '@/lib/commerce/catalog';

const KEY = 'fs:album-price';
const FALLBACK = (() => {
  const c = getCatalog();
  const amount = c.album.price[c.defaultCurrency];
  return amount === undefined ? '' : formatMoney(amount, c.defaultCurrency);
})();

let pending: Promise<string> | null = null;
function load(): Promise<string> {
  pending ??= fetch('/api/pricing')
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { formatted?: string } | null) => {
      const v = d?.formatted || FALLBACK;
      try {
        sessionStorage.setItem(KEY, v);
      } catch {}
      return v;
    })
    .catch(() => FALLBACK);
  return pending;
}

/** The album price in the visitor's currency (e.g. "$19" or "€19"). */
export function useAlbumPrice(): string {
  const [price, setPrice] = useState(FALLBACK);
  useEffect(() => {
    let cached: string | null = null;
    try {
      cached = sessionStorage.getItem(KEY);
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cached) setPrice(cached);
    else load().then(setPrice);
  }, []);
  return price;
}

export function AlbumPrice() {
  return <>{useAlbumPrice()}</>;
}
