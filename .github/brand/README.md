# jsal.io logo

The mark is a lowercase j on a slate tile, with the full stop cut as a gold gem. The full stop is the "." of
jsal.io, and the gem nods to the achievements and the Backpack. The wordmark is "jsal.io" in Inter Bold,
tracked -0.02em, with the same gem as its full stop and "io" in gold.

## Files

| File | Use |
|---|---|
| `mark.svg` | The icon at small sizes: the browser tab (`site/favicon.svg` is this file), 16–64px |
| `mark-large.svg` | The icon from about 96px up: the gem gets two light facets |
| `mark-square.svg` | The phone home-screen icon: square corners, since iOS and Android round them |
| `mark-mono.svg` | The j and gem without the tile, in one colour (`currentColor`) |
| `lockup-light.svg`, `lockup-dark.svg` | The tile and the wordmark, for light and dark backgrounds |
| `lockup-mono.svg` | The j, the gem and the wordmark in one colour (`currentColor`), no tile |
| `wordmark-light.svg`, `wordmark-dark.svg` | The wordmark alone |
| `png/mark-16.png`, `-32`, `-180`, `-512` | PNG exports of the icon |

The lockups' text is outlined, so they look the same without Inter installed. `make-brand.py` rewrites every
SVG here and `site/favicon.svg`; edit the mark in that script, not in the files.

On the site the top bar draws the lockup with CSS (`.jsal-brand` in `site/shell.css`): the tile is the same
drawing as `favicon.svg`, and the gem is the "." of the text clipped to a diamond, so copying the name or
reading it aloud still gives "jsal.io". `site/favicon.ico` (16 and 32) and `site/apple-touch-icon.png` (180,
from `.github/build/og/icon.html`) are exports of the mark. The link previews draw it from `og.html`.

## Colours

| Part | Light background | Dark background |
|---|---|---|
| Tile | #111318 (slate), on both | #111318, with a 1px #3d424e edge so it doesn't sink into the page |
| j | #ece6d6 (parchment), on both | #ece6d6 |
| Gem | #e3b04b (gold), on both | #e3b04b |
| "jsal" | #1f1a12 (ink) | #ece6d6 |
| Gem stop and "io" | #7e5a00 (deep gold, 5.5:1 on parchment) | #e3b04b |

## Clear space and size

- **Clear space:** keep at least the gem's width (a quarter of the tile) clear on every side of the lockup,
  and between the tile and the wordmark use 10/28 of the tile's height (10px at the top bar's 28px).
- **Smallest size:** the icon works down to 16px; below that, use the wordmark alone. The lockup's tile
  shouldn't go under 20px.
- **Don't:** recolour the gem to anything but gold (or the one-colour version), rotate it, add effects or
  gradients, or set the name as a standalone "JSAL" in capitals.
