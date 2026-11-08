/** Small colour helpers shared by template materialisation and book rendering. */

export function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** a·(1−t) + b·t, as hex. */
export function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `#${[m(r1, r2), m(g1, g2), m(b1, b2)].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

export function luminance(hex: string): number {
  const c = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/**
 * The cloth of the hard cover that frames an open spread, and the endpaper
 * inside it — taken from the album's own cover so every book looks bound in
 * its own material.
 */
export function bookFinish(doc: { cover: { background: { color: string } } }): { board: string; endpaper: string } {
  const c = /^#[0-9a-f]{6}$/i.test(doc.cover.background.color) ? doc.cover.background.color : '#7A1020';
  const dark = luminance(c) < 0.2;
  const edge = mixHex(c, '#000000', dark ? 0.45 : 0.2);
  return {
    board: `linear-gradient(90deg,${edge},${c} 3%,${c} 97%,${edge})`,
    endpaper: dark ? c : mixHex(c, '#000000', 0.06),
  };
}
