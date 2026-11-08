import type { AlbumDocument, Background, Crop, PageSize } from './types';

export const MM_PER_IN = 25.4;
export const PT_PER_IN = 72;
export const mmToPt = (mm: number) => (mm / MM_PER_IN) * PT_PER_IN;
export const ptToMm = (pt: number) => (pt / PT_PER_IN) * MM_PER_IN;

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function pageSizePt(size: Pick<PageSize, 'widthMm' | 'heightMm'>) {
  return { w: mmToPt(size.widthMm), h: mmToPt(size.heightMm) };
}

/** Converts a pt value into a CSS length relative to the page container width. */
export function ptToCqw(pt: number, pageWidthPt: number): string {
  return `${(pt / pageWidthPt) * 100}cqw`;
}

export interface CropResult {
  /** Rendered image size relative to the frame (1 = frame size). */
  relW: number;
  relH: number;
  /** Offset of the image's top-left corner relative to the frame (fractions of frame size, <= 0). */
  relX: number;
  relY: number;
  /** Visible source rectangle in image pixels. */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * Cover-fit crop maths, shared by every renderer. `frameW`/`frameH` may be in
 * any unit as long as they share it; only their ratio matters.
 */
export function computeCrop(imgW: number, imgH: number, frameW: number, frameH: number, crop: Crop): CropResult {
  const zoom = Math.max(1, crop.zoom || 1);
  const fx = clamp(crop.fx ?? 0.5, 0, 1);
  const fy = clamp(crop.fy ?? 0.5, 0, 1);
  const s0 = Math.max(frameW / imgW, frameH / imgH);
  const s = s0 * zoom;
  const dispW = imgW * s;
  const dispH = imgH * s;
  const ox = dispW - frameW;
  const oy = dispH - frameH;
  return {
    relW: dispW / frameW,
    relH: dispH / frameH,
    relX: (-ox * fx) / frameW,
    relY: (-oy * fy) / frameH,
    sx: (ox * fx) / s,
    sy: (oy * fy) / s,
    sw: frameW / s,
    sh: frameH / s,
  };
}

/**
 * Converts a drag delta (in frame-relative units) to a new focal point.
 * dx/dy are the pointer movement as a fraction of the frame size.
 */
export function panCrop(imgW: number, imgH: number, frameW: number, frameH: number, crop: Crop, dx: number, dy: number): Crop {
  const c = computeCrop(imgW, imgH, frameW, frameH, crop);
  const overflowX = c.relW - 1;
  const overflowY = c.relH - 1;
  const fx = overflowX > 1e-6 ? clamp(crop.fx - dx / overflowX, 0, 1) : 0.5;
  const fy = overflowY > 1e-6 ? clamp(crop.fy - dy / overflowY, 0, 1) : 0.5;
  return { ...crop, fx, fy };
}

/** Effective print resolution of a photo inside a frame. */
export function effectiveDpi(imgW: number, imgH: number, frameWPt: number, frameHPt: number, crop: Crop): number {
  const c = computeCrop(imgW, imgH, frameWPt, frameHPt, crop);
  const inchesW = frameWPt / PT_PER_IN;
  return inchesW > 0 ? c.sw / inchesW : 0;
}

export type SpreadSlot = number | null;
export type ViewItem =
  | { kind: 'cover' }
  | { kind: 'back' }
  | { kind: 'spread'; left: SpreadSlot; right: SpreadSlot }
  | { kind: 'page'; index: number };

/**
 * Book spreads: page 1 sits alone on the right (opposite the inside cover),
 * then 2–3, 4–5 … and the last even page sits alone on the left.
 */
export function buildSpreads(pageCount: number): Array<{ left: SpreadSlot; right: SpreadSlot }> {
  const spreads: Array<{ left: SpreadSlot; right: SpreadSlot }> = [];
  if (pageCount <= 0) return spreads;
  spreads.push({ left: null, right: 0 });
  for (let i = 1; i < pageCount; i += 2) {
    spreads.push({ left: i, right: i + 1 < pageCount ? i + 1 : null });
  }
  return spreads;
}

export function buildViewItems(pageCount: number, mode: 'spread' | 'single'): ViewItem[] {
  const items: ViewItem[] = [{ kind: 'cover' }];
  if (mode === 'single') {
    for (let i = 0; i < pageCount; i++) items.push({ kind: 'page', index: i });
  } else {
    for (const s of buildSpreads(pageCount)) items.push({ kind: 'spread', ...s });
  }
  items.push({ kind: 'back' });
  return items;
}

/** Index of the spread that contains interior page `index`. */
export function spreadIndexOfPage(index: number): number {
  return index === 0 ? 0 : Math.floor((index + 1) / 2);
}

export function countPhotoFrames(doc: AlbumDocument) {
  let frames = 0;
  let filled = 0;
  for (const page of [doc.cover, ...doc.pages, doc.backCover]) {
    for (const el of page.elements) {
      if (el.type === 'photo') {
        frames++;
        if (el.photoId) filled++;
      }
    }
  }
  return { frames, filled, empty: frames - filled };
}

export function usedPhotoIds(doc: AlbumDocument): Set<string> {
  const ids = new Set<string>();
  for (const page of [doc.cover, ...doc.pages, doc.backCover]) {
    for (const el of page.elements) if (el.type === 'photo' && el.photoId) ids.add(el.photoId);
  }
  return ids;
}

/* ---------------------------- background patterns --------------------------- */

export type Primitive =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; width: number }
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; width: number };

