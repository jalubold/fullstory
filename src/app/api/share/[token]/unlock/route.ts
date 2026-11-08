import { verifyPassword } from '@/lib/server/auth/session';
import { errorResponse, HttpError, json, readJson } from '@/lib/server/http';
import { getShareByToken } from '@/lib/server/repo/orders';
import { grantShareCookie } from '@/lib/server/shares';

const attempts = new Map<string, { n: number; at: number }>();

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const share = await getShareByToken(token);
    if (!share || !share.enabled || share.access !== 'password' || !share.password_hash) throw new HttpError(404, 'Album not found.');
    // Basic brute-force protection per share (per server instance).
    const a = attempts.get(share.id);
    if (a && a.n >= 8 && Date.now() - a.at < 10 * 60_000) throw new HttpError(429, 'Too many attempts. Please wait a few minutes.');
    const { password } = await readJson<{ password?: string }>(req);
    if (!password || !(await verifyPassword(password, share.password_hash))) {
      attempts.set(share.id, { n: (a && Date.now() - a.at < 10 * 60_000 ? a.n : 0) + 1, at: Date.now() });
      throw new HttpError(401, 'That password isn’t right.');
    }
    attempts.delete(share.id);
    await grantShareCookie(share);
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
