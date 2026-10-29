// CMS Picker: draws the platform cards and the platform × item SEO grid from data.json
// (answers and profiles only, exported by build\playbook.py publish).
(() => {
  const $ = (s) => document.querySelector(s);
  const state = { q: '', goal: 'all', compare: new Set(), notes: false };
  // Short tag wording for the grid and key (data.json keeps the full labels)
  const SHORT = { yes: 'Built in', auto: 'Automatic', plugin: 'Plugin/app', code: 'Code', hosting: 'Hosting/DNS', check: 'Check', indirect: 'Indirectly', no: 'Not possible' };
  // Scope as a symbol, explained once in the key
  const SCOPE = { U: ['●', 'Same on every site'], V: ['◐', 'Varies by site'], C: ['○', 'Not verified yet'] };
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

  // Platform logos (Simple Icons, CC0) drawn in the text colour via a mask, so they match the theme.
  // Simple Icons has no Magento or Duda logo, and headless isn't one brand: those get a lettered badge.
  const LOGOS = new Set(['wordpress', 'shopify', 'wix', 'squarespace', 'webflow', 'framer', 'hubspot', 'bigcommerce', 'drupal', 'godaddy']);
  const BADGE = { magento: 'M', duda: 'D', headless: '{ }' };
  function logo(p) {
    if (LOGOS.has(p.id)) {
      const s = el('span', 'logo');
      s.style.setProperty('--logo', `url("logos/${p.id}.svg")`);
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
    state.compare = new Set(g === 'all' ? DEFAULT_COMPARE : data.platforms.filter(fits).map((p) => p.id));
    renderCards();
    render();
  }
  function toggleCompare(id) {
    if (state.compare.has(id)) state.compare.delete(id); else state.compare.add(id);
    renderCards();
    render();
  }

  function renderCards() {
    const cards = $('#cards');
    cards.replaceChildren();
    document.querySelectorAll('#types button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.g === state.goal)));
    const shown = data.platforms.filter((p) => p.profile && fits(p));
    $('#count').textContent = state.goal === 'all' ? `All ${shown.length} platforms` : `${shown.length} of ${data.platforms.length} platforms fit`;
    shown.forEach((p) => {
      const c = el('article', 'card'), pr = p.profile;
      const top = el('div', 'ctop');
      top.append(logo(p), el('h3', null, p.name));
      c.append(top, el('p', 'ptype', pr.type));
      if (pr.summary) c.append(el('p', 'summary', pr.summary));
      if (pr.tags && pr.tags.length) {
        const t = el('div', 'ktags');
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
      const who = el('details', 'who');
      who.append(el('summary', null, 'Who it suits'));
      [['Good fit for', pr.goodFit], ['Less suited if', pr.lessSuited]].forEach(([title, list]) => {
        if (!list || !list.length) return;
        const ul = el('ul');
        list.forEach((x) => ul.append(el('li', null, x)));
        who.append(el('h4', null, title), ul);
      });
      c.append(who);
      const foot = el('div', 'cfoot');
      const on = state.compare.has(p.id);
      const cmp = el('button', 'chip cmp', on ? '✓ Comparing' : '+ Add to compare');
      cmp.type = 'button';
      cmp.setAttribute('aria-pressed', String(on));
      cmp.setAttribute('aria-label', `${on ? 'Remove' : 'Add'} ${p.name} ${on ? 'from' : 'to'} the SEO comparison`);
      cmp.addEventListener('click', () => toggleCompare(p.id));
      const go = el('a', 'golink', 'Compare ↓');
      go.href = '#seo';
      go.addEventListener('click', () => { if (!state.compare.has(p.id)) toggleCompare(p.id); });
      foot.append(cmp, go);
      c.append(foot);
      cards.append(c);
    });
  }

  function render() {
    const plats = data.platforms.filter((p) => state.compare.has(p.id));
    const q = state.q.trim().toLowerCase();
    const items = data.items.filter((i) => !q || i.label.toLowerCase().includes(q));
    document.querySelectorAll('.chip[data-pid]').forEach((b) => b.setAttribute('aria-pressed', String(state.compare.has(b.dataset.pid))));

    const grid = $('#grid'), ghead = $('#ghead');
    grid.replaceChildren();
    ghead.replaceChildren();
    [grid, ghead].forEach((g) => g.style.setProperty('--n', Math.max(plats.length, 1)));
    $('#thead').hidden = !plats.length || !items.length;
    grid.classList.toggle('compact', !state.notes);
    if (!plats.length || !items.length) {
      grid.append(el('p', 'empty', plats.length ? 'No items match that search.' : 'No platforms selected. Add some above, or from the cards.'));
      return;
    }
    const head = el('div', 'row head');
    head.append(el('div', 'item', 'Can you…'));
    plats.forEach((p) => {
      const c = el('div', 'hcell');
      c.append(el('span', 'pname', p.name));
      if (p.profile) c.append(el('span', 'htype', p.profile.type));
      head.append(c);
    });
    ghead.append(head);
    $('#thead').scrollLeft = $('#seo .scroll').scrollLeft;
    // A label row where each section starts: Built in, SEO, AI search (dated, as AI changes fast)
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
      row.append(el('div', 'item', it.label));
      plats.forEach((p) => {
        const c = data.answers[p.id][it.id], cell = el('div', 'cell');
        const [sym, scope] = SCOPE[c.scope] || ['', ''];
        const line = el('span', 'line');
        line.append(el('span', `tag ${c.verdict}`, SHORT[c.verdict] || data.verdicts[c.verdict] || c.verdict));
        if (sym) {
          const s = el('span', 'sc', sym);
          if (state.notes) s.title = scope;        // with notes off, the cell's tooltip says it instead
          cell.dataset.scope = scope;
          s.setAttribute('aria-label', scope);
          line.append(s);
        }
        cell.append(el('span', 'plat', p.name), line);
        if (c.mark && !GENERIC.test(c.mark.trim())) {
          cell.append(el('span', 'mark', c.mark));
          cell.dataset.note = c.mark;
        }
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
    all.addEventListener('click', () => { data.platforms.forEach((p) => state.compare.add(p.id)); renderCards(); render(); });
    plats.append(all);
    const none = el('button', 'chip-link', 'Deselect all');
    none.type = 'button';
    none.addEventListener('click', () => { state.compare.clear(); renderCards(); render(); });
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
    // Hero: platform count, the date from the AI search section, and a few real rows of the table
    document.querySelectorAll('.n-plats').forEach((n) => { n.textContent = data.platforms.length; });
    const asOf = (data.groups || []).map((g) => g.asOf).find(Boolean);
    if (asOf) $('#asof').textContent = asOf;
    const PEEK_PLATS = ['wordpress', 'shopify', 'wix'].filter((id) => data.answers[id]);
    const PEEK_ROWS = [['blog', 'Run a blog'], ['store', 'Sell online'], ['gsc404', '301 redirects'], ['templates', 'Edit templates']]
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
    // Notes off: hovering (or tapping) an answer shows its note and scope in a tooltip at once.
    // It sits outside the table, fixed to the window, so the table's scroll box can't clip it.
    const tip = $('#tip');
    let tipCell = null;
    const hideTip = () => { tip.hidden = true; tipCell = null; };
    $('#grid').addEventListener('pointerover', (e) => {
      const cell = e.target.closest('.cell');
      if (cell === tipCell) return;
      if (state.notes || !cell || !(cell.dataset.note || cell.dataset.scope)) { hideTip(); return; }
      tipCell = cell;
      tip.replaceChildren();
      if (cell.dataset.note) tip.append(el('span', null, cell.dataset.note));
      if (cell.dataset.scope) tip.append(el('small', null, cell.dataset.scope));
      tip.hidden = false;
      const r = cell.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
      tip.style.left = `${Math.max(8, Math.min(r.left + 8, innerWidth - w - 8))}px`;
      tip.style.top = `${r.bottom + h + 8 < innerHeight ? r.bottom - 4 : r.top - h + 4}px`;
    });
    $('#grid').addEventListener('pointerleave', hideTip);
    addEventListener('scroll', hideTip, { passive: true });
    $('#seo .scroll').addEventListener('scroll', hideTip, { passive: true });
    document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#grid')) hideTip(); });

    // Back to top, once the hero is out of view
    const totop = $('#totop');
    new IntersectionObserver(([e]) => totop.classList.toggle('show', !e.isIntersecting)).observe($('.hero'));
    totop.addEventListener('click', () => scrollTo({ top: 0 }));   // smooth via scroll-behavior in shell.css

    $('#q').addEventListener('input', (e) => { state.q = e.target.value; render(); });
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
    const legend = $('#legend');
    Object.keys(SHORT).filter((k) => k in data.verdicts).forEach((k) => legend.append(el('span', `tag ${k}`, SHORT[k])));
    Object.values(SCOPE).forEach(([sym, label]) => {
      const s = el('span', 'skey');
      s.append(el('span', 'sc', sym), document.createTextNode(label));
      legend.append(s);
    });
    setGoal('all');
  }

  // no-cache: always check with the server (a quick 304 if unchanged), so a publish shows straight away
  fetch('data.json', { cache: 'no-cache' }).then((r) => r.json()).then((d) => { data = d; build(); })
    .catch(() => { $('#grid').replaceChildren(el('p', 'empty', 'Could not load the answers. Try reloading the page.')); });
})();
