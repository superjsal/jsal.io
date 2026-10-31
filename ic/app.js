// ---------- Config ----------
// Both values are public by design: the anon key only works within the access rules in supabase/schema.sql.
const SUPABASE_URL = 'https://kvdzluvhwxkrbatgskio.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZHpsdXZod3hrcmJhdGdza2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMzI4OTQsImV4cCI6MjEwODcwODg5NH0.NKJtGEBjEk4Ma1DXohBy6LTjgm4QHuEH44hdgKtsJFQ';

// Content: loaded from the database after sign-in (table app_data), never stored in this file.
let ITEMS = [], CONTENT_ITEMS = [], VERDICT = {}, SCOPE = {}, P = [], CONTENT = {}, VARIANTS = {}, HOW = {}, WARN = {},
  H1_FIX = '', PTYPES = {}, BY_TYPE = {}, GUIDES = {}, HOW_GUIDES = {}, HOW_UNVERIFIED = new Set();

// ---------- Page UI ----------
const $ = (s) => document.querySelector(s);
const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const state = { sec: 'content', onlyCheck: false, showHow: false, ptype: 'home', platform: null, variant: {}, editing: null, q: '' };
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Team edits are written in Markdown: **bold**, *italic*, ~~strike~~, `code`, [link](https://…),
// "- " / "1. " lists and line breaks. Text is escaped first, so nothing else (no HTML) gets through.
// mdInline() is for one line (how-to steps); md() also handles lists and line breaks.
function mdInline(line) {
  const codes = [];
  let h = esc(line).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  h = h.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*(?=\S)(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*\w])\*(?=\S)(.+?)\*(?!\w)/g, '$1<i>$2</i>')
    .replace(/~~(?=\S)(.+?)~~/g, '<s>$1</s>');
  return h.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}
function md(text) {
  let html = '', list = null, br = false;
  for (const line of String(text).split(/\r?\n/)) {
    const item = line.match(/^\s*([-*•]|\d+[.)])\s+(.*)$/);
    if (item) {
      const type = /\d/.test(item[1]) ? 'ol' : 'ul';
      if (list !== type) { html += (list ? `</${list}>` : '') + `<${type}>`; list = type; }
      html += `<li>${mdInline(item[2])}</li>`;
      br = false;
      continue;
    }
    if (list) { html += `</${list}>`; list = null; br = false; }
    if (!line.trim()) { br = false; continue; }
    html += (br ? '<br>' : '') + mdInline(line);
    br = true;
  }
  return html + (list ? `</${list}>` : '');
}
// For copied notes (they get pasted into the IC form): plain text, links as "text (address)".
const unmd = (t) => String(t)
  .replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, '$1 ($2)')
  .replace(/`([^`]+)`/g, '$1')
  .replace(/\*\*(?=\S)(.+?)\*\*/g, '$1')
  .replace(/(^|[^*\w])\*(?=\S)(.+?)\*(?!\w)/g, '$1$2')
  .replace(/~~(?=\S)(.+?)~~/g, '$1');
// Built-in text is HTML; in the edit boxes it's shown as the same Markdown so formatting survives an edit.
const htmlToMd = (h) => plain(String(h).replace(/<code>(.*?)<\/code>/g, '`$1`').replace(/<b>(.*?)<\/b>/g, '**$1**').replace(/<i>(.*?)<\/i>/g, '*$1*'));

const SEC_LABEL = { tech: 'Tech', content: 'Content' };
function itemsFor(sec) { return sec === 'tech' ? ITEMS : CONTENT_ITEMS; }

// Shared edits: corrections anyone with write access saves for everyone. One document per answer in
// the "edits" collection, id "<platform>~<section>~<item>", body { verdict, mark, scope, note, how?, warn?, at }.
// <section> is "tech", "content", or "content.<page type>" for a page-type answer (e.g. "content.product").
// `how` is the how-to steps, one per line, and `warn` the Watch out text; when either is missing
// the built-in one shows (an empty string means none). Edits are Markdown; built-in text is trusted HTML.
const EDITS = new Map();
const NOTES = new Map();   // platform id → its watch-out note (platform_notes)
let canEditAnswers = false;
const editKey = (pid, sec, id) => `${pid}~${sec}~${id}`;
const ownEdit = (p, sec, id) => EDITS.get(editKey(p.id, sec, id));

// Page types: the Content section key for a platform ("content" when it has no page-type answers),
// and the built-in page-type entry for an item, if any.
const ptypeOf = (sec) => (sec.startsWith('content.') ? sec.slice(8) : '');
const contentSec = (p) => (state.ptype && BY_TYPE[p.id] ? `content.${state.ptype}` : 'content');
const typed = (p, sec, id) => { const t = ptypeOf(sec); return (t && BY_TYPE[p.id]?.[t]?.[id]) || null; };
// A page-type row has its own answer when it has a built-in page-type cell or its own edit.
const ownAnswer = (p, sec, id) => !!ptypeOf(sec) && !!(typed(p, sec, id)?.cell || ownEdit(p, sec, id));

// The built-in answer (no edit at this level): page-type cell, else the general Content answer
// (including its team edit), else the platform's built-in answer.
function baseCell(p, sec, id) {
  if (sec === 'tech') return p.cells[id];
  if (ptypeOf(sec)) return typed(p, sec, id)?.cell || answer(p, 'content', id);
  return CONTENT[p.id][id];
}
// The answer the team uses: an edit at this level if there is one, else the built-in answer.
function answer(p, sec, id) {
  const ed = ownEdit(p, sec, id);
  return ed ? [ed.verdict, ed.mark, ed.scope, ed.note] : baseCell(p, sec, id);
}
// Which edit the shown text comes from (so it's rendered as Markdown, not trusted HTML)
function sourceEdit(p, sec, id) {
  const ed = ownEdit(p, sec, id);
  if (ed) return ed;
  return ptypeOf(sec) && !typed(p, sec, id)?.cell ? ownEdit(p, 'content', id) || null : null;
}
function variantCell(p, sec, id) {
  const v = sec.startsWith('content') && VARIANTS[p.id], choice = v && state.variant[p.id];
  return (choice && v.options[choice][id]) || null;
}
// Page-type answers win over the page-builder picker; otherwise the picker wins.
function cellFor(p, sec, id) { return (ownAnswer(p, sec, id) ? null : variantCell(p, sec, id)) || answer(p, sec, id); }

// How-to steps, as HTML for the row and as Markdown for the edit box.
const howText = (steps) => steps.map(htmlToMd).join('\n');
const stepsFromMd = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean).map(mdInline);
function baseHowMd(p, sec, id) {
  const t = typed(p, sec, id);
  if (t && t.how) return howText(t.how);
  if (ptypeOf(sec)) return howMd(p, 'content', id);
  return howText((HOW[p.id] && HOW[p.id][id]) || []);
}
function howMd(p, sec, id) { const ed = ownEdit(p, sec, id); return ed && typeof ed.how === 'string' ? ed.how : baseHowMd(p, sec, id); }
function howFor(p, sec, id) {
  const ed = ownEdit(p, sec, id);
  if (ed && typeof ed.how === 'string') return { steps: stepsFromMd(ed.how), edited: true };
  const t = typed(p, sec, id);
  if (t && t.how) return { steps: t.how, edited: false };
  if (ptypeOf(sec)) return howFor(p, 'content', id);
  return { steps: (HOW[p.id] && HOW[p.id][id]) || [], edited: false };
}

// Watch out text, the same way. The shared H1 fix sentence is bold in the built-in text.
const boldFix = (h) => h.replace(H1_FIX, `<b>${H1_FIX}</b>`);
function baseWarnMd(p, sec, id) {
  const t = typed(p, sec, id);
  if (t && typeof t.warn === 'string') return htmlToMd(t.warn.replace(H1_FIX, `**${H1_FIX}**`));
  if (ptypeOf(sec)) return warnMd(p, 'content', id);
  return htmlToMd(((WARN[p.id] && WARN[p.id][id]) || '').replace(H1_FIX, `**${H1_FIX}**`));
}
function warnMd(p, sec, id) { const ed = ownEdit(p, sec, id); return ed && typeof ed.warn === 'string' ? ed.warn : baseWarnMd(p, sec, id); }
function warnFor(p, sec, id) {
  const ed = ownEdit(p, sec, id);
  if (ed && typeof ed.warn === 'string') return md(ed.warn);
  const t = typed(p, sec, id);
  if (t && typeof t.warn === 'string') return boldFix(t.warn);
  if (ptypeOf(sec)) return warnFor(p, 'content', id);
  return boldFix((WARN[p.id] && WARN[p.id][id]) || '');
}
// An answer that's the same on every site needs no check on each site (it's in the "Same on every … site"
// group); the sidebar counts and "Only what to check" use the same rule, so the numbers agree.
const settled = (c) => c[2] === 'U';
const curSec = (p) => (state.sec === 'tech' ? 'tech' : contentSec(p));
function entriesFor(p, secs = [curSec(p)]) {
  return secs.flatMap((sec) => itemsFor(sec).map((it) => {
    const variant = !ownAnswer(p, sec, it.id) && !!variantCell(p, sec, it.id);
    const edit = !variant && sourceEdit(p, sec, it.id);           // the edit the shown text comes from
    const own = !variant && !!ownEdit(p, sec, it.id);             // an edit saved at this level (can be reset)
    return { sec, it, key: `${sec}:${it.id}`, cell: cellFor(p, sec, it.id), variant, edit, own };
  }));
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), 1800);
}
async function copy(text, selectEl) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied');
  } catch {
    if (selectEl) {
      if (selectEl.select) selectEl.select();
      else { const r = document.createRange(); r.selectNodeContents(selectEl); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    }
    toast('Press Ctrl+C to copy');
  }
}

function renderControls() {
  const p = P.find((x) => x.id === state.platform);
  document.querySelectorAll('[data-sec]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sec === state.sec)));
  $('#only-check').checked = state.onlyCheck;
  $('#show-how').checked = state.showHow;
  $('#search').placeholder = `Search ${p.name}`;
  // Page type: Content only, on platforms with page-type answers
  const bar = $('#ptype-bar');
  bar.hidden = !(state.sec === 'content' && BY_TYPE[p.id]);
  bar.innerHTML = Object.entries(PTYPES).map(([k, l]) => `<button type="button" data-ptype="${k}" aria-pressed="${state.ptype === k}">${l}</button>`).join('');
  // Builder / setup picker (WordPress, Magento)
  const v = state.sec === 'content' && VARIANTS[p.id];
  $('#variant-wrap').hidden = !v;
  if (v) {
    $('#variant-label').textContent = v.label;
    $('#variant-select').innerHTML = ['', ...Object.keys(v.options)].map((o) => `<option value="${esc(o)}"${(state.variant[p.id] || '') === o ? ' selected' : ''}>${esc(o || 'Not sure')}</option>`).join('');
  }
  $('#platform-select').innerHTML = P.map((x) => `<option value="${x.id}"${x.id === p.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('');
}
function renderPicker() {
  // Each platform with how many items to check in the current view
  $('#picker').innerHTML = P.map((p) => {
    const n = entriesFor(p).filter((e) => !settled(e.cell)).length;
    return `<button type="button" id="pick-${p.id}" aria-pressed="${p.id === state.platform}" data-id="${p.id}"><span>${p.name}</span><span class="cnt${n ? '' : ' zero'}" title="${n} to check">${n}</span></button>`;
  }).join('');
}
// One pill per answer: colour = what it takes; a word says when it varies or isn't verified (no word = same on every site).
const SCOPE_SHORT = { U: '', V: 'varies', C: 'not verified' };
// The CMS Picker section has one tag the Playbook doesn't: indirect ("Indirectly")
const vName = (v) => VERDICT[v] || PK.verdicts[v] || v;
const statusPill = (verdict, scope) =>
  `<span class="v ${verdict}" title="${esc(vName(verdict))} · ${esc(SCOPE[scope])}">${vName(verdict)}${SCOPE_SHORT[scope] ? `<span class="sc">· ${SCOPE_SHORT[scope]}</span>` : ''}<span class="sr-only"> (${SCOPE[scope]})</span></span>`;
