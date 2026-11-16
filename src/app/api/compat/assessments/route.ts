import { z } from 'zod';
import { isContext } from '@/lib/compat/contexts';
import { apiErrors, compatRoute } from '@/lib/compat/server/http';
import { cleanName, createAssessment } from '@/lib/compat/server/repo';
import { rememberToken } from '@/lib/compat/server/view';
import { HttpError, json, readJson } from '@/lib/server/http';

const schema = z.object({ context: z.string().refine(isContext), name: z.string().max(200) });

/** Starts an assessment for the first participant. No account: the response is their private link. */
export const POST = compatRoute(async (req, _params, locale) => {
  const body = schema.parse(await readJson(req, 4096));
  const name = cleanName(body.name);
  if (!name) throw new HttpError(400, apiErrors(locale).name);
  const { token } = await createAssessment({ context: body.context as never, name });
  await rememberToken(token);
  return json({ token, url: `/compatible/s/${token}` }, 201);
});
