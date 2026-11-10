---
paths:
  - "site/implement-check/**"
  - "src/pages/implement-check/**"
---

# Implement Check: what to know before changing it

- **Built 10 November 2026** for John's team's "Implement Check" step at work: before editing an existing client site, check one page of each type to find what really sets its content and tags (a custom template ignoring the CMS field, a page builder, a script, a tag manager, a cache). The spec agreed in a grilling session is `private\implement-check\SPEC.md`; the layout is mockup B of three (page types as a list, the chosen one's report beside it).
- **A bookmarklet, browser-only** (John's call: no Worker). `js/bookmarklet.js` is plain script, not a module; the page fetches it, puts its own address in `__SHEET__` and sets it as the `javascript:` link to drag. It fetches the page twice from the page's own origin (as served, for the cache headers; and with a `jsal-ic` query and `no-store`, the fresh copy) and compares the fresh HTML with the rendered DOM. Panel in a shadow root, styled with a constructed stylesheet (falls back to a `<style>`), so the client's CSS can't reach it.
- **Generic, never per CMS** (John: WordPress alone has too many builders). Platform, template, builder and SEO plugin are best-effort detection only.
- **Verdicts:** In the HTML (green), Added by JavaScript (blue), Changed by JavaScript (dashed terracotta), Missing (grey). Content compares word counts of `main`/`article`/body: added below half, changed past 15% and 40 words.
- **Find** walks down by `textContent` from `main` (or body) to the smallest element holding the text; checking every element's `innerText` hung big pages. "Only in page data" = in the HTML source but not shown.
- **WP Rocket's delay-JS** swallows the first clicks on a page until its scripts load, so the panel's buttons also act on `pointerup` (`act()`, once per press). Keep that.
- **Send to sheet** opens the sheet with the result after `#r=` (base64url JSON; never sent to a server), in a window named `jsal-implement-check`. The sheet stores it in localStorage (`jsal-implement-check`); if another copy of the sheet is open (BroadcastChannel), a tab the bookmark opened closes itself. Results are rendered as text only, never as HTML.
- **Not yet checked:** a real bookmark click (rather than injected code) on a site with a strict CSP, and Firefox. Later (mode 2, agreed): after-edit checks against the specialist's sheet, before/after snapshots.
- No home tile yet: it waits for John's decision after trying the tool on staging, and the home page redesign.