function editRowHtml(e, p = P.find((x) => x.id === state.platform)) {
  const [verdict, mark, scope, note] = e.cell;
  const opts = (map, cur) => Object.keys(map).map((k) => `<option value="${k}"${k === cur ? ' selected' : ''}>${esc(plain(map[k]))}</option>`).join('');
  return `<article class="card editing">
      <h4 class="item">${e.it.label}<small>Editing ${esc(p.name)}${ptypeOf(e.sec) ? ` · ${PTYPES[ptypeOf(e.sec)]}` : ''}</small></h4>
      <form class="edit-form" data-form="${e.key}">
        <input type="hidden" name="base" value="${esc(EDITS.get(editKey(p.id, e.sec, e.it.id))?.at || '')}">
        <p class="edit-conflict" role="alert" hidden></p>
        <div class="edit-grid">
          <label title="Can we do it?">Answer<select name="mark">${ANSWERS.map((a) => `<option${a === answerOf(mark, verdict) ? ' selected' : ''}>${a}</option>`).join('')}</select></label>
          <label>Tag<select name="verdict">${opts(VERDICT, verdict)}</select></label>
          <label>Scope<select name="scope">${opts(SCOPE, scope)}</select></label>
        </div>
        ${ANSWERS.includes(plain(mark).trim()) ? '' : `<p class="was">The answer used to say “${esc(plain(mark))}”. Add anything worth keeping to the Note.</p>`}
        ${twinCopyHtml(R.manage && PK.on ? twinFromPicker(p, e.it.id) : null, `data-twin-copy="${p.id}|${e.key}"`, 'the CMS Picker')}
        ${(() => {
          // The three text areas fold away when all are empty, so changing a tag is a two-field edit; they
          // open on their own when any has words, so nothing saved is ever out of sight
          const noteV = e.edit ? note : htmlToMd(note), warnV = warnMd(p, e.sec, e.it.id), howV = howMd(p, e.sec, e.it.id);
          const filled = [noteV, warnV, howV].filter((v) => v && v.trim()).length;
          return `<details class="edit-more"${filled ? ' open' : ''}><summary>Note, watch-out and how-to steps${filled ? '' : ' (empty)'}</summary>
        <label><span>Note <span style="font-weight:400">(optional; copies as plain text)</span></span><textarea name="note" maxlength="600" rows="3">${esc(noteV)}</textarea></label>
        <label><span>Watch out <span style="font-weight:400">(optional, side effects to know before changing it)</span></span><textarea name="warn" maxlength="600" rows="2">${esc(warnV)}</textarea></label>
        <label><span>How-to steps <span style="font-weight:400">(one per line)</span></span><textarea name="how" maxlength="2000" rows="4">${esc(howV)}</textarea></label>
        <div class="md-hint">Formatting: <code>**bold**</code> <code>*italic*</code> <code>~~strike~~</code> <code>&#96;code&#96;</code> <code>[link](https://…)</code> <code>- list</code> <code>1. list</code></div>
        </details>`;
        })()}
        <div class="edit-actions">
          <button type="submit" class="btn primary">Save</button>
          <button type="button" class="btn" data-cancel>Cancel</button>
          ${e.own ? `<button type="button" class="btn" data-reset="${e.key}">Reset to original</button>` : ''}
          <span class="muted edit-hint">Saved for everyone who can open this page${ptypeOf(e.sec) ? `, for ${esc(PTYPES[ptypeOf(e.sec)])} only` : ''}.</span>
        </div>
      </form>
    </article>`;
}
// The Answer: can we do it? Stored in the answer's "mark". Tag says what it takes, Scope whether it's
// the same on every site. An older free-text mark ("Yes, with a module", "Depends on theme") counts as
// the closest Answer, and its wording shows beside it until someone saves the answer again.
const ANSWERS = ['Yes', 'Yes, with limitations', 'No', 'Check'];
const ANSWER_CLASS = { Yes: 'a-yes', 'Yes, with limitations': 'a-some', No: 'a-no', Check: 'a-check' };
const LIMITED = /^(partly|partial|mostly|some|limited|depends)\b|\b(paid plans?|plan\+|plans? and up|pages only|only on|limited)\b|\d+(\.\d+)*\+|;/i;
function answerOf(mark, verdict) {
  const m = plain(mark).trim(), low = m.toLowerCase();
  if (ANSWERS.includes(m)) return m;
  if (/^(check|unknown|unclear|not sure)\b/.test(low) || (!m && verdict === 'check')) return 'Check';
  if (/^(likely no|unlikely|probably not)\b/.test(low)) return verdict === 'check' ? 'Check' : 'No';
  if (/^no\b/.test(low)) return ['code', 'plugin', 'hosting'].includes(verdict) && /[(\w]/.test(low.slice(2)) ? 'Yes, with limitations' : 'No';
  if (LIMITED.test(m)) return 'Yes, with limitations';
  if (verdict === 'no') return 'No';
  if (verdict === 'check') return 'Check';
  return 'Yes';
}
// "Check" beside a "Check manually" tag says the same thing twice, so the tag says it alone
const answerHtml = (mark, verdict) => { const a = answerOf(mark, verdict); return a === 'Check' && verdict === 'check' ? '' : `<b class="answer-word ${ANSWER_CLASS[a]}">${a}</b>`; };
// Group heading icons: alert circle for answers to check, check circle for the ones that hold everywhere
const ICON_CHECK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16h.01"/></svg>';
const ICON_SAME = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/></svg>';
// When the answers on show last changed: the latest team edit to this platform's section, its watch-out,
// or the Playbook's own content (a new platform, item or wording pushed from playbook.py)
let DATA_AT = null;
let ALL_P = [];   // every platform, hidden ones too (admins restore them on the Team page); P is the visible ones
function updatedHtml(p) {
  const tech = state.sec === 'tech' && !state.q.trim(), content = state.sec !== 'tech' && !state.q.trim();
  const times = [DATA_AT, NOTES.get(p.id)?.at];
  EDITS.forEach((e) => { if (e.platform === p.id && (!tech || e.sec === 'tech') && (!content || e.sec.startsWith('content'))) times.push(e.at); });
  const t = Math.max(...times.map((x) => Date.parse(x || '')).filter((n) => !isNaN(n)));
  return isFinite(t) ? `<span title="Latest change to these answers: a team edit, the platform’s watch-out, or a Playbook update">Updated ${new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>` : '';
}
const COPY_SVG = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
function rowHtml(e) {
  if (state.editing === e.key) return editRowHtml(e);
  const [verdict, rawMark, scope, rawNote] = e.cell;
  const note = e.edit ? md(rawNote) : rawNote;
  const oldWords = !ANSWERS.includes(plain(rawMark).trim()) && plain(rawMark).trim().toLowerCase() !== answerOf(rawMark, verdict).toLowerCase();
  const p = P.find((x) => x.id === state.platform);
  const how = howFor(p, e.sec, e.it.id);
  const warn = warnFor(p, e.sec, e.it.id);
  // Settled with nothing to add: one compact, muted line so the cards that need a look stand out.
  const slim = !note && !warn && settled(e.cell) && !e.edit;
  const tools = canEditAnswers && !e.variant ? `<button type="button" class="edit-btn" data-edit="${e.key}" aria-label="Edit answer for ${esc(plain(e.it.label))}">Edit</button>` : '';
  const howHtml = how.steps.length ? `<details class="how"${state.showHow ? ' open' : ''}><summary>How to</summary><ol>${how.steps.map((t) => `<li>${t}</li>`).join('')}</ol>${
    !how.edited && HOW_UNVERIFIED.has(p.id) ? '<p class="how-note">These steps haven’t been checked in a live admin yet. If one is off, fix it with Edit.</p>' : ''}${guideLinks(p, e.it.id)}</details>` : '';
  return `<article class="card${slim ? ' slim' : ''}" id="card-${e.sec}-${e.it.id}">
      <div class="card-head">
        <h4 class="item">${e.it.label}${e.it.hint && !slim ? `<small>${e.it.hint}</small>` : ''}${R.manage && PK.on && PK.items.some((x) => x.id === e.it.id) ? `<a class="pk-twin" href="#picker/${p.id}/${e.it.id}" title="The public CMS Picker keeps its own answer on this, edited on the CMS Picker tab">Also on the CMS Picker</a>` : ''}</h4>
        <div class="answer">${answerHtml(rawMark, verdict)}${statusPill(verdict, scope)}${oldWords ? `<span class="ans">${esc(plain(rawMark))}</span>` : ''}${tools}</div>
      </div>
      ${note ? `<div class="note">${note}<button type="button" class="copy-icon" data-copy="${e.key}" title="Copy note" aria-label="Copy note for ${plain(e.it.label)}">${COPY_SVG}</button></div>` : ''}
      ${warn ? `<div class="warn"><div><b>Watch out:</b> ${warn}</div></div>` : ''}
      <div class="card-foot">${howHtml}${suggestLink(e)}</div>
    </article>`;
}
// Search looks through the platform's Tech answers and its Content answers (current page type) at once,
// in the item name, hint, mark and note; every word typed has to appear.
function searchEntries(p) {
  const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
  const secs = state.sec === 'tech' ? ['tech', contentSec(p)] : [contentSec(p), 'tech'];
  return entriesFor(p, secs).filter((e) => {
    const hay = plain(`${e.it.label} ${e.it.hint || ''} ${e.cell[1]} ${unmd(e.cell[3] || '')}`).toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
function visibleEntries(p) {
  const all = state.q.trim() ? searchEntries(p) : entriesFor(p);
  return state.onlyCheck ? all.filter((e) => !settled(e.cell)) : all;
}
function renderPanel() {
  const p = P.find((x) => x.id === state.platform);
  const searching = !!state.q.trim();
  const all = searching ? searchEntries(p) : entriesFor(p);
  const shown = visibleEntries(p);
  const sub = state.sec === 'content' && contentSec(p) !== 'content' ? ` <span class="h2-sub">· ${PTYPES[state.ptype]}</span>` : '';
  const secName = (sec) => (sec === 'tech' ? 'Tech' : `Content${ptypeOf(sec) ? ` · ${PTYPES[ptypeOf(sec)]}` : ''}`);
  let body;
  if (searching) {
    const secs = [...new Set(shown.map((e) => e.sec))];
    body = shown.length
      ? secs.map((sec) => { const list = shown.filter((e) => e.sec === sec); return `<h3 class="group-h">${secName(sec)}<span class="n" aria-label="${list.length} items">${list.length}</span></h3>${list.map(rowHtml).join('')}`; }).join('')
      : `<p class="empty">No ${esc(p.name)} answers match “${esc(state.q.trim())}”. Try another word, or pick another platform.</p>`;
  } else if (shown.length) {
    const check = shown.filter((e) => e.cell[2] !== 'U'), same = shown.filter((e) => e.cell[2] === 'U');
    const group = (cls, icon, title, sub, list) => list.length ? `<h3 class="group-h ${cls}">${icon}${title}<span class="n" aria-label="${list.length} items">${list.length}</span></h3>${sub ? `<p class="group-sub">${sub}</p>` : ''}${list.map(rowHtml).join('')}` : '';
    body = group('check', ICON_CHECK, 'Check on each site', 'These answers vary from site to site or aren’t verified yet.', check)
      + group('same', ICON_SAME, `Same on every ${esc(p.name)} site`, '', same);
  } else body = `<p class="empty">Nothing to check here: every ${SEC_LABEL[state.sec]} item on ${p.name} is the same on every site.</p>`;
  $('#panel').innerHTML = `
    <div class="panel-head">
      <div style="display:grid;gap:2px;min-width:0">
        <h2>${p.name} · ${searching ? 'Search' : SEC_LABEL[state.sec] + sub}</h2>
        <p class="about">${p.about}</p>
        ${platformNoteHtml(p)}
      </div>
      <div class="panel-meta">
        <div class="tally">${updatedHtml(p)}${searching ? `<span>${shown.length} ${shown.length === 1 ? 'match' : 'matches'}${state.onlyCheck ? ' to check' : ''}</span>` : state.onlyCheck ? `<span>Showing ${shown.length} of ${all.length}</span>` : ''}</div>
        <button type="button" class="btn" id="copy-all">Copy all notes</button>
      </div>
    </div>
    ${body}`;
}
// Platform watch-out: one note per platform. state.editing is NOTE_KEY while its form is open, so
// Escape, Cancel and the refresh guard work as they do for answers.
const NOTE_KEY = '@platform-note';
function platformNoteHtml(p) {
  if (!R.notesOn) return '';
  const n = NOTES.get(p.id);
  if (state.editing === NOTE_KEY && canEditAnswers) {
    return `<form class="edit-form pnote-form" data-note-form>
        <input type="hidden" name="base" value="${esc(n ? n.at : '')}">
        <p class="edit-conflict" role="alert" hidden></p>
        <label><span>Watch out for ${esc(p.name)} <span style="font-weight:400">(shown on every section and page type; Markdown works)</span></span>
          <textarea name="warn" maxlength="600" rows="3">${esc(n ? n.warn : '')}</textarea></label>
        <div class="edit-actions">
          <button type="submit" class="btn primary">Save</button>
          <button type="button" class="btn" data-cancel>Cancel</button>
          ${n ? '<button type="button" class="btn" data-note-remove>Remove</button>' : ''}
          <span class="muted edit-hint">Saved for everyone who can open this page.</span>
        </div>
      </form>`;
  }
  const tools = canEditAnswers ? `<button type="button" class="link-btn" data-note-edit>${n ? 'Edit watch-out' : 'Add a watch-out'}</button>` : '';
  return (n ? `<div class="warn pnote"><div><b>Watch out:</b> ${md(n.warn)}</div></div>` : '') +
    (tools ? `<div class="pnote-tools">${tools}</div>` : '');
}
async function saveNote(warn, button) {
  const p = P.find((x) => x.id === state.platform);
  if (button) button.disabled = true;
  if (await changedMeanwhile(button && button.closest('form'), 'platform_notes', { platform: p.id }, 'this watch-out', 'removed this watch-out', button)) return;
  const row = warn && { platform: p.id, warn, at: new Date().toISOString(), edited_by: R.me };
  const { error } = row ? await sb.from('platform_notes').upsert(row) : await sb.from('platform_notes').delete().eq('platform', p.id);
  if (error) { if (button) button.disabled = false; return toast(failText(error, 'Couldn’t save')); }
  if (row) NOTES.set(p.id, row); else NOTES.delete(p.id);
  state.editing = null;
  renderPanel();
  toast(row ? 'Saved for the team' : 'Watch-out removed');
}

function renderGrid() {
  const sec = state.sec;
  $('#compare-title').textContent = `Compare platforms · ${SEC_LABEL[state.sec]}${state.sec === 'content' ? ` · ${PTYPES[state.ptype]}` : ''}`;
  const head = `<thead><tr><th scope="col">Item</th>${P.map((p) => `<th scope="col">${p.name}</th>`).join('')}</tr></thead>`;
  const body = itemsFor(sec).map((it) => `<tr><th scope="row">${it.label}</th>${P.map((p) => {
      const s = sec === 'content' ? contentSec(p) : sec;
      const [verdict, , scope, note] = cellFor(p, s, it.id);
      const tip = esc(`${p.name} · ${plain(it.label)}: ${VERDICT[verdict]} (${SCOPE[scope]}). ${plain(unmd(note))}`);
      return `<td><span class="v ${verdict}" title="${tip}" tabindex="0">${VERDICT[verdict]}${SCOPE_SHORT[scope] ? `<span class="sc">· ${SCOPE_SHORT[scope]}</span>` : ''}</span></td>`;
    }).join('')}</tr>`).join('');
  $('#grid').innerHTML = head + `<tbody>${body}</tbody>`;
}
// Redraw the panel without moving the card under your finger. Opening or closing an edit form redraws
// the whole panel, and Safari (unlike Chrome) doesn't keep the scroll place when content is replaced,
// so on an iPhone the page jumped away. The card's spot on screen is kept by hand: an edit form replaces
// its card in place, so the card at the same position in the list is the one to line up.
function keepPlace(el, redraw = renderPanel) {
  const cards = () => [...document.querySelectorAll('#panel .card')];
  const card = el && el.closest('#panel .card'), i = cards().indexOf(card), top = card ? card.getBoundingClientRect().top : 0;
  redraw();
  const now = i >= 0 && cards()[i];
  if (now) scrollBy(0, now.getBoundingClientRect().top - top);
}
function render() { state.editing = null; renderControls(); renderPicker(); renderPanel(); renderGrid(); syncHash(); }
function renderView() { renderControls(); renderPicker(); renderPanel(); renderGrid(); syncHash(); }
// After shared edits change: redraw, but never wipe a form someone is typing in.
function refresh() {
  if (!(state.editing && $('#panel .edit-form'))) renderPanel();
  renderPicker();
  renderGrid();
}

// Links: #shopify, #shopify/tech, #shopify/content (or a page type: #shopify/product), and a third part
// for one answer: #shopify/tech/footer. The address follows what's on screen so it can be copied as is.
const viewToken = (sec) => (sec === 'tech' ? 'tech' : ptypeOf(sec) || 'content');
const linkFor = (p, sec = curSec(p), id = '') => `${p.id}/${viewToken(sec)}${id ? `/${id}` : ''}`;
function syncHash() {
  const p = P.find((x) => x.id === state.platform);
  if (p && !$('#panel').hidden) try { history.replaceState(null, '', `#${linkFor(p)}`); } catch {}
}
function parseLink(hash) {
  let parts;
  try { parts = decodeURIComponent(hash.replace(/^#/, '')).split('/'); } catch { return null; }
  return P.some((p) => p.id === parts[0]) ? { platform: parts[0], view: parts[1] || '', item: parts[2] || '' } : null;
}
function openLink({ platform, view, item }) {
  if (view === 'tech') state.sec = 'tech';
  else if (view === 'content' || Object.hasOwn(PTYPES, view)) { state.sec = 'content'; if (view !== 'content') state.ptype = view; }
  if (item) { state.q = ''; $('#search').value = ''; }
  select(platform);
  if (!item) return;
  const find = () => document.getElementById(`card-${curSec(P.find((x) => x.id === platform))}-${item}`);
  let card = find();
  if (!card && state.onlyCheck) { state.onlyCheck = false; render(); card = find(); }   // a settled answer is hidden by the filter
  if (!card) return;
  card.classList.add('target');
  card.tabIndex = -1;
  card.focus({ preventScroll: true });
  card.scrollIntoView({ block: 'center' });
}

function select(id) {
  if (!P.some((p) => p.id === id)) return;
  state.platform = id;
  try { localStorage.setItem('tech-defaults-platform', id); } catch {}
  render();
}
function remember() {
  try { localStorage.setItem('ic-defaults-view', JSON.stringify({ sec: state.sec, onlyCheck: state.onlyCheck, showHow: state.showHow, ptype: state.ptype })); } catch {}
}

$('#sticky').addEventListener('click', (e) => {
  const s = e.target.closest('button[data-sec]');
  if (s) { state.sec = s.dataset.sec; remember(); render(); return; }
  const t = e.target.closest('button[data-ptype]');
  if (t) { state.ptype = t.dataset.ptype; state.editing = null; remember(); renderView(); }
});
$('#variant-select').addEventListener('change', (e) => { state.variant[state.platform] = e.target.value; state.editing = null; renderView(); });
$('#platform-select').addEventListener('change', (e) => select(e.target.value));
// Divider under the pinned bar only once it's pinned.
addEventListener('scroll', () => $('#sticky').classList.toggle('stuck', $('#sticky').getBoundingClientRect().top <= 0), { passive: true });
$('#only-check').addEventListener('change', (e) => { state.onlyCheck = e.target.checked; remember(); render(); });
$('#search').addEventListener('input', (e) => { state.q = e.target.value; state.editing = null; renderPanel(); });
$('#search').addEventListener('keydown', (e) => { if (e.key === 'Escape' && e.target.value) { e.preventDefault(); e.stopPropagation(); e.target.value = state.q = ''; renderPanel(); } });
// "/" jumps to the search box (unless typing somewhere already)
addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input, textarea, select, [contenteditable]') || $('#panel').hidden || $('#main').hidden) return;
  e.preventDefault();
  $('#search').focus();
});
$('#show-how').addEventListener('change', (e) => { state.showHow = e.target.checked; remember(); render(); });
$('#picker').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-id]');
  if (b) select(b.dataset.id);
});
$('#panel').addEventListener('click', (e) => {
  const p = P.find((x) => x.id === state.platform);
  const ed = e.target.closest('[data-edit]');
  if (ed) {
    state.editing = ed.dataset.edit;
    keepPlace(ed);
    $('#panel .edit-form [name="mark"]')?.focus({ preventScroll: true });
    return;
  }
  if (e.target.closest('[data-cancel]')) { state.editing = null; keepPlace(e.target); return; }
  if (e.target.closest('[data-note-edit]')) {
    state.editing = NOTE_KEY;
    renderPanel();
    const t = $('#panel [data-note-form] textarea');
    t?.focus(); t?.setSelectionRange(t.value.length, t.value.length);
    return;
  }
  const nr = e.target.closest('[data-note-remove]');
  if (nr) { if (confirm(`Remove the watch-out for ${p.name}?`)) saveNote('', nr); return; }
  const rs = e.target.closest('[data-reset]');
  if (rs) return saveEdit(rs.dataset.reset, null, rs);
  const one = e.target.closest('[data-copy]');
  if (one) {
    const [sec, id] = one.dataset.copy.split(':');
    return copy(unmd(cellFor(p, sec, id)[3]), one.closest('.card').querySelector('.note'));
  }
  if (e.target.id === 'copy-all') {
    const text = visibleEntries(p).map((x) => `${plain(x.it.label)} — ${answerOf(x.cell[1], x.cell[0])}${x.cell[3] ? `: ${unmd(x.cell[3])}` : ''}`).join('\n');
    const v = VARIANTS[p.id] && state.sec !== 'tech' && state.variant[p.id];
    const t = state.sec === 'content' && contentSec(p) !== 'content' ? ` · ${PTYPES[state.ptype]}` : '';
    copy(`${p.name} — ${SEC_LABEL[state.sec]}${t}${v ? ` (${v})` : ''}\n${text}`, e.target.closest('.panel-head'));
  }
});

$('#panel').addEventListener('submit', (e) => {
  e.preventDefault();
  const nf = e.target.closest('form[data-note-form]');
  if (nf) return saveNote(nf.warn.value.split('\n').map((t) => t.trimEnd()).join('\n').trim(), nf.querySelector('[type="submit"]'));
  const f = e.target.closest('form[data-form]');
  if (f) saveEdit(f.dataset.form, f, f.querySelector('[type="submit"]'));
});
// ---------- CMS Picker (admins only) ----------
// The public CMS Picker keeps its own answers, separate from the Playbook's: every row, each platform's
// profile, logo and sources, and whether it's public, live in the picker table, which only admins can
// read or change. They're edited on the CMS Picker tab: a table of every public answer (wide screens),
// then one platform at a time below it (the only view on phones), with one edit form for both. Row
// labels come from the published /cms-picker/data.json, which is also what "Live" is checked against.
// Changes reach jsal.io/cms-picker with the next publish (the nightly GitHub Action, or playbook.py publish).
const PK = { on: false, rows: new Map(), items: [], verdicts: {}, pubLogos: new Map(), pub: null, sel: null, editing: null };
const PK_GOALS = { store: 'Online store', site: 'Business or marketing site', content: 'Blog or content', custom: 'Custom build with developers' };
const PK_FIELDS = [   // profile field, label, kind
  ['type', 'Type', 'text'], ['summary', 'Summary', 'area'], ['tags', 'Known for', 'list'], ['aiTags', 'AI tools', 'list'],
  ['goals', 'Fits', 'goals'], ['goodFit', 'Good fit for', 'lines'], ['lessSuited', 'Less suited if', 'lines'],
  ['hosting', 'Hosting and updates', 'text'], ['export', 'If you leave', 'text'],
];
const PUBLISH_URL = 'https://github.com/superjsal/jsal.io/actions/workflows/publish-cms-picker.yml';
// A public note that only repeats its tag isn't shown on the CMS Picker (cms-picker/app.js hides it too)
const PK_GENERIC = /^(yes|no|check|automatic|built in)$|^yes, with (an? )?(seo |redirect )?(plugin|module|extension|app|custom code)$/i;
const PK_RECHECK_DAYS = 90;
async function loadPicker() {
  if (!R.manage) return;
  const [rows, pub] = await Promise.all([
    sb.from('picker').select('*'),
    fetch('/cms-picker/data.json', { cache: 'no-cache' }).then((r) => r.json()).catch(() => null),
  ]);
  if (rows.error || !pub) {   // table not set up yet (supabase/schema.sql): no tab
    if (!PK.on) { $('#pk-btn').hidden = true; if (!$('#pk-view').hidden) showView('answers'); }
    return;
  }
  PK.rows = new Map(rows.data.map((r) => [r.platform, r]));
  PK.items = pub.items;
  PK.sourcesOn = rows.data.some((r) => 'sources' in r);     // the sources column exists (supabase/schema.sql)
  PK.verdicts = pub.verdicts || {};
  PK.pubLogos = new Map(pub.platforms.filter((x) => x.logo).map((x) => [x.id, x.logo]));
  PK.pub = pub;
  PK.on = true;
  $('#pk-btn').hidden = false;
  if (!PK.editing || !$('#pk-view .edit-form')) renderPickerView();
  renderPlatformList();
  if (!(state.editing && $('#panel .edit-form'))) renderPanel();   // the "Also on the CMS Picker" links
}
function pkPublic(p) {
  const r = PK.rows.get(p.id);
  return !!(r && r.public);   // the picker table's switch
}
// The CMS Picker's answer for a row: [verdict, public note, scope]
const pkAnswer = (r, id) => ((r && r.answers) || {})[id] || ['check', '', 'C'];
const pkSource = (r, id) => (((r && r.sources) || {})[id]) || null;
// Waiting for the next publish: what's saved differs from the published data.json
const stable = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((key) => [key, x[key]])) : x));
const pubPlatform = (id) => PK.pub && PK.pub.platforms.find((x) => x.id === id);
function pkAnswerWaiting(p, r, id) {
  if (!pkPublic(p)) return false;
  const pa = ((PK.pub.answers || {})[p.id] || {})[id];
  if (!pa) return true;
  const [v, m, s] = pkAnswer(r, id), src = pkSource(r, id);
  return v !== pa.verdict || plain(m) !== pa.mark || s !== pa.scope || ((src && src.url) || '') !== (pa.sourceUrl || '') || ((src && src.where) || '') !== (pa.where || '');
}
const pkProfileWaiting = (p, r) => pkPublic(p) && stable(r.profile || {}) !== stable((pubPlatform(p.id) || {}).profile || {});
const pkSwitchWaiting = (p) => pkPublic(p) !== !!pubPlatform(p.id);
function pkWaitingCount() {
  let n = 0;
  P.forEach((p) => {
    const r = PK.rows.get(p.id);
    if (!r) return;
    if (pkSwitchWaiting(p)) n++;
    if (pkPublic(p)) { if (pkProfileWaiting(p, r)) n++; PK.items.forEach((it) => { if (pkAnswerWaiting(p, r, it.id)) n++; }); }
  });
  return n;
}
const pkWaitTag = '<span class="pk-wait" title="Saved, and on the public CMS Picker after the next publish">Waiting for publish</span>';
// The Playbook's answer on the same topic (same item id), if there is one. The two are kept separately,
// so a correction to one is worth checking against the other.
function pbTwin(id) {
  const tech = ITEMS.find((x) => x.id === id);
  if (tech) return { label: plain(tech.label), view: 'tech' };
  const content = CONTENT_ITEMS.find((x) => x.id === id);
  return content ? { label: plain(content.label), view: 'content' } : null;
}
// ---------- Twin answers ----------
// The Playbook and the CMS Picker each keep their own answer on a shared topic, so a recheck used to mean
// typing the same tag, scope and words twice. An open edit form offers "Copy from the CMS Picker" / "Copy
// from the Playbook", which fills its fields from the other side's answer; nothing is saved until Save.
function twinFromPlaybook(p, id) {   // the Playbook's answer for a CMS Picker row, if the topic is shared
  const t = pbTwin(id);
  if (!t) return null;
  const c = cellFor(p, t.view === 'tech' ? 'tech' : contentSec(p), id);   // content: the page type on show, as in the Playbook
  return c ? { verdict: c[0], scope: c[2], text: unmd(c[3] || '').trim() } : null;
}
function twinFromPicker(p, id) {   // the CMS Picker's answer for a Playbook row, if it has the topic
  if (!PK.items.some((x) => x.id === id) || !PK.rows.has(p.id)) return null;
  const r = PK.rows.get(p.id), [verdict, mark, scope] = pkAnswer(r, id), src = pkSource(r, id);
  return { verdict, scope, text: mark, where: (src && src.where) || '' };
}
function twinCopyHtml(t, attr, from) {
  if (!t) return '';
  const summary = `${vName(t.verdict)}${SCOPE_SHORT[t.scope] ? ` · ${SCOPE_SHORT[t.scope]}` : ''}${t.text ? ` · “${t.text.length > 90 ? `${t.text.slice(0, 90)}…` : t.text}”` : ''}`;
  return `<p class="twin-copy"><button type="button" class="link-btn" ${attr}>Copy from ${from}</button><span class="muted">${esc(summary)}</span></p>`;
}
const setOption = (sel, v) => { if (sel && [...sel.options].some((o) => o.value === v)) sel.value = v; };
document.addEventListener('click', (e) => {
  const pb = e.target.closest('[data-twin-copy]'), pk = e.target.closest('[data-pk-twin-copy]');
  if (!pb && !pk) return;
  const f = (pb || pk).closest('form');
  if (pb) {   // a Playbook form, from the CMS Picker's answer
    const [pid, key] = pb.dataset.twinCopy.split('|'), p = P.find((x) => x.id === pid), t = twinFromPicker(p, key.split(':')[1]);
    if (!t) return;
    setOption(f.verdict, t.verdict);
    setOption(f.scope, t.scope);
    setOption(f.mark, answerOf(t.text, t.verdict));
    if (!f.note.value.trim() && t.text && !PK_GENERIC.test(t.text.trim())) f.note.value = t.text;   // a note that only repeats the tag isn't worth copying
    if (!f.how.value.trim() && t.where) f.how.value = t.where;   // the menu path, as a first step
    if ((f.note.value || f.how.value).trim()) { const d = f.querySelector('.edit-more'); if (d) d.open = true; }   // show what was filled in
  } else {    // a CMS Picker form, from the Playbook's answer
    const [pid, id] = pk.dataset.pkTwinCopy.split('|'), p = P.find((x) => x.id === pid), t = twinFromPlaybook(p, id);
    if (!t) return;
    setOption(f.verdict, t.verdict);
    setOption(f.scope, t.scope);
    if (!f.mark.value.trim() && t.text) f.mark.value = t.text.slice(0, 200);
    f.dispatchEvent(new Event('input', { bubbles: true }));   // the hints under the form
  }
  toast('Copied in. Check it, then Save');
  f.querySelector('[type="submit"]').focus({ preventScroll: true });
});
// Platforms on the tab: the public ones in the CMS Picker's order, then the others by name
function pkPlatforms() {
  const order = PK.pub ? PK.pub.platforms.map((x) => x.id) : [];
  const on = P.filter((p) => pkPublic(p)).sort((a, b) => ((order.indexOf(a.id) + 1) || 999) - ((order.indexOf(b.id) + 1) || 999));
  return { on, off: P.filter((p) => !pkPublic(p)).sort((a, b) => plain(a.name).localeCompare(plain(b.name))) };
}
const logoUrl = (v) => (v.startsWith('data:image/png;base64,') ? v : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(v)}`);
function pkLogoHtml(p, r) {
  const pub = PK.pubLogos.get(p.id);
  const src = r.logo ? logoUrl(r.logo) : pub ? `/cms-picker/${pub}` : '';
  const img = (cls) => `<span class="pk-logo-img${cls}" style="--logo: url(&quot;${esc(src)}&quot;)" aria-hidden="true"></span>`;
  return `<article class="card pk-logo"><div class="card-head"><h4 class="item">Logo<small>${r.logo ? 'Uploaded. On the CMS Picker after the next publish.' : pub ? 'The CMS Picker’s own logo file.' : 'None yet: the CMS Picker shows a letter instead.'}</small></h4>
      <div class="answer"><button type="button" class="edit-btn" data-pk-logo-pick>${src ? 'Replace' : 'Upload'}</button>${r.logo ? '<button type="button" class="edit-btn" data-pk-logo-remove>Remove</button>' : ''}
      <input type="file" accept=".svg,image/svg+xml,.png,image/png" data-pk-logo hidden></div></div>
      ${src ? `<div class="pk-logo-show">${img('')}${img(' sm')}</div>` : ''}
      <p class="muted pk-hint">SVG (best) or PNG with a transparent background, up to 150 KB. It’s drawn in the text colour like the other logos, so only its shape shows.</p></article>`;
}
// A first clean-up in the browser (the publish script cleans it again before it goes public)
function cleanSvg(text) {
  if (!/xmlns=/.test(text)) text = text.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement;
  if (svg.localName !== 'svg' || doc.querySelector('parsererror')) return '';
  svg.querySelectorAll('script, foreignObject, image, iframe, a').forEach((n) => n.remove());
  for (const el of [svg, ...svg.querySelectorAll('*')]) {
    for (const a of [...el.attributes]) if (/^on/i.test(a.name) || (/href$/i.test(a.name) && !a.value.startsWith('#'))) el.removeAttribute(a.name);
  }
  const w = parseFloat(svg.getAttribute('width')), h = parseFloat(svg.getAttribute('height'));
  if (!svg.getAttribute('viewBox') && w && h) svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  return new XMLSerializer().serializeToString(svg);
}
function pkShow(p, f, kind) {
  const v = (PK.rows.get(p.id).profile || {})[f];
  if (kind === 'goals') return (v || []).map((g) => esc(PK_GOALS[g] || g)).join(', ');
  if (Array.isArray(v)) return v.map(esc).join(kind === 'lines' ? '<br>' : ', ');
  return esc(v || '');
}
function pkField(pr, f, label, kind) {
  const v = pr[f];
  if (kind === 'area') return `<label>${label}<textarea name="${f}" rows="2" maxlength="300">${esc(v || '')}</textarea></label>`;
  if (kind === 'lines') return `<label><span>${label} <span style="font-weight:400">(one per line)</span></span><textarea name="${f}" rows="3" maxlength="800">${esc((v || []).join('\n'))}</textarea></label>`;
  if (kind === 'list') return `<label><span>${label} <span style="font-weight:400">(comma-separated)</span></span><input name="${f}" maxlength="300" value="${esc((v || []).join(', '))}"></label>`;
  if (kind === 'goals') return `<fieldset class="pk-goals"><legend class="muted" style="font-size:12px;font-weight:600">${label}</legend>${Object.entries(PK_GOALS).map(([g, l]) =>
    `<label><input type="checkbox" name="goals" value="${g}"${(v || []).includes(g) ? ' checked' : ''}>${esc(l)}</label>`).join('')}</fieldset>`;
  return `<label>${label}<input name="${f}" maxlength="200" value="${esc(v || '')}"></label>`;
}
// Each answer's source: the official page it was checked against, and when (picker.sources). Saving an
// answer records today as the date checked; the publish shows both on the public CMS Picker.
function pkSourceLine(src) {
  if (!PK.sourcesOn) return '';
  const where = src && src.where ? `<p class="pk-src">Where: ${esc(src.where)}</p>` : '';
  if (!src || !src.url) return `${where}<p class="pk-src muted">No source yet</p>`;
  let host = src.url;
  try { host = new URL(src.url).hostname.replace(/^www\./, ''); } catch {}
  const age = (Date.now() - Date.parse(src.checked || '')) / 864e5;
  return `${where}<p class="pk-src">Source: <a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(host)}</a> · checked ${esc(src.checked || '?')}${age > PK_RECHECK_DAYS ? ' · <b class="pk-recheck">worth rechecking</b>' : ''}</p>`;
}
// Hints under the form as you type: a note that won't show, and a missing source
function pkHints(f) {
  const out = [];
  const m = f.mark.value.trim();
  if (!m || PK_GENERIC.test(m)) out.push('This note only repeats the tag, so the public page won’t show it. Say what it takes instead, e.g. which plugin, plan or setting.');
  if (f.source && !f.source.value.trim()) out.push('No source yet. Add the platform’s own help page if you can; the public page shows it with the date checked.');
  return out.map((t) => `<p>${t}</p>`).join('');
}
// The tags a row can take: the cost bands for "What it costs to start", the usual tags for every other row
const PK_COST = ['free', 'low', 'mid', 'high', 'software', 'na'];
// Scope means something different for a price than for a feature ("Same on every site" reads oddly on a cost band)
const PK_COST_SCOPE = { U: 'Same for everyone', V: 'Varies by plan, setup or region', C: 'Not verified' };
const pkScopes = (it) => (it.group === 'cost' ? PK_COST_SCOPE : SCOPE);
function pkPill(it, verdict, scope) {
  if (it.group !== 'cost') return statusPill(verdict, scope);
  const word = { V: 'varies', C: 'not verified' }[scope] || '';
  return `<span class="v ${verdict}" title="${esc(vName(verdict))} · ${esc(PK_COST_SCOPE[scope])}">${vName(verdict)}${word ? `<span class="sc">· ${word}</span>` : ''}<span class="sr-only"> (${PK_COST_SCOPE[scope]})</span></span>`;
}
const pkTagsFor = (it) => Object.fromEntries(Object.entries(PK.verdicts).filter(([k]) => (it.group === 'cost' ? PK_COST.includes(k) || k === 'check' : !PK_COST.includes(k))));
function pkRowHtml(p, r, it) {
  const key = `${p.id}~${it.id}`;
  const [verdict, mark, scope] = pkAnswer(r, it.id);
  const src = pkSource(r, it.id), twin = pbTwin(it.id);
  const twinHtml = twin ? `<span class="pk-twin">Also in the Playbook: <a href="#${p.id}/${twin.view}/${it.id}">${esc(twin.label)}</a></span>` : '';
  const opts = (map, cur) => Object.keys(map).map((k) => `<option value="${k}"${k === cur ? ' selected' : ''}>${esc(plain(map[k]))}</option>`).join('');
  if (PK.editing === key) {
    return `<article class="card editing" id="pk-${key}">
        <h4 class="item">${esc(it.label)}<small>CMS Picker · editing ${esc(plain(p.name))}${it.term ? ` · ${esc(it.term)}` : ''}</small>${twinHtml}</h4>
        <form class="edit-form" data-pk-form="${it.id}">
          ${twinCopyHtml(twinFromPlaybook(p, it.id), `data-pk-twin-copy="${p.id}|${it.id}"`, 'the Playbook')}
          <div class="edit-grid">
            <label>Public note <span style="font-weight:400">(shown on the CMS Picker)</span><input name="mark" maxlength="200" value="${esc(mark)}"></label>
            <label>${it.group === 'cost' ? 'Cost to start' : 'Tag'}<select name="verdict">${opts(pkTagsFor(it), verdict)}</select></label>
            <label>${it.group === 'cost' ? 'Same for everyone?' : 'Varies by site?'}<select name="scope">${opts(pkScopes(it), scope)}</select></label>
          </div>
          ${PK.sourcesOn ? `<label class="pk-src-field">Source <span style="font-weight:400">(the platform’s own docs; saving records today as checked)</span><input name="source" type="url" pattern="https://.*" maxlength="500" placeholder="https://help.example.com/…" value="${esc(src ? src.url || '' : '')}"></label>` : ''}
          ${PK.sourcesOn && it.group !== 'cost' ? `<label class="pk-src-field">Where to find it <span style="font-weight:400">(menu path from those docs, e.g. Pages → page settings → SEO; shown on the CMS Picker)</span><input name="where" maxlength="200" value="${esc(src ? src.where || '' : '')}"></label>` : ''}
          <div class="pk-hints" aria-live="polite"></div>
          <div class="edit-actions"><button type="submit" class="btn primary">Save</button><button type="button" class="btn" data-pk-cancel>Cancel</button>
            <span class="muted edit-hint">Public on jsal.io/cms-picker after the next publish. Ctrl+Enter saves, Esc cancels.</span></div>
        </form>
      </article>`;
  }
  const shown = mark && !PK_GENERIC.test(mark.trim());
  return `<article class="card" id="pk-${key}"><div class="card-head"><h4 class="item">${esc(it.label)}${it.term ? `<small>${esc(it.term)}</small>` : ''}${twinHtml}</h4>
      <div class="answer">${pkPill(it, verdict, scope)}${shown ? `<span class="ans">${esc(mark)}</span>` : ''}${pkAnswerWaiting(p, r, it.id) ? pkWaitTag : ''}<button type="button" class="edit-btn" data-pk-edit="${key}" aria-label="Edit ${esc(it.label)} for ${esc(plain(p.name))}">Edit</button></div></div>${pkSourceLine(src)}</article>`;
}
function pkProfileHtml(p, r) {
  const pr = r.profile || {};
  if (PK.editing === `${p.id}~@profile`) {
    return `<article class="card editing pk-profile"><h4 class="item">Card<small>CMS Picker · editing ${esc(plain(p.name))}</small></h4>
        <form class="edit-form" data-pk-profile>
          ${PK_FIELDS.map(([f, l, k]) => pkField(pr, f, l, k)).join('')}
          <div class="edit-actions"><button type="submit" class="btn primary">Save</button><button type="button" class="btn" data-pk-cancel>Cancel</button>
            <span class="muted edit-hint">Public on jsal.io/cms-picker after the next publish.</span></div>
        </form></article>`;
  }
  return `<article class="card pk-profile"><div class="card-head"><h4 class="item">Card<small>Its profile on the CMS Picker</small></h4>
      <div class="answer">${pkProfileWaiting(p, r) ? pkWaitTag : ''}<button type="button" class="edit-btn" data-pk-edit="${p.id}~@profile" aria-label="Edit the CMS Picker card for ${esc(plain(p.name))}">Edit</button></div></div>
      <dl>${PK_FIELDS.map(([f, l, k]) => `<dt>${l}</dt><dd>${pkShow(p, f, k) || '<span class="muted">None</span>'}</dd>`).join('')}</dl></article>`;
}
// The table of every public answer (wide screens): a column per public platform, a cell per answer.
// A cell opens that answer below, in its platform's section.
// The public page's sections, from the published data: a row starts one when its group differs from the row before
const pkSectionStarts = (i) => !i || PK.items[i].group !== PK.items[i - 1].group;
function pkSectionTitle(it) {
  const g = ((PK.pub && PK.pub.groups) || []).find((x) => x.id === it.group);
  return g ? `${g.title}${g.asOf ? ` · as of ${g.asOf}` : ''}` : it.group;
}
function pkTableHtml(on) {
  if (!on.length) return '';
  const head = `<thead><tr><th scope="col">Can you…</th>${on.map((p) => `<th scope="col"><button type="button" class="pk-col${p.id === PK.sel ? ' on' : ''}" data-pk-sel="${p.id}">${p.name}</button></th>`).join('')}</tr></thead>`;
  // A heading row where each of the public page's sections starts (What it costs to start, Everyday, …)
  const body = PK.items.map((it, i) => `${pkSectionStarts(i) ? `<tr class="pk-group"><th colspan="${on.length + 1}" scope="colgroup"><span>${esc(pkSectionTitle(it))}</span></th></tr>` : ''}<tr><th scope="row">${esc(it.label)}</th>${on.map((p) => {
    const r = PK.rows.get(p.id), [v, m, s] = pkAnswer(r, it.id), wait = pkAnswerWaiting(p, r, it.id), src = pkSource(r, it.id);
    const tip = `${plain(p.name)} · ${plain(it.label)}: ${vName(v)}${m && !PK_GENERIC.test(m.trim()) ? `, ${m}` : ''}${wait ? ' (waiting for publish)' : ''}${PK.sourcesOn && !(src && src.url) ? ' (no source)' : ''}`;
    return `<td><button type="button" class="pk-cell${wait ? ' wait' : ''}${PK.editing === `${p.id}~${it.id}` ? ' on' : ''}" data-pk-cell="${p.id}~${it.id}" title="${esc(tip)}" aria-label="${esc(tip)}. Edit">${pkPill(it, v, s)}${PK.sourcesOn && !(src && src.url) ? '<span class="pk-nosrc" aria-hidden="true">no source</span>' : ''}</button></td>`;
  }).join('')}</tr>`).join('');
  return `<div class="scroll pk-table"><table>${head}<tbody>${body}</tbody></table></div>`;
}
function pkPlatformHtml(p) {
  const r = PK.rows.get(p.id);
  const link = '<a href="/cms-picker/" target="_blank" rel="noopener">CMS Picker</a>';
  if (!r || !pkPublic(p)) {
    return `<section class="pk-plat" id="pk-plat"><h3>${p.name}</h3><div class="pk-off"><p class="muted" style="margin:0">${p.name} isn’t on the public ${link}${pkSwitchWaiting(p) ? ' any more after the next publish' : ''}.${r ? ' Its card, logo and answers are kept.' : ''}</p>
      <button type="button" class="btn" data-pk-public="on">Add to the CMS Picker</button></div></section>`;
  }
  return `<section class="pk-plat" id="pk-plat"><h3>${p.name}${pkSwitchWaiting(p) ? ` ${pkWaitTag}` : ''}</h3>
      ${(r.profile || {}).type ? '' : '<div class="warn"><div><b>Not shown yet:</b> it appears on the CMS Picker once its card has a type. Fill it in with Edit.</div></div>'}
      ${pkProfileHtml(p, r)}${pkLogoHtml(p, r)}${PK.items.map((it, i) => `${pkSectionStarts(i) ? `<h4 class="pk-sec">${esc(pkSectionTitle(it))}</h4>` : ''}${pkRowHtml(p, r, it)}`).join('')}
      <p><button type="button" class="link-btn" data-pk-public="off">Take ${p.name} off the CMS Picker</button></p></section>`;
}
// Needs attention: answers with no source or a stale one (to fix), not verified or unclear (to settle), or
// waiting for the next publish (in flight), worst first, so a recheck is a list to work down. Each row opens
// its editor like a table cell. Under six items it's one line that opens on request.
const PK_ATTN = [   // key, label, colour class, test
  ['nosrc', 'No source', 'fix', (a) => !(a.src && a.src.url)],
  ['stale', `Source over ${PK_RECHECK_DAYS} days`, 'fix', (a) => !!(a.src && a.src.url) && a.age > PK_RECHECK_DAYS],
  ['unverified', 'Not verified', '', (a) => a.scope === 'C'],
  ['unclear', 'Unclear', '', (a) => a.verdict === 'check'],
  ['waiting', 'Waiting for publish', 'inflight', (a) => a.waiting],
];
function pkAttention() {
  const out = [];
  for (const p of pkPlatforms().on) {
    const r = PK.rows.get(p.id);
    for (const it of PK.items) {
      const [verdict, , scope] = pkAnswer(r, it.id), src = pkSource(r, it.id);
      const a = { verdict, scope, src, age: src && src.checked ? (Date.now() - Date.parse(src.checked)) / 864e5 : 0, waiting: pkAnswerWaiting(p, r, it.id) };
      const why = PK_ATTN.filter(([, , , test]) => test(a)).map(([k, l, cls]) => [k, k === 'stale' ? `checked ${Math.round(a.age)} days ago` : l.toLowerCase(), cls]);
      if (why.length) out.push({ p, it, why });
    }
  }
  return out.sort((x, y) => y.why.length - x.why.length);
}
function pkAttentionHtml() {
  const all = pkAttention();
  if (!all.length) return '';
  const n = all.length, s = n === 1 ? '' : 's';
  const bits = PK_ATTN.map(([k, l, cls]) => [k, l, cls, all.filter((i) => i.why.some(([key]) => key === k)).length]).filter((x) => x[3]);
  if (PK.attnFilter && !bits.some(([k]) => k === PK.attnFilter)) PK.attnFilter = null;
  if (n <= 5 && !PK.attnOpen) {
    return `<p class="pk-attn-line"><span><b>${n}</b> answer${s} need${s ? '' : 's'} attention:</span>${bits.map(([, l, cls, c]) => `<span class="muted"><b class="${cls}">${c}</b> ${l.toLowerCase()}</span>`).join('')}<button type="button" class="link-btn" data-pk-attn="open">Show them</button></p>`;
  }
  const items = PK.attnFilter ? all.filter((i) => i.why.some(([k]) => k === PK.attnFilter)) : all;
  const shown = PK.attnAll ? items : items.slice(0, 12);
  const row = (i) => `<li><button type="button" class="pk-cell pk-row" data-pk-cell="${i.p.id}~${i.it.id}" aria-label="Edit ${esc(it_label(i))} for ${esc(plain(i.p.name))}"><b>${esc(plain(i.p.name))}</b><span>${esc(i.it.label)}</span><span class="why">${i.why.map(([, w, cls]) => `<span class="${cls}">${esc(w)}</span>`).join(' · ')}</span></button></li>`;
  const it_label = (i) => i.it.label;
  return `<section class="card pk-attn"><div class="card-head"><h4 class="item">Needs attention<small>${n} answer${s} across the public platforms, worst first. Click one to edit it.</small></h4>${n <= 5 ? '<div class="answer"><button type="button" class="link-btn" data-pk-attn="close">Hide</button></div>' : ''}</div>
      <div class="pk-chips" role="group" aria-label="Show only">${bits.map(([k, l, cls, c]) => `<button type="button" class="pk-chip${PK.attnFilter === k ? ' on' : ''}" data-pk-attn="${k}" aria-pressed="${PK.attnFilter === k}">${l} <b class="${cls}">${c}</b></button>`).join('')}</div>
      <ul>${shown.map(row).join('')}</ul>${shown.length < items.length ? `<p class="pk-more"><button type="button" class="link-btn" data-pk-attn="all">Show all ${items.length}</button></p>` : ''}</section>`;
}
function renderPickerView() {
  if (!PK.on) return;
  const n = pkWaitingCount();
  $('#pk-count').textContent = n ? String(n) : '';
  if ($('#pk-view').hidden) return;
  const { on, off } = pkPlatforms();
  if (!P.some((p) => p.id === PK.sel)) PK.sel = (on[0] || P[0]).id;
  const p = P.find((x) => x.id === PK.sel);
  const pubAt = PK.pub && PK.pub.asOf;
  $('#pk-status').innerHTML = `${n ? `<b>${n} change${n === 1 ? '' : 's'} waiting</b> for the next publish (nightly, 07:41 UTC). Just published? GitHub takes a minute or two to put it live; then press Refresh.` : 'Everything here is live on the CMS Picker.'}
    <a href="${PUBLISH_URL}" target="_blank" rel="noopener">Publish now on GitHub</a>${pubAt ? ` <span class="muted">· answers dated ${esc(pubAt)}</span>` : ''}`;
  const chip = (x) => `<button type="button" class="pk-chip${x.id === PK.sel ? ' on' : ''}" data-pk-sel="${x.id}" aria-pressed="${x.id === PK.sel}">${x.name}</button>`;
  $('#pk-body').innerHTML = `${pkAttentionHtml()}${pkTableHtml(on)}
    <div class="pk-grp"><p class="pk-grp-t" id="pk-grp-on">On the CMS Picker <span>· ${on.length}</span></p><div class="pk-chips" role="group" aria-labelledby="pk-grp-on">${on.map(chip).join('')}</div></div>
    ${off.length ? `<div class="pk-grp off"><p class="pk-grp-t" id="pk-grp-off">Hidden from the CMS Picker <span>· ${off.length} · their answers are kept</span></p><div class="pk-chips" role="group" aria-labelledby="pk-grp-off">${off.map(chip).join('')}</div></div>` : ''}
    ${pkPlatformHtml(p)}`;
  const f = $('#pk-view .edit-form[data-pk-form]');
  if (f) f.querySelector('.pk-hints').innerHTML = pkHints(f);
}
// Redraw without moving what's under your finger (see keepPlace): line the same card up again
function pkKeep(el) {
  const cards = () => [...document.querySelectorAll('#pk-view .card')];
  const card = el && el.closest('#pk-view .card'), i = cards().indexOf(card), top = card ? card.getBoundingClientRect().top : 0;
  renderPickerView();
  const now = i >= 0 && cards()[i];
  if (now) scrollBy(0, now.getBoundingClientRect().top - top);
}
function pkOpen(pid, id) {
  PK.sel = pid;
  PK.editing = id ? `${pid}~${id}` : null;
  renderPickerView();
  syncPickerHash();
  const card = document.getElementById(id ? `pk-${pid}~${id}` : 'pk-plat');
  if (card) { card.scrollIntoView({ block: 'center' }); card.querySelector('input, select')?.focus({ preventScroll: true }); }
}
function syncPickerHash() {
  if (!$('#pk-view').hidden) try { history.replaceState(null, '', PK.sel ? `#picker/${PK.sel}` : '#picker'); } catch {}
}
// Put a platform on the public CMS Picker or take it off (the CMS Picker tab and the Team page's switch)
async function pkSetPublic(p, on, el) {
  if (!on && !confirm(`Take ${plain(p.name)} off the public CMS Picker? Its card, logo and answers are kept for later.`)) return;
  const msg = on ? 'Added. It shows on the CMS Picker after the next publish' : 'Taken off. Gone from the CMS Picker after the next publish';
  if (PK.rows.has(p.id)) return savePicker(p, { public: on }, el, msg);
  el.disabled = true;
  const { data, error } = await sb.from('picker').insert({ platform: p.id, public: true }).select().single();
  if (error) { el.disabled = false; return toast(failText(error, 'Couldn’t add it')); }
  PK.rows.set(p.id, data);
  renderPickerView();
  renderPlatformList();
  toast(msg);
}
async function savePicker(p, change, button, msg = 'Saved. Live on the CMS Picker after the next publish') {
  const r = PK.rows.get(p.id);
  if (button) button.disabled = true;
  const upd = { ...change, at: new Date().toISOString() };
  const { error } = await sb.from('picker').update(upd).eq('platform', p.id);
  if (error) { if (button) button.disabled = false; return toast(failText(error, 'Couldn’t save')); }
  Object.assign(r, upd);
  PK.editing = null;
  pkKeep(button);
  renderPlatformList();
  toast(msg);
}
$('#pk-view').addEventListener('change', async (e) => {
  const inp = e.target.closest('[data-pk-logo]');
  if (!inp || !inp.files[0]) return;
  const f = inp.files[0], p = P.find((x) => x.id === PK.sel);
  if (f.size > 150000) return toast('That file is over 150 KB');
  let logo = '';
  if (f.type === 'image/svg+xml' || /\.svg$/i.test(f.name)) logo = cleanSvg(await f.text());
  else if (f.type === 'image/png') logo = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(''); fr.readAsDataURL(f); });
  else return toast('Use an SVG or PNG file');
  if (!logo) return toast('That file couldn’t be read');
  savePicker(p, { logo }, null, 'Logo saved. On the CMS Picker after the next publish');
});
$('#pk-view').addEventListener('input', (e) => {
  const f = e.target.closest('form[data-pk-form]');
  if (f) f.querySelector('.pk-hints').innerHTML = pkHints(f);
});
$('#pk-view').addEventListener('keydown', (e) => {
  const f = e.target.closest('#pk-view .edit-form');
  if (!f) return;
  if (e.key === 'Escape') { e.preventDefault(); PK.editing = null; pkKeep(f); }
  else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); f.requestSubmit(); }
});
$('#pk-view').addEventListener('click', async (e) => {
  if (e.target.closest('#pk-refresh')) return loadPicker().then(() => toast('Up to date'));
  const at = e.target.closest('[data-pk-attn]');   // Needs attention: open or hide the short list, or filter the long one
  if (at) {
    const v = at.dataset.pkAttn;
    if (v === 'open' || v === 'close') PK.attnOpen = v === 'open';
    else if (v === 'all') PK.attnAll = true;
    else { PK.attnFilter = PK.attnFilter === v ? null : v; PK.attnAll = false; }
    renderPickerView();
    return;
  }
  const cell = e.target.closest('[data-pk-cell]');
  if (cell) { const [pid, id] = cell.dataset.pkCell.split('~'); return pkOpen(pid, id); }
  const sel = e.target.closest('[data-pk-sel]');
  if (sel) return pkOpen(sel.dataset.pkSel);
  const p = P.find((x) => x.id === PK.sel);
  const sw = e.target.closest('[data-pk-public]');
  if (sw) return pkSetPublic(p, sw.dataset.pkPublic === 'on', sw);
  if (e.target.closest('[data-pk-logo-pick]')) return e.target.closest('.card').querySelector('[data-pk-logo]').click();
  const rm = e.target.closest('[data-pk-logo-remove]');
  if (rm) { if (confirm(`Remove ${plain(p.name)}’s uploaded logo?`)) savePicker(p, { logo: null }, rm, 'Logo removed. Gone from the CMS Picker after the next publish'); return; }
  if (e.target.closest('[data-pk-cancel]')) { PK.editing = null; return pkKeep(e.target); }
  const b = e.target.closest('[data-pk-edit]');
  if (!b) return;
  PK.editing = b.dataset.pkEdit;
  pkKeep(b);
  $('#pk-view .edit-form input, #pk-view .edit-form textarea')?.focus({ preventScroll: true });
});
$('#pk-view').addEventListener('submit', (e) => {
  const p = P.find((x) => x.id === PK.sel);
  const f = e.target;
  const btn = f.querySelector('[type="submit"]');
  if (f.dataset.pkForm) {
    e.preventDefault();
    const r = PK.rows.get(p.id), id = f.dataset.pkForm;
    const answers = { ...r.answers, [id]: [f.verdict.value, f.mark.value.trim(), f.scope.value] };
    if (!PK.sourcesOn) return savePicker(p, { answers }, btn);
    const sources = { ...(r.sources || {}) }, url = f.source.value.trim(), where = f.where ? f.where.value.trim() : '';
    const src = { ...(url ? { url, checked: new Date().toISOString().slice(0, 10) } : {}), ...(where ? { where } : {}) };
    if (url || where) sources[id] = src; else delete sources[id];
    return savePicker(p, { answers, sources }, btn);
  }
  if (f.hasAttribute('data-pk-profile')) {
    e.preventDefault();
    const pr = { ...(PK.rows.get(p.id).profile || {}) };
    PK_FIELDS.forEach(([fld, , kind]) => {
      if (kind === 'goals') pr.goals = [...f.querySelectorAll('[name="goals"]:checked')].map((x) => x.value);
      else if (kind === 'lines') pr[fld] = f[fld].value.split('\n').map((t) => t.trim()).filter(Boolean);
      else if (kind === 'list') pr[fld] = f[fld].value.split(',').map((t) => t.trim()).filter(Boolean);
      else pr[fld] = f[fld].value.trim();
    });
    if (!pr.type) { f.type.focus(); return toast('Add the type'); }
    return savePicker(p, { profile: pr }, btn);
  }
});

