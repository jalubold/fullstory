import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ensureUser, getUser, type SessionUser } from './auth';
import { SetupError } from './db';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export const json = (data: unknown, init?: number | ResponseInit) =>
  NextResponse.json(data, typeof init === 'number' ? { status: init } : init);

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) return json({ error: e.message, ...e.data }, e.status);
  if (e instanceof SetupError) return json({ error: e.message, setup: true }, 503);
  if (e instanceof ZodError) return json({ error: 'Invalid request', issues: e.issues.slice(0, 5) }, 400);
  console.error('[api]', e);
  return json({ error: 'Something went wrong. Please try again.' }, 500);
}

type Handler<P> = (req: Request, ctx: { params: P; user: SessionUser }) => Promise<Response>;

/**
 * Wraps a route handler with the visitor's guest identity and maps errors to
 * JSON. With `create`, a guest id is issued if this browser has none yet.
 */
export function authed<P = Record<string, string>>(handler: Handler<P>, opts: { create?: boolean } = {}) {
  return async (req: Request, ctx: { params: Promise<P> }) => {
    try {
      const user = opts.create ? await ensureUser() : await getUser();
      if (!user) return json({ error: 'We couldn’t find your albums in this browser. Open your recovery link to restore them.' }, 401);
      return await handler(req, { params: await ctx.params, user });
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export async function readJson<T = unknown>(req: Request, maxBytes = 4 * 1024 * 1024): Promise<T> {
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, 'Request is too large.');
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, 'Invalid JSON body.');
  }
}
