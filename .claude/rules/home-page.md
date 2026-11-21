---
paths:
  - "src/pages/index.astro"
  - "src/components/Updates.astro"
  - "src/lib/updates.mjs"
  - ".github/build/home-shots.mjs"
---

# Home page design

These are part of the site's design rules (`design-rules.md` beside this file), kept here so they load only for
home page work.

- **The home page is a "pick one" screen** (John, 20 Nov 2026, his pick after asking how the page would look with
  free rein; he saw it in the site's own dark colours and in Outfit before saying "both pages"). A list of the four
  jobs down the left never moves; the stage beside it is the chosen tool: its name very large, one line on what it
  does, its gold button, three ticked facts and a picture of the tool at work. It replaced the improved bento of
  19 Nov 2026. Turned down before it, so don't re-propose them: the full-width colour bands, and three plainer
  layouts (four doors, a side column, job-first rows). The cost John accepted: one tool shows at a time, where the
  bento showed all four.
- **Two fonts, as on the jsal.ui page** (John, 20 Nov 2026, his pick A of three pairings): Outfit, the jsal.ui
  addon's own font, for names, headings and buttons; Inter for everything that is read (lines, facts, labels,
  small text), as Outfit is weak at 13 to 15px. Turned down: Lora for the line under each name, and JetBrains Mono
  for the small labels. The top bar keeps the shared look. The tools themselves keep Lora and Inter.
- **The top bar and the column stay the site's own**, so the logo sits where it does on every other page. The
  mockup had no top bar and ran the full width of the window; the build keeps both, as the top bar never moves
  between pages.
- **Layout:** from 1280px, the list (272px) beside the stage. Below that the headline, then the four tools as a row
  of tabs, then the stage. On upright phones (under 700px) the four tools are a list, each row with its name and
  its job, and the chosen tool opens under its own row in its tint, with its line and its button (its facts and
  picture wait for a wider screen); tapping another row opens that one (John, 21 Nov 2026, my pick A of three: it
  replaced a dock at the foot of the screen, where only the chosen tool could be read). The list and the stages are
  laid out together with `display: contents` and `order`. Off the clock is a quieter row under the list; it goes to `/play/`, the page that carries
  that name (John, 21 Nov 2026), which links on to jsal.ui.
- **A stage wears its tool's tint** (`--t-cms`, `--t-ir`, `--t-cp`, `--t-ri`, defined in the page, light and dark)
  with the name in the tint's deep shade; the chosen row in the list wears the same tint, and the logo's gold gem
  marks it in place of its number. Each tint is also the colour its tool wears on its own page (design-rules.md,
  Colour), so a change to a tint is a change to that tool's page too.
- **The headline leads the page** (John, 20 Nov 2026, "all 4" of my suggestions): "Small tools that do *one job*
  well." across the top at every page title's size (46px, 40px on phones), with the "Free, in your browser" line
  at its end; the list and the stage sit under it. It used to sit in the list at 30px, quieter than a tool's name.
- **The pictures are the real tools, and they play a demo** (John, 21 Nov 2026: "play an animation over being
  interactive", his pick of a pointer pressing each control over a plain cross-fade), each with its example loaded,
  in the light and the dark theme, cut to one or two pieces. Each time a tool's stage shows, from 700px wide with
  motion welcome, a pointer glides to each control in its picture in turn (`STEPS` in the page's script), presses it
  with a gold ring, and the picture shows that state: a size reshapes the Image Resizer's crop, Text | HTML turns
  Clean Paste's post into its code, a filter narrows Redirect Import's sheet; in the quiz's picture it presses each
  answer. It ends back on the first state in about five seconds, inside the tour's turn; Pause, or another tool,
  stops it; with reduced motion nothing plays. The pictures aren't clickable: the stage's gold button is the way in.
  Each tool is taken once per state, and an unseen mark sits exactly over each drawn control
  (`src/data/home-spots.json`, shares of the picture), which the pointer goes to:
  `node .github/build/home-shots.mjs` against the served build writes the pictures and that file (its quiz links,
  `#quiz?v=6&what=…`, are no longer used). Run it again when a tool's look changes, and look at each picture
  afterwards: the cuts are fixed rectangles. The second piece overlaps the first; both run off the
  stage's edge, which is `overflow: clip` (a hidden box scrolled to a focused control and slid the stage).
- **A first visit gets one nudge:** on a wide screen, with nothing picked after a second and a half, the gem leans
  toward the next row and back, twice, once per browser (`jsal-pick-hint`). Never with reduced motion.
- **The CMS Picker's stage ends in a key per platform** (logos only, each a link to that platform's guide, named
  for screen readers). The footer keeps the same 14 as a quiet row of text links.
- **How it works:** every stage is in the page, one under the other, and each row of the list is a link to its
  stage, so it reads top to bottom without scripts. With scripts the rows become tabs (arrow keys along the list;
  1 to 4 pick a tool from anywhere on the page; the mouse wheel over the list steps through it, and past either
  end the page scrolls as usual: John, 20 Nov 2026) and one stage shows. From 1280px the chosen row runs into its
  stage as one piece, with the gem just outside it (John: "I also liked this part where it connected"); the jsal.ui
  page's list does both too. The address keeps the choice as `#pick-ir`,
  which names no element, so opening the page on a tool doesn't scroll. The stage's button (`data-app`) opens the
  tool.
- **Under the stage:** Updates (the newest change in each of the three most recently changed parts, from the
  changelog as the page builds, `src/lib/updates.mjs`; plain rows, as they aren't links) and the email line, then
  the footer.
- **Sizes:** a stage's name is the largest line (up to 72px, shrinking with the stage; `style: allow`), the
  headline 46px. Everything else is on the type scale.
- **Not checked by a person yet:** the facts in each stage's ticked list are Claude's draft from each tool's own
  page; John to confirm the wording.
