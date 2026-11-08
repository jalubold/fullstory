import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  appendBezierCurve,
  clip,
  closePath,
  concatTransformationMatrix,
  endPath,
  LineCapStyle,
  lineTo,
  moveTo,
  PDFDocument,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  setCharacterSpacing,
  type PDFOperator,
} from 'pdf-lib';
import sharp from 'sharp';
import { fontkitAdapter } from './fontkit';
import { resolveFace, type FontId } from '@/lib/album/fonts';
import { backgroundPrimitives, computeCrop, hexToRgb01, mmToPt, pageSizePt } from '@/lib/album/geometry';
import { fitOrnament, ORNAMENTS } from '@/lib/album/ornaments';
import type { AlbumDocument, AlbumElement, Background, OrnamentElement, Page, PhotoElement, ShapeElement, TextElement } from '@/lib/album/types';

/**
 * Album → PDF renderer.
 *
 * Draws directly from the album document model (never from screenshots):
 * vector text using the same font files and line-breaking rules as the
 * browser renderer, photos cropped from the ORIGINAL uploads with the same
 * crop maths, and vector shapes/ornaments/patterns.
 */

export interface LoadedPhoto {
  data: Buffer;
  width: number;
  height: number;
}

export interface RenderOptions {
  title: string;
  /** Target image resolution in pixels per inch. */
  dpi: number;
  photo: (photoId: string) => Promise<LoadedPhoto | null>;
}

const FONT_DIR = path.join(process.cwd(), 'src/assets/fonts');
const KAPPA = 0.5522847498;

type Ext = { l: number; r: number; t: number; b: number };
const NO_EXT: Ext = { l: 0, r: 0, t: 0, b: 0 };

interface Ctx {
  pdf: PDFDocument;
  page: PDFPage;
  /** PDF coordinates of the trim box's bottom-left corner. */
  ox: number;
  oy: number;
  W: number;
  H: number;
  ext: Ext;
  opts: RenderOptions;
  fonts: Map<string, Promise<PDFFont>>;
  images: Map<string, Promise<PDFImage | null>>;
}

const color = (hex: string) => {
  const [r, g, b] = hexToRgb01(hex);
  return rgb(r, g, b);
};

/** Converts a top-left based trim-box point to PDF coordinates. */
const X = (c: Ctx, x: number) => c.ox + x;
const Y = (c: Ctx, y: number) => c.oy + c.H - y;

/* ---------------------------------- fonts --------------------------------- */

async function font(c: Ctx, id: FontId, weight: number, italic: boolean): Promise<PDFFont> {
  const face = resolveFace(id, weight, italic);
  let f = c.fonts.get(face.file);
  if (!f) {
    f = fs.readFile(path.join(FONT_DIR, `${face.file}.ttf`)).then((bytes) =>
      // Kerning and ligatures are disabled in BOTH renderers so line breaks match exactly.
      c.pdf.embedFont(bytes, { subset: true, features: { kern: false, liga: false, calt: false, clig: false, dlig: false } }),
    );
    c.fonts.set(face.file, f);
  }
  return f;
}

/* ---------------------------------- paths --------------------------------- */

function rectPath(x: number, y: number, w: number, h: number, r: number): PDFOperator[] {
  // x,y = PDF bottom-left
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (!r) return [moveTo(x, y), lineTo(x + w, y), lineTo(x + w, y + h), lineTo(x, y + h), closePath()];
  const k = r * (1 - KAPPA);
  return [
    moveTo(x + r, y),
    lineTo(x + w - r, y),
    appendBezierCurve(x + w - k, y, x + w, y + k, x + w, y + r),
    lineTo(x + w, y + h - r),
    appendBezierCurve(x + w, y + h - k, x + w - k, y + h, x + w - r, y + h),
    lineTo(x + r, y + h),
    appendBezierCurve(x + k, y + h, x, y + h - k, x, y + h - r),
    lineTo(x, y + r),
    appendBezierCurve(x, y + k, x + k, y, x + r, y),
    closePath(),
  ];
}

