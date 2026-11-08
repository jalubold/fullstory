"""Build the browser WOFF2 files from the same TTFs the PDF renderer embeds,
keeping only Latin scripts and common punctuation/symbols. Glyph metrics are
untouched, so line breaks match between the editor, previews and PDFs.

    pip install fonttools brotli && python3 scripts/subset-web-fonts.py
"""
import pathlib
from fontTools import subset

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'src/assets/fonts'
OUT = ROOT / 'public/fonts'
UNICODES = [
    *range(0x0000, 0x0250),  # Basic Latin, Latin-1, Latin Extended-A/B
    *range(0x0300, 0x0370),  # combining marks
    *range(0x1E00, 0x1F00),  # Latin Extended Additional (Vietnamese etc.)
    *range(0x2000, 0x2070),  # general punctuation
    *range(0x20A0, 0x20D0),  # currency
    *range(0x2100, 0x2150),  # letterlike (™ №)
    *range(0x2190, 0x2200),  # arrows
    0x2212, 0x2215, 0x2219, 0x221E, 0x2248, 0x2260, 0x2264, 0x2265, 0x25CF, 0x25C6, 0x2605, 0x2665,
]

before = after = 0
for ttf in sorted(SRC.glob('*.ttf')):
    out = OUT / (ttf.stem + '.woff2')
    before += out.stat().st_size if out.exists() else 0
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    opts.glyph_names = False
    font = subset.load_font(str(ttf), opts)
    s = subset.Subsetter(opts)
    s.populate(unicodes=UNICODES)
    s.subset(font)
    subset.save_font(font, str(out), opts)
    after += out.stat().st_size
print(f'web fonts: {before/1024:.0f} KB -> {after/1024:.0f} KB')
