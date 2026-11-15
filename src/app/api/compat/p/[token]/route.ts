import { compatRoute, requireParticipant } from '@/lib/compat/server/http';
import { deleteAssessment } from '@/lib/compat/server/repo';
import { forgetToken } from '@/lib/compat/server/view';
import { json } from '@/lib/server/http';

/** Status for the waiting screen (polled). Reveals progress only — never answers. */
export const GET = compatRoute<{ token: string }>(async (_req, { token }) => {
  const { view } = await requireParticipant(token);
  return json({ stage: view.stage, partnerJoined: view.partnerJoined, partnerSubmitted: view.partnerSubmitted, partnerName: view.partnerName, unlocked: view.unlocked });
});

/** Permanently deletes this assessment — both participants’ answers and the report. */
export const DELETE = compatRoute<{ token: string }>(async (_req, { token }) => {
  const { ctx } = await requireParticipant(token);
  await deleteAssessment(ctx.assessment.id);
  await forgetToken(token);
  return json({ deleted: true });
});
