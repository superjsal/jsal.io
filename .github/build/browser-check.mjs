// Browser checks for the public tools, with Playwright (npm ci in this folder installs it; node_modules isn't committed).
// Needs the local server on http://localhost:8765 (the jsal-site preview). Chromium runs on the installed Microsoft
// Edge (Playwright's own Chromium and Firefox builds don't start on this machine: Windows reports a missing
// runtime), so a browser that can't start is reported and skipped; Firefox is in manual-checks.md.
//   node site\.github\build\browser-check.mjs          axe on every public page (light and dark), then 375 and 390px in
//                                         Chromium, WebKit and Firefox: errors, sideways scroll, and each tool's
//                                         main flow (Clean Paste's example and Show; the resizer loading images)
//   node site\.github\build\browser-check.mjs --axe    only the axe part (quick; used by check.ps1 when the server is up)
// Exits 1 if axe finds a serious or critical problem or a page breaks.
import { chromium, webkit, firefox } from 'playwright';
import { createRequire } from 'module';
import fs from 'fs';

const BASE = 'http://localhost:8765';
const AXE = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const PAGES = ['/', '/cms-picker/', '/cms-picker/squarespace/', '/cms-picker/sanity/', '/privacy/', '/play/', '/changelog/', '/formatter/', '/image-resizer/', '/404.html'];   // two platform pages: a full one and a sparse one
const axeOnly = process.argv.includes('--axe');
let failed = 0;
const log = (s) => console.log(s);

// Small test images made in the page (a PNG with transparency, landscape, portrait, square)
async function testImages(page) {
  const list = await page.evaluate(async () => {
    const make = (w, h, n, alpha) => new Promise((r) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d');
      if (!alpha) { x.fillStyle = `hsl(${n * 80},60%,55%)`; x.fillRect(0, 0, w, h); }
      x.fillStyle = 'rgba(30,30,30,0.6)'; x.beginPath(); x.arc(w / 2, h / 2, Math.min(w, h) / 3, 0, 7); x.fill();
      c.toBlob(async (b) => r({ name: `test café ${n}.png`, data: [...new Uint8Array(await b.arrayBuffer())] }), 'image/png');
    });
    return Promise.all([[1600, 1200, 1, false], [800, 1200, 2, false], [1000, 1000, 3, true]].map(([w, h, n, a]) => make(w, h, n, a)));
  });
  return list.map((f) => ({ name: f.name, mimeType: 'image/png', buffer: Buffer.from(f.data) }));
}

async function axe(page, label) {
  await page.addScriptTag({ content: AXE });
  const r = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] })).violations
    .map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, where: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) })));
  const bad = r.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  failed += bad.length;
  log(`axe ${label}: ${r.length ? r.map((v) => `${v.impact} ${v.id} (${v.nodes}): ${v.help} @ ${v.where.join(' | ')}`).join('\n    ') : 'no problems'}`);
}

// Type rule (CLAUDE.md, "Type"): every visible H1 and H2 is Lora. Small interface labels (under 16px, like
// Clean Paste's "Checks") and the visitor's own text in Clean Paste's editor are Inter on purpose
async function headingFonts(page, label) {
  const bad = await page.evaluate(() => [...document.querySelectorAll('h1, h2')].filter((h) => {
    const cs = getComputedStyle(h);
    if (!h.getClientRects().length || cs.visibility === 'hidden' || h.closest('.sr-only, [hidden], #editor')) return false;
    return parseFloat(cs.fontSize) >= 16 && !/^"?Lora/.test(cs.fontFamily);
  }).map((h) => `${h.tagName} "${h.textContent.trim().slice(0, 40)}" (${getComputedStyle(h).fontFamily.split(',')[0]})`));
  failed += bad.length;
  if (bad.length) log(`type ${label}: headings not in Lora: ${bad.join('; ')}`);
}

// Clean Paste's Show on the bold-line check (or the first one): the line ends up on screen, its background changes
// to the gold wash within a second, and in one column the Back to checks button appears. Returns a problem or ''.
async function showCheck(page, narrow) {
  const texts = await page.$$eval('button.check', (bs) => bs.map((b) => b.textContent));
  if (!texts.length) return 'no Show button after the example';
  const i = Math.max(0, texts.findIndex((t) => /bold/i.test(t)));
  const before = await page.evaluate((i) => {
    const lines = [...document.querySelectorAll('#editor > p[data-bold]')];
    return lines.length ? getComputedStyle(lines[0]).backgroundColor : null;
  }, i);
  await page.locator('button.check').nth(i).click();
  try { await page.waitForSelector('#editor .locate', { timeout: 1500 }); } catch { return 'Show: no highlight within 1.5s'; }
  await page.waitForTimeout(150);
  const r = await page.evaluate(() => {
    const el = document.querySelector('#editor .locate'), b = el.getBoundingClientRect();
    return { bg: getComputedStyle(el).backgroundColor, inView: b.top >= 0 && b.bottom <= innerHeight,
      back: !document.querySelector('#backToChecks').hidden, said: document.querySelector('#checkSay').textContent };
  });
  const problems = [];
  if (/rgba\(0, 0, 0, 0\)|transparent/.test(r.bg) || r.bg === before) problems.push(`the line's background didn't change (${r.bg})`);
  if (!r.inView) problems.push('the line is not on screen');
  if (!r.said) problems.push('nothing announced');
  if (narrow && !r.back) problems.push('no Back to checks button');
  if (!narrow && r.back) problems.push('Back to checks shows on desktop');
  if (narrow && r.back) {
    await page.click('#backToChecks');
    await page.waitForTimeout(900);
    const ok = await page.evaluate(() => { const c = document.querySelector('#checks').getBoundingClientRect(); return c.top < innerHeight && c.bottom > 0; });
    if (!ok) problems.push('Back to checks did not bring the checks into view');
  }
  return problems.length ? `Show: ${problems.join(', ')}` : '';
}

