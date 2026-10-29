// CMS Picker: draws the platform cards and the platform × item SEO grid from data.json
// (answers and profiles only, exported by build\playbook.py publish).
(() => {
  const $ = (s) => document.querySelector(s);
  const state = { goal: 'all', compare: new Set(), notes: false };
  // Short tag wording for the grid and key (data.json keeps the full labels)
  const SHORT = { yes: 'Built in', auto: 'Automatic', plugin: 'Plugin/app', code: 'Needs code', hosting: 'Hosting/DNS', check: 'Unclear', indirect: 'Indirectly', no: 'Not possible' };
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
      foot.append(cmp);
      c.append(foot);
      cards.append(c);
    });
    updateBar();
  }

  // Compare bar: the platforms being compared (newly added ones pop in), and a link to the table
  let barShown = new Set();
  function updateBar() {
    const picked = data.platforms.filter((p) => state.compare.has(p.id));
    $('#cbar-count').textContent = `Comparing ${picked.length}`;
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
    plats.forEach((p) => {
      const c = el('div', 'hcell');
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
      row.append(el('div', 'item', it.label));
      plats.forEach((p) => {
        const c = data.answers[p.id][it.id], cell = el('div', 'cell');
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
    // Hero: platform count, when the answers were last checked, and a few real rows of the table
    document.querySelectorAll('.n-plats').forEach((n) => { n.textContent = data.platforms.length; });
    const asOf = data.asOf;
    if (asOf) $('#asof').textContent = asOf;
    const PEEK_PLATS = ['wordpress', 'shopify', 'wix'].filter((id) => data.answers[id]);
    const PEEK_ROWS = [['blog', 'Run a blog'], ['store', 'Sell online'], ['gsc404', '301 redirects'], ['design', 'Custom design']]
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

    let barTick = false;
    addEventListener('scroll', () => {
      if (barTick) return;
      barTick = true;
      requestAnimationFrame(() => { barTick = false; placeBar(); });
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
    Object.keys(SHORT).filter((k) => used.has(k)).forEach((k) => legend.append(el('span', `tag ${k}`, SHORT[k])));
    setGoal('all');
  }

  // no-cache: always check with the server (a quick 304 if unchanged), so a publish shows straight away
  fetch('data.json', { cache: 'no-cache' }).then((r) => r.json()).then((d) => { data = d; build(); })
    .catch(() => { $('#grid').replaceChildren(el('p', 'empty', 'Could not load the answers. Try reloading the page.')); });
})();
