/**
 * Decorative vector elements. Paths use standard SVG path syntax and the
 * non-zero fill rule, which both the browser (<svg>) and the PDF renderer
 * (pdf-lib drawSvgPath) interpret identically.
 */
export type OrnamentId =
  | 'heart'
  | 'star'
  | 'sparkle'
  | 'sprig'
  | 'flourish'
  | 'divider'
  | 'sun'
  | 'flower'
  | 'plane'
  | 'mountains'
  | 'wave'
  | 'tape'
  | 'balloon'
  | 'confetti'
  | 'laurel'
  | 'rings'
  | 'camera'
  | 'arrow';

export interface OrnamentPath {
  d: string;
  mode: 'fill' | 'stroke';
  /** Stroke width in viewBox units. */
  strokeWidth?: number;
  /** Opacity multiplier for this path. */
  opacity?: number;
}

export interface OrnamentDef {
  id: OrnamentId;
  label: string;
  viewBox: [number, number];
  paths: OrnamentPath[];
}

const r = (n: number) => Math.round(n * 100) / 100;

/** A leaf (vesica) from base (x,y) towards angle, as a closed path. */
function leaf(x: number, y: number, angleDeg: number, length: number, width: number): string {
  const a = (angleDeg * Math.PI) / 180;
  const tx = x + Math.cos(a) * length;
  const ty = y + Math.sin(a) * length;
  const mx = (x + tx) / 2;
  const my = (y + ty) / 2;
  const nx = -Math.sin(a) * width;
  const ny = Math.cos(a) * width;
  return `M${r(x)} ${r(y)} Q${r(mx + nx)} ${r(my + ny)} ${r(tx)} ${r(ty)} Q${r(mx - nx)} ${r(my - ny)} ${r(x)} ${r(y)} Z`;
}

function circle(cx: number, cy: number, rad: number): string {
  return `M${r(cx - rad)} ${r(cy)} A${r(rad)} ${r(rad)} 0 1 0 ${r(cx + rad)} ${r(cy)} A${r(rad)} ${r(rad)} 0 1 0 ${r(cx - rad)} ${r(cy)} Z`;
}

function starPath(cx: number, cy: number, outer: number, inner: number, points: number): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    pts.push(`${r(cx + Math.cos(a) * rad)} ${r(cy + Math.sin(a) * rad)}`);
  }
  return `M${pts[0]} L${pts.slice(1).join(' L')} Z`;
}

function sprig(): OrnamentPath[] {
  const paths: OrnamentPath[] = [{ d: 'M50 96 C49 70 50 40 52 6', mode: 'stroke', strokeWidth: 2.2 }];
  const leaves: string[] = [];
  for (let i = 0; i < 6; i++) {
    const y = 84 - i * 13;
    const len = 22 - i * 2;
    leaves.push(leaf(50, y, -150 + i * 4, len, 6));
    leaves.push(leaf(50.6, y - 5, -30 - i * 4, len, 6));
  }
  leaves.push(leaf(52, 10, -88, 10, 4));
  paths.push({ d: leaves.join(' '), mode: 'fill' });
  return paths;
}

function laurel(): OrnamentPath[] {
  const leaves: string[] = [];
  const stems: string[] = [];
  for (const side of [-1, 1]) {
    stems.push(side < 0 ? 'M46 92 C18 82 8 50 26 14' : 'M54 92 C82 82 92 50 74 14');
    for (let i = 0; i < 7; i++) {
      const t = i / 7;
      const ang = Math.PI * (0.55 + t * 0.62);
      const cx = 50 + side * Math.cos(ang) * -40;
      const cy = 56 - Math.sin(ang) * 40 * 0.95 + 8;
      const base = side < 0 ? 180 + 70 - t * 120 : -70 + t * 120;
      leaves.push(leaf(cx, cy, side < 0 ? -110 - t * 40 : -70 + t * 40, 13, 4.2));
      leaves.push(leaf(cx, cy, base, 11, 3.6));
    }
  }
  return [
    { d: stems.join(' '), mode: 'stroke', strokeWidth: 1.6 },
    { d: leaves.join(' '), mode: 'fill' },
  ];
}