// --- axe: every page, light and dark, plus each tool with content in it
let axeBrowser = null;
try { axeBrowser = await chromium.launch({ channel: 'msedge' }); }
catch (e) { log(`axe: couldn't start Edge here (${e.message.split('\n')[0]}); skipped`); }
if (axeBrowser) {
  const browser = axeBrowser;
  for (const scheme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: scheme });
    for (const path of PAGES) {
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);   // let entrance animations settle
      await axe(page, `${path} ${scheme}`);
      if (scheme === 'light') await headingFonts(page, path);
    }
    await page.goto(BASE + '/formatter/', { waitUntil: 'networkidle' });
    await page.click('#sampleBtn');
    await page.waitForTimeout(400);
    await axe(page, `/formatter/ with the example ${scheme}`);
    if (scheme === 'light') await headingFonts(page, '/formatter/ with the example');
    const show = await showCheck(page, false);
    if (show) failed++;
    log(`Clean Paste Show, desktop ${scheme}: ${show || 'the line is on screen and highlighted'}`);
    await page.goto(BASE + '/image-resizer/', { waitUntil: 'networkidle' });
    await page.setInputFiles('#file', await testImages(page));
    await page.waitForSelector('.preview-item');
    await page.waitForTimeout(400);
    await axe(page, `/image-resizer/ with images ${scheme}`);
    await page.close();
  }
  await browser.close();
}

// --- 375 and 390px in three engines
if (!axeOnly) {
  for (const [name, type, opts] of [['chromium (Edge)', chromium, { channel: 'msedge' }], ['webkit', webkit, {}], ['firefox', firefox, {}]]) {
    let browser;
    try { browser = await type.launch(opts); } catch (e) { log(`${name}: couldn't start here (${e.message.split('\n')[0]}); check it by hand`); continue; }
    for (const width of [375, 390]) {
      const ctx = await browser.newContext({ viewport: { width, height: 800 }, hasTouch: true, isMobile: !name.startsWith('firefox'), colorScheme: width === 375 ? 'light' : 'dark' });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error' && !/favicon|googletagmanager|gtag/.test(m.text())) errors.push(m.text()); });
      const notes = [];
      const overflow = async () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      for (const path of PAGES) {
        await page.goto(BASE + path, { waitUntil: 'networkidle' });
        const o = await overflow();
        if (o > 0) notes.push(`${path} scrolls sideways by ${o}px`);
      }
      // Clean Paste: the example, a check's Show, the copy note area
      await page.goto(BASE + '/formatter/', { waitUntil: 'networkidle' });
      await page.click('#sampleBtn');
      await page.waitForSelector('.app.has-content');
      const show = await showCheck(page, true);
      if (show) { failed++; notes.push(`Clean Paste ${show}`); } else notes.push('Clean Paste Show ok');
      if ((await overflow()) > 0) notes.push('Clean Paste with content scrolls sideways');
      const touchPaste = await page.evaluate(() => document.querySelector('#pasteZone').isContentEditable);
      // Image Resizer: load images, see the cards, and the file names keep their accents
      await page.goto(BASE + '/image-resizer/', { waitUntil: 'networkidle' });
      await page.setInputFiles('#file', await testImages(page));
      try {
        await page.waitForSelector('.preview-item', { timeout: 15000 });
        const names = await page.$$eval('.filename-edit', (els) => els.map((e) => e.value));
        if (!names.some((n) => n.includes('café'))) notes.push(`resizer: accents lost in file names (${names.join(', ')})`);
        const status = await page.textContent('#statusText');
        notes.push(`resizer status: "${status}"`);
      } catch { notes.push('resizer: images did not load'); }
      if ((await overflow()) > 0) notes.push('resizer with images scrolls sideways');
      const folderShown = await page.evaluate(() => !document.querySelector('[data-dest="folder"]').hidden);
      notes.push(`folder button ${folderShown ? 'shown' : 'hidden'}; touch paste area ${touchPaste ? 'on' : 'off'}`);
      if (errors.length) { failed++; notes.push(`ERRORS: ${[...new Set(errors)].join(' | ')}`); }
      log(`${name} ${width}px: ${notes.join('; ')}`);
      await ctx.close();
    }
    await browser.close();
  }

  // --- A very long document in Clean Paste (Chromium): how long the clean and the checks take
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  await page.goto(BASE + '/formatter/', { waitUntil: 'networkidle' });
  const ms = await page.evaluate(async () => {
    const para = '<p class=MsoNormal style="margin:0;font-family:Calibri"><span style="font-size:11pt">Lorem ipsum dolor sit amet, <b>consectetur</b> adipiscing elit, sed do eiusmod tempor <a href="https://example.com">incididunt</a> ut labore.</span></p>';
    const html = Array.from({ length: 3000 }, (_, i) => (i % 40 === 0 ? `<h2>Section ${i / 40}</h2>` : para)).join('');
    const dt = new DataTransfer();
    dt.setData('text/html', html); dt.setData('text/plain', 'x');
    const t = performance.now();
    document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r)));
    return Math.round(performance.now() - t);
  });
  log(`Clean Paste, a 3,000-paragraph Word paste (about 120,000 words): cleaned and checked in ${ms} ms`);
  await browser.close();
}
log(failed ? `${failed} problem(s)` : 'All browser checks passed');
process.exit(failed ? 1 : 0);
