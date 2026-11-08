import crypto from 'node:crypto';
import { z } from 'zod';
import { authed, HttpError, json, readJson } from '@/lib/server/http';
import { fetchAudio, MUSIC_TYPES, MusicError } from '@/lib/server/music';
import { getProject } from '@/lib/server/repo/projects';
import { storage } from '@/lib/server/storage';

const schema = z.object({ url: z.string().trim().min(1).max(2000) });

/** Copies a song from a link (Drive, Dropbox, any audio URL) into our storage and returns where it plays from. */
export const POST = authed<{ id: string }>(async (req, { params, user }) => {
  const { url } = schema.parse(await readJson(req));
  const project = await getProject(user.id, params.id);
  if (!project) throw new HttpError(404, 'Album not found.');
  let audio: { data: Buffer; type: string };
  try {
    audio = await fetchAudio(url);
  } catch (e) {
    if (e instanceof MusicError) throw new HttpError(422, e.message);
    throw e;
  }
  const file = `${crypto.randomUUID()}.${MUSIC_TYPES[audio.type]}`;
  await storage().put(`music/${project.id}/${file}`, audio.data, audio.type);
  return json({ url: `/api/music/${project.id}/${file}`, bytes: audio.data.length });
});