function flower(): OrnamentPath[] {
  const petals: string[] = [];
  for (let i = 0; i < 6; i++) petals.push(leaf(50, 50, i * 60 - 90, 44, 17));
  return [
    { d: petals.join(' '), mode: 'fill', opacity: 0.85 },
    { d: circle(50, 50, 9), mode: 'fill' },
  ];
}

function sun(): OrnamentPath[] {
  const rays: string[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    rays.push(`M${r(50 + Math.cos(a) * 30)} ${r(50 + Math.sin(a) * 30)} L${r(50 + Math.cos(a) * 44)} ${r(50 + Math.sin(a) * 44)}`);
  }
  return [
    { d: circle(50, 50, 21), mode: 'fill' },
    { d: rays.join(' '), mode: 'stroke', strokeWidth: 4 },
  ];
}

function confetti(): OrnamentPath[] {
  const bits: string[] = [];
  const seed = [
    [12, 18, 0], [30, 8, 1], [52, 20, 0], [74, 10, 2], [88, 26, 1], [20, 42, 2], [44, 38, 1], [66, 44, 0],
    [86, 52, 2], [10, 66, 1], [34, 62, 0], [58, 70, 2], [80, 76, 1], [24, 88, 2], [48, 90, 1], [70, 92, 0],
  ];
  for (const [x, y, k] of seed) {
    if (k === 0) bits.push(circle(x, y, 3));
    else if (k === 1) bits.push(`M${x - 4} ${y - 1.5} L${x + 4} ${y - 3.5} L${x + 4.6} ${y - 0.5} L${x - 3.4} ${y + 1.5} Z`);
    else bits.push(`M${x} ${y - 4} L${x + 3.5} ${y + 3} L${x - 3.5} ${y + 3} Z`);
  }
  return [{ d: bits.join(' '), mode: 'fill' }];
}

