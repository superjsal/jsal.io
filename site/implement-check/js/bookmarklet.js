// Implement Check's bookmark. The page turns this file into a javascript: link, with SHEET set to its own address.
// Run on any page, it compares the HTML the server sends with the page as shown, then opens a panel there.
(async () => {
  const SHEET = '__SHEET__';
  const old = document.getElementById('jsal-ic');
  if (old) { old.remove(); return; }

  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const cut = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s);
  const attr = (d, sel, a) => { const e = d.querySelector(sel); return e ? norm(e.getAttribute(a)) : null; };
  const metaC = (d, sel) => attr(d, sel, 'content');

  // Two fetches: what visitors get (the cache's copy, if any) and a fresh copy past the cache
  const get = async (fresh) => {
    const u = new URL(location.href);
    if (fresh) u.searchParams.set('jsal-ic', Date.now().toString(36));
    const r = await fetch(u, { cache: 'no-store' });
    return { r, html: await r.text() };
  };

  const host = document.createElement('div');
  host.id = 'jsal-ic';
  host.style.cssText = 'all:initial;position:fixed;top:16px;right:16px;z-index:2147483647';
  const root = host.attachShadow({ mode: 'open' });
  const css = `
:host{--bg:#fbf8f1;--sunk:#efe9dc;--ink:#2b2620;--muted:#6b6256;--line:#dcd3c3;--ok:#2f6b3c;--ok-bg:#e1efe2;--js:#2a5a8c;--js-bg:#e2ecf7;--warn:#9a4a24;--fill:#e3b04b;--on-fill:#2b2620}
@media (prefers-color-scheme:dark){:host{--bg:#24211d;--sunk:#1b1916;--ink:#eee7da;--muted:#b3a995;--line:#463f35;--ok:#9fd3a8;--ok-bg:#24392a;--js:#9cc3ec;--js-bg:#1f3248;--warn:#f0a77f}}
*{box-sizing:border-box}
.p{width:380px;max-height:calc(100vh - 32px);overflow:auto;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.25);font:13px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;padding:16px}
header{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
h1{font:700 15px/1.2 system-ui,sans-serif;margin:0}
.x{all:unset;cursor:pointer;width:28px;height:28px;display:grid;place-items:center;border-radius:6px;color:var(--muted);font-size:18px}
.x:hover{background:var(--sunk)}
.sub{color:var(--muted);margin:0 0 12px}
dl{display:grid;grid-template-columns:96px auto 1fr;gap:6px 8px;margin:0;align-items:start}
dt{color:var(--muted)}dd{margin:0;min-width:0;overflow-wrap:anywhere;color:var(--muted);font-size:12px}
.t{display:inline-block;padding:1px 8px;border-radius:4px;font-size:12px;font-weight:600;white-space:nowrap}
.ok{background:var(--ok-bg);color:var(--ok)}.js{background:var(--js-bg);color:var(--js)}
.ch{border:1px dashed var(--warn);color:var(--warn);padding:0 7px}.no{background:var(--sunk);color:var(--muted)}
.note{background:var(--sunk);border-radius:6px;padding:8px 12px;margin:12px 0 0}
form{display:flex;gap:8px;margin:12px 0 0}
input,select{font:inherit;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:6px 8px;min-width:0}
input{flex:1}
button.b{font:600 13px system-ui,sans-serif;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:6px 12px;cursor:pointer}
button.b:hover{border-color:var(--muted)}
button.go{background:var(--fill);border-color:var(--fill);color:var(--on-fill)}
.found{margin:8px 0 0}
.send{display:flex;gap:8px;margin:16px 0 0;padding-top:12px;border-top:1px solid var(--line)}
.send select{flex:1}
:focus-visible{outline:2px solid var(--fill);outline-offset:2px}`;
  try { const s = new CSSStyleSheet(); s.replaceSync(css); root.adoptedStyleSheets = [s]; }
  catch { const s = document.createElement('style'); s.textContent = css; root.append(s); }
  const p = document.createElement('div');
  p.className = 'p';
  p.setAttribute('role', 'dialog');
  p.setAttribute('aria-label', 'Implement Check');
  p.innerHTML = '<header><h1>Implement Check</h1><button class="x" aria-label="Close">×</button></header><p class="sub">Checking this page…</p>';
  root.append(p);
  document.documentElement.append(host);
  const close = () => host.remove();
  root.querySelector('.x').onclick = close;
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  let seen, fresh;
  try { [seen, fresh] = await Promise.all([get(false), get(true)]); }
  catch (e) { p.querySelector('.sub').textContent = 'This page couldn’t be fetched again (' + (e.message || 'blocked') + '). Try reloading it.'; return; }
  const raw = new DOMParser().parseFromString(fresh.html, 'text/html');
  const live = document;
  const hdr = (n) => seen.r.headers.get(n);

  // Each field: how to read it from a document, and how to say it short
  const words = (d) => {
    const m = d.querySelector('main, [role=main]') || d.querySelector('article') || d.body;
    if (!m) return 0;
    const c = m.cloneNode(true);
    c.querySelectorAll('script,style,noscript,template,svg,#jsal-ic').forEach((e) => e.remove());
    return norm(c.textContent).split(' ').filter(Boolean).length;
  };
  const ld = (d) => {
    const types = [];
    let bad = 0;
    d.querySelectorAll('script[type="application/ld+json" i]').forEach((s) => {
      try {
        const walk = (x) => { if (Array.isArray(x)) return x.forEach(walk); if (x && typeof x === 'object') { if (x['@graph']) walk(x['@graph']); if (x['@type']) types.push([].concat(x['@type']).join('+')); } };
        walk(JSON.parse(s.textContent));
      } catch { bad++; }
    });
    return types.length || bad ? { types, bad } : null;
  };
  const self = (u) => { try { const a = new URL(u, location.href); return a.origin + a.pathname === location.origin + location.pathname; } catch { return false; } };
  const F = [
    ['title', 'Title', (d) => norm(d.querySelector('head title')?.textContent) || null],
    ['description', 'Description', (d) => metaC(d, 'meta[name="description" i]')],
    ['h1', 'H1', (d) => { const h = [...d.querySelectorAll('h1')].map((e) => norm(e.textContent)).filter(Boolean); return h.length ? h : null; }],
    ['canonical', 'Canonical', (d) => attr(d, 'link[rel="canonical" i]', 'href')],
    ['robots', 'Robots', (d) => metaC(d, 'meta[name="robots" i]')],
    ['schema', 'Schema', ld],
    ['og', 'Share tags', (d) => { const o = ['title', 'description', 'image'].map((k) => metaC(d, `meta[property="og:${k}" i]`)); return o.some(Boolean) ? o : null; }],
    ['hreflang', 'hreflang', (d) => d.querySelectorAll('link[rel="alternate" i][hreflang]').length || null],
  ];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const verdict = (a, b) => (a == null && b == null ? 'missing' : a == null ? 'added' : b == null || !same(a, b) ? 'changed' : 'html');
  const show = {
    title: (v) => `${cut(v, 70)} (${v.length})`,
    description: (v) => `${cut(v, 90)} (${v.length})`,
    h1: (v) => (v.length > 1 ? `${v.length} H1s: ` : '') + cut(v.join(' | '), 80),
    canonical: (v) => cut(v, 90) + (self(v) ? ' (this page)' : ' (another page)'),
    robots: (v) => v,
    schema: (v) => (v.types.length ? [...new Set(v.types)].join(', ') : '') + (v.bad ? ` · ${v.bad} block${v.bad > 1 ? 's' : ''} won’t parse` : ''),
    og: (v) => ['title', 'description', 'image'].filter((k, i) => !v[i]).map((k) => 'no og:' + k).join(', ') || 'Title, description and image',
    hreflang: (v) => `${v} alternate${v > 1 ? 's' : ''}`,
  };
  const out = { v: 1, url: location.href, at: Date.now(), f: {} };
  for (const [k, , read] of F) {
    const a = read(raw), b = read(live);
    out.f[k] = { v: verdict(a, b), raw: a == null ? '' : show[k](a), live: b == null ? '' : show[k](b) };
  }
  if (out.f.robots.v === 'missing') out.f.robots.live = 'None set (indexable)';
  const xr = hdr('x-robots-tag');
  if (xr) out.f.robots.header = xr;
  const sh = ld(live);
  if (sh) { const c = {}; sh.types.forEach((t) => (c[t] = (c[t] || 0) + 1)); const d2 = Object.keys(c).filter((t) => c[t] > 1 && !/^(ListItem|Offer|Question|Answer|ImageObject|Person|PostalAddress|Rating|Review|AggregateRating|Brand|PropertyValue)$/.test(t)); if (d2.length) out.f.schema.dup = d2; }
  const wr = words(raw), wl = words(live);
  out.f.content = { v: wl === 0 && wr === 0 ? 'missing' : wr < wl * 0.5 ? 'added' : Math.abs(wr - wl) > Math.max(40, wl * 0.15) ? 'changed' : 'html', raw: wr + ' words', live: wl + ' words' };

  // What made the page: platform, template, page builder, SEO plugin
  const H = fresh.html;
  const gen = [...live.querySelectorAll('meta[name="generator" i]')].map((m) => m.content).join(' ');
  const bc = [...(live.body?.classList || [])];
  const has = (re) => re.test(H) || re.test(gen);
  const w = window;
  let platform = '', template = '', builder = '';
  if (w.Shopify || has(/cdn\.shopify\.com/)) {
    platform = 'Shopify';
    const pt = w.ShopifyAnalytics?.meta?.page?.pageType || (bc.find((c) => /^template-/.test(c)) || '').replace('template-', '');
    const tc = bc.find((c) => /^template-.+\./.test(c) || /^template-suffix/.test(c));
    template = [pt, tc && tc !== 'template-' + pt ? tc.replace('template-', '') : '', w.Shopify?.theme?.name ? 'theme ' + w.Shopify.theme.name : ''].filter(Boolean).join(', ');
  } else if (/WordPress/i.test(gen) || has(/\/wp-content\//)) {
    platform = 'WordPress' + (/WooCommerce/i.test(gen) || bc.includes('woocommerce') ? ' + WooCommerce' : '');
    const t = bc.find((c) => /^page-template-(?!default)/.test(c));
    template = [t ? t.replace('page-template-', '') : '', bc.includes('home') ? (bc.includes('blog') ? 'posts page' : 'front page') : '', bc.find((c) => /^single-(?!format)/.test(c)) || '', bc.find((c) => /^(tax-|category|post-type-archive|archive|blog$)/.test(c)) || ''].filter(Boolean).join(', ');
    builder = [[/elementor/, 'Elementor'], [/^et_pb|et-db|et_divi/, 'Divi'], [/^fl-builder/, 'Beaver Builder'], [/^wpb-js|vc_/, 'WPBakery'], [/^brx-|bricks/, 'Bricks'], [/^oxygen|ct-/, 'Oxygen'], [/^fusion|avada/, 'Avada'], [/^thrive/, 'Thrive']].filter(([re]) => bc.some((c) => re.test(c))).map(([, n]) => n)[0] || (live.querySelector('[class*="wp-block-"]') ? 'Block editor' : '');
  } else if (w.wixBiSession || /Wix\.com/i.test(gen)) platform = 'Wix';
  else if (w.Static?.SQUARESPACE_CONTEXT || has(/squarespace/i)) { platform = 'Squarespace'; template = bc.find((c) => /^collection-type-/.test(c))?.replace('collection-type-', '') || ''; }
  else if (live.documentElement.dataset.wfSite) { platform = 'Webflow'; template = live.documentElement.dataset.wfCollection ? 'CMS collection template' : 'static page'; }
  else if (/Framer/i.test(gen)) platform = 'Framer';
  else if (has(/hs-scripts\.com|hubspot/i) && w._hsq) platform = 'HubSpot';
  else if (has(/bigcommerce\.com|stencil-utils/i)) platform = 'BigCommerce';
  else if (w.dmAPI || has(/irp\.cdn-website\.com|multiscreensite/)) platform = 'Duda';
  else if (/Ghost/i.test(gen)) platform = 'Ghost';
  else if (/Drupal/i.test(gen) || live.querySelector('[data-drupal-selector]')) platform = 'Drupal';
  else if (has(/square\.site|squarecdn|weebly/i)) platform = 'Square Online';
  else if (has(/substackcdn\.com/)) platform = 'Substack';
  if (!platform && gen) platform = cut(gen, 40);
  const seo = [[/Yoast SEO/i, 'Yoast'], [/Rank Math/i, 'Rank Math'], [/All in One SEO|AIOSEO/i, 'AIOSEO'], [/SEOPress/i, 'SEOPress'], [/The SEO Framework/i, 'The SEO Framework']].filter(([re]) => re.test(H)).map(([, n]) => n)[0] || '';
  out.d = { platform: platform || 'Not recognised', template, builder, seo };

  // Cache: what the visitors' copy says about itself, and whether it lags the fresh copy
  const age = +hdr('age') || 0;
  const by = hdr('cf-cache-status') ? 'Cloudflare' : hdr('x-litespeed-cache') ? 'LiteSpeed' : hdr('x-kinsta-cache') ? 'Kinsta' : hdr('x-sucuri-cache') ? 'Sucuri' : hdr('x-vercel-cache') ? 'Vercel' : hdr('x-served-by') && /cache/i.test(hdr('x-served-by')) ? 'Fastly' : hdr('x-cache') ? 'CDN' : '';
  const st = (hdr('cf-cache-status') || hdr('x-litespeed-cache') || hdr('x-kinsta-cache') || hdr('x-sucuri-cache') || hdr('x-vercel-cache') || hdr('x-cache') || '').toUpperCase();
  const hit = /HIT|STALE|UPDATING/.test(st) || age > 0;
  const plug = [[/WP Rocket/i, 'WP Rocket'], [/W3 Total Cache/i, 'W3 Total Cache'], [/WP Super Cache|wp-super-cache/i, 'WP Super Cache'], [/LiteSpeed Cache/i, 'LiteSpeed Cache'], [/WP Fastest Cache/i, 'WP Fastest Cache'], [/Cache Enabler/i, 'Cache Enabler']].filter(([re]) => re.test(seen.html)).map(([, n]) => n)[0] || '';
  const cached = new DOMParser().parseFromString(seen.html, 'text/html');
  const lag = F.slice(0, 4).some(([, , read]) => !same(read(cached), read(raw)));
  out.c = { by, hit, age, plugin: plug, lag, status: seen.r.status, text: [by ? `${by}: ${hit ? 'served from cache' + (age ? ', ' + (age < 120 ? age + ' s' : Math.round(age / 60) + ' min') + ' old' : '') : 'not cached'}` : 'No cache headers', plug ? 'plugin ' + plug : ''].filter(Boolean).join(' · ') };

  // Guess the page type, so Send to sheet picks the right row
  const TYPES = ['Homepage', 'Blog post', 'Product', 'Category / Collection', 'Regular page', 'Brand', 'Other'];
  const pt = (w.ShopifyAnalytics?.meta?.page?.pageType || '').toLowerCase();
  const guess = location.pathname === '/' || pt === 'home' || pt === 'index' || (bc.includes('home') && !bc.includes('blog')) ? 'Homepage'
    : pt === 'product' || bc.includes('single-product') || /\/products?\//.test(location.pathname) ? 'Product'
    : pt === 'collection' || bc.some((c) => /^(tax-product_cat|category|post-type-archive)/.test(c)) || /\/(collections|category|categories|shop)\//.test(location.pathname) ? 'Category / Collection'
    : pt === 'article' || bc.includes('single-post') || /\/(blog|news|articles?|posts?)\/.+/.test(location.pathname) ? 'Blog post'
    : /\/(brands?|manufacturers?)\//.test(location.pathname) ? 'Brand'
    : 'Regular page';

  const NAMES = { html: 'In the HTML', added: 'Added by JavaScript', changed: 'Changed by JavaScript', missing: 'Missing' };
  const CLS = { html: 'ok', added: 'js', changed: 'ch', missing: 'no' };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const rows = [...F.map(([k, n]) => [k, n]), ['content', 'Content']].map(([k, n]) => {
    const f = out.f[k];
    const val = f.v === 'changed' && f.raw !== f.live ? `Sent: ${f.raw || 'nothing'} → shown: ${f.live || 'nothing'}` : f.live || f.raw;
    return `<dt>${n}</dt><dd><span class="t ${CLS[f.v]}">${NAMES[f.v]}</span></dd><dd>${esc(val)}${f.header ? ' · header: ' + esc(f.header) : ''}${f.dup ? ' · twice: ' + esc(f.dup.join(', ')) : ''}</dd>`;
  }).join('');
  const what = [out.d.platform, out.d.template, out.d.builder, out.d.seo].filter(Boolean).join(' · ');
  p.innerHTML = `<header><h1>Implement Check</h1><button class="x" aria-label="Close">×</button></header>
<p class="sub">${esc(what)}<br>${esc(out.c.text)}${seen.r.status !== 200 ? ' · status ' + seen.r.status : ''}</p>
${out.c.lag ? '<p class="note">The cached copy visitors get is older than the fresh one: clear the site’s cache to see your edits.</p>' : ''}
<dl>${rows}</dl>
<form class="find"><input type="search" placeholder="Paste text from the CMS field" aria-label="Text to find on this page"><button class="b">Find</button></form>
<p class="found" aria-live="polite" hidden></p>
<div class="send"><select aria-label="Page type">${TYPES.map((t) => `<option${t === guess ? ' selected' : ''}>${t}</option>`).join('')}</select><button class="b go" type="button">Send to sheet</button></div>`;
  // Some sites hold back clicks until their delayed scripts load (WordPress speed plugins), so the panel's buttons
  // also answer the press itself, once
  const act = (btn, fn) => {
    let last = 0;
    const run = (e) => { if (Date.now() - last < 600) return; last = Date.now(); e.preventDefault(); fn(e); };
    btn.addEventListener('pointerup', (e) => { if (e.button === 0) run(e); });
    btn.addEventListener('click', run);
  };
  act(root.querySelector('.x'), close);

  // Find my content: in the visible page, only in the page's data, or nowhere
  const fold = (s) => norm(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
  const find = () => {
    const q = fold(root.querySelector('input').value).slice(0, 120);
    const box = root.querySelector('.found');
    box.hidden = !q;
    if (!q) return;
    const inText = (d) => d.body && fold(d.body.innerText ?? d.body.textContent).includes(q);
    const inRaw = raw.body && fold(raw.body.textContent).includes(q);
    const inLive = inText(live);
    // Walk down to the smallest element holding the text (textContent needs no layout, so big pages stay quick)
    let el = null;
    if (inLive) {
      const main = live.querySelector('main, [role=main]');
      el = main && fold(main.textContent).includes(q) ? main : live.body;
      for (let next = el; next; ) {
        el = next;
        next = [...el.children].find((c) => c.id !== 'jsal-ic' && !/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(c.tagName) && fold(c.textContent).includes(q));
      }
    }
    const where = el ? el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.classList[0] ? '.' + el.classList[0] : '') : '';
    const v = inLive && inRaw ? 'html' : inLive ? 'added' : fold(fresh.html).includes(q) ? 'data' : 'none';
    out.find = { q: q.slice(0, 60), v, where };
    const say = { html: ['ok', 'Found', `In the HTML, in &lt;${esc(where)}&gt;.`], added: ['js', 'Added by JavaScript', `Shown in &lt;${esc(where)}&gt;, but not in the HTML the server sends.`], data: ['ch', 'Only in page data', 'It’s in the page’s code (a script or setting) but not shown. The template may not use that field.'], none: ['no', 'Not found', 'This page doesn’t show that text: its template may not use that field.'] }[v];
    box.innerHTML = `<span class="t ${say[0]}">${say[1]}</span> ${say[2]}`;
    if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); const o = el.style.outline; el.style.outline = '3px solid #e3b04b'; setTimeout(() => (el.style.outline = o), 2500); }
  };
  root.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); find(); });
  root.querySelector('input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); find(); } });
  act(root.querySelector('form button'), find);

  // Send to sheet: the result travels after the # (never sent to a server) to the jsal.io page
  const go = root.querySelector('.go');
  act(go, () => {
    out.type = root.querySelector('select').value;
    const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(out)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const win = window.open(SHEET + '#r=' + b64, 'jsal-implement-check');
    go.textContent = win ? 'Sent' : 'Allow pop-ups for this site';
  });
})().catch((e) => alert('Implement Check: ' + e.message));
void 0;
