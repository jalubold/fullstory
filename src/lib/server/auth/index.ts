import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { cache } from 'react';
import { dbMode, isProduction } from '../env';
import { sql, sqlOne } from '../db';
import { sign, verify } from './session';

/**
 * Guest identity — FULLSTORY has no accounts or passwords.
 *
 * The first time a visitor creates an album, the server issues an anonymous id
 * in a signed, http-only cookie. Albums, photos and orders belong to that id.
 * A private recovery link (signed id) lets the visitor reopen their albums in
 * another browser or after clearing cookies.
 */

export interface SessionUser {
  id: string;
  name: string | null;
  email: string | null;
  /** False for the placeholder returned when this browser has no albums yet. */
  exists: boolean;
}

const COOKIE = 'fs_guest';
const MAX_AGE = 400 * 86400; // browsers cap cookie lifetime at 400 days
const NOBODY: SessionUser = { id: '00000000-0000-0000-0000-000000000000', name: null, email: null, exists: false };

async function readGuestId(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  const data = verify<{ gid: string; exp?: number }>(token);
  return data?.gid && /^[0-9a-f-]{36}$/i.test(data.gid) ? data.gid : null;
}

async function profile(id: string) {
  return sqlOne<{ full_name: string | null; email: string | null }>('select full_name, email from profiles where user_id = $1', [id]);
}

/** The visitor for this request, or null if this browser has never created an album. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  if (dbMode === 'none') return null;
  await connection();
  const id = await readGuestId();
  if (!id) return null;
  const p = await profile(id);
  return { id, name: p?.full_name ?? null, email: p?.email ?? null, exists: true };
});

/**
 * For pages: the visitor, or an empty placeholder (owns nothing) so lists
 * simply render their empty states.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function requireUser(_next?: string): Promise<SessionUser> {
  return (await getUser()) ?? NOBODY;
}

async function setGuestCookie(id: string) {
  (await cookies()).set(COOKIE, sign({ gid: id }), { httpOnly: true, sameSite: 'lax', secure: isProduction, path: '/', maxAge: MAX_AGE });
}

/** For route handlers and server actions: returns the visitor, creating a guest id if needed. */
export async function ensureUser(): Promise<SessionUser> {
  const existing = await getUser();
  if (existing) {
    // Refresh the cookie so active visitors never lose access.
    await setGuestCookie(existing.id);
    return existing;
  }
  const id = crypto.randomUUID();
  await sql('insert into profiles (user_id) values ($1) on conflict (user_id) do nothing', [id]);
  await setGuestCookie(id);
  return { id, name: null, email: null, exists: true };
}

/** A private link that restores this browser's albums elsewhere. Anyone with it can open the albums. */
export function recoveryToken(user: SessionUser): string {
  return sign({ gid: user.id, p: 'restore' });
}

export async function restoreFromToken(token: string): Promise<boolean> {
  const data = verify<{ gid: string; p: string; exp?: number }>(token);
  if (!data || data.p !== 'restore' || !/^[0-9a-f-]{36}$/i.test(data.gid)) return false;
  const exists = await sqlOne('select 1 from profiles where user_id = $1', [data.gid]);
  if (!exists) return false;
  await setGuestCookie(data.gid);
  return true;
}

export async function forgetBrowser() {
  (await cookies()).delete(COOKIE);
}

export async function updateProfile(user: SessionUser, patch: { name?: string | null; email?: string | null; currency?: string | null }) {
  await sql(
    `insert into profiles (user_id, full_name, email, currency) values ($1, $2, $3, $4)
     on conflict (user_id) do update set full_name = coalesce($2, profiles.full_name), email = coalesce($3, profiles.email),
       currency = coalesce($4, profiles.currency), updated_at = now()`,
    [user.id, patch.name ?? null, patch.email ?? null, patch.currency ?? null],
  );
}
