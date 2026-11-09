import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { requireUser } from './auth';
import { listProjectPhotos, photoAsset } from './repo/photos';
import { getProject } from './repo/projects';

/**
 * Loads a project owned by this browser's guest id (404 otherwise). Albums are
 * paid for up front, so an album that isn't unlocked yet goes to its unlock page.
 */
export async function loadOwnedProject(id: string, next: string) {
  const user = await requireUser(next);
  const project = await getProject(user.id, id);
  if (!project) notFound();
  if (!project.unlocked_at) redirect(`/projects/${id}/unlock`);
  const photos = (await listProjectPhotos(project.id)).map((p) => photoAsset(p));
  return { user, project, photos };
}
