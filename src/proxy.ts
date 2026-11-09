import { NextResponse, type NextRequest } from 'next/server';
import { getCatalog } from '@/lib/commerce/catalog';
import { countryFromHeaders, currencyForCountry } from '@/lib/commerce/region';

/** The pages that exist once per currency: /templates/[id]/start and /create/blank/[orientation]. */
const SALES_PAGE = /^\/(?:templates\/[^/]+\/start|create\/blank\/[^/]+)$/;

/**
 * Sales pages are prerendered per currency so they open instantly, with no
 * request-time rendering. The visitor's country (set by Vercel at the edge)
 * picks which version they get; the address they see doesn't change.
 */
export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  if (!SALES_PAGE.test(url.pathname)) return NextResponse.next();
  const currency = currencyForCountry(countryFromHeaders(req.headers), getCatalog().currencies);
  const target = url.clone();
  target.pathname = `${url.pathname}/${currency.toLowerCase()}`;
  return NextResponse.rewrite(target);
}

export const config = {
  matcher: ['/templates/:id/start', '/create/blank/:orientation'],
};
