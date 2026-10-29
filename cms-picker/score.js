// CMS Picker: the Find my fit questions and scoring, shared by the page (app.js) and the persona tests
// (.github/scripts/personas.test.js, run by build\check.ps1). Plain script: in the browser it sets
// window.cmsScore; in Node, module.exports.
(function (root) {
  'use strict';
  // Every platform is scored from what's already published (each profile's goals, hosting and export,
  // and the verified answers for selling, languages and design) plus the quiz's own values in data.quiz
  // (cms-picker.json: how easy each one is, the design control it suits, and a few lists). The reasons
  // shown come from the same data, so a result never claims anything the table doesn't.
  const QUESTIONS = [
    // Each option: [value, title, hint, its answer on its own] (the last is the answer button above the results, so it reads without the question)
    { id: 'what', q: 'What are you making?', opts: [['site', 'A site for my business or work', 'Services, portfolio, about and contact', 'A business or work site'], ['store', 'An online store', 'Products, checkout and payments', 'An online store'], ['content', 'A blog, newsletter or publication', 'Writing is the main thing', 'A blog, newsletter or publication'], ['custom', 'Something custom', 'An app or portal, built with a developer', 'Something custom, with a developer']] },
    { id: 'who', q: 'Who’ll build and update it?', opts: [['easy', 'Me, and I’m not technical', 'It needs to be simple', 'I’ll build it, not technical'], ['learn', 'Me, and I’m happy to learn', 'A bit of a learning curve is fine', 'I’ll build it and learn'], ['agency', 'A designer or agency', 'They build it; I might edit', 'A designer or agency builds it'], ['dev', 'A developer', 'Code is fine', 'A developer builds it']] },
    { id: 'care', q: 'Do you want to look after hosting, updates and security?', opts: [['no', 'No, handle it for me', 'Everything included', 'Hosting and updates handled for me'], ['yes', 'That’s fine', 'Or someone will do it for me', 'Fine looking after hosting and updates']] },
    { id: 'size', q: 'How big is the shop?', when: (a) => a.what === 'store', opts: [['small', 'Up to a few dozen products', 'A small shop', 'A small shop, up to a few dozen products'], ['big', 'Hundreds of products, or B2B', 'A large catalogue, or selling to businesses', 'Hundreds of products, or B2B']] },
    { id: 'lang', q: 'Will it be in more than one language?', opts: [['no', 'No', 'One language', 'One language'], ['yes', 'Yes', 'Two or more', 'Two or more languages']] },
    { id: 'look', q: 'How much control over the design do you want?', opts: [['template', 'A good template is enough', 'Pick one and go', 'A good template is enough'], ['visual', 'Arrange things visually myself', 'Drag, drop and adjust', 'Arrange the design visually'], ['pixel', 'Every detail', 'Exactly as designed', 'Control every detail of the design']] },
    { id: 'leave', q: 'How important is taking everything with you if you switch later?', opts: [['yes', 'Very important', 'I want to own all of it', 'Taking everything with me matters'], ['no', 'Not a big concern', 'I’ll probably stay', 'Not planning to switch']] },
  ];
  const WHAT = { site: 'Made for business and portfolio sites', store: 'Made for online stores', content: 'Made for blogs and publishing', custom: 'Made for custom builds' };
  const LOOKS = { template: 'Good templates to start from', visual: 'Arrange your pages visually', pixel: 'Full control over the design' };

  // What each part of the score says when it's what put one match ahead of another: [the leader earned
  // it, the runner-up lost it]. Keys match fitScore's parts; every phrase comes from the published data.
  const TIP = {
    goal: [(a) => `it’s ${WHAT[a.what].charAt(0).toLowerCase()}${WHAT[a.what].slice(1)}`, (a, y) => `${y} isn’t made for this`],
    sellOnly: [null, (a, y) => `${y} is made only for selling`],
    frontEnd: [() => 'it feeds an app or any front end from one place', null],
    ease: [(a) => (a.who === 'easy' ? 'it’s easier to run without technical skills' : 'it’s easier to learn'), (a, y) => (a.who === 'easy' ? `${y} is harder to run without technical skills` : `${y} is harder to learn`)],
    agency: [() => 'it’s a common choice for designers and agencies', null],
    agencyOnly: [null, (a, y) => `${y} is mainly sold through agencies`],
    dev: [() => 'it gives a developer full control', (a, y) => `${y} isn’t built to be coded`],
    care: [() => 'hosting, updates and security are handled for you', (a, y) => `${y} leaves hosting and updates to you`],
    sell: [() => 'selling is easier to set up', (a, y) => `selling is harder to set up on ${y}`],
    sellFirst: [() => 'it’s made for selling first', null],
    size: [() => 'it handles large catalogues', (a, y) => `${y} isn’t made for large catalogues`],
    small: [() => 'it suits small shops', null],
    lang: [() => 'more than one language is easier to set up', (a, y) => `more than one language is harder to set up on ${y}`],
    look: [(a) => ({ template: 'it has good templates to start from', visual: 'you can arrange your pages visually', pixel: 'it gives full control over the design' })[a.look], null],
    leave: [() => 'you can take more of your site with you', (a, y) => `${y} doesn’t let you take everything with you`],
  };

  function fitScore(data, p, a) {
    const Q = data.quiz, pr = p.profile || {}, why = [], pts = {};
    const has = (list) => (Q[list] || []).includes(p.id);
    const verdict = (row) => ((data.answers[p.id] || {})[row] || {}).verdict;
    let s = 0;
    // One part of the score: its key (see TIP), its points, and the reason it adds, if any
    const add = (key, n, reason) => { s += n; pts[key] = (pts[key] || 0) + n; if (reason) why.push(reason); };
    if ((pr.goals || []).includes(a.what)) add('goal', 4, WHAT[a.what]); else add('goal', -8);
    if (a.what !== 'store' && has('storeOnly')) add('sellOnly', -6);
    if (a.what === 'custom' && has('customFrontEnd')) add('frontEnd', 3, 'Feeds an app or any front end from one place');
    const ease = Q.ease[p.id] ?? 1;
    if (a.who === 'easy') add('ease', ease * 2 - 3, ease === 3 && 'Easy to run without technical skills');
    if (a.who === 'learn') add('ease', ease >= 1 ? 1 : -2);
    if (a.who === 'agency' && has('agency')) add('agency', 2, 'A common choice for designers and agencies');
    if (a.who !== 'agency' && has('agencyOnly')) add('agencyOnly', -2);
    // A developer: platforms built to be coded (quiz.devControl)
    if (a.who === 'dev') { if (has('devControl')) add('dev', 2, 'Gives a developer full control'); else add('dev', -1); }
    if (a.care === 'no') {
      const handled = /^Handled for you/.test(pr.hosting || '');
      add('care', handled ? 2 : -3, handled && 'Hosting, updates and security are handled for you');
    }
    if (a.what === 'store') {
      add('sell', { yes: 2, plugin: 0, code: -3, no: -6 }[verdict('store')] ?? 0);
      if (has('storeOnly')) add('sellFirst', 2);   // made for selling first, so it leads a tie with all-round builders
      if (a.size === 'big') { if (has('largeCatalogue')) add('size', 3, 'Handles large catalogues'); else add('size', -2); }
      if (a.size === 'small' && has('smallShop')) add('small', 1);
    }
    if (a.lang === 'yes') {
      const l = verdict('languages');
      add('lang', { yes: 2, plugin: 0, code: -2, no: -4 }[l] ?? 0, l === 'yes' && 'More than one language is built in');
    }
    if ((Q.look[p.id] || []).includes(a.look)) add('look', 2, LOOKS[a.look]);
    if (a.leave === 'yes') {
      if (/^Everything/.test(pr.export || '')) add('leave', 2, 'You can take everything with you');
      else if (/API/.test(pr.export || '')) add('leave', 1, 'Your content stays yours, through the API');
      else add('leave', -1);
    }
    // Every reason is shown (six at most), so two cards' lists match only when their reasons really do
    const all = why.filter(Boolean);
    return { p, s, why: all, all, pts };
  }

  // Every platform, best fit first
  const rank = (data, a) => data.platforms.map((p) => fitScore(data, p, a)).sort((x, y) => y.s - x.s);

  // ---------- Telling the top matches apart ----------
  // Only from what's already published: the table's checked answers and each profile's "good fit" list.
  // How well an answer does it (built in beats a plugin beats code)
  const LEVEL = { yes: 3, auto: 3, plugin: 2, code: 1, no: 0 };
  // Each table row as a short phrase for "Pick it over … if you want …"
  const PHRASE = {
    blog: 'a blog', store: 'online selling', languages: 'more than one language', forms: 'contact and sign-up forms',
    design: 'design control', meta_title: 'page titles and descriptions for search', urls: 'control over page addresses',
    gsc404: 'redirects for old links', schema: 'search details like prices and ratings', noindex: 'pages kept out of search',
    ai_crawlers: 'control over which AI bots read the site',
  };
  // How much a row matters for these answers; 0 when the person has ruled it out
  function weight(row, a) {
    if (row === 'store') return a.what === 'store' ? 3 : 0;      // not selling
    if (row === 'languages') return a.lang === 'yes' ? 3 : 0;    // one language
    if (row === 'design') return a.look === 'template' ? 0 : 2;  // a good template is enough
    if (row === 'blog') return a.what === 'content' ? 3 : 1;
    return 1;
  }
  const lowerFirst = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const joinAnd = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0]);
  // The rows x does better than y and the person hasn't ruled out, most relevant first
  function edgeRows(data, a, x, y) {
    const ax = data.answers[x.p.id] || {}, ay = data.answers[y.p.id] || {};
    return data.items.map((it) => {
      const lx = LEVEL[(ax[it.id] || {}).verdict] ?? -1, ly = LEVEL[(ay[it.id] || {}).verdict] ?? -1;
      return { id: it.id, gap: lx - ly, w: weight(it.id, a), ly };
    }).filter((r) => r.gap > 0 && r.w > 0 && r.ly >= 0 && PHRASE[r.id]).sort((p, q) => q.w - p.w || q.gap - p.gap).slice(0, 2);
  }
  // "Pick it over Wix if you want design control and a blog: Squarespace makes both easier." Without such
  // rows, x's first "good fit" line. Null when there's nothing to go on.
  function pickOver(data, a, x, y) {
    const rows = edgeRows(data, a, x, y);
    if (rows.length) return `Pick it over ${y.p.name} if you want ${joinAnd(rows.map((r) => PHRASE[r.id]))}: ${x.p.name} makes ${rows.length > 1 ? 'both' : 'it'} easier.`;
    const fit = ((x.p.profile || {}).goodFit || [])[0];
    return fit ? `Pick it over ${y.p.name} for ${lowerFirst(fit)}.` : null;
  }
  // What put x ahead of y: the part of the score with the biggest gap, in plain words
  function tipped(a, x, y) {
    let best = null, gap = 0;
    new Set([...Object.keys(x.pts), ...Object.keys(y.pts)]).forEach((k) => {
      const d = (x.pts[k] || 0) - (y.pts[k] || 0);
      if (d > gap && TIP[k]) { gap = d; best = k; }
    });
    if (!best) return null;
    const [plus, minus] = TIP[best], f = (x.pts[best] || 0) > 0 ? plus || minus : minus || plus;
    return f ? `What tipped it: ${f(a, y.p.name)}.` : null;
  }
  const sameSet = (xs, ys) => xs.length === ys.length && xs.every((w) => ys.includes(w));
  // For the top matches: the reasons to show and vs, a heading and a sentence on what sets each apart
  // from its neighbour (null if there's nothing to say). The second and third show their own reasons,
  // collapsed to "the same reasons as …" only when they're exactly the first's.
  function explain(data, a, top) {
    const lead = top[0];
    return top.map((r, i) => {
      if (!i) {
        const next = top[1];
        let vs = null;
        if (next && next.s === r.s) vs = { head: `A close call with ${next.p.name}`, text: ['Both fit your answers equally.', pickOver(data, a, r, next)].filter(Boolean).join(' ') };
        else if (next) {
          const text = tipped(a, r, next) || pickOver(data, a, r, next);
          if (text) vs = { head: `Ahead of ${next.p.name}`, text };
        }
        return { why: r.why, vs };
      }
      const why = sameSet(r.all, lead.all) ? [`Fits your answers for the same reasons as ${lead.p.name}`] : r.why;
      const text = pickOver(data, a, r, lead);
      return { why, vs: text ? { head: `Versus ${lead.p.name}`, text } : null };
    });
  }

  const api = { QUESTIONS, rank, explain, PHRASE, weight, TIP };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.cmsScore = api;
})(typeof window !== 'undefined' ? window : globalThis);
