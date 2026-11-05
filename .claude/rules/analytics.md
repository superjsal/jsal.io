---
paths:
  - "site/nav.js"
  - "src/layouts/Page.astro"
  - "site/cms-picker/**"
  - "src/pages/cms-picker/**"
  - "src/lib/cms-picker.mjs"
  - "src/pages/privacy/**"
---

# Analytics events (GA4, on the public pages)

- `window.jsalTrack('name', { params })`, or `data-track="name"` with `data-track-*` params on a link or button (`nav.js` sends it on click; params come out snake_case).
- In use: `quiz_result` (top_match, fit, source quiz/link), `quiz_feedback` (top_match, agree yes/no, answers) and `quiz_pick` (top_match, platform or `unsure`, answers) from "Is … what you'd pick?" under the best match (`answers` is the quiz's answers joined with dots, e.g. `site.local.easy.no.none.visual.no.low`, plus `.lang` / `.hubspot` for ticks; since quiz v6 the needs answer can be a comma list, `site.local.easy.no.bookings,sell.visual.no.low`, at most about 90 characters in all, under GA4's 100-character limit for a parameter value), `platform_page_open` (platform, from chips/card), `compare_add` (platform), `docs_click` (platform, question), `redirect_file` (platform, or `none` before one is picked, redirects, action copy/download) and `redirect_check` (platform, rows, works, fix, not_checked; at the end of a whole Live check, not a retry) from Redirect Import (never the addresses themselves). `rows`, `works`, `fix` and `not_checked` still need custom definitions (metrics) in GA4.
- Snake_case names; a new param shows in GA4 reports only once it's added under Admin → Custom definitions.
- Test with Google's addresses blocked so nothing reaches the real property. Since 2026-11-02 `nav.js` loads gtag.js only on jsal.io (and www): before that, local previews, the old superjsal.github.io address and above all the Site checks Action (which serves the site on localhost after every push, from Microsoft data centres) counted as visits, about 9 in 10 of all users (of the rest, about 68 visitors on jsal.io, and no quiz feedback).
- **The property:** since 2026-11-02 the site sends to a fresh GA4 property, "jsal.io" (`p561880070`, measurement ID `G-Z0BSTC9TT9`, Chicago time), started clean so no report carries the old test traffic. Its custom definitions: Link source (`from`), Platform, Quiz agree, Quiz answers, Quiz top match, SEO question (`question`), Quiz fit, Quiz source, Redirect action (`action`). Retention 2 months for events and 14 months for users, reset on return; Google signals and user-provided data off, as `/privacy/` says. The old property (`p540088341`, `G-ND4L6CSD8S`) was moved to GA4's trash on 2026-11-02 and is deleted for good on 2026-12-07; don't restore it. GA4 names its cookie after the measurement ID (`_ga_Z0BSTC9TT9`), so a new property also changes the cookie named on `/privacy/`.
- Consent is basic Consent Mode: the layout's head (`src\layouts\Page.astro`, every page but the Playbook) sets the gtag queue and defaults (denied in the EU, EEA, UK and Switzerland; `check.py` enforces them), and `nav.js` fetches gtag.js only where analytics may run (not for European time zones until Allow).
- `/privacy/` describes all of it; update it when what's collected, the cookies or GA4's retention change.
