import { duplicateProject } from '@/lib/server/repo/projects';
import { authed, HttpError, json } from '@/lib/server/http';

export const POST = authed<{ id: string }>(async (_req, { params, user }) => {
  const copy = await duplicateProject(user.id, params.id);
  if (!copy) throw new HttpError(404, 'Project not found.');
  return json({ id: copy.id }, 201);
});
