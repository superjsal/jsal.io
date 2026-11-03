# jsal.io

John Salvador's site: a home page, browser tools and a few plain pages, hosted free on Cloudflare.

| Address | What it is | Files |
|---|---|---|
| jsal.io | Home page | `site\index.html` |
| jsal.io/image-resizer/ | Image Resizer | `site\image-resizer\` |
| jsal.io/formatter/ | Clean Paste | `site\formatter\` |
| jsal.io/redirects/ | Redirect Import | `site\redirects\` |
| jsal.io/cms-picker/ | CMS Picker (public, published from the Playbook) | `site\cms-picker\` |
| jsal.io/ic/ | Platform Playbook (team only, Discord sign-in) | `site\ic\` |
| jsal.io/play/ | Mostly Warcraft ("Off the clock": the WoW tile, the backpack, achievements) | `site\play\` |
| jsal.io/changelog/ | Every change, newest first (noindex; the home page's Updates come from it) | `site\changelog\` |
| jsal.io/privacy/ | What the site collects | `site\privacy\` |
| jsal.io/design-system/ | The design rules shown visually (noindex, linked from nowhere) | `site\design-system\` |

The old resizer address, superjsal.github.io/image-resizer, only redirects to jsal.io/image-resizer (its repo, `superjsal/image-resizer`, holds only the redirect pages and the old history).

## This folder

This whole folder is the GitHub repo `superjsal/jsal.io`; only `site\` is published. Cloudflare deploys every push on its own: `main` goes to jsal.io within a minute, and `staging` to its preview, https://staging-jsal-io.still-cell-826b.workers.dev, where changes wait until you ship them. `wrangler.jsonc` at the root tells Cloudflare what to serve.

- `site\` — **everything that's published.**
  - `shell.css` (shared colours, building blocks, top bar, page transitions; every page links it with `?v=` its content hash) and `nav.js` (app menu, theme button, achievements).
  - `_headers` (response headers Cloudflare adds), `404.html`, `robots.txt`, `sitemap.xml`, `llms.txt`, `favicon.svg`, `apple-touch-icon.png`, `og\` (link-preview images), `img\`, `fonts\`.
  - `ic\supabase\schema.sql` — sets up the Playbook's database from scratch (tables, access rules, admin functions). Safe to re-run.
- `.github\` — not served. `workflows\` are the GitHub Actions: the site checks on every push to `main` and `staging`, the old GitHub Pages deploy (a fallback until it's retired), IndexNow for changed pages after a push, the nightly CMS Picker publish, the keep-awake ping (Mondays and Thursdays), the encrypted Playbook backup (Sundays), the source-link check (monthly) and the quarterly recheck reminder. `scripts\` holds `playbook.py` with `cms-picker.json` and the platform-page template, `check_data.py`, `check_sources.py`, the persona tests and expert cases, and `indexnow.py`. `docs\` holds the design rules, how the site writes (`voice.md`), a map of the backend (`how-it-works.md`), the CMS Picker's maintenance note (`cms-picker-maintenance.md`: how its data, scoring and tests fit together), a twenty-minute real-device checklist to run before releases (`manual-checks.md`) and the user-test script.
- `.github\build\` — the scripts, in the repo so they work on any machine:
  - `check.ps1` — pre-push checks (top bar, cache numbers, broken links, unused CSS, branding, consistent styling), via `check.py`, which the "Site checks" Action also runs on every push.
  - `browser-check.mjs` — axe and phone-width runs in real browsers. Needs Node: run `npm ci` in that folder once per machine (`node_modules` isn't committed).
  - `bump-version.ps1` — updates the `?v=` cache numbers. Each is a short hash of its file's contents, so only the references to the files you changed are rewritten (in the pages, the apps' module imports and the platform-page template). The work is in `versions.py` next to it.
  - `og\make-og.ps1` (with `og.html`, `icon.html`) — makes the link-preview images and the home-screen icon.
- `.github\brand\` — the logo: every SVG and PNG, `make-brand.py` that writes them (and `site\favicon.svg`), and a README with its colours and where each file is used.
- `private\` — **never put this on GitHub.** `make-me-admin.sql`, the latest Playbook backup (`backups\`), research notes with sources (`playbook-research\`), and `playbook\defaults.json` while you're editing it.
- `CLAUDE.md` and `.claude\` — working rules for Claude sessions (tracked in the repo, never served). Open Claude in this folder and it reads them automatically.

## Making a change

1. Edit the files in `site\`. To preview locally, run `python -m http.server 8765 --directory site` and open http://localhost:8765 (Claude's browser pane uses the same address through the `jsal-site` server in `.claude\launch.json`).
2. If you changed `shell.css`, `nav.js`, `favicon.svg`, an app's CSS/JS or `cms-picker/quiz.json`, update the cache numbers so browsers fetch the new files (it rewrites only the references to what changed, and lists the files it touched):
   ```
   powershell -ExecutionPolicy Bypass -File C:\Users\JSAL\Desktop\jsal.io\.github\build\bump-version.ps1
   ```
3. Run the checks and fix anything they list:
   ```
   powershell -ExecutionPolicy Bypass -File C:\Users\JSAL\Desktop\jsal.io\.github\build\check.ps1
   ```
4. On the `staging` branch: `git pull`, then commit and push (as superjsal, dev@jsal.io). Check the preview address.
5. To ship: `git fetch`, `git merge origin/main` (the nightly publish commits to `main`), `git push`, then `git push origin staging:main`. That's the only push that changes jsal.io.

When you ship something worth mentioning, add it at the top of `site\changelog\index.html` under today's date, tagged with its app; give it `data-short="…"` (about 40 characters) if it should lead its section in **Updates** on the home page, and the home page picks it up when the site builds. When a public page changes a lot, update its date in `site\sitemap.xml`.

## Link-preview images

After changing a tool's name or description, edit `.github\build\og\og.html` and run:
```
powershell -ExecutionPolicy Bypass -File C:\Users\JSAL\Desktop\jsal.io\.github\build\og\make-og.ps1
```
It writes `site\og\*.png` and `site\apple-touch-icon.png`.

## Platform Playbook and CMS Picker

**Supabase is the source of truth.** `app_data` (row `defaults`) holds the base content: items, platforms, answers, how-to, watch-outs, page types and guides. `edits` holds admin corrections made on the live page, layered over the base. `picker` (admins only) holds every CMS Picker answer and its source, each platform's public profile and logo, and whether it's on the CMS Picker. The CMS Picker's answers are its own, separate from the Playbook's; the few topics both cover are labelled "Also in the Playbook" / "Also on the CMS Picker", so a correction to one reminds you to check the other.

- **Day to day:** sign in at jsal.io/ic as an admin.
  - **Edit** on any answer. On a topic both apps cover, the open form offers **Copy from the CMS Picker** (or, on the CMS Picker tab, **Copy from the Playbook**): it fills the tag, scope and words from the other side's answer, so a recheck is one edit and one confirm. Nothing is saved until Save.
  - **Team page → Platforms:** add a platform (it starts with every answer "Check manually"), hide one, or restore a hidden one.
  - **CMS Picker tab** (admins only, `jsal.io/ic/#picker`): a **Needs attention** list at the top (answers with no source or one checked over 90 days ago, in orange; not verified or unclear; waiting for publish, in blue), worst first, each opening its editor; then every public answer in a table (click one to edit it), then one platform at a time with its card, logo, answers and on/off switch. It shows how many changes are waiting for the next publish, with a link to publish now.
