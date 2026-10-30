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
    { id: 'what', q: 'What are you making?', opts: [['site', 'A site for my business or work', 'Services, portfolio, about and contact', 'A business or work site'], ['store', 'An online store', 'Products, checkout and payments', 'An online store'], ['content', 'A blog, newsletter or publication', 'Writing is the main thing', 'A blog, newsletter or publication'], ['custom', 'Something custom', 'An app or portal, built with a developer', 'Something custom: an app or portal']] },
    { id: 'kind', q: 'Which is closest to what you do?', when: (a) => a.what === 'site', opts: [['local', 'A local business or services', 'Shops, trades, salons, clinics, consultants', 'A local business or services'], ['creative', 'Creative work or a portfolio', 'Photography, design, art, music', 'Creative work or a portfolio'], ['startup', 'A startup or product launch', 'A product, an app or a launch page', 'A startup or product launch'], ['b2b', 'A company selling to other businesses', 'B2B: leads, demos and a sales team', 'A company selling to other businesses (B2B)'], ['content', 'Lots of content', 'Articles, guides and resources', 'A site with lots of content']] },
    { id: 'members', q: 'Will you have paid members or a newsletter?', when: (a) => a.what === 'content', opts: [['yes', 'Yes', 'Subscribers, paid posts or a newsletter', 'Paid members or a newsletter'], ['no', 'No', 'Just the posts', 'Just posts, no members']] },
    { id: 'who', q: 'Who’ll build and update it?', opts: [['easy', 'Me, and I’m not technical', 'It needs to be simple', 'I’ll build it, not technical'], ['learn', 'Me, and I’m happy to learn', 'A bit of a learning curve is fine', 'I’ll build it and learn'], ['agency', 'A designer or agency', 'They build it; I might edit', 'A designer or agency builds it'], ['dev', 'A developer', 'Code is fine', 'A developer builds it']] },
    { id: 'care', q: 'Who should look after hosting, updates and security?', opts: [['no', 'The platform', 'Everything included, nothing to install', 'Hosting and updates handled for me'], ['yes', 'Me, or someone I’ll ask', 'A web host and updates now and then', 'Fine looking after hosting and updates']] },
    { id: 'size', q: 'How big is the shop?', when: (a) => a.what === 'store', opts: [['small', 'Up to a few dozen products', 'A small shop', 'A small shop, up to a few dozen products'], ['big', 'Hundreds of products', 'A large catalogue', 'Hundreds of products'], ['b2b', 'Selling to other businesses (B2B)', 'Wholesale, trade accounts or bulk orders', 'Selling to other businesses (B2B)']] },
    { id: 'lang', q: 'Will it be in more than one language?', opts: [['no', 'No', 'One language', 'One language'], ['yes', 'Yes', 'Two or more', 'Two or more languages']] },
    { id: 'look', q: 'How much control over the design do you want?', opts: [['template', 'A good template is enough', 'Pick one and go', 'A good template is enough'], ['visual', 'Arrange things visually myself', 'Drag, drop and adjust', 'Arrange the design visually'], ['pixel', 'Every detail', 'Exactly as designed', 'Control every detail of the design']] },
    { id: 'leave', q: 'How important is being able to move to another platform later?', opts: [['yes', 'Very important', 'I want to own all of it', 'Being able to move later matters'], ['no', 'Not a big concern', 'I’ll probably stay', 'Not planning to switch']] },
    { id: 'grow', q: 'Will you add features as the site grows?', opts: [['yes', 'Yes, I’ll keep adding things', 'Bookings, memberships, reviews, CRM links…', 'Adding features as it grows'], ['no', 'No, what’s built in is enough', 'Keep it simple', 'What’s built in is enough']] },
    { id: 'budget', q: 'What can you spend each month?', opts: [['none', 'Nothing for now', 'Start free, upgrade later', 'Nothing for now: free to start'], ['low', 'Up to about $25', 'A basic plan', 'Up to about $25 a month'], ['mid', 'Up to about $100', 'Room for a store or more features', 'Up to about $100 a month'], ['any', 'Over $100, or it doesn’t matter', 'Cost isn’t the deciding factor', 'Cost isn’t the deciding factor']] },
  ];
  const WHAT = { site: 'Made for business and portfolio sites', store: 'Made for online stores', content: 'Made for blogs and publishing', custom: 'Made for custom builds' };
  // "Which is closest to what you do?": the reason a matching platform gets (quiz.kind in cms-picker.json lists them)
  const KINDS = { local: 'Suits local businesses and services', creative: 'Suits creative work and portfolios', startup: 'Suits startups and product launches', b2b: 'Suits companies selling to other businesses', content: 'Suits sites with lots of content' };
  // "What can you spend each month?" against the "What it costs to start" bands (from each platform's own
  // pricing page): a platform over budget drops 3 points for each band over; one within it isn't boosted.
  // Free software still needs paid hosting, so it counts as the lowest paid band.
  const COST_LEVEL = { free: 0, low: 1, software: 1, mid: 2, high: 3 };
  const BUDGET = { none: 0, low: 1, mid: 2 };
  const LOOKS = { template: 'Good templates to start from', visual: 'Arrange your pages visually', pixel: 'Full control over the design' };

  // What each part of the score says when it's what put one match ahead of another: [the leader earned
  // it, the runner-up lost it], given (answers, runner-up's name, leader's name). Keys match fitScore's
  // parts; every phrase comes from the published data.
  const TIP = {
    goal: [(a, y, x) => `${x} is made for that`, (a, y) => `${y} isn’t made for that`],
    kind: [(a, y, x) => `${x} is a natural fit`, null],
    members: [(a, y, x) => `${x} has them built in`, (a, y) => `${y} needs more than its own tools for that`],
    letters: [(a, y, x) => `${x} sends newsletters to them itself`, null],
    sellOnly: [null, (a, y) => `${y} is made only for selling`],
    frontEnd: [(a, y, x) => `${x} is built to feed a website and an app from one place`, null],
    ease: [(a, y, x) => (a.who === 'easy' ? `${x} is easier to run` : `${x} is easier to learn`), (a, y) => (a.who === 'easy' ? `${y} is harder to run` : `${y} is harder to learn`)],
    agency: [(a, y, x) => `${x} is a common choice for them`, null],
    agencyOnly: [null, (a, y) => `${y} is mainly sold through agencies`],
    dev: [(a, y, x) => `${x} gives them full control`, (a, y) => `${y} isn’t built to be coded`],
    care: [(a, y, x) => `${x} handles them for you`, (a, y) => `${y} leaves hosting and updates to you`],
    sell: [(a, y, x) => `selling is easier to set up on ${x}`, (a, y) => `selling is harder to set up on ${y}`],
    sellFirst: [(a, y, x) => `${x} is made for selling first`, null],
    size: [(a, y, x) => `${x} handles large catalogues`, (a, y) => `${y} isn’t made for large catalogues`],
    small: [(a, y, x) => `${x} suits that`, null],
    b2b: [(a, y, x) => `${x} is built for B2B`, null],
    lang: [(a, y, x) => `that’s easier to set up on ${x}`, (a, y) => `that’s harder to set up on ${y}`],
    look: [(a, y, x) => ({ template: `${x} has good ones to start from`, visual: `${x} lets you do that`, pixel: `${x} gives you that` })[a.look], null],
    leave: [(a, y, x) => `moving off ${x} later is easier`, (a, y) => `moving off ${y} later is harder`],
    grow: [(a, y, x) => `${x} has more plugins and apps for that`, (a, y) => `${y} has fewer plugins and apps for that`],
    notIdeal: [null, (a, y) => `${y}’s own card says it isn’t ideal for answers like yours`],
    budget: [(a, y, x) => (a.budget === 'none' ? `${x} is free to start` : `${x} fits it`), (a, y) => `${y} costs more than that`],
  };
  // The answer behind each part, said first so the reason reads as a reply to it: "you're building an app
  // or portal, and Sanity is built to…". Null when the wording already names the answer.
  const LEAD = {
    goal: (a) => ({ site: 'you’re making a site for your business or work', store: 'you’re making an online store', content: 'you’re making a blog, newsletter or publication', custom: 'you’re building an app or portal' })[a.what],
    kind: (a) => ({ local: 'you’re a local business or service', creative: 'you’re showing creative work', startup: 'you’re launching a product', b2b: 'you sell to other businesses', content: 'you’ll have lots of content' })[a.kind],
    members: () => 'you want paid members or a newsletter',
    letters: () => 'you want paid members or a newsletter',
    sellOnly: () => 'you’re not making a store',
    frontEnd: () => 'you’re building an app or portal',
    ease: (a) => (a.who === 'easy' ? 'you’re not technical' : 'you’re building it yourself'),
    agency: () => 'a designer or agency is building it',
    agencyOnly: (a) => (a.who === 'dev' ? 'a developer is building it' : 'you’re building it yourself'),
    dev: () => 'a developer is building it',
    care: () => 'you want hosting, updates and security looked after',
    sell: () => 'you’re making an online store',
    sellFirst: () => 'you’re making an online store',
    size: (a) => (a.size === 'b2b' ? 'you’re selling to other businesses' : 'you have hundreds of products'),
    small: () => 'you have a small shop',
    b2b: () => 'you’re selling to other businesses',
    lang: () => 'you need more than one language',
    look: (a) => ({ template: 'a good template is enough for you', visual: 'you want to arrange things visually', pixel: 'you want control over every detail' })[a.look],
    leave: () => 'you want to own all of it',
    grow: () => 'you’ll add features over time',
    notIdeal: null,
    budget: (a) => ({ none: 'you want to start free', low: 'you want to spend up to about $25 a month', mid: 'you want to spend up to about $100 a month' })[a.budget],
  };

  // The first of a platform's "Not ideal if" lines (quiz.notIdeal) these answers match: every key in "when" has one
  // of its listed answers
  const notIdealFor = (Q, id, a) => ((Q.notIdeal || {})[id] || []).find((n) => Object.entries(n.when).every(([q, vs]) => vs.includes(a[q])));

  function fitScore(data, p, a) {
    const Q = data.quiz, pr = p.profile || {}, why = [], pts = {};
    const has = (list) => (Q[list] || []).includes(p.id);
    const verdict = (row) => ((data.answers[p.id] || {})[row] || {}).verdict;
    let s = 0;
    // One part of the score: its key (see TIP), its points, and the reason it adds, if any
    const add = (key, n, reason) => { s += n; pts[key] = (pts[key] || 0) + n; if (reason) why.push(reason); };
    if ((pr.goals || []).includes(a.what)) add('goal', 4, WHAT[a.what]); else add('goal', -8);
    if (a.what !== 'store' && has('storeOnly')) add('sellOnly', -6);
    if (a.what === 'site' && ((Q.kind || {})[a.kind] || []).includes(p.id)) add('kind', 3, KINDS[a.kind]);
    if (a.what === 'content' && a.members === 'yes') {
      // The "Sell memberships or paid posts" row: built in beats an add-on (Wix, Squarespace and Duda have their
      // own; Webflow retired its own in 2026). Until that row is published, quiz.members stands in for it.
      const m = verdict('members');
      if (m) add('members', { yes: 3, plugin: 0, code: -2, check: -2, no: -4 }[m] ?? 0, m === 'yes' && 'Paid memberships built in');
      else if (has('members')) add('members', 3, 'Paid members and newsletters built in');
      // quiz.members: newsletters sent to those members from the platform itself (Ghost), on top of the row
      if (m && has('members')) add('letters', 2, 'Newsletters to your members built in');
    }
    if (a.what === 'custom' && has('customFrontEnd')) add('frontEnd', 3, 'One place to manage content for a website and an app');
    const ease = Q.ease[p.id] ?? 1;
    // Building it yourself: one that needs a developer counts as heavily as one not made for what you're making
    if (a.who === 'easy') add('ease', ease === 0 ? -8 : ease * 2 - 3, ease === 3 && 'Easy to run without technical skills');
    if (a.who === 'learn') add('ease', ease >= 1 ? 1 : -8);
    if (a.who === 'agency' && has('agency')) add('agency', 2, 'A common choice for designers and agencies');
    if (a.who !== 'agency' && has('agencyOnly')) add('agencyOnly', -2);
    // A developer: platforms built to be coded (quiz.devControl)
    if (a.who === 'dev') { if (has('devControl')) add('dev', 2, 'Gives a developer full control'); else add('dev', -1); }
    if (a.care === 'no') {
      const handled = /^Handled for you/.test(pr.hosting || '');
      add('care', handled ? 2 : -6, handled && 'Hosting, updates and security are handled for you');
    }
    if (a.what === 'store') {
      add('sell', { yes: 2, plugin: 0, code: -3, no: -6 }[verdict('store')] ?? 0);
      if (has('storeOnly')) add('sellFirst', 2);   // made for selling first, so it leads a tie with all-round builders
      // Selling to other businesses (B2B) is a large catalogue too, plus the platforms whose profiles name B2B (quiz.b2b)
      if (a.size === 'big' || a.size === 'b2b') { if (has('largeCatalogue')) add('size', 3, 'Handles large catalogues'); else add('size', -2); }
      if (a.size === 'b2b' && has('b2b')) add('b2b', 3, 'Suits selling to other businesses (B2B)');
      if (a.size === 'small' && has('smallShop')) add('small', 1);
    }
    if (a.lang === 'yes') {
      const l = verdict('languages');
      // Needing an add-on for it counts a little against (Ghost's and Squarespace's own cards say so)
      add('lang', { yes: 2, plugin: -1, code: -2, no: -4 }[l] ?? 0, l === 'yes' && 'More than one language is built in');
    }
    if ((Q.look[p.id] || []).includes(a.look)) add('look', 2, LOOKS[a.look]);
    if (a.leave === 'yes') {
      // A platform's own wording for it where the general line undersells it (quiz.leaveWhy: Sanity, whose card
      // says the website's code is already yours)
      if (/^Everything/.test(pr.export || '')) add('leave', 2, (Q.leaveWhy || {})[p.id] || 'Easy to move to another platform later');
      else if (/API/.test(pr.export || '')) add('leave', 1, 'Your content stays yours, through the API');
      else add('leave', -1);
    }
    // Adding features later: the platforms with the biggest plugin and app libraries (quiz.addOnsMany: tens of
    // thousands; quiz.addOnsSome: about a thousand or more)
    if (a.grow === 'yes') {
      if (has('addOnsMany')) add('grow', 2, 'Thousands of plugins and apps to add later');
      else if (has('addOnsSome')) add('grow', 1, 'A good range of apps to add later');
    }
    // The platform's own "Not ideal if" lines that match these answers (quiz.notIdeal): it's ruled out unless
    // nothing else fits
    if (notIdealFor(Q, p.id, a)) add('notIdeal', -30);
    if (a.budget in BUDGET) {
      const level = COST_LEVEL[verdict(a.what === 'store' ? 'cost_store' : 'cost_site')];
      if (level !== undefined) {
        const over = level - BUDGET[a.budget];
        if (over > 0) add('budget', -3 * over); else add('budget', 0, a.budget === 'none' ? 'Free to start' : 'Fits your budget');
      }
    }
    // Every reason is shown (seven at most), so two cards' lists match only when their reasons really do
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
    blog: 'a blog', store: 'online selling', members: 'paid memberships', languages: 'more than one language', forms: 'contact and sign-up forms',
    design: 'design control', meta_title: 'page titles and descriptions for search', urls: 'control over page addresses',
    gsc404: 'redirects for old links', schema: 'search details like prices and ratings', noindex: 'pages kept out of search',
    ai_crawlers: 'control over which AI bots read the site',
    cost_site: 'a cheaper start', cost_store: 'a cheaper store',   // not used: cost isn't a "can it do it" row (weight 0)
  };
  // How much a row matters for these answers; 0 when the person has ruled it out
  function weight(row, a) {
    if (row.startsWith('cost_')) return 0;   // the budget question covers cost
    if (row === 'store') return a.what === 'store' ? 3 : 0;      // not selling
    if (row === 'languages') return a.lang === 'yes' ? 3 : 0;    // one language
    if (row === 'design') return a.look === 'template' ? 0 : 2;  // a good template is enough
    if (row === 'blog') return a.what === 'content' ? 3 : 1;
    if (row === 'members') return a.members === 'yes' ? 3 : a.members === 'no' ? 0 : 1;   // "Just posts" rules it out
    return 1;
  }
  // Card tags about a row, left out of "is known for" when the answers rule that row out
  const TAG_ABOUT = { members: /paid member/i, design: /design control|canvas|animation/i, languages: /lingual|language|translat/i, store: /stor|sell|checkout|commerce/i };
  const lowerFirst = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  // A card tag inside a sentence: lower case, unless it starts with a name or an abbreviation (Figma, WooCommerce, SEO)
  const tagInSentence = (t) => (/^(Figma|[A-Z][a-z]*[A-Z]|[A-Z0-9]{2,})/.test(t) ? t : lowerFirst(t));
  // "a, b, and c": the serial comma, as some tags already contain "and" ("Forms and leads")
  const listOf = (xs) => (xs.length > 2 ? `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}` : xs.join(' and '));
  const joinAnd = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0]);
  // The rows x does better than y and the person hasn't ruled out, most relevant first
  function edgeRows(data, a, x, y) {
    const ax = data.answers[x.p.id] || {}, ay = data.answers[y.p.id] || {};
    return data.items.map((it) => {
      const lx = LEVEL[(ax[it.id] || {}).verdict] ?? -1, ly = LEVEL[(ay[it.id] || {}).verdict] ?? -1;
      return { id: it.id, gap: lx - ly, w: weight(it.id, a), ly };
    }).filter((r) => r.gap > 0 && r.w > 0 && r.ly >= 0 && PHRASE[r.id]).sort((p, q) => q.w - p.w || q.gap - p.gap).slice(0, 2);
  }
  // What sets x apart from y, most useful first: rows the person asked about ("Pick it over Wix if you want design
  // control and a blog: Squarespace makes both easier."), then what x offers that y's card doesn't list ("Shopify
  // is known for: app ecosystem, built-in checkout, and theme store", from the card tags), then the smaller
  // table rows (the technical SEO ones),
  // then x's first "good fit" line. Null when there's nothing to go on.
  function pickOver(data, a, x, y) {
    const rows = edgeRows(data, a, x, y);
    const rowsLine = (rs) => `Pick it over ${y.p.name} if you want ${joinAnd(rs.map((r) => PHRASE[r.id]))}: ${x.p.name} makes ${rs.length > 1 ? 'both' : 'it'} easier.`;
    const strong = rows.filter((r) => r.w > 1);
    if (strong.length) return rowsLine(strong);
    const theirs = new Set(((y.p.profile || {}).tags || []).map((t) => t.toLowerCase()));
    const offers = ((x.p.profile || {}).tags || []).filter((t) => !theirs.has(t.toLowerCase())
      && !Object.keys(TAG_ABOUT).some((row) => weight(row, a) === 0 && TAG_ABOUT[row].test(t))).slice(0, 3);
    if (offers.length) return `${x.p.name} is known for: ${listOf(offers.map(tagInSentence))}.`;
    if (rows.length) return rowsLine(rows);
    const fit = ((x.p.profile || {}).goodFit || [])[0];
    return fit ? `Pick it over ${y.p.name} for ${lowerFirst(fit)}.` : null;
  }
  // The parts of the score where x beat y, biggest gap first, with wording in TIP
  function gaps(x, y) {
    return [...new Set([...Object.keys(x.pts), ...Object.keys(y.pts)])]
      .map((k) => ({ k, d: (x.pts[k] || 0) - (y.pts[k] || 0) })).filter((g) => g.d > 0 && TIP[g.k]).sort((p, q) => q.d - p.d);
  }
  // Up to two of them in plain words, each after the answer behind it; an answer behind both is said once.
  // Being able to move later is a secondary reason, so it always goes last.
  function reasons(a, x, y) {
    const two = gaps(x, y).slice(0, 2).sort((p, q) => (p.k === 'leave') - (q.k === 'leave'));
    let said = null;
    const words = two.map(({ k }) => {
      const [plus, minus] = TIP[k], f = (x.pts[k] || 0) > 0 ? plus || minus : minus || plus, w = f && f(a, y.p.name, x.p.name);
      if (!w) return null;
      const lead = LEAD[k] && LEAD[k](a);
      if (!lead || lead === said) return w;
      said = lead;
      return `${lead}, and ${w}`;
    }).filter(Boolean);
    return words.length > 1 ? `${words[0]}; ${words[1]}` : words[0];
  }
  // What put x ahead of y: "What tipped it: you're making an online store, and Shopify is made for selling
  // first; you'll add features over time, and Shopify has more plugins…"
  function tipped(a, x, y) {
    const w = reasons(a, x, y);
    return w ? `What tipped it: ${w}.` : null;
  }
  // For a match behind the first: what it scored better on for these answers, or else (when the person gave a
  // budget) that it starts in a lower cost band, from the published bands
  function better(data, a, x, y) {
    const w = reasons(a, x, y);
    if (w) return `Where ${x.p.name} does better for you: ${w}.`;
    if (!(a.budget in BUDGET)) return null;
    const row = a.what === 'store' ? 'cost_store' : 'cost_site', band = (p) => ((data.answers[p.p.id] || {})[row] || {}).verdict;
    const bx = band(x), by = band(y);
    if (!(bx in COST_LEVEL) || !(by in COST_LEVEL) || COST_LEVEL[bx] >= COST_LEVEL[by]) return null;
    const label = (v) => (data.verdicts || {})[v] || v;
    return `Where ${x.p.name} does better for you: it costs less to start (${label(bx)} vs ${label(by)}).`;
  }
  const sameSet = (xs, ys) => xs.length === ys.length && xs.every((w) => ys.includes(w));
  // A box's sentence with its own platform's name taken out, to tell whether two boxes say the same thing
  const generic = (text, name) => text.split(name).join('·');
  // For the top matches: the reasons to show and vs, a heading and a sentence on what sets each apart
  // from its neighbour (null if there's nothing to say). The second and third show their own reasons,
  // collapsed to "the same reasons as …" only when they're exactly the first's; their box says where they
  // did better than the first for these answers, or else what they offer (pickOver). When the third would
  // repeat the second (the same reasons, or the same box against the first), it's compared with the second
  // instead, so the two read differently.
  function explain(data, a, top) {
    const lead = top[0];
    const out = top.map((r, i) => {
      if (!i) {
        const next = top[1];
        let vs = null;
        if (next && next.s === r.s) vs = { head: `A close call with ${next.p.name}`, text: ['Both fit your answers equally.', better(data, a, r, next) || pickOver(data, a, r, next)].filter(Boolean).join(' ') };
        else if (next) {
          const text = tipped(a, r, next) || pickOver(data, a, r, next);
          if (text) vs = { head: `Ahead of ${next.p.name}`, text };
        }
        return { why: r.why, vs };
      }
      const why = sameSet(r.all, lead.all) ? [`Fits your answers for the same reasons as ${lead.p.name}`] : r.why;
      const text = better(data, a, r, lead) || pickOver(data, a, r, lead);
      return { why, vs: text ? { head: `Versus ${lead.p.name}`, text } : null };
    });
    const [, second, third] = top;
    if (third) {
      const twin = sameSet(third.all, second.all) && !sameSet(third.all, lead.all);
      const echo = out[1].vs && out[2].vs && generic(out[1].vs.text, second.p.name) === generic(out[2].vs.text, third.p.name);
      if (twin || echo) {
        let text = better(data, a, third, second);
        // Still the second's sentence ("…has more plugins and apps for that" twice): what the third offers instead
        if (!text || (out[1].vs && generic(out[1].vs.text, second.p.name) === generic(text, third.p.name))) text = pickOver(data, a, third, second);
        if (twin) out[2].why = [`Fits your answers for the same reasons as ${second.p.name}`];
        if (text) out[2].vs = { head: `Versus ${second.p.name}`, text };
      }
    }
    return out;
  }

  // Answers that add and take nothing, used for questions an old shared link (v=1) didn't have
  const NEUTRAL = { grow: 'no', budget: 'any' };
  // A first match scoring under this fits poorly: less than being made for what you're making earns on its
  // own. The page calls it the closest match, not the best. First places mostly score 7 to 19 (the lowest
  // persona is 9); about 3% of answer sets fall under it, all of them custom builds.
  const LOW_FIT = 4;
  // Answers that pull against each other, with the question to change: a custom app or portal built by
  // someone not technical
  const conflict = (a) => (a.what === 'custom' && a.who === 'easy' ? 'who' : null);
  const api = { QUESTIONS, rank, explain, PHRASE, weight, TIP, LEAD, NEUTRAL, notIdealFor, LOW_FIT, conflict };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.cmsScore = api;
})(typeof window !== 'undefined' ? window : globalThis);
