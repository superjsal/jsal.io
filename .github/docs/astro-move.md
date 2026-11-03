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
- Nothing else uses the branch yet: the checks, the bump, `csp.py`, `playbook.py` and the nightly Action all still work
  on `site\`, unchanged.

## How each page moves

1. Make `src\layouts\Page.astro` from what every page shares: the `<head>` (charset, viewport, fonts and their
   preloads, favicon, manifest, the one-line `data-jsal-early` script, the `shell.css` link, `nav.js`) and the
   `.jsal-top` bar, with slots for the page's own head (title, description, canonical, JSON-LD, its styles) and the
   tool name in the bar.
2. Move one page at a time from `site\<page>\index.html` to `src\pages\<page>\index.astro` using the layout, and
   delete the old file in the same commit (a page in both places is an Astro build error).
3. **The test for each page:** build, then compare the new `dist\<page>\index.html` with the old file. Only whitespace
   and the order of `<head>` tags may differ; anything else is a bug. Then the usual browser checks on the preview.
4. Order, simplest first: Privacy, 404, Changelog, design system; the home page (with Updates); the four tools and
   Off the clock; the Playbook (`/ic/`) last of the pages, as it has its own login flow.
5. **Platform pages:** one `src\pages\cms-picker\[platform].astro` reading `site\cms-picker\data.json` at build time
   replaces the 14 files `playbook.py` writes from `.github\scripts\platform-page.html`. Then `playbook.py` only
   writes data, and the nightly publish's commit triggers a rebuild.
6. **Updates:** the home page reads the changelog's newest entries at build time, which retires `updates.py`. The
   changelog may become a data file or a content collection for that.

## Decisions to keep

- **Scripts stay as they are:** each app's modules move as plain files (`is:inline` or left in the public folder),
  not bundled, so the apps keep working exactly as now. Bundling or fingerprinting app code is a later, separate
  choice.
- **Page transitions stay native** (cross-document view transitions in `shell.css`). Don't add Astro's
  `<ClientRouter />`: it would replace them and break `nav.js`'s prerendering and held clicks.
- **The security policy:** `csp.py` hashes every inline script. After the move it must hash the built `dist\` pages,
  not `site\`; or switch to Astro's own CSP support if it covers `_headers` on Cloudflare. Decide before the first
  page with an inline script moves (the layout has the early script, so: before step 1 above).
- **Fingerprints:** `?v=` stays until every reference is built by Astro; then `bump-version.ps1` and `versions.py`
  go, and Astro's hashed file names take over for whatever it bundles.
- **Comments in served files:** `check.py`'s rules apply to the built pages. Frontmatter comments in `.astro` files
  aren't served, so they may name tooling.

## What else changes before shipping

- `check.py` and `browser-check.mjs` run on `dist\` (build first); the checks made unnecessary by the layout (top bar
  identical, early script copy, `?v=` current) are removed once nothing needs them.
- `.claude\launch.json`: `npm run dev` (port 4321) replaces the Python server; previews of a worktree get simpler too.
- The "Site checks" Action builds before checking; the nightly publish Action needs no build (Cloudflare builds).
- Docs: CLAUDE.md, SETUP.md, `how-it-works.md`, `design-rules.md` (check names), the `add-tool` skill.
- Ship the whole move at once, when every page on the branch preview matches staging, with John's "ship it".