function ellipsePath(x: number, y: number, w: number, h: number): PDFOperator[] {
  const rx = w / 2;
  const ry = h / 2;
  const cx = x + rx;
  const cy = y + ry;
  const ox = rx * KAPPA;
  const oy = ry * KAPPA;
  return [
    moveTo(cx - rx, cy),
    appendBezierCurve(cx - rx, cy + oy, cx - ox, cy + ry, cx, cy + ry),
    appendBezierCurve(cx + ox, cy + ry, cx + rx, cy + oy, cx + rx, cy),
    appendBezierCurve(cx + rx, cy - oy, cx + ox, cy - ry, cx, cy - ry),
    appendBezierCurve(cx - ox, cy - ry, cx - rx, cy - oy, cx - rx, cy),
    closePath(),
  ];
}

/** SVG path (y down, origin top-left of box) for rectangles/ellipses, for drawSvgPath. */
function svgRect(w: number, h: number, r: number) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (!r) return `M0 0 H${w} V${h} H0 Z`;
  return `M${r} 0 H${w - r} A${r} ${r} 0 0 1 ${w} ${r} V${h - r} A${r} ${r} 0 0 1 ${w - r} ${h} H${r} A${r} ${r} 0 0 1 0 ${h - r} V${r} A${r} ${r} 0 0 1 ${r} 0 Z`;
}
function svgEllipse(w: number, h: number) {
  const rx = w / 2;
  const ry = h / 2;
  return `M0 ${ry} A${rx} ${ry} 0 1 0 ${w} ${ry} A${rx} ${ry} 0 1 0 0 ${ry} Z`;
}

/** Applies the element's rotation (CSS: clockwise around its centre) for the duration of fn. */
async function rotated(c: Ctx, el: AlbumElement, fn: () => Promise<void> | void) {
  if (!el.rotation) return fn();
  const cx = X(c, (el.x + el.w / 2) * c.W);
  const cy = Y(c, (el.y + el.h / 2) * c.H);
  const a = (-el.rotation * Math.PI) / 180;
  c.page.pushOperators(
    pushGraphicsState(),
    concatTransformationMatrix(1, 0, 0, 1, cx, cy),
    concatTransformationMatrix(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0),
    concatTransformationMatrix(1, 0, 0, 1, -cx, -cy),
  );
  await fn();
  c.page.pushOperators(popGraphicsState());
}

/** Bleed extension for unrotated elements that touch the trim edge. */
function edgeExt(c: Ctx, el: AlbumElement): Ext {
  if (el.rotation) return NO_EXT;
  const e = 0.002;
  return {
    l: el.x <= e ? c.ext.l : 0,
    r: el.x + el.w >= 1 - e ? c.ext.r : 0,
    t: el.y <= e ? c.ext.t : 0,
    b: el.y + el.h >= 1 - e ? c.ext.b : 0,
  };
}

/* -------------------------------- background ------------------------------- */

function drawBackground(c: Ctx, bg: Background) {
  const { page, ext } = c;
  page.drawRectangle({ x: c.ox - ext.l, y: c.oy - ext.b, width: c.W + ext.l + ext.r, height: c.H + ext.t + ext.b, color: color(bg.color) });
  if (bg.pattern === 'none') return;
  const { prims, opacity } = backgroundPrimitives(bg, c.W, c.H, { x0: -ext.l, y0: -ext.t, x1: c.W + ext.r, y1: c.H + ext.b });
  const col = color(bg.patternColor);
  for (const p of prims) {
    if (p.kind === 'line') page.drawLine({ start: { x: X(c, p.x1), y: Y(c, p.y1) }, end: { x: X(c, p.x2), y: Y(c, p.y2) }, thickness: p.width, color: col, opacity });
    else if (p.kind === 'circle') page.drawCircle({ x: X(c, p.cx), y: Y(c, p.cy), size: p.r, color: col, opacity });
    else page.drawRectangle({ x: X(c, p.x), y: Y(c, p.y + p.h), width: p.w, height: p.h, borderColor: col, borderWidth: p.width, borderOpacity: opacity });
  }
}

/* ---------------------------------- photos --------------------------------- */

const SEPIA: [[number, number, number], [number, number, number], [number, number, number]] = [
  [0.393, 0.769, 0.189],
  [0.349, 0.686, 0.168],
  [0.272, 0.534, 0.131],
];
const GRAY: typeof SEPIA = [
  [0.2126, 0.7152, 0.0722],
  [0.2126, 0.7152, 0.0722],
  [0.2126, 0.7152, 0.0722],
];

