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
    the bump no longer touches `_headers`. Its first run wrote the same 13 hashes as `csp.py` had. Merging staging
    conflicts in `site\_headers` whenever staging changed an inline script: keep the branch's empty markers
    (`git checkout --ours site/_headers`); the build writes the new hashes.
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
  waits (see step 4): other sessions add to it on staging almost daily, which a renamed file would make a merge
  chore each time.
- **Step 4, done:** the home page (`src\pages\index.astro`), with Updates read from the changelog as it builds
  (`src\components\Updates.astro`, `src\lib\updates.mjs`, a port of `updates.py`'s rules); `updates.py` and its
  check are gone. A changelog Updates can't use (a stray tag, a section with no `data-short`, an entry above the
  first date) stops the build; a line past 40 characters is a note that `check.py` passes on. Same as staging in
  markup and in Edge at both widths and themes; the full browser checks pass in Edge and WebKit.
  - The Changelog page stays in `site\` until just before shipping: Updates reads it there, and staging keeps
    adding to it. Move it last, as a straight move like Privacy (the entries can stay HTML).
- **Step 5, done:** Clean Paste, the Image Resizer, Redirect Import and Off the clock moved
  (`src\pages\formatter\`, `image-resizer\`, `redirects\`, `play\`). A tool's stylesheet, import map and module script
  go in the head slot with every `?v=` worked out as it builds (`v("styles.css", "/formatter/")`, and
  `importmap()` in `src\lib\v.mjs`; vendor files keep their own `?v=`), its title in TopBar's `title` slot and the
  bar's `app-header` class as a prop. The modules themselves stay in `site\`, where the bump still versions their
  imports of each other. Each page is the same as staging in markup and in Edge at both widths and themes; axe and the
  full browser checks pass in Edge and WebKit, and every inline script (the new import maps too) is in the policy.
- **Step 6, done:** the CMS Picker and its 14 platform pages are built from `site\cms-picker\data.json`
  (`src\pages\cms-picker\index.astro`, `[platform].astro`, both from `src\lib\cms-picker.mjs`, a port of the
  publish's `prerender()` and `platform_pages()` that writes the same markup); `platform-page.html` is gone, and the
  prerender markers with it. The publish now writes only data: `data.json`, the logos, and
  `src\data\cms-picker-dates.json`, each page's date with a fingerprint of the data it shows, moved on only when that
  data changes (`page_dates()`; `playbook.py dates` reruns it without a key), and the sitemap's lastmod from it. The
  nightly Action commits those; IndexNow's `changed` reads the moved dates. All 15 pages are the same as staging in
  markup and in Edge (the CMS Picker at 1,305 elements); axe, the browser checks and the quiz to "Compare these side
  by side" work on the build.
- **Step 7, done:** the team Playbook (`src\pages\ic\index.astro`). Its bar keeps its own layout (the view switcher
  and the account sit beside the title as the bar's own children, and wrap to a second row on phones), so it doesn't
  use TopBar; it takes the logo and the theme button from `src\lib\topbar.mjs`, the same markup TopBar uses. Its logo
  link lost a `brand` class nothing used. Same as staging in markup, and in Edge signed out and signed in (from the
  latest backup, Supabase blocked) at both widths and themes.
- **Step 8, done: every page is built by Astro.** The Changelog is a content collection: `src\content\changelog.json`
  (newest first, one entry per line: date, tag, optional `short`, sentence with Markdown links), checked by the schema
  in `src\content.config.mjs` (a real date, a tag from `SECTIONS` in `src\lib\changelog.mjs`, no HTML, no unknown
  field) and for order; a bad entry stops the build, and an entry's id is its line in the file. The Changelog page
  (`src\pages\changelog\`) and Updates (`src\lib\updates.mjs`, now reading the collection) are the same as staging
  in markup and in Edge. `site\` now holds only the files the pages use.
- **Merging staging into `astro`:** a change on staging to a page that has moved comes in as a modify/delete
  conflict. Port the change into the page's `.astro` file by hand, then `git rm` the old file. On staging,
  `updates.py` rewrites `site\index.html` whenever a `data-short` line is added: that one needs no porting (the
  build makes Updates itself), so just `git rm site/index.html`. The same goes for a change on staging that only
  moves a moved page's `?v=` numbers (a bump after editing a tool's CSS or JS): the build works them out, so take the
  `site\` side of the CSS or JS and `git rm` the page. **The nightly publish** commits the CMS Picker page and the
  platform pages to `main` until the move ships: take the branch's side (`git rm` them), keep the merged `data.json`,
  then run `python -I .github\scripts\playbook.py dates` so the dates follow the new data, and commit its changes.
  **The changelog:** staging's new lines arrive as a modify/delete conflict on `site\changelog\index.html`. Run
  `python -I .github\build\astro-move\changelog_json.py` (it rewrites `changelog.json` from origin/staging's page,
  the whole list), then `git rm` the page. Until the move ships, add nothing to `changelog.json` on this branch, or
  the next conversion overwrites it.
- Still on `site\`: `versions.py` (which only sees `site\`; moved pages use `v()` instead).

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
4. Order, simplest first: Privacy, 404, the design system, the home page, three tools, Off the clock, the CMS
   Picker and its platform pages, the Playbook (done); the Changelog last, just before shipping, as a content
   collection (below).
5. **Platform pages:** done (step 6 above).
6. **Updates:** done (step 4 above).
7. **The Changelog as a content collection:** when it moves, its entries become data (date, tag, sentence and the
   optional short line for Updates) in an Astro content collection with a schema: the tag from the fixed list, the
   short line about 40 characters, a real date. The Changelog page and Updates both read the collection, and
   `src\lib\updates.mjs`'s parsing of the page's HTML goes. Markdown carries the links inside a sentence.

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
- The move's own changelog line goes into `changelog.json` on the day it ships (after the last conversion).
- Docs: CLAUDE.md (the changelog rule: entries are lines in `src\content\changelog.json`, `short` replaces
  `data-short`, `updates.py` is gone), SETUP.md, `how-it-works.md` (the publish now writes data and dates, not pages),
  `design-rules.md` (check names), `cms-picker-maintenance.md` and `.claude\rules\cms-picker-playbook.md` (where
  the platform pages and the plain-HTML copy come from), the `add-tool` skill.
- The nightly Action's "Deploy Pages (fallback)" step goes with the fallback.
- Ship the whole move at once, when every page on the branch preview matches staging, with John's "ship it".
