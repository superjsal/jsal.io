// Takes the home page's pictures: each tool at work with its own example loaded, in the light and the dark theme,
// cut to the pieces the home page shows, as site/img/home/<tool>-<piece>[-s<n>]-<theme>.webp (ffmpeg makes the WebP).
// The pictures work on the home page: a control in a picture (a size, the Text | HTML switch, a filter) shows the
// tool as it looks with that control pressed. So each tool is taken once per state, and where each control sits in
// its picture is written to src/data/home-spots.json, as shares of the picture.
//   node .github/build/home-shots.mjs [base address, default http://127.0.0.1:8766]
// Run it against the served build (jsal-build) after a tool's look changes, then look at each picture: the cuts
// are fixed rectangles of a 1200 x 760 window, so a tool whose layout moved needs its rectangle moved here too.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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

// Each tool: its address, its pieces ([name, x, y, width, height] in CSS pixels of the 1200 x 760 window), the
// pieces that change with a control (vary), and the controls: [the button's words, what a press shows].
const TOOLS = [
  { id: 'ir', path: '/image-resizer/', pieces: [['work', 564, 111, 451, 524], ['sizes', 172, 111, 348, 73]], vary: ['work', 'sizes'],
    controls: [[/1200\s*×\s*628/, 'Show the crop at 1200 × 628'], [/640\s*×\s*420/, 'Show the crop at 640 × 420'], [/Original/, 'Show the image at its own size']] },
  { id: 'cp', path: '/formatter/', pieces: [['work', 505, 0, 509, 619], ['checks', 172, 67, 299, 227]], vary: ['work'],
    controls: [[/^\s*Text\s*$/, 'Show the post as text'], [/^\s*HTML\s*$/, 'Show the post as HTML']] },
  { id: 'ri', path: '/redirects/', pieces: [['sheet', 172, 207, 495, 533], ['file', 684, 207, 331, 533]], vary: ['sheet'],
    controls: [[/^\s*All\s*\d+\s*$/, 'Show every row'], [/^\s*Ready\s*\d+\s*$/, 'Show the rows that are ready'], [/^\s*Check\s*\d+\s*$/, 'Show the rows to check'], [/^\s*Needs you\s*\d+\s*$/, 'Show the rows that need you'], [/^\s*Left out\s*\d+\s*$/, 'Show the rows left out']] },
];
const browser = await playwright.chromium.launch({ channel: 'msedge' });
const save = (png, name) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-c:v', 'libwebp', '-quality', '86', join(out, `${name}.webp`)]);
const share = (n, of) => +(n / of * 100).toFixed(2);
const spots = {};
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: 1.5, colorScheme: theme, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const t of TOOLS) {
    await page.goto(base + t.path, { waitUntil: 'networkidle' });
    await page.locator('button, a').filter({ hasText: /example/i }).first().click();
    await page.waitForTimeout(2500);
    await page.keyboard.press('Escape');   // the example's tour
    await page.waitForTimeout(400);
    const buttons = t.controls.map(([words]) => page.locator('button, [role=tab]').filter({ hasText: words }).first());
    if (theme === 'light') {
      spots[t.id] = { vary: t.vary, states: t.controls.length, spots: [] };
      for (const [i, button] of buttons.entries()) {
        const b = await button.boundingBox();
        const piece = t.pieces.find(([, x, y, w, h]) => b.x >= x && b.y >= y && b.x + b.width <= x + w && b.y + b.height <= y + h);
        if (!piece) throw new Error(`${t.id}: the control "${t.controls[i][1]}" isn't inside any piece`);
        const [name, x, y, w, h] = piece;
        spots[t.id].spots.push({ piece: name, state: i, label: t.controls[i][1], x: share(b.x - x, w), y: share(b.y - y, h), w: share(b.width, w), h: share(b.height, h) });
      }
    }
    for (const [i, button] of buttons.entries()) {
      await button.click();
      await page.mouse.move(2, 2);   // off the button, so no hover shows
      await page.waitForTimeout(700);
      for (const [piece, x, y, width, height] of t.pieces) {
        if (i && !t.vary.includes(piece)) continue;
        const name = `${t.id}-${piece}${i ? `-s${i}` : ''}-${theme}`;
        const png = join(tmp, `${name}.png`);
        await page.screenshot({ path: png, clip: { x, y, width, height } });
        save(png, name);
      }
    }
  }
  // The CMS Picker's quiz box, whole, at the width it has on a small laptop. Its four answers are links on the home
  // page, each starting the quiz with that answer given.
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto(base + '/cms-picker/', { waitUntil: 'networkidle' });
  const quiz = page.locator('.qz');
  const png = join(tmp, `cms-quiz-${theme}.png`);
  await quiz.screenshot({ path: png });
  save(png, `cms-quiz-${theme}`);
  if (theme === 'light') {
    const q = await quiz.boundingBox();
    const answers = await page.locator('.qz .qz-opt').all();
    const ids = ['site', 'store', 'content', 'custom'];   // the first question's answers, in the quiz's order
    if (answers.length !== ids.length) throw new Error(`the quiz's first question has ${answers.length} answers, not ${ids.length}`);
    spots.cms = { vary: [], states: 1, spots: [] };
    for (const [i, answer] of answers.entries()) {
      const b = await answer.boundingBox(), words = (await answer.locator('b, strong, span').first().textContent().catch(() => '')) || (await answer.textContent());
      spots.cms.spots.push({ piece: 'quiz', href: `/cms-picker/#quiz?v=6&what=${ids[i]}`, label: `Start the quiz with: ${words.trim()}`, x: share(b.x - q.x, q.width), y: share(b.y - q.y, q.height), w: share(b.width, q.width), h: share(b.height, q.height) });
    }
  }
  await ctx.close();
}
await browser.close();
rmSync(tmp, { recursive: true, force: true });
writeFileSync(join(here, '..', '..', 'src', 'data', 'home-spots.json'), JSON.stringify(spots, null, 1) + '\n');
console.log('written to', out, 'and src/data/home-spots.json');
