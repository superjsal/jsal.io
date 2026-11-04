// The CMS Picker's pages from its published data (site/cms-picker/data.json, written nightly by the publish):
// the plain-HTML copy inside the CMS Picker page, and one page per platform. app.js draws the cards, the table and
// the hero from the same data on load; the copy is for crawlers that don't run JavaScript (most AI search bots), so
// keep its markup in step with renderCards(), render() and the hero code in site/cms-picker/app.js.
// Each page's "last changed" date comes from src/data/cms-picker-dates.json, which the publish moves on only when
// that page's data changed, so a rebuild never re-dates a page.
import fs from 'node:fs';
import path from 'node:path';

const SITE = path.resolve('site');
export const data = JSON.parse(fs.readFileSync(path.join(SITE, 'cms-picker', 'data.json'), 'utf8'));
export const dates = JSON.parse(fs.readFileSync(path.resolve('src', 'data', 'cms-picker-dates.json'), 'utf8'));

// As Python's html.escape(…, quote=True), so the pages read exactly as the publish once wrote them
export const e = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

const SHORT = { yes: 'Built in', auto: 'Automatic', plugin: 'Plugin/app', code: 'Needs code', hosting: 'Hosting/DNS',
  check: 'Unclear', indirect: 'Indirectly', no: 'Not possible' };
const SCOPE = { V: 'varies', C: 'not verified' };   // only the exceptions are marked
const BADGE = { magento: 'M', duda: 'D', headless: '{ }' };
const DEFAULT_COMPARE = ['wordpress', 'shopify', 'wix', 'squarespace'];
const GENERIC = /^(yes|no|check|automatic|built in)$|^yes, with (an? )?(seo |redirect )?(plugin|module|extension|app|custom code)$/i;
const generic = (mark) => GENERIC.test(mark.trim());

const logo = (p) => p.logo
  ? `<span class="logo" style="--logo: url(&quot;${e(p.logo)}&quot;)" aria-hidden="true"></span>`
  : `<span class="logo badge" aria-hidden="true">${e(BADGE[p.id] ?? p.name[0])}</span>`;

