// CMS Picker persona tests: example people run through the real Find my fit scoring (cms-picker/score.js),
// checked against the results John agreed (2026-10-29; 37 people since the business-site, members, budget and B2B questions;
// quiz v3 on 2026-10-31 replaced the language, members, moving-later and adding-features questions with "Anything you'll
// need from day one?" (needs) and "Moving from somewhere?" (moving), and added the hard cases at the end; quiz v4 the same
// day made languages a tick on the needs question, lang=yes, beside whichever need is picked). Run by
// .github\build\check.py (node .github/scripts/personas.test.js), locally and on GitHub.
// The answers come from cms-picker/data.json and the quiz's own values from cms-picker/quiz.json, as on the
// page, so a change to either is tested before it goes live. When a result should change, agree it first, then
// update the expectation here.
//   first: the platform(s) allowed in first place   top3: must all be in the top three   not: none may be
const path = require('path');
const site = path.join(__dirname, '..', '..', 'site');
const { rank, candidates, explain, standing, tied, ahead, divider, firstGap, HOW, QUESTIONS, options, PHRASE, DOES, weight, TIP, LEAD, LACKS, NEUTRAL, notIdealFor, LOW_FIT, conflict } = require(path.join(site, 'cms-picker', 'score.js'));
const data = require(path.join(site, 'cms-picker', 'data.json'));
const quiz = require(path.join(site, 'cms-picker', 'quiz.json'));
data.quiz = Object.fromEntries(Object.entries(quiz).filter(([k]) => !k.startsWith('_')));   // as app.js does
const ids = new Set(data.platforms.map((p) => p.id));   // platforms on the CMS Picker (a top-three check skips any that aren't)

