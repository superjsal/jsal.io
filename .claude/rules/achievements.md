---
paths:
  - "site/nav.js"
  - "src/pages/play/**"
---

# Achievements

- To add one, add it to `ACH` in `nav.js` and call `window.jsalAchieve('id')` where it happens, then, in `src\pages\play\index.astro`, put it under its tool in `GROUP` (unlisted ones go under Around the site, secrets under Secrets) and give it a trophy in `TROPHIES` (a Blizzard item icon under `site\img\wow\`, see `off-the-clock.md`; without one it drops a plain pouch).
- The pop-ups work on every page; the list and the Backpack's Trophies bag are on `/play/`. They're kept in each visitor's browser only; none on the team Playbook.
- An achievement for visiting a page waits for `prerenderingchange` when `document.prerendering` is true, as `nav.js` loads pages ahead on hover.
