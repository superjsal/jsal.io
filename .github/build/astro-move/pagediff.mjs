// The browser half of the per-page test of the Astro move (compare.py is the markup half): loads a page from
// staging's files (the jsal-site preview, 8765, in the main checkout) and from the build (jsal-build, 8766) at 1280
// and 375px in light and dark, and compares every element's box, colour and font; it also opens the logo menu and
// records console errors, and screenshots the build. Run from PowerShell with the sandbox off (Edge).
//   node .github\build\astro-move\pagediff.mjs /privacy/ [screenshot folder, default the temp folder]
import { createRequire } from 'module';
import os from 'os';
// Playwright is installed in the main checkout's .github\build (worktrees have no node_modules)
const require = createRequire('C:/Users/JSAL/Desktop/jsal.io/.github/build/package.json');
const { chromium } = require('playwright');

const [path, out = os.tmpdir()] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'msedge' });
let diffs = 0;

async function snap(base, width, scheme, shot) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const boxes = await page.evaluate(() => [...document.body.querySelectorAll('*:not(script)')].map((e) => {
    const b = e.getBoundingClientRect(), s = getComputedStyle(e);
    return `${e.tagName}.${e.className.baseVal ?? e.className} ${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.width)},${Math.round(b.height)} ${s.color} ${s.backgroundColor} ${s.fontFamily.split(',')[0]} ${s.fontSize}`;
  }));
  if (shot) await page.screenshot({ path: `${out}/${shot}.png`, fullPage: false });
  // The logo opens its app menu (nav.js)
  await page.click('[data-jsal-nav]');
  await page.waitForTimeout(400);
  const menu = await page.evaluate(() => !!document.querySelector('.jsal-menu') && getComputedStyle(document.querySelector('.jsal-menu')).display !== 'none');
  await ctx.close();
  return { boxes, errors, menu };
}

for (const width of [1280, 375]) {
  for (const scheme of ['light', 'dark']) {
    const old = await snap('http://localhost:8765', width, scheme);
    const neu = await snap('http://127.0.0.1:8766', width, scheme, `${path.replace(/\W+/g, '') || 'home'}-${width}-${scheme}`);
    const n = Math.max(old.boxes.length, neu.boxes.length);
    const bad = [];
    for (let i = 0; i < n; i++) if (old.boxes[i] !== neu.boxes[i]) bad.push(`  old ${old.boxes[i]}\n  new ${neu.boxes[i]}`);
    diffs += bad.length;
    console.log(`${width}px ${scheme}: ${neu.boxes.length} elements, ${bad.length} differ; menu opens: old ${old.menu}, new ${neu.menu}; errors: ${neu.errors.join(' | ') || 'none'}`);
    if (bad.length) console.log(bad.slice(0, 5).join('\n'));
  }
}
await browser.close();
process.exit(diffs ? 1 : 0);