// ---------- Guides ----------
function guideLinks(p, id) {
  const ids = (HOW_GUIDES[p.id] && HOW_GUIDES[p.id][id]) || [];
  return ids.length ? `<p class="guide-links">Guide${ids.length > 1 ? 's' : ''}: ${ids.map((g) => `<button type="button" class="guide-link" data-guide="${g}">${esc(GUIDES[g].title)}</button>`).join('')}</p>` : '';
}
function guideBlock(b, i) {
  if (b.h) return `<h3>${b.h}</h3>`;
  if (b.p) return `<p>${b.p}</p>`;
  if (b.note) return `<p class="tip">${b.note}</p>`;
  if (b.ol) return `<ol>${b.ol.map((x) => `<li>${x}</li>`).join('')}</ol>`;
  if (b.ul) return `<ul>${b.ul.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  if (b.code) return `<div class="snippet"><div class="snippet-head"><span>${esc(b.label || b.lang || 'Code')}</span><button type="button" class="btn" data-snippet="${i}">Copy</button></div><pre tabindex="0" aria-label="${esc(b.label || b.lang || 'Code')}"><code>${esc(b.code)}</code></pre></div>`;
  return '';
}
let openGuideId = null, guideOpener = null;
function openGuide(id, opener) {
  const g = GUIDES[id];
  if (!g) return;
  openGuideId = id;
  guideOpener = opener || document.activeElement;
  $('#guide-group').textContent = g.group;
  $('#guide-title').innerHTML = g.title.replace(/(\w)-(\w)/g, '$1‑$2');   // "JSON-LD" doesn't break at its hyphen on a phone
  $('#guide-body').innerHTML = `<p class="intro">${g.intro}</p>` +
    (g.unverified ? '<p class="unverified">These steps haven’t been checked in a live admin yet.</p>' : '') +
    g.blocks.map(guideBlock).join('');
  $('#guide').hidden = false;
  $('#guide-backdrop').hidden = false;
  $('#guide-body').scrollTop = 0;
  document.body.style.overflow = 'hidden';
  $('#guide-close').focus();
}
function closeGuide() {
  if ($('#guide').hidden) return;
  $('#guide').hidden = true;
  $('#guide-backdrop').hidden = true;
  document.body.style.overflow = '';
  openGuideId = null;
  if (guideOpener && document.contains(guideOpener)) guideOpener.focus();
}
function renderGuideList() {
  const groups = {};
  Object.entries(GUIDES).forEach(([id, g]) => (groups[g.group] = groups[g.group] || []).push([id, g]));
  $('#guide-list').innerHTML = Object.entries(groups).map(([name, list]) =>
    `<div class="guide-group"><h3>${esc(name)}</h3>${list.map(([id, g]) => `<button type="button" data-guide="${id}">${esc(g.title)}</button>`).join('')}</div>`).join('');
  $('#guide-nav').innerHTML = Object.entries(GUIDES).map(([id, g]) => `<button type="button" data-guide="${id}">${esc(g.title)}</button>`).join('');
}
document.addEventListener('click', (e) => {
  const g = e.target.closest('[data-guide]');
  if (g) { e.preventDefault(); openGuide(g.dataset.guide, g); return; }
  const sn = e.target.closest('[data-snippet]');
  if (sn && openGuideId) { const b = GUIDES[openGuideId].blocks[+sn.dataset.snippet]; copy(b.code, sn.closest('.snippet').querySelector('pre')); }
});
$('#guide-close').addEventListener('click', closeGuide);
$('#guide-backdrop').addEventListener('click', closeGuide);
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#guide').hidden) { e.stopPropagation(); closeGuide(); } }, true);
// Keep Tab inside the open guide
$('#guide').addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const f = [...$('#guide').querySelectorAll('button, a[href]')].filter((x) => x.offsetParent !== null);
  if (!f.length) return;
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
  else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
});

$('#panel').addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.editing) { state.editing = null; renderPanel(); }
});

// Someone else may have saved this since its form opened (the form's "base" field is the version it
// opened with). Say who, instead of quietly replacing their change; the form then counts their version
// as seen, so saving again replaces it on purpose. True when it stopped the save.
async function changedMeanwhile(form, table, match, what, gone, button) {
  const base = form && form.elements.base;
  if (!base) return false;
  const cur = await sb.from(table).select('at,edited_by').match(match).maybeSingle();
  if (cur.error || (Date.parse(base.value) || 0) === (Date.parse(cur.data?.at || '') || 0)) return false;
  base.value = cur.data?.at || '';
  const who = cur.data ? `${personName(cur.data.edited_by)} changed ${what} ${ago(cur.data.at)}` : `someone ${gone}`;
  const note = form.querySelector('.edit-conflict');
  note.innerHTML = `<b>${esc(who.charAt(0).toUpperCase() + who.slice(1))}</b>, while you were editing. Save again to replace it with this, or Cancel to see the saved version.`;
  note.hidden = false;
  if (button) button.disabled = false;
  note.scrollIntoView({ block: 'nearest' });
  return true;
}

// Save (form) or reset (no form) one answer for the team. An edit that matches the original is removed.
async function saveEdit(key, form, button, p = P.find((x) => x.id === state.platform)) {
  if (!sb) return;
  const [sec, id] = key.split(':');
  const docId = editKey(p.id, sec, id);
  let body = null;
  if (form) {
    body = { verdict: form.verdict.value, mark: form.mark.value.trim(), scope: form.scope.value, note: form.note.value.trim(), at: new Date().toISOString() };
    const how = form.how.value.split('\n').map((t) => t.trim()).filter(Boolean).join('\n');
    if (how !== baseHowMd(p, sec, id)) body.how = how;
    const warn = form.warn.value.split('\n').map((t) => t.trimEnd()).join('\n').trim();
    if (warn !== baseWarnMd(p, sec, id)) body.warn = warn;
    const b = baseCell(p, sec, id);
    if (b[0] === body.verdict && plain(b[1]) === body.mark && b[2] === body.scope && (sourceEdit(p, sec, id) && !ownEdit(p, sec, id) ? b[3] : htmlToMd(b[3])) === body.note && !('how' in body) && !('warn' in body)) body = null;
  }
  if (button) button.disabled = true;
  if (await changedMeanwhile(form, 'edits', { platform: p.id, sec, item: id }, 'this answer', 'reset this answer to the original', button)) return;
  const row = body && { platform: p.id, sec, item: id, verdict: body.verdict, mark: body.mark, scope: body.scope, note: body.note,
    how: 'how' in body ? body.how : null, warn: 'warn' in body ? body.warn : null, at: body.at, edited_by: R.me };
  const { error } = row ? await sb.from('edits').upsert(row)
    : EDITS.has(docId) ? await sb.from('edits').delete().match({ platform: p.id, sec, item: id }) : { error: null };
  if (error) { if (button) button.disabled = false; return toast(failText(error, 'Couldn’t save')); }
  if (row) EDITS.set(docId, row); else EDITS.delete(docId);
  state.editing = null;
  keepPlace(form || button, refresh);
  toast(row ? 'Saved for the team' : 'Back to the original answer');
  return true;
}

// A short, plain message for a failed database call.
function failText(error, what) {
  const m = String((error && error.message) || '');
  if (/row-level security|permission|not allowed|Only admins|violates/i.test(m)) return `${what}: you don’t have access to do that`;
  if (/JWT|expired|session/i.test(m)) return `${what}: your sign-in expired. Reload the page`;
  if (/fetch|network/i.test(m)) return `${what}: check your connection and try again`;
  return `${what}. Try again`;
}

// ---------- Team (admins) ----------
// Anyone can sign in with Discord; only people an admin approves here can see the content.
const R = { me: null, manage: false, pending: [], members: new Map() };
const ago = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (!(s >= 0)) return '';
  if (s < 90) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};
function personHtml(p, actions) {
  return `<div class="person">
      ${p.avatar ? `<img src="${esc(p.avatar)}" alt="" width="36" height="36" referrerpolicy="no-referrer" loading="lazy">` : '<span class="avatar-blank" aria-hidden="true"></span>'}
      <div style="min-width:0"><b>${esc(p.name || 'Unknown Discord user')}</b>${p.role === 'admin' ? '<span class="role">Admin</span>' : ''}
        <small>${p.discord_id ? `Discord ID ${esc(p.discord_id)}` : ''}${p.created_at ? ` · asked ${ago(p.created_at)}` : p.approved_at ? ` · added ${ago(p.approved_at)}` : ''}</small></div>
      <div class="person-actions">${actions}</div>
    </div>`;
}
function renderTeam() {
  const n = R.pending.length;
  $('#team-count').textContent = n ? String(n) : '';
  const members = [...R.members.values()].sort((a, b) => (a.role === b.role ? String(a.name).localeCompare(String(b.name)) : a.role === 'admin' ? -1 : 1));
  $('#team-tally').textContent = `${members.length} member${members.length === 1 ? '' : 's'} · ${n} waiting`;
  $('#pending-list').innerHTML = n ? R.pending.map((p) => personHtml(p,
    `<button type="button" class="btn primary" data-approve="${esc(p.user_id)}">Approve</button><button type="button" class="btn" data-decline="${esc(p.user_id)}">Decline</button>`)).join('')
    : '<p class="empty">Nobody is waiting. When someone signs in with Discord and isn’t on the team yet, they show up here.</p>';
  renderPlatformList();
  $('#member-list').innerHTML = members.map((m) => personHtml(m, m.user_id === R.me ? '<span class="muted">You</span>' :
    `<button type="button" class="btn" data-role="${esc(m.user_id)}" data-to="${m.role === 'admin' ? 'member' : 'admin'}">${m.role === 'admin' ? 'Make member' : 'Make admin'}</button><button type="button" class="link-btn" data-remove="${esc(m.user_id)}">Remove</button>`)).join('');
}
// Platforms: admins add one (it starts with every answer "Check manually"), and switch each on or off the
// Playbook (hidden: answers kept) and the CMS Picker. The Playbook switch goes through set_platform_hidden
// (supabase/schema.sql), which checks for an admin and also takes a hidden platform off the CMS Picker; the
// CMS Picker switch is the picker table's own, as on the CMS Picker tab.
function renderPlatformList() {
  if (!R.manage) return;
  const sw = (attr, id, on, label, name, why) => `<span class="plat-sw"><button type="button" class="tgl" role="switch" ${attr}="${id}" aria-checked="${on}" aria-label="${esc(plain(name))} on the ${label}"${why ? ` disabled title="${why}"` : ''}></button><span class="tgl-l" aria-hidden="true">${label}</span></span>`;
  $('#platform-list').innerHTML = '<div class="plat-head" aria-hidden="true"><span>Platform</span><span>Playbook</span><span>CMS Picker</span></div>' + ALL_P.map((p) => {
    const card = !!((PK.rows.get(p.id) || {}).profile || {}).type;
    // Why the CMS Picker switch can't be used: hidden from the team, the picker not loaded, or no card to show yet
    const why = p.hidden ? 'Turn it on for the Playbook first' : !PK.on ? 'The CMS Picker hasn’t loaded' : !card && !pkPublic(p) ? 'Needs a card first (CMS Picker tab)' : '';
    const note = p.hidden ? 'Hidden from the team' : !card && PK.on ? 'No CMS Picker card yet' : '';
    return `<div class="person plat-row${p.hidden ? ' is-hidden' : ''}"><span class="avatar-blank plat-badge" aria-hidden="true">${esc(plain(p.name).slice(0, 1))}</span>
      <div><b>${p.name}</b>${note ? `<small>${note}</small>` : ''}</div>
      ${sw('data-plat-team', p.id, !p.hidden, 'Playbook', p.name, '')}${sw('data-plat-pick', p.id, !p.hidden && pkPublic(p), 'CMS Picker', p.name, why)}
      <div class="person-actions">${p.hidden ? '' : `<button type="button" class="btn" data-plat-open="${p.id}">Open</button>`}</div></div>`;
  }).join('');
}
async function reloadContent() {
  const app = await sb.from('app_data').select('data,updated_at').eq('id', 'defaults').maybeSingle();
  if (app.error || !app.data) return toast('Couldn’t reload the Playbook. Refresh the page');
  const data = { ...app.data.data, AT: app.data.updated_at };
  useContent(data);
  const c = readCache(R.me);
  if (c) writeCache({ ...c, data });
  if (!P.some((p) => p.id === state.platform)) state.platform = P[0].id;
  renderControls(); renderPicker(); renderPanel(); renderGrid();
  renderPlatformList();
}
$('#platform-list').addEventListener('click', async (e) => {
  const open = e.target.closest('[data-plat-open]');
  if (open) { showView('answers'); return select(open.dataset.platOpen); }
  const pick = e.target.closest('[data-plat-pick]');
  if (pick) {
    const p = ALL_P.find((x) => x.id === pick.dataset.platPick);
    await pkSetPublic(p, pick.getAttribute('aria-checked') !== 'true', pick);
    return $(`[data-plat-pick="${p.id}"]`)?.focus();
  }
  const b = e.target.closest('[data-plat-team]');
  if (!b) return;
  const id = b.dataset.platTeam, hide = b.getAttribute('aria-checked') === 'true';
  const p = ALL_P.find((x) => x.id === id);
  // The warning names only what changes: the CMS Picker part only when it's on the CMS Picker now
  if (hide && !confirm(`Hide ${plain(p.name)} from the team?${pkPublic(p) ? ' It also comes off the CMS Picker.' : ''} Its answers are kept, and you can turn it back on here.`)) return;
  b.disabled = true;
  const { error } = await sb.rpc('set_platform_hidden', { p_id: id, p_hidden: hide });
  b.disabled = false;
  if (error) return toast(platError(error, hide ? 'Couldn’t hide it' : 'Couldn’t restore it'));
  await reloadContent();
  await loadPicker();
  $(`[data-plat-team="${id}"]`)?.focus();
  toast(hide ? `${plain(p.name)} is hidden from the team` : `${plain(p.name)} is back on the Playbook`);
});
// The short name follows the name until it's typed in by hand
$('#add-platform').addEventListener('input', (e) => {
  const f = e.currentTarget;
  if (e.target === f.pid) f.pid.dataset.typed = '1';
  if (e.target === f.pname && !f.pid.dataset.typed) f.pid.value = plain(f.pname.value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
});
$('#add-platform').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget, btn = f.querySelector('[type="submit"]');
  const id = f.pid.value.trim(), name = f.pname.value.trim();
  btn.disabled = true;
  const { error } = await sb.rpc('add_platform', { p_id: id, p_name: name, p_about: f.pabout.value.trim() });
  btn.disabled = false;
  if (error) return toast(platError(error, 'Couldn’t add it'));
  f.reset();
  delete f.pid.dataset.typed;
  await reloadContent();
  loadPicker();
  showView('answers');
  select(id);
  toast(`${name} added. Fill in its answers with Edit`);
});
// The database's own message is written for people ("There is already a platform called miva")
function platError(error, what) {
  return /^(There is|The short name|Add a name|The description|No platform)/.test(error.message || '') ? error.message : failText(error, what);
}
async function loadTeam() {
  if (!R.manage) return;
  const [pend, mem] = await Promise.all([
    sb.from('access_requests').select('*').order('created_at'),
    sb.from('members').select('*'),
  ]);
  if (!pend.error) R.pending = pend.data;
  if (!mem.error) R.members = new Map(mem.data.map((m) => [m.user_id, m]));
  renderTeam();
}
// Team, Requests and the CMS Picker take the place of the answers (toolbar, cards, guides, compare) while open.
// A CMS Picker link: #picker, #picker/<platform> or #picker/<platform>/<row> (that answer's form open)
function openPickerLink(hash) {
  const [, pid, id] = hash.replace(/^#/, '').split('/');
  if (pid && P.some((x) => x.id === pid)) { PK.sel = pid; PK.editing = id ? `${pid}~${id}` : null; }
  showView('picker');
  if (pid && PK.on) pkOpen(PK.sel, id);
}
function showView(name) {
  if ((name === 'team' || name === 'picker') && !R.manage) name = 'answers';
  const answers = name === 'answers';
  ['#sticky', '#panel', '#guides-fold', '#compare'].forEach((id) => { $(id).hidden = !answers; });
  $('#team-view').hidden = name !== 'team';
  $('#pk-view').hidden = name !== 'picker';
  document.querySelector('.app').classList.toggle('pk-wide', name === 'picker');
  $('#req-view').hidden = name !== 'requests';
  document.querySelectorAll('#viewnav [data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
  try { history.replaceState(null, '', answers ? `#${linkFor(P.find((x) => x.id === state.platform))}` : name === 'picker' && PK.sel ? `#picker/${PK.sel}` : `#${name}`); } catch {}
  if (name === 'team') { renderTeam(); loadTeam(); }
  // The CMS Picker tab: fresh answers and the latest published copy each time, so "waiting" is never stale
  if (name === 'picker') { renderPickerView(); syncPickerHash(); loadPicker(); }
  if (name === 'requests') renderRequests();
  if (!answers) scrollTo({ top: 0, behavior: 'instant' });   // a new page starts at the top, no glide
}
$('#viewnav').addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) showView(b.dataset.view); });
$('#team-view').addEventListener('click', async (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  let call = null, done = '';
  if (t.dataset.approve) { call = sb.rpc('approve_member', { uid: t.dataset.approve }); done = 'Approved. They can refresh the page now'; }
  else if (t.dataset.decline && confirm('Decline this person? They can sign in again later to ask again.')) { call = sb.from('access_requests').delete().eq('user_id', t.dataset.decline); done = 'Declined'; }
  else if (t.dataset.remove && confirm('Remove this person from the team?')) { call = sb.rpc('remove_member', { uid: t.dataset.remove }); done = 'Removed'; }
  else if (t.dataset.role) { call = sb.rpc('set_member_role', { uid: t.dataset.role, new_role: t.dataset.to }); done = t.dataset.to === 'admin' ? 'Now an admin' : 'Now a member'; }
  else if (t.id === 'team-refresh') { await loadTeam(); return toast('Up to date'); }
  if (!call) return;
  t.disabled = true;
  const { error } = await call;
  t.disabled = false;
  if (error) return toast(failText(error, 'That didn’t work'));
  await loadTeam();
  toast(done);
});