export const ORNAMENTS: Record<OrnamentId, OrnamentDef> = {
  heart: {
    id: 'heart',
    label: 'Heart',
    viewBox: [100, 100],
    paths: [{ d: 'M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C39 8 46 13 50 20 C54 13 61 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88 Z', mode: 'fill' }],
  },
  star: { id: 'star', label: 'Star', viewBox: [100, 100], paths: [{ d: starPath(50, 53, 46, 19, 5), mode: 'fill' }] },
  sparkle: {
    id: 'sparkle',
    label: 'Sparkle',
    viewBox: [100, 100],
    paths: [{ d: 'M50 2 C53 36 64 47 98 50 C64 53 53 64 50 98 C47 64 36 53 2 50 C36 47 47 36 50 2 Z', mode: 'fill' }],
  },
  sprig: { id: 'sprig', label: 'Sprig', viewBox: [100, 100], paths: sprig() },
  flourish: {
    id: 'flourish',
    label: 'Flourish',
    viewBox: [200, 40],
    paths: [
      {
        d: 'M8 20 C38 20 58 6 78 13 C88 17 92 24 100 20 C108 16 112 23 122 27 C142 34 162 20 192 20',
        mode: 'stroke',
        strokeWidth: 1.6,
      },
      { d: 'M100 13 L106 20 L100 27 L94 20 Z', mode: 'fill' },
    ],
  },
  divider: {
    id: 'divider',
    label: 'Divider',
    viewBox: [200, 20],
    paths: [
      { d: 'M4 10 L86 10 M114 10 L196 10', mode: 'stroke', strokeWidth: 1.2 },
      { d: circle(100, 10, 3.2), mode: 'fill' },
    ],
  },
  sun: { id: 'sun', label: 'Sun', viewBox: [100, 100], paths: sun() },
  flower: { id: 'flower', label: 'Flower', viewBox: [100, 100], paths: flower() },
  plane: {
    id: 'plane',
    label: 'Plane',
    viewBox: [100, 100],
    paths: [
      {
        d: 'M50 4 C54 4 56 9 56 14 L56 38 L94 59 L94 67 L56 55 L56 78 L67 86 L67 93 L50 88 L33 93 L33 86 L44 78 L44 55 L6 67 L6 59 L44 38 L44 14 C44 9 46 4 50 4 Z',
        mode: 'fill',
      },
    ],
  },
  mountains: {
    id: 'mountains',
    label: 'Mountains',
    viewBox: [100, 60],
    paths: [{ d: 'M3 56 L33 14 L48 34 L64 8 L97 56', mode: 'stroke', strokeWidth: 2.4 }],
  },
  wave: {
    id: 'wave',
    label: 'Wave',
    viewBox: [200, 30],
    paths: [
      {
        d: 'M4 15 C20 3 30 3 46 15 C62 27 72 27 88 15 C104 3 114 3 130 15 C146 27 156 27 172 15 C182 8 190 6 196 8',
        mode: 'stroke',
        strokeWidth: 2.2,
      },
    ],
  },
  tape: {
    id: 'tape',
    label: 'Washi tape',
    viewBox: [160, 40],
    paths: [
      {
        d: 'M6 4 L154 4 L150 10 L156 16 L150 22 L156 28 L150 34 L154 38 L6 38 L10 32 L4 26 L10 20 L4 14 L10 8 Z',
        mode: 'fill',
        opacity: 0.72,
      },
    ],
  },
  balloon: {
    id: 'balloon',
    label: 'Balloon',
    viewBox: [60, 100],
    paths: [
      { d: 'M30 4 C46 4 56 18 56 32 C56 50 40 62 30 64 C20 62 4 50 4 32 C4 18 14 4 30 4 Z M26 64 L34 64 L31 69 L29 69 Z', mode: 'fill' },
      { d: 'M30 69 C26 76 34 82 30 89 C27 94 31 97 30 99', mode: 'stroke', strokeWidth: 1.2 },
    ],
  },
  confetti: { id: 'confetti', label: 'Confetti', viewBox: [100, 100], paths: confetti() },
  laurel: { id: 'laurel', label: 'Laurel', viewBox: [100, 100], paths: laurel() },
  rings: {
    id: 'rings',
    label: 'Rings',
    viewBox: [100, 70],
    paths: [{ d: `${circle(36, 38, 22)} ${circle(64, 38, 22)}`, mode: 'stroke', strokeWidth: 3 }],
  },
  camera: {
    id: 'camera',
    label: 'Camera',
    viewBox: [100, 80],
    paths: [
      { d: 'M8 22 L30 22 L36 12 L64 12 L70 22 L92 22 L92 72 L8 72 Z', mode: 'stroke', strokeWidth: 3.5 },
      { d: circle(50, 46, 15), mode: 'stroke', strokeWidth: 3.5 },
    ],
  },
  arrow: {
    id: 'arrow',
    label: 'Arrow',
    viewBox: [100, 50],
    paths: [{ d: 'M6 30 C30 6 62 6 90 24 M78 12 L91 25 L74 31', mode: 'stroke', strokeWidth: 2.2 }],
  },
};

export const ORNAMENT_LIST: OrnamentDef[] = Object.values(ORNAMENTS);

/** Fit a viewBox into a box (preserveAspectRatio: xMidYMid meet). */
export function fitOrnament(def: OrnamentDef, boxW: number, boxH: number) {
  const [vw, vh] = def.viewBox;
  const scale = Math.min(boxW / vw, boxH / vh);
  return { scale, offsetX: (boxW - vw * scale) / 2, offsetY: (boxH - vh * scale) / 2 };
}
