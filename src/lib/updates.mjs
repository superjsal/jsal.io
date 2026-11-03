// Updates on the home page, read from the changelog as the page builds, so a change is described once.
// A changelog entry meant to lead its section on the home page carries a short line on its <li>:
//   <li data-short="Saves PNG, with transparency"><span class="log-name">...
// For each section this takes the newest entry with a data-short and its date, and the home page shows the SHOWN most
// recent of them (newest first, SECTIONS order breaking a tie). A missing section, a stray tag or an entry above the
// first date stops the build; a line over MAX_CHARS (about one row at 1024px) is a warning in the build log.
import fs from 'node:fs';
import path from 'node:path';

// Still the served page in the public folder; it moves to src/ last, with the Changelog page
const CHANGELOG = path.resolve('site/changelog/index.html');
const MAX_CHARS = 40;
const SHOWN = 3;
// Home page sections in order: the changelog tag (the log-name text). A new tool goes here too
export const SECTIONS = ['CMS Picker', 'Clean Paste', 'Image Resizer', 'Redirect Import', 'Off the clock', 'Site'];
// Each section's icon in site/img/icons/ (written by .github/brand/make-brand.py); a new section needs one there too
const ICONS = {
  'CMS Picker': 'cms-picker', 'Clean Paste': 'clean-paste', 'Image Resizer': 'image-resizer',
  'Redirect Import': 'redirect-import', 'Off the clock': 'off-the-clock', Site: 'jsal-io',
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Every changelog <li> with a data-short, as { tag, date, short } (short as written: HTML), newest first. */
function entries() {
  const out = [];
  let date = null;
  for (const line of fs.readFileSync(CHANGELOG, 'utf8').split(/\r?\n/)) {
    const h = line.match(/<h2>\s*<time datetime="(\d{4}-\d\d-\d\d)"/);
    if (h) date = h[1];
    const li = line.match(/<li\b([^>]*)>/);
    if (!li) continue;
    const short = li[1].match(/\bdata-short="([^"]*)"/);
    if (!short) continue;
    const tag = line.match(/<span class="log-name">(?:<a [^>]*>)?([^<]+)/);
    out.push({ tag: tag ? tag[1].trim() : '?', date, short: short[1] });
  }
  // Array sort is stable, so file order breaks a tie
  return out.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

const unescape = (s) => s.replace(/&(amp|lt|gt|quot|#39|apos);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'" })[e]);

/** The rows Updates shows: { section, icon, date, label, short }. Throws on a changelog the home page can't use. */
export function updates() {
  const found = entries();
  const problems = [];
  const tags = new Set(found.map((e) => e.tag));
  for (const name of SECTIONS) if (!tags.has(name)) problems.push(`no entry tagged ${name} has a data-short line, so Updates has nothing for that section`);
  for (const tag of [...tags].filter((t) => !SECTIONS.includes(t)).sort()) problems.push(`a data-short on an entry tagged "${tag}", which is not a home page section (add it to SECTIONS in src/lib/updates.mjs)`);
  for (const e of found) if (!e.date) problems.push(`the ${e.tag} entry "${e.short}" is above the first date heading`);
  if (problems.length) throw new Error(`The changelog (site/changelog/index.html):\n  - ${problems.join('\n  - ')}`);

  const latest = SECTIONS.map((name) => found.find((e) => e.tag === name));
  for (const e of latest) {
    const n = unescape(e.short).length;
    if (n > MAX_CHARS) console.warn(`[updates] Note: the ${e.tag} line "${e.short}" is ${n} characters; keep Updates lines to about ${MAX_CHARS} so each fits one row at 1024px`);
  }
  return latest
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, SHOWN)
    .map((e) => {
      const [, m, d] = e.date.split('-');
      return { section: e.tag.toLowerCase().replace(/ /g, '-'), icon: `/img/icons/${ICONS[e.tag]}.svg`, name: e.tag, date: e.date, label: `${MONTHS[+m - 1]} ${+d}`, short: e.short };
    });
}
