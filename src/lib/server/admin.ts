import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { adminPassword, isProduction } from './env';
import { HttpError } from './http';
import { sign, verify } from './auth/session';

const COOKIE = 'fs_admin';

export async function isAdmin(): Promise<boolean> {
  if (!adminPassword) return false;
  await connection();
  const token = verify<{ admin: boolean; exp: number }>((await cookies()).get(COOKIE)?.value);
  return !!token?.admin;
}

export async function adminLogin(password: string): Promise<boolean> {
  if (!adminPassword) return false;
  const a = crypto.createHash('sha256').update(password).digest();
  const b = crypto.createHash('sha256').update(adminPassword).digest();
  if (!crypto.timingSafeEqual(a, b)) return false;
  (await cookies()).set(COOKIE, sign({ admin: true, exp: Date.now() + 7 * 864e5 }), { httpOnly: true, sameSite: 'lax', secure: isProduction, path: '/', maxAge: 7 * 86400 });
  return true;
}

export async function adminLogout() {
  (await cookies()).delete(COOKIE);
}

export async function requireAdminPage(): Promise<void> {
  if (!(await isAdmin())) redirect('/admin/login');
}

export async function requireAdminApi(): Promise<void> {
  if (!(await isAdmin())) throw new HttpError(403, 'Admins only.');
}