const PERSONAS = [
  // Business or work sites (with "Which is closest to what you do?", agreed 2026-10-29)
  ['Local bakery, no tech help', { what: 'site', kind: 'local', who: 'easy', care: 'no', needs: 'none', look: 'template', moving: 'no' },
    { first: ['wix', 'squarespace'], top3: ['wix', 'squarespace'], not: ['magento', 'drupal', 'sanity'] }],
  ['Multilingual B2B SaaS marketing site, agency-built', { what: 'site', kind: 'b2b', who: 'agency', care: 'no', needs: 'none', lang: 'yes', look: 'pixel', moving: 'no' },
    { first: ['hubspot', 'webflow'], top3: ['hubspot', 'webflow'] }],   // HubSpot since Webflow's languages became a paid add-on (agreed)
  ['Agency-built local service site', { what: 'site', kind: 'local', who: 'agency', care: 'no', needs: 'none', look: 'visual', moving: 'no' },
    { first: ['duda'], top3: ['duda'] }],
  ['Design-led startup landing page', { what: 'site', kind: 'startup', who: 'learn', care: 'no', needs: 'none', look: 'pixel', moving: 'no' },
    { first: ['webflow', 'framer'], top3: ['webflow', 'framer'] }],
  ['Photographer portfolio, does it alone', { what: 'site', kind: 'creative', who: 'learn', care: 'no', needs: 'none', look: 'visual', moving: 'no' },
    { first: ['squarespace', 'framer'], top3: ['squarespace'], not: ['magento', 'drupal', 'sanity'] }],
  ['Learns as they go, local business (John’s answers)', { what: 'site', kind: 'local', who: 'learn', care: 'yes', needs: 'none', look: 'visual', moving: 'no' },
    { first: ['wix', 'squarespace'], top3: ['wix', 'squarespace'] }],
  // A close call agreed with John: HubSpot if sales run on its CRM, Webflow for design control
  ['Learns as they go, B2B company (John’s answers)', { what: 'site', kind: 'b2b', who: 'learn', care: 'yes', needs: 'none', look: 'visual', moving: 'no' },
    { first: ['webflow', 'hubspot'], top3: ['webflow', 'hubspot'] }],
  ['Freelance consultant, one-page site', { what: 'site', kind: 'local', who: 'easy', care: 'no', needs: 'none', look: 'template', moving: 'no' },
    { first: ['wix', 'squarespace'], top3: ['wix', 'squarespace'], not: ['magento', 'drupal', 'sanity'] }],
  ['Restaurant in a tourist town, two languages', { what: 'site', kind: 'local', who: 'easy', care: 'no', needs: 'none', lang: 'yes', look: 'template', moving: 'no' },
    { first: ['wix'], top3: ['wix', 'squarespace'] }],
  ['B2B marketing team with lots of articles', { what: 'site', kind: 'content', who: 'learn', care: 'no', needs: 'none', look: 'visual', moving: 'no' },
    { first: ['webflow', 'hubspot'], top3: ['webflow', 'hubspot'] }],
  ['Estate agent, built by an agency', { what: 'site', kind: 'local', who: 'agency', care: 'no', needs: 'none', look: 'template', moving: 'no' },
    { first: ['duda'], top3: ['duda'] }],
  ['Developer portfolio, owns everything', { what: 'site', kind: 'creative', who: 'dev', care: 'yes', needs: 'none', look: 'pixel', moving: 'no' },
    { first: ['framer', 'wordpress', 'drupal'], top3: ['wordpress'] }],
  // Stores
  ['Etsy-style maker shop', { what: 'store', who: 'easy', care: 'no', size: 'small', needs: 'none', look: 'template', moving: 'no' },
    { first: ['shopify'], top3: ['shopify'], not: ['magento', 'drupal', 'sanity'] }],
  ['5,000-product store with a dev team', { what: 'store', who: 'dev', care: 'yes', size: 'big', needs: 'none', look: 'pixel', moving: 'no' },
    { first: ['magento'], top3: ['magento', 'shopify'], not: ['wix', 'squarespace'] }],
  ['Wholesale B2B store with a developer, two languages', { what: 'store', who: 'dev', care: 'yes', size: 'big', needs: 'none', lang: 'yes', look: 'pixel', moving: 'no' },
    { first: ['magento'], top3: ['magento', 'shopify', 'bigcommerce'] }],
  ['Clothing brand, about 50 products, wants design control', { what: 'store', who: 'learn', care: 'no', size: 'small', needs: 'none', look: 'visual', moving: 'no' },
    { first: ['shopify', 'wix', 'squarespace'], top3: ['shopify'] }],   // a three-way tie: the store questions don't ask about design
  ['Coffee roaster selling to cafés (B2B), not technical', { what: 'store', who: 'easy', care: 'no', size: 'b2b', needs: 'none', look: 'template', moving: 'no' },
    { first: ['bigcommerce'], top3: ['bigcommerce', 'shopify'] }],
  ['Wholesaler with trade accounts (B2B), happy to learn', { what: 'store', who: 'learn', care: 'no', size: 'b2b', needs: 'none', look: 'template', moving: 'no' },
    { first: ['bigcommerce'], top3: ['bigcommerce', 'shopify'] }],
  ['Parts supplier selling to businesses (B2B), with a developer', { what: 'store', who: 'dev', care: 'yes', size: 'b2b', needs: 'none', look: 'template', moving: 'no' },
    { first: ['magento'], top3: ['magento', 'bigcommerce'] }],
  // Quiz v3 (agreed 2026-10-31): without the "adding features" and "moving later" points, these four settle on the builders
  ['Local business that needs bookings, happy to learn', { what: 'site', kind: 'local', who: 'learn', care: 'yes', needs: 'bookings', look: 'template', moving: 'no', budget: 'low' },
    { first: ['wix', 'squarespace'], top3: ['wix', 'squarespace'] }],
  ['Local business adding features later, wants hosting handled', { what: 'site', kind: 'local', who: 'learn', care: 'no', needs: 'none', look: 'template', moving: 'no', budget: 'low' },
    { first: ['wix', 'squarespace'] }],   // WordPress may show third: managed hosting exists (agreed 2026-10-31); first it must not be
  ['Blogger who will add features, happy to learn', { what: 'content', who: 'learn', care: 'yes', needs: 'none', look: 'template', moving: 'no', budget: 'low' },
    { first: ['ghost', 'wordpress'], top3: ['ghost', 'wordpress'] }],
  // Round 5: a non-technical local business that adds features isn't steered to a CRM-first platform
  ['Local business, not technical, adding features', { what: 'site', kind: 'local', who: 'easy', care: 'no', needs: 'none', look: 'template', moving: 'no', budget: 'low' },
    { first: ['wix', 'squarespace'], top3: ['wix', 'squarespace'], not: ['hubspot'] }],
  // Blogs, publications and custom builds
  // HubSpot has no paid memberships built in (agreed 2026-10-30: its card's line rules it out for paid members)
  ['Newsletter writer with paid members', { what: 'content', who: 'learn', care: 'no', needs: 'members', look: 'template', moving: 'no' },
    { first: ['ghost'], top3: ['ghost'], not: ['hubspot'] }],
  ['Government multilingual content site', { what: 'content', who: 'dev', care: 'yes', needs: 'none', lang: 'yes', look: 'pixel', moving: 'no' },
    { first: ['drupal'], top3: ['drupal', 'wordpress'], not: ['wix', 'squarespace', 'webflow'] }],
  ['Small blog that wants to own everything', { what: 'content', who: 'learn', care: 'yes', needs: 'none', look: 'template', moving: 'no' },
    { first: ['ghost', 'wordpress'], top3: ['ghost', 'wordpress'] }],
  ['Hobby blog, not technical', { what: 'content', who: 'easy', care: 'no', needs: 'none', look: 'template', moving: 'no' },
    { first: ['squarespace', 'ghost'], top3: ['squarespace', 'ghost'] }],
  ['Online course creator with members', { what: 'content', who: 'easy', care: 'no', needs: 'members', look: 'template', moving: 'no' },
    { first: ['ghost'], top3: ['ghost', 'squarespace'], not: ['hubspot'] }],
  ['Paid newsletter, not technical, two languages', { what: 'content', who: 'easy', care: 'no', needs: 'members', lang: 'yes', look: 'template', moving: 'no' },
    { first: ['ghost'], top3: ['ghost'], not: ['hubspot'] }],
  // HubSpot's card line "You don't otherwise use HubSpot" covers publications (agreed 2026-11-01), so Webflow, the one
  // made for them with languages built in, comes first
  ['Nonprofit with news in two languages', { what: 'content', who: 'learn', care: 'no', needs: 'none', lang: 'yes', look: 'template', moving: 'no' },
    { first: ['webflow'], top3: ['webflow', 'ghost'], not: ['hubspot'] }],
  ['Developer building an app and a site', { what: 'custom', who: 'dev', care: 'yes', needs: 'none', look: 'pixel', moving: 'no' },
    { first: ['sanity'], top3: ['sanity'] }],
  // With "What can you spend each month?" (the "What it costs to start" bands)
  ['Local bakery, no budget yet', { what: 'site', kind: 'local', who: 'easy', care: 'no', needs: 'none', look: 'template', moving: 'no', budget: 'none' },
    { first: ['wix'], top3: ['wix'] }],
  ['Etsy-style maker shop, up to $25 a month', { what: 'store', who: 'easy', care: 'no', size: 'small', needs: 'none', look: 'template', moving: 'no', budget: 'low' },
    { first: ['squarespace'], top3: ['squarespace', 'shopify'] }],
  ['Etsy-style maker shop, up to $100 a month', { what: 'store', who: 'easy', care: 'no', size: 'small', needs: 'none', look: 'template', moving: 'no', budget: 'mid' },
    { first: ['shopify'], top3: ['shopify'] }],
  ['Photographer, no budget yet', { what: 'site', kind: 'creative', who: 'learn', care: 'no', needs: 'none', look: 'visual', moving: 'no', budget: 'none' },
    { first: ['framer'], top3: ['framer'] }],
  ['Newsletter with paid members, up to $25 a month', { what: 'content', who: 'learn', care: 'no', needs: 'members', look: 'template', moving: 'no', budget: 'low' },
    { first: ['squarespace'], top3: ['squarespace', 'ghost'], not: ['hubspot'] }],
  ['5,000-product store with a dev team, cost no object', { what: 'store', who: 'dev', care: 'yes', size: 'big', needs: 'none', look: 'pixel', moving: 'no', budget: 'any' },
    { first: ['magento'], top3: ['magento'] }],
  // Hard cases for quiz v3 (agreed 2026-10-31): a need the builders cover, needs the quiz can only take one of, a budget
  // against an agency's usual picks, moving from a platform on the picker (no points; the one you're leaving is never a
  // match), and a store that is also a publication
  // WordPress may show third since it counts as suiting local businesses (agreed 2026-11-01); first it must not be
  ['Not technical, wants a blog beside the site, hosting handled', { what: 'site', kind: 'local', who: 'easy', care: 'no', needs: 'blog', look: 'template', moving: 'no' },
    { first: ['wix', 'squarespace'], top3: ['wix', 'squarespace'], not: ['drupal', 'sanity'] }],
  ['Publication with paid members, two languages', { what: 'content', who: 'learn', care: 'no', needs: 'members', lang: 'yes', look: 'template', moving: 'no' },
    { first: ['ghost'], top3: ['ghost', 'squarespace'], not: ['hubspot'] }],
  ['Agency-built B2B site on a small budget', { what: 'site', kind: 'b2b', who: 'agency', care: 'no', needs: 'none', look: 'visual', moving: 'no', budget: 'low' },
    { first: ['hubspot', 'webflow'], top3: ['hubspot', 'webflow'] }],
  ['Developer who wants to be able to leave later', { what: 'custom', who: 'dev', care: 'yes', needs: 'none', look: 'pixel', moving: 'other' },
    { first: ['sanity'], top3: ['sanity', 'wordpress'] }],
  ['Store that is also a publication', { what: 'content', who: 'learn', care: 'no', needs: 'sell', look: 'template', moving: 'no' },
    { first: ['squarespace'], top3: ['squarespace', 'ghost'] }],
  ['Local business moving from Wix, happy to learn, own hosting', { what: 'site', kind: 'local', who: 'learn', care: 'yes', needs: 'none', look: 'visual', moving: 'wix' },
    { first: ['squarespace'], top3: ['squarespace'], not: ['wix'] }],
  ['Blog moving from WordPress, hosting handled', { what: 'content', who: 'easy', care: 'no', needs: 'none', look: 'template', moving: 'wordpress' },
    { first: ['ghost', 'squarespace'], top3: ['ghost', 'squarespace'], not: ['wordpress'] }],
  ['Salon that needs bookings, not technical', { what: 'site', kind: 'local', who: 'easy', care: 'no', needs: 'bookings', look: 'template', moving: 'no' },
    { first: ['wix', 'squarespace'], top3: ['wix', 'squarespace'], not: ['hubspot'] }],
  ['Consultant selling a few things too, happy to learn', { what: 'site', kind: 'local', who: 'learn', care: 'no', needs: 'sell', look: 'visual', moving: 'no' },
    { first: ['wix', 'squarespace'], top3: ['wix', 'squarespace'] }],
  ['Store moving from Shopify, thousands of products', { what: 'store', who: 'learn', care: 'no', size: 'big', needs: 'none', look: 'template', moving: 'shopify' },
    { first: ['bigcommerce'], top3: ['bigcommerce'], not: ['shopify'] }],
  ['B2B site with two languages, built in-house', { what: 'site', kind: 'b2b', who: 'learn', care: 'no', needs: 'none', lang: 'yes', look: 'visual', moving: 'no' },
    { first: ['hubspot'], top3: ['hubspot', 'webflow'] }],
  // Must-haves first: selling, the need that matters most, isn't outvoted by the design answer, and a platform with no
  // store plan doesn't escape the budget (Framer came first here before)
  ['Local shop selling online, not technical, no budget, wants every detail', { what: 'site', kind: 'local', who: 'easy', care: 'no', needs: 'sell', lang: 'yes', look: 'pixel', moving: 'no', budget: 'none' },
    { first: ['wix', 'squarespace'], top3: ['wix', 'squarespace'] }],
];