// ---------- Requests ----------
// Members post requests and upvote; admins set the status. One upvote per person per request (the database enforces it).
const REQ_TYPES = { correction: 'Correct an answer', platform: 'Add a platform', feature: 'Feature idea', other: 'Other' };
const REQ_STATUS = { new: 'Not reviewed', review: 'Under review', planned: 'Planned', done: 'Done', declined: 'Declined' };
Object.assign(R, { reqs: new Map(), votes: new Map(), filter: 'open', type: '', sort: 'top', formType: 'correction', busy: new Set(),
  comments: new Map(), commentsOn: false, threads: new Set(), drafts: new Map(), fixing: new Set() });
const ts = (iso) => new Date(iso).getTime() || 0;
const isOpen = (r) => r.status !== 'done' && r.status !== 'declined';
// Short item name for requests: "FAQ" from "FAQ: widget or drag & drop?", "Page Headers" from "Page Headers (e.g., …)"
const shortLabel = (it) => plain(it.label).replace(/\s*\(.*\)\s*$/, '').replace(/:.*$/, '').replace(/\?$/, '').trim();
// "Shopify · FAQ (Product)" from a request's platform and item ('content.product:faq')
function reqTarget(r) {
  const p = P.find((x) => x.id === r.platform);
  const [sec, id] = String(r.item || '').split(':');
  const it = id && itemsFor(sec || '').find((x) => x.id === id);
  const pt = ptypeOf(sec || '');
  return [p && p.name, it && shortLabel(it) + (pt && PTYPES[pt] ? ` (${PTYPES[pt]})` : '')].filter(Boolean).join(' · ');
}
function reqList() {
  return [...R.reqs.values()].map((r) => {
    const v = R.votes.get(r.id);
    const c = R.comments.get(r.id) || [];
    return { ...r, votes: v ? v.size : 0, mine: !!(v && v.has(R.me)), comments: c, updated: Math.max(ts(r.at), ts(r.status_at), ...c.map((x) => ts(x.at))) };
  });
}
function personName(uid) {
  if (uid === R.me) return 'you';
  const m = R.members.get(uid);
  return (m && m.name) || 'a former teammate';
}
function renderRequests() {
  const all = reqList();
  const open = all.filter(isOpen).length;
  $('#req-count').textContent = open ? String(open) : '';
  if ($('#req-view').hidden) return;
  document.querySelectorAll('#req-filter [data-filter]').forEach((b) => {
    const f = b.dataset.filter;
    const n = f === 'all' ? all.length : all.filter((r) => (f === 'open' ? isOpen(r) : !isOpen(r))).length;
    b.setAttribute('aria-pressed', String(f === R.filter));
    b.textContent = `${{ open: 'Open', done: 'Closed', all: 'All' }[f]} ${n}`;
  });
  let list = all.filter((r) => (R.filter === 'all' ? true : R.filter === 'open' ? isOpen(r) : !isOpen(r)));
  if (R.type) list = list.filter((r) => r.type === R.type);
  list.sort({ top: (a, b) => b.votes - a.votes || ts(b.at) - ts(a.at), new: (a, b) => ts(b.at) - ts(a.at), updated: (a, b) => b.updated - a.updated }[R.sort]);
  // Redrawing replaces the list, so keep what's typed in open Edit item forms and put the cursor back.
  const act = document.activeElement;
  const typing = act && act.closest('[data-comment-form]'), editing = act && act.closest('[data-req-edit]');
  const kept = [...document.querySelectorAll('#req-list [data-req-edit] form')].map((f) =>
    [f.closest('[data-req-edit]').dataset.reqEdit, [...f.elements].filter((x) => x.name).map((x) => [x.name, x.value])]);
  $('#req-list').innerHTML = list.length ? list.map(reqHtml).join('') :
    `<p class="empty">${all.length ? 'No requests match these filters.' : 'No requests yet. Spotted a wrong answer or want a platform added? Post the first one.'}</p>`;
  kept.forEach(([id, vals]) => {
    const f = document.querySelector(`[data-req-edit="${CSS.escape(id)}"] form`);
    if (f) vals.forEach(([n, v]) => { if (f.elements[n]) f.elements[n].value = v; });
  });
  if (typing) focusComment(typing.dataset.commentForm);
  if (editing) document.querySelector(`[data-req-edit="${CSS.escape(editing.dataset.reqEdit)}"] [name="${act.name}"]`)?.focus({ preventScroll: true });
}
function focusComment(id) {
  const t = document.querySelector(`[data-comment-form="${CSS.escape(id)}"] textarea`);
  if (t) { t.focus({ preventScroll: true }); t.setSelectionRange(t.value.length, t.value.length); }
}
function reqHtml(r) {
  const target = reqTarget(r);
  const canDelete = R.manage || r.author === R.me;
  const open = R.commentsOn && R.threads.has(r.id), n = r.comments.length;
  const fixable = canEditAnswers && answerTarget(r), fixing = fixable && R.fixing.has(r.id);
  return `<article class="req">
      <button type="button" class="vote" data-vote="${esc(r.id)}" aria-pressed="${r.mine}"
        aria-label="${r.mine ? 'Remove your upvote for' : 'Upvote'} ${esc(r.title)} (${r.votes} vote${r.votes === 1 ? '' : 's'})">
        <svg viewBox="0 0 12 8" width="12" height="8" aria-hidden="true"><path d="M1 7l5-5 5 5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
        <b>${r.votes}</b></button>
      <div class="req-body">
        <h3>${esc(r.title)}</h3>
        <div class="req-meta"><span class="st ${esc(r.status)}">${REQ_STATUS[r.status] || ''}</span><span class="chip">${REQ_TYPES[r.type] || ''}</span>${target ? `<span class="chip">${esc(target)}</span>` : ''}</div>
        ${r.details ? `<div class="req-details">${md(r.details)}</div>` : ''}
        <div class="req-foot"><span>Posted by ${esc(personName(r.author))} · ${ago(r.at)}</span>
          ${R.manage ? `<label>Status <select data-status="${esc(r.id)}">${Object.keys(REQ_STATUS).map((k) => `<option value="${k}"${k === r.status ? ' selected' : ''}>${REQ_STATUS[k]}</option>`).join('')}</select></label>` : ''}
          ${R.commentsOn ? `<button type="button" class="link-btn" data-thread="${esc(r.id)}" aria-expanded="${open}">${n ? `Comments (${n})` : 'Comment'}</button>` : ''}
          ${fixable ? `<button type="button" class="link-btn" data-fix="${esc(r.id)}" aria-expanded="${fixing}">Edit item</button>` : ''}
          ${canDelete ? `<button type="button" class="link-btn" data-del="${esc(r.id)}">Delete</button>` : ''}
        </div>
        ${fixing ? itemEditHtml(r) : ''}
        ${open ? threadHtml(r) : ''}
      </div>
    </article>`;
}
function threadHtml(r) {
  const who = (uid) => { const n = personName(uid); return n[0].toUpperCase() + n.slice(1); };
  return `<div class="req-thread">
      ${r.comments.map((c) => `<div class="comment">
        <div class="comment-meta"><b>${esc(who(c.author))}</b><span>${ago(c.at)}</span>${R.manage || c.author === R.me ? `<button type="button" class="link-btn" data-del-comment="${esc(c.id)}">Delete</button>` : ''}</div>
        <div class="comment-body">${md(c.body)}</div>
      </div>`).join('')}
      <form class="edit-form comment-form" data-comment-form="${esc(r.id)}">
        <label><span class="sr-only">Add a comment</span><textarea name="body" rows="2" maxlength="1000" placeholder="Add a comment (Markdown works, Ctrl+Enter posts)">${esc(R.drafts.get(r.id) || '')}</textarea></label>
        <div class="edit-actions"><button type="submit" class="btn primary">Post comment</button></div>
      </form>
    </div>`;
}

