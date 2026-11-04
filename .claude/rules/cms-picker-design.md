---
paths:
  - "site/cms-picker/**"
  - "src/pages/cms-picker/**"
  - "src/lib/cms-picker.mjs"
  - ".github/scripts/personas.test.js"
---

# CMS Picker design

These are part of the site's design rules (`design-rules.md` beside this file), kept here so they load only for
CMS Picker work.

- **The CMS Picker is quiz first:** the platform cards and the comparison table open on request. The quiz box
  reserves its first question's height (`.qz` min-height per layout of its four answers) so the rows under it don't
  move at load or between questions; after any change to the answers' wording or layout, measure the first question's
  natural height at 760, 1024 and 1280px and match it.
- **Answers sit in even rows, never one left alone:** four answers are one row where all four fit (from 1280px),
  2 + 2 below, one column on phones; five are 3 + 2, one column below about 760px (a container query on `.qz`).
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
- **A tick that goes with a choice** (the quiz's "We already pay for HubSpot") is a plain checkbox line above the
  choices, with no box, so it never reads as one more answer: ticked, only the checkbox fills, in
  `accent-color: var(--jsal-accent)`; one focus ring on the line. It sits above, not below, because a tap on an answer
  moves straight on.
- **A question that takes several answers** ("Anything you'll need from day one?") is a list of bordered checkbox
  rows (two columns where they fit, one on phones), each selected with the same `--jsal-selected-*` tokens and gold
  edge as a pressed chip, with Back and a gold Next; never answer tiles, which move on at one tap. Nothing ticked is
  an answer too, and the hint says so.
- **Changing an answer on the results** opens its choices as equal rows, never boxes sized by their words: one column
  on a phone and an even row of boxes on desktop, left-aligned, the picked one in the selected gold. A long list (the
  platforms under "Moving from somewhere?") takes two columns on a phone.
- **The home page's CMS Picker tile** plays three needs, each pressing the three keys the real quiz ranks first
  for it (`candidates()` in `score.js`). When the quiz's scoring changes, check the three needs still light its
  top three (the tile's picture is in `src/pages/index.astro`).
