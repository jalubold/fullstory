import 'server-only';
import { notFound } from 'next/navigation';
import { getUser, type SessionUser } from './auth';
import { HttpError } from './http';

export async function requireAdminPage(): Promise<SessionUser> {
  const user = await getUser();
  if (!user?.isAdmin) notFound();
  return user;
}

export async function requireAdminApi(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) throw new HttpError(401, 'Please log in.');
  if (!user.isAdmin) throw new HttpError(403, 'Admins only.');
  return user;
}
