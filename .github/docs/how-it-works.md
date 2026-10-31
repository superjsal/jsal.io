# How jsal.io works behind the pages

The site is static files on GitHub Pages; the only moving parts are one database (Supabase, for the team Playbook and the CMS Picker's answers), four GitHub Actions, and the checks that run before a push. This page is the map; the rules that govern each part are in `CLAUDE.md` and `.claude\rules\cms-picker-playbook.md` (outside the repo), and the CMS Picker's data rules in `cms-picker-maintenance.md`.

```mermaid
flowchart TB
  subgraph DB["Supabase (source of truth for the Playbook and the CMS Picker's answers)"]
    app_data["app_data<br>the Playbook's base content"]
    edits["edits<br>admins' corrections on top"]
    picker["picker (admins only)<br>every CMS Picker answer, source,<br>profile, logo; which platforms are public"]
    team["members · access_requests<br>requests · votes · comments · platform_notes"]
  end

  subgraph PB["/ic/ Platform Playbook (team only, signs in with Discord)"]
    ic["ic/index.html + ic/styles.css + ic/app.js<br>reads app_data + edits + team tables;<br>admins edit answers and the CMS Picker tab"]
  end
  DB <-->|"supabase-js, anon key,<br>row-level security"| ic

  subgraph PUB["Publish: playbook.py (service_role key; nightly Action 07:41 UTC, or by hand)"]
    pub["playbook.py publish<br>reads picker + app_data"]
    data["cms-picker/data.json<br>answers, profiles, sources"]
    pp["cms-picker/&lt;platform&gt;/index.html ×13<br>from .github/scripts/platform-page.html"]
    logos["cms-picker/logos/uploaded/"]
    pre["plain-HTML copy inside cms-picker/index.html<br>(for crawlers before JS runs)"]
    smap["sitemap.xml"]
    checkd["check_data.py<br>fits cms-picker.schema.json;<br>no source, stale, unverified"]
  end
  picker --> pub
  app_data --> pub
  pub --> checkd --> data & pp & logos & pre & smap

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
    pages["GitHub Pages → jsal.io<br>(CNAME; live a minute or two after a push)"]
    a1["Action: Publish CMS Picker<br>daily 07:41 UTC: publish, commit,<br>rebuild Pages, IndexNow ping"]
    a2["Action: Site checks<br>every push: check.py, check_data.py, personas,<br>and the browser checks on Playwright's<br>Chromium, WebKit and Firefox"]
    a3["Action: Keep Platform Playbook awake<br>Mon + Thu: calls the ping() function<br>so the free Supabase project doesn't pause<br>(URL and anon key: repository variables)"]
    a5["Action: Back up Platform Playbook<br>Sundays: every table, encrypted with the<br>BACKUP_PASSPHRASE secret, kept 90 days as an artifact"]
    a6["Action: IndexNow for changed pages<br>every hand push: announces pages whose<br>index.html changed, once Pages is live"]
    a4["Action: Quarterly recheck reminder<br>1 Jan/Apr/Jul/Oct: opens an issue<br>(cost bands, add-on tiers, 'varies', devices)"]
  end
  a1 --> pub
  data & pp & logos & pre & smap -->|"commit: CMS Picker: nightly publish"| main
  main --> pages
  main --> a2
  a3 --> DB
  DB --> a5
  main --> a6 --> bing

  subgraph DEV["Working on this PC (before a push)"]
    edit["edit the site: shell.css, nav.js, a tool's CSS/JS, pages"]
    upd["updates.py<br>rewrites Updates on the home page from the<br>changelog's data-short lines"]
    bump["bump-version.ps1<br>bumps ?v= on every page, the shell.css link<br>and the apps' module imports"]
    check["check.ps1 → check.py<br>top bar identical, ?v= in step, links exist,<br>JSON-LD, unused CSS, style rules, consent defaults,<br>Updates matches the changelog"]
    bcheck["browser-check.mjs (Playwright: Edge or Chromium, WebKit, Firefox)<br>axe on every page, 375/390px, each tool's main flow"]
    personas["personas.test.js<br>37 agreed quiz results still hold"]
    commit["git pull --ff-only, stage by name, commit, push"]
  end
  edit --> upd --> bump --> check --> bcheck --> personas --> commit --> main

  subgraph VIS["In the visitor's browser"]
    shell["shell.css (one link on every page)<br>tokens, top bar, transitions, pop-ups"]
    nav["nav.js<br>app menu, theme, achievements (localStorage),<br>prerender on hover, click replay, consent card"]
    ga["GA4 via gtag.js<br>only where Consent Mode allows<br>(EU/EEA/UK/CH: off until Allow)"]
    tools["Clean Paste · Image Resizer<br>everything runs in the browser; nothing uploaded"]
  end
  pages --> shell & nav & tools
  nav -->|"jsalTrack / data-track"| ga

  idx["indexnow.py<br>by hand after a content change,<br>or by the publish Action"] --> bing["Bing and other IndexNow engines"]
  smap -.->|only addresses in the sitemap| idx

  priv["the private folder (never committed)<br>backups of every table,<br>SQL waiting for John, research notes"]
  pub -.->|"playbook.py backup"| priv
```

## Reading the map

- **Content flows one way out of Supabase.** Admins edit on the live Playbook; `playbook.py publish` reads the `picker` table and writes the CMS Picker's files; the Action commits them. Nobody edits `data.json`, the platform pages, the uploaded logos or the plain-HTML copy by hand. Structural changes to the Playbook (a new item, page type or guide) go through `playbook.py pull` → edit `private\playbook\defaults.json` → `push`.
- **Two keys, two trust levels.** The browser uses the public anon key with row-level security (members read, admins write). The publish and backup scripts use the service_role key, which lives only in John's terminal (`SUPABASE_SERVICE_ROLE_KEY`) and in the Action's secrets.
- **The quiz is code plus data.** `score.js` (questions, scoring, wording) and `quiz.json` (per-platform values the published answers don't carry) ship with the page; everything else the quiz says comes from `data.json`. The personas test pins the agreed results.
- **A change is described once.** The changelog is the record; an entry with a `data-short` leads its section in Updates on the home page, which `updates.py` writes between two marker comments in `index.html`. `check.py` fails when that block is out of date, so nobody edits it by hand.
- **Cache numbers, not a build.** There's no bundler. `bump-version.ps1` rewrites `?v=` so browsers fetch changed files; `check.py` fails a page whose numbers are out of step.
- **The Action is the full gate.** `check.py`, `check_data.py`, the personas and the browser checks (axe, phone widths, each tool's flow on Chromium, WebKit and Firefox) all run on every push; the PC runs the same before pushing, Firefox excepted (it won't start there).
- **Keep-awake reads the Supabase URL and anon key from the repository's Actions variables** (`SUPABASE_URL`, `SUPABASE_ANON_KEY`; the same public values `ic/app.js` carries). A new Supabase project means updating both.
- **Backups live in two places:** `playbook.py backup` on the PC (plain JSON in `private\backups`), and the Sunday Action's encrypted artifact on GitHub (90 days; `gh run download <run id> -n playbook-backup`, then `gpg --decrypt` with the passphrase John set as the `BACKUP_PASSPHRASE` secret). The repo is public and its artifacts are downloadable by any GitHub account, which is why the file is encrypted.
- **Nobody runs IndexNow by hand any more:** the nightly publish announces its pages and the push Action announces any page whose `index.html` changed.
- **Analytics are opt-in where the law asks.** Each page's head sets Consent Mode defaults; `nav.js` loads gtag.js only where analytics may run, and the home page footer reopens the choice.