async function drawPhoto(c: Ctx, el: PhotoElement) {
  const ext = el.borderWidth > 0 || el.shape !== 'rect' ? NO_EXT : edgeExt(c, el);
  const fw = el.w * c.W + ext.l + ext.r;
  const fh = el.h * c.H + ext.t + ext.b;
  const left = X(c, el.x * c.W) - ext.l;
  const bottom = Y(c, (el.y + el.h) * c.H) - ext.b;
  const bw = Math.max(0, Math.min(el.borderWidth, fw / 2 - 1, fh / 2 - 1));
  const ellipse = el.shape === 'ellipse';

  if (bw > 0) {
    const d = ellipse ? svgEllipse(fw, fh) : svgRect(fw, fh, el.radius);
    c.page.drawSvgPath(d, { x: left, y: bottom + fh, color: color(el.borderColor) });
  }
  if (!el.photoId) return;
  const iw = fw - bw * 2;
  const ih = fh - bw * 2;
  const key = `${el.photoId}|${el.crop.zoom}|${el.crop.fx}|${el.crop.fy}|${iw.toFixed(2)}|${ih.toFixed(2)}|${el.filter}`;
  let imgP = c.images.get(key);
  if (!imgP) {
    imgP = (async () => {
      const src = await c.opts.photo(el.photoId!);
      if (!src) return null;
      const cr = computeCrop(src.width, src.height, iw, ih, el.crop);
      const left = Math.max(0, Math.floor(cr.sx));
      const top = Math.max(0, Math.floor(cr.sy));
      const width = Math.max(1, Math.min(src.width - left, Math.round(cr.sw)));
      const height = Math.max(1, Math.min(src.height - top, Math.round(cr.sh)));
      const targetW = Math.max(1, Math.min(width, Math.round((iw / 72) * c.opts.dpi)));
      const targetH = Math.max(1, Math.round((targetW * height) / width));
      let pipe = sharp(src.data, { failOn: 'none' }).rotate().extract({ left, top, width, height }).resize(targetW, targetH, { fit: 'fill' });
      if (el.filter === 'bw') pipe = pipe.recomb(GRAY);
      else if (el.filter === 'sepia') pipe = pipe.recomb(SEPIA);
      const jpg = await pipe.flatten({ background: '#ffffff' }).jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true }).toBuffer();
      return c.pdf.embedJpg(jpg);
    })();
    c.images.set(key, imgP);
  }
  const img = await imgP;
  if (!img) return;
  const x = left + bw;
  const y = bottom + bw;
  const radius = ellipse ? 0 : Math.max(0, el.radius - bw);
  const needsClip = ellipse || radius > 0;
  if (needsClip) c.page.pushOperators(pushGraphicsState(), ...(ellipse ? ellipsePath(x, y, iw, ih) : rectPath(x, y, iw, ih, radius)), clip(), endPath());
  c.page.drawImage(img, { x, y, width: iw, height: ih });
  if (needsClip) c.page.pushOperators(popGraphicsState());
}

/* ----------------------------------- text ---------------------------------- */

/** Ascent/descent per em from the font's hhea table. */
function metrics(f: PDFFont): { ascent: number; descent: number } {
  const fk = (f as unknown as { embedder: { font: { ascent: number; descent: number; unitsPerEm: number } } }).embedder.font;
  return { ascent: fk.ascent / fk.unitsPerEm, descent: Math.abs(fk.descent) / fk.unitsPerEm };
}

export function measure(f: PDFFont, text: string, size: number, tracking: number) {
  return f.widthOfTextAtSize(text, size) + tracking * size * [...text].length;
}

/** Greedy line breaking that mirrors CSS `white-space: pre-wrap; overflow-wrap: break-word`. */
export function wrapLines(f: PDFFont, text: string, size: number, tracking: number, maxWidth: number): string[] {
  const out: string[] = [];
  const fits = (s: string) => measure(f, s.replace(/\s+$/, ''), size, tracking) <= maxWidth + 0.01;
  for (const para of text.split('\n')) {
    const tokens = para.match(/\S+\s*|\s+/g) ?? [''];
    let line = '';
    for (const tok of tokens) {
      if (fits(line + tok)) {
        line += tok;
        continue;
      }
      if (line) out.push(line);
      line = '';
      // A single word wider than the box breaks between characters.
      if (!fits(tok)) {
        let chunk = '';
        for (const ch of tok) {
          if (chunk && !fits(chunk + ch)) {
            out.push(chunk);
            chunk = '';
          }
          chunk += ch;
        }
        line = chunk;
      } else line = tok;
    }
    out.push(line);
  }
  return out;
}

