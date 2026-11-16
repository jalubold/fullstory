import 'server-only';
import { errorResponse, HttpError, json } from '@/lib/server/http';
import { localeFromRequest, type Locale } from '../i18n';
import { UI } from '../ui-strings';
import { AnswerError } from './repo';
import { loadView } from './view';

/** Route wrapper: awaits params, maps known errors to JSON, and keeps private responses out of caches. */
export function compatRoute<P>(handler: (req: Request, params: P, locale: Locale) => Promise<Response>) {
  return async (req: Request, ctx: { params: Promise<P> }) => {
    const locale = localeFromRequest(req);
    let res: Response;
    try {
      res = await handler(req, await ctx.params, locale);
    } catch (e) {
      res = e instanceof AnswerError ? json({ error: UI[locale].errors.incomplete }, 400) : errorResponse(e);
    }
    res.headers.set('Cache-Control', 'private, no-store');
    res.headers.set('Referrer-Policy', 'no-referrer');
    return res;
  };
}

export async function requireParticipant(token: string, locale: Locale = 'en') {
  const found = await loadView(token, locale);
  if (!found) throw new HttpError(404, UI[locale].errors.invalidLink);
  return found;
}

/** User-facing API error messages in the request's language. */
export const apiErrors = (locale: Locale) => UI[locale].errors;
