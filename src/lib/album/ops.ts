import { buildPage, clonePage, PLACEHOLDER_TEXT, roleStyle, uid } from './build';
import type { OrnamentId } from './ornaments';
import type { AlbumDocument, AlbumElement, Page, PageRef, PhotoAsset, PhotoElement, TextElement, TextRole } from './types';

/** Pure helpers that mutate an (immer) draft of an AlbumDocument. */

export function pageAt(doc: AlbumDocument, ref: PageRef): Page | undefined {
  if (ref.kind === 'cover') return doc.cover;
  if (ref.kind === 'back') return doc.backCover;
  return doc.pages[ref.index];
}

export function sameRef(a: PageRef, b: PageRef) {
  return a.kind === b.kind && (a.kind !== 'page' || (b.kind === 'page' && a.index === b.index));
}

export function findElement(doc: AlbumDocument, ref: PageRef, id: string | null): AlbumElement | undefined {
  if (!id) return undefined;
  return pageAt(doc, ref)?.elements.find((e) => e.id === id);
}

export function addPages(doc: AlbumDocument, afterIndex: number, count: number, layouts = ['single-margin', 'two-side']) {
  const newPages = Array.from({ length: count }, (_, i) => buildPage(layouts[i % layouts.length], doc.theme, doc.size));
  doc.pages.splice(afterIndex + 1, 0, ...newPages);
  return afterIndex + 1;
}

export function duplicatePage(doc: AlbumDocument, index: number) {
  doc.pages.splice(index + 1, 0, clonePage(doc.pages[index]));
  return index + 1;
}

export function deletePage(doc: AlbumDocument, index: number) {
  if (doc.pages.length <= 1) return false;
  doc.pages.splice(index, 1);
  return true;
}

export function movePage(doc: AlbumDocument, from: number, to: number) {
  const [p] = doc.pages.splice(from, 1);
  doc.pages.splice(to, 0, p);
}

export function addText(doc: AlbumDocument, page: Page, role: TextRole): TextElement {
  const style = roleStyle(doc.theme, role, doc.size);
  const h = role === 'body' ? 0.22 : role === 'title' ? 0.14 : 0.09;
  const el: TextElement = {
    id: uid('t'),
    type: 'text',
    x: 0.2,
    y: 0.5 - h / 2,
    w: 0.6,
    h,
    rotation: 0,
    ...style,
    text: PLACEHOLDER_TEXT[role],
    align: 'center',
    valign: 'middle',
    role,
  };
  page.elements.push(el);
  return el;
}

export function addPhotoFrame(doc: AlbumDocument, page: Page, photo?: PhotoAsset, at?: { x: number; y: number }): PhotoElement {
  const pageAspect = doc.size.widthMm / doc.size.heightMm;
  const imgAspect = photo ? photo.width / photo.height : 4 / 3;
  const w = 0.42;
  const h = Math.min(0.7, (w * pageAspect) / imgAspect);
  const el: PhotoElement = {
    id: uid('p'),
    type: 'photo',
    x: Math.min(1 - w, Math.max(0, (at?.x ?? 0.5) - w / 2)),
    y: Math.min(1 - h, Math.max(0, (at?.y ?? 0.5) - h / 2)),
    w,
    h,
    rotation: 0,
    photoId: photo?.id ?? null,
    crop: { zoom: 1, fx: 0.5, fy: 0.5 },
    shape: 'rect',
    radius: 0,
    borderWidth: 0,
    borderColor: '#FFFFFF',
    filter: 'none',
  };
  page.elements.push(el);
  return el;
}

