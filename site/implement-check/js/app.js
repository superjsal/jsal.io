// Implement Check: the sheet of page types, each with the result its bookmark sent and the visitor's notes.
// Results arrive after the # in the address; the sheet is kept in this browser (localStorage) only.

const KEY = 'jsal-implement-check';
const TYPES = ['Homepage', 'Blog post', 'Product', 'Category / Collection', 'Regular page', 'Brand'];
const FIELDS = [['title', 'Title'], ['description', 'Description'], ['h1', 'H1'], ['canonical', 'Canonical'], ['robots', 'Robots'], ['schema', 'Schema'], ['og', 'Share tags'], ['hreflang', 'hreflang'], ['content', 'Content']];
const NAMES = { html: 'In the HTML', added: 'Added by JavaScript', changed: 'Changed by JavaScript', missing: 'Missing' };
const FIND = { html: ['html', 'Found'], added: ['added', 'Added by JavaScript'], data: ['changed', 'Only in page data'], none: ['missing', 'Not found'] };
const $ = (id) => document.getElementById(id);
const app = document.querySelector('.app');

const fresh = () => ({ rows: TYPES.map((type) => ({ type, r: null, notes: '' })), sel: 0 });
const load = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.rows) && s.rows.length) return s; } catch {} return fresh(); };
let state = load();
let undo = null;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

// Build elements without ever reading a result as HTML: every value from a client's page is text
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v != null && v !== false) e.setAttribute(k, v);
  }
  e.append(...kids.flat().filter((k) => k != null && k !== false));
  return e;
};
const tag = (v, text) => el('span', { class: 'tag ' + v, text: text || NAMES[v] });
const str = (s, n = 400) => (typeof s === 'string' ? s.slice(0, n) : '');

// What on a page needs a note before implementing, in plain words
const notes = (r) => {
  const out = [];
  const f = r.f || {};
  const name = { title: 'title', description: 'meta description', h1: 'H1', canonical: 'canonical' };
  for (const k of Object.keys(name)) {
    const x = f[k];
    if (!x) continue;
    if (x.v === 'added') out.push(`The ${name[k]} is added by JavaScript after the page loads. Find the app, script or tag manager that sets it: the field in the CMS may not be what search engines see first.`);
    if (x.v === 'changed') out.push(`The ${name[k]} the server sends is changed by JavaScript (sent: ${x.raw || 'nothing'}; shown: ${x.live || 'nothing'}). Find what changes it before editing the field.`);
    if (x.v === 'missing') out.push(`This page type has no ${name[k]}.`);
  }
  if (/^\d+ H1s/.test(f.h1?.live || '')) out.push(`It has ${f.h1.live.split(':')[0]}. The template may add one as well as the content.`);
  if (/noindex/i.test((f.robots?.live || '') + ' ' + (f.robots?.header || ''))) out.push('This page is set to noindex.');
  if (f.schema?.dup) out.push(`Schema types appear twice (${f.schema.dup.join(', ')}): the theme and a plugin or app may both add them.`);
  if (/won’t parse/.test(f.schema?.live || '')) out.push('A schema block won’t parse: search engines ignore it.');
  if (f.schema && f.schema.v !== 'html' && f.schema.v !== 'missing') out.push(`Schema is ${NAMES[f.schema.v].toLowerCase()}: a script or tag manager handles it.`);
  if (f.content?.v === 'added') out.push(`Most of the text is added by JavaScript (${f.content.raw} sent, ${f.content.live} shown): the content may come from an app or a script, not the page’s field.`);
  if (f.content?.v === 'changed') out.push(`The text sent and the text shown differ (${f.content.raw} sent, ${f.content.live} shown): some sections load or change by script.`);
  if (r.find?.v === 'none') out.push(`Your text (“${r.find.q}”) isn’t on the page: this template doesn’t use that field.`);
  if (r.find?.v === 'data') out.push(`Your text (“${r.find.q}”) is in the page’s code but not shown: the template may not use that field.`);
  if (r.find?.v === 'added') out.push(`Your text (“${r.find.q}”) is added by JavaScript, in ${r.find.where}.`);
  if (r.c?.lag) out.push('Visitors get an older cached copy than a fresh one: clear the cache after saving.');
  else if (r.c?.plugin) out.push(`Caching plugin ${r.c.plugin}: clear it after saving, or edits won’t show.`);
  return out;
};
const summary = (row) => {
  if (!row.r) return ['', 'Not checked'];
  const n = notes(row.r).length;
  return n ? ['note', n === 1 ? '1 to note' : n + ' to note'] : ['ok', 'All in the HTML'];
};

