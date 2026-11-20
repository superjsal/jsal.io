---
paths:
  - "src/pages/index.astro"
  - "src/components/Updates.astro"
  - "src/lib/updates.mjs"
---

# Home page design

These are part of the site's design rules (`design-rules.md` beside this file), kept here so they load only for
home page work.

- **The home page is a run of full-width colour bands** (John's pick X of three, 19 Nov 2026, after he turned down
  three plainer layouts as too plain, too much text, missing the product pictures and "still just boxes"; he asked
  for bold, one big idea, the tools shown at work). The bento grid it replaced is gone: don't bring tiles back.
  - **The first band** is lilac and carries the page's headline (Lora 76px, the one line on the site set larger
    than a page title; 46px below 1100px, 40px on phones) beside the CMS Picker's keys, with the gold "Find your
    CMS" pill.
  - **Then a band per tool** in its own tint (Image Resizer teal, Clean Paste honey, Redirect Import berry): the
    tool's name in Lora in the tint's deep shade, one line, a pill that names its action ("Resize images"), and the
    tool's picture, the sides swapping down the page. The pill is the link; the band isn't, so the picture can
    take clicks of its own.
  - **After the tools**, on the plain page: Say hi and Updates as plain text, never tiles. Updates is the newest
    change in each of the three most recently changed parts, a plain list read from the changelog as the page
    builds (`src/lib/updates.mjs`). Then the footer, with the Platform guides row and Off the clock.
  - **Each tint is also the colour its tool wears on its own page** (design-rules.md, Colour), so a change to a
    band's tint is a change to that tool's page too.
- **A picture is a small stage** (`.pic`) its pieces are placed on at their own scale, then enlarged as one with
  `zoom`, so every piece keeps its place and its motion at any size. Each band sets its zoom per width. On phones a
  picture shrunk to fit would be too small to read, so each shows its main piece only, larger (the editor without
  its output list, the sheet without its file, with the sheet's last row shown).
  The pieces are real-looking parts of each tool in the tools' own colours (`--jsal-surface`, ink and lines, so they
  change with the theme): the CMS Picker a tilted brick of one key per platform in that platform's colours, logos
  only; the Image Resizer its crop editor and the files it made from one photo; Clean Paste its Text | HTML switch
  over a short raid note with a gold line through it; Redirect Import its sheet of old and new addresses with each
  row's check, and the file it writes. No fake buttons and no favoured platform.
- **The pictures can be played with** (John, 19 Nov 2026: "a bit more interactive/playful"), and everything in
  them does something real or visibly answers the pointer, so nothing invites a click that does nothing:
  - each CMS key sinks under the pointer, goes down when pressed and opens that platform's guide (they're links,
    named for screen readers, kept out of the tab order as the footer lists the same 14);
  - a size under the Image Resizer's photo reshapes the crop box and marks its file in the list;
  - Clean Paste's gold line follows the pointer across the note (`--w`), wiping it between text and HTML;
  - a ready row in Redirect Import's sheet lights up with the line it wrote in the file.
  The size picker, the line and the rows are pointer-only decoration (`aria-hidden`): the pills and the platform
  links are the way in for keyboards and screen readers.
- **The pictures also play by themselves when asked:** pointing at a band (or focusing something in it) plays what
  its tool does three times, then it rests as the still picture (the CMS Picker plays three needs in turn, each
  named in a pill and pressing the three keys the real quiz ranks first for it, so no platform is favoured). Touch
  screens play each one once, when its band reaches the middle of the screen (the CMS Picker one need, picked at
  random). Once a pointer is on a picture its play stops (`.hands`) and it answers the pointer instead. When the
  quiz's scoring changes, check the three needs still light its top three (`candidates()` in `cms-picker/score.js`).
- **Nothing reaches past the screen at any width:** checked at 1440, 1000, 820, 600, 390 and 320px. The bands run
  the full width; the words and pictures keep the site's column inside them, and its gutter widens for a notch
  (`viewport-fit=cover` with the safe-area insets).
