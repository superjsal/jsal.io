# jsal.io logo

The mark is a lowercase j on a slate tile, its dot cut as a gold gem; the gem nods to the achievements and the
Backpack. The wordmark is "jsal.io" in Inter Bold, tracked -0.02em, with the same gem as its full stop and "io" in
gold. Its j is a drawing, not Inter's: the one letter with round ends.

**Why the j is soft.** John Salvador's friends call him "Jay" Sal. The round-ended j is Jay; the firm, flat-ended
"sal" is Sal. Keep it that way: the j is the only soft letter, and the rest of the name stays Inter Bold as it is.

## Files

| File | Use |
|---|---|
| `mark.svg` | The icon: the browser tab (`site/favicon.svg` is this file), bookmarks, and anywhere square from 16px up |
| `mark-square.svg` | The phone home-screen icon: square corners, since iOS and Android round them |
| `mark-mono.svg` | The j and gem without the tile, in one colour (`currentColor`) |
| `lockup-light.svg`, `lockup-dark.svg` | The tile and the wordmark, for light and dark backgrounds (see below for where) |
| `lockup-mono.svg` | The j, the gem and the wordmark in one colour (`currentColor`), no tile |
| `wordmark-light.svg`, `wordmark-dark.svg` | The wordmark alone |
| `png/mark-16.png`, `-32`, `-512` | PNG exports of `mark.svg` |
| `png/mark-180.png` | PNG export of `mark-square.svg` |

The lockups' text is outlined, and their j is the same drawing the top bar shows, so they look the same without
Inter installed. `make-brand.py` rewrites every SVG here and `site/favicon.svg`; edit the mark in that script, not
in the files.

## Where each version goes

- **Square spaces** (the browser tab, the phone home screen, bookmarks): the tile. `site/favicon.svg` is
  `mark.svg`; `site/favicon.ico` (16 and 32) is an export of it, and `site/apple-touch-icon.png` (180, from
  `.github/build/og/icon.html`) is `mark-square.svg`, as are `site/icon-192.png` and `site/icon-512.png`, the icons
  in `site/site.webmanifest` for Android's Add to Home Screen (the 512 doubles as the maskable icon: the j and gem
  sit inside the middle 80% that Android keeps). Each page's head also sets the browser bar's colour to the page's
  (`theme-color`: cream #f5efe2 in light, slate #111318 in dark); a theme picked with the theme button wins.
- **Anywhere the name fits** (the site's top bar, the link previews' corner): the wordmark alone. The tab icon
  already shows the tile, so the page doesn't repeat it. In the top bar the name is real text: the j is drawn over
  the hidden letter (`.jsal-j` in `site/shell.css`: the stroke as `::before`, the dot as `::after`), and the gem is its
  "." clipped to a diamond (`.jsal-stop`), so copying it or reading it aloud gives "jsal.io". The link previews
  (`.github/build/og/og.html`) draw the j the same way.
- **The lockups** (tile and name together) are for places where neither appears on its own, such as an email
  signature.

## The j

Two drawings of one letter, both with round ends:

- **The icon's j** (`M20 15V20a4.5 4.5 0 0 1-9 0` on the 32 grid, stroke 4): short and bold, with a deep hook, so it
  reads at 16px. Its stem sits on whole pixels at 16px. The gem (`M20 5l3 3-3 3-3-3z`) is its dot.
- **The name's j** (in thousandths of an em, in a 900 × 1050 box whose baseline is at 750 and whose left edge is
  0.45em before the letter: `M585.5 277.5V780A100 100 0 0 1 435.5 866.6`, stroke 147, dot at 586, 57.5, r 77): as
  tall as Inter's j, its top stopping at the x-height and its hook bottoming out where Inter's does, turning a third
  past the quarter. The hook's tip reaches about 0.09em before the letter, a pixel or so left of Inter's tail at the
  top bar's 18px.

## The unfold

On the first page of a visit the top bar's name opens folded into the mark: the j, with the gem in place of its dot
and the rest of the name hidden. The gem lifts off, the j's own dot fills in behind it, and the gem arcs over the
name, turning half a turn and growing to full size, with "sal" showing in its wake. It lands on the baseline as the
full stop with a small swell, "io" and the menu arrow fade in, and a light runs across the gem and on over "io".
About 1.4 seconds, then the glint. Only the gem moves: the j holds still, and the letters keep their places
throughout, so nothing beside the logo moves.

- Each page's head script folds the name before the first paint (`html.jsal-intro` in `site/shell.css` hides the
  dot, "sal", "io" and the arrow and puts the gem on the j), and `site/nav.js` plays the rest. Later pages in the
  visit, pages loaded ahead and reduced motion show the name as it is.
- The last frame is the name every page shows, pixel for pixel: the unfold only moves the gem and reveals letters,
  then hands everything back to the stylesheet.

## Colours

| Part | Light background | Dark background |
|---|---|---|
| Tile | #111318 (slate), on both | #111318, with a 1px #3d424e edge so it doesn't sink into the page |
| Icon's j | #ece6d6 (parchment), on both | #ece6d6 |
| Gem | #e3b04b (gold), on both | #e3b04b |
| "jsal" | #1f1a12 (ink) | #ece6d6 |
| Gem stop and "io" | #7e5a00 (deep gold, 5.5:1 on parchment) | #e3b04b |

## Clear space and size

- **Clear space:** keep at least the gem's width clear on every side of the lockup, and between the tile and the
  wordmark's ink use 10/28 of the tile's height (10px at the top bar's 28px).
- **Smallest size:** the icon works down to 16px; below that, use the wordmark alone. The lockup's tile
  shouldn't go under 20px.
- **Don't:** recolour the gem to anything but gold (or the one-colour version), rotate it at rest, add effects or
  gradients, square off the j or round the other letters, or set the name as a standalone "JSAL" in capitals.
