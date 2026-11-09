import { z } from 'zod';
import { countryFromHeaders } from '@/lib/commerce/region';
import { createAlbum, newAlbumSchema } from '@/lib/server/albums';
import { authed, HttpError, json, readJson } from '@/lib/server/http';
import { startAlbumCheckout } from '@/lib/server/orders';
import { findUnpaidStart, getProject } from '@/lib/server/repo/projects';

const schema = z.union([z.object({ projectId: z.string().uuid() }), newAlbumSchema]);

/**
 * "Use this design": sets up the album and opens checkout in one step.
 * Returns the payment page URL, or `unlocked` when the album is already paid for.
 */
export const POST = authed(async (req, { user }) => {
  const body = schema.parse(await readJson(req));
  let project;
  if ('projectId' in body) {
    project = await getProject(user.id, body.projectId);
    if (!project) throw new HttpError(404, 'Album not found.');
  } else {
    // Backing out of checkout and choosing the same design again reuses the unpaid album.
    project = (await findUnpaidStart(user.id, body.templateId ?? null)) ?? (await createAlbum(user.id, body));
  }
  const result = await startAlbumCheckout(user, project, { country: countryFromHeaders(req.headers) });
  return json({ projectId: project.id, ...result }, 201);
}, { create: true });
