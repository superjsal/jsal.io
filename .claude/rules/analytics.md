---
paths:
  - "site/nav.js"
  - "site/privacy/**"
  - "site/cms-picker/**"
  - ".github/scripts/platform-page.html"
---

# Analytics events (GA4, on the public pages)

- `window.jsalTrack('name', { params })`, or `data-track="name"` with `data-track-*` params on a link or button (`nav.js` sends it on click; params come out snake_case).
- In use: `quiz_result` (top_match, fit, source quiz/link), `platform_page_open` (platform, from chips/card), `compare_add` (platform), `docs_click` (platform, question).
- Snake_case names; a new param shows in GA4 reports only once it's added under Admin → Custom definitions.
- Test with Google's addresses blocked so nothing reaches the real property.
- Consent is basic Consent Mode: each page's head sets the gtag queue and defaults (denied in the EU, EEA, UK and Switzerland; `check.py` enforces them), and `nav.js` fetches gtag.js only where analytics may run (not for European time zones until Allow).
- `/privacy/` describes all of it; update it when what's collected, the cookies or GA4's retention change.
