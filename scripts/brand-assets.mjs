// Generates raster brand assets (apple icon, Open Graph image) with the real
// brand fonts converted to vector paths, so they render identically anywhere.
import fs from 'node:fs';
import * as fontkit from 'fontkit';
import sharp from 'sharp';

const font = (f) => fontkit.openSync(`src/assets/fonts/${f}.ttf`);
function textPath(f, text, size, x, y, { tracking = 0, anchor = 'start' } = {}) {
  const scale = size / f.unitsPerEm;
  const run = f.layout(text, { kern: true, liga: true });
  const width = run.positions.reduce((w, p) => w + p.xAdvance * scale + tracking * size, 0) - tracking * size;
  let cx = anchor === 'middle' ? x - width / 2 : x;
  let d = '';
  run.glyphs.forEach((g, i) => {
    const p = run.positions[i];
    d += `<path transform="translate(${cx + p.xOffset * scale} ${y - p.yOffset * scale}) scale(${scale} ${-scale})" d="${g.path.toSVG()}"/>`;
    cx += p.xAdvance * scale + tracking * size;
  });
  return { d, width };
}

const mark = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s / 40})">
  <rect width="40" height="40" rx="11" fill="url(#tile)"/>
  <path d="M20 12.2C16.6 10.3 12.2 9.7 8.2 10.5V28.6C12.2 27.8 16.6 28.4 20 30.3Z" fill="#fff"/>
  <path d="M20 12.2C23.4 10.3 27.8 9.7 31.8 10.5V28.6C27.8 27.8 23.4 28.4 20 30.3Z" fill="#fff" opacity=".72"/>
  <path d="M24.6 10.05 27.9 9.85V33.2L26.25 31.5 24.6 33.2Z" fill="url(#ribbon)"/></g>`;
const defs = `<defs>
  <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2a37"/><stop offset="1" stop-color="#07070b"/></linearGradient>
  <linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B66FF"/><stop offset="1" stop-color="#2A35F0"/></linearGradient>
  <radialGradient id="g1" cx="0.2" cy="0.1" r="0.7"><stop offset="0" stop-color="#3a47ff" stop-opacity=".55"/><stop offset="1" stop-color="#3a47ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="g2" cx="0.95" cy="0.95" r="0.6"><stop offset="0" stop-color="#ff4d8d" stop-opacity=".35"/><stop offset="1" stop-color="#ff4d8d" stop-opacity="0"/></radialGradient>
  <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7b85ff"/><stop offset=".55" stop-color="#b48cff"/><stop offset="1" stop-color="#ff8db8"/></linearGradient>
</defs>`;

// Apple touch icon
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">${defs}<rect width="180" height="180" fill="#0a0a0f"/>${mark(0, 0, 180)}</svg>`;
await sharp(Buffer.from(icon)).png().toFile('src/app/apple-icon.png');

// Open Graph image
const serif = font('cormorant-garamond-600');
const serifItalic = font('cormorant-garamond-500i');
const sans = font('inter-500');
const word = textPath(serif, 'FULLSTORY', 44, 600, 170, { tracking: 0.26, anchor: 'middle' });
const l1 = textPath(serif, 'Your photos. Your story.', 92, 600, 330, { anchor: 'middle' });
const l2 = textPath(serifItalic, 'Your book.', 104, 600, 440, { anchor: 'middle' });
const tag = textPath(sans, 'PREMIUM PHOTOBOOKS, DESIGNED BY YOU', 17, 600, 540, { tracking: 0.22, anchor: 'middle' });
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">${defs}
  <rect width="1200" height="630" fill="#08080c"/><rect width="1200" height="630" fill="url(#g1)"/><rect width="1200" height="630" fill="url(#g2)"/>
  ${mark(600 - word.width / 2 - 70, 128, 54)}
  <g fill="#ffffff" transform="translate(35 0)">${word.d}</g>
  <g fill="#ffffff">${l1.d}</g>
  <g fill="url(#accent)">${l2.d}</g>
  <g fill="#ffffff" fill-opacity=".55">${tag.d}</g>
</svg>`;
await sharp(Buffer.from(og)).png().toFile('src/app/opengraph-image.png');
fs.writeFileSync('public/brand-mark.svg', fs.readFileSync('src/app/icon.svg'));
console.log('brand assets written');