let failed = 0;
for (const [name, answers, want] of PERSONAS) {
  const r = candidates(data, answers), top = r.slice(0, 3).map((x) => x.p.id);
  const errs = [];
  if (want.first && !want.first.includes(top[0])) errs.push(`first is ${top[0]}, expected ${want.first.join(' or ')}`);
  (want.top3 || []).forEach((id) => { if (ids.has(id) && !top.includes(id)) errs.push(`${id} not in the top three`); });
  (want.not || []).forEach((id) => { if (top.includes(id)) errs.push(`${id} in the top three`); });
  // A tie for first (level on points and on matching "Good fit" lines) means the page shows a "Best match" it can't back up
  if (r[1] && tied(r[0], r[1]) && want.first && want.first.length === 1) errs.push(`tied for first: ${r[0].p.id} and ${r[1].p.id}`);
  // Every agreed person gets a real "Best match", never only the closest
  if (r[0].s < LOW_FIT) errs.push(`first scores ${r[0].s}: only a "Closest match"`);
  const line = r.slice(0, 3).map((x) => `${x.p.name} ${x.s}`).join(', ');
  if (errs.length) { failed++; console.log(`FAIL ${name}: ${errs.join('; ')}  [${line}]`); }
  else console.log(`ok   ${name}  [${line}]`);
}
console.log(failed ? `${failed} of ${PERSONAS.length} personas failed.` : `All ${PERSONAS.length} personas passed.`);

