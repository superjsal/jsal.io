// CMS Picker: the Find my fit quiz, the platform cards and the platform × item grid, all from data.json
// (answers and profiles, exported by build\playbook.py publish) and quiz.json (the quiz's own values).
(() => {
  const $ = (s) => document.querySelector(s);
  const state = { goal: 'all', compare: new Set(), notes: false, open: new Set() };   // open: platforms expanded in the "Show all" list
  // Short tag wording for the grid and key (data.json keeps the full labels)
  const SHORT = { yes: 'Built in', auto: 'Automatic', plugin: 'Plugin/app', code: 'Needs code', hosting: 'Hosting/DNS', check: 'Unclear', indirect: 'Indirectly', no: 'Not possible' };
  // "What it costs to start": bands from each platform's own pricing page, never a price (not in the key above the table)
  const COST = { free: 'Free to start', low: 'Under $25/mo', mid: '$25–$100/mo', high: 'Over $100/mo', software: 'Free software + hosting', na: 'Not for stores' };
  Object.assign(SHORT, COST);
  // Scope as a symbol, explained once in the key
  // Only the exceptions are marked (a short word after the tag); settled answers have no mark.
  // The longer wording is for the tooltip.
  const SCOPE = { V: ['varies', 'Varies by site: depends on the plan, theme or setup'], C: ['not verified', 'Not checked against the platform’s own docs yet'] };
  // A note that only repeats its tag isn't shown ("Yes", "Yes, with an SEO plugin", "Automatic"…)
  const GENERIC = /^(yes|no|check|automatic|built in)$|^yes, with (an? )?(seo |redirect )?(plugin|module|extension|app|custom code)$/i;
  // With "Show all", the grid starts with these; any other choice starts with the platforms that fit it
  const DEFAULT_COMPARE = ['wordpress', 'shopify', 'wix', 'squarespace'];
  let data;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Platform logos (Simple Icons, CC0, or uploaded by an admin) drawn in the text colour via a mask, so
  // they match the theme; data.json names the file. Without one (Magento, Duda, headless): a letter badge.
  const BADGE = { magento: 'M', duda: 'D', headless: '{ }' };
  function logo(p) {
    if (p.logo) {
      const s = el('span', 'logo');
      s.style.setProperty('--logo', `url("${p.logo}")`);
      s.setAttribute('aria-hidden', 'true');
      return s;
    }
    const b = el('span', 'logo badge', BADGE[p.id] || p.name[0]);
    b.setAttribute('aria-hidden', 'true');
    return b;
  }

  // "What are you building?": each profile lists the goals it suits (build\cms-picker.json)
  const GOALS = [['all', 'Show all'], ['store', 'Online store'], ['site', 'Business or marketing site'], ['content', 'Blog or content'], ['custom', 'Custom build with developers']];
  const fits = (p) => state.goal === 'all' || ((p.profile && p.profile.goals) || []).includes(state.goal);

  function setGoal(g) {
    state.goal = g;
    state.pick = null;
    state.compare = new Set(g === 'all' ? DEFAULT_COMPARE : data.platforms.filter(fits).map((p) => p.id));
    state.touched = false;
    renderCards();
    render();
  }
  function toggleCompare(id) {
    state.pick = null;
    state.touched = true;
    if (state.compare.has(id)) state.compare.delete(id);
    else { state.compare.add(id); window.jsalUsed?.(); window.jsalAchieve?.('compare'); window.jsalTrack?.('compare_add', { platform: id }); }   // achievements and GA4 event (/nav.js)
    renderCards();
    render();
  }

  function renderCards() {
    const cards = $('#cards');
    cards.replaceChildren();
    cards.classList.toggle('list', state.goal === 'all');
    document.querySelectorAll('#types button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.g === state.goal)));
    const shown = data.platforms.filter((p) => p.profile && fits(p));
    $('#count').textContent = state.goal === 'all' ? `All ${shown.length} platforms. Open one for the details, or pick what you’re building.` : `${shown.length} of ${data.platforms.length} platforms fit`;
    shown.forEach((p) => {
      const c = el('article', 'card'), pr = p.profile;
      const top = el('div', 'ctop');
      top.append(logo(p), el('h3', null, p.name));
      c.append(top, el('p', 'ptype', pr.type));
      if (pr.summary) c.append(el('p', 'summary', pr.summary));
      if (pr.tags && pr.tags.length) {
        const t = el('div', 'ktags');
        t.setAttribute('role', 'group');
        t.setAttribute('aria-label', 'Known for');
        pr.tags.forEach((x) => t.append(el('span', 'ktag', x)));
        c.append(t);
      }
      if (pr.aiTags && pr.aiTags.length) {
        const a = el('div', 'aitags');
        a.append(el('span', 'ailabel', 'AI'));
        pr.aiTags.forEach((x) => a.append(el('span', 'aitag', x)));
        c.append(a);
      }
      // The facts panel: who looks after hosting and updates, what you can take with you, and when
      // to skip it (the summary above already says who it suits)
      const facts = [['Hosting and updates', pr.hosting, 'r-host'], ['If you leave', pr.export, 'r-exit'], ['Not ideal if', pr.lessSuited, 'r-skip']];
      if (facts.some(([, v]) => v && v.length)) {
        const run = el('dl', 'run');
        facts.forEach(([t, v, cls]) => {
          if (!v || !v.length) return;
          const d = el('div', cls), dd = el('dd');
          [].concat(v).forEach((x) => dd.append(el('span', null, x)));
          d.append(el('dt', null, t), dd);
          run.append(d);
        });
        c.append(run);
      }
      const foot = el('div', 'cfoot');
      const on = state.compare.has(p.id);
      const cmp = el('button', 'chip cmp', on ? '✓ Comparing' : '+ Add to compare');
      cmp.type = 'button';
      cmp.setAttribute('aria-pressed', String(on));
      cmp.setAttribute('aria-label', `${on ? 'Remove' : 'Add'} ${p.name} ${on ? 'from' : 'to'} the SEO comparison`);
      cmp.addEventListener('click', () => toggleCompare(p.id));
      // Its own page: each SEO answer with where to find the setting (written by the publish)
      const seo = el('a', 'cseo', 'SEO settings');
      seo.href = `${p.id}/`;
      Object.assign(seo.dataset, { track: 'platform_page_open', trackPlatform: p.id, trackFrom: 'card' });   // GA4 event (/nav.js)
      seo.setAttribute('aria-label', `${p.name} SEO settings, and where to find each one`);
      seo.append(el('span', null, ' →'));
      seo.lastChild.setAttribute('aria-hidden', 'true');
      foot.append(cmp, seo);
      c.append(foot);
      if (state.goal === 'all') shortCard(c, p);
      cards.append(c);
    });
    updateBar();
  }
  // "Show all": one line per platform (name and who it's for), so the first look isn't 13 full cards.
  // The name is a button that opens the rest of the card in place.
  function shortCard(c, p) {
    const open = state.open.has(p.id);
    const body = el('div', 'cbody');
    body.id = `cb-${p.id}`;
    body.hidden = !open;
    body.append(...[...c.children].filter((x) => !x.matches('.ctop, .summary')));
    const b = el('button', 'mini-btn'), txt = el('span', 'mini-t');
    b.type = 'button';
    b.setAttribute('aria-expanded', String(open));
    b.setAttribute('aria-controls', body.id);
    // The name and summary sit on their own lines, so screen readers ran them together ("WordPressFor content…"):
    // a hidden ": " (no-break space, which survives) between them
    const sum = (p.profile && p.profile.summary) || '';
    txt.append(el('span', 'mini-name', p.name));
    if (sum) txt.append(el('span', 'sr-only', ': '), el('span', 'mini-sum', sum));
    const chev = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chev.setAttribute('viewBox', '0 0 24 24');
    chev.setAttribute('aria-hidden', 'true');
    chev.innerHTML = '<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    b.append(logo(p), txt, chev);
    b.addEventListener('click', () => {
      if (state.open.has(p.id)) state.open.delete(p.id); else { state.open.add(p.id); window.jsalUsed?.(); }   // opening a platform counts as use (/nav.js)
      renderCards();
      document.querySelector(`[aria-controls="cb-${p.id}"]`)?.focus({ preventScroll: true });
    });
    const h = el('h3', 'mini-h');
    h.append(b);
    c.classList.add('mini');
    c.classList.toggle('open', open);
    c.replaceChildren(h, body);
  }

  // Compare bar: the platforms being compared (newly added ones pop in), and a link to the table
  let barShown = new Set();
  function updateBar() {
    const picked = data.platforms.filter((p) => state.compare.has(p.id));
    // Until the set is changed, "Show all" starts with popular picks, and the bar says so
    $('#cbar-count').textContent = state.goal === 'all' && !state.touched ? `${picked.length} popular picks to start` : `Comparing ${picked.length}`;
    $('#cbar').setAttribute('aria-label', `Your comparison: ${picked.map((p) => p.name).join(', ') || 'none'}`);
    const room = innerWidth < 500 ? 4 : 7;
    const logos = $('#cbar-logos');
    logos.replaceChildren();
    picked.slice(0, room).forEach((p) => {
      const l = logo(p);
      if (barShown.size && !barShown.has(p.id)) l.classList.add('pop');
      logos.append(l);
    });
    if (picked.length > room) logos.append(el('span', 'cbar-more', `+${picked.length - room}`));
    barShown = new Set(picked.map((p) => p.id));
    placeBar();
  }
  // Shown while the cards are on screen and the table isn't yet, and only with something picked
  // The table's header row: lifted (line and shadow) only while it's pinned to the top of the window
  function liftHead() {
    const h = $('#thead');
    h.classList.toggle('stuck', !h.hidden && h.getBoundingClientRect().top <= 0 && $('#seo .scroll').getBoundingClientRect().bottom > h.offsetHeight);
  }
  function placeBar() {
    const fit = $('#fit').getBoundingClientRect(), table = $('#seo .scroll').getBoundingClientRect();
    const on = state.compare.size > 0 && fit.top < innerHeight * 0.5 && table.top > innerHeight - 60;
    $('#cbar').classList.toggle('show', on);
    document.body.classList.toggle('cbar-on', on);
  }

  function render() {
    const plats = data.platforms.filter((p) => state.compare.has(p.id));
    const items = data.items;
    document.querySelectorAll('.chip[data-pid]').forEach((b) => b.setAttribute('aria-pressed', String(state.compare.has(b.dataset.pid))));

    const grid = $('#grid'), ghead = $('#ghead');
    grid.replaceChildren();
    ghead.replaceChildren();
    [grid, ghead].forEach((g) => g.style.setProperty('--n', Math.max(plats.length, 1)));
    $('#thead').hidden = !plats.length;
    grid.classList.toggle('compact', !state.notes);
    if (!plats.length) {
      grid.append(el('p', 'empty', 'No platforms selected. Add some above, or from the cards.'));
      return;
    }
    const head = el('div', 'row head');
    head.append(el('div', 'item', 'Can you…'));
    plats.forEach((p, i) => {
      const c = el('div', `hcell${p.id === state.pick ? ' col-pick' : ''}`);
      c.dataset.col = i;
      c.append(el('span', 'pname', p.name));
      if (p.profile) c.append(el('span', 'htype', p.profile.type));
      head.append(c);
    });
    ghead.append(head);
    $('#thead').scrollLeft = $('#seo .scroll').scrollLeft;
    // A label row where each section starts: Built in, SEO
    const groups = Object.fromEntries((data.groups || []).map((g) => [g.id, g]));
    let lastGroup = null;
    items.forEach((it) => {
      if (it.group !== lastGroup && groups[it.group]) {
        const g = groups[it.group];
        const gr = el('div', 'row group');
        gr.append(el('span', null, `${g.title}${g.asOf ? ` · as of ${g.asOf}` : ''}`));
        grid.append(gr);
      }
      lastGroup = it.group;
      const row = el('div', 'row');
      const label = el('div', 'item', it.label);
      if (it.term) label.append(el('small', 'term', it.term));   // the SEO name, small, under the plain question
      row.append(label);
      plats.forEach((p, i) => {
        const c = data.answers[p.id][it.id], cell = el('div', `cell${p.id === state.pick ? ' col-pick' : ''}`);
        cell.dataset.col = i;
        const [word, scope] = SCOPE[c.scope] || ['', ''];
        const line = el('span', 'line');
        line.append(el('span', `tag ${c.verdict}`, SHORT[c.verdict] || data.verdicts[c.verdict] || c.verdict));
        if (word) {
          const s = el('span', 'sc', word);
          if (state.notes) s.title = scope;        // with notes off, the cell's tooltip says it instead
          cell.dataset.scope = scope;
          line.append(s);
        }
        cell.append(el('span', 'plat', p.name), line);
        if (c.mark && !GENERIC.test(c.mark.trim())) {
          cell.append(el('span', 'mark', c.mark));
          cell.dataset.note = c.mark;
        }
        if (c.where) {   // where to find the setting, e.g. "Pages → page settings → SEO"
          cell.append(el('span', 'where', `Where: ${c.where}`));
          cell.dataset.where = c.where;
        }
        if (!state.notes && (cell.dataset.note || cell.dataset.scope || cell.dataset.where)) cell.tabIndex = 0;   // notes off: Tab to a cell opens its note too
        row.append(cell);
      });
      grid.append(row);
    });
  }

  function build() {
    const plats = $('#plats');
    data.platforms.forEach((p) => {
      const b = el('button', 'chip', p.name);
      b.type = 'button';
      b.dataset.pid = p.id;
      b.addEventListener('click', () => toggleCompare(p.id));
      plats.append(b);
    });
    const all = el('button', 'chip-link', 'All');
    all.type = 'button';
    all.addEventListener('click', () => { data.platforms.forEach((p) => state.compare.add(p.id)); state.touched = true; renderCards(); render(); });
    plats.append(all);
    const none = el('button', 'chip-link', 'Deselect all');
    none.type = 'button';
    none.addEventListener('click', () => { state.compare.clear(); state.touched = true; renderCards(); render(); });
    plats.append(none);

    const types = $('#types');
    GOALS.forEach(([g, label]) => {
      const b = el('button', 'chip', label);
      b.type = 'button';
      b.dataset.g = g;
      b.addEventListener('click', () => setGoal(g));
      types.append(b);
    });

    // Keep the pinned header in line with the table when it scrolls sideways
    $('#seo .scroll').addEventListener('scroll', (e) => { $('#thead').scrollLeft = e.target.scrollLeft; }, { passive: true });
    // The column under the pointer or keyboard focus is marked, header included, so a platform's answers
    // are easy to follow down the table
    // (only with two or more columns: with one, every answer is already that platform's)
    const markCol = (i) => {
      if (state.compare.size < 2) i = null;
      document.querySelectorAll('#seo [data-col]').forEach((c) => c.classList.toggle('col-on', c.dataset.col === i));
    };
    ['#grid', '#ghead'].forEach((sel) => {
      $(sel).addEventListener('pointerover', (e) => markCol(e.target.closest('[data-col]')?.dataset.col ?? null));
      $(sel).addEventListener('pointerleave', () => markCol(null));
    });
    $('#grid').addEventListener('focusin', (e) => markCol(e.target.closest('[data-col]')?.dataset.col ?? null));
    $('#grid').addEventListener('focusout', () => markCol(null));
    // Hero: platform count, when the answers were last checked, and a few real rows of the table
    document.querySelectorAll('.n-plats').forEach((n) => { n.textContent = data.platforms.length; });
    const asOf = data.asOf;
    if (asOf) $('#asof').textContent = asOf;
    const PEEK_PLATS = ['wordpress', 'shopify', 'wix'].filter((id) => data.answers[id]);
    const PEEK_ROWS = [['blog', 'Run a blog'], ['store', 'Sell online'], ['gsc404', 'Keep old links'], ['design', 'Custom design']]   // short, so three columns fit on a phone
      .filter(([id]) => data.items.some((i) => i.id === id));
    const PEEK_SHORT = { plugin: 'Plugin', no: 'No' };   // shorter still, so three columns fit on a phone
    const peek = $('#peek');
    peek.replaceChildren();                     // drop the plain-HTML copy (build\playbook.py prerender)
    const prow = () => { const r = el('div'); r.setAttribute('role', 'row'); return r; };
    const pcell = (r, role, x) => { const c = typeof x === 'string' ? el('span', null, x) : x; c.setAttribute('role', role); r.append(c); };
    const head = prow();
    pcell(head, 'columnheader', '');
    PEEK_PLATS.forEach((id) => pcell(head, 'columnheader', data.platforms.find((p) => p.id === id).name));
    peek.append(head);
    PEEK_ROWS.forEach(([id, label]) => {
      const r = prow();
      pcell(r, 'rowheader', label);
      PEEK_PLATS.forEach((pid) => {
        const v = data.answers[pid][id].verdict, c = el('span');
        c.append(el('span', `tag ${v}`, PEEK_SHORT[v] || SHORT[v] || v));
        pcell(r, 'cell', c);
      });
      peek.append(r);
    });
    $('#peek-cap').textContent = `${PEEK_ROWS.length} of ${data.items.length} rows, from the full table below`;
    // Notes off: hovering, tapping or tabbing to an answer shows its note and scope in a tooltip at once.
    // It sits outside the table, fixed to the window, so the table's scroll box can't clip it. Screen
    // readers get the note from the cell itself (.mark, hidden only visually), so the tooltip is aria-hidden.
    const tip = $('#tip');
    let tipCell = null;
    const hideTip = () => { tip.hidden = true; tipCell = null; };
    const showTip = (cell) => {
      if (cell === tipCell) return;
      if (state.notes || !cell || !(cell.dataset.note || cell.dataset.scope || cell.dataset.where)) { hideTip(); return; }
      tipCell = cell;
      tip.replaceChildren();
      if (cell.dataset.note) tip.append(el('span', null, cell.dataset.note));
      if (cell.dataset.where) tip.append(el('small', 'where', `Where: ${cell.dataset.where}`));
      if (cell.dataset.scope) tip.append(el('small', null, cell.dataset.scope));
      tip.hidden = false;
      const r = cell.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
      tip.style.left = `${Math.max(8, Math.min(r.left + 8, innerWidth - w - 8))}px`;
      tip.style.top = `${r.bottom + h + 8 < innerHeight ? r.bottom - 4 : r.top - h + 4}px`;
    };
    $('#grid').addEventListener('pointerover', (e) => showTip(e.target.closest('.cell')));
    $('#grid').addEventListener('focusin', (e) => showTip(e.target.closest('.cell')));
    $('#grid').addEventListener('focusout', hideTip);
    $('#grid').addEventListener('keydown', (e) => { if (e.key === 'Escape') hideTip(); });
    $('#grid').addEventListener('pointerleave', hideTip);
    addEventListener('scroll', hideTip, { passive: true });
    $('#seo .scroll').addEventListener('scroll', hideTip, { passive: true });
    document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#grid')) hideTip(); });

    let barTick = false;
    addEventListener('scroll', () => {
      if (barTick) return;
      barTick = true;
      requestAnimationFrame(() => { barTick = false; placeBar(); liftHead(); });
    }, { passive: true });
    addEventListener('resize', updateBar, { passive: true });

    // Back to top, once the hero is out of view
    const totop = $('#totop');
    new IntersectionObserver(([e]) => totop.classList.toggle('show', !e.isIntersecting)).observe($('.hero'));
    totop.addEventListener('click', () => scrollTo({ top: 0 }));   // smooth via scroll-behavior in shell.css

    // "Show notes" (remembered in this browser). Off by default: just the tags, so the table can be
    // scanned; each note is still in the cell's tooltip.
    const notes = $('#notes');
    try { state.notes = localStorage.getItem('cms-picker-notes') === 'on'; } catch (e) { /* storage blocked: notes stay off */ }
    notes.setAttribute('aria-pressed', String(state.notes));
    notes.addEventListener('click', () => {
      state.notes = !state.notes;
      hideTip();
      notes.setAttribute('aria-pressed', String(state.notes));
      try { localStorage.setItem('cms-picker-notes', state.notes ? 'on' : 'off'); } catch (e) { /* not remembered */ }
      render();
    });
    // Key: only the tags the table actually uses
    const used = new Set(Object.values(data.answers).flatMap((a) => Object.values(a).map((c) => c.verdict)));
    const legend = $('#legend');
    Object.keys(SHORT).filter((k) => used.has(k) && !(k in COST)).forEach((k) => legend.append(el('span', `tag ${k}`, SHORT[k])));
    // The two words that follow a tag, explained where the tags are (not only in the note under the table)
    Object.values(SCOPE).forEach(([word, meaning]) => { const s = el('span', 'sc', word); s.title = meaning; legend.append(s); });
    setGoal('all');
    setupQuiz();
  }

  // ---------- Find my fit: a short guided quiz ----------
  // One question at a time, then the best matches. The questions and the scoring live in score.js (shared
  // with the persona tests). The answers stay in the page address, so a result can be shared; nothing is stored.
  const { QUESTIONS, NEUTRAL } = window.cmsScore;
  // Shared result links carry the quiz version (v=2). Links from before versions (no v) are version 1.
  // When the questions change, raise LINK_VERSION and translate older answers in readLink, so links
  // people have already shared keep opening a result rather than an empty quiz.
  const LINK_VERSION = 2;
  // Returns { answers, old } (old: a v1 link, made before some of today's questions), or null.
  function readLink(params) {
    const v = Number(params.get('v') || 1);
    params.delete('v');
    const answers = Object.fromEntries(params);
    if (v === 1 || v === 2) return { answers, old: v === 1 };
    return null;   // a newer version than this page knows: start the quiz fresh
  }
  // Effort, from values already checked: the quiz's ease score and the profile's hosting line
  const SKILL = ['Needs a developer', 'Takes some learning', 'Easy to learn', 'No technical skill needed'];
  // First steps after picking a platform: what most new sites do first, in order, each linking to the
  // platform's own docs (the domain page from data.quiz.domainDocs, the rest from the answers' sources).
  // A row id means "use that answer"; a link-only step names its link instead.
  const SEARCH_CONSOLE = 'https://support.google.com/webmasters/answer/34592';   // Google's own guide, the same on every platform
  const STEPS = [
    { text: 'Connect your own domain name', domain: true },
    { row: 'meta_title', text: 'Give each page a title and description for search' },
    { text: 'Tell Google the site exists: add it to Search Console and submit its sitemap', url: SEARCH_CONSOLE, link: 'Google’s guide' },
    { row: 'gsc404', text: 'Moving from an old site? Point the old links to the new pages' },
  ];
  const LATER = [['noindex', 'hide pages from search'], ['ai_crawlers', 'choose which AI bots may read the site']];
  function docLink(url, text) {
    const a = el('a', null, text);
    a.href = url;
    a.rel = 'noopener';
    a.target = '_blank';
    return a;
  }
  function nextSteps(p) {
    const answer = (row) => (data.answers[p.id] || {})[row] || {};
    const ol = el('ol', 'qz-steps');
    STEPS.forEach((s) => {
      const ans = s.row ? answer(s.row) : {};
      const url = s.url || (s.domain ? data.quiz.domainDocs[p.id] : ans.sourceUrl);
      const li = el('li', null, s.text);
      if (url) li.append(' · ', docLink(url, s.link || `How on ${p.name}`));
      // How it's done there, when it isn't simply built in ("Yes, with an SEO plugin" → "With an SEO plugin")
      const how = (ans.verdict && ans.verdict !== 'yes' && ans.verdict !== 'auto' && ans.mark || '').replace(/^yes,?\s*/i, '');
      if (how) li.append(el('small', null, how.charAt(0).toUpperCase() + how.slice(1)));
      ol.append(li);
    });
    // Less common, so not numbered: a single line, each part linked where there's a source
    const later = el('p', 'qz-later');
    later.append(el('b', null, 'Later, if you need it: '));
    LATER.forEach(([row, text], i) => {
      if (i) later.append(' · ');
      const url = answer(row).sourceUrl;
      later.append(url ? docLink(url, text) : text);
    });
    const frag = document.createDocumentFragment();
    frag.append(ol, later);
    return frag;
  }

  function setupQuiz() {
    const box = $('#qz');
    if (!box) return;
    let step = 0, a = {};
    const pending = new Set();   // questions an old link didn't have: answered neutrally (NEUTRAL) or not at all, and offered above the results
    const steps = (o = a) => QUESTIONS.filter((q) => !q.when || q.when(o));   // the questions these answers call for
    const valid = (o) => steps(o).every((q) => q.opts.some(([v]) => v === o[q.id]));

    function ask() {
      const list = steps();
      if (step >= list.length) return results('quiz');
      const q = list[step];
      box.replaceChildren();
      const top = el('div', 'qz-top');
      // Until "What are you making?" is answered, count the longest path (its follow-up question included),
      // so the total doesn't jump from 6 to 7 after the first answer
      const first = QUESTIONS[0], total = first.id in a ? list.length : Math.max(...first.opts.map(([v]) => steps({ ...a, [first.id]: v }).length));
      const progress = `Question ${step + 1} of ${total}`;
      const shown = el('span', null, progress);
      shown.setAttribute('aria-hidden', 'true');   // screen readers get it from the heading below
      top.append(shown);
      const bar = el('span', 'qz-bar'), fill = el('i');
      fill.style.width = `${(step / total) * 100}%`;
      bar.append(fill);
      top.append(bar);
      // Focus moves to this heading after each answer, so it carries the progress too ("Question 2 of 9: …")
      const h = el('h3');
      // A no-break space: an ordinary one at the end of the hidden span is dropped, and screen readers ran "9:Which" together
      h.append(el('span', 'sr-only', `${progress}: `), q.q);
      h.tabIndex = -1;
      const opts = el('div', 'qz-opts');
      opts.setAttribute('role', 'group');
      opts.setAttribute('aria-label', q.q);
      q.opts.forEach(([v, title, sub]) => {
        const b = el('button', 'qz-opt');
        b.type = 'button';
        b.setAttribute('aria-pressed', String(a[q.id] === v));
        b.append(el('b', null, title), el('small', null, sub));
        b.addEventListener('click', async () => {
          if (opts.dataset.busy) return;
          // The choice shows as selected for a moment, so it's clear it registered, before the next question
          opts.dataset.busy = '1';
          opts.querySelectorAll('.qz-opt').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
          await new Promise((r) => setTimeout(r, 150));
          window.jsalUsed?.();   // "First steps" / "Explorer" (/nav.js)
          a[q.id] = v;
          pending.delete(q.id);
          if (resume) {
            const next = steps().findIndex((x) => pending.has(x.id) || !x.opts.some(([o]) => o === a[x.id]));
            if (next < 0) { resume = false; step = steps().length; } else step = next;
          } else step++;
          ask();
          box.querySelector('h3')?.focus({ preventScroll: true });
        });
        opts.append(b);
      });
      box.append(top, h, el('p', 'qz-hint', 'Pick the closest one; you can go back and change it.'), opts);
      box.classList.remove('qz-in'); void box.offsetWidth; box.classList.add('qz-in');
      if (step) {
        const nav = el('div', 'qz-nav'), back = el('button', 'btn', 'Back');
        back.type = 'button';
        back.addEventListener('click', () => { step--; ask(); box.querySelector('h3')?.focus({ preventScroll: true }); });
        nav.append(back);
        box.append(nav);
      }
      // A question is much shorter than the results: if the box's top has gone above the window (Start over,
      // or a change that brings in a new question), bring it back rather than leave the page further down
      if (box.getBoundingClientRect().top < 0) $('#quiz').scrollIntoView();
    }

    // On the results: each answer as a button; tapping one opens its choices, and picking another
    // re-ranks straight away (or asks a question the change brings in, such as the shop's size)
    let editing = null, resume = false;   // resume: answering a question a change brought in goes straight back to the results
    function answersBar() {
      const bar = el('div', 'qz-ans');
      bar.append(el('p', 'qz-ans-l', `Your answers · ${matchMedia('(pointer: coarse)').matches ? 'tap' : 'click'} one to change it`));
      const chips = el('div', 'qz-ans-chips');
      steps().filter((q) => !pending.has(q.id)).forEach((q) => {
        const opt = q.opts.find(([v]) => v === a[q.id]);
        // The answer on its own ("Two or more languages"), so it makes sense without remembering the question
        const b = el('button', 'chip', opt ? opt[3] : q.q);
        b.type = 'button';
        b.dataset.q = q.id;
        b.setAttribute('aria-expanded', String(editing === q.id));
        b.setAttribute('aria-label', `${opt ? opt[3] : ''}. Change your answer to: ${q.q}`);
        b.addEventListener('click', () => { editing = editing === q.id ? null : q.id; results(); box.querySelector(`.qz-ans-chips [data-q="${q.id}"]`)?.focus({ preventScroll: true }); });
        chips.append(b);
      });
      bar.append(chips);
      const q = steps().find((x) => x.id === editing);
      if (q) {
        const ed = el('div', 'qz-ans-ed');
        ed.setAttribute('role', 'group');
        ed.setAttribute('aria-label', q.q);
        ed.append(el('p', null, q.q));
        q.opts.forEach(([v, title]) => {
          const b = el('button', 'chip', title);
          b.type = 'button';
          b.setAttribute('aria-pressed', String(a[q.id] === v));
          b.addEventListener('click', () => {
            a[q.id] = v;
            pending.delete(q.id);
            editing = null;
            const missing = steps().findIndex((x) => !x.opts.some(([o]) => o === a[x.id]));
            if (missing >= 0) { step = missing; resume = true; ask(); box.querySelector('h3')?.focus({ preventScroll: true }); return; }
            results();
            box.querySelector(`.qz-ans-chips [data-q="${q.id}"]`)?.focus({ preventScroll: true });
          });
          ed.append(b);
        });
        bar.append(ed);
      }
      return bar;
    }

    // source: 'quiz' (the last question answered) or 'link' (a shared result opened), sent as a GA4
    // event; re-showing the result after an answer is changed sends nothing
    function results(source) {
      const ranked = window.cmsScore.rank(data, a);
      const best = ranked[0].s, top = ranked.slice(0, 3), also = ranked.slice(3, 6).filter((r) => r.s > best - 6);
      // A tie for first is shown as one: list order alone mustn't crown a "Best match". When even the first
      // fits poorly (cmsScore.LOW_FIT), it's only the closest, and the others are worth a look at most.
      const tied = top[1] && top[1].s === best, weak = best < window.cmsScore.LOW_FIT;
      const first = weak ? 'closest match' : 'best match';
      const label = (r) => (r.s === best ? (tied ? `Joint ${first}` : `${first.charAt(0).toUpperCase()}${first.slice(1)}`) : r.s >= best - 4 && !weak ? 'Good match' : 'Worth a look');
      const told = window.cmsScore.explain(data, a, top);   // reasons without repeats, and what sets each apart
      // An old link stays v=1 (its own answers) until its newer questions are answered
      const kept = Object.entries(a).filter(([k]) => steps().some((q) => q.id === k) && !pending.has(k));
      history.replaceState(null, '', `#quiz?v=${pending.size ? 1 : LINK_VERSION}&${new URLSearchParams(kept)}`);
      window.jsalAchieve?.('decision');   // achievement (/nav.js)
      if (source) window.jsalTrack?.('quiz_result', { top_match: ranked[0].p.id, fit: weak ? 'closest' : 'best', source });
      box.replaceChildren();
      box.classList.remove('qz-in'); void box.offsetWidth; box.classList.add('qz-in');   // fades in, like a new question
      const head = el('div', 'qz-top');
      head.append(el('span', null, `Your ${first}es`));
      const bar = el('span', 'qz-bar'), fill = el('i');
      fill.style.width = '100%';
      bar.append(fill);
      head.append(bar);
      const h = el('h3', 'sr-only', `Your ${first}es`);
      h.tabIndex = -1;
      const list = el('div', 'qz-res');
      top.forEach((r, i) => {
        const card = el('article', `qz-card${r.s === best ? ' top' : ''}`), pr = r.p.profile || {};
        const name = el('h4', null, r.p.name);
        name.append(el('span', `fitp${weak ? ' low' : ''}`, label(r)));
        card.append(logo(r.p), name, el('p', 'sum', pr.summary || ''));
        // The key facts people compare first: skill, hosting and updates, and what it costs to start for what
        // you're making (a store's band for a store), with a note where a developer is needed
        const fx = el('dl', 'qz-facts'), ease = data.quiz.ease[r.p.id] ?? 1;
        const cost = ((data.answers[r.p.id] || {})[window.cmsScore.costRow(a)] || {}).verdict;
        [['Skill needed', SKILL[ease]], ['Hosting and updates', pr.hosting],
          ['Cost to start', COST[cost] && cost !== 'na' ? COST[cost] : '', ease === 0 ? 'Plus developer time to build and maintain' : '']]
          .filter(([, v]) => v).forEach(([k, v, note]) => {
            const f = el('div');
            const dd = el('dd', null, v);
            if (note) dd.append(el('small', null, note));
            f.append(el('dt', null, k), dd);
            fx.append(f);
          });
        card.append(fx);
        card.append(el('p', 'qz-sec', 'Why it fits'));
        const ul = el('ul', 'qz-why');
        told[i].why.forEach((w) => ul.append(el('li', null, w)));
        card.append(ul);
        if (told[i].vs) {
          const vs = el('div', 'qz-vs');
          // Only the closest can't be "ahead": its box compares, like the others' ("Versus Wix")
          const head = weak ? told[i].vs.head.replace(/^Ahead of /, 'Versus ') : told[i].vs.head;
          vs.append(el('p', 'qz-vs-h', head), el('p', null, told[i].vs.text));
          card.append(vs);
        }
        // Where it counts against an answer given (score.js "but"), so the pick never hides it
        if (r.but && r.but.length) card.append(el('p', 'qz-lim', `Worth knowing: ${r.but.join('; ')}.`));
        const skip = (pr.lessSuited || [])[0];
        if (skip) card.append(el('p', 'qz-lim', `Less suited if ${skip.charAt(0).toLowerCase()}${skip.slice(1)}`));
        list.append(card);
      });
      box.append(head, h);
      if (pending.size) {
        const more = el('button', 'btn qz-more', `${pending.size} newer question${pending.size === 1 ? '' : 's'} can sharpen this`);
        more.type = 'button';
        more.addEventListener('click', () => { step = steps().findIndex((q) => pending.has(q.id)); resume = true; ask(); box.querySelector('h3')?.focus({ preventScroll: true }); });
        box.append(more);
      }
      box.append(answersBar());
      // Above the cards, why they're only the closest: answers that pull against each other (with the question to
      // change, opening its answer as the chip above does), or else that nothing fits them well
      const clash = window.cmsScore.conflict(a);
      if (clash || weak) {
        // The sentence in one span, so the info icon (::before) is the note's only other flex item
        const note = el('p', 'qz-note'), say = el('span');
        note.append(say);
        if (clash === 'who') {
          const change = el('button', 'qz-note-a', `change “${steps().find((q) => q.id === 'who').q}”`);
          change.type = 'button';
          change.addEventListener('click', () => { editing = 'who'; results(); box.querySelector('.qz-ans-chips [data-q="who"]')?.focus({ preventScroll: true }); });
          // Ends on the link: a button can't wrap mid-line like text, so nothing is left dangling after it on a phone
          say.append('An app or portal usually needs a developer. Without one, these are the closest options. To see developer-built choices, ', change, '.');
        } else say.append('No platform fits these answers well, so these are the closest. Changing an answer above may bring better matches.');
        box.append(note);
      }
      box.append(list);
      // One first-steps panel under the cards, switched between the three matches
      const panel = el('section', 'qz-panel'), sw = el('div', 'qz-switch'), body = el('div');
      sw.setAttribute('role', 'group');
      sw.setAttribute('aria-label', 'Show first steps for');
      sw.append(el('span', 'qz-switch-l', 'Show steps for'));
      const show = (p) => {
        sw.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === p.id)));
        body.replaceChildren(el('h4', null, `First steps if you pick ${p.name}`), nextSteps(p));
      };
      top.forEach((r) => {
        const b = el('button', 'chip', r.p.name);
        b.type = 'button';
        b.dataset.id = r.p.id;
        b.addEventListener('click', () => show(r.p));
        sw.append(b);
      });
      panel.append(sw, body);
      show(top[0].p);
      box.append(panel);
      if (also.length) box.append(el('p', 'qz-also', `Also worth a look: ${also.map((r) => r.p.name).join(', ')}`));
      const nav = el('div', 'qz-nav');
      const cmp = el('button', 'btn primary', 'Compare these side by side');
      cmp.type = 'button';
      cmp.addEventListener('click', () => {
        state.compare = new Set(top.map((r) => r.p.id));
        state.touched = true;
        state.pick = top[0].p.id;
        renderCards();
        render();
        $('#seo').scrollIntoView();
      });
      const copy = el('button', 'btn', 'Copy link to this result');
      copy.type = 'button';
      copy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(location.href); copy.textContent = 'Link copied'; } catch (e) { copy.textContent = 'Copy the address bar to share'; }
      });
      const again = el('button', 'btn', 'Start over');
      again.type = 'button';
      again.addEventListener('click', () => { a = {}; step = 0; editing = null; resume = false; pending.clear(); history.replaceState(null, '', location.pathname); ask(); box.querySelector('h3')?.focus({ preventScroll: true }); });
      nav.append(cmp, copy, again);
      box.append(nav);
    }

    // A shared result (#quiz?v=2&what=site&who=easy…) opens straight on it. A v2 link with an answer missing or
    // unknown (cut short, or edited) keeps the good answers and asks the first question it lacks.
    // Returns false when the address holds no quiz answers.
    function fromLink() {
      const m = location.hash.match(/^#quiz\?(.+)$/);
      const link = m && readLink(new URLSearchParams(m[1]));
      if (!link) return false;
      const shared = link.answers;
      a = {};
      editing = null;
      resume = false;
      pending.clear();
      QUESTIONS.forEach((q) => { if (q.opts.some(([v]) => v === shared[q.id])) a[q.id] = shared[q.id]; });
      // An old link (v=1) opens on its result: questions it didn't have get an answer that scores nothing
      // either way (NEUTRAL in score.js), or none, and are offered above the results
      if (link.old && 'what' in a) {
        steps().forEach((q) => { if (!(q.id in a)) { pending.add(q.id); if (q.id in NEUTRAL) a[q.id] = NEUTRAL[q.id]; } });
        step = steps().length;
        results('link');
        return true;
      }
      const missing = steps().findIndex((q) => !(q.id in a));
      if (missing < 0) { step = steps().length; results('link'); }
      else if (Object.keys(a).length) { step = missing; resume = true; ask(); }
      else { step = 0; ask(); }
      return true;
    }
    if (fromLink()) requestAnimationFrame(() => $('#quiz').scrollIntoView());
    else ask();
    // The address changed without a reload (edited by hand, or Back/Forward to another result): follow it.
    // The page's own updates use replaceState, which doesn't fire this, so there's no loop.
    addEventListener('hashchange', () => { if (fromLink()) $('#quiz').scrollIntoView(); });
  }

  // data.json (the answers, from the database) with no-cache: always check with the server (a quick 304 if
  // unchanged), so a publish shows straight away. quiz.json (the quiz's own values) with this script's own
  // ?v= number, so the scoring code and its values always arrive from the same release.
  // (currentScript is empty in a module script, so the page's own <script src="app.js?v=…"> is the fallback)
  const self = document.currentScript || document.querySelector('script[src*="app.js?v="]');
  const VERSION = self ? new URL(self.src).searchParams.get('v') : '';
  Promise.all([
    fetch('data.json', { cache: 'no-cache' }).then((r) => r.json()),
    fetch(`quiz.json?v=${VERSION}`).then((r) => r.json()),
  ]).then(([d, quiz]) => {
    data = d;
    data.quiz = Object.fromEntries(Object.entries(quiz).filter(([k]) => !k.startsWith('_')));
    build();
  })
    .catch(() => { $('#grid').replaceChildren(el('p', 'empty', 'Could not load the answers. Try reloading the page.')); });
})();
