import { getLayout, type LayoutSlot, type Tone } from './layouts';
import type {
  AlbumDocument,
  AlbumElement,
  Background,
  Orientation,
  Page,
  PageSize,
  PhotoElement,
  TextElement,
  TextRole,
  TextStyle,
  Theme,
} from './types';

let idGenerator: ((prefix: string) => string) | null = null;

/**
 * Runs fn with deterministic ids (used for template demos, which are rendered
 * during static prerendering where random values are not allowed).
 */
export function withDeterministicIds<T>(seed: string, fn: () => T): T {
  let n = 0;
  const prev = idGenerator;
  idGenerator = (prefix) => `${prefix}_${seed}_${(n++).toString(36)}`;
  try {
    return fn();
  } finally {
    idGenerator = prev;
  }
}

export function uid(prefix = 'e'): string {
  if (idGenerator) return idGenerator(prefix);
  const rnd =
    typeof crypto !== 'undefined' && 'getRandomValues' in crypto
      ? Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${rnd}`;
}

/** Scale factor of a page relative to the 8in (203.2mm) reference design. */
export function pageUnit(size: Pick<PageSize, 'widthMm' | 'heightMm'>): number {
  return Math.min(size.widthMm, size.heightMm) / 203.2;
}

export const PLACEHOLDER_TEXT: Record<TextRole, string> = {
  title: 'Your Title',
  subtitle: 'A short subtitle',
  heading: 'A new chapter',
  body: 'Tell the story behind these photos — where you were, who was there, and what you want to remember.',
  caption: 'Add a caption',
  label: '2026',
};

export function toneColor(theme: Theme, tone: Tone | undefined, fallback: string): string {
  switch (tone) {
    case 'inverse':
      return theme.colors.inverse;
    case 'accent':
      return theme.colors.accent;
    case 'muted':
      return theme.colors.muted;
    default:
      return fallback;
  }
}

export function roleStyle(theme: Theme, role: TextRole, size: Pick<PageSize, 'widthMm' | 'heightMm'>, scale = 1): TextStyle {
  const base = theme.text[role];
  const u = pageUnit(size);
  return { ...base, size: Math.round(base.size * u * scale * 10) / 10 };
}

interface SlotContent {
  photoId?: string | null;
  text?: string;
}

export function slotToElement(slot: LayoutSlot, theme: Theme, size: PageSize, content: SlotContent = {}): AlbumElement {
  const u = pageUnit(size);
  const geom = { x: slot.x, y: slot.y, w: slot.w, h: slot.h, rotation: 'rotation' in slot ? slot.rotation ?? 0 : 0 };
  if (slot.kind === 'photo') {
    const el: PhotoElement = {
      id: uid('p'),
      type: 'photo',
      ...geom,
      photoId: content.photoId ?? null,
      crop: { zoom: 1, fx: 0.5, fy: 0.5 },
      shape: slot.shape ?? 'rect',
      radius: slot.shape === 'ellipse' ? 0 : theme.photo.radius * u,
      borderWidth: slot.mat !== undefined ? slot.mat * u : theme.photo.borderWidth * u,
      borderColor: slot.matColor ?? theme.photo.borderColor,
      filter: 'none',
      fromLayout: true,
    };
    return el;
  }
  if (slot.kind === 'text') {
    const style = roleStyle(theme, slot.role, size, slot.scale ?? 1);
    const el: TextElement = {
      id: uid('t'),
      type: 'text',
      ...geom,
      ...style,
      color: toneColor(theme, slot.tone, style.color),
      text: content.text ?? PLACEHOLDER_TEXT[slot.role],
      align: slot.align ?? 'left',
      valign: slot.valign ?? 'top',
      role: slot.role,
      fromLayout: true,
    };
    return el;
  }
  const fill =
    slot.fill === 'paper'
      ? theme.background.color
      : slot.fill === 'black'
        ? '#000000'
        : slot.fill
          ? toneColor(theme, slot.fill, theme.colors.text)
          : null;
  return {
    id: uid('s'),
    type: 'shape',
    ...geom,
    shape: slot.shape,
    fill,
    stroke: slot.stroke ? toneColor(theme, slot.stroke, theme.colors.text) : null,
    strokeWidth: (slot.strokeWidth ?? 0.75) * u,
    radius: 0,
    opacity: slot.opacity ?? 1,
    fromLayout: true,
  };
}

export interface PageContent {
  photos?: Array<string | null>;
  texts?: Array<string | undefined>;
}

export function buildPage(
  layoutId: string,
  theme: Theme,
  size: PageSize,
  content: PageContent = {},
  background?: Partial<Background>,
): Page {
  const layout = getLayout(layoutId);
  const slots = layout.build({ W: size.widthMm, H: size.heightMm });
  let pi = 0;
  let ti = 0;
  const elements = slots.map((slot) => {
    if (slot.kind === 'photo') return slotToElement(slot, theme, size, { photoId: content.photos?.[pi++] ?? null });
    if (slot.kind === 'text') return slotToElement(slot, theme, size, { text: content.texts?.[ti++] });
    return slotToElement(slot, theme, size);
  });
  return {
    id: uid('pg'),
    layoutId: layout.id,
    background: { ...theme.background, ...background },
    elements,
  };
}

const ROLE_FAMILY: Record<TextRole, 'display' | 'copy'> = {
  title: 'display',
  subtitle: 'display',
  heading: 'display',
  label: 'copy',
  body: 'copy',
  caption: 'copy',
};

/**
 * Applies a layout to an existing page while keeping its photos and text.
 * Photos fill the new frames in their current order; text moves to slots with
 * the same role (or a similar one). Elements the user added manually are kept.
 */
export function applyLayout(page: Page, layoutId: string, theme: Theme, size: PageSize): { page: Page; displaced: string[] } {
  const layout = getLayout(layoutId);
  const slots = layout.build({ W: size.widthMm, H: size.heightMm });
  const layoutEls = page.elements.filter((e) => e.fromLayout);
  const manual = page.elements.filter((e) => !e.fromLayout);
  const photos = layoutEls.filter((e): e is PhotoElement => e.type === 'photo').filter((e) => e.photoId);
  const texts = layoutEls.filter((e): e is TextElement => e.type === 'text');
  const usedText = new Set<string>();
  let photoIdx = 0;

  const takeText = (role: TextRole): string | undefined => {
    const exact = texts.find((t) => !usedText.has(t.id) && t.role === role);
    const similar = exact ?? texts.find((t) => !usedText.has(t.id) && t.role && ROLE_FAMILY[t.role] === ROLE_FAMILY[role]);
    if (similar) {
      usedText.add(similar.id);
      return similar.text;
    }
    return undefined;
  };

  const elements: AlbumElement[] = slots.map((slot) => {
    if (slot.kind === 'photo') {
      const prev = photos[photoIdx++];
      const el = slotToElement(slot, theme, size, { photoId: prev?.photoId ?? null }) as PhotoElement;
      if (prev) el.filter = prev.filter;
      return el;
    }
    if (slot.kind === 'text') return slotToElement(slot, theme, size, { text: takeText(slot.role) });
    return slotToElement(slot, theme, size);
  });

  const displaced = photos.slice(photoIdx).map((p) => p.photoId!) as string[];
  return { page: { ...page, layoutId: layout.id, elements: [...elements, ...manual] }, displaced };
}

/** Deep-clones a page with fresh ids. */
export function clonePage(page: Page): Page {
  return {
    ...structuredClone(page),
    id: uid('pg'),
    elements: page.elements.map((e) => ({ ...structuredClone(e), id: uid(e.type[0]) })),
  };
}

export const DEFAULT_THEME: Theme = {
  text: {
    title: { font: 'cormorant', weight: 500, italic: false, size: 40, color: '#25231F', lineHeight: 1.05, letterSpacing: 0, uppercase: false },
    subtitle: { font: 'cormorant', weight: 400, italic: true, size: 16, color: '#25231F', lineHeight: 1.25, letterSpacing: 0, uppercase: false },
    heading: { font: 'cormorant', weight: 500, italic: false, size: 26, color: '#25231F', lineHeight: 1.1, letterSpacing: 0, uppercase: false },
    body: { font: 'inter', weight: 300, italic: false, size: 9.5, color: '#3A3732', lineHeight: 1.6, letterSpacing: 0, uppercase: false },
    caption: { font: 'inter', weight: 400, italic: false, size: 8, color: '#55514B', lineHeight: 1.45, letterSpacing: 0.02, uppercase: false },
    label: { font: 'inter', weight: 500, italic: false, size: 7, color: '#77736C', lineHeight: 1.3, letterSpacing: 0.22, uppercase: true },
  },
  colors: { text: '#25231F', muted: '#77736C', accent: '#A68C70', inverse: '#FFFFFF' },
  background: { color: '#FBFAF7', pattern: 'none', patternColor: '#A68C70' },
  photo: { borderWidth: 0, borderColor: '#FFFFFF', radius: 0 },
  palette: ['#FBFAF7', '#F3EEE6', '#E8E1D5', '#25231F', '#A68C70', '#8C9A84', '#C9B8A6', '#FFFFFF'],
};

export const BLANK_SEQUENCE = [
  'single-margin',
  'two-side',
  'text-photo',
  'full-bleed',
  'three-hero-left',
  'four-grid',
  'single-centered',
  'two-offset',
  'full-bleed-caption',
  'three-hero-top',
];

export function createBlankDocument(size: PageSize, orientation: Orientation, pageCount: number, theme: Theme = DEFAULT_THEME): AlbumDocument {
  return {
    schemaVersion: 1,
    templateId: null,
    orientation,
    size,
    theme,
    cover: buildPage('cover-window', theme, size, { texts: ['Our Story', 'A collection of moments'] }),
    backCover: buildPage('back-plain', theme, size, { texts: ['FULLSTORY'] }),
    pages: Array.from({ length: pageCount }, (_, i) => buildPage(BLANK_SEQUENCE[i % BLANK_SEQUENCE.length], theme, size)),
    spineText: 'Our Story',
  };
}

/** Rescales a document to another trim size (keeps normalised geometry, scales pt values). */
export function resizeDocument(doc: AlbumDocument, size: PageSize): AlbumDocument {
  const k = pageUnit(size) / pageUnit(doc.size);
  const scalePage = (p: Page): Page => ({
    ...p,
    elements: p.elements.map((e) => {
      if (e.type === 'text') return { ...e, size: Math.round(e.size * k * 10) / 10 };
      if (e.type === 'photo') return { ...e, borderWidth: e.borderWidth * k, radius: e.radius * k };
      if (e.type === 'shape') return { ...e, strokeWidth: e.strokeWidth * k, radius: e.radius * k };
      return e;
    }),
  });
  return { ...doc, size, cover: scalePage(doc.cover), backCover: scalePage(doc.backCover), pages: doc.pages.map(scalePage) };
}
