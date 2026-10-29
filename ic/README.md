# Platform Playbook

Team reference for the Implement Check Form: what each CMS lets us change (Content and Tech items), by page type, with how-to steps, watch-outs and guides. It also feeds the public [CMS Picker](https://jsal.io/cms-picker/).

**Live:** https://jsal.io/ic/ (team sign-in required)

## How it works

- `index.html` is the whole app: plain HTML, CSS and JavaScript, no build step. GitHub Pages serves it.
- Sign-in is **Discord** through **Supabase Auth**. Anyone with a Discord account can sign in, but only people an admin approves on the **Team** page can see anything.
- The content is **not in this repo**: the Supabase database is its source of truth, and it loads only for approved members. The tables, access rules and admin functions are all in [`supabase/schema.sql`](supabase/schema.sql):
  - **Members** read everything, and post requests, upvotes and comments.
  - **Admins** also edit answers (saved in `edits`, layered over the base content in `app_data`), add and hide platforms, edit each platform's CMS Picker profile and logo, and approve, remove or promote people.
  - **Signed-out visitors and unapproved accounts** get nothing.
- The Supabase URL and anon key at the top of the script are public by design. They only work within those rules.
- The CMS Picker is published from the database every night by a GitHub Action (`.github/workflows/publish-cms-picker.yml`), into `cms-picker/data.json`.

## Setup (once)

1. Create a Supabase project and run `supabase/schema.sql` in the SQL Editor (safe to re-run).
2. Load the content from the latest private backup (kept outside this repo).
3. Turn on the Discord provider in Supabase (Authentication → Providers) with a Discord app's client ID and secret, and add Supabase's callback URL to the Discord app's OAuth2 redirects.
4. In Supabase → Authentication → URL Configuration, set the Site URL and a redirect URL to `https://jsal.io/ic/`.
5. Put the project URL and anon key into `SUPABASE_URL` / `SUPABASE_ANON_KEY` in `index.html`.
6. Sign in once, then make yourself admin with the private `make-me-admin.sql`.

## Updating content

- **Day to day:** sign in as an admin. Use **Edit** on an item (Markdown works; edits apply to the page type you're viewing), and the **Team** page to add, hide or restore platforms.
- **Larger changes** (a new item, page type or guide): pull the base content with `.github/scripts/playbook.py`, edit it, and push it back. Team edits are kept.
- **Keep-awake:** a scheduled GitHub Action (`.github/workflows/keep-playbook-awake.yml`) calls the database's `ping()` function twice a week so the free project never pauses.
