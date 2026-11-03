---
paths:
  - "site/nav.js"
  - "site/shell.css"
  - "src/layouts/Page.astro"
  - "src/components/TopBar.astro"
  - "src/lib/topbar.mjs"
---

# Navigation: nav.js, the early script and page transitions

- `nav.js`: logo app menu, theme button, achievements, loading pages ahead on hover (speculation rules in Chrome and Edge, a plain prefetch in Brave and Firefox, which don't run them; Safari loads normally; the menu loads its pages ahead when opened), replaying clicks that land while pages change hands, and touch wording (`data-touch`). The layout loads it before a page's own deferred and module scripts (`check.py` checks), so the logo works before an app's modules arrive; clicks it replays on the page wait for the app's scripts.
- A one-line `<script data-jsal-early>` in the layout's `<head>` (after the favicon link) that holds a click landing before `nav.js` is ready, for `nav.js` to replay (without it a quick click after picking an app was lost, or the logo followed its plain link home), and on the first page of a visit folds the logo into its mark before the first paint, for `nav.js` to unfold. `check.py` fails a built page without it.
- **Page transitions** (the slide itself is in the design rules' Motion section): the early script in the layout's head sets `data-jsal-back` on `<html>` for Back, before the first frame: from the Navigation API where it answers, else by comparing each page's place in the visit (`jsalAt` in its history state, kept through an app's `replaceState`; the page being left records its own in `sessionStorage`). Every page's `.jsal-top` carries the logo caret and both theme icons in the HTML, not added by JS; the logo and theme button keep their own `view-transition-name`s and don't animate. Two elements with one name make the browser drop the transition silently.
- **The back-forward cache:** pages come back exactly as they were left (`pageshow` with `persisted`): anything `nav.js` holds for a navigation in progress (held clicks, the open menu) must reset then, or the logo looks dead after Back.
