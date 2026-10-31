# jsal.io design rules

How every page looks and behaves, in one place. `.github/` isn't served by GitHub Pages, so this is for
people working on the site, not visitors. The same rules are checked before each push by `check.py` and
`browser-check.mjs` (John's `build\` folder); where a check exists it's named.

## Type

Three fonts, all self-hosted with `@font-face` in `shell.css`.

| Font | Used for |
|---|---|
| **Lora** (serif) | Every H1 and H2 on the public pages: page titles (`.jsal-title`), heroes, section headings, home tile names, "About …" headings, the platform pages' headline and sections, Privacy. |
| **Inter** (`--jsal-font`) | Everything else: body text, buttons, fields, top-bar links, H3s and smaller subheadings ("How to use it", quiz questions, platform names in lists, the platform pages' question headings), and small interface labels under 16px ("Checks", "Output size", "Export"). |
| **JetBrains Mono** | The small gold uppercase labels above headings (`.roles`, `.byline`, Privacy's date line), code, and keyboard keys. |

- A title's **gold word** is Lora italic 600 (`.hl`, or `em` on the home page): Clean *Paste*, CMS *Picker*,
  one *job*, Your *privacy*.
- **Exception, kept on purpose:** on the platform pages the gold word is "SEO" ("WordPress *SEO*: what you can
  change, and where"). Lora's italic capitals barely lean, so it reads as a lighter word rather than an
  obvious italic. It stays because "SEO" is the page's key word.
- Content inside a tool (the visitor's own post in Clean Paste's editor) and the team Playbook's screens keep
  Inter.
- **Check:** `browser-check.mjs` fails on any visible H1 or H2 of 16px or more that isn't Lora. A new heading
  style needs Lora, or should be a real H3.

## Colour

- Colours come from the `--jsal-*` tokens in `shell.css`, light and dark. Every text/background pair is at
  least 4.5:1; icons and other graphics people need to see at least 3:1. Light-mode gold text is
  `--jsal-accent`; `--jsal-fill` is for fills and for text on images.
- **Gold is the site's accent: loud, and spent only where it matters.** Selected states, the main action, the
  one insight line, brand touches (".io", each title's gold word, the home page name and role line, section
  numbers, eyebrow labels, achievements) and the site's own text links (About sections, footers, notes).
  Never hover. Focus is the focus ring, not a gold fill.
- **The answer ramp**, for tags that say how well a platform does something: green = built in or automatic,
  blue = with an add-on or indirectly, orange = needs code, red = not possible. It reads as one scale
  wherever it appears.
- **Other roles:** green = fit or success; orange = a genuine warning (a missing or stale source, "may look
  blurry"); red = not possible, and destructive actions (Clear, Remove); blue = information (a note,
  something in flight) and links inside a tool's content; neutral for everything else (labels, type badges,
  icons, cost bands, states such as "not verified"). The team Playbook follows the same roles.
- **Check:** `check.py` fails on written-out colours, selected states without the `--jsal-selected-*` tokens,
  gold on hover, button corners off the scale and odd font weights. A deliberate exception carries a
  `/* style: allow (reason) */` comment.

## Building blocks

Corners `--jsal-radius-sm` / `-` / `-lg` / `-pill`; selected `--jsal-selected-*`; hover `--jsal-hover-line`;
focus `--jsal-focus-ring`; button weight `--jsal-btn-weight`. Use these instead of new values.

## Layout

- **The top bar never moves between pages:** the same `.jsal-top` markup everywhere (`check.py` compares it).
- **Tools fill the first screen;** the About section sits below the fold, reached by the top bar's About link.
  On phones the empty work box stretches to the bottom of the screen until there's content.
- **About sections** share the content's left edge: the column, with a 20px gutter on narrow screens.
- **Home page:** a bento grid with one big tile per row and the wide side alternating; Tab order follows the
  screen.

## Motion

- Every animation has a `prefers-reduced-motion` fallback (`check.py` checks).
- Nothing moves on its own for more than 5 seconds (WCAG 2.2.2): the CMS Picker card's shuffle stops after
  about 3 seconds; its full cycle plays only on hover or focus.

## Touch and accessibility

- On touch screens (`pointer: coarse`) buttons are at least 44px tall and text boxes 16px (iPhones zoom into
  anything smaller). Desktop targets are at least 24px.
- Wording that says click, drop or a shortcut carries a `data-touch` version for touch screens.
- axe runs on every page in light and dark before each push (`browser-check.mjs --axe`).
