import { z } from 'zod';
import { compatRoute } from '@/lib/compat/server/http';
import { claimInvite, cleanName, findByInvite, findByToken } from '@/lib/compat/server/repo';
import { rememberedTokens, rememberToken } from '@/lib/compat/server/view';
import { HttpError, json, readJson } from '@/lib/server/http';

const schema = z.object({ name: z.string().max(200) });

/** Accepts an invitation: the second participant gets their own private link. */
export const POST = compatRoute<{ invite: string }>(async (req, { invite }) => {
  const body = schema.parse(await readJson(req, 4096));
  const name = cleanName(body.name);
  if (!name) throw new HttpError(400, 'Please enter your name.');
  const found = await findByInvite(invite);
  if (!found) throw new HttpError(404, 'This invitation isn’t valid any more.');
  // The person who sent the invite must not accidentally take the second seat.
  for (const t of await rememberedTokens()) {
    const mine = await findByToken(t);
    if (mine?.assessment.id === found.assessment.id) throw new HttpError(409, 'This is your own invitation link — send it to the other person.', { url: `/compatible/s/${t}` });
  }
  if (found.joined) throw new HttpError(409, 'Someone has already accepted this invitation.');
  const token = await claimInvite(found.assessment.id, name);
  if (!token) throw new HttpError(409, 'Someone has already accepted this invitation.');
  await rememberToken(token);
  return json({ token, url: `/compatible/s/${token}` }, 201);
});