// Comments: anyone on the team can comment; authors and admins delete.
function addComment(c) { if (!R.comments.has(c.request_id)) R.comments.set(c.request_id, []); R.comments.get(c.request_id).push(c); }
async function postComment(form) {
  const id = form.dataset.commentForm, body = form.body.value.trim();
  if (!body) { form.body.focus(); return toast('Write a comment first'); }
  const btn = form.querySelector('[type="submit"]');
  btn.disabled = true;
  const { data, error } = await sb.from('comments').insert({ request_id: id, body }).select().single();
  btn.disabled = false;
  if (error) return toast(failText(error, 'Couldn’t post your comment'));
  addComment(data);
  R.drafts.delete(id);
  renderRequests();
  focusComment(id);
  toast('Comment posted');
}

// "Edit item" (admins) on a correction: the answer it's about opens in its edit form right under the
// request, so the request and its comments stay in view. It edits the platform's own answer for that
// page type (never a builder variant), the same answer Edit changes on the Platforms screen.
function answerTarget(r) {
  const p = P.find((x) => x.id === r.platform);
  const [sec, id] = String(r.item || '').split(':');
  const it = p && id && itemsFor(sec).find((x) => x.id === id);
  if (!it) return null;
  const pt = ptypeOf(sec);
  return { p, it, sec: sec === 'tech' ? 'tech' : pt && BY_TYPE[p.id] ? `content.${pt}` : 'content' };
}
function itemEditHtml(r) {
  const { p, it, sec } = answerTarget(r);
  const e = { sec, it, key: `${sec}:${it.id}`, cell: answer(p, sec, it.id), variant: false, edit: sourceEdit(p, sec, it.id), own: !!ownEdit(p, sec, it.id) };
  return `<div class="req-edit" data-req-edit="${esc(r.id)}">${editRowHtml(e, p)}</div>`;
}
function closeItemEdit(id) { R.fixing.delete(id); renderRequests(); }

