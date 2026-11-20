// Takes the home page's pictures: each tool at work with its own example loaded, in the light and the dark theme,
// cut to the piece the home page shows, as site/img/home/<tool>-<piece>-<theme>.webp (ffmpeg makes the WebP).
//   node .github/build/home-shots.mjs [base address, default http://127.0.0.1:8766]
// Run it against the served build (jsal-build) after a tool's look changes, then look at each picture: the cuts
// are fixed rectangles of a 1200 x 760 window, so a tool whose layout moved needs its rectangle moved here too.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
let playwright;
try { playwright = createRequire(join(here, 'package.json'))('playwright'); }
catch { playwright = createRequire('C:/Users/JSAL/Desktop/jsal.io/.github/build/package.json')('playwright'); }
const base = process.argv[2] || 'http://127.0.0.1:8766';
const out = join(here, '..', '..', 'site', 'img', 'home');
const tmp = mkdtempSync(join(tmpdir(), 'home-shots-'));

// [tool, address, [piece, x, y, width, height]...] in CSS pixels of the 1200 x 760 window
const TOOLS = [
  ['ir', '/image-resizer/', ['work', 564, 111, 451, 524], ['sizes', 172, 111, 348, 73]],
  ['cp', '/formatter/', ['work', 505, 0, 509, 619], ['checks', 172, 67, 299, 227]],
  ['ri', '/redirects/', ['sheet', 172, 207, 495, 533], ['file', 684, 207, 331, 533]],
];
const browser = await playwright.chromium.launch({ channel: 'msedge' });
const save = (png, name) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-c:v', 'libwebp', '-quality', '86', join(out, `${name}.webp`)]);
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: 1.5, colorScheme: theme, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const [tool, path, ...pieces] of TOOLS) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.locator('button, a').filter({ hasText: /example/i }).first().click();
    await page.waitForTimeout(2500);
    await page.keyboard.press('Escape');   // the example's tour
    await page.waitForTimeout(400);
    for (const [piece, x, y, width, height] of pieces) {
      const png = join(tmp, `${tool}-${piece}-${theme}.png`);
      await page.screenshot({ path: png, clip: { x, y, width, height } });
      save(png, `${tool}-${piece}-${theme}`);
    }
  }
  // The CMS Picker's quiz box, whole, at the width it has on a small laptop
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto(base + '/cms-picker/', { waitUntil: 'networkidle' });
  const png = join(tmp, `cms-quiz-${theme}.png`);
  await page.locator('.qz').screenshot({ path: png });
  save(png, `cms-quiz-${theme}`);
  await ctx.close();
}
await browser.close();
rmSync(tmp, { recursive: true, force: true });
console.log('written to', out);
