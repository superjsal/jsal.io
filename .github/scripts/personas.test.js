// CMS Picker persona tests: example people run through the real Find my fit scoring (cms-picker/score.js),
// checked against the results John agreed (2026-10-29; 37 people since the business-site, members, budget and B2B questions). Run by build\check.ps1 (node .github/scripts/personas.test.js).
// The answers come from cms-picker/data.json and the quiz's own values from cms-picker/quiz.json, as on the
// page, so a change to either is tested before it goes live. When a result should change, agree it first, then
// update the expectation here.
//   first: the platform(s) allowed in first place   top3: must all be in the top three   not: none may be
const path = require('path');
const site = path.join(__dirname, '..', '..');
const { rank, explain } = require(path.join(site, 'cms-picker', 'score.js'));
const data = require(path.join(site, 'cms-picker', 'data.json'));
const quiz = require(path.join(site, 'cms-picker', 'quiz.json'));
data.quiz = Object.fromEntries(Object.entries(quiz).filter(([k]) => !k.startsWith('_')));   // as app.js does
const ids = new Set(data.platforms.map((p) => p.id));   // platforms on the CMS Picker (a top-three check skips any that aren't)

const PERSONAS = [
  // Business or work sites (with "Which is closest to what you do?", agreed 2026-10-29)
  ['Local bakery, no tech help', { what: 'site', kind: 'local', who: 'easy', care: 'no', lang: 'no', look: 'template', leave: 'no' },
    { first: ['wix', 'squarespace'], top3: ['wix', 'squarespace'], not: ['magento', 'drupal', 'sanity'] }],
  ['Multilingual B2B SaaS marketing site, agency-built', { what: 'site', kind: 'b2b', who: 'agency', care: 'no', lang: 'yes', look: 'pixel', leave: 'no' },
    { first: ['hubspot', 'webflow'], top3: ['hubspot', 'webflow'] }],   // HubSpot since Webflow's languages became a paid add-on (agreed)
  ['Agency-built local service site', { what: 'site', kind: 'local', who: 'agency', care: 'no', lang: 'no', look: 'visual', leave: 'no' },
    { first: ['duda'], top3: ['duda'] }],
  ['Design-led startup landing page', { what: 'site', kind: 'startup', who: 'learn', care: 'no', lang: 'no', look: 'pixel', leave: 'no' },
    { first: ['webflow', 'framer'], top3: ['webflow', 'framer'] }],
  ['Photographer portfolio, does it alone', { what: 'site', kind: 'creative', who: 'learn', care: 'no', lang: 'no', look: 'visual', leave: 'no' },
    { first: ['squarespace', 'framer'], top3: ['squarespace'], not: ['magento', 'drupal', 'sanity'] }],
  ['Learns as they go, local business (John’s answers)', { what: 'site', kind: 'local', who: 'learn', care: 'yes', lang: 'no', look: 'visual', leave: 'no' },
    { first: ['wix', 'squarespace'], top3: ['wix', 'squarespace'] }],
  // A close call agreed with John: HubSpot if sales run on its CRM, Webflow for design control
  ['Learns as they go, B2B company (John’s answers)', { what: 'site', kind: 'b2b', who: 'learn', care: 'yes', lang: 'no', look: 'visual', leave: 'no' },
    { first: ['webflow', 'hubspot'], top3: ['webflow', 'hubspot'] }],
  ['Freelance consultant, one-page site', { what: 'site', kind: 'local', who: 'easy', care: 'no', lang: 'no', look: 'template', leave: 'no' },
    { first: ['wix', 'squarespace'], top3: ['wix', 'squarespace'], not: ['magento', 'drupal', 'sanity'] }],
  ['Restaurant in a tourist town, two languages', { what: 'site', kind: 'local', who: 'easy', care: 'no', lang: 'yes', look: 'template', leave: 'no' },
    { first: ['wix'], top3: ['wix', 'squarespace'] }],
  ['B2B marketing team with lots of articles', { what: 'site', kind: 'content', who: 'learn', care: 'no', lang: 'no', look: 'visual', leave: 'no' },
    { first: ['webflow', 'hubspot'], top3: ['webflow', 'hubspot'] }],
  ['Estate agent, built by an agency', { what: 'site', kind: 'local', who: 'agency', care: 'no', lang: 'no', look: 'template', leave: 'no' },
    { first: ['duda'], top3: ['duda'] }],
  ['Developer portfolio, owns everything', { what: 'site', kind: 'creative', who: 'dev', care: 'yes', lang: 'no', look: 'pixel', leave: 'yes' },
    { first: ['wordpress', 'drupal'], top3: ['wordpress'] }],
  // Stores
  ['Etsy-style maker shop', { what: 'store', who: 'easy', care: 'no', size: 'small', lang: 'no', look: 'template', leave: 'no' },
    { first: ['shopify'], top3: ['shopify'], not: ['magento', 'drupal', 'sanity'] }],
  ['5,000-product store with a dev team', { what: 'store', who: 'dev', care: 'yes', size: 'big', lang: 'no', look: 'pixel', leave: 'yes' },
    { first: ['magento'], top3: ['magento', 'shopify'], not: ['wix', 'squarespace'] }],
  ['Wholesale B2B store with a developer, two languages', { what: 'store', who: 'dev', care: 'yes', size: 'big', lang: 'yes', look: 'pixel', leave: 'no' },
    { first: ['magento'], top3: ['magento', 'shopify', 'bigcommerce'] }],
  ['Clothing brand, about 50 products, wants design control', { what: 'store', who: 'learn', care: 'no', size: 'small', lang: 'no', look: 'visual', leave: 'no' },
    { first: ['shopify', 'wix', 'squarespace'], top3: ['shopify'] }],   // a three-way tie: the store questions don't ask about design
  ['Coffee roaster selling to cafés (B2B), not technical', { what: 'store', who: 'easy', care: 'no', size: 'b2b', lang: 'no', look: 'template', leave: 'no' },
    { first: ['bigcommerce'], top3: ['bigcommerce', 'shopify'] }],
  ['Wholesaler with trade accounts (B2B), happy to learn', { what: 'store', who: 'learn', care: 'no', size: 'b2b', lang: 'no', look: 'template', leave: 'no' },
    { first: ['bigcommerce'], top3: ['bigcommerce', 'shopify'] }],
  ['Parts supplier selling to businesses (B2B), with a developer', { what: 'store', who: 'dev', care: 'yes', size: 'b2b', lang: 'no', look: 'template', leave: 'no' },
    { first: ['magento'], top3: ['magento', 'bigcommerce'] }],
  // Adding features as the site grows: the biggest plugin and app libraries count, not over hosting being handled
  ['Local business adding bookings and reviews later, happy to learn', { what: 'site', kind: 'local', who: 'learn', care: 'yes', lang: 'no', look: 'template', leave: 'yes', grow: 'yes', budget: 'low' },
    { first: ['wordpress'], top3: ['wordpress', 'wix', 'squarespace'] }],
  ['Local business adding features later, wants hosting handled', { what: 'site', kind: 'local', who: 'learn', care: 'no', lang: 'no', look: 'template', leave: 'yes', grow: 'yes', budget: 'low' },
    { first: ['wix', 'squarespace'], not: ['wordpress'] }],
  ['Blogger who will add features, happy to learn', { what: 'content', members: 'no', who: 'learn', care: 'yes', lang: 'no', look: 'template', leave: 'yes', grow: 'yes', budget: 'low' },
    { first: ['wordpress'], top3: ['wordpress', 'ghost'] }],
  // Round 5: a non-technical local business that adds features isn't steered to a CRM-first platform
  ['Local business, not technical, adding features', { what: 'site', kind: 'local', who: 'easy', care: 'no', lang: 'no', look: 'template', leave: 'no', grow: 'yes', budget: 'low' },
    { first: ['wix'], top3: ['wix', 'squarespace'], not: ['hubspot'] }],
  // Blogs, publications and custom builds
  ['Newsletter writer with paid members', { what: 'content', members: 'yes', who: 'learn', care: 'no', lang: 'no', look: 'template', leave: 'yes' },
    { first: ['ghost'], top3: ['ghost'] }],
  ['Government multilingual content site', { what: 'content', members: 'no', who: 'dev', care: 'yes', lang: 'yes', look: 'pixel', leave: 'yes' },
    { first: ['drupal'], top3: ['drupal', 'wordpress'], not: ['wix', 'squarespace', 'webflow'] }],
  ['Small blog that wants to own everything', { what: 'content', members: 'no', who: 'learn', care: 'yes', lang: 'no', look: 'template', leave: 'yes' },
    { first: ['ghost', 'wordpress'], top3: ['ghost', 'wordpress'] }],
  ['Hobby blog, not technical', { what: 'content', members: 'no', who: 'easy', care: 'no', lang: 'no', look: 'template', leave: 'no' },
    { first: ['squarespace', 'ghost'], top3: ['squarespace', 'ghost'] }],
  ['Online course creator with members', { what: 'content', members: 'yes', who: 'easy', care: 'no', lang: 'no', look: 'template', leave: 'no' },
    { first: ['ghost'], top3: ['ghost', 'squarespace'] }],
  ['Paid newsletter, not technical, two languages', { what: 'content', members: 'yes', who: 'easy', care: 'no', lang: 'yes', look: 'template', leave: 'no' },
    { first: ['ghost'], top3: ['ghost'] }],
  ['Nonprofit with news in two languages', { what: 'content', members: 'no', who: 'learn', care: 'no', lang: 'yes', look: 'template', leave: 'yes' },
    { first: ['hubspot', 'ghost'], top3: ['hubspot', 'ghost'] }],
  ['Developer building an app and a site', { what: 'custom', who: 'dev', care: 'yes', lang: 'no', look: 'pixel', leave: 'yes' },
    { first: ['sanity'], top3: ['sanity'] }],
  // With "What can you spend each month?" (the "What it costs to start" bands)
  ['Local bakery, no budget yet', { what: 'site', kind: 'local', who: 'easy', care: 'no', lang: 'no', look: 'template', leave: 'no', budget: 'none' },
    { first: ['wix'], top3: ['wix'] }],
  ['Etsy-style maker shop, up to $25 a month', { what: 'store', who: 'easy', care: 'no', size: 'small', lang: 'no', look: 'template', leave: 'no', budget: 'low' },
    { first: ['squarespace'], top3: ['squarespace', 'shopify'] }],
  ['Etsy-style maker shop, up to $100 a month', { what: 'store', who: 'easy', care: 'no', size: 'small', lang: 'no', look: 'template', leave: 'no', budget: 'mid' },
    { first: ['shopify'], top3: ['shopify'] }],
  ['Photographer, no budget yet', { what: 'site', kind: 'creative', who: 'learn', care: 'no', lang: 'no', look: 'visual', leave: 'no', budget: 'none' },
    { first: ['framer'], top3: ['framer'] }],
  ['Newsletter with paid members, up to $25 a month', { what: 'content', members: 'yes', who: 'learn', care: 'no', lang: 'no', look: 'template', leave: 'yes', budget: 'low' },
    { first: ['ghost'], top3: ['ghost'] }],
  ['5,000-product store with a dev team, cost no object', { what: 'store', who: 'dev', care: 'yes', size: 'big', lang: 'no', look: 'pixel', leave: 'yes', budget: 'any' },
    { first: ['magento'], top3: ['magento'] }],
];