// Form: platform, item and (for Content items on platforms with page types) page type
function fillReqSelects() {
  const f = $('#req-form');
  f.platform.innerHTML = '<option value="">Any / not specific</option>' + P.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  f.item.innerHTML = '<option value="">Not specific</option>' + ['content', 'tech'].map((sec) =>
    `<optgroup label="${SEC_LABEL[sec]}">${itemsFor(sec).map((it) => `<option value="${sec}:${it.id}">${esc(plain(it.label))}</option>`).join('')}</optgroup>`).join('');
  f.ptype.innerHTML = '<option value="">All page types</option>' + Object.entries(PTYPES).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('');
  $('#req-type-filter').innerHTML = '<option value="">All types</option>' + Object.entries(REQ_TYPES).map(([k, l]) => `<option value="${k}">${l}</option>`).join('');
}
function syncReqFields() {
  const f = $('#req-form'), t = R.formType;
  $('#req-platform-wrap').hidden = t === 'platform';
  $('#req-item-wrap').hidden = t !== 'correction';
  $('#req-ptype-wrap').hidden = !(t === 'correction' && f.item.value.startsWith('content:') && BY_TYPE[f.platform.value]);
}
function setReqType(t) {
  R.formType = t;
  document.querySelectorAll('#req-type [data-type]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.type === t)));
  syncReqFields();
}
function openReqForm(pre = {}) {
  const f = $('#req-form');
  f.reset();
  f.hidden = false;
  f.platform.value = pre.platform || '';
  const [sec, id] = String(pre.item || '').split(':');
  f.item.value = id ? `${sec.startsWith('content') ? 'content' : 'tech'}:${id}` : '';
  f.ptype.value = ptypeOf(sec || '');
  setReqType(pre.type || 'correction');
  if (pre.title) f.title.value = pre.title;
  f.scrollIntoView({ block: 'nearest' });
  f.title.focus();
  f.title.setSelectionRange(f.title.value.length, f.title.value.length);
}
function closeReqForm() { const f = $('#req-form'); f.reset(); f.hidden = true; }

async function postRequest(f) {
  const t = R.formType;
  let item = t === 'correction' ? f.item.value : '';
  if (item.startsWith('content:') && !$('#req-ptype-wrap').hidden && f.ptype.value) item = item.replace('content:', `content.${f.ptype.value}:`);
  const body = { type: t, title: f.title.value.trim(), details: f.details.value.trim(), platform: t === 'platform' ? '' : f.platform.value, item };
  if (!body.title) { f.title.focus(); return toast('Add a title'); }
  const btn = f.querySelector('[type="submit"]');
  btn.disabled = true;
  const { data, error } = await sb.from('requests').insert(body).select().single();
  btn.disabled = false;
  if (error) return toast(failText(error, 'Couldn’t post'));
  R.reqs.set(data.id, data);
  // Posting counts as your upvote.
  const v = await sb.from('votes').insert({ request_id: data.id });
  if (!v.error) addVote(data.id, R.me);
  closeReqForm();
  R.filter = 'open'; R.sort = 'new'; $('#req-sort').value = 'new';
  renderRequests();
  toast('Request posted');
}
function addVote(req, uid) { if (!R.votes.has(req)) R.votes.set(req, new Set()); R.votes.get(req).add(uid); }
async function toggleVote(id) {
  if (R.busy.has(id)) return;
  R.busy.add(id);
  const had = !!(R.votes.get(id) && R.votes.get(id).has(R.me));
  const { error } = had
    ? await sb.from('votes').delete().match({ request_id: id, user_id: R.me })
    : await sb.from('votes').insert({ request_id: id });
  R.busy.delete(id);
  if (error && !/duplicate/i.test(error.message)) return toast(failText(error, 'Couldn’t save your upvote'));
  if (had) R.votes.get(id).delete(R.me); else addVote(id, R.me);
  renderRequests();
}

// "Suggest fix" on an answer card: a correction request for that platform, item and page type
const suggestLink = (e) => `<button type="button" class="suggest" data-suggest="${e.key}" title="Suggest a correction to this answer">Suggest a fix</button>`;
$('#panel').addEventListener('click', (e) => {
  const s = e.target.closest('[data-suggest]');
  if (!s) return;
  const p = P.find((x) => x.id === state.platform);
  showView('requests');
  openReqForm({ type: 'correction', platform: p.id, item: s.dataset.suggest, title: `${reqTarget({ platform: p.id, item: s.dataset.suggest })}: ` });
});

$('#req-new').addEventListener('click', () => openReqForm());
$('#req-cancel').addEventListener('click', closeReqForm);
$('#req-type').addEventListener('click', (e) => { const b = e.target.closest('[data-type]'); if (b) setReqType(b.dataset.type); });
$('#req-form').addEventListener('change', (e) => { if (e.target.name === 'item' || e.target.name === 'platform') syncReqFields(); });
$('#req-form').addEventListener('submit', (e) => { e.preventDefault(); postRequest(e.target); });
$('#req-filter').addEventListener('click', (e) => { const b = e.target.closest('[data-filter]'); if (b) { R.filter = b.dataset.filter; renderRequests(); } });
$('#req-type-filter').addEventListener('change', (e) => { R.type = e.target.value; renderRequests(); });
$('#req-sort').addEventListener('change', (e) => { R.sort = e.target.value; renderRequests(); });
$('#req-list').addEventListener('click', async (e) => {
  const v = e.target.closest('[data-vote]');
  if (v) return toggleVote(v.dataset.vote);
  const th = e.target.closest('[data-thread]');
  if (th) {
    const id = th.dataset.thread;
    if (R.threads.has(id)) R.threads.delete(id); else R.threads.add(id);
    renderRequests();
    if (R.threads.has(id)) focusComment(id);
    return;
  }
  const fx = e.target.closest('[data-fix]');
  if (fx) {
    const id = fx.dataset.fix;
    if (R.fixing.has(id)) R.fixing.delete(id); else R.fixing.add(id);
    renderRequests();
    document.querySelector(`[data-req-edit="${CSS.escape(id)}"] [name="mark"]`)?.focus();
    return;
  }
  const box = e.target.closest('[data-req-edit]');
  if (box && e.target.closest('[data-cancel]')) return closeItemEdit(box.dataset.reqEdit);
  const rs = box && e.target.closest('[data-reset]');
  if (rs) {
    if (await saveEdit(rs.dataset.reset, null, rs, answerTarget(R.reqs.get(box.dataset.reqEdit)).p)) closeItemEdit(box.dataset.reqEdit);
    return;
  }
  const dc = e.target.closest('[data-del-comment]');
  if (dc) {
    if (!confirm('Delete this comment?')) return;
    const id = dc.dataset.delComment;
    const { error } = await sb.from('comments').delete().eq('id', id);
    if (error) return toast(failText(error, 'Couldn’t delete'));
    R.comments.forEach((list, k) => R.comments.set(k, list.filter((c) => c.id !== id)));
    renderRequests(); toast('Comment deleted');
    return;
  }
  const d = e.target.closest('[data-del]');
  if (d && confirm('Delete this request for everyone?')) {
    const id = d.dataset.del;
    const { error } = await sb.from('requests').delete().eq('id', id);
    if (error) return toast(failText(error, 'Couldn’t delete'));
    R.reqs.delete(id); R.votes.delete(id); renderRequests(); toast('Request deleted');
  }
});
$('#req-list').addEventListener('submit', async (e) => {
  const f = e.target.closest('[data-comment-form]');
  if (f) { e.preventDefault(); postComment(f); return; }
  const box = e.target.closest('[data-req-edit]');
  if (!box) return;
  e.preventDefault();
  const id = box.dataset.reqEdit, form = e.target;
  if (await saveEdit(form.dataset.form, form, form.querySelector('[type="submit"]'), answerTarget(R.reqs.get(id)).p)) closeItemEdit(id);
});
$('#req-list').addEventListener('input', (e) => {
  const f = e.target.closest('[data-comment-form]');
  if (f) R.drafts.set(f.dataset.commentForm, e.target.value);
});
$('#req-list').addEventListener('keydown', (e) => {
  const f = e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.closest('[data-comment-form]');
  if (f) { e.preventDefault(); f.requestSubmit(); }
});
$('#req-list').addEventListener('change', async (e) => {
  const s = e.target.closest('[data-status]');
  if (!s) return;
  const id = s.dataset.status, body = { status: s.value, status_at: new Date().toISOString() };
  s.disabled = true;
  const { error } = await sb.from('requests').update(body).eq('id', id);
  s.disabled = false;
  if (error) return toast(failText(error, 'Couldn’t change the status'));
  Object.assign(R.reqs.get(id), body);
  renderRequests();
  toast(`Marked ${REQ_STATUS[s.value]}`);
});

// ---------- Sign-in and loading ----------
const CONFIGURED = !/YOUR-/.test(SUPABASE_URL + SUPABASE_ANON_KEY);
const sb = CONFIGURED && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } })
  : null;