// ── The plain-HTML copy in the CMS Picker page ──
export function picker(d = data) {
  const plats = d.platforms;
  const cards = [];
  for (const p of plats) {
    const pr = p.profile;
    if (!pr) continue;
    const c = [`<article class="card"><div class="ctop">${logo(p)}<h3>${e(p.name)}</h3></div>`, `<p class="ptype">${e(pr.type)}</p>`];
    if (pr.summary) c.push(`<p class="summary">${e(pr.summary)}</p>`);
    if (pr.tags?.length) c.push('<div class="ktags" role="group" aria-label="Known for">' + pr.tags.map((t) => `<span class="ktag">${e(t)}</span>`).join('') + '</div>');
    if (pr.aiTags?.length) c.push('<div class="aitags"><span class="ailabel">AI</span>' + pr.aiTags.map((t) => `<span class="aitag">${e(t)}</span>`).join('') + '</div>');
    const facts = [['Hosting and updates', pr.hosting, 'r-host'], ['If you leave', pr.export, 'r-exit'], ['Not ideal if', pr.lessSuited, 'r-skip']];
    const run = facts.filter(([, v]) => v && v.length).map(([t, v, cls]) => `<div class="${cls}"><dt>${t}</dt><dd>`
      + (typeof v === 'string' ? [v] : v).map((x) => `<span>${e(x)}</span>`).join('') + '</dd></div>').join('');
    if (run) c.push(`<dl class="run">${run}</dl>`);
    const on = DEFAULT_COMPARE.includes(p.id);
    c.push(`<div class="cfoot"><button class="chip cmp" type="button" aria-pressed="${on}">`
      + `${on ? '✓ Comparing' : '+ Add to compare'}</button>`
      + `<a class="cseo" href="${e(p.id)}/" data-track="platform_page_open" data-track-platform="${e(p.id)}" data-track-from="card" aria-label="${e(p.name)} SEO settings, and where to find each one">SEO settings<span aria-hidden="true"> →</span></a></div></article>`);
    cards.push(c.join(''));
  }

  // The table: every platform (the live page starts with four), with notes, so nothing is left out
  const rows = ['<div class="row head"><div class="item">Can you…</div>' + plats.map((p) =>
    `<div class="hcell"><span class="pname">${e(p.name)}</span>`
    + (p.profile ? `<span class="htype">${e(p.profile.type)}</span>` : '') + '</div>').join('') + '</div>'];
  const groups = Object.fromEntries((d.groups ?? []).map((g) => [g.id, g]));
  let last = null;
  for (const it of d.items) {
    if (it.group !== last && groups[it.group]) rows.push(`<div class="row group"><span>${e(groups[it.group].title)}</span></div>`);
    last = it.group;
    const cells = plats.map((p) => {
      const a = d.answers[p.id][it.id];
      const word = SCOPE[a.scope];
      let line = `<span class="tag ${e(a.verdict)}">${e(SHORT[a.verdict] ?? a.verdict)}</span>`;
      // as app.js draws it: "varies" a "*" beside the tag (the word for screen readers), "not verified" in words
      if (a.scope === 'V') line += `<span class="sc sc-mark"><span aria-hidden="true">*</span><span class="sr-only">${word}</span></span>`;
      else if (word) line += `<span class="sc">${word}</span>`;
      const mark = a.mark && !generic(a.mark) ? `<span class="mark">${e(a.mark)}</span>` : '';
      const where = a.where ? `<span class="where">Where: ${e(a.where)}</span>` : '';
      const words = a.scope in SCOPE && a.scope !== 'V' ? ' words' : '';
      return `<div class="cell"><span class="plat">${e(p.name)}</span><span class="line${words}">${line}</span>${mark}${where}</div>`;
    });
    const term = it.term ? `<small class="term">${e(it.term)}</small>` : '';
    rows.push(`<div class="row"><div class="item">${e(it.label)}${term}</div>${cells.join('')}</div>`);
  }

  return {
    cards: cards.join('\n'),
    // Its own .grid sized for every platform (the outer one is sized by app.js for the ones it shows)
    grid: `<div class="grid" style="--n: ${plats.length}">` + rows.join('\n') + '</div>',
    count: String(plats.length),
    asof: e(d.asOf ?? ''),
    // The platform pages, as logo chips under the table
    seoChips: plats.filter((p) => p.profile).map((p) => `<a class="seo-chip" href="${e(p.id)}/" data-track="platform_page_open" data-track-platform="${e(p.id)}" data-track-from="chips">${logo(p)}${e(p.name)}<span class="sr-only"> SEO settings</span></a>`).join(''),
  };
}

// ── Platform pages: /cms-picker/<platform>/ ──
// Each answers the SEO rows for one platform, with where to find each setting and the docs it was checked against,
// then a short profile.
const SEO_ROWS = ['meta_title', 'urls', 'gsc404', 'schema', 'noindex', 'ai_crawlers'];
const BUILT_ROWS = ['blog', 'members', 'store', 'languages', 'forms', 'design'];   // the Everyday rows, in the table's order
// Each SEO row as a heading, worded the way people search for it (the table's label is a "Can you…" question)
const SEO_HEAD = { meta_title: 'Change the title and description in Google', urls: 'Choose page addresses (URLs)',
  gsc404: 'Redirect old links (301s)', schema: 'Add structured data (schema)',
  noindex: 'Hide a page from search (noindex)', ai_crawlers: 'Allow or block AI crawlers' };
