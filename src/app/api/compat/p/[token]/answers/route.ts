import { z } from 'zod';
import { compatRoute, requireParticipant } from '@/lib/compat/server/http';
import { saveProgress, submitAnswers } from '@/lib/compat/server/repo';
import { json, readJson } from '@/lib/server/http';

const schema = z.object({ answers: z.record(z.string(), z.string().max(40)), submit: z.boolean().optional() });

/** Saves progress, or submits the final answers (which then lock). Only ever touches the caller's own answers. */
export const PUT = compatRoute<{ token: string }>(async (req, { token }) => {
  const body = schema.parse(await readJson(req, 16 * 1024));
  const { ctx } = await requireParticipant(token);
  if (body.submit) {
    const { bothDone } = await submitAnswers(ctx, body.answers);
    return json({ submitted: true, stage: bothDone ? 'results' : 'waiting' });
  }
  const answers = await saveProgress(ctx, body.answers);
  return json({ saved: Object.keys(answers).length });
});
