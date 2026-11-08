import type { TextAlign, TextRole, TextVAlign } from './types';

/**
 * Layout library. Each layout is a function of the page's physical size, so
 * margins and gutters stay physically consistent across square, landscape and
 * portrait books. Slots are returned in normalised page coordinates.
 */

export type LayoutGroup =
  | 'cover'
  | 'back'
  | 'single'
  | 'two'
  | 'three'
  | 'four'
  | 'many'
  | 'text'
  | 'editorial'
  | 'scrapbook';

export type Tone = 'default' | 'inverse' | 'accent' | 'muted';

export interface PhotoSlot {
  kind: 'photo';
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  shape?: 'rect' | 'ellipse';
  /** Mat width in pt at an 8in reference page (scaled with the page). */
  mat?: number;
  matColor?: string;
}

export interface TextSlot {
  kind: 'text';
  role: TextRole;
  x: number;
  y: number;
  w: number;
  h: number;
  align?: TextAlign;
  valign?: TextVAlign;
  rotation?: number;
  tone?: Tone;
  /** Multiplier applied to the theme's font size for this role. */
  scale?: number;
}

export interface ShapeSlot {
  kind: 'shape';
  shape: 'rect' | 'ellipse' | 'line';
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: Tone | 'paper' | 'black' | null;
  stroke?: Tone | null;
  strokeWidth?: number;
  opacity?: number;
}

export type LayoutSlot = PhotoSlot | TextSlot | ShapeSlot;

export interface LayoutCtx {
  /** Trim width/height in mm. */
  W: number;
  H: number;
}

export interface LayoutDef {
  id: string;
  name: string;
  group: LayoutGroup;
  photos: number;
  build: (ctx: LayoutCtx) => LayoutSlot[];
}

function grid(ctx: LayoutCtx, marginScale = 1, gutterScale = 1) {
  const base = Math.min(ctx.W, ctx.H);
  const M = base * 0.075 * marginScale;
  const G = base * 0.022 * gutterScale;
  return { mx: M / ctx.W, my: M / ctx.H, gx: G / ctx.W, gy: G / ctx.H, aspect: ctx.W / ctx.H };
}

const P = (x: number, y: number, w: number, h: number, extra: Partial<PhotoSlot> = {}): PhotoSlot => ({ kind: 'photo', x, y, w, h, ...extra });
const T = (role: TextRole, x: number, y: number, w: number, h: number, extra: Partial<TextSlot> = {}): TextSlot => ({
  kind: 'text',
  role,
  x,
  y,
  w,
  h,
  ...extra,
});

/** Evenly divides a span into n cells separated by a gutter. */
function split(start: number, size: number, n: number, gutter: number): Array<[number, number]> {
  const cell = (size - gutter * (n - 1)) / n;
  return Array.from({ length: n }, (_, i) => [start + i * (cell + gutter), cell] as [number, number]);
}

