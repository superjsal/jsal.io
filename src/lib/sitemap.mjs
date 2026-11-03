// The sitemap, written from the built pages at the end of every build (astro.config.mjs runs this): every page with a
// canonical address and no noindex is listed, so a new page is in it without a line to add. Each page's lastmod is the
// last time it changed for a visitor, from what the site already records: the publish's dates file for the CMS
// Picker's pages, the newest changelog entry about a page (its tool's tag, or a link to it; the home page shows the
// newest of all in Updates), and a date a page shows itself (<time data-updated>). A page with none of these has no
// lastmod, which a sitemap allows.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTIONS } from './changelog.mjs';

const json = (file) => JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.join(dir, e.name)] : []));

/** The newest of the dates that say when the page at this address last changed, or undefined. */
function lastmod(address, html, entries, dates) {
  const at = new URL(address).pathname;
  const tag = SECTIONS.find((s) => s.href === at)?.name;
  const picker = at.match(/^\/cms-picker\/(?:([a-z0-9-]+)\/)?$/);
  return [
    at === '/' && entries[0]?.date,
    tag && entries.find((e) => e.tag === tag)?.date,
    entries.find((e) => e.text.includes(`](${at})`))?.date,
    picker && dates[picker[1] || 'cms-picker']?.date,
    html.match(/<time\b[^>]*\bdata-updated\b[^>]*\bdatetime="(\d{4}-\d{2}-\d{2})"/)?.[1],
  ].filter(Boolean).sort().at(-1);
}

function write(dir) {
  const entries = json('src/content/changelog.json');   // newest first; the build has already checked it
  const dates = json('src/data/cms-picker-dates.json');
  const pages = [];
  for (const file of walk(dir)) {
    const html = fs.readFileSync(file, 'utf8');
    const address = html.match(/<link rel="canonical" href="(https:\/\/jsal\.io\/[^"]*)">/)?.[1];
    if (!address || /<meta name="robots" content="[^"]*noindex/.test(html)) continue;
    pages.push([address, lastmod(address, html, entries, dates)]);
  }
  pages.sort(([a], [b]) => a.localeCompare(b));
  const urls = pages.map(([loc, mod]) => `  <url><loc>${loc}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ''}</url>\n`);
  fs.writeFileSync(path.join(dir, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join('') + '</urlset>\n');
  return pages.length;
}

export default function sitemap() {
  return {
    name: 'jsal-sitemap',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        logger.info(`sitemap written (${write(fileURLToPath(dir))} pages)`);
      },
    },
  };
}
