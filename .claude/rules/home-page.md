---
paths:
  - "src/pages/index.astro"
  - "src/components/Updates.astro"
  - "src/lib/updates.mjs"
---

# Home page design

These are part of the site's design rules (`design-rules.md` beside this file), kept here so they load only for
home page work.

- **Home page:** tools only, as a bento grid (six columns, 32px gaps, the wide tile swapping sides each row): the
  intro (two columns, at the shared distance under the bar) beside the CMS Picker (four); the Image Resizer (four)
  and Clean Paste (two); Say hi (two) and Redirect Import (four); Updates across the bottom (six). From 1279px down the
  intro, the CMS Picker, the Image Resizer, Redirect Import and Updates take the full width and Clean Paste sits beside
  Say hi; that bento holds down to 600px, so a
  phone on its side keeps it, and only upright phones get one column. Tab order follows the screen. Say hi never sits above a tool: beside one is fine,
  but on upright phones, one tile per row, it moves after every tool, just before Updates (by CSS `order`, so there
  alone the keyboard still reaches it before Redirect Import, its place on wider screens). Every tool tile
  reads the same way at every width: its name and one line at the top left, then the picture.
  - **Each tile** is its soft tint (CMS Picker lilac, Image Resizer teal, Clean Paste honey, Redirect Import berry; Say hi and
    Updates plain) with its name in Lora in a deep shade of the tint, and a real-looking piece of its tool drawn in the
    tools' own colours (`--jsal-surface`, ink and lines, so it changes with the theme as the tool does): the CMS
    Picker a tilted brick of one key per platform, each in that platform's own colours with a darker edge under it, logos
    only; the Image
    Resizer its crop editor and the files it made from that one photo (the box takes each size's shape in
    turn and each size lands in the output list); Clean Paste its Text | HTML switch over a short raid note, resting halfway through its wipe (the formatted text left of a gold line, its HTML right of it, as the switch reads); Redirect Import its sheet of old and new addresses with each row's check (ready, needs you, left out) and, beside it, the file it writes for the platform, both straight, the file poking out of the tile's bottom; Say hi an email draft; Updates the
    newest change in each of the three most recently changed parts as a plain list under its heading (rows with a
    rule between them, never cards, as they aren't links; nothing tilted, as people read them), read from the
    changelog as the page builds (`src/lib/updates.mjs`). No fake buttons, no clickable-looking quiz pieces and no favoured platform in the pictures.
  - **Each tool tile has its app icon as a watermark**, drawn large in the tile's ink at 7% with the gem in gold at
    35% (45% in dark mode, where fainter gold reads as brown), a texture that never draws the eye before the picture, behind the tile's picture and never under its words, and whole, so its shape reads (the CMS Picker's podium
    tilted like its keys, under the words and left of the keys, upright on phones on their side); set per breakpoint, and
    hidden on upright phones. Updates has one too, a faint stack of notes with the gem on the newest, in the open middle
    between its words and its list (above the words where there's no room); Say hi stays plain.
  - **Breakouts:** a piece may poke a little past its tile (about 14px at most), never within 16px of another
    tile, never into the page's side gutter (nothing reaches past the column at any width, and the column's gutter
    widens for a notch: `viewport-fit=cover` with the safe-area insets), and two breakouts never crowd each other.
    So a tile on the column's edge pokes up, down or towards its neighbour, and a piece is either inside its tile or
    clearly out of it, never sitting across its edge. Mix straight and tilted pieces.
  - **The pictures are decoration** (`aria-hidden`): each tile's link reads as its name and line, and Say hi's
    as "Say hi by email". Tiles have a least height, not a fixed one, and the words keep room clear of the
    pictures, so enlarged or spaced-out text grows the tile instead of sliding under a picture (WCAG 1.4.12).
  - **The Platform guides** are a quiet row of links in the footer, with Off the clock beside Privacy. Gaming parts
    live on `/play/`.
- **Every new home page tool or section is a bento box:** a `.tile` (22px corners, 24px padding; 18px and 20px
  on phones; anything lined up with the padding reads the tile's `--pad`), in its own tint if it's a tool, plain like Updates and "Say hi" if it isn't. The home page is
  always bento boxes. Other pages keep an open layout, but may use a card in the same style (the tile's corners,
  padding and a tint, such as the app's own home tile colour) where it helps, for example around a hero; they don't
  become bento grids. The intro stays unboxed, so the byline keeps the shared distance and left edge.
- **The home page's pictures move only when asked:** pointing at a tile or focusing it plays what its tool does
  three times, then it rests as the still picture (the CMS Picker plays three needs in turn instead, each named in a
  pill and pressing the three keys the real quiz ranks first for it, so no platform is favoured; the crop box takes
  each size's shape in turn, the formatted text wipes into its HTML, the email types itself, and Redirect Import's rows are checked one at a time, each
  ready row's line landing in the file and the row with a problem getting its "!" and note instead). Touch screens play each one once, when
  its tile reaches the middle of the screen (the CMS Picker one need, picked at random). Updates stays still. When the
  quiz's scoring changes, check the three needs still light its top three (`candidates()` in `cms-picker/score.js`).
