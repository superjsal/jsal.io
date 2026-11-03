# CMS Picker: how it's put together, and keeping it right

`SETUP.md` (outside the repo) covers publishing and the Playbook day to day; this is the CMS Picker's
data, scoring and tests. Real-device checks before a release: `manual-checks.md`, next to this file.

## Status: in development again (since 2026-10-31)

It was in maintenance mode from 2026-10-30. On 2026-10-31 John reopened it to make the page less dense: the quiz
becomes the focus, and the comparison table and the platform cards show only on demand. The scoring changed the same
day (v3 and v4, below), each step agreed with John and pinned by the personas. The content audit of 2026-10-31 (every
CMS Picker answer and source, the Playbook, and the items both cover, checked against each platform's own docs;
findings to John first, then applied) left every answer's checked date at 2026-10-31, so the quarterly rechecks below
("Keeping the answers current") run from there.

The parked idea is revisited only on its stated trigger: **partial fit** if people report Wix missing from
content-site results (under "Persona tests"). Two-step scoring, parked on 2026-10-30, came in on 2026-11-01 (below).

**Must-haves first** (2026-11-01): an audit of every answer set found the need people pick as "the one that matters
most" outvoted by taste. In 38% of paid-members answers, 42% of selling-too answers and 25% of bookings answers the
first match needed an add-on while a platform that fits had it built in, and a site that sells on a platform with no
store plan ("Not offered": Framer, HubSpot, Ghost) skipped the budget, so Framer led 396 of 1,008 selling-on-a-budget
answers. Ranking now goes by tiers (`rank` in `score.js`): first what rules a platform out (`gate`), then how far it
falls short of having the must-haves built in (`short`), and only then the points. For a developer or agency a plugin
counts as built in, as they add them as a matter of course. Two new rules (`need`, `budget`) and a persona pin it.
593 of 8,832 first places changed (6.7%, moving fixed at "starting fresh"), no persona moved, and John agreed them. Opening a shared
link also kept the languages tick from then on (it had been dropped, so a shared result could differ from the one seen).
The same day HubSpot's card line "You don't otherwise use HubSpot" was extended from local and creative sites to blogs,
newsletters and publications, where HubSpot had come first in 37% of answers mostly for being free to start: 205 first
places moved (to Squarespace, Webflow, Ghost, Duda), and the nonprofit persona moved to Webflow first, agreed with John.
Content-heavy business sites keep HubSpot, as the B2B marketing team persona answers that way. A result that starts
free on Wix, Webflow or Framer also says, as "worth knowing", that the free plan has only the platform's own address
(`quiz.freeDomain`, each with the platform's page saying so; no points, and HubSpot left out as its pages disagree).
WordPress then joined `kind.local` (it suits local businesses), and a languages plugin stopped costing a developer or
agency points (as in the ranking): 258 first places moved (2.9%), mostly Drupal, Wix or Squarespace giving way to
WordPress for local sites built by a developer or someone happy to learn, and the persona "Not technical, wants a blog
beside the site" may now show WordPress third (not first), agreed with John. A draft set of 40 expert cases (Claude's,
not yet reviewed by John) agreed with 33 first thing that day, 38 after these changes.

**Quiz v3** (2026-10-31): the questions on languages, paid members, moving later and adding features became "Anything
you'll need from day one?" and "Moving from somewhere?" (eight questions at most). The audit behind it is in the
code-tidy session's notes (`scoring-v2-report.md`): "adding features" measured plugin-library size and flipped 15% of
results, "moving later" rewarded self-hosting. It left exact ties for first at about 13% of answer sets (4.4%
before), nearly all Wix against Squarespace for a local business.

**Quiz v4** (2026-10-31, the same day): languages became a tick beside whichever need is picked (`also` on the needs
question, `lang=yes` in links) instead of one of its choices, so a restaurant can say bookings *and* two languages; the
members choice reads "Paid subscribers or members" so a plain email newsletter doesn't pick it; and a tie between two
builders is settled by the design control their card leads with (`quiz.lookBest`, below under Ties). Ties for first
fell to 5% of answer sets (moving=no, languages both ways), 530 of the settled ones Wix against Squarespace; the rest
say "Joint best match" and the box under each card does the work.

**Quiz v5** (2026-11-01): a "We already use HubSpot" tick on "Which is closest to what you do?" (`also` on the kind
question, `hubspot=yes` in links). HubSpot's card line "You don't otherwise use HubSpot" now rules it out for every
business site and publication unless it's ticked (`when: { what: [site, content], hubspot: [no] }`; a tick that isn't
given, or whose question isn't asked, reads as "no"), and a tick gives HubSpot 4 points ("Fits the HubSpot tools you
already use"). Before, HubSpot came first for most B2B answers, though an anonymous tally of the agency's B2B client
sites found 1 of 76 on it; its CMS is worth it mainly to companies already on its CRM. Unticked, 798 of 8,832 first
places moved (9%, HubSpot to Webflow, WordPress or Wix); ticked, HubSpot is first for 652 of 960 B2B answer sets. The
five B2B personas now come both ways (Webflow or WordPress without the tick, HubSpot with it), agreed with John.

