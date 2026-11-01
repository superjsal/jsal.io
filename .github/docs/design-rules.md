# jsal.io design rules

How every page looks and behaves, in one place: the only copy of these rules (the project's `CLAUDE.md`
imports this file). `.github/` isn't served by GitHub Pages, so this is for people working on the site, not
visitors; `/design-system/` shows the same rules visually. Most are checked before each push by `check.py` and
`browser-check.mjs` (both in `.github/build/`); where a check exists it's named.

## Type

Three fonts, all self-hosted with `@font-face` in `shell.css`.

| Font | Used for |
|---|---|
| **Lora** (serif) | Every H1 and H2 on the public pages: page titles (`.jsal-title`), heroes, section headings, home tile names, "About …" headings, the platform pages' headline and sections, Privacy, the changelog's dates. |
| **Inter** (`--jsal-font`) | Everything else: body text, buttons, fields, top-bar links, H3s and smaller subheadings ("How to use it", quiz questions, platform names in lists, the platform pages' question headings), and small interface labels under 16px ("Checks", "Output size", "Export"). |
| **JetBrains Mono** | The small uppercase labels above headings (gold on the site's own pages: `.roles`, Privacy's date line, "Changelog"; muted on the tools: the CMS Picker's `.byline`), code, and keyboard keys. |

- A title's **gold word** is Lora italic 600 (`.hl`, or `em` on the home page and `/play/`): Clean *Paste*,
  CMS *Picker*, one *job*, Mostly *Warcraft*, Your *privacy*.
- **Exception, kept on purpose:** on the platform pages the gold word is "SEO" ("WordPress *SEO*: what you can
  change, and where"). Lora's italic capitals barely lean, so it reads as a lighter word rather than an
  obvious italic. It stays because "SEO" is the page's key word.
- **Every page title is one size:** Lora 700, 46px, line height 1.05, −0.02em, and 40px at 520px and under (home,
  Off the clock, Privacy, Changelog, 404, `/design-system/`). The longer titles of the CMS Picker and its platform
  pages also stop at 46px but shrink with the screen to 30px. A short page's empty space beside its title stays
  empty, the reading column's margin, unless something useful belongs there (the 404's links sit beside its
  title on wide screens).
- Content inside a tool (the visitor's own post in Clean Paste's editor) and the team Playbook's screens keep
  Inter.
- **Check:** `browser-check.mjs` fails on any visible H1 or H2 of 16px or more that isn't Lora. A new heading
  style needs Lora, or should be a real H3.

## Sizes and spacing

- **Ten text sizes, picked by role:**

  | Size | Role |
  |---|---|
  | 12px | Small labels: eyebrows, tags, section labels, the short name over each quiz answer |
  | 13px | Secondary text: hints, chips, footers |
  | 14px | Controls and boxed tips: buttons, top-bar links, answer tiles, notes and warnings, the tools' "for" line |
  | 15px | Reading text in the tools |
  | 17px | Leads and H3s (Inter 600/700): "How to use it", quiz questions, result card names |
  | 20px | The tool title in the top bar (17px at 420px and under), the platform cards' names |
  | 24px | Section headings: every H2, the CMS Picker's verdict line, the changelog's dates |
  | 30px | Home tile names and big callouts (Off the clock's line over the art, 24px on phones) |
  | 40 / 46px | Page titles (above); the long titles' clamp runs from 30px |

  Body and H3 are two pixels and a weight apart, so a subheading reads as one at a glance. **Exceptions**, each
  marked `style: allow` where it's set: the wordmark (18px, the logo's size), text boxes on touch screens (16px,
  below), the visitor's own headings in Clean Paste's preview, and the home tiles' miniature pictures.
  **Check:** `check.py` fails on any other px font size, and on half pixels. Relative sizes (inline code at
  `0.86em`) are fine.
- **Spacing values are even** (2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28…). Two kinds of odd value stay on
  purpose: the 1–3px padding inside small tags and pills, and row paddings that repeat down a list (the
  Playbook's sidebar, the achievement list, Clean Paste's checks), where rounding would change the list's
  height. Not checked; keep new spacing even.
- No named size or spacing tokens: the common values above are the scale.

## Colour

- Colours come from the `--jsal-*` tokens in `shell.css`, light and dark. Every text/background pair is at
  least 4.5:1; icons and other graphics people need to see at least 3:1. Light-mode gold text is
  `--jsal-accent` (#7e5a00); `--jsal-fill` (#e3b04b) is for fills and for text on images. The home tiles' own
  tint tokens stay in `index.html`, where they're used.
- **Gold is the site's accent: loud, and spent only where it matters.** Selected states, the main action, the
  one insight line, brand touches (".io", each title's gold word, the home page name and role line, eyebrow
  labels on the site's own pages, achievements) and the site's own text links (About sections, footers, notes).
  Never hover. Focus is the focus ring, not a gold fill. **On the tools the small labels are muted**, so gold
  stays for what you act on: the CMS Picker's "Updated" line is muted, and its section labels keep only the
  number in gold ("**01** · Find your fit").
- **The answer ramp**, for tags that say how well a platform does something: green = built in or automatic,
  blue = with an add-on or indirectly, terracotta = needs code, red = not possible. It reads as one scale
  wherever it appears, so a single tag's colour isn't a warning or information on its own.
- **Other roles:** green = fit or success; terracotta = a genuine warning (a missing or stale source, "may look
  blurry"); red (`--jsal-bad`) = not possible, and destructive actions (Clear, Remove); blue = information (a
  note, something in flight such as "waiting for publish") and links inside a tool's content (Clean Paste's
  editor, the Playbook's "How to" and sources); neutral for everything else (labels, type badges, icons, cost
  bands, states such as "not verified" or "unclear"). The team Playbook follows the same roles.
- **Check:** `check.py` fails on written-out colours, selected states without the `--jsal-selected-*` tokens,
  gold on hover, button corners off the scale and odd font weights. A deliberate exception carries a
  `/* style: allow (reason) */` comment on that line; never add one just to make the check pass.

## Building blocks

Corners `--jsal-radius-sm` / `-` / `-lg` / `-xl` / `-pill` / `-tile`; selected `--jsal-selected-*`; hover `--jsal-hover-line`;
focus `--jsal-focus-ring`; button weight `--jsal-btn-weight`. Use these instead of new values.

- **Corners by size of thing:** 4px small controls and chips inside a control, 6px buttons and fields, 8px cards,
  12px a tool's main panel (the quiz box, Clean Paste's editor, the Image Resizer's canvas), icon tiles and the
  achievement pop-up, 999px pills and round buttons, 22px the home and Off the clock tiles (18px at 520px and
  under, set on the token). Each step is larger than what sits inside it. **Check:** `check.py` fails any corner
  that isn't a token (or 0, 50%, `inherit`); the home tiles' miniature pictures and the backpack drawing carry
  `style: allow`.

- **One button and one switch, defined once in `shell.css`.** `.jsal-btn` is every page's button: outlined in
  `--jsal-line-hi` on a `--jsal-surface` fill, 14px at 600, 40px tall (44px on touch screens). `.primary` makes it
  the gold main action, `.small` (32px, 13px) suits dense screens such as the Playbook's forms, and `.danger`
  removes or clears (red text, a red edge and tint on hover). `.link` is a quiet action that reads as a link: no
  box, underlined, 24px tall, blue like the links inside a tool, red with `.danger` when it deletes (Clean Paste's
  "Start with a blank page", the Playbook's Comment, Edit item and Delete). A button sitting in running text or in a
  row of links (the quiz's "Also worth a look", the footers' Analytics) looks like the links around it instead.
  The analytics card's Allow and No thanks are `.jsal-btn.primary` and `.jsal-btn`. `.jsal-seg` is the switch for picking one of a few
  options (a sunk track; the chosen button `aria-pressed`, `aria-selected` or `.active`, in the selected gold). An
  app adds only layout (width, order, a compact height in a tight spot) and never its own look; a new button or
  switch uses these. The Image Resizer's two-line size presets are their own control, as they show a size and a
  use; the CMS Picker's chips, quiz answers and tiles are choices, not buttons, and keep their own rules.

- **A bordered pill is a choice** (compare chips, the comparison's pickers): it toggles, and selected is the gold
  edge and tint. Inside the CMS Picker quiz and its result, a choice is a rounded square (`--jsal-radius`) instead,
  like the answers, tiles and cards around it, so the quiz reads as one set of shapes; selected is the same gold. A set of links is not a choice, so it never wears pills: it's a text list (the home page footer's
  Platform guides) or a grid of equal-width tiles with the plain `--jsal-line` border, surface background and 500
  weight. Uneven pills stagger; equal tiles don't. **The one filled pill** is the home page's gold "Find your CMS":
  the page's main action, filled rather than bordered, so it never reads as a choice. It stays a pill to sit with the
  bento's round tiles; nothing else on the site uses that shape for an action.
- **A tick that goes with a choice** (the quiz's "In two or more languages") is a checkbox in a bordered row above
  the choices, selected with the same `--jsal-selected-*` tokens and gold edge as a pressed chip, the box itself in
  `accent-color: var(--jsal-accent)`; one focus ring on the row.

## Layout

- **The top bar never moves between pages:** the same `.jsal-top` markup everywhere (`check.py` compares it). A tool's name
  in the bar starts with its icon (22px, `.jsal-title-ico`, the same file as its tab icon), as in
  the logo menu; the icon drops out below 430px. From 360px up the bar keeps one row on every tool (at 420px and under the
  title is 17px and the gaps tighten), so the work area starts at the same height on each.
- **One distance under the top bar:** pages that open with a heading (home, Off the clock, the CMS Picker and
  its platform pages, Privacy, Changelog, 404) start their first thing at `--jsal-page-top` from `shell.css`
  (30px, 22px at 720px and under), flush with the logo's left edge: no optical indent on the mono line, the
  heading or the text under it; a new page of that kind uses it too. The tools' "for" line sits 16px under the bar, so the work area
  fills the first screen.
- **Tools fill the first screen;** the About section sits below the fold, reached by the top bar's About link.
  On phones the empty work box stretches to the bottom of the screen until there's content.
- **About sections** share the content's left edge: the column, with a 20px gutter on narrow screens.
- **Home page:** tools only, as a bento grid (six columns, 28px gaps, the wide tile swapping sides each row): the
  intro (two columns, at the shared distance under the bar) beside the CMS Picker (four); the Image Resizer (four)
  and Clean Paste (two); Say hi (two) and Updates (four). From 1279px down the intro, the CMS Picker, the Image
  Resizer and Updates take the full width and Clean Paste sits beside Say hi; that bento holds down to 600px, so a
  phone on its side keeps it, and only upright phones get one column. Tab order follows the screen.
  - **Each tile** is its soft tint (CMS Picker lilac, Image Resizer teal, Clean Paste honey; Say hi and Updates
    plain) with its name in Lora in a deep shade of the tint, and a real-looking piece of its tool drawn in the
    tools' own colours (`--jsal-surface`, ink and lines, so it changes with the theme as the tool does): the CMS
    Picker a tilted brick of one card per platform, each in that platform's own colours, logos only; the Image
    Resizer its crop editor (the box spans the photo at the output's shape and slides one way, as the tool's
    does) and output list; Clean Paste its clean HTML with a "Copied" status; Say hi an email draft; Updates the
    newest change in each of the three most recently changed parts as a stack of notes, written from the changelog
    by `updates.py`. No fake buttons, no clickable-looking quiz pieces and no favoured platform in the pictures.
  - **Each tool tile has its app icon as a watermark**, drawn large in the tile's ink at 14% with the gem in solid
    gold, lined up with its words; hidden on upright phones.
  - **Breakouts:** a piece may poke a little past its tile (about 14px at most), never within 16px of another
    tile, and two breakouts never crowd each other. Mix straight and tilted pieces.
  - **The pictures are decoration** (`aria-hidden`): each tile's link reads as its name and line, and Say hi's
    as "Say hi by email". Tiles have a least height, not a fixed one, and the words keep room clear of the
    pictures, so enlarged or spaced-out text grows the tile instead of sliding under a picture (WCAG 1.4.12).
  - **The Platform guides** are a quiet row of links in the footer, with Off the clock beside Privacy. Gaming parts
    live on `/play/`.
- **Every new home page tool or section is a bento box:** a `.tile` (22px corners, 26px padding; 18px and 20px
  on phones), in its own tint if it's a tool, plain like Updates and "Say hi" if it isn't. The home page is
  always bento boxes. Other pages keep an open layout, but may use a card in the same style (the tile's corners,
  padding and a tint, such as the app's own home tile colour) where it helps, for example around a hero; they don't
  become bento grids. The intro stays unboxed, so the byline keeps the shared distance and left edge.
- **The CMS Picker is quiz first:** the platform cards and the comparison table open on request. The quiz box
  reserves its first question's height (`.qz` min-height per column count) so the rows under it don't move at
  load or between questions.
- **A result card says everything it knows.** Each match lists every reason with its docs link, the facts, what
  tipped it and what counts against it, even when a card runs past a phone screen: no trimming the reasons two cards
  share, and no hiding long lists. The reasons are the evidence the pick stands on. The one exception: a card whose
  list is an exact copy of another card's collapses to "Fits your answers for the same reasons as …" (the full list
  is on the card above), and its box still says how it differs. The personas test checks this on every answer set.
- **A match that lacks a must-have goes under a divider.** When a match lacks something the first has built in (the
  need picked, languages, selling, a large catalogue), a divider sits above it: a label with a rule above, like a
  group heading ("Also possible, with an add-on", or with custom code, or "Missing something you need"), and one
  plain sentence per match from the table's verdicts ("Framer needs an add-on for selling online."). Above it every
  card has the must-haves and none reads "Worth a look"; under it the pill is neutral, not green, as it isn't a fit.
  When even the first match lacks one, the blue note above the cards says that nothing that fits has it all built in.
- **"Varies" is a "*" right after the tag** in the comparison, at every width: never a word on its own line, which made
  wide and narrow tags read unevenly down a row. The key above the table and the note under it say what it means,
  and screen readers hear "varies". The rarer "not verified" stays in words, under the tag.
- **The comparison on phones** is a card per question, one 44px line per platform (name, tag, "*"). Who's
  compared is said once, in a card at the top (each platform's name, match label and type), not on every row. With
  Tags on, an answer with a note is a button the width of its row, a muted chevron at its end; tapped, the note opens
  under the answer and stays open (no floating box, which covered the next row and vanished on scroll). Group
  headings are labels with a rule above, not boxes. On short screens with the full table (a phone on its side) the
  pinned header drops its type line. On touch screens the Top button shows only while scrolling back up.

## Motion

- Every animation has a `prefers-reduced-motion` fallback (`check.py` checks).
- **Page transitions are one slide everywhere** (`shell.css`): the old page drifts up and fades, the new one
  rises in, Back runs it downwards, and the top bar cross-fades in place. Only `shell.css` names
  view transitions (`check.py`). Firefox has no cross-document transitions and navigates plainly.
- **The home page's pictures move only when asked:** pointing at a tile or focusing it plays what its tool does
  three times, then it rests as the still picture (the cards wave with none singled out, the crop box slides the
  one way the tool lets it, the clean HTML and the email type themselves). Touch screens play each one once, when
  its tile reaches the middle of the screen. Updates stays still.
- Nothing moves on its own for more than 5 seconds (WCAG 2.2.2): the home pictures' one play on touch screens takes
  under 3 seconds.

## Touch and accessibility

- On touch screens (`pointer: coarse`) buttons are at least 44px tall (a smaller-looking control gets a 44px
  tap area with `::after`) and text boxes 16px (iPhones zoom into anything smaller and stay zoomed). Desktop
  targets are at least 24px.
- Wording that says click, drop or a shortcut carries a `data-touch` version (`data-touch="Tap"`, or
  `data-touch=""` to drop a shortcut), which `nav.js` swaps in on touch screens; the HTML keeps the desktop
  wording. Text written by an app's script checks `matchMedia("(pointer: coarse)")` itself.
- The tools are mostly used on desktop, so phone work fixes real problems rather than polishing.
- axe runs on every page in light and dark before each push (`browser-check.mjs --axe`).