// The result cards, for every possible set of answers: each card says what sets it apart, without
// mentioning anything the person ruled out; "the same reasons as" only when it's true; the top two
// never show the same list; and a clear winner says what tipped it.
// Four rules every result must keep (agreed with Claude Reviewer, 2026-10-30), counted across all answer sets:
//   made: the first match is made for what they're making, unless the page shows the "Closest match" notice
//   dev: someone not technical never gets a "Needs a developer" platform (ease 0) first
//   notIdeal: no top-three platform has a matching "Not ideal if" line (counted in notIdealTop below)
//   named: every "Why … first" box with reasons starts from one of their answers (LEAD), never a bare feature
//   local: a local business built by someone not technical never has a platform that needs a developer in its top three
//   catalogue: a large or B2B catalogue never has Framer (its card: "You sell online") in its top three
//   origin: the platform you're moving from is never a match (score.js candidates)
//   need: the first match has the must-haves (the need that matters most, the languages tick, a store's selling and
//     size) as fully built in as any platform that fits, so taste never outvotes them
//   budget: with a budget given, every platform's cost to start is weighed against it, none skipped
const broke = { made: 0, dev: 0, named: 0, local: 0, catalogue: 0, origin: 0, need: 0, budget: 0 };
// How far a platform falls short of having the must-haves built in (0: all built in), from the table's rows, worked out
// here rather than taken from score.js so the rule checks the scoring. A developer or agency adds plugins as a matter of
// course, so for them only "needs code" or "not possible" falls short.
const HAS = { yes: 3, auto: 3, plugin: 2, indirect: 2, code: 1, check: 1, no: 0 };
function shortOf(id, a) {
  const pro = a.who === 'dev' || a.who === 'agency';
  const lvl = (row) => { const v = ((data.answers[id] || {})[row] || {}).verdict; return pro && v === 'plugin' ? 3 : HAS[v] ?? 0; };
  let s = 0;
  if (a.needs === 'bookings' && !data.quiz.bookings.includes(id)) s += pro ? 0 : 1;
  if (a.needs === 'members') s += 3 - lvl('members');
  if (a.needs === 'blog' && a.what !== 'content') s += 3 - lvl('blog');
  if (a.needs === 'sell' || a.what === 'store') s += 3 - lvl('store');
  if (a.lang === 'yes') s += 3 - lvl('languages');
  if (a.what === 'store' && (a.size === 'big' || a.size === 'b2b') && !data.quiz.largeCatalogue.includes(id)) s += 3;
  if (a.what === 'store' && a.size === 'b2b' && !data.quiz.b2b.includes(id)) s += 1;
  return s;
}
// A platform that fits at all: made for what they're making, its card doesn't rule it out, and it doesn't need a
// developer when they're building it themselves
const fits = (id, a) => ((data.platforms.find((p) => p.id === id).profile || {}).goals || []).includes(a.what) && !notIdealFor(data.quiz, id, a)
  && !(['easy', 'learn'].includes(a.who) && data.quiz.ease[id] === 0) && !(a.what !== 'store' && data.quiz.storeOnly.includes(id));
const ruleErr = (rule, msg) => { if (++broke[rule] <= 3) cardErrs.push(`rule "${rule}": ${msg}`); };
const unworded = new Set();   // parts of the score with no reason wording in TIP (score.js)
const sameSet = (x, y) => x.length === y.length && x.every((w) => y.includes(w));
// Every answer echo LEAD can say, over every answer: a box may only echo the ones this visitor's answers give
const answerIds = (id) => (QUESTIONS.find((q) => q.id === id).opts || []).map((o) => o[0]);
const echoes = new Set();
for (const what of answerIds('what')) for (const kind of [undefined, ...answerIds('kind')]) for (const who of answerIds('who')) for (const budget of answerIds('budget')) for (const look of answerIds('look'))
  Object.values(LEAD).forEach((f) => { const t = f && f({ what, kind, who, budget, look }); if (t) echoes.add(t); });