/**
 * Pattern geometry in pt, origin at the trim top-left. `bounds` lets the PDF
 * renderer extend repeating patterns into the bleed area.
 */
export function backgroundPrimitives(
  bg: Background,
  pageW: number,
  pageH: number,
  bounds = { x0: 0, y0: 0, x1: pageW, y1: pageH },
): { prims: Primitive[]; opacity: number } {
  const prims: Primitive[] = [];
  const unit = Math.min(pageW, pageH) / 576; // 1 at 8in
  switch (bg.pattern) {
    case 'dots': {
      const step = 14 * unit;
      for (let y = step / 2; y < bounds.y1; y += step) {
        if (y < bounds.y0) continue;
        for (let x = step / 2; x < bounds.x1; x += step) {
          if (x < bounds.x0) continue;
          prims.push({ kind: 'circle', cx: x, cy: y, r: 0.9 * unit });
        }
      }
      return { prims, opacity: 0.45 };
    }
    case 'grid': {
      const step = 18 * unit;
      for (let x = 0; x <= bounds.x1; x += step) if (x >= bounds.x0) prims.push({ kind: 'line', x1: x, y1: bounds.y0, x2: x, y2: bounds.y1, width: 0.4 * unit });
      for (let y = 0; y <= bounds.y1; y += step) if (y >= bounds.y0) prims.push({ kind: 'line', x1: bounds.x0, y1: y, x2: bounds.x1, y2: y, width: 0.4 * unit });
      return { prims, opacity: 0.35 };
    }
    case 'lines': {
      const step = 22 * unit;
      for (let y = step; y < bounds.y1; y += step) if (y >= bounds.y0) prims.push({ kind: 'line', x1: bounds.x0, y1: y, x2: bounds.x1, y2: y, width: 0.5 * unit });
      return { prims, opacity: 0.35 };
    }
    case 'frame': {
      const inset = 20 * unit;
      prims.push({ kind: 'rect', x: inset, y: inset, w: pageW - inset * 2, h: pageH - inset * 2, width: 0.8 * unit });
      return { prims, opacity: 0.9 };
    }
    case 'double-frame': {
      const a = 16 * unit;
      const b = 21 * unit;
      prims.push({ kind: 'rect', x: a, y: a, w: pageW - a * 2, h: pageH - a * 2, width: 1.1 * unit });
      prims.push({ kind: 'rect', x: b, y: b, w: pageW - b * 2, h: pageH - b * 2, width: 0.5 * unit });
      return { prims, opacity: 0.9 };
    }
    case 'corners': {
      const i = 18 * unit;
      const l = 28 * unit;
      const w = 0.9 * unit;
      const corners: Array<[number, number, number, number]> = [
        [i, i, 1, 1],
        [pageW - i, i, -1, 1],
        [i, pageH - i, 1, -1],
        [pageW - i, pageH - i, -1, -1],
      ];
      for (const [x, y, dx, dy] of corners) {
        prims.push({ kind: 'line', x1: x, y1: y, x2: x + l * dx, y2: y, width: w });
        prims.push({ kind: 'line', x1: x, y1: y, x2: x, y2: y + l * dy, width: w });
      }
      return { prims, opacity: 0.9 };
    }
    default:
      return { prims, opacity: 1 };
  }
}

/* --------------------------------- colours --------------------------------- */

export function hexToRgb01(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function isDark(hex: string): boolean {
  const [r, g, b] = hexToRgb01(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5;
}