// One screen at a time until the person is an approved member.
function gate(kind, opts = {}) {
  $('#side').hidden = true;
  $('#main').hidden = true;
  $('#gate').hidden = false;
  const who = opts.user ? `<div class="person gate-person">${opts.user.avatar ? `<img src="${esc(opts.user.avatar)}" alt="" width="36" height="36" referrerpolicy="no-referrer">` : '<span class="avatar-blank" aria-hidden="true"></span>'}<div><b>${esc(opts.user.name || 'Discord user')}</b><small>Signed in with Discord</small></div></div>` : '';
  const screens = {
    loading: '<p class="muted">Loading…</p>',
    signin: `<h2>Team sign-in</h2>
      <p class="muted">Platform Playbook is for the team. Sign in with your Discord account. You don’t need to be in any particular server.</p>
      <button type="button" class="btn discord" data-act="signin"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M20.3 4.4A19.6 19.6 0 0 0 15.4 3l-.6 1.3a18.2 18.2 0 0 0-5.6 0L8.6 3a19.6 19.6 0 0 0-4.9 1.4C.6 9 0 13.5.3 17.9A19.8 19.8 0 0 0 6.3 21l1.3-2.1c-.7-.3-1.4-.6-2-1l.5-.4a14 14 0 0 0 11.8 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.7 19.7 0 0 0 6-3.1c.4-5.1-.8-9.6-3.4-13.5ZM8.5 15.2c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.1 1.1 2.1 2.4-.9 2.4-2.1 2.4Zm7 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.1 1.1 2.1 2.4-.9 2.4-2.1 2.4Z"/></svg>Sign in with Discord</button>`,
    pending: `<h2>Almost in</h2>${who}
      <p class="muted">You’re not on the team list yet. Your request is waiting for an admin to approve it. Once you’re approved, refresh this page.</p>
      <div class="edit-actions"><button type="button" class="btn primary" data-act="recheck">Check again</button><button type="button" class="btn" data-act="signout">Use a different account</button></div>`,
    setup: `<h2>Not connected yet</h2>
      <p class="muted">The database isn’t set up. Add the Supabase project URL and anon key at the top of the script (see the README).</p>`,
    error: `<h2>Something went wrong</h2><p class="muted">${esc(opts.message || 'Please try again.')}</p>
      <div class="edit-actions"><button type="button" class="btn primary" data-act="recheck">Try again</button>${opts.user ? '<button type="button" class="btn" data-act="signout">Sign out</button>' : ''}</div>`,
  };
  $('#gate .gate-card').innerHTML = screens[kind];
}
$('#gate').addEventListener('click', async (e) => {
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'signin') {
    const { error } = await sb.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: location.origin + location.pathname } });
    if (error) gate('error', { message: 'Couldn’t reach Discord. Try again.' });
  }
  if (act === 'recheck') boot();
  if (act === 'signout') signOut();
});
async function signOut() { clearCache(); await sb.auth.signOut(); location.replace(location.pathname); }
$('#signout').addEventListener('click', signOut);