// The list of page types; the chosen one is the selected gold
const renderList = () => {
  $('types').replaceChildren(...state.rows.map((row, i) => {
    const [cls, text] = summary(row);
    return el('li', {}, el('button', { type: 'button', class: 'type', 'aria-current': i === state.sel ? 'true' : null, onclick: () => { state.sel = i; save(); render(); } },
      el('span', { class: 'type-name', text: row.type }), el('span', { class: 'type-sum ' + cls, text })));
  }));
};

const renderDetail = () => {
  const row = state.rows[state.sel] || state.rows[0];
  const d = $('detail');
  if (!row) { d.replaceChildren(); return; }
  const custom = !TYPES.includes(row.type);
  const remove = custom ? el('button', { type: 'button', class: 'jsal-btn link danger', text: 'Remove this page type', onclick: () => { state.rows.splice(state.sel, 1); state.sel = Math.max(0, state.sel - 1); save(); render(); } }) : null;
  if (!row.r) {
    const page = { Homepage: 'the home page', 'Blog post': 'a blog post', Product: 'a product page', 'Category / Collection': 'a category or collection page', 'Regular page': 'a regular page', Brand: 'a brand page' }[row.type] || `a “${row.type}” page`;
    d.replaceChildren(...[el('h2', { class: 'd-title', text: row.type }),
      el('ol', { class: 'd-steps' },
        el('li', { text: `On the client’s site, open ${page}.` }),
        el('li', { text: 'Click the Implement Check bookmark.' }),
        el('li', { text: `In the panel, pick “${TYPES.includes(row.type) ? row.type : 'Other'}” and press Send to sheet.` })),
      notesBox(row), remove ? el('p', { class: 'd-tools' }, remove) : null].filter(Boolean));
    return;
  }
  const r = row.r;
  let host = '';
  try { host = new URL(r.url).host; } catch {}
  const made = [r.d?.platform, r.d?.template, r.d?.builder, r.d?.seo].map((s) => str(s, 80)).filter(Boolean).join(' · ');
  const when = new Date(r.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const grid = el('dl', { class: 'd-fields' });
  for (const [k, label] of FIELDS) {
    const f = r.f?.[k];
    if (!f || !NAMES[f.v]) continue;
    const val = f.v === 'changed' && f.raw !== f.live ? `Sent: ${str(f.raw) || 'nothing'} → shown: ${str(f.live) || 'nothing'}` : str(f.live) || str(f.raw);
    grid.append(el('dt', { text: label }), el('dd', {}, tag(f.v)), el('dd', { class: 'd-val' }, val, f.header ? ` · header: ${str(f.header, 80)}` : '', k === 'schema' && r.url ? [' · ', el('a', { href: 'https://search.google.com/test/rich-results?url=' + encodeURIComponent(r.url), target: '_blank', rel: 'noopener', text: 'Rich Results Test' })] : ''));
  }
  if (r.find && FIND[r.find.v]) grid.append(el('dt', { text: 'Your text' }), el('dd', {}, tag(FIND[r.find.v][0], FIND[r.find.v][1])), el('dd', { class: 'd-val', text: `“${str(r.find.q, 60)}”${r.find.where ? ' in ' + str(r.find.where, 60) : ''}` }));
  grid.append(el('dt', { text: 'Cache' }), el('dd'), el('dd', { class: 'd-val', text: str(r.c?.text, 120) || 'Not known' }));
  const n = notes(r);
  d.replaceChildren(
    el('h2', { class: 'd-title', text: row.type }),
    el('p', { class: 'd-meta' }, el('a', { href: /^https?:/.test(r.url) ? r.url : '#', target: '_blank', rel: 'noopener', text: host + (() => { try { return new URL(r.url).pathname; } catch { return ''; } })() }), made ? ' · ' + made : '', ' · Checked ' + when),
    grid,
    n.length ? el('div', { class: 'd-notes' }, el('h3', { text: 'To note' }), el('ul', {}, n.map((t) => el('li', { text: t })))) : el('p', { class: 'd-all', text: 'Everything checked is in the HTML the server sends: editing the CMS fields should work.' }),
    notesBox(row),
    el('p', { class: 'd-tools' }, el('button', { type: 'button', class: 'jsal-btn link', text: 'Forget this result', onclick: () => { row.r = null; save(); render(); } }), remove ? [el('span', { 'aria-hidden': 'true', text: '·' }), remove] : null),
  );
};

// The visitor's own note for this page type: how to implement here
const notesBox = (row) => {
  const id = 'note-' + state.rows.indexOf(row);
  const t = el('textarea', { id, rows: '3', placeholder: 'e.g. The collection text is a section in the theme editor, not the description field.' });
  t.value = row.notes || '';
  t.addEventListener('input', () => { row.notes = t.value.slice(0, 2000); save(); renderList(); });
  return el('div', { class: 'd-own' }, el('label', { for: id, text: 'How to implement on this page type' }), t);
};

const render = () => { renderList(); renderDetail(); };

// A result arriving from the bookmark: checked, trimmed and put in its page type's row
const receive = () => {
  const m = location.hash.match(/^#r=([\w-]+)$/);
  if (!m) return false;
  history.replaceState(history.state, '', location.pathname + location.search);
  let r;
  try { r = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(m[1].replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)))); } catch { return false; }
  if (!r || r.v !== 1 || typeof r.url !== 'string' || !/^https?:/.test(r.url) || typeof r.f !== 'object') return false;
  state = load();
  const type = str(r.type, 40) || 'Other';
  let i = state.rows.findIndex((row) => row.type.toLowerCase() === type.toLowerCase());
  if (i < 0) {
    let path = '';
    try { path = new URL(r.url).pathname; } catch {}
    state.rows.push({ type: type === 'Other' ? 'Other: ' + path.slice(0, 30) : type, r: null, notes: '' });
    i = state.rows.length - 1;
  }
  state.rows[i].r = r;
  state.sel = i;
  save();
  window.jsalUsed?.();
  return true;
};

