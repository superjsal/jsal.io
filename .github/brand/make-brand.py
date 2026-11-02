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
# Tool icons: one picture per tool, line drawings with round ends and softened corners (line 2.2 on the 32 grid) and
# the gold gem used once for what the tool does, on a tile in the tool's accent from its home page tile, and in one
# colour. Each was drawn to fill a 32 grid and is set here at 70% about the tile's centre.
def stroke(d, c, w=2.2):
    return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'


def solid(d, c):
    # A filled shape (an arrowhead) with its points rounded by a stroke of its own colour
    return f'<path d="{d}" fill="{c}" stroke="{c}" stroke-width="1.45" stroke-linejoin="round"/>'


def gem(d, fill):
    return f'<path d="{d}" fill="{fill}"/>'


TOOLS = {   # file name: (tile colour, glyph drawn in ink with the gem's colour)
    # A podium: the platform that fits stands on the top step, wearing the gem like the mark's j
    'cms-picker': ('#674690', lambda ink, g: stroke(
        'M9.21 23.35Q7.95 23.35 7.95 22.09L7.95 17.96Q7.95 16.7 9.21 16.7L11.59 16.7Q12.85 16.7 12.85 15.44L12.85 14.46'
        'Q12.85 13.2 14.11 13.2L17.89 13.2Q19.15 13.2 19.15 14.46L19.15 17.89Q19.15 19.15 20.41 19.15L22.79 19.15'
        'Q24.05 19.15 24.05 20.41L24.05 22.09Q24.05 23.35 22.79 23.35zM12.85 16.7v6.65M19.15 19.15v4.2', ink)
        + gem('M16 6.9l2.1 2.1-2.1 2.1-2.1-2.1z', g)),
    # A clipboard holding clean lines, the gem its clip
    'clean-paste': ('#5e430b', lambda ink, g: stroke('M12.85 9.7H10.4v13.3h11.2V9.7h-2.45M13.2 15.3h5.6M13.2 19.15h3.5', ink)
                    + gem('M16 7.25l2.1 2.1-2.1 2.1-2.1-2.1z', g)),
    # A photo: its frame and hills, the gem the sun in its corner, on the Image Resizer's teal
    'image-resizer': ('#2a6a61', lambda ink, g: stroke('M8.65 10.4h14.7v11.9h-14.7zM8.65 19.5l4.55-4.55 3.5 3.5 2.1-2.1 4.55 4.55', ink)
                      + gem('M20.2 11.73l1.61 1.61-1.61 1.61-1.61-1.61z', g)),
    # A browser window, a hooked arrow inside taking the visitor on to the gem, their new page, on Redirect Import's berry
    'redirect-import': ('#8a3a4f', lambda ink, g: stroke(
        'M9.35 8.65H22.65a2.45 2.45 0 0 1 2.45 2.45V20.9a2.45 2.45 0 0 1-2.45 2.45H9.35a2.45 2.45 0 0 1-2.45-2.45V11.1'
        'a2.45 2.45 0 0 1 2.45-2.45zM10.75 20.55V18.94C10.75 16.28 12.15 14.95 14.6 14.95H15.3', ink)
        + solid('M19.36 14.95L15.16 11.87V18.03z', ink) + gem('M21.67 13.27l1.68 1.68-1.68 1.68-1.68-1.68z', g)),
    # An open book, the gem its bookmark
    'platform-playbook': ('#3b5a9a', lambda ink, g: stroke(
        'M16 12.15C13.9 10.75 11.1 10.4 8.65 11.1v10.5c2.45-.7 5.25-.35 7.35 1.05 2.1-1.4 4.9-1.75 7.35-1.05V11.1'
        'C20.9 10.4 18.1 10.75 16 12.15zM16 12.15v10.5', ink) + gem('M16 6.48l1.82 1.82-1.82 1.82-1.82-1.82z', g)),
    # Off the clock (/play/, not a tool, but in the same family): a loot bag holding the gem, on /play/'s green
    'off-the-clock': ('#3f6b3a', lambda ink, g: stroke(
        'M14.18 12.08 13.34 9.35h5.32l-.84 2.73M14.18 12.08C10.82 13.48 9 16 9 18.66c0 2.66 2.24 4.13 7 4.13s7-1.47 7-4.13'
        'c0-2.66-1.82-5.18-5.18-6.58zM14.04 12.08h3.92', ink) + gem('M16 15.44l2.38 2.38-2.38 2.38-2.38-2.38z', g)),
}
(OUT / 'tools').mkdir(exist_ok=True)
for name, (bg, draw) in TOOLS.items():
    # The ink tile carries the dark tile's 1px edge everywhere, so it doesn't sink into a dark page
    rect = (f'<rect x=".5" y=".5" width="31" height="31" rx="6.5" fill="{bg}" stroke="{EDGE}"/>' if bg == INK
            else f'<rect width="32" height="32" rx="7" fill="{bg}"/>')
    files[f'tools/{name}.svg'] = f'<svg {XMLNS} viewBox="0 0 32 32">{rect}{draw(PARCH, GOLD)}</svg>'
    files[f'tools/{name}-mono.svg'] = f'<svg {XMLNS} viewBox="5 5 22 22">{draw("currentColor", "currentColor")}</svg>'

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
