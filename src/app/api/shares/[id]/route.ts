import { z } from 'zod';
import { hashPassword } from '@/lib/server/auth/session';
import { authed, HttpError, json, readJson } from '@/lib/server/http';
import { updateShare } from '@/lib/server/repo/orders';
import { sqlOne } from '@/lib/server/db';
import type { ShareRow } from '@/lib/server/repo/orders';

const schema = z.object({
  access: z.enum(['link', 'password']).optional(),
  password: z.string().min(4).max(100).optional(),
  enabled: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  allowDownload: z.boolean().optional(),
  title: z.string().trim().min(1).max(120).optional(),
});

export const PATCH = authed<{ id: string }>(async (req, { params, user }) => {
  const share = await sqlOne<ShareRow>('select * from shares where id = $1 and user_id = $2', [params.id, user.id]);
  if (!share) throw new HttpError(404, 'Share not found.');
  const body = schema.parse(await readJson(req));
  if (body.access === 'password' && !body.password && !share.password_hash) throw new HttpError(400, 'Please choose a password.');
  await updateShare(share.id, {
    access: body.access,
    passwordHash: body.password ? await hashPassword(body.password) : body.access === 'link' ? null : undefined,
    enabled: body.enabled,
    expiresAt: body.expiresAt,
    allowDownload: body.allowDownload,
    title: body.title,
  });
  return json({ ok: true });
});