// Another open copy of this page takes the result, so a tab the bookmark opened can close itself again
const chan = 'BroadcastChannel' in window ? new BroadcastChannel(KEY) : null;
chan?.addEventListener('message', (e) => { if (e.data === 'sent') { state = load(); render(); chan.postMessage('here'); } });
window.addEventListener('storage', (e) => { if (e.key === KEY) { state = load(); render(); } });
const arrived = () => {
  if (!receive()) return;
  render();
  if (chan && window.opener) {
    chan.addEventListener('message', (e) => { if (e.data === 'here') window.close(); });
    chan.postMessage('sent');
  }
};
window.name = 'jsal-implement-check';
addEventListener('hashchange', arrived);

// The bookmark itself: this site's copy of the check, pointed back at this page
(async () => {
  const bm = $('bm');
  try {
    const code = (await (await fetch(app.dataset.bookmarklet)).text()).replace('__SHEET__', location.origin + location.pathname);
    bm.href = 'javascript:' + encodeURIComponent(code);
  } catch {}
  bm.addEventListener('click', (e) => { e.preventDefault(); $('bmTap').hidden = false; });
})();

$('addBtn').addEventListener('click', () => { $('addForm').hidden = false; $('addName').focus(); });
$('addForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('addName').value.trim().slice(0, 40);
  if (!name) return;
  state.rows.push({ type: name, r: null, notes: '' });
  state.sel = state.rows.length - 1;
  $('addName').value = '';
  $('addForm').hidden = true;
  save(); render();
});

// Copy sheet: one row per page type, tab-separated, for a spreadsheet or the team's records
$('copySheet').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const head = ['Page type', 'URL', 'Platform', 'Template', 'Builder', 'SEO plugin', ...FIELDS.map(([, l]) => l), 'Your text', 'Cache', 'To note', 'How to implement'];
  const cell = (s) => String(s ?? '').replace(/[\t\r\n]+/g, ' ').trim();
  const lines = state.rows.map((row) => {
    const r = row.r;
    if (!r) return [row.type, '', '', '', '', '', ...FIELDS.map(() => ''), '', '', 'Not checked', row.notes];
    return [row.type, r.url, r.d?.platform, r.d?.template, r.d?.builder, r.d?.seo,
      ...FIELDS.map(([k]) => { const f = r.f?.[k]; return f ? NAMES[f.v] + (f.live || f.raw ? ': ' + (f.v === 'changed' ? `sent ${f.raw || 'nothing'}, shown ${f.live || 'nothing'}` : f.live || f.raw) : '') : ''; }),
      r.find ? `${FIND[r.find.v]?.[1] || ''}: ${r.find.q}` : '', r.c?.text, notes(r).join(' '), row.notes];
  });
  try {
    await navigator.clipboard.writeText([head, ...lines].map((l) => l.map(cell).join('\t')).join('\n'));
    window.jsalDone?.(btn, 'Copied');
  } catch { btn.textContent = 'Couldn’t copy'; }
});

$('clearBtn').addEventListener('click', () => {
  undo = state;
  state = fresh();
  save(); render();
  $('clearBtn').hidden = true;
  $('undoClear').hidden = false;
  $('undoClear').focus();
});
$('undoClear').addEventListener('click', () => {
  if (undo) state = undo;
  undo = null;
  save(); render();
  $('undoClear').hidden = true;
  $('clearBtn').hidden = false;
});

arrived();
render();
