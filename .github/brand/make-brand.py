"""Writes the jsal.io logo's SVG files into this folder, and site/favicon.svg.

The mark is hand-written below (a 32-unit grid, so the j's stem lands on whole pixels at 16px). The wordmark is
Inter Bold turned into outlines, except its j, which is the same round-ended drawing the site's top bar shows
(shell.css), so the lockups need no font. Needs fontTools (pip install fonttools brotli):
    python .github/brand/make-brand.py
The PNGs in png/ are exports of mark.svg (16, 32, 512) and mark-square.svg (180).
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent

SLATE, PARCH, INK, GOLD, DEEP, EDGE = '#111318', '#ece6d6', '#1f1a12', '#e3b04b', '#7e5a00', '#3d424e'
# The mark: a lowercase j with round ends, its dot the gold gem
J = 'M20 15V20a4.5 4.5 0 0 1-9 0'
GEM = 'M20 5l3 3-3 3-3-3z'
# The wordmark's j, in the top bar's units (thousandths of an em, in a 900 x 1050 box whose baseline is at 750 and
# whose left edge is 0.45em before the letter): round ends, its hook turning a third past the quarter
J_NAME = 'M585.5 277.5V780A100 100 0 0 1 435.5 866.6'
J_DOT = (586, 57.5, 77)
XMLNS = 'xmlns="http://www.w3.org/2000/svg"'


def glyph(fg, gem):
    return (f'<path d="{J}" fill="none" stroke="{fg}" stroke-width="4" stroke-linecap="round"/>'
            f'<path d="{GEM}" fill="{gem}"/>')


def tile(square=False, edge=False):
    if square:
        return f'<rect width="32" height="32" fill="{SLATE}"/>'
    if edge:   # on a dark page the tile gets a 1px edge so it doesn't sink into the background
        return f'<rect x=".5" y=".5" width="31" height="31" rx="6.5" fill="{SLATE}" stroke="{EDGE}"/>'
    return f'<rect width="32" height="32" rx="7" fill="{SLATE}"/>'


def mark(square=False):
    return f'<svg {XMLNS} viewBox="0 0 32 32">{tile(square)}{glyph(PARCH, GOLD)}</svg>'


def glyph_mono(colour='currentColor'):
    # The mark without its tile: the j and the gem, one colour
    return f'<svg {XMLNS} viewBox="8 4 16 24">{glyph(colour, colour)}</svg>'


# Wordmark text as outlines: Inter at weight 700, 18 units to the em, tracked -0.02em, as the site sets it
font = TTFont(ROOT / 'site' / 'fonts' / 'inter.woff2')
font = instantiateVariableFont(font, {'wght': 700})
upm = font['head'].unitsPerEm
cmap, gs, hmtx = font.getBestCmap(), font.getGlyphSet(), font['hmtx']
SIZE = 18
s = SIZE / upm
TRACK = -0.02 * SIZE


def run(text, x, baseline, draw=True):
    """SVG path data for text starting at x on baseline; returns (d, new x)."""
    ds = []
    for ch in text:
        g = cmap[ord(ch)]
        if draw:
            pen = SVGPathPen(gs)
            gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, baseline)))
            ds.append(pen.getCommands())
        x += hmtx[g][0] * s + TRACK
    return ' '.join(ds), x


def r(n): return f'{n:.2f}'.rstrip('0').rstrip('.')


def name_j(x, baseline, ink):
    """The drawn j with its letter box starting at x: the round-ended stroke and its dot."""
    k = SIZE / 1000
    cx, cy, rad = J_DOT
    return (f'<g transform="translate({r(x)} {r(baseline)}) scale({k}) translate(-450 -750)">'
            f'<path d="{J_NAME}" fill="none" stroke="{ink}" stroke-width="147" stroke-linecap="round"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{rad}" fill="{ink}"/></g>')


def lockup(ink, gold, tile_kind='light'):
    # Tile 28 high, a 10 gap to the j's ink, then the name. Baseline at 20.5 centres the text on the tile.
    base = 20.5
    overhang = 0.088 * SIZE   # the j's hook reaches this far before its letter box
    x0 = (38 if tile_kind else 0) + overhang
    jd = name_j(x0, base, ink)
    _, x = run('j', x0, base, draw=False)
    d1, x = run('sal', x, base)
    gw = 0.34 * SIZE
    gx = x + 0.07 * SIZE   # the stop's own room, as the site's CSS gives it
    gem = f'M{r(gx + gw/2)} {r(base - gw)}l{r(gw/2)} {r(gw/2)}-{r(gw/2)} {r(gw/2)}-{r(gw/2)}-{r(gw/2)}z'
    d2, x = run('io', gx + gw + 0.05 * SIZE, base)
    w = x - TRACK
    if tile_kind == 'mono':   # the j and gem alone, no tile, in the text's colour
        t = f'<g transform="scale(.875)">{glyph(ink, ink)}</g>'
    elif tile_kind:
        t = f'<g transform="scale(.875)">{tile(edge=tile_kind == "dark")}{glyph(PARCH, GOLD)}</g>'
    else:
        t = ''
    return (f'<svg {XMLNS} viewBox="0 0 {r(w)} 28" width="{r(w * 2)}" height="56">{t}{jd}'
            f'<path d="{d1}" fill="{ink}"/><path d="{gem}" fill="{gold}"/><path d="{d2}" fill="{gold}"/></svg>')


files = {
    'mark.svg': mark(),
    'mark-square.svg': mark(square=True),
    'mark-mono.svg': glyph_mono(),
    'lockup-light.svg': lockup(INK, DEEP, 'light'),
    'lockup-dark.svg': lockup(PARCH, GOLD, 'dark'),
    'lockup-mono.svg': lockup('currentColor', 'currentColor', 'mono'),
    'wordmark-light.svg': lockup(INK, DEEP, None),
    'wordmark-dark.svg': lockup(PARCH, GOLD, None),
}
# Tool icons: one glyph per tool in the mark's language (32 grid, round-ended strokes, the gold gem used once for what
# the tool does), on a tile in the tool's accent from its home page tile, and in one colour
def stroke(d, c, w=3):
    return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'


def gem_at(cx, cy, h, fill):
    return f'<path d="M{cx} {cy - h}l{h} {h}-{h} {h}-{h}-{h}z" fill="{fill}"/>'


FRAME = 'M6 6h14v14H6z'
TOOLS = {   # file name: (tile colour, glyph drawn in ink with the gem's colour, and with a gap cut around an overlapping gem)
    # Three platforms side by side; the one that fits stands tallest, wearing the gem like the mark's j
    'cms-picker': ('#674690', lambda ink, g, bg: stroke('M9 19v5M16 14v10M23 21v3', ink, 4) + gem_at(16, 7.5, 3, g)),
    # Tidy lines of text ending in the gem as their full stop, as the name does
    'clean-paste': ('#5e430b', lambda ink, g, bg: stroke('M8 10h16M8 16h13M8 22h9', ink) + gem_at(22.5, 21, 2.5, g)),
    # A picture's frame with the gem as the corner handle you drag to resize it, on the Image Resizer's teal
    'image-resizer': ('#2a6a61', lambda ink, g, bg: (
        f'<mask id="cut"><rect width="32" height="32" fill="#fff"/><path d="M22.5 16.6l5.9 5.9-5.9 5.9-5.9-5.9z"/></mask>'
        f'<g mask="url(#cut)">{stroke(FRAME, ink)}</g>' + gem_at(22.5, 22.5, 4.5, g))),
    # An arrow sending an old address on to the gem, its new home, on Redirect Import's berry
    'redirect-import': ('#8a3a4f', lambda ink, g, bg: stroke('M6 16h13M14 11l5 5-5 5', ink) + gem_at(25, 16, 3, g)),
    # A checklist of steps: two done, and the gem marking the one you're on
    'platform-playbook': ('#3b5a9a', lambda ink, g, bg: stroke(
        'M6 9.5l2.2 2.2L12 7.6M6 16l2.2 2.2L12 14.1M15 9.5h11M15 16h11M15 22.5h11', ink) + gem_at(8.5, 22.5, 3, g)),
    # Off the clock (/play/, not a tool, but in the same family): a loot bag holding the gem, on /play/'s green
    'off-the-clock': ('#3f6b3a', lambda ink, g, bg: stroke(
        'M13.6 10.6 12.4 7h7.2l-1.2 3.6M13.6 10.6C8.8 12.5 6.5 16 6.5 19.6c0 3.6 3 5.6 9.5 5.6s9.5-2 9.5-5.6c0-3.6-2.3-7.1-7.1-9zM13.4 10.6h5.2',
        ink, 2.8) + gem_at(16, 18.6, 3.4, g)),
}
(OUT / 'tools').mkdir(exist_ok=True)
for name, (bg, draw) in TOOLS.items():
    # The ink tile carries the dark tile's 1px edge everywhere, so it doesn't sink into a dark page
    rect = (f'<rect x=".5" y=".5" width="31" height="31" rx="6.5" fill="{bg}" stroke="{EDGE}"/>' if bg == INK
            else f'<rect width="32" height="32" rx="7" fill="{bg}"/>')
    files[f'tools/{name}.svg'] = f'<svg {XMLNS} viewBox="0 0 32 32">{rect}{draw(PARCH, GOLD, bg)}</svg>'
    files[f'tools/{name}-mono.svg'] = f'<svg {XMLNS} viewBox="2 2 28 28">{draw("currentColor", "currentColor", None)}</svg>'

for name, svg in files.items():
    (OUT / name).write_text(svg + '\n', encoding='utf-8', newline='\n')
(ROOT / 'site' / 'favicon.svg').write_text(mark(), encoding='utf-8', newline='\n')
# The home page's Updates rows, its tool tiles and the tool pages' tabs show each section's icon: the tool icons, Off the clock's bag, and the logo tile for
# Site, which keeps the dark tile's edge everywhere so it holds on the dark Updates box
icons = ROOT / 'site' / 'img' / 'icons'
icons.mkdir(parents=True, exist_ok=True)
for name in ('cms-picker', 'clean-paste', 'image-resizer', 'redirect-import', 'platform-playbook', 'off-the-clock'):
    (icons / f'{name}.svg').write_text(files[f'tools/{name}.svg'] + '\n', encoding='utf-8', newline='\n')
(icons / 'jsal-io.svg').write_text(f'<svg {XMLNS} viewBox="0 0 32 32">{tile(edge=True)}{glyph(PARCH, GOLD)}</svg>\n', encoding='utf-8', newline='\n')
print('\n'.join(files))
