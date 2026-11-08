import crypto from 'node:crypto';
import { z } from 'zod';
import { ALLOWED_TYPES, createPhoto, listProjectPhotos, MAX_ORIGINAL_BYTES, photoAsset, variantKey } from '@/lib/server/repo/photos';
import { getProject } from '@/lib/server/repo/projects';
import { authed, HttpError, json, readJson } from '@/lib/server/http';
import { storage } from '@/lib/server/storage';

type P = { id: string };

export const GET = authed<P>(async (_req, { params, user }) => {
  const project = await getProject(user.id, params.id);
  if (!project) throw new HttpError(404, 'Project not found.');
  return json({ photos: (await listProjectPhotos(project.id)).map((p) => photoAsset(p)) });
});

const createSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string(),
  size: z.number().int().positive(),
  width: z.number().int().positive().max(30000),
  height: z.number().int().positive().max(30000),
});

/** Registers an upload and returns where the browser should send the three variants. */
export const POST = authed<P>(async (req, { params, user }) => {
  const body = createSchema.parse(await readJson(req));
  const project = await getProject(user.id, params.id);
  if (!project) throw new HttpError(404, 'Project not found.');
  if (!ALLOWED_TYPES[body.contentType]) throw new HttpError(415, 'Please upload JPEG, PNG or WebP images.');
  if (body.size > MAX_ORIGINAL_BYTES) throw new HttpError(413, 'Each photo must be smaller than 40 MB.');
  const photo = await createPhoto({
    id: crypto.randomUUID(),
    userId: user.id,
    projectId: project.id,
    filename: body.filename,
    contentType: body.contentType,
    sizeBytes: body.size,
    width: body.width,
    height: body.height,
  });
  const store = storage();
  const targets = Object.fromEntries(
    await Promise.all(
      (['original', 'display', 'thumb'] as const).map(async (v) => [v, await store.uploadTarget(variantKey(photo, v), `/api/uploads/${photo.id}/${v}`)] as const),
    ),
  );
  return json({ photoId: photo.id, targets }, 201);
});
