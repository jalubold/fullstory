import { createAlbum, newAlbumSchema } from '@/lib/server/albums';
import { listProjects } from '@/lib/server/repo/projects';
import { authed, json, readJson } from '@/lib/server/http';

export const GET = authed(async (_req, { user }) => json({ projects: await listProjects(user.id) }));

export const POST = authed(async (req, { user }) => {
  const project = await createAlbum(user.id, newAlbumSchema.parse(await readJson(req)));
  return json({ id: project.id }, 201);
}, { create: true });
