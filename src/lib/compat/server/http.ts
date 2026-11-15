import 'server-only';
import { errorResponse, HttpError, json } from '@/lib/server/http';
import { AnswerError } from './repo';
import { loadView } from './view';

/** Route wrapper: awaits params, maps known errors to JSON, and keeps private responses out of caches. */
export function compatRoute<P>(handler: (req: Request, params: P) => Promise<Response>) {
  return async (req: Request, ctx: { params: Promise<P> }) => {
    let res: Response;
    try {
      res = await handler(req, await ctx.params);
    } catch (e) {
      res = e instanceof AnswerError ? json({ error: e.message }, 400) : errorResponse(e);
    }
    res.headers.set('Cache-Control', 'private, no-store');
    res.headers.set('Referrer-Policy', 'no-referrer');
    return res;
  };
}

export async function requireParticipant(token: string) {
  const found = await loadView(token);
  if (!found) throw new HttpError(404, 'This private link isn’t valid any more. It may have been deleted.');
  return found;
}
