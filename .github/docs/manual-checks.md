# Checks on real devices

The parts automated checks can't cover. `.github\build\browser-check.mjs` already runs axe on every page and
loads Clean Paste and the Image Resizer at 375 and 390px in Chromium (Edge) and WebKit; Playwright's
Firefox doesn't start on John's PC, and nothing there is a real phone. So these need a person.

Run them on **an iPhone (Safari)**, **an Android phone (Chrome)**, **desktop Firefox** and, where it says
so, **a Mac**. About fifteen minutes for all three tools; for a release that only touches one tool, do
that tool's part. Once in light mode and once in dark (the moon/sun button in the top bar).

Anything that fails: note the device, browser, light/dark, and the step, and pass it on.

## CMS Picker

### 1. Quiz
- [ ] Open https://jsal.io/cms-picker/ and take the quiz (pick "An online store" so the shop-size question shows).
- [ ] On the results, tap one of the answer buttons above the cards, pick a different answer: the matches re-rank straight away.
- [ ] Each card shows Skill needed, Hosting and updates, and Cost to start side by side (stacked on a phone).
- [ ] Each of the three cards has a gold box ("A close call with…", "Ahead of…" or "Versus…") that makes sense for your answers.
- [ ] Switch "Show steps for" between the three matches; open one "How on…" link (it opens the platform's own help in a new tab).

### 2. Links, Back and Forward
- [ ] Press "Copy link to this result", open it in a new tab: the same matches and answers show.
- [ ] Change one answer in the address bar (e.g. `look=template` to `look=pixel`) and press Enter: the results update.
- [ ] Press Back, then Forward: the results follow each time, and Back from the first result leaves the page normally.
- [ ] "Start over" goes back to question 1 with it in view.

### 3. Notes and the table
- [ ] Phone: in "Compare platforms", tap two or three answers: each note opens; tapping elsewhere closes it.
- [ ] Desktop: hover an answer for its note; Tab to one and press Escape to close it; "Show notes" shows them all.
- [ ] Phone: the table is one card per question; nothing on the page scrolls sideways.
- [ ] Desktop: the table's platform names stay pinned at the top while you scroll through it.

### 4. Browse and compare
- [ ] "Show all" lists the 13 platforms one line each; tapping one opens its card.
- [ ] Pick "Online store": full cards for the platforms that fit, and the table compares them.

### 5. Small-screen details
- [ ] The first time you finish the quiz in that browser, the "Achievement unlocked · Decision made" pop-up appears once and doesn't cover any buttons. (To see it again, clear the site's data.)
- [ ] Buttons are easy to tap with a thumb, and nothing makes the page zoom in.

## Clean Paste

### 6. Pasting
- [ ] Desktop: copy a Word or Google Docs document and press Ctrl/⌘ + V anywhere on https://jsal.io/formatter/: the clean text appears with its checks.
- [ ] Phone: copy a paragraph from another app, then tap **Paste from clipboard** (allow it if asked): it loads. If the browser refuses, tap and hold the paste area and choose Paste instead: that loads too, and no keyboard opens.
- [ ] Google Docs: paste a document with a table and an image: the table stays a table, the image becomes an [Image] placeholder.

### 7. Checks and Show
- [ ] Tap **Show** on a check: the editor scrolls to the line and it flashes gold (stays highlighted, without fading, if the device has reduced motion turned on).
- [ ] With VoiceOver (iPhone/Mac) or TalkBack (Android): after a paste you hear how many things there are to check; after Show you hear the line it moved to.

### 8. Copying
- [ ] Safari and Firefox: each copy button (formatted, HTML, text, WordPress blocks) says "Copied", and pasting into a CMS editor gives the right result.
- [ ] Mac: the toolbar's tooltips show ⌘ (Bold ⌘B, Redo ⌘⇧Z), and those shortcuts work.

## Image Resizer

### 9. Loading
- [ ] iPhone: pick photos from the camera roll (HEIC): they load and show their real size.
- [ ] Windows Chrome or Edge: drop an iPhone HEIC photo: it shows "converting HEIC" and loads (or says "HEIC couldn't be converted" if not).
- [ ] Drop a very large photo (40 MB or more) on a phone: it either loads or is skipped with "too large to open here", and the page doesn't crash.
- [ ] A file named with accents or another script (e.g. `café 日本.jpg`) keeps those letters in its saved name.

### 10. Saving
- [ ] Safari: the WebP button is greyed out, images save as JPG, and someone who had chosen WebP before is told so in the status bar.
- [ ] Firefox and Safari: the Folder option isn't offered; Chrome and Edge offer it and save into the chosen folder.
- [ ] Mac: ⌘ + Shift + D runs Download All (and doesn't open the browser's "bookmark all tabs" instead).
- [ ] iPhone: Download All and ZIP both save where the person can find them (Files app).
