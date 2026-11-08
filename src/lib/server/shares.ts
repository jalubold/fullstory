import 'server-only';
import { cookies } from 'next/headers';
import { isProduction } from './env';
import { getOrder, type OrderRow, type ShareRow } from './repo/orders';
import { sign, verify } from './auth/session';

export type ShareAccess = { state: 'ok'; order: OrderRow } | { state: 'locked' } | { state: 'unavailable'; reason: string };

const cookieName = (share: ShareRow) => `fs_share_${share.id.slice(0, 8)}`;

export async function shareAccess(share: ShareRow | null): Promise<ShareAccess> {
  if (!share) return { state: 'unavailable', reason: 'This album link doesn’t exist.' };
  if (!share.enabled) return { state: 'unavailable', reason: 'The owner has turned off this album link.' };
  if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) return { state: 'unavailable', reason: 'This album link has expired.' };
  const order = await getOrder(share.order_id);
  if (!order || order.status !== 'paid') return { state: 'unavailable', reason: 'This album isn’t available right now.' };
  if (share.access === 'password') {
    const store = await cookies();
    const token = verify<{ sid: string; v: string; exp: number }>(store.get(cookieName(share))?.value);
    // Changing the password invalidates earlier unlocks (v = hash fingerprint).
    if (!token || token.sid !== share.id || token.v !== (share.password_hash ?? '').slice(-12)) return { state: 'locked' };
  }
  return { state: 'ok', order };
}

export async function grantShareCookie(share: ShareRow) {
  const store = await cookies();
  store.set(cookieName(share), sign({ sid: share.id, v: (share.password_hash ?? '').slice(-12), exp: Date.now() + 30 * 864e5 }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 30 * 86400,
  });
}