export function addShape(doc: AlbumDocument, page: Page, shape: 'rect' | 'ellipse' | 'line') {
  const color = doc.theme.colors.accent;
  page.elements.push({
    id: uid('s'),
    type: 'shape',
    shape,
    x: shape === 'line' ? 0.25 : 0.35,
    y: shape === 'line' ? 0.495 : 0.35,
    w: shape === 'line' ? 0.5 : 0.3,
    h: shape === 'line' ? 0.01 : 0.3 * (doc.size.widthMm / doc.size.heightMm),
    rotation: 0,
    fill: shape === 'line' ? null : color,
    stroke: shape === 'line' ? color : null,
    strokeWidth: 1,
    radius: 0,
    opacity: shape === 'line' ? 1 : 0.9,
  });
  return page.elements[page.elements.length - 1];
}

export function addOrnament(doc: AlbumDocument, page: Page, ornament: OrnamentId) {
  const s = 0.12;
  const aspect = doc.size.widthMm / doc.size.heightMm;
  page.elements.push({
    id: uid('o'),
    type: 'ornament',
    ornament,
    x: 0.5 - s / 2,
    y: 0.5 - (s * aspect) / 2,
    w: s,
    h: s * aspect,
    rotation: 0,
    color: doc.theme.colors.accent,
    opacity: 1,
  });
  return page.elements[page.elements.length - 1];
}

export function duplicateElement(page: Page, id: string): AlbumElement | null {
  const idx = page.elements.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const copy = { ...structuredClone(page.elements[idx]), id: uid(page.elements[idx].type[0]), fromLayout: false };
  copy.x = Math.min(1 - copy.w, copy.x + 0.03);
  copy.y = Math.min(1 - copy.h, copy.y + 0.03);
  page.elements.splice(idx + 1, 0, copy);
  return copy;
}

export function removeElement(page: Page, id: string) {
  page.elements = page.elements.filter((e) => e.id !== id);
}

export function reorderElement(page: Page, id: string, dir: 'forward' | 'backward' | 'front' | 'back') {
  const idx = page.elements.findIndex((e) => e.id === id);
  if (idx < 0) return;
  const [el] = page.elements.splice(idx, 1);
  const to = dir === 'front' ? page.elements.length : dir === 'back' ? 0 : dir === 'forward' ? Math.min(page.elements.length, idx + 1) : Math.max(0, idx - 1);
  page.elements.splice(to, 0, el);
}

export function allPages(doc: AlbumDocument): Array<{ ref: PageRef; page: Page }> {
  return [
    { ref: { kind: 'cover' }, page: doc.cover },
    ...doc.pages.map((page, index) => ({ ref: { kind: 'page', index } as PageRef, page })),
    { ref: { kind: 'back' }, page: doc.backCover },
  ];
}

/** Removes references to a deleted photo from every frame. */
export function clearPhoto(doc: AlbumDocument, photoId: string) {
  for (const { page } of allPages(doc)) {
    for (const el of page.elements) if (el.type === 'photo' && el.photoId === photoId) el.photoId = null;
  }
}

/**
 * Fills empty photo frames with unused photos, in page order, choosing among
 * the next few candidates the photo whose orientation best matches each frame.
 */
export function autofill(doc: AlbumDocument, photos: PhotoAsset[]): number {
  const used = new Set<string>();
  for (const { page } of allPages(doc)) for (const el of page.elements) if (el.type === 'photo' && el.photoId) used.add(el.photoId);
  const queue = photos.filter((p) => !used.has(p.id));
  let filled = 0;
  for (const { page } of allPages(doc)) {
    for (const el of page.elements) {
      if (el.type !== 'photo' || el.photoId || !queue.length) continue;
      const fa = (el.w * doc.size.widthMm) / (el.h * doc.size.heightMm);
      let best = 0;
      let score = Infinity;
      queue.slice(0, 5).forEach((p, i) => {
        const s = Math.abs(Math.log(p.width / p.height) - Math.log(fa)) + i * 0.1;
        if (s < score) {
          score = s;
          best = i;
        }
      });
      const [p] = queue.splice(best, 1);
      el.photoId = p.id;
      el.crop = { zoom: 1, fx: 0.5, fy: 0.5 };
      filled++;
    }
  }
  return filled;
}
