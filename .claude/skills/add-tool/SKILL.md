---
name: add-tool
description: Checklist for adding a new tool or page to jsal.io (head, top bar, nav.js menus, home tile, sitemap, checks, share image, changelog tag). Use whenever a new tool or page is created.
---

# Adding a new tool

- The same `<head>` as the other pages (theme script, `data-jsal-early` script, Consent Mode defaults).
- Its icon before its name in the top bar (`.jsal-title-ico`, the same address as its tab icon).
- The `APPS` menu in `nav.js`.
- A picture tile on the home page.
- `sitemap.xml` and `llms.txt`.
- `PAGES` in `.github\build\check.py` and in `browser-check.mjs` next to it.
- `TOOLS` in `nav.js` if it should count toward Explorer, plus a `window.jsalUsed?.()` call at its first real action (First steps and Explorer unlock on use, not on opening the page).
- A share image (add it to `.github\build\og\og.html` and `make-og.ps1`).
- Its own tag on `/changelog/` and its own line in `SECTIONS` in `updates.py` (see the changelog rule in `CLAUDE.md`).

A new non-tool page needs the same head, `PAGES` in both checks and, if indexable, `sitemap.xml`.
