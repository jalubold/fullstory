import { NextResponse, type NextRequest } from 'next/server';
import { isLocale, LOCALE_COOKIE, localeFromRequest } from '@/lib/compat/i18n';

/**
 * fullstory.pro is Are We Compatible?. Its landing page lives at the root (/),
 * and the rest of the app under /compatible/….
 *
 * Every page exists once per language: the visitor's choice (cookie), else
 * their country (Indonesia → Bahasa Indonesia), else their browser language
 * picks the version, and the address they see doesn't change. A link like
 * /compatible/id/… sets the language and redirects to the plain address.
 *
 * The photo album's marketing pages are retired (see next.config redirects);
 * existing customers' albums, orders and share links keep working.
 */
export function proxy(req: NextRequest) {
  const url = req.nextUrl;

  // The landing page: shown at the root.
  if (url.pathname === '/') {
    const target = url.clone();
    target.pathname = `/compatible/${localeFromRequest(req)}`;
    return NextResponse.rewrite(target);
  }

  const rest = url.pathname.slice('/compatible'.length);
  const first = rest.split('/')[1];

  // A language link: remember the choice, then go to the plain address.
  if (isLocale(first)) {
    const target = url.clone();
    const path = rest.slice(first.length + 1);
    target.pathname = path ? `/compatible${path}` : '/';
    const res = NextResponse.redirect(target);
    res.cookies.set(LOCALE_COOKIE, first, { path: '/', maxAge: 365 * 86400, sameSite: 'lax' });
    return res;
  }

  // The old address of the landing page.
  if (!rest || rest === '/') {
    const target = url.clone();
    target.pathname = '/';
    return NextResponse.redirect(target);
  }

  const target = url.clone();
  target.pathname = `/compatible/${localeFromRequest(req)}${rest}`;
  return NextResponse.rewrite(target);
}

export const config = {
  matcher: ['/', '/compatible', '/compatible/:path*'],
};
