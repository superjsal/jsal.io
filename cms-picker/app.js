// CMS Picker: draws the platform cards and the platform × item SEO grid from data.json
// (answers and profiles only, exported by build\playbook.py publish).
(() => {
  const $ = (s) => document.querySelector(s);
  const state = { q: '', goal: 'all', compare: new Set() };
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

    const grid = $('#grid');
    grid.replaceChildren();
    grid.style.setProperty('--n', Math.max(plats.length, 1));
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
    grid.append(head);
    // A label row where each section starts: Built in, SEO, AI search (dated, as AI changes fast)
    const groups = Object.fromEntries((data.groups || []).map((g) => [g.id, g]));
    let lastGroup = null;
    items.forEach((it) => {
      if (it.group !== lastGroup && groups[it.group]) {
        const g = groups[it.group];
        grid.append(el('div', 'row group', `${g.title}${g.asOf ? ` · as of ${g.asOf}` : ''}`));
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
          s.title = scope;
          s.setAttribute('aria-label', scope);
          line.append(s);
        }
        cell.append(el('span', 'plat', p.name), line);
        if (c.mark && !GENERIC.test(c.mark.trim())) cell.append(el('span', 'mark', c.mark));
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

    $('#q').addEventListener('input', (e) => { state.q = e.target.value; render(); });
    const legend = $('#legend');
    Object.keys(SHORT).filter((k) => k in data.verdicts).forEach((k) => legend.append(el('span', `tag ${k}`, SHORT[k])));
    Object.values(SCOPE).forEach(([sym, label]) => {
      const s = el('span', 'skey');
      s.append(el('span', 'sc', sym), document.createTextNode(label));
      legend.append(s);
    });
    setGoal('all');
  }

  fetch('data.json').then((r) => r.json()).then((d) => { data = d; build(); })
    .catch(() => { $('#grid').replaceChildren(el('p', 'empty', 'Could not load the answers. Try reloading the page.')); });
})();
