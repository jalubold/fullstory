import { NextResponse, type NextRequest } from 'next/server';
import { getCatalog } from '@/lib/commerce/catalog';
import { countryFromHeaders, currencyForCountry } from '@/lib/commerce/region';
import { isLocale, LOCALE_COOKIE, localeFromRequest } from '@/lib/compat/i18n';

/** The pages that exist once per currency: /templates/[id]/start and /create/blank/[orientation]. */
const SALES_PAGE = /^\/(?:templates\/[^/]+\/start|create\/blank\/[^/]+)$/;

/**
 * Sales pages are prerendered per currency so they open instantly, with no
 * request-time rendering. The visitor's country (set by Vercel at the edge)
 * picks which version they get; the address they see doesn't change.
 *
 * Are We Compatible? (/compatible/…) exists once per language the same way:
 * the visitor's choice (cookie), else their country (Indonesia → Bahasa
 * Indonesia), else their browser language picks the version. A link like
 * /compatible/id/… sets the language and redirects to the plain address.
 */
export function proxy(req: NextRequest) {
  const url = req.nextUrl;

  if (url.pathname === '/compatible' || url.pathname.startsWith('/compatible/')) {
    const rest = url.pathname.slice('/compatible'.length);
    const first = rest.split('/')[1];
    if (isLocale(first)) {
      const target = url.clone();
      target.pathname = `/compatible${rest.slice(first.length + 1)}`;
      const res = NextResponse.redirect(target);
      res.cookies.set(LOCALE_COOKIE, first, { path: '/', maxAge: 365 * 86400, sameSite: 'lax' });
      return res;
    }
    const target = url.clone();
    target.pathname = `/compatible/${localeFromRequest(req)}${rest}`;
    return NextResponse.rewrite(target);
  }

  if (!SALES_PAGE.test(url.pathname)) return NextResponse.next();
  const currency = currencyForCountry(countryFromHeaders(req.headers), getCatalog().currencies);
  const target = url.clone();
  target.pathname = `${url.pathname}/${currency.toLowerCase()}`;
  return NextResponse.rewrite(target);
}

export const config = {
  matcher: ['/templates/:id/start', '/create/blank/:orientation', '/compatible', '/compatible/:path*'],
};
