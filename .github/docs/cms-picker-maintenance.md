# CMS Picker: how it's put together, and keeping it right

`SETUP.md` (outside the repo) covers publishing and the Playbook day to day; this is the CMS Picker's
data, scoring and tests. Real-device checks before a release: `manual-checks.md`, next to this file.

## Where everything lives

| What | Where | Edited by |
|---|---|---|
| Each platform's answers (tag, public note, varies/not verified), profile, logo, public switch | Supabase `picker` table (its own answers, separate from the Playbook's) | John, on the Playbook's CMS Picker tab |
| Each answer's source (official docs URL) and the date it was checked | `picker.sources` | John, on the CMS Picker tab (in the same form as the answer) |
| The rows, their plain-language labels and SEO names, platform order | `.github/scripts/cms-picker.json` | code |
| The quiz's own values: how easy each platform is, the design it suits, lists such as `storeOnly`, `devControl`, `notIdeal`, and `domainDocs` (each platform's "connect a domain" help page) | `cms-picker/quiz.json`, served with the page and loaded with the code's `?v=` number, so scoring code and values always change together. Run `build\bump-version.ps1` after editing it. | code |
| What the page reads | `cms-picker/data.json`, written by `playbook.py publish` (nightly at 07:41 UTC, or Run workflow); never edit it by hand | the publish |
| Its shape | `.github/scripts/cms-picker.schema.json`, checked by `check_data.py` before every publish and push | code |

**Separate from the Playbook.** The CMS Picker's answers are its own. A topic both cover (meta titles, old links/redirects, structured data) is labelled on both sides ("Also in the Playbook" / "Also on the CMS Picker"); a correction to one should be checked against the other.

**Answers.** Each one is `{verdict, mark, scope, sourceUrl?, lastVerified?}`. `verdict` is the tag (yes =
Built in, auto, plugin, code, no, …). `mark` is the note shown on tap or with Show notes; a note that only
repeats its tag ("Yes, with an SEO plugin") is hidden as generic, so name the plugin or plan instead.
`scope` is U (same everywhere), V ("varies": depends on plan, theme or setup) or C (not verified).

**Sources.** Only the platform's own documentation (or the named plugin's own page), never a guess. No
source is better than a wrong one: `check_data.py --list` shows what's missing.

## The quiz and its explanations (`cms-picker/score.js`)

Shared by the page and the tests, so they always run the same code.

- **Questions:** `QUESTIONS`. Each option is `[value, title, hint, the answer on its own]`; the last is the
  answer button on the results. Changing the questions means raising `LINK_VERSION` in `app.js` and
  translating older answers in `readLink`, so shared links keep working.
- **Scoring:** `fitScore` builds the score from parts with `add(key, points, reason)`. The reason (if any)
  shows as a bullet on the card.
- **"What tipped it":** every part's key has wording in `TIP`: `[what the leader earned, what the
  runner-up lost]`, naming the platform rather than "it". Each one follows the answer that drove it, from
  `LEAD` ("you're building an app or portal, and Sanity is built to…"), and two reasons are joined with a
  semicolon. The clear winner's box names the part with the biggest gap. **A new part needs a `TIP` and a
  `LEAD` entry**; the persona test fails without them.
- **"Pick it over":** rows where a platform does better than its neighbour (built in beats a plugin beats
  code), described by `PHRASE` (a short phrase per table row; **a new row needs one**, the test checks).
  `weight` decides how much a row matters for the answers, and is 0 for rows the person ruled out
  (design control after "a good template is enough", more languages after "one language", selling when
  not making a store). Only rows that matter to the answers (weight over 1: selling, languages, design
  control, a blog for content sites) come first. Next is what the platform offers: its card tags that
  the other platform's card doesn't list ("Shopify is known for: app ecosystem, built-in checkout, and
  theme store"), so **card tags are customer-facing selling points**, written as they should read there.
  Then the smaller rows (the technical SEO ones), and last the platform's first "good fit" line.
- **Second and third:** both are compared with the first, unless the third would repeat the second (the
  same reasons, or the same box sentence). Then the third says "the same reasons as" the second and is
  compared with the second instead, falling back to what it's known for if that sentence still matches.
- **A platform's own reason:** `quiz.leaveWhy` replaces "Easy to move to another platform later" where the
  card's "If you leave" says more (Sanity: "You own the site code and can export all your content").

## Persona tests

```
node .github/scripts/personas.test.js
```

Also run by `build\check.ps1` before every push, and by the "Check CMS Picker data" Action on GitHub.

- **36 personas** (bakery, maker shop, B2B wholesaler, government site…) must keep the first places and top threes John
  agreed. A failure means a result changed: agree the new result with John before editing the expectation.
- **Every answer combination (8,448)**, for every result card:
  - it has a box saying what sets it apart, and never mentions a row those answers rule out;
  - "the same reasons as X" appears only when the reasons really are the same, the top two never
    show an identical list, and the second and third never show the same box;
  - every score part has `TIP` wording and every row a `PHRASE`;
  - it reports how many clear winners fall back from "What tipped it" (0 today).

## Keeping the answers current

Platforms change plans and features often. Every few months (or when a platform announces a change):

- Recheck the **"varies" answers**, since they depend on plans and themes that move.
- Recheck the **"What it costs to start" rows** against each platform's pricing page (links are their sources;
  the research notes are in `private\playbook-research\cms-picker-pricing-*.md`). They're bands, not prices
  (Free to start, Under $25/mo, $25–$100/mo, Over $100/mo, Free software + hosting, Not for stores), so a
  small price change rarely matters; a free plan appearing or going, or a plan crossing $25 or $100, does.
  Each band and its pricing-page source are edited on the Playbook's CMS Picker tab, like any answer.
  Update the section's `asOf` month in `cms-picker.json` when you recheck. The quiz's budget question
  ("What can you spend each month?") reads these rows: a platform loses 3 points for each band over the
  budget (`COST_LEVEL` and `BUDGET` in `score.js`; "Free software + hosting" counts as the lowest paid band),
  so a band change can move results: run the persona tests.
- Recheck the **plugin and app library tiers** (`addOnsMany` / `addOnsSome` in `cms-picker/quiz.json`, for "Will you
  add features as the site grows?") against each directory's own page; the `_about` note there says where
  each count came from and which are third-party estimates.
- Recheck the **AI crawlers row**: the bots and how each platform lets you block them change fastest.
  The row's SEO name (`term` in `cms-picker.json`) carries its "as of" month; update it when you recheck.
- Update each answer's checked date in the Playbook when you confirm it, so `check_data.py` (sources
  older than 90 days) stays useful.

- After rewording a card's **"Not ideal if"** line on the CMS Picker tab, check the publish output (or
  `build\check.ps1`): a line starting `WARNING "Not ideal if" rules…` means a rule in `cms-picker/quiz.json`
  (`notIdeal`, matched on the start of the line) no longer matches, so update its `if` text there.

No automation does this; it's a manual pass, on purpose.
