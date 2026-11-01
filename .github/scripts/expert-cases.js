// CMS Picker: expert cases, a report on how often Find my fit agrees with what an experienced web consultant would
// recommend. Each case is a real-world client and the picks a consultant would accept, written from platform knowledge
// without looking at the quiz's results (drafted by Claude on 2026-11-01; John asked for it as a standing report).
// Unlike the personas (personas.test.js), these never fail a check: they show whether a change makes the quiz agree with
// expert judgment more or less often. Edit a case only when the expert judgment itself is wrong, never to match a result.
//   ok: acceptable first picks; any: at least one of these in the top three; never: shouldn't be in the top three
const path = require('path');
const site = path.join(__dirname, '..', '..', 'site');
const { candidates } = require(path.join(site, 'cms-picker', 'score.js'));
const data = require(path.join(site, 'cms-picker', 'data.json'));
const quiz = require(path.join(site, 'cms-picker', 'quiz.json'));
data.quiz = Object.fromEntries(Object.entries(quiz).filter(([k]) => !k.startsWith('_')));   // as app.js does

// Agreement when the report was set up: fewer than this is called out
const BASELINE = 39;
const DEV = ['magento', 'drupal', 'sanity'];
const S = (o) => ({ moving: 'no', needs: 'none', budget: 'any', ...o });
const CASES = [
  // Local businesses
  ['Hair salon, not technical, bookings, up to $25', S({ what: 'site', kind: 'local', who: 'easy', care: 'no', needs: 'bookings', look: 'template', budget: 'low' }), { ok: ['wix', 'squarespace'], never: [...DEV, 'webflow', 'framer', 'hubspot'] }],
  ['Plumber, not technical, the usual pages, up to $25', S({ what: 'site', kind: 'local', who: 'easy', care: 'no', look: 'template', budget: 'low' }), { ok: ['wix', 'squarespace'], never: [...DEV, 'webflow'] }],
  ['Restaurant in two languages with table bookings, not technical', S({ what: 'site', kind: 'local', who: 'easy', care: 'no', needs: 'bookings', lang: 'yes', look: 'template', budget: 'low' }), { ok: ['wix'], any: ['wix'], never: DEV }],
  ['Yoga studio with paid members, not technical', S({ what: 'site', kind: 'local', who: 'easy', care: 'no', needs: 'members', look: 'template', budget: 'mid' }), { ok: ['wix', 'squarespace'], never: [...DEV, 'hubspot'] }],
  ['Local accountant, agency-built', S({ what: 'site', kind: 'local', who: 'agency', care: 'no', look: 'template', budget: 'mid' }), { ok: ['duda', 'wordpress', 'squarespace', 'wix'], never: DEV }],
  ['Dental clinic, agency-built, bookings', S({ what: 'site', kind: 'local', who: 'agency', care: 'no', needs: 'bookings', look: 'visual', budget: 'mid' }), { ok: ['duda', 'wix', 'wordpress', 'squarespace'], never: DEV }],
  ['Bakery selling cakes online too, not technical, up to $25', S({ what: 'site', kind: 'local', who: 'easy', care: 'no', needs: 'sell', look: 'template', budget: 'low' }), { ok: ['squarespace', 'wix'], never: [...DEV, 'framer', 'hubspot', 'ghost'] }],
  ['Church with news posts, not technical, nothing to spend', S({ what: 'site', kind: 'local', who: 'easy', care: 'no', needs: 'blog', look: 'template', budget: 'none' }), { ok: ['wix', 'squarespace'], never: DEV }],
  ['Local business, built by a developer friend, own hosting', S({ what: 'site', kind: 'local', who: 'dev', care: 'yes', look: 'visual', budget: 'low' }), { ok: ['wordpress', 'wix', 'squarespace'], never: ['magento', 'sanity'] }],
  ['Tourist café in two languages, developer-built, own hosting', S({ what: 'site', kind: 'local', who: 'dev', care: 'yes', lang: 'yes', look: 'pixel', budget: 'low' }), { ok: ['wordpress', 'wix', 'webflow'], never: ['magento', 'sanity'] }],
  // Creative and startups
  ['Wedding photographer, happy to learn, up to $25', S({ what: 'site', kind: 'creative', who: 'learn', care: 'no', look: 'visual', budget: 'low' }), { ok: ['squarespace', 'wix', 'framer'], never: DEV }],
  ['Designer portfolio, every detail', S({ what: 'site', kind: 'creative', who: 'learn', care: 'no', look: 'pixel', budget: 'low' }), { ok: ['framer', 'webflow'], never: DEV }],
  ['Musician selling merch, not technical, nothing to spend', S({ what: 'site', kind: 'creative', who: 'easy', care: 'no', needs: 'sell', look: 'template', budget: 'none' }), { ok: ['wix', 'squarespace'], never: [...DEV, 'framer', 'webflow'] }],
  ['Artist taking commissions by booking, happy to learn', S({ what: 'site', kind: 'creative', who: 'learn', care: 'no', needs: 'bookings', look: 'visual', budget: 'low' }), { ok: ['squarespace', 'wix'], never: DEV }],
  ['SaaS landing page, happy to learn, every detail, nothing to spend', S({ what: 'site', kind: 'startup', who: 'learn', care: 'no', look: 'pixel', budget: 'none' }), { ok: ['framer', 'webflow'], never: DEV }],
  ['Funded startup site with a blog, agency-built', S({ what: 'site', kind: 'startup', who: 'agency', care: 'no', needs: 'blog', look: 'pixel', budget: 'any' }), { ok: ['webflow', 'framer', 'wordpress'], never: ['magento', 'drupal'] }],
  ['App launch page, not technical, nothing to spend', S({ what: 'site', kind: 'startup', who: 'easy', care: 'no', look: 'visual', budget: 'none' }), { ok: ['wix', 'framer', 'squarespace'], never: DEV }],
  // B2B and content-heavy business sites
  ['Industrial B2B, lead generation, agency-built', S({ what: 'site', kind: 'b2b', who: 'agency', care: 'no', look: 'template', budget: 'any' }), { ok: ['hubspot', 'wordpress', 'webflow'], never: ['magento', 'sanity'] }],
  ['B2B software company, in-house marketer, every detail', S({ what: 'site', kind: 'b2b', who: 'learn', care: 'no', look: 'pixel', budget: 'mid' }), { ok: ['webflow', 'hubspot', 'framer'], never: DEV }],
  ['Consultancy publishing guides, agency-built, own hosting', S({ what: 'site', kind: 'content', who: 'agency', care: 'yes', needs: 'blog', look: 'visual', budget: 'any' }), { ok: ['wordpress', 'webflow', 'hubspot'], never: ['magento'] }],
  ['Resource library for a marketing team, happy to learn', S({ what: 'site', kind: 'content', who: 'learn', care: 'no', look: 'visual', budget: 'mid' }), { ok: ['webflow', 'wordpress', 'hubspot'], never: DEV }],
  // Publications
  ['Food blogger, happy to learn, up to $25', S({ what: 'content', who: 'learn', care: 'no', look: 'template', budget: 'low' }), { ok: ['wordpress', 'ghost', 'squarespace'], never: ['hubspot', 'magento', 'shopify'] }],
  ['Paid newsletter writer, not technical', S({ what: 'content', who: 'easy', care: 'no', needs: 'members', look: 'template', budget: 'mid' }), { ok: ['ghost'], any: ['ghost'], never: ['hubspot', 'magento'] }],
  ['Podcaster with paid supporters, happy to learn, up to $25', S({ what: 'content', who: 'learn', care: 'no', needs: 'members', look: 'template', budget: 'low' }), { ok: ['ghost', 'squarespace'], any: ['ghost'], never: ['hubspot'] }],
  ['Hobby blog, not technical, nothing to spend', S({ what: 'content', who: 'easy', care: 'no', look: 'template', budget: 'none' }), { ok: ['ghost', 'squarespace', 'wordpress'], never: ['hubspot', 'magento', 'drupal', 'sanity'] }],
  ['Developer’s own blog, self-hosted', S({ what: 'content', who: 'dev', care: 'yes', look: 'pixel', budget: 'none' }), { ok: ['ghost', 'wordpress', 'sanity'], never: ['magento', 'hubspot'] }],
  ['Online magazine in three languages, developer team', S({ what: 'content', who: 'dev', care: 'yes', lang: 'yes', look: 'pixel', budget: 'any' }), { ok: ['wordpress', 'drupal'], never: ['wix', 'squarespace', 'magento'] }],
  ['Local news site, agency-built, hosting handled', S({ what: 'content', who: 'agency', care: 'no', look: 'template', budget: 'mid' }), { ok: ['wordpress', 'ghost', 'webflow'], never: ['magento', 'hubspot'] }],
  // Stores
  ['Handmade shop, 40 products, not technical', S({ what: 'store', size: 'small', who: 'easy', care: 'no', look: 'template', budget: 'mid' }), { ok: ['shopify', 'squarespace', 'wix'], never: ['magento', 'bigcommerce', 'drupal'] }],
  ['Small shop, up to $25 a month, not technical', S({ what: 'store', size: 'small', who: 'easy', care: 'no', look: 'template', budget: 'low' }), { ok: ['squarespace', 'shopify', 'wix'], never: ['magento'] }],
  ['Clothing brand, 300 products, wants design control', S({ what: 'store', size: 'small', who: 'learn', care: 'no', look: 'visual', budget: 'mid' }), { ok: ['shopify', 'wix', 'squarespace'], never: ['magento'] }],
  ['Store in two languages, not technical', S({ what: 'store', size: 'small', who: 'easy', care: 'no', lang: 'yes', look: 'template', budget: 'mid' }), { ok: ['shopify', 'wix'], never: ['magento'] }],
  ['Store with a blog, happy to learn', S({ what: 'store', size: 'small', who: 'learn', care: 'no', needs: 'blog', look: 'template', budget: 'mid' }), { ok: ['shopify', 'squarespace', 'wix'], never: ['magento'] }],
  ['Electronics retailer, 3,000 products, happy to learn', S({ what: 'store', size: 'big', who: 'learn', care: 'no', look: 'template', budget: 'mid' }), { ok: ['shopify', 'bigcommerce'], never: ['squarespace', 'framer', 'webflow', 'magento'] }],
  ['Retailer with 10,000 products and a dev team', S({ what: 'store', size: 'big', who: 'dev', care: 'yes', look: 'pixel', budget: 'any' }), { ok: ['magento', 'shopify', 'bigcommerce', 'wordpress'], never: ['squarespace', 'framer', 'wix'] }],
  ['Wholesaler with trade accounts, not technical', S({ what: 'store', size: 'b2b', who: 'easy', care: 'no', look: 'template', budget: 'any' }), { ok: ['bigcommerce', 'shopify'], never: ['magento', 'framer'] }],
  ['Parts supplier, B2B, in-house developers', S({ what: 'store', size: 'b2b', who: 'dev', care: 'yes', look: 'template', budget: 'any' }), { ok: ['magento', 'bigcommerce', 'shopify'], never: ['framer', 'squarespace'] }],
  // Custom
  ['Mobile app and website from one content source, developers', S({ what: 'custom', who: 'dev', care: 'yes', look: 'pixel', budget: 'any' }), { ok: ['sanity'], any: ['sanity'], never: ['wix', 'squarespace'] }],
  ['Member portal, agency-built', S({ what: 'custom', who: 'agency', care: 'yes', needs: 'members', look: 'pixel', budget: 'any' }), { ok: ['wordpress', 'drupal', 'sanity'], never: ['squarespace', 'framer'] }],
  ['Multilingual custom site, developers, hosting handled', S({ what: 'custom', who: 'dev', care: 'no', lang: 'yes', look: 'pixel', budget: 'any' }), { ok: ['sanity', 'wordpress', 'drupal'], never: ['wix', 'squarespace'] }],
];

const ids = new Set(data.platforms.map((p) => p.id));
let agree = 0;
const misses = [];
for (const [name, a, want] of CASES) {
  const top = candidates(data, a).slice(0, 3), got = top.map((x) => x.p.id), why = [];
  if (!want.ok.includes(got[0])) why.push(`first is ${top[0].p.name}`);
  if (want.any && !want.any.some((id) => got.includes(id) || !ids.has(id))) why.push(`none of ${want.any.join(', ')} in the top three`);
  (want.never || []).forEach((id) => { if (got.includes(id)) why.push(`${top.find((x) => x.p.id === id).p.name} in the top three`); });
  if (why.length) misses.push(`${name}: ${why.join('; ')}  [${top.map((x) => x.p.name).join(', ')}]`); else agree++;
}
const drop = agree < BASELINE ? `, DOWN from ${BASELINE}: check what the change did to these` : '';
console.log(`Expert cases: ${agree} of ${CASES.length} agree with a consultant's picks (a report, never a failure${drop}).`);
misses.forEach((m) => console.log(`  differs: ${m}`));
