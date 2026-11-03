# Moving jsal.io to Astro

Working plan for the move, on the `astro` branch (worktree `.claude\worktrees\astro`). John agreed on 2026-11-02 to make
the switch "sooner rather than later" for easier upkeep, not less code: one layout instead of the head and top bar copied
into 11 pages, no version bump, the platform pages and Updates built from data. Delete this file once the move ships
and the docs describe the new setup.

## Where it stands

- **Step 1, done (`8aceef4`):** Astro 7.4.0 builds the site. `astro.config.mjs` uses `site\` as Astro's public folder,
  so it's copied into `dist\` unchanged; `wrangler.jsonc` runs `npm ci && npm run build` before each deploy and serves
  `dist\`. Checked: `dist\` matched `site\` byte for byte (149 files), and the branch preview
  (`https://astro-jsal-io.still-cell-826b.workers.dev`) matched staging on 17 addresses, headers included.
- **Step 2, done:** the security policy, the checks and the layout, with Privacy as the first page moved.
  - `.github\build\csp.mjs` (an Astro integration) writes the policy into `dist\_headers` at the end of every build,
    from the built pages; `site\_headers` keeps only the empty `csp:start`/`csp:end` markers. `csp.py` is gone, and
    the bump no longer touches `_headers`. Its first run wrote the same 13 hashes as `csp.py` had.
  - `check.py` builds first and checks `dist\` (so pages from `src\` and files from `site\` are checked alike);
    `browser-check.mjs`, `check.ps1` and the "Site checks" Action use the build too, served on port 8766 (the
    `jsal-build` preview). The root `package.json` lost `"type": "module"`, which had broken the quiz's CommonJS
    test scripts.
  - `src\layouts\Page.astro` is the document and shared `<head>`; `src\components\TopBar.astro` the top bar, which
    each page places itself (pages wrap it differently: `.wrap` on most, `main.app` on the tools). The logo, the
    theme button and the analytics note go out as raw HTML (`set:html`), so the bar is byte for byte the markup the
    unmoved pages carry and `check.py`'s top-bar rule still holds. `src\lib\v.mjs` works out each `?v=` as the page
    builds, so the layout's numbers can't go stale.
  - Privacy: `src\pages\privacy\index.astro`. Same markup as staging's (`compare.py`), and the same boxes, colours
    and fonts at 1280 and 375px in light and dark (`pagediff.mjs`); logo menu works; axe clean.
- **Step 3, done:** 404 and the design system moved (`src\pages\404.astro`, `src\pages\design-system\`), each the
  same as staging in markup and in the browser; the 404's dropped-dot animation plays and settles. The Changelog
  waits for Updates (6 below): `updates.py` and the checks read it from `site\`, and other sessions add
  to it on staging almost daily, which a renamed file would make a merge chore each time.
- Still on `site\`: `playbook.py`, the nightly Action and `versions.py` (which only sees `site\`; moved pages use
  `v()` instead).

## How each page moves

1. Done: the layout and the top bar (above). A page passes its title, description, path, share card, tab icon and
   flags (`cover`, `mono`, `analytics`, `robots`) as props; its JSON-LD, `<style is:inline>` and scripts go in the
   `head` slot; a tool's `<h1 class="jsal-title">` in TopBar's `title` slot, its About link in the default slot.
   Write every page script and style `is:inline` (bundling and scoping are a later choice). Text in the body with
   `{` or `}` needs escaping (`{"{"}`), as Astro reads braces as code. Astro drops an HTML comment inside `{…}` or
   sitting directly in a component's slot (one nested in an element survives), so those go out as raw HTML:
   `<Fragment set:html={`<!-- … -->`} />`. `.github\build\astro-move\move_page.py` does all of this for a page.
2. Move one page at a time from `site\<page>\index.html` to `src\pages\<page>\index.astro` using the layout, and
   delete the old file in the same commit (a page in both places is an Astro build error).
3. **The test for each page:** `npm run build`, then `python -I .github\build\astro-move\compare.py <page>` (the
   markup against staging's; it lists the differences it allows) and `node .github\build\astro-move\pagediff.mjs
   /<page>/` (every element's box, colour and font against staging's, both themes, two widths). Anything either
   reports is a bug. Then axe through `browser-check.mjs --axe`.
4. Order, simplest first: Privacy, 404 and the design system (done); the home page with Updates and the Changelog; the four tools and
   Off the clock; the Playbook (`/ic/`) last of the pages, as it has its own login flow.
5. **Platform pages:** one `src\pages\cms-picker\[platform].astro` reading `site\cms-picker\data.json` at build time
   replaces the 14 files `playbook.py` writes from `.github\scripts\platform-page.html`. Then `playbook.py` only
   writes data, and the nightly publish's commit triggers a rebuild.
6. **Updates:** the home page reads the changelog's newest entries at build time, which retires `updates.py`. The
   changelog may become a data file or a content collection for that; the Changelog page moves then, built from it.

## Decisions to keep

- **Scripts stay as they are:** each app's modules move as plain files (`is:inline` or left in the public folder),
  not bundled, so the apps keep working exactly as now. Bundling or fingerprinting app code is a later, separate
  choice.
- **Page transitions stay native** (cross-document view transitions in `shell.css`). Don't add Astro's
  `<ClientRouter />`: it would replace them and break `nav.js`'s prerendering and held clicks.
- **The security policy is written at build time** from `dist\` (`csp.mjs`), not with Astro's own CSP support:
  that sends a `<meta>` policy per page, which can't carry `frame-ancestors`, and hashes styles too, which the
  inline `style` attributes on every page would break.
- **Fingerprints:** `?v=` stays until every reference is built by Astro; then `bump-version.ps1` and `versions.py`
  go, and Astro's hashed file names take over for whatever it bundles.
- **Comments in served files:** `check.py`'s rules apply to the built pages. Frontmatter comments in `.astro` files
  aren't served, so they may name tooling.

## What else changes before shipping

- The checks made unnecessary by the layout (top bar identical, early script copy, `?v=` current) are removed once
  nothing needs them, and `.github\build\astro-move\` with them.
- `.claude\launch.json`: `jsal-build` (port 8766) serves the build for the checks; `npm run dev` (port 4321) may
  replace `jsal-site` for working on pages.
- The nightly publish Action needs no build (Cloudflare builds).
- **The GitHub Pages fallback** ("Deploy Pages") uploads `site\` as it is, so it would serve no moved page: retire it
  (due on or after 2026-11-09) before shipping, as planned anyway.
- **IndexNow on push** works out which pages changed from paths under `site\`; it needs to map `src\pages\` too (and
  a layout change to every page).
- Docs: CLAUDE.md, SETUP.md, `how-it-works.md`, `design-rules.md` (check names), the `add-tool` skill.
- Ship the whole move at once, when every page on the branch preview matches staging, with John's "ship it".
