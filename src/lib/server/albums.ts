import 'server-only';
import { z } from 'zod';
import { createBlankDocument } from '@/lib/album/build';
import { getCatalog, getSize } from '@/lib/commerce/catalog';
import { getTemplate } from '@/lib/templates';
import { materializeTemplate } from '@/lib/templates/materialize';
import { HttpError } from './http';
import { createProject, type ProjectRow } from './repo/projects';

export const newAlbumSchema = z.object({
  templateId: z.string().max(64).nullable().optional(),
  sizeId: z.string().max(64),
  title: z.string().trim().min(1).max(120),
  pageCount: z.number().int().optional(),
  /** Random key from the browser so retries of the same start don't create duplicates. */
  clientKey: z.string().regex(/^[A-Za-z0-9-]{8,64}$/).optional(),
});
export type NewAlbum = z.infer<typeof newAlbumSchema>;

/** Creates an album from a design (or a blank one). */
export async function createAlbum(userId: string, body: NewAlbum): Promise<ProjectRow> {
  const size = getSize(body.sizeId);
  if (!size) throw new HttpError(400, 'Unknown book size.');
  const pageSize = { id: size.id, label: size.label, widthMm: size.widthMm, heightMm: size.heightMm };
  let doc;
  if (body.templateId) {
    const t = getTemplate(body.templateId);
    if (!t) throw new HttpError(404, 'Template not found.');
    if (t.orientation !== size.orientation) throw new HttpError(400, 'This size is not available for the selected template.');
    doc = materializeTemplate(t, pageSize, 'project');
  } else {
    const { pages } = getCatalog();
    const count = Math.min(pages.max, Math.max(pages.min, body.pageCount ?? pages.default));
    doc = createBlankDocument(pageSize, size.orientation, count + (count % 2));
    doc.cover.elements.forEach((el) => {
      if (el.type === 'text' && el.role === 'title') el.text = body.title;
    });
    doc.spineText = body.title;
  }
  return createProject(userId, body.title, doc, body.clientKey);
}
