"""Writes the jsal.io logo's SVG files into this folder, and site/favicon.svg.

The mark is hand-written below (a 32-unit grid, so its edges land on whole pixels at 16px); the wordmark is
Inter Bold turned into outlines, so the lockups need no font. Needs fontTools (pip install fonttools brotli):
    python .github/brand/make-brand.py
The PNGs in png/ are exports of mark.svg (16, 32), mark-square.svg (180) and mark-large.svg (512).
"""
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent

SLATE, PARCH, INK, GOLD, DEEP = '#111318', '#ece6d6', '#1f1a12', '#e3b04b', '#7e5a00'
J = 'M16 8V19a4.5 4.5 0 0 1-9 0'
GEM = 'M24 18l4 4-4 4-4-4z'
FACETS = '<path d="M24 18l4 4h-8z" fill="#fff" opacity=".28"/><path d="M24 18v8l-4-4z" fill="#fff" opacity=".12"/>'
XMLNS = 'xmlns="http://www.w3.org/2000/svg"'

def mark(large=False, square=False):
    rect = f'<rect width="32" height="32" fill="{SLATE}"/>' if square else f'<rect width="32" height="32" rx="7" fill="{SLATE}"/>'
    return (f'<svg {XMLNS} viewBox="0 0 32 32">{rect}'
            f'<path d="{J}" fill="none" stroke="{PARCH}" stroke-width="4" stroke-linecap="round"/>'
            f'<path d="{GEM}" fill="{GOLD}"/>{FACETS if large else ""}</svg>')

def glyph_mono(colour='currentColor'):
    # The mark without its tile: the j and the gem, one colour
    return (f'<svg {XMLNS} viewBox="4 5 25 22"><path d="{J}" fill="none" stroke="{colour}" stroke-width="4" stroke-linecap="round"/>'
            f'<path d="{GEM}" fill="{colour}"/></svg>')

# Wordmark text as outlines: Inter at weight 700, 18 units to the em, tracked -0.02em, as the site sets it
font = TTFont(ROOT / 'site' / 'fonts' / 'inter.woff2')
font = instantiateVariableFont(font, {'wght': 700})
upm = font['head'].unitsPerEm
cmap, gs, hmtx = font.getBestCmap(), font.getGlyphSet(), font['hmtx']
SIZE = 18
s = SIZE / upm
TRACK = -0.02 * SIZE

def run(text, x, baseline):
    """SVG path data for text starting at x on baseline; returns (d, new x)."""
    ds = []
    for ch in text:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, baseline)))
        ds.append(pen.getCommands())
        x += hmtx[g][0] * s + TRACK
    return ' '.join(ds), x

def r(n): return f'{n:.2f}'.rstrip('0').rstrip('.')

def lockup(ink, gold, tile=True):
    # Tile 28 high, a 10 gap, then "jsal", the gem stop, "io". Baseline at 20.5 centres the text on the tile.
    base = 20.5
    x0 = 38 if tile else 0
    d1, x = run('jsal', x0, base)
    gw = 0.34 * SIZE
    gx = x + 0.07 * SIZE   # the stop's own room, as the site's CSS gives it
    gem = f'M{r(gx + gw/2)} {r(base - gw)}l{r(gw/2)} {r(gw/2)}-{r(gw/2)} {r(gw/2)}-{r(gw/2)}-{r(gw/2)}z'
    d2, x = run('io', gx + gw + 0.05 * SIZE, base)
    w = x - TRACK
    if tile == 'mono':   # the j and gem alone, no tile, in the text's colour
        tile_svg = (f'<g transform="scale(.875)"><path d="{J}" fill="none" stroke="{ink}" stroke-width="4" stroke-linecap="round"/>'
                    f'<path d="{GEM}" fill="{ink}"/></g>')
    elif tile:
        tile_svg = (f'<g transform="scale(.875)"><rect width="32" height="32" rx="7" fill="{SLATE}"/>'
                    f'<path d="{J}" fill="none" stroke="{PARCH}" stroke-width="4" stroke-linecap="round"/><path d="{GEM}" fill="{GOLD}"/></g>')
    else:
        tile_svg = ''
    return (f'<svg {XMLNS} viewBox="0 0 {r(w)} 28" width="{r(w * 2)}" height="56">{tile_svg}'
            f'<path d="{d1}" fill="{ink}"/><path d="{gem}" fill="{gold}"/><path d="{d2}" fill="{gold}"/></svg>')

files = {
    'mark.svg': mark(),
    'mark-large.svg': mark(large=True),
    'mark-square.svg': mark(large=True, square=True),
    'mark-mono.svg': glyph_mono(),
    'lockup-light.svg': lockup(INK, DEEP),
    'lockup-dark.svg': lockup(PARCH, GOLD),
    'lockup-mono.svg': lockup('currentColor', 'currentColor', tile='mono'),
    'wordmark-light.svg': lockup(INK, DEEP, tile=False),
    'wordmark-dark.svg': lockup(PARCH, GOLD, tile=False),
}
for name, svg in files.items():
    (OUT / name).write_text(svg + '\n', encoding='utf-8', newline='\n')
(ROOT / 'site' / 'favicon.svg').write_text(mark(), encoding='utf-8', newline='\n')
print('\n'.join(files))