let failed = 0;
for (const [name, answers, want] of PERSONAS) {
  const r = rank(data, answers), top = r.slice(0, 3).map((x) => x.p.id);
  const errs = [];
  if (want.first && !want.first.includes(top[0])) errs.push(`first is ${top[0]}, expected ${want.first.join(' or ')}`);
  (want.top3 || []).forEach((id) => { if (ids.has(id) && !top.includes(id)) errs.push(`${id} not in the top three`); });
  (want.not || []).forEach((id) => { if (top.includes(id)) errs.push(`${id} in the top three`); });
  // A tie for first means the page shows a "Best match" it can't back up
  if (r[1] && r[0].s === r[1].s && want.first && want.first.length === 1) errs.push(`tied for first: ${r[0].p.id} and ${r[1].p.id}`);
  const line = r.slice(0, 3).map((x) => `${x.p.name} ${x.s}`).join(', ');
  if (errs.length) { failed++; console.log(`FAIL ${name}: ${errs.join('; ')}  [${line}]`); }
  else console.log(`ok   ${name}  [${line}]`);
}
console.log(failed ? `${failed} of ${PERSONAS.length} personas failed.` : `All ${PERSONAS.length} personas passed.`);

// The result cards, for every possible set of answers: each card says what sets it apart, without
// mentioning anything the person ruled out; "the same reasons as" only when it's true; the top two
// never show the same list; and a clear winner says what tipped it.
const { QUESTIONS, PHRASE, weight, TIP, NEUTRAL, notIdealFor } = require(path.join(site, 'cms-picker', 'score.js'));
const unworded = new Set();   // parts of the score with no "What tipped it" wording in TIP (score.js)
const sameSet = (x, y) => x.length === y.length && x.every((w) => y.includes(w));
let combos = 0, clear = 0, fallback = 0, boxes = 0, tagBoxes = 0, notIdealTop = 0;
const cardErrs = [];
const walk = (a, i) => {
  if (i < QUESTIONS.length) {
    const q = QUESTIONS[i];
    if (q.when && !q.when(a)) return walk(a, i + 1);
    q.opts.forEach(([v]) => walk({ ...a, [q.id]: v }, i + 1));
    return;
  }
  combos++;
  const ranked = rank(data, a), r = ranked.slice(0, 3), told = explain(data, a, r), at = new URLSearchParams(a).toString();
  ranked.forEach((x) => Object.keys(x.pts).forEach((k) => { if (!TIP[k]) unworded.add(k); }));
  told.forEach((t, k) => {
    if (!t.vs) return cardErrs.push(`${at}: nothing setting ${r[k].p.id} apart`);
    boxes++;
    if (/ is known for: /.test(t.vs.text)) tagBoxes++;
    Object.keys(PHRASE).forEach((row) => { if (weight(row, a) === 0 && t.vs.text.includes(PHRASE[row])) cardErrs.push(`${at}: ${r[k].p.id} mentions "${PHRASE[row]}", which these answers rule out`); });
    if (k && /same reasons as/.test(t.why[0]) && !sameSet(r[k].all, r[0].all)) cardErrs.push(`${at}: ${r[k].p.id} says "same reasons" but they differ`);
  });
  // No match in the top three whose own "Not ideal if" line matches these answers (quiz.notIdeal)
  r.forEach((x) => { if (notIdealFor(data.quiz, x.p.id, a)) { notIdealTop++; if (notIdealTop <= 3) cardErrs.push(`${at}: ${x.p.id} is in the top three, but its card says it isn't ideal for these answers`); } });
  if (JSON.stringify(told[0].why) === JSON.stringify(told[1].why)) cardErrs.push(`${at}: ${r[0].p.id} and ${r[1].p.id} show the same reasons`);
  if (r[0].s > r[1].s) { clear++; if (!/^What tipped it/.test(told[0].vs.text)) fallback++; }
  // Old shared links (v=1) get NEUTRAL answers for questions they didn't have: they must change no score,
  // and leaving a question unanswered (kind, members) mustn't break the ranking
  Object.entries(NEUTRAL).forEach(([q, v]) => {
    if (a[q] !== v) return;
    const without = { ...a }; delete without[q];
    const s1 = ranked.map((x) => `${x.p.id}:${x.s}`).join(), s2 = rank(data, without).map((x) => `${x.p.id}:${x.s}`).join();
    if (s1 !== s2) cardErrs.push(`${at}: the neutral answer ${q}=${v} changes the scores`);
  });
  ['kind', 'members'].forEach((q) => { if (q in a) { const without = { ...a }; delete without[q]; rank(data, without); } });
};
walk({}, 0);
unworded.forEach((k) => cardErrs.push(`score part "${k}" has no wording in TIP (score.js), so it can't say what tipped a result`));
// Every mapped "Not ideal if" line must still be on its platform's card, or the rule matches a line nobody sees
Object.entries(data.quiz.notIdeal || {}).forEach(([id, rules]) => {
  const lines = ((data.platforms.find((p) => p.id === id) || {}).profile || {}).lessSuited || [];
  rules.forEach((n) => { if (!lines.some((l) => l.startsWith(n.if))) cardErrs.push(`notIdeal for ${id}: "${n.if}" isn't a "Not ideal if" line on its card any more`); });
});
data.items.forEach((it) => { if (!PHRASE[it.id]) cardErrs.push(`table row "${it.id}" has no short phrase in PHRASE (score.js)`); });
cardErrs.slice(0, 10).forEach((e) => console.log(`FAIL ${e}`));
console.log(`${combos} answer combinations: ${cardErrs.length ? `${cardErrs.length} card problems` : 'every result card checks out'}. ${clear} clear winners, ${fallback} without a "What tipped it". ${tagBoxes} of ${boxes} boxes use the card tags (${Math.round(100 * tagBoxes / boxes)}%). ${notIdealTop} top-three places that their own card calls not ideal.`);
process.exit(failed || cardErrs.length ? 1 : 0);