function identity(user) {
  const m = user.user_metadata || {};
  return { name: (m.custom_claims && m.custom_claims.global_name) || m.full_name || m.name || '', avatar: m.avatar_url || '' };
}

// Team edits, requests, upvotes and names: everything members can read besides the content itself
let lastLoad = 0, started = false;
function fetchShared() {
  return Promise.all([
    sb.from('edits').select('*'),
    sb.from('requests').select('*').order('at', { ascending: false }).limit(1000),
    sb.from('votes').select('request_id,user_id').limit(5000),
    sb.from('members').select('user_id,name,avatar,role,discord_id,approved_at'),
    sb.from('comments').select('*').order('at').limit(5000),
    sb.from('platform_notes').select('*'),
  ]).then(([edits, reqs, votes, members, comments, notes]) => {
    const err = edits.error || reqs.error || votes.error || members.error;
    if (err) throw err;
    // Comments stay hidden (null) until the comments table exists, so the page still works without it.
    return { edits: edits.data, reqs: reqs.data, votes: votes.data, members: members.data, comments: comments.error ? null : comments.data, notes: notes.error ? null : notes.data };
  });
}
function applyShared(x) {
  EDITS.clear();
  x.edits.forEach((e) => EDITS.set(editKey(e.platform, e.sec, e.item), e));
  R.reqs = new Map(x.reqs.map((r) => [r.id, r]));
  R.votes = new Map();
  x.votes.forEach((v) => addVote(v.request_id, v.user_id));
  R.members = new Map(x.members.map((m) => [m.user_id, m]));
  R.notesOn = Array.isArray(x.notes);   // hidden until the platform_notes table exists
  NOTES.clear();
  (x.notes || []).forEach((n) => NOTES.set(n.platform, n));
  R.commentsOn = Array.isArray(x.comments);
  R.comments = new Map();
  (x.comments || []).forEach(addComment);
}
async function loadShared() { applyShared(await fetchShared()); lastLoad = Date.now(); }
function useContent(d) {
  ({ ITEMS, CONTENT_ITEMS, VERDICT, SCOPE, P, CONTENT, VARIANTS, HOW, WARN, H1_FIX, PTYPES, BY_TYPE, GUIDES, HOW_GUIDES } = d);
  DATA_AT = d.AT || null;
  // Alphabetical, so a platform is quick to find; Headless CMS last, as it's a category, not a product
  ALL_P = [...P].sort((a, b) => (a.id === 'headless') - (b.id === 'headless') || a.name.localeCompare(b.name));
  P = ALL_P.filter((p) => !p.hidden);
  HOW_UNVERIFIED = new Set(d.HOW_UNVERIFIED || []);
}

// Last loaded copy, kept in this browser so the page opens instantly next time while fresh
// data loads behind it. Only for signed-in members; cleared on sign-out or losing access.
const CACHE_KEY = 'ic-defaults-cache';
function readCache(uid) {
  try { const c = JSON.parse(localStorage.getItem(CACHE_KEY)); return c && c.uid === uid ? c : null; } catch { return null; }
}
function writeCache(c) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {} }
function clearCache() { try { localStorage.removeItem(CACHE_KEY); } catch {} }

async function boot() {
  if (!CONFIGURED) return gate('setup');
  if (!sb) return gate('error', { message: 'Couldn’t load the sign-in library. Check your connection and reload.' });
  gate('loading');
  const { data: { session } } = await sb.auth.getSession();
  if (/[?&](code|error)=/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);
  if (!session) { clearCache(); return gate('signin'); }
  const user = session.user;
  const me = identity(user);
  R.me = user.id;
  const cached = readCache(user.id);
  if (cached) {
    R.manage = canEditAnswers = cached.role === 'admin';
    useContent(cached.data);
    applyShared(cached.shared);
    startApp(me);
  }
  // Access check, answers and team data all at once (one round trip instead of three)
  const [mem, app, shared] = await Promise.all([
    sb.from('members').select('role').eq('user_id', user.id).maybeSingle(),
    sb.from('app_data').select('data,updated_at').eq('id', 'defaults').maybeSingle(),
    fetchShared().catch((error) => ({ error })),
  ]);
  if (mem.error) return cached ? toast('Couldn’t refresh. Showing the last loaded answers.') : gate('error', { user: me, message: 'Couldn’t check your access. Try again in a moment.' });
  if (!mem.data) {
    if (cached) { clearCache(); return location.reload(); }
    // Not on the team: record (or keep) the access request so an admin can approve it.
    await sb.from('access_requests').upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });
    return gate('pending', { user: me });
  }
  if (app.error || !app.data || shared.error) {
    if (cached) return toast('Couldn’t refresh. Showing the last loaded answers.');
    if (shared.error && !app.error && app.data) return gate('error', { user: me, message: 'Couldn’t load the team’s data. Try again.' });
    return gate('error', { user: me, message: app.error ? 'Couldn’t load the answers. Try again.' : 'The Playbook’s answers are missing from the database.' });
  }
  R.manage = canEditAnswers = mem.data.role === 'admin';
  const data = { ...app.data.data, AT: app.data.updated_at };
  useContent(data);
  applyShared(shared);
  lastLoad = Date.now();
  writeCache({ uid: user.id, role: mem.data.role, data, shared });
  startApp(me);
}

function startApp(me) {
  $('#gate').hidden = true;
  $('#side').hidden = false;
  $('#main').hidden = false;
  $('#user-chip').hidden = false;
  $('#viewnav').hidden = false;
  $('#user-name').textContent = me.name || 'Signed in';
  if (me.avatar) { $('#user-avatar').src = me.avatar; $('#user-avatar').hidden = false; }
  $('#team-btn').hidden = !R.manage;
  $('#pk-btn').hidden = !R.manage;   // with Team, so the bar doesn't shift; loadPicker hides it if the table isn't there
  if (started) {
    // Fresh data after opening from the saved copy (or after a retry): redraw everything that uses it
    renderGuideList();
    if ($('#req-form').hidden) fillReqSelects();
    if (P.some((p) => p.id === state.platform)) refresh();
    else select(P[0].id);   // the platform being viewed was removed
    renderRequests();
    if (R.manage) { loadTeam(); loadPicker(); }
    return;
  }
  started = true;
  renderGuideList();
  fillReqSelects();
  // Open what the link names (#shopify, #shopify/tech/footer…), else the last platform viewed.
  const h = location.hash.slice(1), link = parseLink(location.hash);
  let start = link && link.platform;
  if (!start) { try { start = localStorage.getItem('tech-defaults-platform'); } catch {} }
  if (!P.some((p) => p.id === start)) start = P[0].id;
  try {
    const v = JSON.parse(localStorage.getItem('ic-defaults-view') || '{}');
    if (['tech', 'content'].includes(v.sec)) state.sec = v.sec;
    state.onlyCheck = !!v.onlyCheck;
    state.showHow = !!v.showHow;
    if (Object.hasOwn(PTYPES, v.ptype)) state.ptype = v.ptype;
  } catch {}
  if (link) openLink(link); else select(start);
  renderRequests();
  if (R.manage) { loadTeam(); loadPicker(); }
  if (h === 'team' || h === 'requests') showView(h);
  if (/^picker(\/|$)/.test(h)) openPickerLink(h);
  addEventListener('hashchange', () => {
    const k = location.hash.slice(1), l = parseLink(location.hash);
    if (k === 'team' || k === 'requests') showView(k);
    else if (/^picker(\/|$)/.test(k)) openPickerLink(k);
    else if (l) { showView('answers'); openLink(l); }
  });
  // Pick up teammates' edits when coming back to the tab.
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible' || Date.now() - lastLoad < 30000) return;
    try { await loadShared(); refresh(); renderRequests(); if (R.manage) { loadTeam(); loadPicker(); } } catch {}
  });
  goLive();
}

// Live: a teammate's request, upvote, comment, edit or watch-out shows up on every open page within a
// second or so (needs the tables in Supabase's realtime publication: supabase/schema.sql). Any change
// reloads the team data once, with changes that arrive together batched; the redraws keep anything
// being typed. When a dropped connection comes back, it catches up the same way.
async function goLive() {
  if (!sb) return;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return;
  sb.realtime.setAuth(session.access_token);   // so the access rules see who's listening
  let timer = 0, joined = false;
  const changed = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => { try { await loadShared(); refresh(); renderRequests(); } catch {} }, 400);
  };
  const ch = sb.channel('playbook');
  ['requests', 'votes', 'comments', 'edits', 'platform_notes'].forEach((table) =>
    ch.on('postgres_changes', { event: '*', schema: 'public', table }, changed));
  ch.subscribe((status) => { if (status === 'SUBSCRIBED') { if (joined) changed(); joined = true; } });
}

if (sb) sb.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') { clearCache(); location.replace(location.pathname); } });
boot();
