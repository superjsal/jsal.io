# Checks on real devices

The parts automated checks can't cover. `.github\build\browser-check.mjs` already runs axe on every page and
loads the tools at 375 and 390px in Chromium (Edge) and WebKit, and Claude can tap through the quiz on an emulated
phone and measure it; Playwright's Firefox doesn't start on John's PC (only a first-screen screenshot from the
installed Firefox, no scripting; the Site checks Action does run the phone-width checks in Firefox), and nothing
there is a real phone. So these need a person.

Run them on **an iPhone (Safari)**, **an Android phone (Chrome)**, **desktop Firefox** and, where it says
so, **a Mac**. About twenty minutes for everything; for a release that only touches one part, do that part.
Once in light mode and once in dark (the moon/sun button in the top bar).

Before a ship, run them on the staging preview (https://staging-jsal-io.still-cell-826b.workers.dev) instead of
jsal.io: it's the same site with the waiting changes, and nothing there counts in analytics.

Anything that fails: note the device, browser, light/dark, and the step, and pass it on.

## Site (every browser)

### 1. Moving between pages
- [ ] Firefox: from the home page open the CMS Picker, a platform guide and the changelog, then press Back twice: each page just appears (Firefox has no page transitions) and the top bar stays put; nothing flashes or lands scrolled down.
- [ ] Firefox: hover a link to another page for a moment, and the developer tools' Network panel shows that page fetched before the click (a prefetch); a quick pass over a link, the logo and the Playbook link fetch nothing.
- [ ] Phone: the same route: the page slides up on the way in and down on Back, and the logo and theme button don't move. (Back by swiping from the screen's edge plays Safari's own slide instead; use the Back button to see the site's.)
- [ ] After Back, the logo menu still opens and its links still work (the page came back from the browser's cache).
- [ ] The logo menu: open it, pick a tool before the page has finished loading: you land on that tool, not on the home page.

### 2. Home page
- [ ] Desktop (1280px or wider): the tiles sit in rows: the intro beside the CMS Picker, the Image Resizer and Clean Paste, Say hi and Redirect Import, then Updates across the bottom. Nothing pokes into the page's side margin.
- [ ] Desktop: point at a tool tile: its picture plays what the tool does three times, then rests. Firefox too.
- [ ] Phone, upright: one tile per row, Say hi after every tool and just before Updates; each tool's picture plays once as its tile reaches the middle of the screen.
- [ ] Phone on its side: the tiles stay in two columns, a piece poking out of a tile never touches the next tile, and nothing hides under the notch.
- [ ] The footer: "Platform guides" is a plain row of links, easy to tap on a phone, with Off the clock beside Privacy.
- [ ] The small line under the top bar ("JOHN SALVADOR · TECHNICAL SEO", a platform page's breadcrumb, "CHANGELOG") doesn't shift sideways or up and down between pages.

### 3. Theme
- [ ] Switch to dark and reload: it stays dark; open another page: still dark; no light flash before the page shows.
- [ ] Dark mode: warnings read as terracotta, not gold; red is a soft rose; gold text is still readable on the dark background.

## CMS Picker

### 4. Quiz (v6)
- [ ] Open https://jsal.io/cms-picker/ and take the quiz as a local business, not technical, hosting by the platform. "Anything you'll need from day one?" is a checklist: tick **Bookings or appointments** and **Selling online too** (a tap anywhere on a row ticks it), then **Next**. The result's "From day one" tile reads "Bookings or appointments, Selling online too".
- [ ] On that checklist: Back and then Next again keeps your ticks; Next with nothing ticked shows "Nothing special" on the result; "Two or more languages" is the list's last row.
- [ ] Firefox: ticked rows show their selected look (gold edge and tinted fill) and the checkbox itself is gold.
- [ ] "Which best describes you or your site?": "We already pay for HubSpot" is a plain line with a checkbox above the answers, with no box around it; ticking it fills only the checkbox, and the answer tiles below still move on at one tap.
- [ ] On the result, tap the "From day one" tile: its choices open as equal rows (one column on a phone) and stay open while you switch needs on and off; each tap re-ranks, and taking them all off shows "Nothing special".
- [ ] Phone: "Your answers" is folded under the heading; the first card is in view without scrolling past the answers; opening the fold and tapping an answer re-ranks straight away.
- [ ] Take it again with "Arrange things visually myself", nothing special from day one, up to about $25: Wix is "Best match" and Squarespace "Close second", and Wix's box says why it comes first.
- [ ] "Moving from somewhere?": the 14 logos are easy to tap on a phone; pick Wix: Wix never appears as a match, the result says what Wix lets you take, and "Had a platform in mind?" shows where Wix ranks.
- [ ] Staying put: a local business, not technical, the platform hosting, nothing special, a good template, moving from **Squarespace**, up to about $25: a blue note above the cards says Squarespace, where the site is now, fits as well as Wix, so staying may be the better choice.
- [ ] Changing an answer on the result: every question's choices open as equal rows; "Moving from somewhere?" lists its 16 choices in two columns on a phone, and nothing runs off the edge.
- [ ] "How sure" line: a close call, a clear lead or a clear winner, and it matches the gap you'd expect from the cards.

### 5. From the result into the table
- [ ] Tap "Compare these side by side" (top or bottom): the table opens with the three matches, their fit labels in the headers, one gold line above saying what put the best match ahead, and you land on that line.
- [ ] Phone: rows your answers rule out are folded to their label; tapping one opens it; the section count stays clear of the "Top" button.
- [ ] Switch "Only differences" on: rows where all three say the same disappear; "Show notes" works the same way.
- [ ] Tap a Compare chip by hand: the fit labels and the gold line go (the table is plain again).
- [ ] Phone: the single-platform pickers ("Show steps for", "Had a platform in mind?") use the phone's own picker, and the Compare chips sit in two even columns.

### 6. Links, Back and Forward
- [ ] "Copy link to this result", open it in a new tab: the same matches and answers show, and the address says `v=6` (two needs read `needs=bookings%2Csell`).
- [ ] An older link still opens on its result: `https://jsal.io/cms-picker/#quiz?v=5&what=site&kind=local&who=easy&care=no&needs=bookings&lang=yes&look=template&moving=no&budget=low` shows "Bookings or appointments" and "Two or more languages".
- [ ] Open an old link by hand: `https://jsal.io/cms-picker/#quiz?v=3&what=site&kind=local&who=easy&care=no&needs=lang&look=template&moving=no&budget=low` shows the result with "Two or more languages" ticked and "Nothing special from day one".
- [ ] Press Back, then Forward: the results follow each time, and Back from the first result leaves the page normally.
- [ ] "Start over" goes back to question 1 with it in view.

### 7. Platform pages
- [ ] Open a guide (e.g. https://jsal.io/cms-picker/wix/): the breadcrumb lines up with the home page's name line; "Compare Wix with others" opens the table with Wix as the first column.
- [ ] Phone: the four facts under "Is Wix right for you?", after the SEO answers (type, starting cost, hosting, what you can take with you), take a row each and read in one to three lines; nothing scrolls sideways.
- [ ] The notes read in plain words, with the platform's own term in brackets where you'd meet it in its settings (e.g. "the bots file (robots.txt)", "add-on (module)" on Drupal).
- [ ] A "docs" link beside a reason on the result opens the platform's own help page in a new tab.

### 8. Notes and the table
- [ ] Phone: in "Compare platforms", tap two or three answers: each note opens; tapping elsewhere closes it.
- [ ] Desktop Firefox: hover an answer for its note; Tab to one and press Escape to close it; "Show notes" shows them all.
- [ ] Desktop: the table's platform names stay pinned at the top while you scroll through it.

### 9. Small-screen details
- [ ] The first time you finish the quiz in that browser, the "Achievement unlocked · Decision made" pop-up appears once and doesn't cover any buttons. (To see it again, clear the site's data.)
- [ ] Buttons are easy to tap with a thumb, and nothing makes the page zoom in (iPhone: no field is under 16px).

## Clean Paste

### 10. Pasting
- [ ] Desktop: copy a Word or Google Docs document and press Ctrl/⌘ + V anywhere on https://jsal.io/formatter/: the clean text appears with its checks.
- [ ] Phone: copy a paragraph from another app, then tap **Paste from clipboard** (on an iPhone Safari then shows its own small Paste button to tap: that's how iOS asks permission): it loads. Tap and hold the paste area and choose Paste instead: that loads too, no keyboard opens and no text cursor blinks in the instructions.
- [ ] Google Docs: paste a document with a table and an image: the table stays a table, the image becomes an [Image] placeholder.

### 11. Checks and Show
- [ ] Tap **Show** on a check: the editor scrolls to the line and it flashes gold (stays highlighted, without fading, if the device has reduced motion turned on).
- [ ] With VoiceOver (iPhone/Mac) or TalkBack (Android): after a paste you hear how many things there are to check; after Show you hear the line it moved to.

### 12. Copying
- [ ] Safari and Firefox: each copy button (formatted, HTML, text, WordPress blocks) says "Copied", and pasting into a CMS editor gives the right result.
- [ ] Mac: the toolbar's tooltips show ⌘ (Bold ⌘B, Redo ⌘⇧Z), and those shortcuts work.

## Image Resizer

### 13. Loading
- [ ] iPhone: pick photos from the camera roll (HEIC): they load and show their real size.
- [ ] Windows Chrome or Edge: drop an iPhone HEIC photo: it shows "converting HEIC" and loads (or says "HEIC couldn't be converted" if not).
- [ ] Drop a very large photo (40 MB or more) on a phone: it either loads or is skipped with "too large to open here", and the page doesn't crash.
- [ ] A file named with accents or another script (e.g. `café 日本.jpg`) keeps those letters in its saved name.

### 14. Saving
- [ ] Safari: the WebP button is greyed out, images save as JPG, and someone who had chosen WebP before is told so in the status bar.
- [ ] Firefox and Safari: the Folder option isn't offered; Chrome and Edge offer it and save into the chosen folder.
- [ ] Mac: ⌘ + Shift + D runs Download All (and doesn't open the browser's "bookmark all tabs" instead).
- [ ] iPhone: Download All and ZIP both save where the person can find them (Files app).

## Redirect Import

### 15. Loading a sheet
- [ ] Desktop: drop a CSV, then an Excel file (.xlsx), on https://jsal.io/redirects/: each loads, and its rows keep the spreadsheet's row numbers.
- [ ] Copy two columns of old and new addresses from Excel or Google Sheets and paste them: they load the same way.
- [ ] Reload the page: the sheet comes back as you left it; Clear forgets it.

### 16. The file
- [ ] Pick a platform: its file shows beside the sheet; with rows that need you, the buttons read "Copy 4 of 10" and "Download 4 of 10", never a plain Download.
- [ ] Safari and Firefox: Copy says "Copied", and Download saves a file with the platform's name and the right extension.
- [ ] Phone: the sheet and the file show one at a time, switching between them works, and editing an address doesn't zoom the page.
