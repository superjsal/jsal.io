// CMS Picker: the Find my fit quiz, the platform cards and the platform × item grid, from data.json (answers and
// profiles, written by the publish) and quiz.json (the quiz's own values).
(() => {
  const $ = (s) => document.querySelector(s);
  // pick: the quiz's best match, marked in the table; quiz: its result while "Compare these" stands; touched: the
  // comparison was changed by hand; diffs: only differing rows; open: platforms expanded in "Show all"; folded: phone groups
  const state = { goal: 'all', compare: new Set(), notes: false, diffs: false, pick: null, quiz: null, touched: false, open: new Set(), folded: null };
  // Short tag wording for the grid and key (data.json keeps the full labels)
  const SHORT = { yes: 'Built in', auto: 'Automatic', plugin: 'Plugin/app', code: 'Needs code', hosting: 'Hosting/DNS', check: 'Unclear', indirect: 'Indirectly', no: 'Not possible' };
  // "What it costs to start": bands from each platform's own pricing page, never a price (not in the key above the table)
  const COST = { free: 'Free to start', low: 'Under $25/mo', mid: '$25–$100/mo', high: 'Over $100/mo', software: 'Free software + hosting', na: 'Not for stores' };
  Object.assign(SHORT, COST);
  // Scope as a symbol, explained once in the key
  // Only the exceptions are marked (a short word after the tag); the longer wording is for the tooltip
  const SCOPE = { V: ['varies', 'Varies by site: depends on the plan, theme or setup'], C: ['not verified', 'Not checked against the platform’s own docs yet'] };
  // "varies" after a tag: a "*" on screen, the word for screen readers
  function scopeMark(word) {
    const s = el('span', 'sc sc-mark'), star = el('span', null, '*');
    star.setAttribute('aria-hidden', 'true');
    s.append(star, el('span', 'sr-only', word));
    return s;
  }
  // A note that only repeats its tag isn't shown ("Yes", "Yes, with an SEO plugin", "Automatic"…)
  const GENERIC = /^(yes|no|check|automatic|built in)$|^yes, with (an? )?(seo |redirect )?(plugin|module|extension|app|custom code)$/i;
  // With "Show all", the grid starts with these; any other choice starts with the platforms that fit it
  const DEFAULT_COMPARE = ['wordpress', 'shopify', 'wix', 'squarespace'];
  let data;
  const PHONE = matchMedia('(max-width: 720px)');   // the table's phone layout (styles.css): a card per row

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Platform logos drawn in the text colour via a mask, so they match the theme; without one, a letter badge
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

  // "What are you building?": each profile lists the goals it suits
  const GOALS = [['all', 'Show all'], ['store', 'Online store'], ['site', 'Business or marketing site'], ['content', 'Blog or content'], ['custom', 'Custom build with developers']];
  const fits = (p) => state.goal === 'all' || ((p.profile && p.profile.goals) || []).includes(state.goal);

  function setGoal(g) {
    state.goal = g;
    state.pick = state.quiz = null;
    state.compare = new Set(g === 'all' ? DEFAULT_COMPARE : data.platforms.filter(fits).map((p) => p.id));
    state.touched = false;
    renderCards();
    render();
  }
  function toggleCompare(id) {
    state.pick = state.quiz = null;
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
      // The facts panel: hosting and updates, what you can take with you, and when to skip it
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
  // "Show all": one line per platform; the name is a button that opens the rest of the card in place
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
    // A hidden ": " between name and summary, so screen readers don't run them together
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
  // The table's header row: lifted (line and shadow) only while it's pinned to the top of the window
  function liftHead() {
    const h = $('#thead');
    h.classList.toggle('stuck', !h.hidden && h.getBoundingClientRect().top <= 0 && $('#seo .scroll').getBoundingClientRect().bottom > h.offsetHeight);
  }
  // Shown while the cards are on screen and the table isn't yet, and only with something picked
  function placeBar() {
    const fit = $('#fit').getBoundingClientRect(), table = $('#seo .scroll').getBoundingClientRect();
    // the table closed counts as "not on screen yet"
    const on = state.compare.size > 0 && !$('#fit').hidden && fit.top < innerHeight * 0.5 && fit.bottom > 0 && ($('#seo').hidden || table.top > innerHeight - 60);
    $('#cbar').classList.toggle('show', on);
    document.body.classList.toggle('cbar-on', on);
  }
  // The cards (#fit) and the table (#seo) stay closed until asked for (hidden="until-found" lets find-in-page open them)
  function setPanel(id, open) {
    const s = $('#' + id);
    if (open) s.hidden = false; else s.setAttribute('hidden', 'until-found');
    $(`.more-btn[data-panel="${id}"]`).setAttribute('aria-expanded', String(open));
    if (open && id === 'seo') render();   // the pinned header measures the table, which had no size while closed
    placeBar();
  }
  function openPanel(id) { if ($('#' + id).hidden) setPanel(id, true); }

  function render() {
    const plats = data.platforms.filter((p) => state.compare.has(p.id));
    const items = data.items;
    document.querySelectorAll('.chip[data-pid]').forEach((b) => b.setAttribute('aria-pressed', String(state.compare.has(b.dataset.pid))));
    $('#plats-count').textContent = `${plats.length} of ${data.platforms.length}`;

    const grid = $('#grid'), ghead = $('#ghead');
    grid.replaceChildren();
    ghead.replaceChildren();
    [grid, ghead].forEach((g) => g.style.setProperty('--n', Math.max(plats.length, 1)));
    $('#thead').hidden = !plats.length;
    grid.classList.toggle('compact', !state.notes);
    // The one line above the table on what put the quiz's best match ahead (the result card's own words)
    const line = $('#qz-line');
    line.hidden = !(state.quiz && state.quiz.line && plats.length);
    if (!line.hidden) {
      const back = el('a', null, 'See the full result ↑');
      back.href = '#quiz';
      line.replaceChildren(el('b', null, state.quiz.eyebrow), el('span', null, state.quiz.line), back);
    }
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
      const fit = state.quiz && state.quiz.fit[p.id];   // the quiz's label, while its three are being compared
      if (fit) c.append(el('span', `fitp${fit.low ? ' low' : ''}`, fit.label));
      if (p.profile) c.append(el('span', 'htype', p.profile.type));
      head.append(c);
    });
    ghead.append(head);
    $('#thead').scrollLeft = $('#seo .scroll').scrollLeft;
    // Rows the quiz's answers rule out (score.js weight) stay, dimmed; "Only differences" drops rows where every
    // compared platform has the same tag
    const ruledOut = (it) => !!state.quiz && (it.id.startsWith('cost_') ? it.id !== state.quiz.cost : weight(it.id, state.quiz.answers) === 0);
    const shown = state.diffs && plats.length > 1 ? items.filter((it) => new Set(plats.map((p) => data.answers[p.id][it.id].verdict)).size > 1) : items;
    if (!shown.length) {
      grid.append(el('p', 'empty', 'These platforms have the same answer on every row.'));
      return;
    }
    // A label row where each section starts; on phones a button that folds the group's rows (the first starts open)
    const groups = Object.fromEntries((data.groups || []).map((g) => [g.id, g]));
    const order = [...new Set(items.map((it) => it.group))].filter((g) => groups[g]);
    if (!state.folded) state.folded = new Set(order.slice(1));
    let lastGroup = null, body = grid;
    shown.forEach((it) => {
      if (it.group !== lastGroup && groups[it.group]) {
        // The heading, then its qualifiers quietly ("approx., billed yearly", the as-of date)
        const g = groups[it.group], id = it.group, [, main, extra] = g.title.match(/^(.*?)(?:\s*\((.*)\))?$/);
        const note = [extra, g.asOf && `as of ${g.asOf}`].filter(Boolean).join(' · ');
        const heading = () => { const s = el('span', 'gtitle', main); if (note) s.append(el('small', 'gnote', note)); return s; };
        const gr = el('div', 'row group');
        gr.append(heading());
        const fold = el('button', 'gfold');
        fold.type = 'button';
        fold.setAttribute('aria-expanded', String(!state.folded.has(id)));
        fold.setAttribute('aria-controls', `grows-${id}`);
        fold.append(heading(), el('span', 'gcount', `${shown.filter((x) => x.group === id).length} rows`));
        fold.addEventListener('click', () => {
          state.folded.has(id) ? state.folded.delete(id) : state.folded.add(id);
          render();
          document.querySelector(`.gfold[aria-controls="grows-${id}"]`)?.focus();
        });
        gr.append(fold);
        grid.append(gr);
        body = el('div', `grows${state.folded.has(id) ? ' folded' : ''}`);
        body.id = `grows-${id}`;
        grid.append(body);
      }
      lastGroup = it.group;
      const off = ruledOut(it);
      const row = el('div', `row${off ? ' off' : ''}`);
      // On a phone a ruled-out row folds to its label (each row is a card there, ~200px tall for three platforms)
      const fold = off && PHONE.matches;
      const label = el(fold ? 'button' : 'div', 'item', it.label);
      if (it.term) label.append(el('small', 'term', it.term));   // the SEO name, small, under the plain question
      if (off) {
        const note = el('small', 'off-note', fold ? 'Not for your answers · show' : 'Not for your answers');
        label.append(note);
        if (fold) {
          label.type = 'button';
          label.setAttribute('aria-expanded', 'false');
          label.addEventListener('click', () => {
            const open = row.classList.toggle('open');
            label.setAttribute('aria-expanded', String(open));
            note.textContent = `Not for your answers · ${open ? 'hide' : 'show'}`;
          });
        }
      }
      row.append(label);
      plats.forEach((p, i) => {
        const c = data.answers[p.id][it.id], cell = el('div', `cell${p.id === state.pick ? ' col-pick' : ''}`);
        cell.dataset.col = i;
        const [word, scope] = SCOPE[c.scope] || ['', ''];
        const line = el('span', 'line');
        line.append(el('span', `tag ${c.verdict}`, SHORT[c.verdict] || data.verdicts[c.verdict] || c.verdict));
        if (word) {
          // "varies" is a mark right after the tag (the key says what it means; screen readers hear the word);
          // the rarer "not verified" stays in words, under the tag
          const s = c.scope === 'V' ? scopeMark(word) : el('span', 'sc', word);
          if (c.scope !== 'V') line.classList.add('words');
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
        if (cell.dataset.note || cell.dataset.where) {
          const b = el('button', 'nbtn');
          b.type = 'button';
          b.setAttribute('aria-expanded', 'false');
          b.setAttribute('aria-label', `${p.name}’s note`);
          b.addEventListener('click', () => b.setAttribute('aria-expanded', String(cell.classList.toggle('open'))));
          cell.classList.add('noted');
          cell.append(b);
        }
        if (!state.notes && (cell.dataset.note || cell.dataset.scope || cell.dataset.where)) cell.tabIndex = 0;   // notes off: Tab to a cell opens its note too
        row.append(cell);
      });
      body.append(row);
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
    // Select all and Clear sit on the line above the chips, beside "Compare · 4 of 13"
    const all = el('button', 'plats-act', 'Select all');
    all.type = 'button';
    all.addEventListener('click', () => { data.platforms.forEach((p) => state.compare.add(p.id)); state.touched = true; state.quiz = null; renderCards(); render(); });
    const none = el('button', 'plats-act', 'Clear');
    none.type = 'button';
    none.addEventListener('click', () => { state.compare.clear(); state.touched = true; state.quiz = null; renderCards(); render(); });
    $('#plats-acts').append(all, none);

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
    // The column under the pointer or focus is marked, header included (only with two or more columns)
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
    // Hero: platform count and when the answers were last checked
    document.querySelectorAll('.n-plats').forEach((n) => { n.textContent = data.platforms.length; });
    if (data.asOf) $('#asof').textContent = data.asOf;
    // Notes off: hovering, tapping or tabbing to an answer shows its note in a tooltip fixed to the window (so the
    // table's scroll box can't clip it); screen readers get the note from the cell itself, so it's aria-hidden
    const tip = $('#tip');
    let tipCell = null;
    const hideTip = () => { tip.hidden = true; tipCell = null; };
    const showTip = (cell) => {
      if (cell === tipCell) return;
      if (state.notes || PHONE.matches || !cell || !(cell.dataset.note || cell.dataset.scope || cell.dataset.where)) { hideTip(); return; }
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
    PHONE.addEventListener('change', () => { if (state.quiz) render(); });   // ruled-out rows fold only on phones

    // Back to top, once the hero is out of view
    const totop = $('#totop');
    new IntersectionObserver(([e]) => totop.classList.toggle('show', !e.isIntersecting)).observe($('.hero'));
    totop.addEventListener('click', () => scrollTo({ top: 0 }));   // smooth via scroll-behavior in shell.css
    let lastY = scrollY;
    addEventListener('scroll', () => {
      if (Math.abs(scrollY - lastY) < 12) return;   // ignore jitter
      totop.classList.toggle('up', scrollY < lastY);
      lastY = scrollY;
    }, { passive: true });

    // "Show notes" (remembered in this browser), off by default. Each switch is one side of a two-button track
    const setPair = (btn, on) => { btn.setAttribute('aria-pressed', String(on)); btn.previousElementSibling.setAttribute('aria-pressed', String(!on)); };
    const notes = $('#notes');
    $('#notes-off').addEventListener('click', () => { if (state.notes) notes.click(); });
    try { state.notes = localStorage.getItem('cms-picker-notes') === 'on'; } catch (e) { /* storage blocked: notes stay off */ }
    setPair(notes, state.notes);
    notes.addEventListener('click', () => {
      state.notes = !state.notes;
      hideTip();
      setPair(notes, state.notes);
      try { localStorage.setItem('cms-picker-notes', state.notes ? 'on' : 'off'); } catch (e) { /* not remembered */ }
      render();
    });
    // "Only differences" (remembered too): rows where every compared platform has the same tag are left out
    const diffs = $('#diffs');
    $('#diffs-off').addEventListener('click', () => { if (state.diffs) diffs.click(); });
    try { state.diffs = localStorage.getItem('cms-picker-diffs') === 'on'; } catch (e) { /* storage blocked: off */ }
    setPair(diffs, state.diffs);
    diffs.addEventListener('click', () => {
      state.diffs = !state.diffs;
      hideTip();
      setPair(diffs, state.diffs);
      try { localStorage.setItem('cms-picker-diffs', state.diffs ? 'on' : 'off'); } catch (e) { /* not remembered */ }
      render();
    });
    // Key: only the tags the table actually uses
    const used = new Set(Object.values(data.answers).flatMap((a) => Object.values(a).map((c) => c.verdict)));
    const legend = $('#legend');
    Object.keys(SHORT).filter((k) => used.has(k) && !(k in COST)).forEach((k) => legend.append(el('span', `tag ${k}`, SHORT[k])));
    // What follows a tag, explained where the tags are (not only in the note under the table): the mark, then the words
    Object.entries(SCOPE).forEach(([k, [word, meaning]]) => {
      const s = el('span', 'sc', k === 'V' ? `* ${word}` : word);
      s.title = meaning;
      legend.append(s);
    });
    setGoal('all');
    setupQuiz();
    // Opening a panel brings its heading into view (closing stays put), or the tap seems to do nothing
    document.querySelectorAll('.more-btn').forEach((b) => b.addEventListener('click', () => {
      const open = b.getAttribute('aria-expanded') !== 'true';
      setPanel(b.dataset.panel, open);
      if (open) $('#' + b.dataset.panel).scrollIntoView();
    }));
    ['fit', 'seo'].forEach((id) => $('#' + id).addEventListener('beforematch', () => requestAnimationFrame(() => setPanel(id, true))));
    // Links to #fit or #seo open the panel before the browser scrolls to it; #seo?with=<id> (a platform page's
    // Compare link) adds that platform to the comparison as the column to follow
    const fromHash = () => {
      const [id, query] = location.hash.slice(1).split('?');
      if (id !== 'fit' && id !== 'seo') return;
      const withId = new URLSearchParams(query || '').get('with');
      if (id === 'seo' && withId && data.platforms.some((p) => p.id === withId)) {
        state.compare = new Set([withId, ...DEFAULT_COMPARE]);
        state.pick = withId;
        state.touched = true;
        state.quiz = null;
        renderCards();
        render();
      }
      openPanel(id);
      $('#' + id).scrollIntoView();
    };
    document.addEventListener('click', (e) => { const a = e.target.closest('a[href="#fit"], a[href="#seo"]'); if (a) openPanel(a.getAttribute('href').slice(1)); }, true);
    addEventListener('hashchange', fromHash);
    fromHash();
  }

  // ---------- Find my fit: a short guided quiz ----------
  // One question at a time, then the best matches; questions and scoring in score.js. The answers live in the page
  // address so a result can be shared; nothing is stored.
  const { QUESTIONS, NEUTRAL, LOW_FIT, rank, candidates, explain, standing, behind, tied, near, divider, firstGap, conflict, costRow, weight, TIP, LEAD, options } = window.cmsScore;
  // Shared result links carry the quiz version (v=4; none means 1). When the questions change, raise LINK_VERSION and
  // translate older answers in readLink, so shared links keep opening a result.
  const LINK_VERSION = 4;
  // Returns { answers, old } (old: a link from before some of today's questions, answered neutrally or offered above
  // the result), or null. v3 folded members into needs and leave into moving (grow dropped); v4 made languages a tick.
  function readLink(params) {
    const v = Number(params.get('v') || 1);
    params.delete('v');
    const answers = Object.fromEntries(params);
    if (v > LINK_VERSION) return null;   // a newer version than this page knows: start the quiz fresh
    if (v < 3) {
      if (!answers.needs) answers.needs = answers.members === 'yes' ? 'members' : 'none';
      if (!answers.moving && answers.leave === 'no') answers.moving = 'no';
      ['members', 'leave', 'grow'].forEach((k) => delete answers[k]);
    }
    if (v < 4 && answers.needs === 'lang') { answers.needs = 'none'; answers.lang = 'yes'; }
    if (answers.lang !== 'yes') delete answers.lang;
    return { answers, old: v < 3 };
  }
  // Effort, from values already checked: the quiz's ease score and the profile's hosting line
  const SKILL = ['Needs a developer', 'Takes some learning', 'Easy to learn', 'No technical skill needed'];
  // First steps after picking a platform, each linking to the platform's own docs; a row id means "use that answer"
  const SEARCH_CONSOLE = 'https://support.google.com/webmasters/answer/34592';   // Google's own guide, the same on every platform
  const STEPS = [
    { text: 'Connect your own domain name', domain: true },
    { row: 'meta_title', text: 'Give each page a title and description for search' },
    { text: 'Tell Google the site exists: add it to Search Console and submit its sitemap', url: SEARCH_CONSOLE, link: 'Google’s guide' },
    { row: 'gsc404', text: 'Point your old site’s links to the new pages', moving: true },
  ];
  const LATER = [['noindex', 'hide pages from search'], ['ai_crawlers', 'choose which AI bots may read the site']];
  const LATER_FRESH = ['gsc404', 'point old links to new pages when pages move'];   // starting fresh: the moving step waits
  // A box's heading; under LOW_FIT the first is only the closest, so its box compares like the others' ("Compared with Wix")
  const boxHead = (vs, weak) => (vs.head.startsWith('Why ') && weak ? `Compared with ${vs.than}` : vs.head);
  // Reasons the scoring takes from a sourced table row (score.js), so the card can link the platform's own docs for them
  const EVIDENCE = { 'More than one language is built in': 'languages', 'Paid memberships built in': 'members' };
  function docLink(url, text) {
    const a = el('a', null, text);
    a.href = url;
    a.rel = 'noopener';
    a.target = '_blank';
    return a;
  }
  // moving: the "Moving from somewhere?" answer. Leaving a named platform makes the last step name it ("Point your old
  // Wix links…"); starting fresh moves it to "Later"
  function nextSteps(p, moving) {
    const answer = (row) => (data.answers[p.id] || {})[row] || {};
    const fresh = !moving || moving === 'no', from = data.platforms.find((x) => x.id === moving);
    const ol = el('ol', 'qz-steps');
    STEPS.filter((s) => !(s.moving && fresh)).forEach((s) => {
      const ans = s.row ? answer(s.row) : {};
      const url = s.url || (s.domain ? data.quiz.domainDocs[p.id] : ans.sourceUrl);
      const li = el('li', null, s.moving && from ? `Point your old ${from.name} links to the new pages` : s.text);
      if (url) li.append(' · ', docLink(url, s.link || `How on ${p.name}`));
      // How it's done there, when it isn't simply built in ("Yes, with an SEO plugin" → "With an SEO plugin")
      const how = (ans.verdict && ans.verdict !== 'yes' && ans.verdict !== 'auto' && ans.mark || '').replace(/^yes,?\s*/i, '');
      if (how) li.append(el('small', null, how.charAt(0).toUpperCase() + how.slice(1)));
      ol.append(li);
    });
    // Less common, so not numbered: a single line, each part linked where there's a source
    const later = el('p', 'qz-later');
    later.append(el('b', null, 'Later, if you need it: '));
    (fresh ? [...LATER, LATER_FRESH] : LATER).forEach(([row, text], i) => {
      if (i) later.append(' · ');
      const url = answer(row).sourceUrl;
      later.append(url ? docLink(url, text) : text);
    });
    const frag = document.createDocumentFragment();
    frag.append(ol, later);
    return frag;
  }

  // One of several platforms: chips, or on a phone the phone's own picker (a row of thirteen uneven names staggers there)
  function picker(label, options, currentId, onPick) {
    if (PHONE.matches) {
      const sel = el('select', 'qz-pick');
      sel.setAttribute('aria-label', label);
      options.forEach(([id, name]) => { const o = el('option', null, name); o.value = id; o.selected = id === currentId; sel.append(o); });
      if (currentId == null) { const o = el('option', null, 'Choose a platform…'); o.value = ''; o.selected = true; sel.prepend(o); }
      sel.addEventListener('change', () => { if (sel.value) onPick(sel.value); });
      return sel;
    }
    const group = el('div', 'qz-pick-chips');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', label);
    options.forEach(([id, name]) => {
      const b = el('button', 'chip', name);
      b.type = 'button';
      b.dataset.id = id;
      b.setAttribute('aria-pressed', String(id === currentId));
      b.addEventListener('click', () => onPick(id));
      group.append(b);
    });
    return group;
  }

  function setupQuiz() {
    const box = $('#qz');
    if (!box) return;
    let step = 0, a = {};
    const pending = new Set();   // questions an old link didn't have: answered neutrally (NEUTRAL) or not at all, and offered above the results
    const steps = (o = a) => QUESTIONS.filter((q) => !q.when || q.when(o));   // the questions these answers call for
    const valid = (o) => steps(o).every((q) => options(q, o, data).some(([v]) => v === o[q.id]));

    // A question's tick (q.also): a checkbox that goes with whichever choice is picked, kept under its own id
    function alsoBox(q, onChange) {
      if (!q.also) return null;
      const lab = el('label', 'qz-tick'), input = el('input');
      input.type = 'checkbox';
      input.checked = a[q.also.id] === 'yes';
      input.addEventListener('change', () => { a[q.also.id] = input.checked ? 'yes' : 'no'; onChange(); });
      const text = el('span');
      text.append(el('b', null, q.also.title), el('small', null, q.also.hint));
      lab.append(input, text);
      return lab;
    }

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
      // "Moving from somewhere?": its platforms are a row of logo chips under the two plain answers, one tap like the rest
      const from = q.plats ? el('div', 'qz-from') : null;
      if (from) { from.setAttribute('role', 'group'); from.setAttribute('aria-label', 'Yes, from one of these'); }
      let busy = false;
      const pick = async (v, b) => {
        if (busy) return;
        // The choice shows as selected for a moment, so it's clear it registered, before the next question
        busy = true;
        box.querySelectorAll('.qz-opt, .qz-from .chip').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
        await new Promise((r) => setTimeout(r, 150));
        window.jsalUsed?.();   // "First steps" / "Explorer" (/nav.js)
        a[q.id] = v;
        pending.delete(q.id);
        if (resume) {
          const next = steps().findIndex((x) => pending.has(x.id) || !options(x, a, data).some(([o]) => o === a[x.id]));
          if (next < 0) { resume = false; step = steps().length; } else step = next;
        } else step++;
        ask();
        box.querySelector('h3')?.focus({ preventScroll: true });
      };
      options(q, a, data).forEach(([v, title, sub, , , plat]) => {
        const b = el('button', plat ? 'chip' : 'qz-opt');
        b.type = 'button';
        b.setAttribute('aria-pressed', String(a[q.id] === v));
        if (plat) b.append(logo(plat), title); else b.append(el('b', null, title), el('small', null, sub));
        b.addEventListener('click', () => pick(v, b));
        (plat ? from : opts).append(b);
      });
      box.append(top, h, el('p', 'qz-hint', q.hint || 'Pick the closest one; you can go back and change it.'), ...[alsoBox(q, () => {}), opts].filter(Boolean));
      if (from) box.append(el('p', 'qz-from-l', 'Yes, from one of these'), from);
      box.classList.remove('qz-in'); void box.offsetWidth; box.classList.add('qz-in');
      if (step) {
        const nav = el('div', 'qz-nav'), back = el('button', 'btn', 'Back');
        back.type = 'button';
        back.addEventListener('click', () => { step--; ask(); box.querySelector('h3')?.focus({ preventScroll: true }); });
        nav.append(back);
        box.append(nav);
      }
      // If the box's top has gone above the window (Start over, a new question), bring it back
      if (box.getBoundingClientRect().top < 0) $('#quiz').scrollIntoView();
    }

    // On the results: each answer as a button; tapping one opens its choices, and picking another
    // re-ranks straight away (or asks a question the change brings in, such as the shop's size)
    let editing = null, resume = false;   // resume: answering a question a change brought in goes straight back to the results
    let ansOpen = false;   // phones: the answers fold away under the heading, so the first match is right there; this keeps the fold as left
    let checking = null;   // "Had a platform in mind?": the platform being looked at, kept across re-renders
    function answersBar() {
      const bar = el('div', 'qz-ans'), tap = matchMedia('(pointer: coarse)').matches ? 'tap' : 'click';
      bar.append(el('p', 'qz-ans-l', `Your answers · ${tap} one to change it`));
      const chips = el('div', 'qz-ans-chips');
      const answered = steps().filter((q) => !pending.has(q.id));
      answered.forEach((q) => {
        const opt = options(q, a, data).find(([v]) => v === a[q.id]);
        // The answer on its own ("Two or more languages"), so it makes sense without remembering the question
        const b = el('button', 'chip', opt ? opt[3] : q.q);
        b.type = 'button';
        b.dataset.q = q.id;
        b.setAttribute('aria-expanded', String(editing === q.id));
        b.setAttribute('aria-label', `${opt ? opt[3] : ''}. Change your answer to: ${q.q}`);
        b.addEventListener('click', () => { editing = editing === q.id ? null : q.id; results(); box.querySelector(`.qz-ans-chips [data-q="${q.id}"]`)?.focus({ preventScroll: true }); });
        chips.append(b);
        // A ticked "also" is an answer of its own; it opens the same question's choices, where it can be taken off
        if (q.also && a[q.also.id] === 'yes') {
          const t = el('button', 'chip', q.also.own);
          t.type = 'button';
          t.dataset.q = q.also.id;
          t.setAttribute('aria-expanded', String(editing === q.id));
          t.setAttribute('aria-label', `${q.also.own}. Change your answer to: ${q.q}`);
          t.addEventListener('click', () => { editing = editing === q.id ? null : q.id; results(); box.querySelector(`.qz-ans-chips [data-q="${q.id}"]`)?.focus({ preventScroll: true }); });
          chips.append(t);
        }
      });
      bar.append(chips);
      const q = steps().find((x) => x.id === editing);
      if (q) {
        const ed = el('div', 'qz-ans-ed');
        ed.setAttribute('role', 'group');
        ed.setAttribute('aria-label', q.q);
        ed.append(el('p', null, q.q));
        // The tick on its own row above the choices, as in the quiz itself
        const also = alsoBox(q, () => { results(); box.querySelector('.qz-ans-ed input')?.focus({ preventScroll: true }); });
        if (also) { const row = el('div', 'qz-ans-tick'); row.append(also); ed.append(row); }
        options(q, a, data).forEach(([v, title]) => {
          const b = el('button', 'chip', title);
          b.type = 'button';
          b.setAttribute('aria-pressed', String(a[q.id] === v));
          b.addEventListener('click', () => {
            a[q.id] = v;
            pending.delete(q.id);
            editing = null;
            const missing = steps().findIndex((x) => !options(x, a, data).some(([o]) => o === a[x.id]));
            if (missing >= 0) { step = missing; resume = true; ask(); box.querySelector('h3')?.focus({ preventScroll: true }); return; }
            results();
            box.querySelector(`.qz-ans-chips [data-q="${q.id}"]`)?.focus({ preventScroll: true });
          });
          ed.append(b);
        });
        bar.append(ed);
      }
      if (!PHONE.matches) return bar;
      const fold = el('details', 'qz-ans-fold'), sum = el('summary');
      const count = answered.length + answered.filter((q) => q.also && a[q.also.id] === 'yes').length;   // a tick counts as an answer
      sum.append(el('b', null, 'Your answers'), el('span', null, ` · ${count} · ${tap} to change one`));
      fold.open = ansOpen || editing !== null;   // stays open while an answer is being changed
      fold.addEventListener('toggle', () => { ansOpen = fold.open; });
      fold.append(sum, bar);
      return fold;
    }

    // source: 'quiz' or 'link', sent as a GA4 event; re-showing after a change sends nothing
    function results(source) {
      // The platform being left isn't a match (candidates) but keeps its place in the full ranking, for "Had a platform in mind?"
      const ranked = candidates(data, a), all = rank(data, a), origin = all.find((x) => x.p.id === a.moving);
      const best = ranked[0].s, top = ranked.slice(0, 3), also = ranked.slice(3, 6).filter((r) => near(r, ranked[0], 5));
      // A tie for first is shown as one (score.js tied); under LOW_FIT the first is only the closest
      const isTop = (r) => r === top[0] || tied(r, top[0]), joint = !!top[1] && isTop(top[1]), weak = best < LOW_FIT;
      // How sure: level or a couple of points apart is a close call (score.js standing)
      const stand = standing(top), close = !!stand && (stand.kind === 'level' || stand.kind === 'close');
      const first = weak ? 'closest match' : 'best match';
      // Matches that lack a must-have the first has built in go under a divider (score.js divider); above it each has them all
      const split = divider(top), above = (r) => !split || top.indexOf(r) < split.at;
      const label = (r) => (isTop(r) ? (joint ? `Joint ${first}` : `${first.charAt(0).toUpperCase()}${first.slice(1)}`) : close && !weak && r === top[1] ? 'Close second' : above(r) && !weak && (split || near(r, top[0], 4)) ? 'Good match' : 'Worth a look');
      const told = explain(data, a, top);   // reasons without repeats, and what sets each apart
      // An old link stays v=1 (its own answers) until its newer questions are answered
      const kept = Object.entries(a).filter(([k, v]) => (steps().some((q) => q.id === k) && !pending.has(k)) || (v === 'yes' && steps().some((q) => q.also && q.also.id === k)));
      history.replaceState(null, '', `#quiz?v=${pending.size ? 1 : LINK_VERSION}&${new URLSearchParams(kept)}`);
      window.jsalAchieve?.('decision');   // achievement (/nav.js)
      if (source) window.jsalTrack?.('quiz_result', { top_match: ranked[0].p.id, fit: weak ? 'closest' : 'best', source });
      box.replaceChildren();
      box.classList.remove('qz-in'); void box.offsetWidth; box.classList.add('qz-in');   // fades in, like a new question
      const head = el('div', 'qz-top');
      head.append(el('span', null, `Your ${first}es`));   // no progress bar here: it would only be full
      const compareThese = () => {
        state.compare = new Set(top.map((r) => r.p.id));
        state.touched = true;
        state.pick = top[0].p.id;
        // The table carries the result along: each column's label and the first card's box as one line
        const vs = told[0].vs;
        // After the colon the sentence carries on in lower case, unless it starts with a platform's name
        const named = vs && data.platforms.some((p) => vs.text.startsWith(p.name));
        const line = !vs ? '' : `${boxHead(vs, weak)}: ${named ? vs.text : vs.text.charAt(0).toLowerCase() + vs.text.slice(1)}`;
        state.quiz = { fit: Object.fromEntries(top.map((r) => [r.p.id, { label: label(r), low: weak || !above(r) }])), line, eyebrow: `Your ${first}`, answers: { ...a }, cost: costRow(a) };
        state.folded = new Set();   // every group open: three platforms and folded ruled-out rows keep a phone's table short
        renderCards();
        openPanel('seo');
        render();
        // Straight to the result line and the first rows, past the platform chips and the key
        ($('#qz-line').hidden ? $('#seo') : $('#qz-line')).scrollIntoView();
      };
      // The result is four screens tall on a phone: the compare action is at the top as well as the bottom
      const jump = el('button', 'qz-jump', 'Compare these side by side ↓');
      jump.type = 'button';
      jump.addEventListener('click', compareThese);
      head.append(jump);
      const h = el('h3', 'sr-only', `Your ${first}es`);
      let sure = null;
      if (top[1] && !weak) {
        head.append(el('span', `qz-sure${close ? ' close' : ''}`, stand.pill));
        // How close it is, in words (the first card's box says why it's first, so this doesn't repeat it)
        sure = el('p', 'qz-sure-why', stand.line);
      }
      h.tabIndex = -1;
      const list = el('div', 'qz-res');
      top.forEach((r, i) => {
        if (split && i === split.at) {
          const div = el('div', 'qz-div');
          div.append(el('p', 'qz-div-h', split.head), el('p', null, split.lines.join(' ')));
          list.append(div);
        }
        const card = el('article', `qz-card${isTop(r) ? ' top' : ''}`), pr = r.p.profile || {};
        const name = el('h4', null, r.p.name);
        name.append(el('span', `fitp${weak || !above(r) ? ' low' : ''}`, label(r)));   // under the divider: neutral, not a fit
        card.append(logo(r.p), name, el('p', 'sum', pr.summary || ''));
        // The key facts people compare first: skill, hosting and updates, and the cost band for what's being made
        const fx = el('dl', 'qz-facts'), ease = data.quiz.ease[r.p.id] ?? 1;
        const cost = ((data.answers[r.p.id] || {})[costRow(a)] || {}).verdict;
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
        told[i].why.forEach((w) => {
          const li = el('li', null, w);
          // A reason that comes from a sourced table row links to the platform's own page on it: evidence, not a claim
          const row = EVIDENCE[w] || (/^(Free to start|Fits your budget)$/.test(w) ? costRow(a) : null);
          const src = r.links[w] || (row && ((data.answers[r.p.id] || {})[row] || {}).sourceUrl);
          if (src) li.append(' · ', docLink(src, 'docs'));
          ul.append(li);
        });
        card.append(ul);
        if (told[i].vs) {
          const vs = el('div', 'qz-vs');
          vs.append(el('p', 'qz-vs-h', boxHead(told[i].vs, weak)), el('p', null, told[i].vs.text));
          card.append(vs);
        }
        // Where it counts against an answer given (score.js "but"), so the pick never hides it
        if (r.but && r.but.length) card.append(el('p', 'qz-lim', `Worth knowing: ${r.but.join('; ')}.`));
        const skip = (pr.lessSuited || [])[0];
        if (skip) card.append(el('p', 'qz-lim', `Less suited if ${skip.charAt(0).toLowerCase()}${skip.slice(1)}`));
        list.append(card);
      });
      box.append(head, h);
      if (sure) box.append(sure);
      if (pending.size) {
        const more = el('button', 'btn qz-more', `${pending.size} newer question${pending.size === 1 ? '' : 's'} can sharpen this`);
        more.type = 'button';
        more.addEventListener('click', () => { step = steps().findIndex((q) => pending.has(q.id)); resume = true; ask(); box.querySelector('h3')?.focus({ preventScroll: true }); });
        box.append(more);
      }
      box.append(answersBar());
      // Above the cards, why they're only the closest: answers that pull against each other, or nothing fits well
      const clash = conflict(a);
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
      } else {
        // Even the best match lacks a must-have: nothing that fits has them all built in (score.js firstGap)
        const gap = firstGap(top);
        if (gap) { const note = el('p', 'qz-note'); note.append(el('span', null, gap)); box.append(note); }
      }
      // Moving from somewhere: what the old platform lets you take, and that a match importing from it says so
      if (a.moving && a.moving !== 'no') {
        const mig = el('p', 'qz-mig'), origin = data.platforms.find((p) => p.id === a.moving);
        if (origin) {
          const exp = (origin.profile || {}).export;
          // The export line's own colon ("Everything: a full WordPress export…") becomes a comma after ours
          mig.append(el('b', null, `Moving from ${origin.name}`), el('span', null, exp ? `What you can take with you: ${exp.charAt(0).toLowerCase()}${exp.slice(1).replace(': ', ', ')}.` : ''));
          if (Object.values(data.quiz.imports || {}).some((m) => m[origin.id])) mig.append(el('small', null, `A match whose own docs describe an import from ${origin.name} says so in its reasons.`));
        } else mig.append(el('b', null, 'Moving from another platform'), el('span', null, 'Check what it lets you export before you pick: posts and pages, products as a spreadsheet, or everything.'));
        box.append(mig);
      }
      box.append(list);
      // "Had a platform in mind?": any other platform ranked for these answers, with what counted for and against it
      const rest = [...(origin ? [origin] : []), ...ranked.slice(3)];
      if (origin && !rest.some((r) => r.p.id === checking)) checking = origin.p.id;
      if (rest.length) {
        const check = el('section', 'qz-check'), res = el('div');
        check.append(el('h4', null, 'Had a platform in mind?'), el('p', 'lead', 'See where it lands for your answers, and why.'));
        const showCheck = (id) => {
          checking = id;
          check.querySelectorAll('.qz-pick-chips .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
          const r = all.find((x) => x.p.id === id), i = all.indexOf(r), lead = ranked[0];
          // Where it lost most to the first match (TIP's words, after the answer behind them, so "that" has something to
          // point to); parts its own "worth knowing" lines cover aren't said twice
          const SAID = new Set(['ease', 'care', 'lang', 'bookings', 'blog', 'budget']);
          const lost = [...new Set([...Object.keys(lead.pts), ...Object.keys(r.pts)])].map((k) => [k, (lead.pts[k] || 0) - (r.pts[k] || 0)])
            .filter(([k, d]) => d > 0 && TIP[k] && TIP[k][1] && !SAID.has(k)).sort((p, q) => q[1] - p[1]).slice(0, 2)
            .map(([k]) => { const w = TIP[k][1](a, r.p.name, lead.p.name, lead.pts[k] || 0, r.pts[k] || 0), l = LEAD[k] && LEAD[k](a); return w && (l ? `${l}, and ${w}` : w); }).filter(Boolean);
          const against = [...r.but, ...lost].map((w) => w.charAt(0).toUpperCase() + w.slice(1));
          const nth = `${i + 1}${['st', 'nd', 'rd'][i] || 'th'} of ${all.length}`;
          const rankText = el('b', 'rank', r === origin ? `You’re on ${r.p.name} now: it ranks ${nth} for your answers` : `${r.p.name} ranks ${nth} for you`);
          rankText.append(el('span', 'gap', ` · ${behind(r, lead)} ${lead.p.name}`));
          const cols = el('div', 'cols');
          [['For', r.why, 'for'], ['Against', against, 'against']].forEach(([t, items, cls]) => {
            const c = el('div', cls);
            c.append(el('p', null, t));
            const ul = el('ul');
            (items.length ? items : ['Nothing in particular']).forEach((w) => ul.append(el('li', null, w)));
            c.append(ul);
            cols.append(c);
          });
          const cta = el('p', 'cta'), link = el('a', null, `Compare ${r.p.name} with ${lead.p.name} side by side →`);
          link.href = '#seo';
          link.addEventListener('click', () => {
            state.compare = new Set([lead.p.id, r.p.id]);
            state.touched = true;
            state.pick = lead.p.id;
            state.quiz = null;
            renderCards();
            render();
          });
          cta.append(link);
          res.replaceChildren(rankText, cols, cta);
          res.className = 'res';
        };
        check.append(picker('Platform to check', rest.map((r) => [r.p.id, r.p.name]), checking, showCheck), res);
        if (checking && rest.some((r) => r.p.id === checking)) showCheck(checking);
        box.append(check);
      }
      // One first-steps panel under the cards, switched between the three matches
      const panel = el('section', 'qz-panel'), sw = el('div', 'qz-switch'), body = el('div');
      sw.append(el('span', 'qz-switch-l', 'Show steps for'));
      const show = (id) => {
        const p = top.find((r) => r.p.id === id).p;
        sw.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === p.id)));
        body.replaceChildren(el('h4', null, `First steps if you pick ${p.name}`), nextSteps(p, a.moving));
      };
      sw.append(picker('Show first steps for', top.map((r) => [r.p.id, r.p.name]), top[0].p.id, show));
      panel.append(sw, body);
      show(top[0].p.id);
      box.append(panel);
      // Also worth a look: each name opens "Had a platform in mind?" on that platform
      if (also.length) {
        const p = el('p', 'qz-also', 'Also worth a look: ');
        also.forEach((r, i) => {
          const b = el('button', 'qz-also-b', r.p.name);
          b.type = 'button';
          b.addEventListener('click', () => {
            checking = r.p.id;
            results();
            const c = box.querySelector('.qz-check');
            c?.scrollIntoView();
            c?.querySelector('.chip[aria-pressed="true"], select')?.focus({ preventScroll: true });
          });
          p.append(i ? ', ' : '', b);
        });
        box.append(p);
      }
      const nav = el('div', 'qz-nav');
      const cmp = el('button', 'btn primary', 'Compare these side by side');
      cmp.type = 'button';
      cmp.addEventListener('click', compareThese);
      const copy = el('button', 'btn', 'Copy link to this result');
      copy.type = 'button';
      copy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(location.href); copy.textContent = 'Link copied'; } catch (e) { copy.textContent = 'Copy the address bar to share'; }
      });
      const again = el('button', 'btn', 'Start over');
      again.type = 'button';
      again.addEventListener('click', () => { a = {}; step = 0; editing = null; resume = false; ansOpen = false; checking = null; pending.clear(); history.replaceState(null, '', location.pathname); ask(); box.querySelector('h3')?.focus({ preventScroll: true }); });
      nav.append(cmp, copy, again);
      box.append(nav);
    }

    // A shared result opens straight on it; a link with an answer missing keeps the good ones and asks the first it
    // lacks. Returns false when the address holds no quiz answers.
    function fromLink() {
      const m = location.hash.match(/^#quiz\?(.+)$/);
      const link = m && readLink(new URLSearchParams(m[1]));
      if (!link) return false;
      const shared = link.answers;
      a = {};
      editing = null;
      resume = false;
      pending.clear();
      QUESTIONS.forEach((q) => {
        if (options(q, shared, data).some(([v]) => v === shared[q.id])) a[q.id] = shared[q.id];
        if (q.also && shared[q.also.id] === 'yes') a[q.also.id] = 'yes';   // a ticked "also" (languages) comes along
      });
      // An old link (v=1): questions it didn't have score nothing (NEUTRAL) or wait, offered above the results
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
    PHONE.addEventListener('change', () => { if (box.querySelector('.qz-res')) results(); });   // chips or selects, by width
    // The address changed without a reload (edited by hand, or Back/Forward to another result): follow it.
    // The page's own updates use replaceState, which doesn't fire this, so there's no loop.
    addEventListener('hashchange', () => { if (fromLink()) $('#quiz').scrollIntoView(); });
  }

  // data.json with no-cache, so a publish shows straight away; quiz.json with its own cache number (data-quiz-v on
  // this script's tag; currentScript is empty in a module, so the page's own script tag is the fallback)
  const self = document.currentScript || document.querySelector('script[src*="app.js?v="]');
  const QUIZ_V = (self && self.dataset.quizV) || '';
  Promise.all([
    fetch('data.json', { cache: 'no-cache' }).then((r) => r.json()),
    fetch(`quiz.json?v=${QUIZ_V}`).then((r) => r.json()),
  ]).then(([d, quiz]) => {
    data = d;
    data.quiz = Object.fromEntries(Object.entries(quiz).filter(([k]) => !k.startsWith('_')));
    build();
  })
    .catch(() => { $('#grid').replaceChildren(el('p', 'empty', 'Could not load the answers. Try reloading the page.')); });
})();
