// Makes the sample files for the user tests in .github\docs\test-files (run once; rerun to remake them):
// a Word-style HTML document (Clean Paste's own example, which is real Word clipboard markup) and five test
// images of different sizes and orientations, one a PNG with transparency. A HEIC can't be made here: testers
// use an iPhone photo (the script says so).
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));   // site\.github\build

const OUT = path.resolve(HERE, '..', 'docs', 'test-files');
fs.mkdirSync(OUT, { recursive: true });

const sample = fs.readFileSync(path.resolve(HERE, '..', '..', 'formatter', 'js', 'sample.js'), 'utf8').match(/`([\s\S]*)`/)[1];
fs.writeFileSync(path.join(OUT, 'messy-word-post.html'), sample);

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage();
const images = [
  ['beach-landscape.jpg', 4000, 3000, 'jpeg', 18],
  ['portrait-person.jpg', 3000, 4000, 'jpeg', 200],
  ['square-product.jpg', 1080, 1080, 'jpeg', 330],
  ['small-logo-transparent.png', 600, 400, 'png', 45],
  ['tiny-thumbnail.jpg', 400, 300, 'jpeg', 120],
];
for (const [name, w, h, type, hue] of images) {
  const data = await page.evaluate(([w, h, type, hue]) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    if (type === 'jpeg') {
      const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, `hsl(${hue},70%,75%)`); g.addColorStop(1, `hsl(${hue + 40},60%,35%)`);
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = `hsl(${hue + 180},60%,60%)`;
      x.beginPath(); x.arc(w * 0.7, h * 0.35, Math.min(w, h) * 0.12, 0, 7); x.fill();   // something to keep in the crop
    } else {
      x.fillStyle = `hsl(${hue},80%,45%)`;
      x.beginPath(); x.arc(w / 2, h / 2, h * 0.4, 0, 7); x.fill();   // a logo on a transparent background
    }
    x.fillStyle = 'rgba(0,0,0,0.75)'; x.font = `bold ${Math.round(h / 12)}px sans-serif`;
    x.fillText(`${w} × ${h}`, w * 0.06, h * 0.9);
    return c.toDataURL(`image/${type}`, 0.85).split(',')[1];
  }, [w, h, type, hue]);
  fs.writeFileSync(path.join(OUT, name), Buffer.from(data, 'base64'));
}
await browser.close();
console.log(fs.readdirSync(OUT).map((f) => `${f} ${Math.round(fs.statSync(path.join(OUT, f)).size / 1024)} KB`).join('\n'));