export const LAYOUTS: LayoutDef[] = [
  /* --------------------------------- covers -------------------------------- */
  {
    id: 'cover-full',
    name: 'Full photo cover',
    group: 'cover',
    photos: 1,
    build: (ctx) => {
      const { mx } = grid(ctx);
      return [
        P(0, 0, 1, 1),
        { kind: 'shape', shape: 'rect', x: 0, y: 0, w: 1, h: 1, fill: 'black', opacity: 0.16 },
        T('title', mx, 0.6, 1 - 2 * mx, 0.16, { align: 'center', valign: 'bottom', tone: 'inverse' }),
        T('subtitle', mx, 0.775, 1 - 2 * mx, 0.07, { align: 'center', valign: 'top', tone: 'inverse' }),
      ];
    },
  },
  {
    id: 'cover-window',
    name: 'Photo window cover',
    group: 'cover',
    photos: 1,
    build: (ctx) => {
      const { mx, my } = grid(ctx);
      return [
        P(mx, my, 1 - 2 * mx, 0.64),
        T('title', mx, my + 0.68, 1 - 2 * mx, 0.12, { align: 'center', valign: 'middle' }),
        T('subtitle', mx, my + 0.8, 1 - 2 * mx, 0.06, { align: 'center', valign: 'top' }),
      ];
    },
  },
  {
    id: 'cover-classic',
    name: 'Classic cover',
    group: 'cover',
    photos: 1,
    build: (ctx) => {
      const { aspect } = grid(ctx);
      const pw = aspect >= 1.1 ? 0.36 : 0.52;
      return [
        T('title', 0.1, 0.1, 0.8, 0.13, { align: 'center', valign: 'bottom' }),
        T('label', 0.1, 0.24, 0.8, 0.04, { align: 'center', valign: 'top', tone: 'muted' }),
        P((1 - pw) / 2, 0.32, pw, 0.5),
        T('subtitle', 0.1, 0.85, 0.8, 0.05, { align: 'center', valign: 'top' }),
      ];
    },
  },
  {
    id: 'cover-type',
    name: 'Typographic cover',
    group: 'cover',
    photos: 0,
    build: () => [
      T('label', 0.15, 0.3, 0.7, 0.04, { align: 'center', valign: 'bottom', tone: 'muted' }),
      T('title', 0.1, 0.36, 0.8, 0.2, { align: 'center', valign: 'middle', scale: 1.15 }),
      T('subtitle', 0.15, 0.58, 0.7, 0.06, { align: 'center', valign: 'top' }),
    ],
  },
  {
    id: 'cover-band',
    name: 'Photo with band',
    group: 'cover',
    photos: 1,
    build: (ctx) => {
      const { mx } = grid(ctx);
      return [
        P(0, 0, 1, 0.72),
        T('title', mx, 0.76, 1 - 2 * mx, 0.11, { align: 'center', valign: 'middle' }),
        T('subtitle', mx, 0.87, 1 - 2 * mx, 0.05, { align: 'center', valign: 'top', tone: 'muted' }),
      ];
    },
  },
  {
    id: 'cover-split',
    name: 'Split cover',
    group: 'cover',
    photos: 1,
    build: () => [
      P(0, 0, 0.5, 1),
      T('label', 0.56, 0.36, 0.38, 0.04, { align: 'left', valign: 'bottom', tone: 'muted' }),
      T('title', 0.56, 0.41, 0.38, 0.18, { align: 'left', valign: 'top' }),
      T('subtitle', 0.56, 0.6, 0.38, 0.08, { align: 'left', valign: 'top' }),
    ],
  },
  {
    id: 'cover-circle',
    name: 'Portrait circle cover',
    group: 'cover',
    photos: 1,
    build: (ctx) => {
      const d = 0.46 * Math.min(ctx.W, ctx.H);
      const w = d / ctx.W;
      const h = d / ctx.H;
      return [
        P((1 - w) / 2, 0.16, w, h, { shape: 'ellipse' }),
        T('title', 0.1, 0.18 + h + 0.04, 0.8, 0.12, { align: 'center', valign: 'top' }),
        T('subtitle', 0.1, 0.18 + h + 0.16, 0.8, 0.05, { align: 'center', valign: 'top', tone: 'muted' }),
      ];
    },
  },
  /* ------------------------------- back covers ------------------------------ */
  {
    id: 'back-plain',
    name: 'Simple back cover',
    group: 'back',
    photos: 0,
    build: () => [T('label', 0.2, 0.86, 0.6, 0.05, { align: 'center', valign: 'middle', tone: 'muted' })],
  },
  {
    id: 'back-photo',
    name: 'Back cover with photo',
    group: 'back',
    photos: 1,
    build: (ctx) => {
      const d = 0.34 * Math.min(ctx.W, ctx.H);
      const w = d / ctx.W;
      const h = d / ctx.H;
      return [
        P((1 - w) / 2, 0.32, w, h),
        T('caption', 0.15, 0.34 + h, 0.7, 0.06, { align: 'center', valign: 'top' }),
        T('label', 0.2, 0.86, 0.6, 0.05, { align: 'center', valign: 'middle', tone: 'muted' }),
      ];
    },
  },
  /* --------------------------------- single -------------------------------- */
  { id: 'full-bleed', name: 'Full bleed', group: 'single', photos: 1, build: () => [P(0, 0, 1, 1)] },
  {
    id: 'full-bleed-caption',
    name: 'Full bleed with caption',
    group: 'single',
    photos: 1,
    build: (ctx) => {
      const { mx, my } = grid(ctx);
      return [P(0, 0, 1, 1), T('caption', mx, 1 - my - 0.06, 0.6, 0.06, { align: 'left', valign: 'bottom', tone: 'inverse' })];
    },
  },
  {
    id: 'single-margin',
    name: 'Single with margin',
    group: 'single',
    photos: 1,
    build: (ctx) => {
      const { mx, my } = grid(ctx);
      return [
        P(mx, my, 1 - 2 * mx, 1 - 2 * my - 0.08),
        T('caption', mx, 1 - my - 0.055, 1 - 2 * mx, 0.05, { align: 'left', valign: 'bottom' }),
      ];
    },
  },
  {
    id: 'single-centered',
    name: 'Gallery single',
    group: 'single',
    photos: 1,
    build: (ctx) => {
      const { aspect } = grid(ctx);
      const w = aspect >= 1.1 ? 0.5 : aspect <= 0.9 ? 0.66 : 0.6;
      const h = 0.6;
      return [P((1 - w) / 2, 0.15, w, h), T('caption', (1 - w) / 2, 0.15 + h + 0.025, w, 0.08, { align: 'center', valign: 'top' })];
    },
  },
  /* ----------------------------------- two ---------------------------------- */
  {
    id: 'two-side',
    name: 'Two side by side',
    group: 'two',
    photos: 2,
    build: (ctx) => {
      const { mx, my, gx } = grid(ctx);
      const cols = split(mx, 1 - 2 * mx, 2, gx);
      const h = 1 - 2 * my - 0.08;
      return [
        ...cols.map(([x, w]) => P(x, my, w, h)),
        T('caption', mx, 1 - my - 0.055, 1 - 2 * mx, 0.05, { align: 'left', valign: 'bottom' }),
      ];
    },
  },
  {
    id: 'two-stack',
    name: 'Two stacked',
    group: 'two',
    photos: 2,
    build: (ctx) => {
      const { mx, my, gy } = grid(ctx);
      const rows = split(my, 1 - 2 * my, 2, gy);
      return rows.map(([y, h]) => P(mx, y, 1 - 2 * mx, h));
    },
  },
  {
    id: 'two-offset',
    name: 'Offset pair',
    group: 'two',
    photos: 2,
    build: (ctx) => {
      const { mx, my } = grid(ctx);
      return [
        P(mx, my, 0.58, 0.52),
        P(1 - mx - 0.4, 0.46, 0.4, 1 - my - 0.46),
        T('caption', mx, 0.6, 0.42, 0.22, { align: 'left', valign: 'top' }),
      ];
    },
  },
  {
    id: 'two-bleed',
    name: 'Two full bleed',
    group: 'two',
    photos: 2,
    build: () => [P(0, 0, 0.5, 1), P(0.5, 0, 0.5, 1)],
  },
  /* ---------------------------------- three --------------------------------- */
  {
    id: 'three-hero-left',
    name: 'Hero left + two',
    group: 'three',
    photos: 3,
    build: (ctx) => {
      const { mx, my, gx, gy } = grid(ctx);
      const total = 1 - 2 * mx - gx;
      const big = total * 0.6;
      const rows = split(my, 1 - 2 * my, 2, gy);
      return [P(mx, my, big, 1 - 2 * my), ...rows.map(([y, h]) => P(mx + big + gx, y, total - big, h))];
    },
  },
  {
    id: 'three-hero-top',
    name: 'Hero top + two',
    group: 'three',
    photos: 3,
    build: (ctx) => {
      const { mx, my, gx, gy } = grid(ctx);
      const total = 1 - 2 * my - gy;
      const big = total * 0.6;
      const cols = split(mx, 1 - 2 * mx, 2, gx);
      return [P(mx, my, 1 - 2 * mx, big), ...cols.map(([x, w]) => P(x, my + big + gy, w, total - big))];
    },
  },
  {
    id: 'three-row',
    name: 'Three in a row',
    group: 'three',
    photos: 3,
    build: (ctx) => {
      const { mx, gx } = grid(ctx);
      const cols = split(mx, 1 - 2 * mx, 3, gx);
      return [
        T('heading', mx, 0.12, 1 - 2 * mx, 0.1, { align: 'left', valign: 'bottom' }),
        ...cols.map(([x, w]) => P(x, 0.26, w, 0.5)),
        T('caption', mx, 0.79, 0.6, 0.08, { align: 'left', valign: 'top' }),
      ];
    },
  },
  /* ---------------------------------- four ---------------------------------- */
  {
    id: 'four-grid',
    name: 'Four grid',
    group: 'four',
    photos: 4,
    build: (ctx) => {
      const { mx, my, gx, gy } = grid(ctx);
      const cols = split(mx, 1 - 2 * mx, 2, gx);
      const rows = split(my, 1 - 2 * my, 2, gy);
      return rows.flatMap(([y, h]) => cols.map(([x, w]) => P(x, y, w, h)));
    },
  },
  {
    id: 'four-hero',
    name: 'Hero + three',
    group: 'four',
    photos: 4,
    build: (ctx) => {
      const { mx, my, gx, gy } = grid(ctx);
      const total = 1 - 2 * my - gy;
      const big = total * 0.62;
      const cols = split(mx, 1 - 2 * mx, 3, gx);
      return [P(mx, my, 1 - 2 * mx, big), ...cols.map(([x, w]) => P(x, my + big + gy, w, total - big))];
    },
  },
  /* ---------------------------------- many ---------------------------------- */
  {
    id: 'six-grid',
    name: 'Six grid',
    group: 'many',
    photos: 6,
    build: (ctx) => {
      const { mx, my, gx, gy, aspect } = grid(ctx);
      const [c, r] = aspect < 0.9 ? [2, 3] : [3, 2];
      const cols = split(mx, 1 - 2 * mx, c, gx);
      const rows = split(my, 1 - 2 * my, r, gy);
      return rows.flatMap(([y, h]) => cols.map(([x, w]) => P(x, y, w, h)));
    },
  },
  {
    id: 'month-trio',
    name: 'Month / chapter',
    group: 'many',
    photos: 3,
    build: (ctx) => {
      const { mx, my, gx, gy } = grid(ctx);
      const top = my + 0.17;
      const total = 1 - top - my;
      const rows = split(top, total, 2, gy);
      const big = (1 - 2 * mx - gx) * 0.62;
      return [
        T('heading', mx, my, 0.6, 0.11, { align: 'left', valign: 'bottom', scale: 1.25 }),
        T('caption', mx, my + 0.115, 0.7, 0.045, { align: 'left', valign: 'top', tone: 'muted' }),
        P(mx, top, big, total),
        ...rows.map(([y, h]) => P(mx + big + gx, y, 1 - 2 * mx - big - gx, h)),
      ];
    },
  },
  /* ---------------------------------- text ---------------------------------- */
  {
    id: 'text-page',
    name: 'Story page',
    group: 'text',
    photos: 0,
    build: () => [
      T('heading', 0.16, 0.22, 0.68, 0.14, { align: 'center', valign: 'bottom' }),
      T('body', 0.18, 0.4, 0.64, 0.4, { align: 'center', valign: 'top' }),
    ],
  },
  {
    id: 'quote',
    name: 'Quote',
    group: 'text',
    photos: 0,
    build: () => [
      T('heading', 0.14, 0.3, 0.72, 0.3, { align: 'center', valign: 'middle', scale: 1.2 }),
      T('caption', 0.2, 0.63, 0.6, 0.06, { align: 'center', valign: 'top', tone: 'muted' }),
    ],
  },
  {
    id: 'text-photo',
    name: 'Photo + story',
    group: 'text',
    photos: 1,
    build: (ctx) => {
      const { mx, my, aspect } = grid(ctx);
      if (aspect >= 0.9) {
        return [
          P(0, 0, 0.5, 1),
          T('heading', 0.56, 0.22, 1 - 0.56 - mx, 0.16, { align: 'left', valign: 'bottom' }),
          T('body', 0.56, 0.41, 1 - 0.56 - mx, 0.42, { align: 'left', valign: 'top' }),
        ];
      }
      return [
        P(0, 0, 1, 0.55),
        T('heading', mx, 0.6, 1 - 2 * mx, 0.08, { align: 'left', valign: 'bottom' }),
        T('body', mx, 0.7, 1 - 2 * mx, 0.3 - my, { align: 'left', valign: 'top' }),
      ];
    },
  },
  /* -------------------------------- editorial ------------------------------- */
  {
    id: 'editorial-feature',
    name: 'Editorial feature',
    group: 'editorial',
    photos: 1,
    build: (ctx) => {
      const { mx } = grid(ctx);
      const left = 0.58;
      const x = left + mx * 0.8;
      const w = 1 - x - mx;
      return [
        P(0, 0, left, 1),
        T('label', x, 0.2, w, 0.04, { align: 'left', valign: 'bottom', tone: 'accent' }),
        T('heading', x, 0.25, w, 0.2, { align: 'left', valign: 'top' }),
        T('body', x, 0.48, w, 0.4, { align: 'left', valign: 'top' }),
      ];
    },
  },
  {
    id: 'editorial-columns',
    name: 'Editorial columns',
    group: 'editorial',
    photos: 1,
    build: (ctx) => {
      const { mx, my, gx } = grid(ctx);
      const pw = (1 - 2 * mx - gx) * 0.62;
      return [
        T('heading', mx, my, 1 - 2 * mx, 0.16, { align: 'left', valign: 'bottom', scale: 1.1 }),
        { kind: 'shape', shape: 'line', x: mx, y: my + 0.185, w: 1 - 2 * mx, h: 0.002, stroke: 'default', strokeWidth: 0.6 },
        P(mx, my + 0.22, pw, 1 - 2 * my - 0.22),
        T('body', mx + pw + gx, my + 0.22, 1 - 2 * mx - pw - gx, 0.5, { align: 'left', valign: 'top' }),
      ];
    },
  },
  {
    id: 'editorial-number',
    name: 'Chapter opener',
    group: 'editorial',
    photos: 1,
    build: (ctx) => {
      const { mx, my } = grid(ctx);
      return [
        T('label', mx, my, 0.3, 0.05, { align: 'left', valign: 'top', tone: 'accent' }),
        T('title', mx, my + 0.06, 0.42, 0.24, { align: 'left', valign: 'top' }),
        T('body', mx, 0.58, 0.36, 0.3, { align: 'left', valign: 'top' }),
        P(0.5, my, 0.5 - mx, 1 - 2 * my),
      ];
    },
  },
  {
    id: 'editorial-strip',
    name: 'Triptych',
    group: 'editorial',
    photos: 3,
    build: (ctx) => {
      const { mx, gx } = grid(ctx);
      const cols = split(0, 1, 3, gx * 0.6);
      return [
        ...cols.map(([x, w]) => P(x, 0, w, 0.64)),
        T('heading', mx, 0.69, 0.46, 0.12, { align: 'left', valign: 'top' }),
        T('body', 0.52, 0.69, 0.48 - mx, 0.22, { align: 'left', valign: 'top' }),
      ];
    },
  },
  /* -------------------------------- scrapbook ------------------------------- */
  {
    id: 'scrap-duo',
    name: 'Scrapbook pair',
    group: 'scrapbook',
    photos: 2,
    build: (ctx) => {
      const { aspect } = grid(ctx);
      const wide = aspect >= 1.1;
      return [
        P(wide ? 0.08 : 0.08, wide ? 0.1 : 0.08, wide ? 0.42 : 0.56, wide ? 0.62 : 0.44, { rotation: -4, mat: 9, matColor: '#FFFFFF' }),
        P(wide ? 0.52 : 0.36, wide ? 0.24 : 0.46, wide ? 0.4 : 0.56, wide ? 0.56 : 0.4, { rotation: 3.5, mat: 9, matColor: '#FFFFFF' }),
        T('caption', wide ? 0.08 : 0.08, wide ? 0.8 : 0.88, wide ? 0.42 : 0.6, 0.08, { align: 'left', valign: 'top', rotation: -2 }),
      ];
    },
  },
  {
    id: 'scrap-trio',
    name: 'Scrapbook trio',
    group: 'scrapbook',
    photos: 3,
    build: () => [
      P(0.07, 0.08, 0.46, 0.4, { rotation: -3, mat: 8, matColor: '#FFFFFF' }),
      P(0.5, 0.14, 0.42, 0.36, { rotation: 4, mat: 8, matColor: '#FFFFFF' }),
      P(0.2, 0.52, 0.5, 0.36, { rotation: -1.5, mat: 8, matColor: '#FFFFFF' }),
      T('caption', 0.62, 0.62, 0.32, 0.2, { align: 'left', valign: 'top', rotation: 3 }),
    ],
  },
  {
    id: 'scrap-polaroid',
    name: 'Instant photo',
    group: 'scrapbook',
    photos: 1,
    build: (ctx) => {
      const d = 0.62 * Math.min(ctx.W, ctx.H);
      const w = d / ctx.W;
      const h = d / ctx.H;
      return [
        P((1 - w) / 2, 0.12, w, h, { rotation: -2, mat: 12, matColor: '#FFFFFF' }),
        T('caption', (1 - w) / 2, 0.14 + h + 0.03, w, 0.1, { align: 'center', valign: 'top', rotation: -2 }),
      ];
    },
  },
];

export const LAYOUT_MAP: Record<string, LayoutDef> = Object.fromEntries(LAYOUTS.map((l) => [l.id, l]));

export const LAYOUT_GROUPS: Array<{ id: LayoutGroup; label: string }> = [
  { id: 'single', label: 'Single photo' },
  { id: 'two', label: 'Two photos' },
  { id: 'three', label: 'Three photos' },
  { id: 'four', label: 'Four photos' },
  { id: 'many', label: 'Collage' },
  { id: 'text', label: 'Text & story' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'scrapbook', label: 'Scrapbook' },
  { id: 'cover', label: 'Cover' },
  { id: 'back', label: 'Back cover' },
];

export function getLayout(id: string): LayoutDef {
  return LAYOUT_MAP[id] ?? LAYOUT_MAP['single-margin'];
}