// Who each page is about, for its structured data: the official site and, where Wikidata has a clear item, that
// item, so search engines know which "Squarespace" is meant. Framer, Duda and Square Online have no reliable item
// (Weebly's is another product), so site only; BigCommerce's company item is now "Commerce.com", so it's the
// platform's own item.
const ENTITY = {
  wordpress: ['https://wordpress.org/', 'Q13166'], shopify: ['https://www.shopify.com/', 'Q7501150'],
  wix: ['https://www.wix.com/', 'Q420506'], squarespace: ['https://www.squarespace.com/', 'Q7582097'],
  webflow: ['https://webflow.com/', 'Q20160951'], framer: ['https://www.framer.com/', null],
  hubspot: ['https://www.hubspot.com/', 'Q5926631'], bigcommerce: ['https://www.bigcommerce.com/', 'Q141009518'],
  magento: ['https://business.adobe.com/products/magento/magento-commerce.html', 'Q1884012'],
  drupal: ['https://www.drupal.org/', 'Q170855'], duda: ['https://www.duda.co/', null],
  ghost: ['https://ghost.org/', 'Q16251204'], sanity: ['https://www.sanity.io/', 'Q56242360'],
  square: ['https://squareup.com/us/en/online-store', null], substack: ['https://substack.com/', 'Q63435709'],
};
// As Python's urllib.parse.quote: only letters, digits, _.-~ and / stay as they are
const quote = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()).replace(/%2F/g, '/');
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
const month = (iso) => {
  const t = /^\d{4}-\d{2}-\d{2}$/.test(iso ?? '') && new Date(iso + 'T00:00:00Z');
  return t && !isNaN(t) ? t.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
};

export const platformIds = (d = data) => d.platforms.filter((p) => p.profile).map((p) => p.id);

