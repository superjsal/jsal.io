---
name: add-tool
description: Checklist for adding a new tool or page to jsal.io (head, top bar, nav.js menus, home tile, sitemap, checks, share image, changelog tag). Use whenever a new tool or page is created.
---

# Adding a new tool

- The same `<head>` as the other pages (theme script, `data-jsal-early` script, the shell.css line, Consent Mode defaults).
- Its icon before its name in the top bar (`.jsal-title-ico`, the same address as its tab icon).
- The `APPS` menu in `nav.js`.
- A bento tile on the home page, in its own tint, with a real-looking piece of the tool and its icon as a watermark (the home page rules in the design rules).
- `sitemap.xml` and `llms.txt`.
- The checks find a new page on their own (`check.py` and `browser-check.mjs` walk `site\` for `index.html`); add its main flow to `browser-check.mjs` if it has one worth testing at phone width.
- `TOOLS` in `nav.js` if it should count toward Explorer, plus a `window.jsalUsed?.()` call at its first real action (First steps and Explorer unlock on use, not on opening the page). Its own achievements go under its tool in `GROUP` on `/play/`.
- A share image (add it to `.github\build\og\og.html` and `make-og.ps1`).
- Its own tag on `/changelog/` and its own line in `SECTIONS` in `updates.py` (see the changelog rule in `CLAUDE.md`).
- GA4 events, if any, in `.claude\rules\analytics.md` and on `/privacy/`; a `.claude\rules\<tool>.md` for what a later session must know before changing it.
- Built and shown on `staging`; it goes live when John says ship it.

A new non-tool page needs the same head and, if indexable, `sitemap.xml`.
