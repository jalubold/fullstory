import { buildPage, pageUnit, toneColor, uid } from '@/lib/album/build';
import { getLayout } from '@/lib/album/layouts';
import type { AlbumDocument, OrnamentElement, Page, PageSize, PhotoElement } from '@/lib/album/types';
import { getCatalog, sizesFor } from '@/lib/commerce/catalog';
import { SAMPLE_PHOTOS, sampleId, type SamplePhoto } from './samples';
import type { TemplateDef, TemplatePage } from './types';

export function defaultSizeFor(t: Pick<TemplateDef, 'orientation'>): PageSize {
  const size = sizesFor(t.orientation)[0] ?? getCatalog().sizes[0];
  return { id: size.id, label: size.label, widthMm: size.widthMm, heightMm: size.heightMm };
}

function poolFor(t: TemplateDef): SamplePhoto[] {
  const seen = new Set<string>();
  const out: SamplePhoto[] = [];
  const push = (p: SamplePhoto) => {
    if (!seen.has(p.key)) {
      seen.add(p.key);
      out.push(p);
    }
  };
  for (const set of t.pool.sets ?? []) SAMPLE_PHOTOS.filter((p) => p.set === set).forEach(push);
  for (const cat of t.pool.categories ?? []) SAMPLE_PHOTOS.filter((p) => p.category === cat).forEach(push);
  return out;
}

/**
 * Assigns sample photos to frames: walks the pool in story order but, among
 * the next few unused photos, picks the one whose aspect ratio best fits the
 * frame — so crops stay natural.
 */
class PhotoPicker {
  private used = new Set<string>();
  constructor(
    private pool: SamplePhoto[],
    reserved: Iterable<string> = [],
  ) {
    for (const k of reserved) this.used.add(k);
  }
  pick(frameAspect: number): string | null {
    if (!this.pool.length) return null;
    let candidates = this.pool.filter((p) => !this.used.has(p.key));
    if (!candidates.length) {
      this.used.clear();
      candidates = this.pool;
    }
    const window = candidates.slice(0, 6);
    let best = window[0];
    let bestScore = Infinity;
    for (const [i, p] of window.entries()) {
      const score = Math.abs(Math.log(p.width / p.height) - Math.log(frameAspect)) + i * 0.08;
      if (score < bestScore) {
        best = p;
        bestScore = score;
      }
    }
    this.used.add(best.key);
    return sampleId(best.key);
  }
}

function materializePage(spec: TemplatePage, t: TemplateDef, size: PageSize, picker: PhotoPicker | null): Page {
  const page = buildPage(spec.layout, t.theme, size, { texts: spec.texts }, spec.bg);
  let i = 0;
  for (const el of page.elements) {
    if (el.type !== 'photo') continue;
    const explicit = spec.photos?.[i];
    i++;
    if (spec.filter) el.filter = spec.filter;
    if (!picker) continue;
    const frameAspect = (el.w * size.widthMm) / (el.h * size.heightMm);
    (el as PhotoElement).photoId = explicit ? sampleId(explicit) : picker.pick(frameAspect);
  }
  if (spec.invert) {
    for (const el of page.elements) {
      if (el.type !== 'text') continue;
      el.color = el.color === t.theme.colors.muted || el.color === t.theme.colors.accent ? t.theme.colors.accent : t.theme.colors.inverse;
    }
  }
  for (const ex of spec.extras ?? []) {
    const orn: OrnamentElement = {
      id: uid('o'),
      type: 'ornament',
      ornament: ex.ornament,
      x: ex.x,
      y: ex.y,
      w: ex.w,
      h: ex.h,
      rotation: ex.rotation ?? 0,
      color: ex.tone?.startsWith('#') ? ex.tone : toneColor(t.theme, (ex.tone as never) ?? 'accent', t.theme.colors.accent),
      opacity: ex.opacity ?? 1,
    };
    page.elements.push(orn);
  }
  return page;
}

/**
 * Turns a reusable template definition into a concrete album document.
 * - "demo": frames are filled with sample photography for previews.
 * - "project": frames are left empty for the customer's own photos.
 * The template definition itself is never mutated.
 */
export function materializeTemplate(t: TemplateDef, size: PageSize = defaultSizeFor(t), mode: 'demo' | 'project' = 'demo'): AlbumDocument {
  const reserved = [t.cover, ...t.pages, t.back].flatMap((p) => (p.photos ?? []).filter(Boolean));
  const picker = mode === 'demo' ? new PhotoPicker(poolFor(t), reserved) : null;
  return {
    schemaVersion: 1,
    templateId: t.id,
    orientation: t.orientation,
    size,
    theme: t.theme,
    cover: materializePage(t.cover, t, size, picker),
    pages: t.pages.map((p) => materializePage(p, t, size, picker)),
    backCover: materializePage(t.back, t, size, picker),
    spineText: t.spineText,
  };
}

export function templateStats(t: TemplateDef) {
  const size = defaultSizeFor(t);
  const count = (p: TemplatePage) => getLayout(p.layout).build({ W: size.widthMm, H: size.heightMm }).filter((s) => s.kind === 'photo').length;
  const photoSlots = [t.cover, ...t.pages, t.back].reduce((n, p) => n + count(p), 0);
  return { pageCount: t.pages.length, photoSlots, recommendedPhotos: Math.ceil(photoSlots * 1.3) };
}

export { pageUnit };
