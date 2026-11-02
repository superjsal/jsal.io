# jsal.io logo

The mark is a lowercase j on a slate tile, its dot cut as a gold gem; the gem nods to the achievements and the
Backpack. The wordmark is "jsal.io" in Inter Bold, tracked -0.02em, with the same gem as its full stop and "io" in
gold. Its j is a drawing, not Inter's: the one letter with round ends.

**Why the j is soft.** John Salvador's friends call him J Sal: the letter J on its own, then Sal. The name is drawn the
way they say it: the j, round-ended, is the letter said by itself; the firm, flat-ended "sal" is Sal. Keep it that way:
the j is the only soft letter, and the rest of the name stays Inter Bold as it is.

## Bios

Ready to paste, in the site's voice. Keep them to what the site says: no years, places or employer names.

**25 words**

> John Salvador is a web developer in technical SEO. At jsal.io he builds small, free browser tools that each do one
> job well.

**50 words**

> John Salvador is a web developer working in technical SEO, putting SEO fixes and content onto whatever CMS a
> client runs. At jsal.io he publishes the small browser tools he builds for that work: a CMS Picker, Clean Paste
> and an Image Resizer. Nothing is uploaded, nothing is sold.

**100 words**

> John Salvador is a web developer working in technical SEO. By day he works on the implementation side: taking SEO
> specialists' technical fixes and content and putting them onto whatever CMS a client runs. At jsal.io he publishes
> the small browser tools he builds for the jobs around a website. The CMS Picker matches people to a platform and
> shows what each can change for SEO; Clean Paste turns text from Word or Google Docs into clean HTML; the Image
> Resizer resizes, crops and converts images. Each does one job, in the browser, for free. Off the clock, it's
> Warcraft.

**First person** (LinkedIn's About, where third person reads oddly)

> I'm a web developer in technical SEO: I put SEO fixes and content onto whatever CMS a client runs. On the side I
> build small browser tools that do one job each, free at jsal.io. Friends call me J Sal.

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
| `tools/<tool>.svg`, `tools/<tool>-mono.svg` | The tool icons (below), in colour and in one colour (`currentColor`) |
| `kit/` | The brand kit as PNGs, rendered from `.github/build/og/kit.html` by `make-og.ps1` (below) |

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
  already shows the tile, so the page doesn't repeat it. In the top bar the name is real text: the j is an inline
  SVG in the top bar's markup, laid over the hidden letter (`.jsal-j-draw`, styled in `site/shell.css`), and the gem is
  its "." clipped to a diamond (`.jsal-stop`), so copying it or reading it aloud gives "jsal.io". Being markup rather
  than a CSS mask, the j is as sharp as the text on high-density screens (a mask was painted softer, so handing over
  between the two showed as the j shifting). The link previews (`.github/build/og/og.html`) draw it as a mask, which is
  fine for a still image.
- **Signing off a page:** the mark, still (no unfold), at the size of the text it sits in: before the © line in the
  home and `/play/` footers and at the start of every "Made by" line (the tools, the platform pages, Privacy,
  `/design-system/`). It's `.jsal-mark` in `site/shell.css`, with the dark tile's edge on dark pages. The top of the
  page still shows the name alone; the mark closes a page, it doesn't head it.
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

On the first page of a visit the top bar's name opens folded into the tab icon's mark: the icon's short j with its
deep hook, the gem as its dot, the menu arrow tucked just after it, and the rest of the name hidden. The j's curve
shortens into the name's taller j (round ends throughout) while its stem rises, speeding up, until its top touches
the gem. The top pinches off as the j's own dot and shoots up, throwing the gem over the name on a high arc, turning
half a turn and growing to full size, with "sal" showing in its wake; the dot flies a little past its place, dips
just below it and settles, and the arrow slides out ahead of the name. The gem lands on the baseline as the full
stop with a small swell, "io" slides out from behind it, and a light runs across the gem and on over "io". About
1.3 seconds, then the glint. The letters keep their places throughout, so nothing beside the logo moves.
Each part is set off by the one before: the hook feeds the stem, the stem makes the dot, the dot sends the gem, and
the gem lets out "io".

- The dot's dip is kept small on purpose: at 18px only one row of pixels separates it from the stem, and a deeper
  dip fills that row at 100% and 150% scaling, so the j blinks into one bar.

- The j's inline SVG holds both shapes: the name's path (`.jsal-j-line`) and the icon's short j (`.jsal-j-fold`).
  Each page's head script folds the name before the first paint (`html.jsal-intro` in `site/shell.css` shows the
  short j, hides the dot, "sal" and "io", and puts the gem on the j and the arrow after it), and `site/nav.js` plays
  the rest, reshaping the short path itself, frame by frame, until it is exactly the name's path, which then takes
  its place. Later pages in the visit, pages loaded ahead and reduced motion show the name as it is.
