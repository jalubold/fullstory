import { withDeterministicIds } from '@/lib/album/build';
import { usedPhotoIds } from '@/lib/album/geometry';
import type { AlbumDocument, PhotoMap } from '@/lib/album/types';
import { getTemplate, TEMPLATES } from './index';
import { materializeTemplate, templateStats } from './materialize';
import { samplePhotosFor } from './samples';
import type { TemplateDef } from './types';

export interface TemplateDemo {
  template: TemplateDef;
  doc: AlbumDocument;
  photos: PhotoMap;
  stats: ReturnType<typeof templateStats>;
}

const cache = new Map<string, TemplateDemo>();

/** Demo album (with sample photography) for a template. Deterministic and memoised. */
export function getTemplateDemo(idOrTemplate: string | TemplateDef): TemplateDemo | null {
  const t = typeof idOrTemplate === 'string' ? getTemplate(idOrTemplate) : idOrTemplate;
  if (!t) return null;
  let demo = cache.get(t.id);
  if (!demo) {
    const doc = withDeterministicIds(t.id, () => materializeTemplate(t));
    demo = { template: t, doc, photos: samplePhotosFor(usedPhotoIds(doc)), stats: templateStats(t) };
    cache.set(t.id, demo);
  }
  return demo;
}

export function allTemplateDemos(): TemplateDemo[] {
  return TEMPLATES.map((t) => getTemplateDemo(t)!);
}
