import { z } from 'zod';
import { documentSchema } from '@/lib/album/schema';
import type { AlbumDocument } from '@/lib/album/types';
import { listProjectPhotos, photoAsset } from '@/lib/server/repo/photos';
import { deleteProject, getProject, saveProject, updateProjectMeta } from '@/lib/server/repo/projects';
import { authed, HttpError, json, readJson } from '@/lib/server/http';

type P = { id: string };

export const GET = authed<P>(async (_req, { params, user }) => {
  const project = await getProject(user.id, params.id);
  if (!project) throw new HttpError(404, 'Project not found.');
  const photos = await listProjectPhotos(project.id);
  return json({
    id: project.id,
    title: project.title,
    status: project.status,
    version: Number(project.version),
    document: project.document,
    updatedAt: project.updated_at,
    photos: photos.map((p) => photoAsset(p)),
  });
});

const saveSchema = z.object({ document: documentSchema, title: z.string().trim().min(1).max(120).optional(), version: z.number().int() });

export async function handleSave(req: Request, userId: string, id: string) {
  const body = saveSchema.parse(await readJson(req));
  const result = await saveProject(userId, id, body.document as AlbumDocument, body.title, body.version);
  if (!result) throw new HttpError(404, 'Project not found.');
  if (!result.ok) return json({ error: 'This album was changed in another window.', conflict: true, version: result.version }, 409);
  return json(result);
}

export const PUT = authed<P>(async (req, { params, user }) => handleSave(req, user.id, params.id));

const patchSchema = z.object({ title: z.string().trim().min(1).max(120).optional(), status: z.enum(['draft', 'completed', 'archived']).optional() });

export const PATCH = authed<P>(async (req, { params, user }) => {
  const body = patchSchema.parse(await readJson(req));
  const project = await getProject(user.id, params.id);
  if (!project) throw new HttpError(404, 'Project not found.');
  await updateProjectMeta(user.id, params.id, body);
  return json({ ok: true });
});

export const DELETE = authed<P>(async (_req, { params, user }) => {
  const project = await getProject(user.id, params.id);
  if (!project) throw new HttpError(404, 'Project not found.');
  await deleteProject(user.id, params.id);
  return json({ ok: true });
});
