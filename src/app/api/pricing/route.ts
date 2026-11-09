import { connection } from 'next/server';
import { formatMoney, getCatalog, priceIn } from '@/lib/commerce/catalog';
import { countryFromHeaders } from '@/lib/commerce/region';
import { checkoutCurrency } from '@/lib/server/orders';

/** The album price in the visitor's currency (from their country), for price tags on static pages. */
export async function GET(req: Request) {
  await connection();
  const currency = checkoutCurrency(countryFromHeaders(req.headers));
  const amount = priceIn(getCatalog().album.price, currency);
  return Response.json({ currency, amount, formatted: amount === null ? null : formatMoney(amount, currency) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