- **CMS Picker publishing:** a GitHub Action runs `playbook.py publish` every night and commits `cms-picker/data.json`, any uploaded logos and the page's plain-HTML copy when anything changed. It needs the repository secret `SUPABASE_SERVICE_ROLE_KEY` (GitHub → Settings → Secrets and variables → Actions). To publish straight away, use **Run workflow** on the repo's Actions tab. `scripts\cms-picker.json` sets the rows and their wording and the platform order; after changing it, run the publish so the page picks it up. The Find my fit quiz's own values (how easy each platform is, the design control it suits, and a few lists) are in `site\cms-picker\quiz.json`, which ships with the page code: after editing it, run the cache-number step below, not the publish.
- **Structural changes** (a new item, page type or guide), and **backups**, use `playbook.py`. It needs the Supabase `service_role` key (Project Settings → API), set in your own terminal only:
  ```
  $env:SUPABASE_SERVICE_ROLE_KEY = "<service_role key>"
  python C:\Users\JSAL\Desktop\jsal.io\.github\scripts\playbook.py backup
  python C:\Users\JSAL\Desktop\jsal.io\.github\scripts\playbook.py pull
  python C:\Users\JSAL\Desktop\jsal.io\.github\scripts\playbook.py push
  ```
  `backup` saves every table to `private\backups\`. `pull` saves the base content to `private\playbook\defaults.json`; edit it, then `push` uploads it (taking a backup first). Live edits are kept.
- **Back up** now and then (monthly is plenty). The free Supabase plan has no backups of its own. Keeping the newest one or two is enough.
- **The page's code** is `site\ic\index.html` (the markup), `site\ic\styles.css` (its styles) and `site\ic\app.js` (its script), like the other tools. Edit them directly; after a CSS or JS change run `.github\build\bump-version.ps1`.
- **Keep-awake:** free Supabase projects pause after about a week of no activity. A GitHub Action calls the database twice a week so that doesn't happen; you can also run it from the Actions tab. GitHub stops scheduled Actions in a repo with no commits for 60 days; if that happens, it emails you and one click re-enables it.

## The WoW Forever art

`site\img\wow-forever.webp` is Blizzard's, used under their fan-site policy (personal, non-commercial). It's their 3840×1600 original scaled down to 1920×800 WebP; scaling is fine, but never crop, retouch or alter the picture, and keep the "Art © Blizzard Entertainment" credit. If the site ever goes commercial, remove it.

## Reference: how it's hosted

Only needed if something has to be set up again.

- **Domain:** registered at Porkbun, nameservers `james.ns.cloudflare.com` and `peaches.ns.cloudflare.com` (DNSSEC off). Email forwarding (dev@jsal.io) is still Porkbun's: keep the `MX` records `fwd1.porkbun.com` (10) and `fwd2.porkbun.com` (20) and the `TXT v=spf1 include:_spf.porkbun.com ~all` record in Cloudflare's DNS. Also a `TXT` record for Google Search Console.
- **Cloudflare** (account dev@jsal.io, free plan):
  - A Worker `jsal-io`, connected to the GitHub repo `superjsal/jsal.io` (the Cloudflare app has access to that repo only). Build command empty, deploy `npx wrangler deploy`, preview builds on with `npx wrangler preview`. Custom domain `jsal.io` for production.
  - DNS: `AAAA www 100::`, proxied, plus the Redirect Rule "www to jsal.io" (`https://www.*` → `https://${1}`, 301, query string kept).
  - Settings changed from the defaults: Email Address Obfuscation off (it rewrote the email links), Always Use HTTPS on, Web Analytics for jsal.io disabled (it added its own script to every page), Bot Preference Sync off (it prepends to `robots.txt`). After any Cloudflare change, check a page still matches its file exactly.
- **GitHub Pages** (the old host, a fallback until it's retired): source "GitHub Actions" (`.github\workflows\deploy-pages.yml`), custom domain `jsal.io` (`site\CNAME`).
- **Supabase:** project for Platform Playbook.
  1. Run `site\ic\supabase\schema.sql` in the SQL Editor (safe to re-run).
  2. Set the new project's URL and anon key at the top of `site\ic\app.js`.
  3. Restore the latest backup in `private\backups\`: `app_data` with `push`, the other tables via the Table Editor's CSV import.
  4. Sign in once, then make yourself admin with `private\make-me-admin.sql`.
  5. Put the new `service_role` key in the GitHub repository secret.
- **Discord:** an OAuth app whose client ID and secret go only into Supabase → Authentication → Providers → Discord. Supabase's callback URL goes in the Discord app's OAuth2 redirects; Supabase's Site URL and redirect URL are `https://jsal.io/ic/`.

Never paste a secret into chat: the Discord client secret, the Supabase database password, or the Supabase `service_role` key.
