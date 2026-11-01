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
| `lockup-light.svg`, `lockup-dark.svg` | The tile and the wordmark, for light and dark backgrounds (see below for where) |
| `lockup-mono.svg` | The j, the gem and the wordmark in one colour (`currentColor`), no tile |
| `wordmark-light.svg`, `wordmark-dark.svg` | The wordmark alone |
| `png/mark-16.png`, `-32`, `-180`, `-512` | PNG exports of the icon |

The lockups' text is outlined, so they look the same without Inter installed. `make-brand.py` rewrites every
SVG here and `site/favicon.svg`; edit the mark in that script, not in the files.

## Where each version goes

- **Square spaces** (the browser tab, the phone home screen, bookmarks): the tile. `site/favicon.svg` is
  `mark.svg`; `site/favicon.ico` (16 and 32) and `site/apple-touch-icon.png` (180, from
  `.github/build/og/icon.html`) are exports of it.
- **Anywhere the name fits** (the site's top bar, the link previews' corner): the wordmark alone. The tab icon
  already shows the tile, so the page doesn't repeat it. In the top bar the name is real text, and the gem is its
  "." clipped to a diamond (`.jsal-stop` in `site/shell.css`), so copying it or reading it aloud gives "jsal.io".
- **The lockups** (tile and name together) are for places where neither appears on its own, such as an email
  signature.

## The unfold

On the first page of a visit the top bar's name opens as the tile's mark, a J and its gem, without the tile, with
the menu arrow tucked in after the gem. The J sinks straight down through the line into the lowercase j of jsal
(its ends flatten and its dot fades in), the gem slides right with "sal" fading in just behind it, "io" fades in,
the arrow travels out to its place, and a light runs across the gem and on over "io". About two seconds in all;
the letters keep their places throughout, so nothing beside the logo moves.

- Each page's head script folds the name before the first paint (the J is drawn by CSS until `site/nav.js` takes
  over and animates it); later pages in the visit, pages loaded ahead and reduced motion show the name as it is.
- The top bar's j is a drawing on every page (`.jsal-j::before` in `site/shell.css`, a mask over the hidden letter,
  which stays in the text for copying and screen readers), and the unfold draws each frame into that same mask, so
  it starts on the folded J and ends on exactly the j every page shows: nothing is swapped, and the name looks the
  same on every page. Swapping a drawing for the font's j showed on Windows, which draws text and drawings differently.

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
