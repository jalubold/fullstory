import { z } from 'zod';
import { createBlankDocument } from '@/lib/album/build';
import { getCatalog, getSize } from '@/lib/commerce/catalog';
import { createProject, listProjects } from '@/lib/server/repo/projects';
import { authed, HttpError, json, readJson } from '@/lib/server/http';
import { getTemplate } from '@/lib/templates';
import { materializeTemplate } from '@/lib/templates/materialize';

const createSchema = z.object({
  templateId: z.string().max(64).nullable().optional(),
  sizeId: z.string().max(64),
  title: z.string().trim().min(1).max(120),
  pageCount: z.number().int().optional(),
});

export const GET = authed(async (_req, { user }) => json({ projects: await listProjects(user.id) }));

export const POST = authed(async (req, { user }) => {
  const body = createSchema.parse(await readJson(req));
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
  const project = await createProject(user.id, body.title, doc);
  return json({ id: project.id }, 201);
});
