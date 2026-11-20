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

- **The CMS Picker is quiz first:** the platform cards and the comparison table open on request. The quiz follows
  the title directly, with no heading or rule of its own between them (John's pick B of three mockups, 19 Nov 2026):
  the title on one line with its description and "Updated" date beside it where there's room, then the quiz panel
  on the tool's lilac tint, the question in Lora. The quiz box
  reserves its first question's height (`.qz` min-height per layout of its four answers) so the rows under it don't
  move at load or between questions; after any change to the answers' wording or layout, measure the first question's
  natural height at 540, 760, 1024 and 1280px and match it (337px from 1280, 381px below, 361px from 759, 509px
  from 540, as of 19 Nov 2026).
- **The steps are named** (`.qz-path`), in place of a progress bar: every question's short name with a rule above
  it, the ones done in the deep lilac and the one in hand in gold, so a visitor sees what will be asked without a
  claim about how long it takes. On a narrow panel only the rules show, with the step in hand named under them. The
  strip is decoration for screen readers, who get "Question 2 of 8" from the question's heading. Turned down for
  now: a list of platforms "still in the running" beside the quiz (mockup C), which is a feature needing a rule
  for when a platform counts as out.
- **The result isn't one box** (John's pick R1 of two, 19 Nov 2026): each part sits on the page as its own piece.
  A band in the lilac tint leads with how sure (a small tag: green for a lead or a winner, neutral for a close
  call), how close in a Lora line, and the result's three actions, so Compare is on the first screen; a plain
  Compare button repeats at the end. The answers are small tiles in a row. The matches sit side by side where the
  panel is 900px or wider (`.qz-row`), each card's five parts (name, summary, facts, reasons, notes) sharing the
  row's lines so a fact reads straight across; one column below that. Facts are rows, the label on the left and
  the value on the right. The first steps and "Had a platform in mind?" sit side by side under the matches.
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
  plain sentence per match from the table's verdicts ("Framer needs an add-on for selling online."). The divider
  starts a new row of cards, so the matches under it sit apart from the ones that have every must-have; a match
  alone on its row lays its reasons and notes beside its name and facts. Above it every
  card has the must-haves and none reads "Worth a look"; under it the pill is neutral, not green, as it isn't a fit.
  When even the first match lacks one, the blue note above the cards says that nothing that fits has it all built in.
- **What sets a match apart is a box in the lilac tint** ("Why Wix first", "Compared with Wix"), one per card, and
  the same box carries it above the comparison table. Never a gold bar down its side.
- **The comparison table keeps its layout** (19 Nov 2026: walked at desktop and phone width and left alone). Its
  platform chips are still oval pills; an equal grid like the changelog's filter is an idea, not agreed.
- **A platform guide** (`/cms-picker/<platform>/`; John's pick G2 of two, 19 Nov 2026): the title on the lilac tint
  with the platform's logo on a small tile before its name; the short profile (type, starting cost, hosting, what
  you can take when you leave) as an "at a glance" card beside the title from 900px, and after the SEO answers
  below that, so a phone reaches the first answer straight after the title. The six SEO questions are one table
  of rows: the question and its answer on the left, where to find the setting and its source on the right, so the
  answers read down one column. The title's gold word stays "SEO". Check a platform with long menu paths
  (WordPress) and one with almost none (Sanity) after a change.
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
