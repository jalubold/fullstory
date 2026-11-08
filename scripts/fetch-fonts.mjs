// Downloads static TTF instances from Google Fonts (OFL-licensed families) and
// converts them to WOFF2. The SAME font files are used by the browser renderer
// (WOFF2) and the PDF renderer (TTF), so text metrics match between editor,
// preview and exported PDF.
import fs from 'node:fs/promises';
import path from 'node:path';
import wawoff2 from 'wawoff2';

const OUT_TTF = path.resolve('src/assets/fonts');
const OUT_WOFF2 = path.resolve('public/fonts');

// family -> [[weight, italic]]
const FAMILIES = {
  'Cormorant Garamond': [[400, 0], [500, 0], [600, 0], [400, 1], [500, 1]],
  'Playfair Display': [[400, 0], [600, 0], [400, 1]],
  'Inter': [[300, 0], [400, 0], [500, 0], [600, 0]],
  'Manrope': [[300, 0], [400, 0], [600, 0], [700, 0]],
  'Libre Baskerville': [[400, 0], [700, 0], [400, 1]],
  'DM Serif Display': [[400, 0], [400, 1]],
  'Montserrat': [[300, 0], [500, 0], [700, 0]],
  'Great Vibes': [[400, 0]],
  'Caveat': [[400, 0], [700, 0]],
  'Special Elite': [[400, 0]],
  'Fredoka': [[400, 0], [600, 0]],
  'Josefin Sans': [[300, 0], [600, 0]],
};

const slug = (f) => f.toLowerCase().replace(/\s+/g, '-');

await fs.mkdir(OUT_TTF, { recursive: true });
await fs.mkdir(OUT_WOFF2, { recursive: true });

for (const [family, variants] of Object.entries(FAMILIES)) {
  for (const [weight, italic] of variants) {
    const axis = `ital,wght@${italic}, ${weight}`.replace(' ', '');
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:${axis}`;
    // A non-browser UA makes the API return a full-coverage TTF instance.
    const css = await (await fetch(url, { headers: { 'User-Agent': 'curl/8.0' } })).text();
    const m = css.match(/src:\s*url\(([^)]+)\)\s*format\('truetype'\)/);
    if (!m) throw new Error(`No TTF for ${family} ${weight} ${italic}: ${css.slice(0, 200)}`);
    const buf = Buffer.from(await (await fetch(m[1])).arrayBuffer());
    const name = `${slug(family)}-${weight}${italic ? 'i' : ''}`;
    await fs.writeFile(path.join(OUT_TTF, `${name}.ttf`), buf);
    const woff2 = await wawoff2.compress(buf);
    await fs.writeFile(path.join(OUT_WOFF2, `${name}.woff2`), Buffer.from(woff2));
    console.log(name, buf.length, woff2.length);
  }
}
