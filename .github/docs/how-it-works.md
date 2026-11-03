# How jsal.io works behind the pages

The site is static files on Cloudflare (a Worker with static assets only), built by Astro from GitHub on every push; the only moving parts are one database (Supabase, for the team Playbook and the CMS Picker's answers), eight GitHub Actions (one of them the GitHub Pages copy, a fallback until 2026-11-09), and the checks that run before a push. This page is the map; the rules that govern each part are in `CLAUDE.md` and `.claude\rules\cms-picker-playbook.md` (in the repo, never served), and the CMS Picker's data rules in `cms-picker-maintenance.md`.

```mermaid
flowchart TB
  subgraph DB["Supabase (source of truth for the Playbook and the CMS Picker's answers)"]
    app_data["app_data<br>the Playbook's base content"]
    edits["edits<br>admins' corrections on top"]
    picker["picker (admins only)<br>every CMS Picker answer, source,<br>profile, logo; which platforms are public"]
    team["members · access_requests<br>requests · votes · comments · platform_notes"]
  end

  subgraph PB["/ic/ Platform Playbook (team only, signs in with Discord)"]
    ic["src/pages/ic + ic/styles.css + ic/app.js<br>reads app_data + edits + team tables;<br>admins edit answers and the CMS Picker tab"]
  end
  DB <-->|"supabase-js, anon key,<br>row-level security"| ic

  subgraph PUB["Publish: playbook.py (service_role key; nightly Action 07:41 UTC, or by hand)"]
    pub["playbook.py publish<br>reads picker + app_data"]
    data["cms-picker/data.json<br>answers, profiles, sources"]
    logos["cms-picker/logos/uploaded/"]
    dates["src/data/cms-picker-dates.json<br>each page's date, moved on only<br>when the data it shows changed"]
    smap["sitemap.xml<br>(lastmod from those dates)"]
    checkd["check_data.py<br>fits cms-picker.schema.json;<br>no source, stale, unverified"]
  end
  picker --> pub
  app_data --> pub
  pub --> checkd --> data & logos & dates & smap

  subgraph PAGE["/cms-picker/ in the browser"]
    appjs["app.js + score.js<br>quiz, cards, table"]
    quiz["quiz.json<br>the quiz's own values (ships with the code)"]
    cmsjson[".github/scripts/cms-picker.json<br>rows and platform order (input to publish)"]
  end
  data --> appjs
  quiz --> appjs
  cmsjson --> pub

  subgraph GH["GitHub"]
    main[("main branch")]
    staging[("staging branch<br>day-to-day work; merged into main to ship")]
    deploy["Action: Deploy Pages (fallback until 2026-11-09)<br>every push to main: the same Astro build on GitHub Pages,<br>which no longer serves jsal.io"]
    a1["Action: Publish CMS Picker<br>daily 07:41 UTC: publish, commit,<br>wait for Cloudflare's build check, IndexNow ping"]
    a2["Action: Site checks<br>every push to main or staging: check.py, check_data.py, personas,<br>and the browser checks on Playwright's<br>Chromium, WebKit and Firefox (HOME=/root, or Firefox won't start)"]
    a3["Action: Keep Platform Playbook awake<br>Mon + Thu: calls the ping() function<br>so the free Supabase project doesn't pause<br>(URL and anon key: repository variables)"]
    a5["Action: Back up Platform Playbook<br>Sundays: every table, encrypted with the<br>BACKUP_PASSPHRASE secret, kept 90 days as an artifact"]
    a6["Action: IndexNow for changed pages<br>every hand push to main: builds before and after,<br>announces pages whose built HTML changed,<br>once Cloudflare's build is live"]
    a4["Action: Quarterly recheck reminder<br>1 Jan/Apr/Jul/Oct: opens an issue<br>(cost bands, add-on tiers, 'varies', devices)"]
    a7["Action: Source links<br>monthly: asks every help page the Picker links to;<br>opens an issue listing dead ones"]
  end
  subgraph CF["Cloudflare (DNS for jsal.io; the domain stays registered at Porkbun)"]
    build["Astro build (npm ci && npm run build, wrangler.jsonc)<br>src/pages + site/ → dist/: the layout, the CMS Picker page<br>and 14 platform pages from data.json and the dates,<br>the changelog collection, the CSP into dist/_headers"]
    worker["Worker jsal-io: serves dist/<br>(headers from site/_headers)"]
    live["jsal.io<br>live within a minute of a push to main;<br>www redirects here"]
    preview["staging-jsal-io…workers.dev<br>preview of staging (and of any pushed branch);<br>noindex, outside GA4"]
  end

  a1 --> pub
  data & logos & dates & smap -->|"commit: CMS Picker: nightly publish"| main
  main -->|"Cloudflare's GitHub app builds every push"| build --> worker --> live
  staging --> build
  worker --> preview
  staging -->|"ship: fast-forward"| main
  main --> deploy
  main & staging --> a2
  a3 --> DB
  DB --> a5
  main --> a6 --> bing

  subgraph DEV["Working on this PC (before a push)"]
    edit["edit the site: a page in src/pages, the layout,<br>shell.css, nav.js, a tool's CSS/JS, the changelog<br>(npm run dev previews as you save)"]
    bump["bump-version.ps1 → versions.py<br>after a JS module change: rewrites the ?v= in the<br>imports of it (pages work theirs out as they build)"]
    check["check.ps1 → check.py<br>top bar identical, every ?v= current, links exist,<br>JSON-LD, unused CSS, style rules, consent defaults,<br>after building the site"]
    bcheck["browser-check.mjs (Playwright: Edge or Chromium, WebKit; Firefox on GitHub)<br>axe on every page, 375/390px, each tool's main flow"]
    personas["personas.test.js<br>54 agreed quiz results still hold,<br>9 rules over every answer set;<br>expert-cases.js reports agreement with a consultant"]
    commit["stage by name, commit, push to staging<br>(a worktree's branch merges into staging)"]
  end
  edit --> bump --> check --> bcheck --> personas --> commit --> staging

  subgraph VIS["In the visitor's browser"]
    shell["shell.css (linked by the layout)<br>tokens, top bar, transitions, pop-ups"]
    nav["nav.js<br>app menu, theme, achievements (localStorage),<br>prerender on hover, click replay, consent card"]
    ga["GA4 via gtag.js<br>only where Consent Mode allows<br>(EU/EEA/UK/CH: off until Allow)"]
    tools["Clean Paste · Image Resizer · Redirect Import<br>everything runs in the browser; nothing uploaded"]
  end
  live --> shell & nav & tools
  nav -->|"jsalTrack / data-track"| ga

  idx["indexnow.py<br>by the publish Action and the push Action;<br>by hand only for a page whose file didn't change"] --> bing["Bing and other IndexNow engines"]
  smap -.->|only addresses in the sitemap| idx

  priv["the private folder (never committed)<br>backups of every table,<br>SQL waiting for John, research notes"]
  pub -.->|"playbook.py backup"| priv
```

## Reading the map

- **Content flows one way out of Supabase.** Admins edit on the live Playbook; `playbook.py publish` reads the `picker` table and writes `data.json`, the uploaded logos and each page's date; the Action commits them, and Cloudflare's build makes the CMS Picker page's plain-HTML copy (for crawlers that don't run JavaScript) and the 14 platform pages from them (`src/lib/cms-picker.mjs`). Nobody edits `data.json`, the uploaded logos or the dates by hand. Structural changes to the Playbook (a new item, page type or guide) go through `playbook.py pull` → edit `private\playbook\defaults.json` → `push`.
- **Two keys, two trust levels.** The browser uses the public anon key with row-level security (members read, admins write). The publish and backup scripts use the service_role key, which lives only in John's terminal (`SUPABASE_SERVICE_ROLE_KEY`) and in the Action's secrets.
- **The quiz is code plus data.** `score.js` (questions, scoring, wording) and `quiz.json` (per-platform values the published answers don't carry) ship with the page; everything else the quiz says comes from `data.json`. The personas test pins the agreed results; the expert cases (`expert-cases.js`) report, without ever failing, how often the quiz agrees with what an experienced consultant would pick.
- **A change is described once.** The changelog is a content collection (`src/content/changelog.json`, one entry per line, checked by the schema in `src/content.config.mjs`); the Changelog page and Updates on the home page both read it as they build, and an entry with a `short` leads its section in Updates. A bad entry (a date, a tag, HTML, the order) stops the build and names its line.
- **The project folder is the repository; `dist/` is what's served.** Astro builds the pages in `src/` with the files in `site/` (copied as they are) into `dist/`. `.github/` (workflows, build scripts, publish scripts, docs), the rules and `SETUP.md` sit beside them and never reach the site; `private/` is ignored. `wrangler.jsonc` builds the site and points Cloudflare at `dist/`, so nothing else is served; a push to `main` is live once Cloudflare's build check on the commit is green (it reports to GitHub as a check run).
- **Staging is a branch, not a second site.** Every push to `staging` updates its preview address and runs the Site checks, and touches nothing live: no deploy to jsal.io, no IndexNow, no GA4 (`nav.js` loads gtag.js only on jsal.io). Shipping fast-forwards `main` to `staging` in one push.
- **Cloudflare changes pages only if told to.** Its zone features that rewrite HTML (Email Address Obfuscation, Web Analytics' injected script) are off; served pages match the built files in `dist/` byte for byte, which is the check after any Cloudflare setting change.
- **Browsers keep the files that don't change for a year.** Cloudflare's default (`max-age=0, must-revalidate`) made every page ask again for each font, stylesheet and script before showing, so pages hung and drew their text in a fallback font first. `site/_headers` gives `.css`, `.js` and `fonts/` a year (safe because every CSS and JS reference carries its content hash, which `check.py` enforces; a font or the HEIC library that changes gets a new name) and `img/` a day; pages and JSON keep the default, so a deploy shows at once.
- **Cache numbers, worked out as the site builds.** Nothing is bundled: each app's CSS and JS ship as plain files. Every `?v=` is its file's content hash (8 hex characters of its SHA-256, line endings as LF so Windows and GitHub agree). The pages get theirs from the build (`v()` in `src/lib/v.mjs`, and `importmap()` for the apps' import maps; `quiz.json`'s is `data-quiz-v` on the CMS Picker's `app.js` tag), so they can't go stale; the apps' modules import each other with `?v=` too, which `bump-version.ps1` (`versions.py`) rewrites after a module changes. `check.py` fails any reference whose hash isn't the file's current one.
- **The Action is the full gate.** `check.py`, `check_data.py`, the personas and the browser checks (axe, phone widths, each tool's flow on Chromium, WebKit and Firefox) all run on every push; the PC runs the same before pushing. Firefox starts in neither place, so it stays on the real-device checklist.
- **Keep-awake reads the Supabase URL and anon key from the repository's Actions variables** (`SUPABASE_URL`, `SUPABASE_ANON_KEY`; the same public values `ic/app.js` carries). A new Supabase project means updating both.
- **Backups live in two places:** `playbook.py backup` on the PC (plain JSON in `private\backups`), and the Sunday Action's encrypted artifact on GitHub (90 days; `gh run download <run id> -n playbook-backup`, then `gpg --decrypt` with the passphrase John set as the `BACKUP_PASSPHRASE` secret). The repo is public and its artifacts are downloadable by any GitHub account, which is why the file is encrypted.
- **Source links are checked monthly.** `check_sources.py` (the "Source links" Action, 3rd of the month) fetches every unique address in `data.json`'s sources and `quiz.json`'s guides and free-plan pages, reports dead, blocked and moved pages; the addresses a site refused get a second pass in a real browser (`check_sources_browser.mjs`, Playwright's Chromium on the runner), and what's still refused is listed for a check by hand. An issue opens when either pass finds a dead page. Fixes go on the Playbook's CMS Picker tab, then a publish.
- **Security headers come from `site/_headers`:** HSTS (a year, no `includeSubDomains` while other subdomains aren't known to be HTTPS), `nosniff`, `X-Frame-Options: SAMEORIGIN`, `Cross-Origin-Opener-Policy: same-origin` (the Playbook's Discord sign-in is a full-page redirect, not a pop-up, so it isn't affected) and `Referrer-Policy`.
- **A content security policy, written from the pages.** `site/_headers` sends one on every response (between its `csp:start` and `csp:end` comments): scripts only from the site, gtag.js and the pinned Supabase script, plus each inline script by its SHA-256 hash (the early click holder, the theme and Consent Mode scripts, the apps' import maps, the 404's animation, the footer years, and the two fixed speculation rules `nav.js` adds); images, connections and the Playbook's Supabase and Discord hosts; no plug-ins, no framing by other sites, no forms posting elsewhere. Styles allow `'unsafe-inline'` (every page has inline styles). `.github/build/csp.mjs` writes the block into the built `dist/_headers` at the end of every build, from the built pages, so it can't fall behind an edited inline script (which the live site would otherwise block); `site/_headers` holds only the empty markers. Only the Image Resizer adds `'unsafe-eval'`, for its HEIC converter, which builds code as it runs. `'inline-speculation-rules'` can't be used: Chrome ignores it in a policy that lists hashes.
- **Nobody runs IndexNow by hand any more:** the nightly publish announces the pages whose dates it moved on, and the push Action builds the site before and after a push and announces every page whose built HTML changed (a page's own edit, the layout, the changelog).
- **Analytics are opt-in where the law asks.** Each page's head sets Consent Mode defaults; `nav.js` loads gtag.js only where analytics may run, and the home page footer reopens the choice.
