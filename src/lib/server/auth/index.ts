import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { adminEmails, appUrl, authMode, isProduction, supabaseAnonKey, supabaseUrl } from '../env';
import { sql, sqlOne } from '../db';
import { hashPassword, sign, verify, verifyPassword } from './session';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
}

export type AuthResult = { ok: true; needsConfirmation?: boolean } | { ok: false; error: string };

const LOCAL_COOKIE = 'fs_session';
const SESSION_DAYS = 30;

export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const c of list) store.set(c.name, c.value, c.options);
        } catch {
          // Called from a Server Component: the proxy refreshes the session cookie instead.
        }
      },
    },
  });
}

async function ensureProfile(id: string, email: string, name?: string | null) {
  await sql(
    `insert into profiles (user_id, email, full_name) values ($1, $2, $3)
     on conflict (user_id) do update set email = excluded.email, full_name = coalesce(profiles.full_name, excluded.full_name), updated_at = now()`,
    [id, email.toLowerCase(), name ?? null],
  );
}

async function profileName(id: string): Promise<string | null> {
  const row = await sqlOne<{ full_name: string | null }>('select full_name from profiles where user_id = $1', [id]);
  return row?.full_name ?? null;
}

const toUser = (id: string, email: string, name: string | null): SessionUser => ({
  id,
  email,
  name,
  isAdmin: adminEmails.includes(email.toLowerCase()),
});

/** The signed-in user for this request, or null. Deduplicated per request. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  if (authMode === 'none') return null;
  // Session validation compares expiry times, so it must run at request time.
  await connection();
  if (authMode === 'supabase') {
    const sb = await supabaseServer();
    const { data } = await sb.auth.getUser();
    const u = data.user;
    if (!u?.email) return null;
    const metaName = (u.user_metadata?.full_name as string | undefined) ?? null;
    await ensureProfile(u.id, u.email, metaName);
    return toUser(u.id, u.email, (await profileName(u.id)) ?? metaName);
  }
  const store = await cookies();
  const session = verify<{ uid: string; exp: number }>(store.get(LOCAL_COOKIE)?.value);
  if (!session) return null;
  const row = await sqlOne<{ id: string; email: string; full_name: string | null }>(
    'select u.id, u.email, p.full_name from local_users u left join profiles p on p.user_id = u.id where u.id = $1',
    [session.uid],
  );
  return row ? toUser(row.id, row.email, row.full_name) : null;
});

/** For pages: redirects to the login page when signed out. */
export async function requireUser(next = '/dashboard'): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

async function setLocalSession(uid: string) {
  const store = await cookies();
  store.set(LOCAL_COOKIE, sign({ uid, exp: Date.now() + SESSION_DAYS * 864e5 }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  });
}

const friendly = (msg: string) => {
  if (/invalid login/i.test(msg)) return 'That email and password combination doesn’t match our records.';
  if (/already registered|already exists/i.test(msg)) return 'An account with this email already exists. Try logging in instead.';
  if (/password/i.test(msg) && /characters|short|weak/i.test(msg)) return 'Please choose a stronger password (at least 8 characters).';
  return msg;
};

export async function signIn(email: string, password: string): Promise<AuthResult> {
  email = email.trim().toLowerCase();
  if (authMode === 'none') return { ok: false, error: 'Accounts are not available yet on this site.' };
  if (authMode === 'supabase') {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: friendly(error.message) };
    if (data.user?.email) await ensureProfile(data.user.id, data.user.email, data.user.user_metadata?.full_name);
    return { ok: true };
  }
  const row = await sqlOne<{ id: string; password_hash: string }>('select id, password_hash from local_users where email = $1', [email]);
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return { ok: false, error: 'That email and password combination doesn’t match our records.' };
  }
  await setLocalSession(row.id);
  return { ok: true };
}

export async function signUp(name: string, email: string, password: string): Promise<AuthResult> {
  email = email.trim().toLowerCase();
  if (password.length < 8) return { ok: false, error: 'Please choose a password with at least 8 characters.' };
  if (authMode === 'none') return { ok: false, error: 'Accounts are not available yet on this site.' };
  if (authMode === 'supabase') {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, emailRedirectTo: `${appUrl()}/auth/callback?next=/dashboard` },
    });
    if (error) return { ok: false, error: friendly(error.message) };
    if (data.user?.email) await ensureProfile(data.user.id, data.user.email, name);
    return { ok: true, needsConfirmation: !data.session };
  }
  const exists = await sqlOne('select 1 from local_users where email = $1', [email]);
  if (exists) return { ok: false, error: 'An account with this email already exists. Try logging in instead.' };
  const id = crypto.randomUUID();
  await sql('insert into local_users (id, email, password_hash) values ($1, $2, $3)', [id, email, await hashPassword(password)]);
  await ensureProfile(id, email, name);
  await setLocalSession(id);
  return { ok: true };
}

export async function signOut() {
  if (authMode === 'supabase') {
    const sb = await supabaseServer();
    await sb.auth.signOut();
  }
  (await cookies()).delete(LOCAL_COOKIE);
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  if (authMode !== 'supabase') {
    return { ok: false, error: 'Password reset by email requires the Supabase auth provider. Ask the site owner to reset your password.' };
  }
  const sb = await supabaseServer();
  const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${appUrl()}/auth/callback?next=/dashboard/settings?reset=1`,
  });
  if (error) return { ok: false, error: friendly(error.message) };
  return { ok: true };
}

export async function changePassword(user: SessionUser, current: string, next: string): Promise<AuthResult> {
  if (next.length < 8) return { ok: false, error: 'Please choose a password with at least 8 characters.' };
  if (authMode === 'supabase') {
    const sb = await supabaseServer();
    const { error } = await sb.auth.updateUser({ password: next });
    return error ? { ok: false, error: friendly(error.message) } : { ok: true };
  }
  const row = await sqlOne<{ password_hash: string }>('select password_hash from local_users where id = $1', [user.id]);
  if (!row || !(await verifyPassword(current, row.password_hash))) return { ok: false, error: 'Your current password is incorrect.' };
  await sql('update local_users set password_hash = $2 where id = $1', [user.id, await hashPassword(next)]);
  return { ok: true };
}
