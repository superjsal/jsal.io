// The changelog's parts of the site and how an entry is drawn, shared by the collection's schema
// (src/content.config.mjs), the Changelog page and the home page's Updates.

// Each part of the site in the home page's Updates order: its tag, the tool's address (the tag links there; Site has
// none) and its icon in site/img/icons/ (written by .github/brand/make-brand.py). A new tool goes here too.
export const SECTIONS = [
  { name: 'CMS Picker', href: '/cms-picker/', icon: 'cms-picker' },
  { name: 'Clean Paste', href: '/formatter/', icon: 'clean-paste' },
  { name: 'Image Resizer', href: '/image-resizer/', icon: 'image-resizer' },
  { name: 'Redirect Import', href: '/redirects/', icon: 'redirect-import' },
  { name: 'Off the clock', href: '/play/', icon: 'off-the-clock' },
  { name: 'Site', href: null, icon: 'jsal-io' },
];
export const section = (name) => SECTIONS.find((s) => s.name === name);

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// An entry's sentence as HTML: plain text with Markdown links ([Privacy](/privacy/)), the only markup entries use
export const sentence = (text) => escape(text).replace(LINK, (_, label, href) => `<a href="${href.replace(/"/g, '&quot;')}">${label}</a>`);

// "3 November 2026", as the page's date headings read
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const longDate = (iso) => { const [y, m, d] = iso.split('-'); return `${+d} ${MONTHS[+m - 1]} ${y}`; };

/** The collection's entries in file order (newest first), checked to be in that order. */
export function inOrder(collection) {
  const entries = [...collection].sort((a, b) => a.id.localeCompare(b.id)).map((e) => e.data);
  if (!entries.length) throw new Error('The changelog (src/content/changelog.json) has no entries: is it valid JSON?');
  entries.forEach((e, i) => {
    if (i && e.date > entries[i - 1].date) throw new Error(`The changelog isn't newest first: ${e.date} (${e.tag}) comes after ${entries[i - 1].date}`);
  });
  return entries;
}

/** Entries grouped by day, newest first: [[date, [entries]], …]. */
export const byDay = (entries) => entries.reduce((days, e) => {
  if (days.at(-1)?.[0] === e.date) days.at(-1)[1].push(e); else days.push([e.date, [e]]);
  return days;
}, []);
