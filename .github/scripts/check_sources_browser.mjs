// Second pass of the source-link check, for help centres that refuse plain requests (Shopify, Webflow and Duda
// answer scripts with 403). check_sources.py writes the blocked addresses to blocked.json; this opens each one in
// a real browser (Playwright's Chromium, installed in .github/build) and reports the page it got:
//   ok       the page loaded (any status under 400 after redirects)
//   moved    it redirected to a different page (the new address is shown)
//   dead     404 or 410, or a page whose title says the article is gone
//   blocked  still refused, or a bot challenge: open it in a browser by hand
//   node check_sources_browser.mjs blocked.json       exits 1 if anything is dead
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(new URL('../build/package.json', import.meta.url));
const { chromium } = require('playwright');

const list = JSON.parse(fs.readFileSync(process.argv[2] || 'blocked.json', 'utf8'));
const same = (a, b) => { const n = (u) => { const x = new URL(u); return x.host.replace(/^www\./, '') + x.pathname.replace(/\/$/, ''); }; return n(a) === n(b); };
const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'en-GB', viewport: { width: 1280, height: 800 } });
const out = { ok: 0, moved: [], dead: [], blocked: [] };
for (const url of list) {
  const page = await ctx.newPage();
  try {
    const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);   // a bot challenge needs a moment to resolve or to show itself
    const status = r ? r.status() : 0, title = (await page.title()).trim();
    const gone = /not found|page doesn.t exist|no longer available|404/i.test(title);
    if (status === 404 || status === 410 || gone) out.dead.push([url, status, title]);
    else if (status >= 400 || /just a moment|access denied|attention required/i.test(title)) out.blocked.push([url, status, title]);
    else if (!same(url, page.url())) out.moved.push([url, page.url()]);
    else out.ok++;
  } catch (e) { out.blocked.push([url, 0, e.message.split('\n')[0]]); }
  await page.close();
}
await browser.close();
console.log(`Browser pass over ${list.length} refused links: ${out.ok} ok, ${out.dead.length} dead, ${out.moved.length} moved, ${out.blocked.length} still blocked.`);
for (const [u, s, t] of out.dead) console.log(`  DEAD ${s}  ${u}\n       title: ${t}`);
for (const [u, f] of out.moved) console.log(`  moved  ${u}\n       now: ${f}`);
// Still-blocked pages are whole help centres behind a bot challenge (Webflow and Duda show Cloudflare's "Just a
// moment" page), so they're counted per host; one line per page would bury a dead or moved link
const perHost = {};
for (const [u, s, t] of out.blocked) (perHost[new URL(u).host] ??= []).push(`${s}${/just a moment/i.test(t) ? ' bot challenge' : ''}`);
for (const [h, l] of Object.entries(perHost).sort()) console.log(`  blocked  ${h}: ${l.length} page(s) (${[...new Set(l)].join(', ')}); open one in a browser now and then`);
process.exit(out.dead.length ? 1 : 0);
