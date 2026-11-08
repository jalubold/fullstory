import 'server-only';
import { notFound } from 'next/navigation';
import { requireUser } from './auth';
import { listProjectPhotos, photoAsset } from './repo/photos';
import { getProject } from './repo/projects';

/** Loads a project owned by this browser's guest id (404 otherwise). */
export async function loadOwnedProject(id: string, next: string) {
  const user = await requireUser(next);
  const project = await getProject(user.id, id);
  if (!project) notFound();
  const photos = (await listProjectPhotos(project.id)).map((p) => photoAsset(p));
  return { user, project, photos };
}
