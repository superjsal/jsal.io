// CMS SEO Checker: draws the platform × item grid and the platform profiles from data.json
// (answers and profiles only, exported by build\playbook.py publish).
(() => {
  const $ = (s) => document.querySelector(s);
  const state = { q: '', off: new Set() };
  const SCOPE_NOTE = { U: 'Same on every site', V: 'Varies by site', C: 'Not verified' };
  const TRIVIAL = new Set(['yes', 'no', 'check']);   // marks that just repeat the tag
  let data, opener;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function nameButton(p, cls) {
    const b = el('button', cls, p.name);
    b.type = 'button';
    b.title = `About ${p.name}`;
    b.addEventListener('click', () => openProfile(p, b));
    return b;
  }

  function openProfile(p, from) {
    const d = $('#profile'), pr = p.profile;
    opener = from;
    d.replaceChildren();
    const close = el('button', 'close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', () => d.close());
    const h = el('h2', null, p.name);
    h.id = 'profile-h';
    d.append(close, h);
    if (pr) {
      d.append(el('p', 'ptype', pr.type));
      [['Good fit for', pr.goodFit], ['Less suited if', pr.lessSuited], ['Known for', pr.knownFor]].forEach(([title, list]) => {
        if (!list || !list.length) return;
        const ul = el('ul');
        list.forEach((t) => ul.append(el('li', null, t)));
        d.append(el('h3', null, title), ul);
      });
    }
    d.showModal();
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
      grid.append(el('p', 'empty', plats.length ? 'No items match that search.' : 'Pick at least one platform to compare.'));
      return;
    }
    const head = el('div', 'row head');
    head.append(el('div', 'item', 'Can you…'));
    plats.forEach((p) => {
      const c = el('div', 'hcell');
      c.append(nameButton(p, 'pname'));
      if (p.profile) c.append(el('span', 'htype', p.profile.type));
      head.append(c);
    });
    grid.append(head);
    items.forEach((it) => {
      const row = el('div', 'row');
      row.append(el('div', 'item', it.label));
      plats.forEach((p) => {
        const c = data.answers[p.id][it.id], cell = el('div', 'cell');
        cell.append(nameButton(p, 'plat'), el('span', `tag ${c.verdict}`, data.verdicts[c.verdict] || c.verdict));
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

    $('#q').addEventListener('input', (e) => { state.q = e.target.value; render(); });
    const d = $('#profile');
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });   // click on the backdrop
    d.addEventListener('close', () => { if (opener && opener.isConnected) opener.focus(); });

    const legend = $('#legend');
    Object.entries(data.verdicts).forEach(([k, label]) => legend.append(el('span', `tag ${k}`, label)));
    render();
  }

  fetch('data.json').then((r) => r.json()).then((d) => { data = d; build(); })
    .catch(() => { $('#grid').replaceChildren(el('p', 'empty', 'Could not load the answers. Try reloading the page.')); });
})();
