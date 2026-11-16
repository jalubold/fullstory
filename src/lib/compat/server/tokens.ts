import 'server-only';
import crypto from 'node:crypto';
import { appSecret } from '@/lib/server/auth/session';

/**
 * Capability tokens. Each participant holds a private link containing a
 * random 192-bit token; the database stores only its SHA-256 hash, so a
 * database leak doesn't expose working links.
 *
 * The invite link is derived from the assessment id with an HMAC, so the
 * person who started can always see it again without it being stored.
 */

export const newToken = () => crypto.randomBytes(24).toString('base64url');

export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export const isTokenShaped = (t: unknown): t is string => typeof t === 'string' && /^[A-Za-z0-9_-]{32}$/.test(t);

/** Short key for "this browser has seen these results" (see ../reveal.ts). Not reversible to the link. */
export const revealKeyFor = (token: string) => hashToken(token).slice(0, 10);

export function inviteTokenFor(assessmentId: string): string {
  return crypto.createHmac('sha256', appSecret()).update(`compat-invite:${assessmentId}`).digest('base64url').slice(0, 32);
}