- Nothing is swapped mid-way, so the name ends pixel for pixel as every page shows it.

## Tool icons

One icon per tool on the home page: a small line drawing of what the tool does, with round ends and softened corners
(line 2.2 on the 32 grid), and the gold gem used once for its job, on a tile in the tool's accent from its home page
tile. Each picture was drawn to fill a 32 grid and sits on the tile at 70%, so every icon has the same margin.
`make-brand.py` writes them.

| Tool | Tile | Glyph |
|---|---|---|
<<<<<<< HEAD
| CMS Picker (`cms-picker`) | plum #674690 | Three platforms side by side; the one that fits stands tallest, wearing the gem like the mark's j |
| Clean Paste (`clean-paste`) | deep gold #5e430b (darker than the home tile's gold, so the gold gem keeps its contrast) | Tidy lines of text ending in the gem as their full stop |
| Image Resizer (`image-resizer`) | teal #2a6a61, from the home page tile's teal | A picture's frame with the gem as the corner handle |
| Platform Playbook (`platform-playbook`) | blue #3b5a9a | A checklist: two steps done, the gem marking the current one |
=======
| CMS Picker (`cms-picker`) | plum #674690 | A podium with three places; the platform that fits stands on the top step, wearing the gem like the mark's j |
| Clean Paste (`clean-paste`) | deep gold #5e430b (darker than the home tile's gold, so the gold gem keeps its contrast) | A clipboard holding clean lines, the gem its clip |
| Image Resizer (`image-resizer`) | teal #2a6a61, from the home page tile's teal | A photo, its frame and hills, with the gem as the sun in its corner |
| Platform Playbook (`platform-playbook`) | blue #3b5a9a | An open book, the gem its bookmark |
>>>>>>> f35730e (Site: new tool icons, a small picture of each tool's job)
| Off the clock (`off-the-clock`) | green #3f6b3a, as `/play/` uses it | A loot bag holding the gem, a nod to the Backpack. Not a tool, so it's not in the kit's tool row |

The site's logo menu draws them inline (`APPS` in `site/nav.js`, its tile colours the `--jsal-tool-*` tokens in
`site/shell.css`), with the menu's Home row as the logo tile itself and Off the clock as the loot bag.
The home page's tool tiles start each name with its icon, Updates starts each row with one, and each tool page's
browser tab shows its own (`site/img/icons/`, written by `make-brand.py`; the CMS Picker's platform pages share
its icon, and home, Privacy, the changelog, 404 and `/design-system/` keep the logo, as does the home-screen
icon everywhere). Outside the site they're in the brand kit. Change a glyph in both places: `make-brand.py` and `nav.js`.

## Brand kit

PNGs in `kit/`, made for the places the name shows up outside the site. `.github/build/og/make-og.ps1` renders them from
`kit.html`, which draws on the files in this folder, so re-running it after a change here keeps them in step.

| File | Size | Where it goes |
|---|---|---|
| `linkedin-banner.png` | 1584 × 396 | LinkedIn profile banner. The content sits on the right two thirds, clear of the profile photo |
| `github-social-preview.png` | 1280 × 640 | GitHub: the repo's Settings → Social preview |
| `avatar-800.png` | 800 × 800 | Profile pictures (GitHub, LinkedIn, Discord). Square; round crops keep the j and gem whole |
| `tool-<tool>-512.png` | 512 × 512 | Each tool icon, with transparent corners |
| `signature-light.png`, `signature-dark.png` | 369 × 112 | The lockup for an email signature at twice its size, so it's sharp on high-density screens: show it 185 × 56. Light for white emails, dark for dark ones |

## Colours

| Part | Light background | Dark background |
|---|---|---|
| Tile | #111318 (slate), on both | #111318, with a 1px edge so it doesn't sink into the page: #3d424e in the brand files, #6b7180 on the site in dark mode (`--jsal-tool-edge`, `--jsal-mark-edge`), 3:1 on every dark surface |
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
