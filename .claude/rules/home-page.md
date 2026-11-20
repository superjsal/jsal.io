---
paths:
  - "src/pages/index.astro"
  - "src/components/Updates.astro"
  - "src/lib/updates.mjs"
---

# Home page design

These are part of the site's design rules (`design-rules.md` beside this file), kept here so they load only for
home page work.

- **The home page is a bento grid with one big opening tile** (John, 19 Nov 2026). In the redesign he was open to
  leaving the bento, turned down three plainer layouts (four doors, a side column, job-first rows: too plain, too
  much text, missing the product pictures, "still just boxes"), had full-width colour bands built, and then chose
  this improved bento over them: it keeps everything in view in a screen and a half and the character of the
  tilted, overlapping pieces. Don't re-propose the bands or the plainer layouts.
- **The grid:** six columns, 32px gaps. The CMS Picker's tile takes the whole first row and carries the page's
  headline; then the Image Resizer (four columns) and Clean Paste (two); Say hi (two) and Redirect Import (four);
  Updates across the bottom (six). From 1279px down every wide tile takes the full width and Clean Paste sits beside
  Say hi; that bento holds down to 600px, so a phone on its side keeps it, and only upright phones get one column.
  Tab order follows the screen. Say hi never sits above a tool: beside one is fine, but on upright phones, one tile
  per row, it moves after every tool, just before Updates (by CSS `order`, so there alone the keyboard still reaches
  it before Redirect Import, its place on wider screens).
  - **The opening tile** is lilac: the role line, the headline (Lora 64px, the one line on the site set larger than
    a page title; 40px from 1279px down, 30px between 600 and 860px, 40px on upright phones), the intro and the gold
    "Find your CMS" pill on the left, the platform keys on the right (under the words on upright phones). The pill is
    the tile's link. The tile has no watermark, as the headline sits where it was.
  - **Every other tool tile reads the same way at every width:** its name and one line at the top left, then the
    picture. Each is its soft tint (Image Resizer teal, Clean Paste honey, Redirect Import berry; Say hi and Updates
    plain) with its name in Lora in a deep shade of the tint. Each tint is also the colour its tool wears on its own
    page (design-rules.md, Colour), so a change to a tile's tint is a change to that tool's page too.
  - **Each picture** is a real-looking piece of its tool drawn in the tools' own colours (`--jsal-surface`, ink and
    lines, so it changes with the theme as the tool does): the CMS Picker a tilted brick of one key per platform,
    each in that platform's own colours with a darker edge under it, logos only; the Image Resizer its crop editor
    and the files it made from that one photo; Clean Paste its Text | HTML switch over a short raid note with a
    gold line through it; Redirect Import its sheet of old and new addresses with each row's check (ready, needs
    you, left out) and, beside it, the file it writes for the platform, both straight, the file poking out of the
    tile's bottom; Say hi an email draft; Updates the newest change in each of the three most recently changed
    parts as a plain list under its heading (rows with a rule between them, never cards, as they aren't links),
    read from the changelog as the page builds (`src/lib/updates.mjs`). No fake buttons and no favoured platform.
  - **Each tool tile but the first has its app icon as a watermark**, drawn large in the tile's ink at 7% with the
    gem in gold at 35% (45% in dark mode, where fainter gold reads as brown), behind the tile's picture and never
    under its words, and whole, so its shape reads; set per breakpoint, and hidden on upright phones. Updates has
    one too, a faint stack of notes; Say hi stays plain.
  - **Breakouts:** a piece may poke a little past its tile (about 14px at most), never within 16px of another
    tile, never into the page's side gutter (nothing reaches past the column at any width, and the column's gutter
    widens for a notch: `viewport-fit=cover` with the safe-area insets), and two breakouts never crowd each other.
    Mix straight and tilted pieces.
  - **Tiles have a least height, not a fixed one**, and the words keep room clear of the pictures, so enlarged or
    spaced-out text grows the tile instead of sliding under a picture (WCAG 1.4.12).
  - **The Platform guides** are a quiet row of links in the footer, with Off the clock beside Privacy. Gaming parts
    live on `/play/`.
- **A tile's name is its link, and the link covers the whole tile** (`.tile-link`, its `::after` laid over the tile),
  so a click anywhere on a tile opens its tool; the pieces that can be played with sit above that cover. The tile
  itself is a section, not a link, so the pieces can take clicks of their own. Say hi works the same way with its
  email link.
- **The pictures can be played with** (John, 19 Nov 2026: "a bit more interactive/playful"). Everything in them
  either does something real or visibly answers the pointer, so nothing invites a click that does nothing:
  - each CMS key sinks under the pointer, goes down when pressed and opens that platform's guide (they're links,
    named for screen readers, kept out of the tab order as the footer lists the same 14);
  - a size under the Image Resizer's photo reshapes the crop box and marks its file in the list;
  - Clean Paste's gold line follows the pointer across the note (`--w`), wiping it between text and HTML;
  - a ready row in Redirect Import's sheet lights up with the line it wrote in the file.
  The size picker, the line and the rows are pointer-only decoration (`aria-hidden`): each tile's link and the
  platform keys are the way in for keyboards and screen readers.
- **The pictures also play by themselves when asked:** pointing at a tile (or focusing its link) plays what its tool
  does three times, then it rests as the still picture (the CMS Picker plays three needs in turn, each named in a
  pill above the keys from 1280px and pressing the three keys the real quiz ranks first for it, so no platform is
  favoured; the crop box takes each size's shape in turn, the formatted text wipes into its HTML, the email types
  itself, and Redirect Import's rows are checked one at a time). Touch screens play each one once, when its tile
  reaches the middle of the screen (the CMS Picker one need, picked at random). Updates stays still. Once a pointer
  is on a piece its tile's play stops (`.hands`) and it answers the pointer instead. When the quiz's scoring
  changes, check the three needs still light its top three (`candidates()` in `cms-picker/score.js`).
- **Every new home page tool or section is a bento box:** a `.tile` (22px corners, 24px padding; 18px and 20px
  on phones; anything lined up with the padding reads the tile's `--pad`), in its own tint if it's a tool, plain
  like Updates and "Say hi" if it isn't. Other pages keep an open layout.