async function drawText(c: Ctx, el: TextElement) {
  const f = await font(c, el.font, el.weight, el.italic);
  const text = el.uppercase ? el.text.toUpperCase() : el.text;
  if (!text.trim()) return;
  const w = el.w * c.W;
  const h = el.h * c.H;
  const lines = wrapLines(f, text, el.size, el.letterSpacing, w);
  const lh = el.lineHeight * el.size;
  const total = lines.length * lh;
  const top = el.valign === 'top' ? 0 : el.valign === 'bottom' ? h - total : (h - total) / 2;
  // Half-leading model, matching browser line boxes (hhea metrics).
  const { ascent: asc, descent: desc } = metrics(f);
  const ascent = asc * el.size;
  const full = (asc + desc) * el.size;
  const col = color(el.color);
  if (el.letterSpacing) c.page.pushOperators(pushGraphicsState(), setCharacterSpacing(el.letterSpacing * el.size));
  lines.forEach((line, i) => {
    const visible = line.replace(/\s+$/, '');
    if (!visible) return;
    const lw = measure(f, visible, el.size, el.letterSpacing);
    const dx = el.align === 'center' ? (w - lw) / 2 : el.align === 'right' ? w - lw : 0;
    const baseline = top + i * lh + (lh - full) / 2 + ascent;
    c.page.drawText(visible, { x: X(c, el.x * c.W + dx), y: Y(c, el.y * c.H + baseline), size: el.size, font: f, color: col });
  });
  if (el.letterSpacing) c.page.pushOperators(popGraphicsState());
}

/* ------------------------------ shapes/ornaments ---------------------------- */

function drawShape(c: Ctx, el: ShapeElement) {
  const ext = el.shape === 'rect' && !el.stroke ? edgeExt(c, el) : NO_EXT;
  const w = el.w * c.W + ext.l + ext.r;
  const h = el.h * c.H + ext.t + ext.b;
  const x = X(c, el.x * c.W) - ext.l;
  const top = Y(c, el.y * c.H) + ext.t;
  if (el.shape === 'line') {
    const y = top - h / 2;
    c.page.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness: el.strokeWidth, color: color(el.stroke ?? el.fill ?? '#000000'), opacity: el.opacity });
    return;
  }
  const d = el.shape === 'ellipse' ? svgEllipse(w, h) : svgRect(w, h, el.radius);
  c.page.drawSvgPath(d, {
    x,
    y: top,
    color: el.fill ? color(el.fill) : undefined,
    opacity: el.opacity,
    borderColor: el.stroke ? color(el.stroke) : undefined,
    borderWidth: el.stroke ? el.strokeWidth : undefined,
    borderOpacity: el.opacity,
  });
}

function drawOrnament(c: Ctx, el: OrnamentElement) {
  const def = ORNAMENTS[el.ornament];
  if (!def) return;
  const w = el.w * c.W;
  const h = el.h * c.H;
  const { scale, offsetX, offsetY } = fitOrnament(def, w, h);
  const x = X(c, el.x * c.W) + offsetX;
  const y = Y(c, el.y * c.H) - offsetY;
  for (const p of def.paths) {
    const op = el.opacity * (p.opacity ?? 1);
    if (p.mode === 'fill') c.page.drawSvgPath(p.d, { x, y, scale, color: color(el.color), opacity: op });
    else c.page.drawSvgPath(p.d, { x, y, scale, borderColor: color(el.color), borderWidth: p.strokeWidth ?? 2, borderOpacity: op, borderLineCap: LineCapStyle.Round });
  }
}

/* ---------------------------------- pages ---------------------------------- */

async function drawPage(c: Ctx, page: Page) {
  drawBackground(c, page.background);
  for (const el of page.elements) {
    await rotated(c, el, async () => {
      if (el.type === 'photo') await drawPhoto(c, el);
      else if (el.type === 'text') await drawText(c, el);
      else if (el.type === 'shape') drawShape(c, el);
      else drawOrnament(c, el);
    });
  }
}

async function newDoc(title: string) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkitAdapter as never);
  pdf.setTitle(title);
  pdf.setCreator('FULLSTORY');
  pdf.setProducer('FULLSTORY album renderer');
  pdf.setCreationDate(new Date());
  return pdf;
}

