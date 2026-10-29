// CMS Picker persona tests: example people run through the real Find my fit scoring (cms-picker/score.js),
// checked against the results John agreed on 2026-10-29. Run by build\check.ps1 (node .github/scripts/personas.test.js).
// The answers come from cms-picker/data.json with this folder's cms-picker.json quiz values on top, so a
// change to either is tested before the next publish. When a result should change, agree it first, then
// update the expectation here.
//   first: the platform(s) allowed in first place   top3: must all be in the top three   not: none may be
const path = require('path');
const site = path.join(__dirname, '..', '..');
const { rank, explain } = require(path.join(site, 'cms-picker', 'score.js'));
const data = require(path.join(site, 'cms-picker', 'data.json'));
const cfg = require(path.join(__dirname, 'cms-picker.json'));

// The quiz values as the next publish will write them (public platforms only, no _notes)
const ids = new Set(data.platforms.map((p) => p.id));
data.quiz = Object.fromEntries(Object.entries(cfg.quiz).filter(([k]) => !k.startsWith('_')).map(([k, v]) => [k,
  Array.isArray(v) ? v.filter((p) => ids.has(p)) : Object.fromEntries(Object.entries(v).filter(([p]) => ids.has(p)))]));

const PERSONAS = [
  ['Local bakery, no tech help', { what: 'site', who: 'easy', care: 'no', lang: 'no', look: 'template', leave: 'no' },
    { first: ['wix', 'squarespace'], top3: ['wix', 'squarespace'], not: ['magento', 'drupal', 'headless'] }],
  ['Etsy-style maker shop', { what: 'store', who: 'easy', care: 'no', size: 'small', lang: 'no', look: 'template', leave: 'no' },
    { first: ['shopify'], top3: ['shopify'], not: ['magento', 'drupal', 'headless'] }],
  ['Multilingual B2B SaaS marketing site, agency-built', { what: 'site', who: 'agency', care: 'no', lang: 'yes', look: 'pixel', leave: 'no' },
    { first: ['webflow', 'framer'], top3: ['webflow', 'framer'] }],
  ['Newsletter writer with paid members', { what: 'content', who: 'learn', care: 'no', lang: 'no', look: 'template', leave: 'yes' },
    { first: ['ghost'], top3: ['ghost'] }],
  ['Agency-built local service site', { what: 'site', who: 'agency', care: 'no', lang: 'no', look: 'visual', leave: 'no' },
    { first: ['webflow', 'framer', 'duda'], top3: ['webflow'] }],
  ['5,000-product store with a dev team', { what: 'store', who: 'dev', care: 'yes', size: 'big', lang: 'no', look: 'pixel', leave: 'yes' },
    { first: ['magento'], top3: ['magento', 'shopify'], not: ['wix', 'squarespace'] }],
  ['Government multilingual content site', { what: 'content', who: 'dev', care: 'yes', lang: 'yes', look: 'pixel', leave: 'yes' },
    { first: ['drupal'], top3: ['drupal', 'wordpress'], not: ['wix', 'squarespace', 'webflow'] }],
  ['Design-led startup landing page', { what: 'site', who: 'learn', care: 'no', lang: 'no', look: 'pixel', leave: 'no' },
    { first: ['webflow', 'framer'], top3: ['webflow', 'framer'] }],
  ['Developer building an app and a site', { what: 'custom', who: 'dev', care: 'yes', lang: 'no', look: 'pixel', leave: 'yes' },
    { first: ['headless'], top3: ['headless'] }],
  ['Photographer portfolio, does it alone', { what: 'site', who: 'learn', care: 'no', lang: 'no', look: 'visual', leave: 'no' },
    { top3: ['wix', 'squarespace'], not: ['magento', 'drupal', 'headless'] }],
  ['Small blog that wants to own everything', { what: 'content', who: 'learn', care: 'yes', lang: 'no', look: 'template', leave: 'yes' },
    { first: ['ghost', 'wordpress'], top3: ['ghost', 'wordpress'] }],
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
  // Each card says what sets it apart, and the top two never show the same reasons
  const told = explain(data, answers, r.slice(0, 3));
  told.forEach((t, i) => { if (!t.vs) errs.push(`nothing setting ${r[i].p.id} apart`); });
  if (told[1] && JSON.stringify(told[0].why) === JSON.stringify(told[1].why)) errs.push(`${r[0].p.id} and ${r[1].p.id} show the same reasons`);
  const line = r.slice(0, 3).map((x) => `${x.p.name} ${x.s}`).join(', ');
  if (errs.length) { failed++; console.log(`FAIL ${name}: ${errs.join('; ')}  [${line}]`); }
  else console.log(`ok   ${name}  [${line}]`);
}
console.log(failed ? `${failed} of ${PERSONAS.length} personas failed.` : `All ${PERSONAS.length} personas passed.`);
process.exit(failed ? 1 : 0);
