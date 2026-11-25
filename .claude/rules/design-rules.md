---
paths:
  - "site/**/*.css"
  - "site/**/*.js"
  - "site/**/*.svg"
  - "src/**"
  - ".github/build/og/**"
  - ".github/brand/**"
---

# jsal.io design rules

How every page looks and behaves: the only copy of these rules. They load whenever a session works on the site's
pages, styles, scripts, icons or share images. The home page's and the CMS Picker's own rules are in `home-page.md`
and `cms-picker-design.md` beside this file, which load with those pages' files. `.claude/` isn't served, so this
is for people working on the site, not visitors; `/design-system/` shows the same rules visually. Most are checked before each push by `check.py` and
`browser-check.mjs` (both in `.github/build/`); where a check exists it's named.

## Type

Three fonts, all self-hosted with `@font-face` in `shell.css`. Lora, the serif the headings used to be set in, is
gone from the site (John, 20 Nov 2026: "let's fix it", once the home page and the jsal.ui page were in Outfit and
the tools' Lora headings no longer matched them). Don't bring a serif back for headings.

| Font | Used for |
|---|---|
| **Outfit** (the jsal.ui addon's own font) | Every H1 and H2 on the public pages: page titles (`.jsal-title`), section headings, "About …" headings, the platform pages' headline and sections, Privacy, the changelog's dates, and the names and buttons on the home page and the jsal.ui page. Also the line a tool leads with: the CMS Picker's quiz question, its verdict line and each result card's name, and the heading on a tool's empty page ("Paste your content"). |
| **Inter** (`--jsal-font`) | Everything that is read: body text, buttons, fields, top-bar links, H3s and smaller subheadings ("How to use it", platform names in lists, the platform pages' question headings), and small interface labels under 16px ("Checks", "Output size", "Export"). Outfit is weak at 13 to 15px, so it never sets reading text. |
| **JetBrains Mono** | The small uppercase labels above headings (gold on the site's own pages: Privacy's date line, "Changelog"; muted on the tools: the CMS Picker's `.byline`), code, and keyboard keys. |

- A title's **gold word** is the same Outfit 700, upright, in gold (`.hl`, or `em`): Clean *Paste*, CMS *Picker*,
  one *job*, Mostly *Warcraft*, Your *privacy*. Outfit has no italic, so the word is marked by colour alone; on the
  platform pages the gold word is "SEO".
- **The one very large line** is a stage's name on the home page and the jsal.ui page: Outfit 800, up to 72px,
  shrinking with the stage to 36px (`style: allow`). Their headlines lead the page above it at the page-title
  size.
- **Every other page title is one size:** Outfit 700, 46px, line height 1.05, −0.02em, and 40px at 520px and under (
  Off the clock, Privacy, Changelog, 404, `/design-system/`). The longer titles of the CMS Picker and its platform
  pages also stop at 46px but shrink with the screen to 30px. A short page's empty space beside its title stays
  empty, the reading column's margin, unless something useful belongs there (the 404's links sit beside its
  title on wide screens).
- Content inside a tool (the visitor's own post in Clean Paste's editor) and the team Playbook's screens keep
  Inter.
- **Check:** `browser-check.mjs` fails on any visible H1 or H2 of 16px or more that isn't Outfit. A new heading
  style needs Outfit, or should be a real H3.

## Sizes and spacing

- **Ten text sizes, picked by role:**

  | Size | Role |
  |---|---|
  | 12px | Small labels: eyebrows, tags, section labels, the short name over each quiz answer |
  | 13px | Secondary text: hints, chips, footers |
  | 14px | Controls and boxed tips: buttons, top-bar links, answer tiles, notes and warnings, the tools' "for" line |
  | 15px | Reading text in the tools |
  | 17px | Leads and H3s (Inter 600/700): "How to use it", a panel's heading |
  | 20px | The tool title in the top bar (17px at 420px and under), the platform cards' names, a platform guide's "at a glance" heading |
  | 24px | Section headings: every H2, a result card's name, the changelog's dates |
  | 30px | Home tile names and big callouts, 24px on phones: Off the clock's line over the art, the CMS Picker's quiz question and verdict line, a tool's empty-page heading |
  | 40 / 46px | Page titles (above); the long titles' clamp runs from 30px |

  Body and H3 are two pixels and a weight apart, so a subheading reads as one at a glance. **Exceptions**, each
  marked `style: allow` where it's set: the wordmark (18px, the logo's size), text boxes on touch screens (16px,
  below), the visitor's own headings in Clean Paste's preview, and the home tiles' miniature pictures.
  **Check:** `check.py` fails on any other px font size, and on half pixels. Relative sizes (inline code at
  `0.86em`) are fine.
- **Spacing comes from eleven tokens** on a 4px rhythm, `--jsal-space-*` in `shell.css`, named by their size in
  pixels: 2 for the finest work, then 4, 8, 12, 16, 20, 24, then 32, 40, 48 and 64. Every margin, padding and gap reads one
  (`var(--jsal-space-12)`; a negative one is `calc(var(--jsal-space-8) * -1)`). Tight inside a component (a
  button's or a row's padding, the gap between controls) and roomier between sections. A 1px or 3px nudge inside a
  small tag or pill stays as written. A value that has to match something else (room kept clear for a home tile's
  picture, a number level with the text in a cell) carries a `style: allow (reason)` note, and the home tiles'
  pictures keep their own measures. **Check:** `check.py` fails any other px margin, padding or gap.
- **Spacing roles** sit on top of the scale and say what a space is for: `--jsal-gutter` (a page's side margin),
  `--jsal-page-end` (below a page's last section), `--jsal-flow` (after a paragraph or list in reading text), and
  the paddings inside a tag (`--jsal-pad-tag`), a bordered pill (`--jsal-pad-pill`), a boxed note or message
  (`--jsal-pad-note`), a table cell (`--jsal-pad-cell`), a card (`--jsal-pad-card`) and a result card or panel that
  sits on the page (`--jsal-pad-panel`, 24px). A new thing of one of these kinds uses its role, so all of them change together; anything
  else takes the scale directly. Two roles can share a value (a note and a cell are both 8px 12px) and still change
  apart.
- No named text-size tokens: the type scale above is the set.

## Colour

- Colours come from the `--jsal-*` tokens in `shell.css`, light and dark. Every text/background pair is at
  least 4.5:1; icons and other graphics people need to see at least 3:1. Light-mode gold text is
  `--jsal-accent` (#7e5a00); `--jsal-fill` (#e3b04b) is for fills and for text on images. The home tiles' own
  tint tokens stay in the home page (`src/pages/index.astro`), where they're used.
- **Light mode is a cool grey page with white surfaces** (`--jsal-bg` #f3f4f6, `--jsal-surface` #ffffff; John,
  19 Nov 2026, the redesign's "Series colours", his pick of four mockups). The parchment it replaced is gone:
  don't bring warm creams back. **The dark theme's colours are fixed** (John, the same day): a change to the look
  leaves them as they are.
- **Each tool wears its home tile's colour on its own page**, so the home page and the tools read as one family:
  the soft tint behind the part that asks for something, and the deep shade for that part's heading. The CMS
  Picker's quiz, verdict band and platform-guide title are lilac; Redirect Import's empty page is berry; the
  Image Resizer's settings column is teal, on a full window only (below 900px it stays plain, as the settings and
  the preview sit 8px apart). Each tool defines its own `--tool-*` tokens in its own stylesheet (`--tool-tint`,
  `--tool-soft`, `--tool-ink`, `--tool-line`, and `--tool-on` for a box that sits on the tint); in the dark
  theme they fall back to the plain surfaces. **Clean Paste's honey stays on its icon's tile:** behind a whole
  panel it sat too close to the gold button. **The top bar stays neutral and the same on every page:** a bar in
  each tool's colour was mocked up and turned down (John, 19 Nov 2026).
- **Gold is the site's accent: loud, and spent only where it matters.** Selected states, the main action, the
  step in hand, brand touches (".io", each title's gold word, the home page name and role line, eyebrow
  labels on the site's own pages, achievements) and the site's own text links (About sections, footers, notes).
  Never hover. Focus is the focus ring, not a gold fill. **On the tools the small labels are muted**, so gold
  stays for what you act on: the CMS Picker's "Updated" line is muted. What sets a result apart (the CMS Picker's
  "Why Wix first") is a box in the tool's tint, not a gold bar: a bar down one side of a box isn't used anywhere.
- **The answer ramp**, for tags that say how well a platform does something: green = built in or automatic,
  blue = with an add-on or indirectly, terracotta = needs code, red = not possible. It reads as one scale
  wherever it appears, so a single tag's colour isn't a warning or information on its own.
- **Other roles:** green = fit or success; terracotta = a genuine warning (a missing or stale source, "may look
  blurry"); red (`--jsal-bad`) = not possible, destructive actions (Clear, Remove), and an action that failed (`.jsal-error`); blue = information (a
  note, something in flight such as "waiting for publish") and links inside a tool's content (Clean Paste's
  editor, the Playbook's "How to" and sources); neutral for everything else (labels, type badges, icons, cost
  bands, states such as "not verified" or "unclear"). The team Playbook follows the same roles.
- **A caution and an error differ by shape, not only colour.** Terracotta, red, gold and green all sit on the
  red-green axis that colour-blind visitors lose (in light mode a deuteranope sees terracotta, red and gold text as
  one colour). So an error's mark is filled (a solid red disc with the "!", a solid red count pill, `.jsal-error`)
  and a caution's is an outline (a dashed terracotta ring with the "?", a dashed pill), and each keeps its words.
  In dark mode the two are also split by lightness: a deeper terracotta and a pale red. A label sitting on a
  picture (the Image Resizer's "upscaled" tag) keeps its fill to stay readable, and words say what it is.
- **Check:** `check.py` fails on written-out colours, selected states without the `--jsal-selected-*` tokens,
  gold on hover, button corners off the scale and odd font weights. A deliberate exception carries a
  `/* style: allow (reason) */` comment on that line; never add one just to make the check pass.

## Building blocks

Corners `--jsal-radius-sm` / `-` / `-lg` / `-xl` / `-pill` / `-tile`; selected `--jsal-selected-*`; hover `--jsal-hover-line`;
focus `--jsal-focus-ring`; button weight `--jsal-btn-weight`; spacing `--jsal-space-*`. Use these instead of new values.

- **Focus is one gold line on everything:** the shared ring, a gap of background colour and then gold, around the
  control. The gap keeps it visible on gold buttons. A text field keeps its own border when focused, so focus is never
  two gold lines. Where an outside line would be cut off (the CMS Picker's table cells, tabs inside a strip, the Image
  Resizer's canvas), the same 2px line sits just inside the edge instead.

- **Corners by size of thing:** 4px small controls and chips inside a control, 6px buttons and fields, 8px cards
  and boxes inside a panel, 12px a tool's main panel and anything that sits on the page as its own piece (the quiz
  box, the verdict band, a result card, a platform guide's title band and answers table, a tool's empty page,
  Clean Paste's editor, the Image Resizer's canvas), icon tiles and the achievement pop-up, 999px pills and round buttons, 22px the home and Off the clock tiles (18px at 520px and
  under, set on the token). Each step is larger than what sits inside it. **Check:** `check.py` fails any corner
  that isn't a token (or 0, 50%, `inherit`); the home tiles' miniature pictures and the backpack drawing carry
  `style: allow`.

- **A dark island** (`.jsal-dark` in `shell.css`): an element and everything in it in the dark theme's colours,
  whatever the page's theme, for something that sits on a dark picture (the Pause button on a jsal.ui clip). It
  uses the dark theme's own tokens, not copies, and works out its selected, hover and focus colours from them.
  Use it only on a dark picture; everywhere else the visitor's theme rules.

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
  weight. Uneven pills stagger; equal tiles don't.
  **A filter** (`.jsal-filter` in `shell.css`) shows one of five or more parts of a list at a time (the changelog's
  parts of the site): equal-width rectangles with 6px corners in a grid, so every row lines up at any width, each
  with its icon, name and count, the chosen one in the selected gold. Not pills, whose rows stagger as they wrap; two
  to four options are a switch (`.jsal-seg`). **The one filled pill** is the home page's gold "Find your CMS":
  the page's main action, filled rather than bordered, so it never reads as a choice. It stays a pill to sit with the
  bento's round tiles; nothing else on the site uses that shape for an action.

## Layout

- **The top bar never moves between pages:** the same `.jsal-top` markup everywhere (`check.py` compares it). A tool's name
  in the bar starts with its icon (22px, `.jsal-title-ico`, the same file as its tab icon), as in
  the logo menu; the icon drops out below 430px. From 360px up the bar keeps one row on every tool (at 420px and under the
  title is 17px and the gaps tighten), so the work area starts at the same height on each.
- **A page's own top bar links stay on one row on phones** (520px and under), dropping the ones that don't fit rather
  than wrapping: the home page keeps Updates and Email down to 320px; Off the clock drops Tools (the logo menu goes
  to the tools) and keeps Achievements, with Email beside it from 375px. Email shows wherever it fits; a new link is
  measured at 320px and 375px before it's kept.
- **One distance under the top bar:** pages that open with a heading (home, Off the clock, the CMS Picker and
  its platform pages, Privacy, Changelog, 404) start their first thing at `--jsal-page-top` from `shell.css`
  (32px, 24px at 720px and under), flush with the logo's left edge: no optical indent on the mono line, the
  heading or the text under it; a new page of that kind uses it too. The tools' "for" line sits 16px under the bar, so the work area
  fills the first screen.
- **Tools fill the first screen;** the About section sits below the fold, reached by the top bar's About link.
  On phones the empty work box stretches to the bottom of the screen until there's content.
- **A tool's empty page says what to do and what the tool does** (Clean Paste, Redirect Import; John, 19 Nov
  2026): one panel across the full width, its heading in Lora, one main way in as the gold button ("Paste from
  clipboard", "Choose a file") with the others as links, and a short ticked list of what the tool does, in plain
  text and never in boxes, so nothing looks clickable that isn't. Every line in the list is something the tool
  really does. Clean Paste's Checks column is kept for screen readers only until something is pasted. Once there's
  content, each tool's working layout is as it was.
- **The Image Resizer's layout doesn't move** (John, 19 Nov 2026: his coworkers use it every day, often docked in
  a side panel about 500px wide). A change to its look is proved by recording every element's position and size
  before and after, at 1440 × 900, 500 × 1330 and 390 × 844, empty and with an image loaded.
- **About sections** share the content's left edge: the column, with a 20px gutter on narrow screens.
- **Home page:** tools only, as a "pick one" screen (John, 20 Nov 2026): the list of jobs on the left, the chosen
  tool's stage beside it. A new tool is a new row in the list with its own stage and tint. **The work tools keep
  an open layout** (the CMS Picker and its platform pages, Clean Paste, the Image Resizer, Redirect Import, the
  Playbook, Privacy, Changelog), and may use a card with the tile corners where it helps. `/play/` keeps its tiles
  (John, 7 Nov 2026). The list, the stages, their pictures and how the page works without scripts are in
  `.claude/rules/home-page.md`, which loads with the home page's files.
- **The jsal.ui page** (`/jsal-ui/`) is laid out like the addon's own dashboard, the same "pick one" screen as the
  home page (John, 20 Nov 2026: "both pages"), in Outfit and the site's own colours in each theme; the dark stage
  over a blurred game screenshot, modelled on ellesmereui.com, is gone, and so are its big rows and cards. The top
  bar is the shared one, in the page's theme. From the top:
  - **The headline leads** ("Your WoW Forever character, *in one dashboard.*": it has to read as useful after 60,
    not only for leveling), with John's own line on what jsal.ui is, Download, How to install and the version line
    beside it. The version line ends "For WoW Forever 1.60.1 · works on its own" (John, 24 Nov 2026: a compatibility
    line by the download; the game version is the toc's Interface 16001), on the same line so the tour doesn't move
    down (one more line on a phone).
  - **The list** (272px, from 1280px) is the addon's menu: Home, and Plan, Craft and Play with their parts. Every row carries "Any level" or "1 to 60"
    (`when` in `src/lib/jsal-ui.mjs`; only the Training and Build planners end at 60). Below 1280px the parts are
    four to a row above the stage; on upright phones (under 600px) they're a list under their groups' names, each
    row with its name and when it's useful, and the chosen part opens under its own row with its words and its window
    (John, 21 Nov 2026, "same treatment" as the home page's list; it replaced a dock at the foot of the screen).
  - **Jsal's Pals has a live pen in place of a screenshot** (John, 21 Nov 2026: "the different pen scenes to replace
    the long box so it fits better like the rest of the addon's boxes"): the pal hatches and grows in one of the
    addon's eight pen scenes, wide across the stage like the other windows, drawn from its art in
    `site/img/jsal-ui/pals/scene-<scene>.png` and `scene-<scene>-night.png` (day in the light theme, night in the
    dark), with a Scene
    button beside Hatch/Grow that moves it to the next one.
  - **The stage** (the page's sunk fill, the tile corners): the part's name very large, a tag saying when it's
    useful, its headline and line, three ticked points, and its window whole, straight and framed. A part may have a **film** in its place (John, 24
    Nov 2026: "Whole window, like the stills"): the window recorded in the game (`FILMS` in `jsal-ui.mjs`, files in
    `site/img/jsal-ui/ui/films/`), played by the clips' script with their Play/Pause button; a film is shown in place
    of a clip. Home and the parts with their own window (Gear plan, Dungeon guide,
    Crafting profit, Guild Crafts) show the whole window; a part that is a page of the dashboard (Journal, Training,
    Build, Endgame, Professions, Games) shows its page alone, without the dashboard's menu and title bar (John, 24 Nov
    2026: "cut it", "home is fine"), 1086 by 830, so its words come out larger. On the stage every film's frame is held
    to Home's 3:2 and cut at 460px by the same fade, so the frame doesn't change size between the two shapes. A narrow window
    (the pals) sits beside the words. Five parts show a clip in place of a still.
  - **No part has a page of its own** (John, 25 Nov 2026: "retire them"): players looking for an addon know the game,
    and addon sites (Polestar, EllesmereUI) tell every part on one page. The six part pages that were tried
    (24 Nov 2026) redirect to their stage here (`#pick-build`, in `site/_redirects`). Depth, if it's ever needed,
    goes in one help page (commands, settings, where things are), not a page per part; the parts you'll use most are a
    section of this page (below).
  - Every stage is in the page, one under the other, and each row is a link to its stage; with scripts the rows
    are tabs and one stage shows. The address keeps the choice as `#pick-gear`.
  - Then three **numbers** (36 parts, 3 groups: Plan, Craft and Play, 100% free; change the first by hand when the
    addon's parts do). The numbers count only what the addon owns (John, 20 Nov 2026): never dungeons, loot or
    anything else from Forever's data, which is new and still changing; never how often it updates; never "1
    dashboard" (some pages open outside it) or "0 other addons" (an EllesmereUI profile import is planned). Then
    **The parts you'll use most**, the little things, a **Latest release** card, a **Discord** band and Install.
  - **The little things** (John, 25 Nov 2026, his pick of two mockups: "1, the groups"): the small helpers in five
    groups by where you'd notice them (Bags and vendors, Questing, For crafters and hunters, Getting around, Your
    screen; `LITTLE` in `jsal-ui.mjs`), each told in one short line, in balanced columns: three from 1000px, two from
    620px, one below, a group never split. The groups' order is the one that ends the columns closest together (the
    reasoning is beside `LITTLE`); re-measure when a group changes. Each group's name is a gold 17px heading over a hairline; no boxes, so it
    reads as a calm list under the bento. A helper for one class says so ("Hunters only:").
  - **The parts you'll use most** (heading 30px, Plan, Craft and Play 24px under it; John, 25 Nov 2026, after a run of mockups: "dynamic bento", "separate into our 3 plan, craft,
    play"): the addon's three groups again, each a small bento under its own heading (`CLOSER` in `jsal-ui.mjs`), four
    tiles a group in named slots: a big 2×2 window tile, a wide 2×1 tile
    (Craft's is the tall shopping list, per John's sketch) and two word tiles (Play has one, across both cells: chess
    is shelved, so it isn't shown). The heaviest tile alternates sides down the page (John: "alternating the big
    card"): Plan's big tile on the right, Craft's tall list on the left, At 60's on the right, Play's on the left. **At 60**
    (John: "plan bento right now is all about the leveling but nothing about what happens after") sits between Craft
    and Play: the Endgame page's Your set card leads (John: "the window ... which shows where to go": how close the
    pre-raid set is, the next run and the build), then every alt's lockouts and cooldowns, the pre-raid BiS list and
    raid nights in the Journal; no consumables. At 60 mirrors Craft, so the lockouts card is tall enough to show its
    Cooldowns too (John: "mentions transmutes but cuts off cooldowns"); every card in it shows whole at every width.
    **A narrow window floats on game scenery** (John: "a background to ones that don't fill ... muted but can tell
    its from in game"): the trainer panel, the star's list and tooltip (a stack: the tooltip laid over the list's corner), the shopping list, Your set and the lockouts each sit on a different crop
    of John's own Arathi Highlands screenshot (`site/img/jsal-ui/scenery/`, from `private\jsal-ui\sim\backdrops\`),
    blurred, desaturated and darkened in the file, with a 30% `--win-fill` tint over it, and drawn small enough that
    the scenery frames them. The blur leaves no nameplate readable. The whole Endgame page isn't used: it shows a real character's name. Each window shows a side of the part the
    tour doesn't (the panel at a trainer, a slot's list with its star lit and the tooltip that says so, the shopping list, the road to the cap) and is **drawn to
    fit its tile, to show the feature, not to be read** (John: "it is okay if the text is not as readable"), so the 85%
    floor of the close-ups doesn't apply here; a phone draws each closer (`psw`). A narrow window sits centred, never
    larger than the game draws it. The pal is the baby form (the Capling) in its meadow, by day or by night with the
    theme, from `meadow-day.png` and `meadow-night.png` (the pen scenes cut to their art). Each heading carries the
    part's own 64px icon at 32px, with no box round it (the icons are already tiles). The layout follows the section's
    width (a container query): four columns from 1000px, two from 620px, one below; tiles never overflow, and a word
    tile's slack sits centred. The words are a player's, about what it does for you in the game, never a sales line. Install has a primary Download
    button (the first screen's) with CurseForge and Wago as links beside it, and says what Auctionator adds: with it, and
    while Crafting profit is on (the default), the profession leveling path, the shopping list and Crafting profit
    price things from its auction house scan (John, 24 Nov 2026).
  - **On upright phones** a whole window would be too small to read, so each shows its top corner at a readable
    size, cut off by its frame: past the dashboard's menu and title bar, by each picture's measured offsets (`cx`,
    `cy` in `jsal-ui.mjs`), so they all begin alike.
  - **Scrolling down** (John, 24 Nov 2026, "strong" of the motion versions he scrolled), each block under the tour rises 48px and fades in over 0.8s on
    `cubic-bezier(0.16, 1, 0.3, 1)`, once, when a sixth of it shows. 24px on phones and coarse pointers. Only transform and opacity move; nothing replays on the way up;
    anything on screen at load is never hidden; with reduced motion or without scripts everything simply shows. The
    first screen and the tour don't take part. **In turns** (John, 25 Nov 2026, "C, with hover" of three recorded
    options): each bento group's heading arrives, then its tiles one after another 110ms apart (three steps at most),
    each window settling from 96% just after its tile; the little things' heading, line and groups arrive the same
    way. **Hover**, on pointers that can hover and with motion welcome: a bento tile's framed window lifts 6px (the
    pal 4px) over `--jsal-settle`, and the scenery behind it drifts slowly (2.4s, scale 1.06) while the pointer
    stays; nothing moves on its own. The script is a file of its own, `site/jsal-ui/reveal.js` (marks: `data-rv`
    for a block, `data-rv-steps` for a block whose `data-rv-step` parts arrive in turn), so the content security
    policy needs no more hashes; the timings carry `style: allow`.
  - **Clips** (John, 19 Nov 2026): Gear, Professions, Journal, the Dungeon guide and Guild Crafts show a short
    clip: muted MP4s in `site/img/jsal-ui/ui/clips/`, each with its first frame as the still. They're drawn from
    the same sim pages as the store GIFs, never converted from a GIF (John: GIF-made video lost "the smoothness"):
    a steady 30 frames a second in full colour, 13-frame fades, by `private\jsal-ui\sim\make_clips.py`. A clip
    downloads and plays only while a third of its frame is on screen, stops when it leaves (or its stage is put
    away), and keeps a `.jsal-btn.small` Pause/Play button (a `.jsal-dark` island) in its corner, since clips run
    longer than 5 seconds; a pause holds until Play, and with reduced motion nothing starts by itself.
  - The parts and windows are in `src/lib/jsal-ui.mjs`; new windows are cut from John's screenshots the way the store
    cards are (the game trimmed off, the version hidden, guildmates' names made up). The version line and the release
    card read `src/data/jsal-ui-release.json`, which the hourly jsal.ui version Action rewrites from the latest
    release.
- **The CMS Picker** has its own layout and control rules (quiz first, the quiz's tick and checklist questions,
  changing an answer, result cards, the must-have divider, "varies", the comparison on phones) in
  `.claude/rules/cms-picker-design.md`, which loads with the CMS Picker's files.

## Motion

- Every animation has a `prefers-reduced-motion` fallback (`check.py` checks).
- **Two timings and one curve.** A state change (a hover, a colour, a chevron turning, a short fade such as a quiz
  step) takes `--jsal-quick` (0.15s); something that moves or arrives (a tile lifting, a bar filling, a pop-up sliding
  in) takes `--jsal-settle` (0.3s). Plain `ease`, or `--jsal-ease-out` when something comes in, so it lands softly. Choreographed pieces keep their
  own timing and carry `style: allow`: the page change, the logo unfold, the 404's dropped dot, the home pictures,
  /play/'s effects, Clean Paste's Show and the jsal.ui pages' scroll reveal. **Check:** `check.py` fails any other timing, and any `--jsal-*` used without being defined.
- **Page transitions are one slide everywhere** (`shell.css`): the old page drifts up and fades, the new one
  rises in, Back runs it downwards, and the top bar cross-fades in place. Only `shell.css` names
  view transitions (`check.py`). Firefox has no cross-document transitions and navigates plainly.
- **The home page's pictures play a short demo** each time a tool's stage shows (John, 21 Nov 2026: "play an
  animation over being interactive", a pointer that presses each control): about five seconds, once, inside the
  tour's turn; what each one plays is in `.claude/rules/home-page.md`.
- **The tour** (John, 21 Nov 2026: "animations that play automatically instead of using our mouse"): on the home page
  and the jsal.ui page, from 700px wide with motion welcome, the list's items take turns by themselves, round and
  round (John, "loop it") (6 seconds a tool on the home page, 5 a part on the jsal.ui page), a gold line filling under
  the chosen row as its turn runs out. It rests while the pointer or the keyboard is on the list or the stage, or the
  list is off screen; it ends once a row is clicked, keyed or scrolled; and a Pause the tour button under
  the list stops and restarts it, staying as Play the tour after the tour has ended (WCAG 2.2.2: anything that moves on its own for more than 5 seconds can be paused).
  Not on phones, where the list opens in place, and not with reduced motion.
- Anything else that moves on its own stops within 5 seconds: the home pictures' one play on touch screens takes
  under 3 seconds.

## Feedback

One rule for how every tool answers an action, so "it worked" and "it didn't" look the same everywhere.

- **Success is said on the button that did it:** `window.jsalDone(button, 'Copied')` (in `nav.js`) turns it green with
  a tick (`.jsal-done` in `shell.css`) and the past tense for two seconds, then gives its label back, and says the word
  to screen readers. "Copied", "Link copied", "Saved", never with "!". Only when that button goes away (a Playbook form
  closes on Save) is it said in the short message at the bottom instead.
- **Work in progress is said on the button**, which is disabled meanwhile ("Zipping…", "Saving 2/5…").
- **An error never fades.** It's a `.jsal-error` (red "!", tinted box, `role="alert"`) next to what failed, saying what
  to do, and stays until the next try there. The Playbook's `fail()` puts it in the form, card or row of the last click;
  with nowhere to put it (a refresh on load) the bottom message stays until the next click.
- **Running state** lives in the Image Resizer's status line (what's loaded, where it saves), not in pop-ups.
- **An example tour** (`window.jsalTour(id, steps)` in `nav.js`, `.jsal-tour` in `shell.css`; John's pick B of
  three mockups, 5 Nov) runs only when a visitor loads a tool's example, once per tool in that browser
  (`jsal-tour-<id>`): a box beside the control it explains (right, then left, else under it), a blue ring round the
  control, dots, Back and Next (Done on the last), × and Esc to end it. Blue, as it explains; the page stays usable
  under it, nothing is dimmed. Three steps at most, each a short title and one or two sentences; a step whose
  control isn't shown at that width is passed over. Never on page load: the team uses the tools every day.
- A final answer replaces its question in place ("Thanks, that helps make the quiz better." with a green tick).

## Touch and accessibility

- On touch screens (`pointer: coarse`) buttons are at least 44px tall (a smaller-looking control gets a 44px
  tap area with `::after`) and text boxes 16px (iPhones zoom into anything smaller and stay zoomed). Desktop
  targets are at least 24px.
- Wording that says click, drop or a shortcut carries a `data-touch` version (`data-touch="Tap"`, or
  `data-touch=""` to drop a shortcut), which `nav.js` swaps in on touch screens; the HTML keeps the desktop
  wording. Text written by an app's script checks `matchMedia("(pointer: coarse)")` itself.
- The tools are mostly used on desktop, so phone work fixes real problems rather than polishing.
- axe runs on every page in light and dark before each push (`browser-check.mjs --axe`).