export function platform(pid, d = data) {
  const items = Object.fromEntries(d.items.map((i) => [i.id, i]));
  const plats = d.platforms.filter((p) => p.profile);
  const p = plats.find((x) => x.id === pid);
  const { name, profile: pr } = p;
  const ans = d.answers[pid];
  const tag = (a) => `<span class="tag ${e(a.verdict)}">${e(SHORT[a.verdict] ?? d.verdicts[a.verdict] ?? a.verdict)}</span>`
    + (a.scope in SCOPE ? `<span class="sc">${SCOPE[a.scope]}</span>` : '');
  const note = (a, cls = 'pp-note') => a.mark && !generic(a.mark) ? `<span class="${cls}">${e(a.mark)}</span>` : '';
  const sep = '<span class="pp-sep"><span aria-hidden="true">→</span><span class="sr-only">, then</span></span>';
  // "A → B; blog posts: C → D" is one line of steps per part, with its label
  const paths = (where) => where.split('; ').map((part) => {
    const m = part.match(/^([^:→]{2,40}): (.*)$/);
    const [label, rest] = m ? [m[1], m[2]] : ['', part];
    const steps = rest.split('→').map((s) => `<span class="pp-step">${e(s.trim())}</span>`).join(sep);
    return `<p class="pp-path">${label ? `<span class="pp-path-l">${e(label)}:</span>` : ''}${steps}</p>`;
  }).join('');

  const rows = SEO_ROWS.filter((r) => r in ans && r in items);
  const questions = rows.map((r) => {
    const a = ans[r];
    const where = a.where ? `<div class="pp-where"><span class="pp-where-l">Where</span><div>${paths(a.where)}</div></div>` : '';
    // Named by its site, as a source can be a plugin's docs rather than the platform's (Yoast's for WordPress)
    const src = a.sourceUrl ? `<a class="pp-src" href="${e(a.sourceUrl)}" target="_blank" rel="noopener" data-track="docs_click" data-track-platform="${pid}" data-track-question="${r}">Source: ${e(host(a.sourceUrl))}`
      + '<span aria-hidden="true"> ↗</span><span class="sr-only"> (opens in a new tab)</span></a>' : '';
    return `        <article class="pp-q" id="${r}"><h3>${e(SEO_HEAD[r] ?? items[r].label)}</h3>`
      + `<div class="pp-ans">${tag(a)}${note(a)}</div>${where}${src}</article>`;
  });
  const cost = ans.cost_site;
  const costText = cost ? (cost.mark || d.verdicts[cost.verdict] || '') : '';
  const facts = [['Type', pr.type], ['Starts at', costText], ['Hosting and updates', pr.hosting], ['If you leave', pr.export]];
  const fit = [['A good fit for', 'goodFit'], ['Not ideal if', 'lessSuited']].filter(([, k]) => pr[k]?.length)
    .map(([t, k]) => `<div><h3>${t}</h3><ul>` + pr[k].map((x) => `<li>${e(x)}</li>`).join('') + '</ul></div>').join('');
  const built = BUILT_ROWS.filter((r) => r in ans && r in items)
    .map((r) => `        <li><span>${e(items[r].label)}</span><span>${tag(ans[r])}</span>${note(ans[r]) || '<span></span>'}</li>`);
  const checked = rows.map((r) => ans[r].lastVerified ?? '').reduce((a, b) => (b > a ? b : a), '') || d.asOf || '';
  // Menu paths are promised only when every setting there is to find has one: an automatic answer or a "no" has none
  const hasWhere = rows.filter((r) => !['auto', 'no'].includes(ans[r].verdict)).every((r) => ans[r].where);
  const desc = `${name} SEO answered: titles, URLs, redirects, schema, noindex and AI crawlers, `
    + `${hasWhere ? 'each with where to find the setting' : 'and what each takes'}, checked against official docs.`;
  const url = `https://jsal.io/cms-picker/${pid}/`;
  // A plain Thing (not SoftwareApplication or Organization), so it can't set off Google's rich-result checks
  const [site, qid] = ENTITY[pid] ?? [null, null];
  const ld = { '@context': 'https://schema.org', '@type': 'WebPage', name: `${name} SEO: What You Can Change, and Where`,
    url, description: desc, inLanguage: 'en', dateModified: dates[pid]?.date,
    about: { '@type': 'Thing', name, ...(site ? { url: site } : {}), ...(qid ? { sameAs: `https://www.wikidata.org/wiki/${qid}` } : {}) },
    author: { '@type': 'Person', '@id': 'https://jsal.io/#john', name: 'John Salvador', url: 'https://jsal.io/' },
    isPartOf: { '@id': 'https://jsal.io/#website' },   // the WebSite node on the home page
    breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'CMS Picker', item: 'https://jsal.io/cms-picker/' },
      { '@type': 'ListItem', position: 2, name, item: url }] } };
  // Its own share image once made; until then the CMS Picker's
  const ownOg = fs.existsSync(path.join(SITE, 'og', `cms-picker-${pid}.png`));
  const meta = [month(checked) ? `Answers checked ${month(checked)}` : '', pr.type ?? ''].filter(Boolean).join(' · ');
  return {
    id: pid, name, desc,
    ogImage: ownOg ? `cms-picker-${pid}` : 'cms-picker',
    ogAlt: ownOg ? `${name} SEO on CMS Picker: its six SEO settings, marked built in, plugin or needs code`
      : 'CMS Picker: which website platform fits you, what’s built in, and getting found on Google and AI search',
    nameUrl: quote(name),
    // "<" written as \u003c (the same character to a JSON reader), so no name in the data can close the script tag
    jsonld: '\n' + JSON.stringify(ld, null, 2).replace(/</g, '\\u003c').split('\n').map((l) => '  ' + l).join('\n') + '\n  ',
    // Platforms with no menus to point to (a headless CMS: the developer builds the fields) say what each takes instead
    lede: e((`${pr.summary ?? ''} Here’s what you can change for search on ${name}, and `
      + `${hasWhere ? 'where each setting is' : 'what each change takes'}. Every answer is checked against official documentation, linked under it.`).trim()),
    sub: hasWhere ? 'What people ask most often, with the menu path to each setting.' : `What people ask most often, and what each takes on ${e(name)}.`,
    meta: e(meta),
    questions: questions.join('\n'),
    facts: facts.filter(([, x]) => x).map(([t, x]) => `        <div><dt>${t}</dt><dd>${e(x)}</dd></div>`).join('\n'),
    fit: fit ? `      <div class="pp-fit">${fit}</div>` : '',
    built: built.join('\n'),
    others: plats.filter((o) => o.id !== pid).map((o) => `<a href="../${o.id}/">${e(o.name)}</a>`).join(''),
  };
}
