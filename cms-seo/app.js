// CMS SEO Checker: draws the platform × item grid and the platform profiles from data.json
// (answers and profiles only, exported by build\playbook.py publish).
(() => {
  const $ = (s) => document.querySelector(s);
  const state = { q: '', group: 'all', off: new Set() };
  const SCOPE_NOTE = { U: 'Same on every site', V: 'Varies by site', C: 'Not verified' };
  const TRIVIAL = new Set(['yes', 'no', 'check']);   // marks that just repeat the tag
  let data;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  const GROUPS = [['all', 'All'], ['builder', 'Website builders'], ['ecom', 'E-commerce'], ['open', 'Open source'], ['headless', 'Headless']];
  const groupOf = (p) => { const t = (p.profile && p.profile.type) || ''; return /commerce/i.test(t) ? 'ecom' : /open source/i.test(t) ? 'open' : /headless/i.test(t) ? 'headless' : 'builder'; };

  function renderCards() {
    const cards = $('#cards');
    cards.replaceChildren();
    document.querySelectorAll('#types button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.g === state.group)));
    data.platforms.filter((p) => p.profile && (state.group === 'all' || groupOf(p) === state.group)).forEach((p) => {
      const c = el('article', 'card'), pr = p.profile;
      c.append(el('h3', null, p.name), el('p', 'ptype', pr.type));
      [['Good fit for', pr.goodFit], ['Less suited if', pr.lessSuited], ['Known for', pr.knownFor]].forEach(([title, list]) => {
        if (!list || !list.length) return;
        const ul = el('ul');
        list.forEach((t) => ul.append(el('li', null, t)));
        c.append(el('h4', null, title), ul);
      });
      const go = el('a', 'golink', 'See its SEO answers ↓');
      go.href = '#seo';
      go.addEventListener('click', () => { state.off.delete(p.id); render(); });
      c.append(go);
      cards.append(c);
    });
  }

  function render() {
    const plats = data.platforms.filter((p) => !state.off.has(p.id));
    const q = state.q.trim().toLowerCase();
    const items = data.items.filter((i) => !q || i.label.toLowerCase().includes(q));
    document.querySelectorAll('.chip[data-pid]').forEach((b) => b.setAttribute('aria-pressed', String(!state.off.has(b.dataset.pid))));

    const grid = $('#grid');
    grid.replaceChildren();
    grid.style.setProperty('--n', Math.max(plats.length, 1));
    if (!plats.length || !items.length) {
      grid.append(el('p', 'empty', plats.length ? 'No items match that search.' : 'No platforms selected. Choose one or more above, or select All.'));
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
    items.forEach((it) => {
      const row = el('div', 'row');
      row.append(el('div', 'item', it.label));
      plats.forEach((p) => {
        const c = data.answers[p.id][it.id], cell = el('div', 'cell');
        cell.append(el('span', 'plat', p.name), el('span', `tag ${c.verdict}`, data.verdicts[c.verdict] || c.verdict));
        if (c.mark && !TRIVIAL.has(c.mark.toLowerCase())) cell.append(el('span', 'mark', c.mark));
        cell.append(el('span', 'scope', SCOPE_NOTE[c.scope] || data.scopes[c.scope] || ''));
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
      b.addEventListener('click', () => { state.off.has(p.id) ? state.off.delete(p.id) : state.off.add(p.id); render(); });
      plats.append(b);
    });
    const all = el('button', 'chip-link', 'All');
    all.type = 'button';
    all.addEventListener('click', () => { state.off.clear(); render(); });
    plats.append(all);
    const none = el('button', 'chip-link', 'Deselect all');
    none.type = 'button';
    none.addEventListener('click', () => { data.platforms.forEach((p) => state.off.add(p.id)); render(); });
    plats.append(none);

    const types = $('#types');
    GROUPS.forEach(([g, label]) => {
      const b = el('button', 'chip', label);
      b.type = 'button';
      b.dataset.g = g;
      b.addEventListener('click', () => { state.group = g; renderCards(); });
      types.append(b);
    });

    $('#q').addEventListener('input', (e) => { state.q = e.target.value; render(); });
    const legend = $('#legend');
    Object.entries(data.verdicts).forEach(([k, label]) => legend.append(el('span', `tag ${k}`, label)));
    renderCards();
    render();
  }

  fetch('data.json').then((r) => r.json()).then((d) => { data = d; build(); })
    .catch(() => { $('#grid').replaceChildren(el('p', 'empty', 'Could not load the answers. Try reloading the page.')); });
})();
