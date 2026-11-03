---
name: add-tool
description: Checklist for adding a new tool or page to jsal.io (layout, top bar, nav.js menus, home tile, sitemap, checks, share image, changelog tag). Use whenever a new tool or page is created.
---

# Adding a new tool

- A page at `src\pages\<tool>\index.astro` on the shared layout (`<Page>` from `src\layouts\Page.astro`, which writes the whole shared head: theme, the early click holder, shell.css, nav.js, Consent Mode defaults). Pass its title, description, path, share card (`ogDescription`, `ogImage`, `ogImageAlt`) and tab icon as props; its JSON-LD, stylesheet, import map and scripts go in the `head` slot, written `is:inline`, with every `?v=` from `v()` (and `importmap()`) in `src\lib\v.mjs`. Its CSS and JS go in `site\<tool>\`. Copy an existing tool page (`src\pages\formatter\index.astro`) as the starting point.
- `<TopBar class="app-header">` with its title in the `title` slot: its icon before its name (`.jsal-title-ico`, the same address as its tab icon) and its About link in the default slot.
- The `APPS` menu in `nav.js`.
- A bento tile on the home page, in its own tint, with a real-looking piece of the tool and its icon as a watermark (the home page's design rules, `.claude\rules\home-page.md`).
- A line for it in `src\pages\llms.txt.js`. The sitemap needs nothing: the build lists every page that isn't noindex, dated by its newest changelog line.
- The checks find a new page on their own (`check.py` and `browser-check.mjs` walk the build in `dist\` for `index.html`); add its main flow to `browser-check.mjs` if it has one worth testing at phone width.
- `TOOLS` in `nav.js` if it should count toward Explorer, plus a `window.jsalUsed?.()` call at its first real action (First steps and Explorer unlock on use, not on opening the page). Its own achievements go under its tool in `GROUP` on `/play/`.
- A share image (add it to `.github\build\og\og.html` and `make-og.ps1`).
- Its own entry in `SECTIONS` in `src\lib\changelog.mjs` (its tag, address and icon): the changelog collection accepts only those tags, and Updates shows them in that order (see the changelog rule in `CLAUDE.md`).
- GA4 events, if any, in `.claude\rules\analytics.md` and on `/privacy/`; a `.claude\rules\<tool>.md` for what a later session must know before changing it.
- Built and shown on `staging`; it goes live when John says ship it.

A new non-tool page uses the same layout (its own `<style is:inline slot="head">`, `<TopBar />` inside its `.wrap`, as `src\pages\privacy\index.astro` does); the build adds it to the sitemap unless it's noindex.