**Kinds from the cards** (2026-11-01, agreed with John): the 3 points for suiting an answer to "Which is closest to
what you do?" now go only to platforms whose own card has a "Good fit" line tagged with that kind (`quiz.fitFor`); the
separate `quiz.kind` lists are gone. The aim is a public tool that's checkable from the page: the agency's client tally
had put WordPress on the local and B2B lists, but a client list counts what's installed (often years ago, and often
because an agency builds on WordPress), not what fits someone choosing today, so it belongs in the Playbook, not the
scoring. Platforms' own marketing doesn't settle it either: every vendor claims nearly every audience. The change took
WordPress off local and B2B and HubSpot off content-heavy sites (neither card says so) and put Drupal on content-heavy
sites ("Large, complex or multilingual sites"). 871 of 13,632 first places moved (6.4%; moving fixed at "starting
fresh", both ticks both ways), nearly all sites a developer or agency builds: WordPress first 2,156 → 1,604, mostly to
Webflow, Squarespace, Wix and HubSpot (ticked); Drupal 66 → 163. No persona moved. One expert case differs, agreed: the
tourist café in two languages built by a developer gets Drupal first (Drupal 10, Wix 8, WordPress 8; its card names
multilingual sites and developer teams), where a consultant would call Drupal overkill for a small site; the quiz
doesn't ask a site's size. The same rule then held `quiz.agency` ("A common choice for designers and agencies") to the
cards: Duda and WordPress name agencies, Webflow and Framer name designers, HubSpot's card names neither and left
(282 more first places, all agency-built sites with the HubSpot tick; 1,137 of 13,632 for both changes, 8.3%, no
persona). Two tries were dropped the same day: the HubSpot tick at 3 points, like a kind line, moved the agreed "B2B
marketing team on HubSpot" persona to Webflow, so it stays at 4; and a tie-break on fitting the budget counted the
budget twice, while the real photographer case (said "Nothing for now", runs Squarespace) went to Square Online.
Later the same day, with John's agreement, two card fixes through the Supabase connector: WordPress's card gained the
"Good fit" line "Custom sites and apps, through its REST API" (its REST API handbook: a new front end, or its content
in separate applications), tagged in `quiz.fitFor` for custom builds like Sanity's, so the "custom" goal that puts
WordPress first for most custom builds is on its card (no first place moved; dropping the goal instead sent them to
Drupal, or to Wix as the closest fallback); and HubSpot's "(cost)" became "(it costs more on its own)". A stronger
developer answer (+3/−2) was measured and left: 808 first places move with no persona or expert case to judge them,
so it waits for the "Is … what you'd pick?" data, as does "A close call" (62% of results: 26% level, 36% within 2).

**Moving and paid members** (2026-11-01, from a review of the quiz's gaps; agreed with John): three changes
for people moving a site and for paid newsletters. (1) **Staying may be better:** in 17,656 of 204,480 moving answer
sets the platform being left fits as well as the first match or better (`stay` in `score.js`, the same words as
`behind`), and a blue note above the cards now says so ("Wix, where your site is now, fits your answers as well as
Squarespace…; staying may be the better choice"); before, it was said only under "Had a platform in mind?". No result
moves. (2) **Old links are a must-have when moving:** moving from any platform (one on the picker or another) reads
the "Keep old links working" row (`gsc404`) as a must-have (`links`: needs code −2 and 2 short, not possible −4 and 3
short; a plugin is routine, so it counts as built in for everyone, and code too for a developer, who writes the
redirects into the front end they build), with a "worth knowing" line. 2,968 first places moved (1.4% of all 218,112
sets, all moving ones): Substack (no redirects) to Squarespace, WordPress, Ghost or Webflow, and Sanity (code) to
WordPress or Drupal for non-developers. No persona or expert case moved; the persona "Developer who wants to be able
to leave later" is why code counts as built in for a developer. (3) **Substack's 10%:** `quiz.revenueShare` names
platforms that keep a share of what paid members pay, which the cost bands don't show; a paid-members result on one
says it as "worth knowing", no points (Substack: 10% plus Stripe's card fees, from its cost answer's source).

**Quiz v6** (2026-11-01, agreed with John): "Anything you'll need from day one?" takes several answers, as a checklist
with Next (`multi` on the question; nothing ticked is "Nothing special"), and languages are its last row instead of a
tick above the choices. `needs` holds a comma list (`needs=bookings,sell` in links; `need(a, v)` in `score.js` reads
it, and `isAnswer` checks a checklist's answer); each ticked need scores and counts as a must-have as a single one
did, so a single need, and every older link, reads exactly as before. Measured first: a second need changed the first
place in 28% of the answer sets that have one (38% for bookings and selling, 37% for bookings and paid members), mostly
towards the all-rounders. Two other changes were measured and left: a size question for sites (small moved 1%, large
51% on card lines that weren't written for it, putting Square Online in a large site's top three) and leaving out the
hosting question for someone not technical (9% of their results, mostly WordPress to Wix on custom builds). The
personas test now walks every set of needs (638,976 answer sets, moving included); two expert cases with two needs
were added (44 of 45 agree).

**Drupal and small sites** (2026-11-01, agreed with John): Drupal's card line "It's a small site with no developer"
became "It's a small site, or there's no developer", and the line now also rules Drupal out for local businesses and
portfolios (`notIdeal`, `when: { what: [site], kind: [local, creative] }`; both rules match on "It's a small site").
Before, a local site built by a developer in two languages wanting every detail got Drupal first for its developer
control and built-in languages, though small hospitality sites almost never run it. 422 first places moved (all such
developer-built sites, moving included; 24 starting fresh), to Squarespace, HubSpot (ticked), Wix, WordPress and
Webflow; no persona moved, and the tourist café expert case now agrees (45 of 45).

**Plain words** (2026-11-01, agreed with John): every card and note on the CMS Picker reworded for someone choosing a
platform, not someone building it: plain words first ("the end of each page's address", "a spreadsheet", "the file that
tells bots what they may read", "a keep-out-of-search tag", "run it yourself", "a fee on each sale"), and, in brackets,
the term a visitor meets in that platform's own settings (robots.txt, noindex, URL slug, module, CMS, Code Injection,
Head HTML). Template languages (Liquid, Stencil, Twig) and Stripe's name were dropped. Facts, prices and verdicts are
unchanged, so no result moved. Four "Good fit" lines the quiz matches on changed with the cards (`quiz.fitFor`):
WordPress's REST API line, HubSpot's marketing teams line and BigCommerce's two. A new note keeps to this: the platform
pages' headings already pair plain words with the term ("Redirect old links (301s)"). The team Playbook keeps its
technical terms; its readers build the sites.

**Baseline** (final review with Claude Reviewer, 2026-10-30, before v3): all four rule tests pass, all 37 personas pass, and
241 answer sets show "Closest match". The review checked five answer sets on the live page (a small store,
B2B in two languages, a paid-members blog on "Nothing for now", the custom app built by someone not technical,
and an old `v=1` link): tips start from the person's answers, ties are labelled honestly, costs match the
table, and old links open on their results. Under v3 with the managed-hosting change: seven rules, 48 personas, 2,171 of 80,640 answer sets show
"Closest match" (2.7%; moving from one of 13 platforms multiplies the sets without changing points). Under v4: 3,713 of
132,480 (2.8%; the languages tick doubles the sets). After the changes of 2026-11-01 (must-haves first, HubSpot's line on publications, WordPress for local businesses,
Duda off publications): 3,809 (2.9%), and 357 clear winners whose
box has no reason from their answers (an agency or developer selling on no budget, where Framer or HubSpot plus a
separate shop is estimated cheaper than a store plan; the estimate is never given as a reason, so the box falls back to
the table or card). A change to any of these numbers is a result change: agree it with John first.

Old `v=1` links have no "Which is closest to what you do?" answer; since v5 HubSpot's "You don't otherwise use
HubSpot" rule doesn't read that answer, so it applies to them too. The "newer questions can sharpen this" button
above the results still asks the missing question.

## Where everything lives

| What | Where | Edited by |
|---|---|---|
| Each platform's answers (tag, public note, varies/not verified), profile, logo, public switch | Supabase `picker` table (its own answers, separate from the Playbook's) | John, on the Playbook's CMS Picker tab |
| Each answer's source (official docs URL) and the date it was checked | `picker.sources` | John, on the CMS Picker tab (in the same form as the answer) |
| The rows, their plain-language labels and SEO names, platform order | `.github/scripts/cms-picker.json` | code |
| The quiz's own values: how easy each platform is, the design it suits, lists such as `storeOnly`, `devControl`, `managedHosting`, `members`, `bookings` (built-in or first-party bookings), `notIdeal`, `fitFor` (which "Good fit" lines answer which quiz answer, for ties), `lookBest` (the design control a card leads with, for ties the lines don't settle), `imports` (what each platform's own docs say it imports from another platform on the picker, with the docs page), and `domainDocs` (each platform's "connect a domain" help page) | `cms-picker/quiz.json`, served with the page with its own `?v=` content hash (`data-quiz-v` on the `app.js` script tag), so a browser never keeps an old copy; the build works the number out. | code |
| What the page reads | `cms-picker/data.json`, written by `playbook.py publish` (nightly at 07:41 UTC, or Run workflow); never edit it by hand | the publish |
| Its shape | `.github/scripts/cms-picker.schema.json`, checked by `check_data.py` before every publish and push | code |
| One page per platform (`/cms-picker/<platform>/`: its SEO answers with where to find each setting, then a short profile) | `src/pages/cms-picker/[platform].astro` (markup), `cms-picker/platform.css` (look) and `platform()` in `src/lib/cms-picker.mjs` (the headings in `SEO_HEAD`), built from `data.json`; each page's date is in `src/data/cms-picker-dates.json`, which the publish moves on when that page's data changes. A platform taken off isn't built, so it drops out of the sitemap too. Each has its own share image, `og/cms-picker-<id>.png` (name and six SEO tags, text only), made by `build\og\make-og.ps1`; re-run it after adding a platform or changing an SEO tag. Until it's re-run, a new platform's page uses `og/cms-picker.png`. | the publish (code for the page) |

**Separate from the Playbook.** The CMS Picker's answers are its own. A topic both cover (meta titles, old links/redirects, structured data) is labelled on both sides ("Also in the Playbook" / "Also on the CMS Picker"); a correction to one should be checked against the other.

**Answers.** Each one is `{verdict, mark, scope, sourceUrl?, lastVerified?, where?}`. `where` is the menu path to the setting ("Pages → page settings → SEO"), checked against the platform's docs; it's kept with the source in `picker.sources` and shown under the note. `verdict` is the tag (yes =
Built in, auto, plugin, code, no, …). `mark` is the note shown on tap or with Show notes; a note that only
repeats its tag ("Yes, with an SEO plugin") is hidden as generic, so name the plugin or plan instead.
`scope` is U (same everywhere), V ("varies": depends on plan, theme or setup) or C (not verified).

**Sources.** Only the platform's own documentation (or the named plugin's own page), never a guess. No
source is better than a wrong one: `check_data.py --list` shows what's missing. A cost row tagged "Not offered"
isn't counted as missing one: no pricing page states an absence.

## The quiz and its explanations (`cms-picker/score.js`)

Shared by the page and the tests, so they always run the same code.

- **Questions:** `QUESTIONS`: what, kind (sites) or size (stores), who, care, needs, look, moving, budget. Each
  option is `[value, title, hint, the answer on its own, when?]`; the fourth is the answer button on the results,
  the optional fifth a test on the answers that hides the option ("Selling online too" for a store, "A blog" for a
  publication). `options(q, a, data)` gives a question's options for the answers, and for "Moving from somewhere?"
  adds the 14 platforms from the data (each with its platform object as a sixth item, which the page draws as a
  logo chip). The page and the test both go through it. Changing the questions means raising `LINK_VERSION` in
  `app.js` and translating older answers in `readLink`, so shared links keep working (v3 translates the old
  members and moving-later answers, v4 the languages choice into the tick, v5 added the HubSpot tick; see the comment
  there). A question can carry a tick (`also`: id, title, hint, and `own`, the answer on its own) that goes with
  whichever choice is picked: the page draws it as a plain checkbox line above the choices (`qz-plain`, no box, so it
  never reads as one more answer) or as the last row of a checklist, and again in the answers editor, and the test
  walks it both ways. Two do: languages on the needs question, "We already pay for HubSpot" on the kind question
  (worded "We already use HubSpot", "For our CRM, email or marketing" until 2026-11-01, when that caught people using
  only the free CRM and gave HubSpot first place for about 40% of local, creative and startup sites with the tick).
  A tick counts only while its question is asked (`ticked()` in score.js), and in a quiz.json `when` one that isn't
  given reads as "no".
- **Needs** ("Anything you'll need from day one?", a checklist since v6: any of these, plus languages as its last
  row, each scored as below and each a must-have; with selling and paid members both ticked, the budget reads the store
  band): paid members score as
  before (below), selling too reads the "Sell online" row (+2 / 0 / −2 / −4, and the budget reads the store band), a
  blog reads the "Add a blog" row the same way, bookings read `quiz.bookings` (+3 built in or first-party, else −1 and
  a "worth knowing" line). Nothing special scores nothing. The tick (`lang=yes`) reads the "More than one language"
  row: built in +2, plugin −1, code −2, no −4, with a "worth knowing" line when it isn't built in.
- **Moving from** ("Moving from somewhere?"): no points for where they're coming from, but old links must keep working
  wherever they go (the `links` must-have, under "Moving and paid members" above), and when the platform being left
  fits as well as the first match or better a note says staying may be the better choice (`stay`). The result shows what the old platform lets you take (its
  profile's "If you leave" line) above the cards, a match whose own docs describe an import from it gets a 0-point
  reason linked to those docs (`quiz.imports`, through `links` on the score), and the platform being left is never
  a match: `candidates` (the list the page and the test rank from) leaves it out and also puts platforms whose
  "Not ideal if" line matches behind every other, so the gap it leaves never brings a ruled-out platform into the
  top three. It still ranks in full under "Had a platform in mind?", which opens on it ("You're on Wix now: it
  ranks 3rd of 14 for your answers").
- **Ranking, must-haves first:** `rank` sorts by `gate` (how many of these rule it out: not made for what they're
  making, made only for selling, its card's "Not ideal if", needing a developer when they're building it themselves),
  then `short` (`shortfall`: steps short of "built in" on the need picked, the languages tick, for a store selling
  itself and a large or B2B catalogue, and old links kept working when moving; bookings count one step; for a developer or agency a plugin counts as built in),
  then the points below, then the tie-breaks. `ahead(x, y)` says which tier put one ahead ('gate', 'need' or null),
  `sameTier` whether two are level on both, `near` whether one is level on both and within n points (the page's "Good
  match" and "Also worth a look"). A result won on a tier leads its box with that tier's parts (`gaps`).
- **The divider** (`divider` in `score.js`, drawn by `results` in `app.js`): each score carries its must-haves
  (`must`: what, how the platform does it, how far short), and a match in the top three whose must-haves fall further
  short than the first's goes under a divider with one sentence each from `HOW` ("Framer needs an add-on for selling
  online."), headed by the worst (add-on, custom code, or "Missing something you need"). The page labels cards above it
  "Good match" at least and gives the ones under it a neutral "Worth a look"; the expert cases count only the cards
  above it as recommendations; the personas test checks every divider sentence against the table and that the divider
  appears exactly when a match falls short (55,000 of 132,480 answer sets when added, 2026-11-01).
- **When even the first lacks a must-have** (`firstGap` in `score.js`): nothing that fits (level with the first on
  `gate`) has every must-have built in, so a blue note above the cards says so and what the first lacks, in the same
  `HOW` words ("None of the platforms that fit your answers has everything you need built in. BigCommerce needs an
  add-on for paid members."). Not shown with the "closest" or clashing-answers notice. The personas test checks the
  claim (no fitting platform has them all) and the sentence on every answer set; 13,024 of 132,480 when added.
- **"Closest match"** (`closest` in `score.js`): the first is only the closest when something rules it out (`gate`,
  as nothing fits at all) or it scores under `LOW_FIT`. The page, its notice and the tests all use it. (Before
  2026-11-01 it was the score alone, which let a platform not made for the goal lead without the notice once Substack
  scored high on a custom build.)
- **Platforms switched off the picker** keep their `quiz.json` values; the persona test skips them, and drops them
  from a persona's expected first places as from its top three. That's how a persona can name a platform not yet
  live (Substack, Square Online) or switched off (Magento 2): `first: ['ghost', 'substack']` holds both ways.
- **The lineup since 2026-11-01:** 14 platforms. Magento 2 came off (few start new Magento sites; it stays in the
  Playbook), and Substack (paid newsletters) and Square Online (shops and cafés on Square) joined, researched against
  their own help centres (Claude's notes in the worktree's `private\playbook-research\substack-square-draft-2026-11.md`).
  Three of their answers are "not verified" for want of a docs page: structured data on both, and AI bots on Square
  Online. Their logos are Simple Icons files in `cms-picker/logos/`.
- **Adding or removing a platform:** the code (its `quiz.json` values, personas, expert cases) ships first and holds
  with it on or off; then John switches it on the Playbook tab and the publish runs; then the hand-written counts and
  the home page's Platform guides grid follow (they would link a page that doesn't exist yet if they went first).
- **Scoring:** `fitScore` builds the score from parts with `add(key, points, reason)`. The reason (if any)
  shows as a bullet on the card. Where a part counts *against* an answer the person gave (a need that takes an
  add-on, running it yourself, hosting, budget), `fitScore` also pushes a plain line to `but`, which the
  card shows as "Worth knowing: …" so a top match never hides it. It changes no score; a new negative part
  that answers a question should add its line there too.
- **The boxes are plain words, and every phrase comes from the data or the answers.** No scoring talk ("level on
  points", "what tipped it"), no marketing words ("strengths", "natural fit", "the better pick"), and a claim from a
  card is said to come from the card ("its card says"). Each box has a `kind` the page and the
  tests read instead of its wording: `tie` ("Wix or Squarespace": "They fit your answers equally well."), `card`
  ("Why Squarespace first": "It fits your answers as well as Framer does. It comes first because its card says it's
  made for …, which matches your answers", its first matching "Good fit" line), `look` ("… The difference is the look: a good template is enough for you, and
  Squarespace is known for its designer templates", the `lookBest` tag), `tipped` (ahead, with the answers behind
  it), `other` (ahead, on what it offers) and `versus` ("Compared with Wix", the second and third cards: "In Wix's
  favour: …" for the answers or a cheaper start, else the table rows below).
- **Reasons from the answers:** every part's key has wording in `TIP`: `[what the leader earned, what the
  runner-up lost]`, naming the platform rather than "it". Each one follows the answer that drove it, from
  `LEAD` ("You're building an app or portal, and Sanity is built to…"), which echoes the answer's own label (the
  budget one is built from it, so "$25" lives in one place); two reasons are two sentences. The first reason also
  says what the other platform lacks, but only for parts in `LACKS` (bookings, members, blog, dev, care, size), whose
  other side names something missing in the data ("…, while Framer needs an add-on for bookings"), and only when the
  score marks that platform down for it. "Easier" and "harder" pairs say it once. **A new part needs a `TIP` and a
  `LEAD` entry**; the persona test fails without them.
- **How sure (`standing`):** the pill and the line under "Your best matches" come from the score gap: level ("fit
  your answers equally well, so either is a sound choice"), up to `CLOSE` (2: "slightly ahead", a close call), up to
  `LEAD_BY` (5: "ahead", a clear lead), then "well ahead" (a clear winner). Ahead on a must-have is at least a clear
  lead, and a clear winner when the second is ruled out (`gate`) or also more than `LEAD_BY` behind on points. The line says only how close it is; the
  first card's box says why, so neither repeats the other.
- **"If you want to keep a page out of search results, Webflow has it built in, while HubSpot CMS needs code for
  it":** when the answers don't separate two platforms, the comparison table does, in its own verdicts (`DOES`; a
  second row with the same verdicts is "The same goes if you want …"), so every sentence can be checked against the
  table below it (the persona test does, row by row). Rows are those where a platform does better than its neighbour
  (built in beats a plugin beats code), described by `PHRASE`: **what the row's own question asks and no more** ("Design
  every detail" is "to shape every detail of the design", not "design control"), never an answer's wording (the
  echo check would fail it), and no comma (the sentence check splits on it). **A new row needs one**; the test checks.
  `weight` decides how much a row matters for the answers, and is 0 for rows the person ruled out
  (design control after "a good template is enough", more languages after "one language", selling when
  not making a store). Rows that matter to the answers (weight over 1: selling, languages, design control, a blog
  for content sites) come first, then the technical SEO rows. Only when no row differs does a box fall back to the
  cards: "Nothing in your answers or the table puts Squarespace ahead of Wix. Squarespace's card highlights “Designer
  templates” and “All-in-one”" (the tags quoted, as they're labels, not sentences; never "and Wix's doesn't", since a
  tag missing from a card doesn't mean the platform lacks it), and last the
  platform's first "Good fit" line, said as the card's.
- **Second and third:** both are compared with the first, unless the third would repeat the second (the
  same reasons, or the same box sentence). Then the third says "the same reasons as" the second and is
  compared with the second instead, falling back to the table or its card if that sentence still matches.
- **"Had a platform in mind?"** says where a platform lands in the same words as `standing` (`behind`: level with,
  slightly behind, behind, well behind, or ahead of for the platform being left), never in points, and each
  "Against" reason follows the answer behind it, like the boxes.
- **Paid members** (the "Paid subscribers or members" need) read the "Sell memberships or paid
  posts" row: built in +3, plugin 0, needs code or check manually −2, no −4. Ghost gets +2 more for sending
  newsletters to those members itself (`quiz.members`). A platform that keeps a share of what members pay
  (`quiz.revenueShare`, Substack) says so as "worth knowing"; recheck it with the pricing. HubSpot's card rules it out for paid members.
  Their budget reads "Start a site with paid members" (`cost_members`: the plan that includes paid
  memberships, e.g. Ghost(Pro) Publisher, Wix Core), as does the card's "Cost to start" line; `costRow` in
  `score.js` picks the row for the score, the "costs less to start" box and the card alike (a store, or a site
  that sells too, reads the store band). Framer, Ghost, HubSpot and Sanity sell through Shopify, so their store band is
  their plan plus Shopify Basic. A site that sells on a platform with no store plan ("Not offered", e.g. Substack) counts
  its site band plus a separate shop, at least the lowest paid band, under its own part (`shopCost`). No pricing page
  states that sum, so `shopCost` has no wording, and a platform over budget on it never says it costs less than another;
  its "worth knowing" line says a separate shop adds to the cost.
- **Hosting, three states** (since 2026-10-31): wanting hosting handled counts +2 where the profile's hosting line starts "Handled for you", −2 where it names a managed option that takes updates and security on (`managedHosting` in quiz.json: WordPress, Magento 2), −6 otherwise; the "worth knowing" line says which. Since 2026-11-01 a managed option counts +2 when an agency or
  developer builds the site, as they arrange the managed host; it's scored as its own part (`managed`, worded "your
  agency can put WordPress on managed hosting, which handles them") and `gaps` compares it with `care` as one hosting
  comparison, so a box never calls equal hosting an advantage. (WordPress joined the local and B2B kinds the same day
  from a tally of the agency's client sites; "Kinds from the cards", above, took that out.)
- **Ties** (since 2026-10-31): two platforms level on points are ordered by how many of their card's "Good fit"
  lines answer what the person is making, from `quiz.fitFor` (whose kind-tagged lines also give the 3 points for
  suiting "Which is closest to what you do?", since 2026-11-01): each tagged line as it reads on the card (`line`)
  with the answers it answers (`when`, the same shape as `notIdeal`; a line that answers two questions is listed
  twice). Only lines that plainly name the goal are tagged: a business site's kind ("Startups and landing pages"
  → `kind: startup`), a store's size ("Larger catalogues" → `size: big`), a publication ("Writers, creators and
  publishers") or a custom build; never who builds it or how it's hosted. Level on that too, the design control
  decides (`quiz.lookBest`: the answer to "How much control over the design do you want?" that a platform's card
  leads with, and the tag as it reads there; Wix's "Drag-and-drop editor" for arranging it yourself, Squarespace's
  "Designer templates" for a template; only where a card says so). `rank` sorts by score, then by the line count
  (`tb`), then by that (`tb2`); `tied(x, y)` is true only when all three are equal, and that's what the page calls
  "Joint best match". A first place level on points says why in its box ("It fits your answers as well as Squarespace
  does, and comes first because it's made for startups and landing pages." / "… The difference is the look: you want
  to arrange things visually, and Wix is known for its drag-and-drop editor."). Before the card lines, a fifth of
  all answer sets were ties, and the "Best match" among them was simply the first in the platform list; before
  the design control, 13%. The persona test checks every tagged line is still on its card, every `when` names a
  real question and answer, and every `lookBest` tag is on its card.
- **Order of the reasons:** each top card lists its reasons with the ones the other two top cards don't share
  first (`explain`; the words don't change), so the first two cards rarely open with the same line (they did
  in 96% of answer sets before). A second or third card whose reasons are exactly the first's still collapses to
  "Fits your answers for the same reasons as …".

## Persona tests

```
node .github/scripts/personas.test.js
```

Also run by `.github\build\check.ps1` before every push, and by the "Site checks" Action on GitHub.

- **54 personas** (bakery, maker shop, B2B wholesaler, government site, since v3 eleven hard cases: a need the
  builders cover, a store that is also a publication, moving from Wix or Shopify…, since must-haves first a local
  shop selling on no budget that wants every detail, and since v5 each B2B persona with and without the HubSpot tick) must keep the first places and top
  threes John agreed. A failure means a result changed: agree the new result with John before editing the expectation.
- **Every answer combination (132,480)**, for every result card:
  - it has a box saying what sets it apart, and never mentions a row those answers rule out;
  - "the same reasons as X" appears only when the reasons really are the same, the top two never
    show an identical list, and the second and third never show the same box;
  - every score part has `TIP` wording and every row a `PHRASE`;
  - every sentence is backed by the data and the answers: a "while Wix needs…" clause only where the score marks
    that platform down for a `LACKS` part, an echoed answer only if this visitor gave it, a figure only from a cost
    band's label or a budget answer, and the "how sure" words matching the score gap; no box says "undefined";
  - it reports how many clear winners have no reason from their answers (0 today), how many first places are
    level on points but ahead on their card's "Good fit" lines or the look (their box must say which) or tied, and how many show a
    "Closest match" (first scores under `LOW_FIT`, 4: 2,171 today). No persona may get only a closest match.
  - every tagged "Good fit" line (`fitFor`) is still on its card and answers a real question and answer;
  - "staying may be the better choice" (`stay`) appears only when the platform being left isn't behind the first match.
- **Expert cases** (`node .github/scripts/expert-cases.js`, also in `check.py` and the Action): 43 real-world clients
  and the picks an experienced web consultant would accept, written without looking at the quiz's results (drafted by
  Claude on 2026-11-01, set up as a standing report at John's request). It never fails a check; it reports how many
  agree (`BASELINE`: 38 of 40 when set up, 39 once Duda's card stopped listing "Blog or content", 40 with the
  divider, as a match under it isn't a recommendation; 42 of 42 with the first two real sites, John's friends' own
  quiz answers and the platform they run, both Squarespace; 43 of 43 with a B2B company already on HubSpot, for the v5
  tick; 42 of 43 with kinds from the cards, the tourist café differing, agreed with John) and names the ones that differ, and says so when a change takes
  it below the baseline. Raise `BASELINE` when agreement rises; edit a case only when its expert judgment is wrong,
  never to match a result.
- **Nine rules** that must hold for every answer set (a failure names the first few):
  - the first match is made for what they're making, unless the page shows the "Closest match" notice;
  - someone not technical never gets a "Needs a developer" platform first;
  - no top-three platform has a matching "Not ideal if" line (unless fewer than three platforms fit at all);
  - every "Why … first" reason starts from one of their answers (`LEAD`);
  - a local business with no technical help never has a "Needs a developer" platform in its top three;
  - a large or B2B catalogue never has Framer in its top three;
  - the platform being moved from is never a match;
  - the first match has the must-haves as fully built in as any platform that fits (the test works the shortfall out
    from the table itself, not from `score.js`, so it checks the ranking);
  - with a budget given, every platform's cost is weighed against it (`budget` or `shopCost`), none skipped.
- **Parked: partial fit.** Being made for what someone's making is all or nothing (+4 if the card's "Fits"
  lists it, −8 if not), so one tick moves a platform 12 points. Wix has a built-in blog but its card doesn't
  list "Blog or content": ticking it would make Wix first in 720 content answer sets and beat Ghost for paid
  newsletters (3 personas fail), so it was left off (2026-10-30; Duda got it, changing 143, and lost it again on 2026-11-01, when the expert cases
showed agency-built publications getting Duda first: 47 first places moved to Squarespace, Webflow, Ghost and WordPress,
no persona moved, and Duda keeps its built-in blog for a site that wants one). If people
  report Wix missing from content-site results, add a middle level ("can do it, not what it's made for",
  e.g. 0 points) for platforms whose answer for the matching row is built in, instead of ticking the card.

## Keeping the answers current

Platforms change plans and features often. Every few months (or when a platform announces a change):

- Recheck the **"varies" answers**, since they depend on plans and themes that move.
- Recheck the **"What it costs to start" rows** against each platform's pricing page (links are their sources;
  the research notes are in `private\playbook-research\cms-picker-pricing-*.md`). They're bands, not prices
  (Free to start, Under $25/mo, $25–$100/mo, Over $100/mo, Free software + hosting, Not offered), so a
  small price change rarely matters; a free plan appearing or going, or a plan crossing $25 or $100, does.
  Each band and its pricing-page source are edited on the Playbook's CMS Picker tab, like any answer.
  Update the section's `asOf` month in `cms-picker.json` when you recheck. The quiz's budget question
  ("What can you spend each month?") reads these rows: a platform loses 3 points for each band over the
  budget (`COST_LEVEL` and `BUDGET` in `score.js`; "Free software + hosting" counts as the lowest paid band),
  so a band change can move results: run the persona tests.
- Recheck the **membership apps** behind "Start a site with paid members" more often than the platforms'
  own plans, since third-party prices change faster. The band includes the cheapest add-on paid members need,
  from the app's own pricing page (notes in `private\playbook-research\cms-picker-pricing-*.md`):
  Memberstack for Webflow (memberstack.com/pricing), Thenty for Framer (thenty.io/pricing), Zendra for
  Shopify (apps.shopify.com/zendra), Paid Member Subscriptions for WordPress
  (wordpress.org/plugins/paid-member-subscriptions/), and Duda's own Membership add-on (duda.co/membership).
  A change can move a band: Webflow ($15 + $25) and Framer ($10 + $24) sit just over $25.
- Recheck **Shopify Basic** (shopify.com/pricing, $29/mo billed yearly in November 2026) with them: it's in the
  "Start an online store" band of Framer, Ghost, HubSpot and Sanity, which sell through Shopify (the Buy Button works
  on every Shopify plan). HubSpot's free plan and Shopify alone come to $29, just over $25.
- Recheck **`freeDomain`** in `cms-picker/quiz.json` with the pricing: a free plan gaining custom domains comes off it.
- Recheck the **bookings list and the import pages** (`bookings` and `imports` in `cms-picker/quiz.json`): a
  platform adding or dropping its own bookings product moves the bookings need, and an import guide that moves or
  disappears should come off the list (only the destination's own docs count; the `_about` note says what was
  checked and when).
- Recheck the **store lists** (`b2b` and `largeCatalogue` in `cms-picker/quiz.json`) against each store platform's
  own docs, not only the cards: a platform adding B2B tools or moving them between plans changes who comes first for a
  B2B shop. Each `b2b` entry carries the page that says which plans have them (`b2bDocs`; the persona test fails one
  without). Shopify's B2B came to every plan from Basic on 2026-04-02 and wasn't picked up until 2026-11-01, because
  the list followed the cards and no table row asks about wholesale. A new B2B entry also needs a "Good fit" line on
  its card saying so. Shopify's ("Stores selling wholesale (B2B) as well as retail") isn't tagged in `fitFor`, so
  BigCommerce's tagged line still breaks a tie for B2B shops built by someone happy to learn, an agency or a developer
  (its price lists and customer groups go further); tagged, those tied and Shopify came first.
- Recheck the **AI crawlers row**: the bots and how each platform lets you block them change fastest.
  The row's SEO name (`term` in `cms-picker.json`) carries its "as of" month; update it when you recheck.
- Update each answer's checked date in the Playbook when you confirm it, so `check_data.py` (sources
  older than 90 days) stays useful.

- After rewording a card's **"Not ideal if"** line on the CMS Picker tab, check the publish output (or
  `.github\build\check.ps1`): a line starting `WARNING "Not ideal if" rules…` means a rule in `cms-picker/quiz.json`
  (`notIdeal`, matched on the start of the line) no longer matches, so update its `if` text there.

No automation does this; it's a manual pass, on purpose.