// Figures a box may show: the cost bands as the table labels them, and the budget answers' own labels
const figures = [...Object.values(data.verdicts || {}), ...(QUESTIONS.find((q) => q.id === 'budget').opts || []).map((o) => o[1])].join(' ');
const sentenceErr = (at, msg) => { if (++sentenceErrs <= 5) cardErrs.push(`${at}: ${msg}`); };
let sentenceErrs = 0;
// The parts whose other side names something missing in the data (an add-on, a host, code, a feature): the only ones
// a box may use to say what the other platform lacks
const MISSING = new Set(['bookings', 'members', 'blog', 'dev', 'care', 'size']);
if (![...LACKS].every((k) => MISSING.has(k))) { console.log(`FAIL: LACKS has parts whose other side isn't something missing: ${[...LACKS].filter((k) => !MISSING.has(k))}`); process.exitCode = 1; }
// A sentence built from the comparison table (score.js rowsLine): the row's phrase, then each platform's verdict;
// "The same goes if you want …" repeats the sentence before it for another row. A phrase with a comma would split
// wrongly here, so none may have one.
Object.entries(PHRASE).forEach(([id, p]) => { if (p.includes(',')) { console.log(`FAIL: PHRASE.${id} has a comma, so its sentence can't be checked`); process.exitCode = 1; } });
const verdictOf = new Map(Object.entries(DOES).map(([v, w]) => [w, v]));
const rowOf = new Map(Object.entries(PHRASE).map(([id, p]) => [p, id]));
const saying = [...verdictOf.keys()].map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const TABLE_LINE = new RegExp(`^If you want (.+?), (.+?) (${saying}), while (.+?) (${saying})\\.$`);
const SAME_LINE = /^The same goes if you want (.+)\.$/;
// The must-haves as the divider names them, and the table row (or quiz list) behind each
const MUST_ROW = { bookings: 'bookings', 'paid members': 'members', 'a blog': 'blog', 'selling online': 'store', 'more than one language': 'languages', 'a large catalogue': 'size', 'selling to other businesses': 'b2b' };
let dividers = 0, firstGaps = 0;
let combos = 0, clear = 0, fallback = 0, byCard = 0, ties = 0, boxes = 0, tagBoxes = 0, notIdealTop = 0, weak = 0, fewFit = 0;
const cardErrs = [];
const walk = (a, i) => {
  if (i < QUESTIONS.length) {
    const q = QUESTIONS[i];
    if (q.when && !q.when(a)) return walk(a, i + 1);
    // A question's tick (q.also: two or more languages) is a yes or no beside every choice
    const ticks = q.also ? [{}, { [q.also.id]: 'yes' }] : [{}];
    ticks.forEach((x) => options(q, { ...a, ...x }, data).forEach(([v]) => walk({ ...a, ...x, [q.id]: v }, i + 1)));
    return;
  }
  combos++;
  const ranked = candidates(data, a), r = ranked.slice(0, 3), told = explain(data, a, r), at = new URLSearchParams(a).toString();
  ranked.forEach((x) => Object.keys(x.pts).forEach((k) => { if (!TIP[k]) unworded.add(k); }));
  told.forEach((t, k) => {
    if (!t.vs) return cardErrs.push(`${at}: nothing setting ${r[k].p.id} apart`);
    boxes++;
    if (/’s card (highlights|says) /.test(t.vs.text)) tagBoxes++;
    Object.keys(PHRASE).forEach((row) => { if (weight(row, a) === 0 && t.vs.text.includes(PHRASE[row])) cardErrs.push(`${at}: ${r[k].p.id} mentions "${PHRASE[row]}", which these answers rule out`); });
    // "the same reasons as" names the first or, for the third, the second: they must really match that one
    const named = k && /same reasons as/.test(t.why[0]) && r.find((x) => t.why[0].endsWith(` ${x.p.name}`));
    if (k && /same reasons as/.test(t.why[0]) && !(named && sameSet(r[k].all, named.all))) cardErrs.push(`${at}: ${r[k].p.id} says "same reasons" but they differ`);
  });
  // The second and third never say the same thing in their box (their own names aside)
  const generic = (k) => told[k].vs.text.split(r[k].p.name).join('·');
  if (r[2] && told[1].vs && told[2].vs && generic(1) === generic(2)) cardErrs.push(`${at}: ${r[1].p.id} and ${r[2].p.id} have the same box`);
  // No match in the top three whose own "Not ideal if" line matches these answers (quiz.notIdeal)
  // (unless fewer than three platforms fit at all, once the one being moved from is out: then the closest fill the cards)
  const fitting = ranked.filter((x) => !notIdealFor(data.quiz, x.p.id, a)).length;
  if (fitting >= 3) r.forEach((x) => { if (notIdealFor(data.quiz, x.p.id, a)) { notIdealTop++; if (notIdealTop <= 3) cardErrs.push(`${at}: ${x.p.id} is in the top three, but its card says it isn't ideal for these answers`); } }); else fewFit++;
  if (JSON.stringify(told[0].why) === JSON.stringify(told[1].why)) cardErrs.push(`${at}: ${r[0].p.id} and ${r[1].p.id} show the same reasons`);
  if (r[0].s < LOW_FIT) weak++;
  const notice = r[0].s < LOW_FIT || !!conflict(a);   // the page explains a poor fit above the cards
  if (!notice && !((r[0].p.profile || {}).goals || []).includes(a.what)) ruleErr('made', `${at}: ${r[0].p.id} is first but isn't made for "${a.what}"`);
  if (a.who === 'easy' && data.quiz.ease[r[0].p.id] === 0) ruleErr('dev', `${at}: ${r[0].p.id} is first for someone not technical but needs a developer`);
  if (a.what === 'site' && a.kind === 'local' && a.who === 'easy') r.forEach((x) => { if (data.quiz.ease[x.p.id] === 0) ruleErr('local', `${at}: ${x.p.id} is in the top three for a local business with no technical help`); });
  if (a.what === 'store' && (a.size === 'big' || a.size === 'b2b') && r.some((x) => x.p.id === 'framer')) ruleErr('catalogue', `${at}: Framer is in the top three for a large catalogue`);
  if (ranked.some((x) => x.p.id === a.moving)) ruleErr('origin', `${at}: ${a.moving} is offered as a match while being moved from`);
  const fitting2 = ranked.filter((x) => fits(x.p.id, a));
  if (fitting2.length) {
    const most = Math.min(...fitting2.map((x) => shortOf(x.p.id, a))), better = fitting2.find((x) => shortOf(x.p.id, a) === most);
    if (shortOf(r[0].p.id, a) > most) ruleErr('need', `${at}: ${r[0].p.id} is first, but ${better.p.id} has more of the must-haves built in`);
  }
  if (['none', 'low', 'mid'].includes(a.budget)) ranked.forEach((x) => { if (!('budget' in x.pts) && !('shopCost' in x.pts)) ruleErr('budget', `${at}: ${x.p.id}'s cost isn't weighed against the budget`); });
  if ((told[0].vs || {}).kind === 'tipped') {
    const said = told[0].vs.reason, leads = Object.values(LEAD).map((f) => f && f(a)).filter(Boolean);
    if (!leads.some((l) => said.startsWith(l))) ruleErr('named', `${at}: "${told[0].vs.text}" doesn't start from an answer`);
  }
  // Ahead on a must-have, or level on them and ahead on points
  if (ahead(r[0], r[1]) || r[0].s > r[1].s) { clear++; if (told[0].vs.kind !== 'tipped') fallback++; }
  // Level on points: first on its card's "Good fit" lines or on the look asked for (the box must say which), or a tie
  else if (!tied(r[0], r[1])) { byCard++; const want = r[0].tb !== r[1].tb ? 'card' : 'look'; if (told[0].vs.kind !== want) cardErrs.push(`${at}: ${r[0].p.id} is first on ${want === 'card' ? 'its card\'s lines' : 'the look'}, but the box doesn't say so`); } else { ties++; if (told[0].vs.kind !== 'tie') cardErrs.push(`${at}: a tie whose box doesn't say so`); }
  // Every sentence checks out against the data and the answers:
  // - "If you want design control, Wix has it built in, while Squarespace needs code for it": both verdicts are the
  //   comparison table's own, for that row and those two platforms
  // - any other "…, while Wix needs an add-on for bookings": the score marks that platform down for that very thing (LACKS)
  // - an echoed answer ("you need bookings from day one") is one this visitor gave
  // - a figure ($25) comes from a cost band's label or a budget answer, never typed into the wording
  // - the closeness words match the score gap (standing)
  const own = new Set(Object.values(LEAD).map((f) => f && f(a)).filter(Boolean));
  told.forEach((t, k) => {
    if (!t.vs) return;
    const x = r[k], text = t.vs.text;
    let last = null;   // the table sentence before, for "The same goes if you want …"
    for (const s of text.split(/(?<=\.)\s+(?=[A-Z])/)) {
      const same = s.match(SAME_LINE), row = same && last ? [s, same[1], last[2], last[3], last[4], last[5]] : s.match(TABLE_LINE);
      if (same && !last) sentenceErr(at, `${x.p.id}'s box says "${s}" with no table sentence before it`);
      if (row) {
        const id = rowOf.get(row[1]), [px, py] = [row[2], row[4]].map((n) => r.find((o) => o.p.name === n));
        const ok = id && px && py && ((data.answers[px.p.id] || {})[id] || {}).verdict === verdictOf.get(row[3]) && ((data.answers[py.p.id] || {})[id] || {}).verdict === verdictOf.get(row[5]);
        if (!ok) sentenceErr(at, `${x.p.id}'s box says "${s}", which isn't what the table says`);
        last = row;
        continue;
      }
      last = null;
      for (const m of s.matchAll(/, while (.+?) (needs|isn’t|leaves|is|has|costs)\b/g)) {
        const y = r.find((o) => o.p.name === m[1]);
        if (!y || ![...MISSING].some((p) => (x.pts[p] || 0) > 0 && (y.pts[p] || 0) < 0)) sentenceErr(at, `${x.p.id}'s box says "${m[0]}…" without the score behind it`);
      }
    }
    echoes.forEach((e) => { if (text.toLowerCase().includes(e.toLowerCase()) && !own.has(e)) sentenceErr(at, `${x.p.id}'s box echoes "${e}", which isn't one of these answers`); });
    for (const f of text.match(/\$[\d,]+(?:–\$[\d,]+)?/g) || []) if (!figures.includes(f)) sentenceErr(at, `${x.p.id}'s box shows ${f}, which no cost band or answer says`);
  });
  // The divider before matches that lack a must-have (score.js divider): every "X needs an add-on for selling online" is
  // the table's verdict for X, the first does better on it, and it appears exactly when a match below falls short
  const dv = divider(r), shortBelow = r.some((x, i) => i && x.gate === r[0].gate && x.short > r[0].short);
  if (dv) {
    dividers++;
    if (!shortBelow) cardErrs.push(`${at}: a divider with no match short of a must-have`);
    dv.lines.forEach((line) => {
      const x = r.slice(dv.at).find((o) => line.startsWith(`${o.p.name} `));
      if (!x || !line.endsWith('.')) return sentenceErr(at, `divider line "${line}" names no match below it`);
      line.slice(x.p.name.length + 1, -1).split(', and ').forEach((group) => {
        const how = Object.keys(HOW).find((h) => group.startsWith(`${HOW[h]} `));
        if (!how) return sentenceErr(at, `divider line "${line}" says something other than a verdict`);
        group.slice(HOW[how].length + 1).split(/, | and /).forEach((what) => {
          const row = MUST_ROW[what], first = r[0].p.id;
          const v = (id) => (row === 'bookings' ? ((data.quiz.bookings || []).includes(id) ? 'yes' : 'plugin') : row === 'size' ? (data.quiz.largeCatalogue.includes(id) ? 'yes' : 'notMade')
            : row === 'b2b' ? (data.quiz.b2b.includes(id) ? 'yes' : 'notMade') : ((data.answers[id] || {})[row] || {}).verdict);
          const rank = (w) => ({ yes: 3, auto: 3, plugin: 2, indirect: 2, code: 1, check: 1, no: 0, notMade: 0 })[w] ?? -1;
          if (!row || HOW[v(x.p.id)] !== HOW[how] || !(rank(v(first)) > rank(v(x.p.id)))) sentenceErr(at, `divider says "${x.p.name} ${HOW[how]} ${what}", which the table doesn't back against ${r[0].p.name}`);
        });
      });
    });
  } else if (shortBelow && r.slice(1).some((x) => x.gate === r[0].gate && x.must.some((m) => m.short > ((r[0].must.find((l) => l.key === m.key) || {}).short || 0)))) cardErrs.push(`${at}: a match short of a must-have with no divider above it`);
  // The note when even the first lacks a must-have (score.js firstGap): true only if no platform that fits (level with
  // the first on what rules one out) has every must-have built in, and its sentence is the first's own verdicts
  const fg = firstGap(r), fitsAll = ranked.some((x) => x.gate === r[0].gate && !x.short);
  if (fg) {
    firstGaps++;
    if (fitsAll) sentenceErr(at, `the note says nothing that fits has everything built in, but one does`);
    const own = fg.split('. ').slice(1).join('. ');
    if (!own.startsWith(`${r[0].p.name} `)) sentenceErr(at, `the note "${fg}" doesn't name the best match`);
    else own.slice(r[0].p.name.length + 1, -1).split(', and ').forEach((group) => {
      const how = Object.keys(HOW).find((h) => group.startsWith(`${HOW[h]} `));
      group.slice(how ? HOW[how].length + 1 : 0).split(/, | and /).forEach((what) => {
        const m = r[0].must.find((x) => x.what === what);
        if (!how || !m || HOW[m.how] !== HOW[how] || !m.short) sentenceErr(at, `the note says "${r[0].p.name} ${group}", which isn't its verdict`);
      });
    });
  } else if (!r[0].gate && r[0].must.some((m) => m.short > 0 && HOW[m.how])) cardErrs.push(`${at}: the best match lacks a must-have but no note says so`);
  const st = standing(r);
  if (st) {
    // Ahead on a must-have: a clear lead, or a clear winner when the second is ruled out or also well behind on points
    const tier = ahead(r[0], r[1]);
    const want = tier ? (tier === 'gate' || st.gap > 5 ? 'clear' : 'lead') : st.gap === 0 ? 'level' : st.gap <= 2 ? 'close' : st.gap <= 5 ? 'lead' : 'clear';
    if (st.kind !== want || (/slightly/.test(st.line) && st.kind !== 'close') || (/well ahead/.test(st.line) && st.gap <= 5 && tier !== 'gate') || (/equally/.test(st.line) && (st.gap || tier))) sentenceErr(at, `a ${st.gap}-point gap${tier ? ` (ahead on ${tier})` : ''} reads "${st.pill}: ${st.line}"`);
  }
  // No box says "undefined", "null" or "NaN", or keeps the old scoring words
  told.forEach((t, k) => { if (t.vs && /undefined|null|NaN|Level on points|What tipped it|strengths:|does better for you|natural fit|better pick/.test(`${t.vs.head} ${t.vs.text}`)) cardErrs.push(`${at}: ${r[k].p.id}'s box reads "${t.vs.head}: ${t.vs.text}"`); });
  // Old shared links (v=1) get NEUTRAL answers for questions they didn't have: they must change no score,
  // and leaving a question unanswered (kind, members) mustn't break the ranking
  Object.entries(NEUTRAL).forEach(([q, v]) => {
    if (a[q] !== v) return;
    const without = { ...a }; delete without[q];
    const s1 = rank(data, a).map((x) => `${x.p.id}:${x.s}`).join(), s2 = rank(data, without).map((x) => `${x.p.id}:${x.s}`).join();
    if (s1 !== s2) cardErrs.push(`${at}: the neutral answer ${q}=${v} changes the scores`);
  });
  ['kind', 'members'].forEach((q) => { if (q in a) { const without = { ...a }; delete without[q]; rank(data, without); } });
};
walk({}, 0);
unworded.forEach((k) => cardErrs.push(`score part "${k}" has no wording in TIP (score.js), so it can't say what tipped a result`));
// Each part says the answer behind it first (LEAD); null only when its wording already names the answer
Object.keys(TIP).forEach((k) => { if (!(k in LEAD)) cardErrs.push(`score part "${k}" has no answer lead-in in LEAD (score.js)`); });
// A design-control tie-break (quiz.lookBest) must quote a tag that is on its platform's card
Object.entries(data.quiz.lookBest || {}).forEach(([id, lb]) => {
  const p = data.platforms.find((x) => x.id === id);
  if (!p || !((p.profile || {}).tags || []).includes(lb.tag)) cardErrs.push(`lookBest for ${id}: "${lb.tag}" isn't a tag on its card`);
});
// Every mapped "Not ideal if" line must still be on its platform's card, or the rule matches a line nobody sees
Object.entries(data.quiz.notIdeal || {}).forEach(([id, rules]) => {
  const lines = ((data.platforms.find((p) => p.id === id) || {}).profile || {}).lessSuited || [];
  rules.forEach((n) => { if (!lines.some((l) => l.startsWith(n.if))) cardErrs.push(`notIdeal for ${id}: "${n.if}" isn't a "Not ideal if" line on its card any more`); });
});
// Every tagged "Good fit" line (quiz.fitFor, the tie-break) must still be on its card, and its "when" must name real
// questions and answers
Object.entries(data.quiz.fitFor || {}).forEach(([id, tags]) => {
  const lines = ((data.platforms.find((p) => p.id === id) || {}).profile || {}).goodFit || [];
  tags.forEach((f) => {
    if (!lines.some((l) => l.startsWith(f.line))) cardErrs.push(`fitFor for ${id}: "${f.line}" isn't a "Good fit" line on its card any more`);
    Object.entries(f.when).forEach(([qid, vs]) => {
      const q = QUESTIONS.find((x) => x.id === qid);
      if (!q || vs.some((v) => !options(q, {}, data).some(([o]) => o === v))) cardErrs.push(`fitFor for ${id}: "${f.line}" answers ${qid}=${vs.join('|')}, which isn't a question and answer`);
    });
  });
});
// A free plan's address note (quiz.freeDomain) names its address and the platform's own page, on a platform that starts free
Object.entries(data.quiz.freeDomain || {}).forEach(([id, fd]) => {
  if (!fd.address || !/^https:\/\//.test(fd.url || '')) cardErrs.push(`freeDomain for ${id}: needs an address and the platform's own page`);
  if (((data.answers[id] || {}).cost_site || {}).verdict !== 'free') cardErrs.push(`freeDomain for ${id}: its site doesn't start free any more`);
});
data.items.forEach((it) => { if (!PHRASE[it.id]) cardErrs.push(`table row "${it.id}" has no short phrase in PHRASE (score.js)`); });
cardErrs.slice(0, 10).forEach((e) => console.log(`FAIL ${e}`));
console.log(`${combos} answer combinations: ${cardErrs.length ? `${cardErrs.length} card problems` : 'every result card checks out'}${sentenceErrs ? ` (${sentenceErrs} sentences the data doesn't back)` : ', and every sentence is backed by the data and the answers'}. ${clear} clear winners, ${fallback} without a reason from their answers; ${byCard} first by their card's "Good fit" lines, ${ties} tied. ${tagBoxes} of ${boxes} boxes use the card tags (${Math.round(100 * tagBoxes / boxes)}%). ${notIdealTop} top-three places that their own card calls not ideal (${fewFit} sets have fewer than three platforms that fit at all). ${weak} show a "Closest match" (first scores under ${LOW_FIT}). ${dividers} put a divider above matches that lack a must-have; ${firstGaps} say even the best match lacks one.`);
console.log(`Rules: first is made for what they're making ${broke.made ? `FAILS ${broke.made}` : 'ok'}; not technical never gets "Needs a developer" first ${broke.dev ? `FAILS ${broke.dev}` : 'ok'}; no "Not ideal if" in the top three ${notIdealTop ? `FAILS ${notIdealTop}` : 'ok'}; every reason starts from an answer ${broke.named ? `FAILS ${broke.named}` : 'ok'}; no developer platform for a solo local business ${broke.local ? `FAILS ${broke.local}` : 'ok'}; no Framer for a large catalogue ${broke.catalogue ? `FAILS ${broke.catalogue}` : 'ok'}; the platform you're leaving is never a match ${broke.origin ? `FAILS ${broke.origin}` : 'ok'}; the must-haves come before taste ${broke.need ? `FAILS ${broke.need}` : 'ok'}; every cost is weighed against the budget ${broke.budget ? `FAILS ${broke.budget}` : 'ok'}.`);
process.exit(failed || cardErrs.length ? 1 : 0);
