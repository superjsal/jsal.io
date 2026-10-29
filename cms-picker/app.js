// CMS Picker: the Find my fit quiz, the platform cards and the platform × item grid, all from data.json
// (answers, profiles and the quiz's own values, exported by build\playbook.py publish).
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
    if (g !== 'all') window.jsalAchieve?.('decision');   // achievement (/nav.js)
    state.compare = new Set(g === 'all' ? DEFAULT_COMPARE : data.platforms.filter(fits).map((p) => p.id));
    renderCards();
    render();
  }
  function toggleCompare(id) {
    if (state.compare.has(id)) state.compare.delete(id); else { state.compare.add(id); window.jsalAchieve?.('compare'); }   // achievement (/nav.js)
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
      const label = el('div', 'item', it.label);
      if (it.term) label.append(el('small', 'term', it.term));   // the SEO name, small, under the plain question
      row.append(label);
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
    setupQuiz();
  }

  // ---------- Find my fit: a short guided quiz ----------
  // One question at a time; then every platform is scored from what's already published (each profile's
  // goals, hosting and export, and the verified answers for selling, languages and design) plus the
  // quiz's own values in data.quiz (cms-picker.json: how easy each one is, the design control it suits,
  // and a few lists). The reasons shown come from the same data, so the result never claims anything the
  // table doesn't. The answers stay in the page address, so a result can be shared; nothing is stored.
  const QUESTIONS = [
    { id: 'what', q: 'What are you making?', opts: [['site', 'A site for my business or work', 'Services, portfolio, about and contact'], ['store', 'An online store', 'Products, checkout and payments'], ['content', 'A blog, newsletter or publication', 'Writing is the main thing'], ['custom', 'Something custom', 'An app or portal, built with a developer']] },
    { id: 'who', q: 'Who’ll build and update it?', opts: [['easy', 'Me, and I’m not technical', 'It needs to be simple'], ['learn', 'Me, and I’m happy to learn', 'A bit of a learning curve is fine'], ['agency', 'A designer or agency', 'They build it; I might edit'], ['dev', 'A developer', 'Code is fine']] },
    { id: 'care', q: 'Do you want to look after hosting, updates and security?', opts: [['no', 'No, handle it for me', 'Everything included'], ['yes', 'That’s fine', 'Or someone will do it for me']] },
    { id: 'size', q: 'How big is the shop?', when: (a) => a.what === 'store', opts: [['small', 'Up to a few dozen products', 'A small shop'], ['big', 'Hundreds of products, or B2B', 'A large catalogue, or selling to businesses']] },
    { id: 'lang', q: 'Will it be in more than one language?', opts: [['no', 'No', 'One language'], ['yes', 'Yes', 'Two or more']] },
    { id: 'look', q: 'How much control over the design do you want?', opts: [['template', 'A good template is enough', 'Pick one and go'], ['visual', 'Arrange things visually myself', 'Drag, drop and adjust'], ['pixel', 'Every detail', 'Exactly as designed']] },
    { id: 'leave', q: 'How important is taking everything with you if you switch later?', opts: [['yes', 'Very important', 'I want to own all of it'], ['no', 'Not a big concern', 'I’ll probably stay']] },
  ];
  // Shared result links carry the quiz version (v=1). Links from before versions (no v) are version 1.
  // When the questions change, raise LINK_VERSION and translate older answers in readLink, so links
  // people have already shared keep opening a result rather than an empty quiz.
  const LINK_VERSION = 1;
  function readLink(params) {
    const v = Number(params.get('v') || 1);
    params.delete('v');
    const answers = Object.fromEntries(params);
    if (v === 1) return answers;
    return null;   // a newer version than this page knows: start the quiz fresh
  }
  const WHAT = { site: 'Made for business and portfolio sites', store: 'Made for online stores', content: 'Made for blogs and publishing', custom: 'Made for custom builds' };
  const LOOKS = { template: 'Good templates to start from', visual: 'Arrange your pages visually', pixel: 'Full control over the design' };
  // Effort, from values already checked: the quiz's ease score and the profile's hosting line
  const SKILL = ['Needs a developer', 'Takes some learning', 'Easy to learn', 'No technical skill needed'];
  function upkeep(hosting) {
    if (/^Handled for you$/.test(hosting)) return 'Updates and security handled for you';
    if (/^You or your host$/.test(hosting)) return 'Updates and security are on you';
    return hosting ? `Hosting: ${hosting.charAt(0).toLowerCase()}${hosting.slice(1)}` : '';
  }
  // First steps after picking a platform, each linking to that platform's own docs when the answer has a source
  const STEPS = [
    ['meta_title', 'Give each page a title and description for search'],
    ['gsc404', 'Moving from an old site? Point the old links to the new pages'],
    ['noindex', "Hide pages that shouldn't show in search, like thank-you pages"],
    ['ai_crawlers', 'Choose which AI bots may read the site'],
  ];
  function nextSteps(p) {
    const ol = el('ol', 'qz-steps');
    STEPS.forEach(([row, text]) => {
      const ans = (data.answers[p.id] || {})[row] || {};
      const li = el('li', null, text);
      if (ans.sourceUrl) {
        const a = el('a', null, `How on ${p.name}`);
        a.href = ans.sourceUrl;
        a.rel = 'noopener';
        a.target = '_blank';
        li.append(' · ', a);
      }
      // How it's done there, when it isn't simply built in ("Yes, with an SEO plugin" → "With an SEO plugin")
      const how = (ans.verdict && ans.verdict !== 'yes' && ans.verdict !== 'auto' && ans.mark || '').replace(/^yes,?\s*/i, '');
      if (how) li.append(el('small', null, how.charAt(0).toUpperCase() + how.slice(1)));
      ol.append(li);
    });
    return ol;
  }

  function fitScore(p, a) {
    const Q = data.quiz, pr = p.profile || {}, why = [];
    const has = (list) => (Q[list] || []).includes(p.id);
    const verdict = (row) => ((data.answers[p.id] || {})[row] || {}).verdict;
    let s = 0;
    if ((pr.goals || []).includes(a.what)) { s += 4; why.push(WHAT[a.what]); } else s -= 8;
    if (a.what !== 'store' && has('storeOnly')) s -= 6;
    if (a.what === 'custom' && has('customFrontEnd')) { s += 3; why.push('Feeds an app or any front end from one place'); }
    const ease = Q.ease[p.id] ?? 1;
    if (a.who === 'easy') { s += ease * 2 - 3; if (ease === 3) why.push('Easy to run without technical skills'); }
    if (a.who === 'learn') s += ease >= 1 ? 1 : -2;
    if (a.who === 'agency' && has('agency')) { s += 2; why.push('A common choice for designers and agencies'); }
    if (a.who !== 'agency' && has('agencyOnly')) s -= 2;
    if (a.who === 'dev') { if (ease <= 1) { s += 2; why.push('Gives a developer full control'); } else s -= 1; }
    if (a.care === 'no') {
      const handled = /^Handled for you/.test(pr.hosting || '');
      s += handled ? 2 : -3;
      if (handled) why.push('Hosting, updates and security are handled for you');
    }
    if (a.what === 'store') {
      s += { yes: 2, plugin: 0, code: -3, no: -6 }[verdict('store')] ?? 0;
      if (a.size === 'big') { if (has('largeCatalogue')) { s += 3; why.push('Handles large catalogues'); } else s -= 2; }
      if (a.size === 'small' && has('smallShop')) s += 1;
    }
    if (a.lang === 'yes') {
      const l = verdict('languages');
      s += { yes: 2, plugin: 0, code: -2, no: -4 }[l] ?? 0;
      if (l === 'yes') why.push('More than one language is built in');
    }
    if ((Q.look[p.id] || []).includes(a.look)) { s += 2; why.push(LOOKS[a.look]); }
    if (a.leave === 'yes') {
      if (/^Everything/.test(pr.export || '')) { s += 2; why.push('You can take everything with you'); }
      else if (/API/.test(pr.export || '')) { s += 1; why.push('Your content stays yours, through the API'); }
      else s -= 1;
    }
    return { p, s, why: why.filter(Boolean).slice(0, 4) };
  }

  function setupQuiz() {
    const box = $('#qz');
    if (!box) return;
    // Until data.json carries the quiz's values (the next publish), the page works as before
    if (!data.quiz) {
      $('#quiz').hidden = true;
      document.querySelectorAll('a[href="#quiz"]').forEach((l) => { l.href = '#fit'; });
      $('.cta .btn.primary').textContent = 'Find my fit';
      return;
    }
    let step = 0, a = {};
    const steps = () => QUESTIONS.filter((q) => !q.when || q.when(a));
    const valid = (o) => steps().every((q) => q.opts.some(([v]) => v === o[q.id]));

    function ask() {
      const list = steps();
      if (step >= list.length) return results();
      const q = list[step];
      box.replaceChildren();
      const top = el('div', 'qz-top');
      top.append(el('span', null, `Question ${step + 1} of ${list.length}`));
      const bar = el('span', 'qz-bar'), fill = el('i');
      fill.style.width = `${(step / list.length) * 100}%`;
      bar.append(fill);
      top.append(bar);
      const h = el('h3', null, q.q);
      h.tabIndex = -1;
      const opts = el('div', 'qz-opts');
      opts.setAttribute('role', 'group');
      opts.setAttribute('aria-label', q.q);
      q.opts.forEach(([v, title, sub]) => {
        const b = el('button', 'qz-opt');
        b.type = 'button';
        b.setAttribute('aria-pressed', String(a[q.id] === v));
        b.append(el('b', null, title), el('small', null, sub));
        b.addEventListener('click', () => { a[q.id] = v; step++; ask(); box.querySelector('h3')?.focus({ preventScroll: true }); });
        opts.append(b);
      });
      box.append(top, h, el('p', 'qz-hint', 'Pick the closest one; you can go back and change it.'), opts);
      if (step) {
        const nav = el('div', 'qz-nav'), back = el('button', 'btn', 'Back');
        back.type = 'button';
        back.addEventListener('click', () => { step--; ask(); box.querySelector('h3')?.focus({ preventScroll: true }); });
        nav.append(back);
        box.append(nav);
      }
    }

    function results() {
      const ranked = data.platforms.map((p) => fitScore(p, a)).sort((x, y) => y.s - x.s);
      const best = ranked[0].s, top = ranked.slice(0, 3), also = ranked.slice(3, 6).filter((r) => r.s > best - 6);
      const label = (r, i) => (!i ? 'Best match' : r.s >= best - 4 ? 'Good match' : 'Worth a look');
      history.replaceState(null, '', `#quiz?v=${LINK_VERSION}&${new URLSearchParams(Object.entries(a).filter(([k]) => steps().some((q) => q.id === k)))}`);
      window.jsalAchieve?.('decision');   // achievement (/nav.js)
      box.replaceChildren();
      const head = el('div', 'qz-top');
      head.append(el('span', null, 'Your best matches'));
      const bar = el('span', 'qz-bar'), fill = el('i');
      fill.style.width = '100%';
      bar.append(fill);
      head.append(bar);
      const h = el('h3', 'sr-only', 'Your best matches');
      h.tabIndex = -1;
      const list = el('div', 'qz-res');
      top.forEach((r, i) => {
        const card = el('article', `qz-card${i ? '' : ' top'}`), pr = r.p.profile || {};
        const name = el('h4', null, r.p.name);
        name.append(el('span', 'fitp', label(r, i)));
        card.append(logo(r.p), name, el('p', 'sum', pr.summary || ''));
        const fx = el('p', 'qz-effort');
        [SKILL[data.quiz.ease[r.p.id] ?? 1], upkeep(pr.hosting)].filter(Boolean).forEach((t) => fx.append(el('span', null, t)));
        card.append(fx);
        const ul = el('ul');
        r.why.forEach((w) => ul.append(el('li', null, w)));
        card.append(ul);
        const skip = (pr.lessSuited || [])[0];
        if (skip) card.append(el('p', 'qz-warn', `Not ideal if ${skip.charAt(0).toLowerCase()}${skip.slice(1)}`));
        list.append(card);
      });
      box.append(head, h, list);
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
      again.addEventListener('click', () => { a = {}; step = 0; history.replaceState(null, '', location.pathname); ask(); box.querySelector('h3')?.focus({ preventScroll: true }); });
      nav.append(cmp, copy, again);
      box.append(nav);
    }

    // A shared result (#quiz?v=1&what=site&who=easy…) opens straight on it
    const m = location.hash.match(/^#quiz\?(.+)$/);
    const shared = m && readLink(new URLSearchParams(m[1]));
    if (shared && valid(shared)) { a = shared; step = steps().length; results(); requestAnimationFrame(() => $('#quiz').scrollIntoView()); return; }
    ask();
  }

  // no-cache: always check with the server (a quick 304 if unchanged), so a publish shows straight away
  fetch('data.json', { cache: 'no-cache' }).then((r) => r.json()).then((d) => { data = d; build(); })
    .catch(() => { $('#grid').replaceChildren(el('p', 'empty', 'Could not load the answers. Try reloading the page.')); });
})();
