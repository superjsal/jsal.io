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
- **Set in Outfit**, the jsal.ui addon's own font, as the jsal.ui page is: headline, names, text and labels. The
  top bar keeps the shared look. The tools themselves keep Lora and Inter.
- **The top bar and the column stay the site's own**, so the logo sits where it does on every other page. The
  mockup had no top bar and ran the full width of the window; the build keeps both, as the top bar never moves
  between pages.
- **Layout:** from 1280px, the list (272px) beside the stage. Below that the headline, then the four tools as a row
  of tabs, then the stage. On upright phones (under 700px) the tools are a dock that sticks to the foot of the
  screen while the stage is in view. Off the clock (the jsal.ui page) is a quieter row under the list.
- **A stage wears its tool's tint** (`--t-cms`, `--t-ir`, `--t-cp`, `--t-ri`, defined in the page, light and dark)
  with the name in the tint's deep shade; the chosen row in the list wears the same tint, and the logo's gold gem
  marks it in place of its number. Each tint is also the colour its tool wears on its own page (design-rules.md,
  Colour), so a change to a tint is a change to that tool's page too.
- **The pictures are the real tools**, each with its example loaded, in the light and the dark theme, cut to one or
  two pieces: `node .github/build/home-shots.mjs` against the served build writes them to `site/img/home/`. Run it
  again when a tool's look changes, and look at each picture afterwards: the cuts are fixed rectangles. The second
  piece overlaps the first; both run off the stage's edge. No hand-drawn miniatures any more.
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
- **Sizes:** a stage's name is the one very large line (up to 96px, shrinking with the stage; `style: allow`). The
  headline in the list is 30px. Everything else is on the type scale.
- **Not checked by a person yet:** the facts in each stage's ticked list are Claude's draft from each tool's own
  page; John to confirm the wording.