function ctxFor(pdf: PDFDocument, page: PDFPage, ox: number, oy: number, W: number, H: number, ext: Ext, opts: RenderOptions, shared: Pick<Ctx, 'fonts' | 'images'>): Ctx {
  return { pdf, page, ox, oy, W, H, ext, opts, ...shared };
}

/** Screen/home-print PDF: cover, interior pages and back cover at trim size. */
export async function renderDigitalPdf(doc: AlbumDocument, opts: RenderOptions): Promise<Uint8Array> {
  const pdf = await newDoc(opts.title);
  const { w: W, h: H } = pageSizePt(doc.size);
  const shared = { fonts: new Map(), images: new Map() };
  for (const p of [doc.cover, ...doc.pages, doc.backCover]) {
    const page = pdf.addPage([W, H]);
    await drawPage(ctxFor(pdf, page, 0, 0, W, H, NO_EXT, opts, shared), p);
  }
  return pdf.save();
}

/** Print-ready interior: every page with bleed, trim/bleed boxes, padded to the printed page count. */
export async function renderPrintInterior(doc: AlbumDocument, opts: RenderOptions & { bleedMm: number; pageCount: number }): Promise<Uint8Array> {
  const pdf = await newDoc(`${opts.title} — interior`);
  const { w: W, h: H } = pageSizePt(doc.size);
  const b = mmToPt(opts.bleedMm);
  const shared = { fonts: new Map(), images: new Map() };
  const pages = [...doc.pages];
  while (pages.length < opts.pageCount) pages.push({ id: `blank-${pages.length}`, layoutId: null, background: { color: '#FFFFFF', pattern: 'none', patternColor: '#FFFFFF' }, elements: [] });
  for (const p of pages) {
    const page = pdf.addPage([W + 2 * b, H + 2 * b]);
    page.setBleedBox(0, 0, W + 2 * b, H + 2 * b);
    page.setTrimBox(b, b, W, H);
    await drawPage(ctxFor(pdf, page, b, b, W, H, { l: b, r: b, t: b, b }, opts, shared), p);
  }
  return pdf.save();
}

/** Print-ready cover spread: back cover + spine + front cover with bleed (and board wrap for hardcovers). */
export async function renderPrintCover(
  doc: AlbumDocument,
  opts: RenderOptions & { bleedMm: number; spineMm: number; wrapMm: number },
): Promise<Uint8Array> {
  const pdf = await newDoc(`${opts.title} — cover`);
  const { w: W, h: H } = pageSizePt(doc.size);
  const edge = mmToPt(opts.bleedMm + opts.wrapMm);
  const spine = mmToPt(opts.spineMm);
  const sheetW = edge * 2 + W * 2 + spine;
  const sheetH = H + edge * 2;
  const page = pdf.addPage([sheetW, sheetH]);
  const b = mmToPt(opts.bleedMm);
  page.setBleedBox(0, 0, sheetW, sheetH);
  page.setTrimBox(b, b, sheetW - 2 * b, sheetH - 2 * b);
  const shared = { fonts: new Map(), images: new Map() };
  // Spine background uses the front cover colour.
  page.drawRectangle({ x: edge + W, y: 0, width: spine, height: sheetH, color: color(doc.cover.background.color) });
  const back = ctxFor(pdf, page, edge, edge, W, H, { l: edge, r: 0, t: edge, b: edge }, opts, shared);
  await drawPage(back, doc.backCover);
  const front = ctxFor(pdf, page, edge + W + spine, edge, W, H, { l: 0, r: edge, t: edge, b: edge }, opts, shared);
  await drawPage(front, doc.cover);
  // Spine text, reading top to bottom.
  const text = doc.spineText.trim();
  if (text && opts.spineMm >= 6) {
    const style = doc.theme.text.title;
    const f = await font(front, style.font, style.weight, style.italic);
    const size = Math.min(spine * 0.5, 13);
    const tw = f.widthOfTextAtSize(text, size);
    const cx = edge + W + spine / 2;
    const cy = sheetH / 2;
    const titleColor = doc.cover.elements.find((e): e is TextElement => e.type === 'text' && e.role === 'title')?.color ?? style.color;
    page.pushOperators(pushGraphicsState(), concatTransformationMatrix(0, -1, 1, 0, cx, cy));
    page.drawText(text, { x: -tw / 2, y: -size * 0.35, size, font: f, color: color(titleColor) });
    page.pushOperators(popGraphicsState());
  }
  return pdf.save();
}
