// CMS Picker: the Find my fit questions and scoring, shared by the page (app.js) and the persona tests.
// Plain script: in the browser it sets window.cmsScore; in Node, module.exports.
(function (root) {
  'use strict';
  // Scores come from the published data (profiles, verified answers) plus the quiz's own values (data.quiz), and
  // every reason shown comes from the same data, so a result never claims what the table doesn't.
  const QUESTIONS = [
    // Each option: [value, title, hint, the answer on its own (the button above the results), when it's offered?]
    { id: 'what', q: 'What are you making?', opts: [['site', 'A site for my business or work', 'Services, portfolio, about and contact', 'A business or work site'], ['store', 'An online store', 'Products, checkout and payments', 'An online store'], ['content', 'A blog, newsletter or publication', 'Writing is the main thing', 'A blog, newsletter or publication'], ['custom', 'Something custom', 'An app or portal, built with a developer', 'Something custom: an app or portal']] },
    { id: 'kind', q: 'Which best describes you or your site?', when: (a) => a.what === 'site', also: { id: 'hubspot', title: 'We already use HubSpot', hint: 'For our CRM, email or marketing', own: 'We already use HubSpot' }, opts: [['local', 'A local business or services', 'Shops, trades, salons, clinics, consultants', 'A local business or services'], ['creative', 'Creative work or a portfolio', 'Photography, design, art, music', 'Creative work or a portfolio'], ['startup', 'A startup or product launch', 'A product, an app or a launch page', 'A startup or product launch'], ['b2b', 'A company selling to other businesses', 'B2B: leads, demos and a sales team', 'A company selling to other businesses (B2B)'], ['content', 'A content-heavy site', 'Articles, guides and resources', 'A content-heavy site']] },
    { id: 'who', q: 'Who’ll build and update it?', opts: [['easy', 'Me, and I’m not technical', 'It needs to be simple', 'I’ll build it, not technical'], ['learn', 'Me, and I’m happy to learn', 'A bit of a learning curve is fine', 'I’ll build it and learn'], ['agency', 'A designer or agency', 'They build it; I might edit', 'A designer or agency builds it'], ['dev', 'A developer', 'Code is fine', 'A developer builds it']] },
    { id: 'care', q: 'Who should keep the site running and secure?', opts: [['no', 'The platform', 'Hosting, updates and security included', 'Hosting and updates handled for me'], ['yes', 'Me, or someone I’ll ask', 'I pay for web hosting and keep it updated', 'Fine looking after hosting and updates']] },
    { id: 'size', q: 'Which fits your shop best?', when: (a) => a.what === 'store', opts: [['small', 'Up to a few hundred products', 'A small or growing shop', 'A shop with up to a few hundred products'], ['big', 'Thousands of products', 'A large catalogue', 'Thousands of products'], ['b2b', 'Selling to other businesses (B2B)', 'Wholesale, trade accounts or bulk orders', 'Selling to other businesses (B2B)']] },
    // Every need that matters from day one, as a checklist (multi); "Nothing special" is the answer when none is ticked.
    // Languages stay their own answer (also), drawn as the list's last row.
    { id: 'needs', q: 'Anything you’ll need from day one?', hint: 'Tick everything you need; the rest can come later. None of these? Next skips it.', multi: 'none', also: { id: 'lang', title: 'Two or more languages', hint: 'The same pages in each language', own: 'Two or more languages' }, opts: [['bookings', 'Bookings or appointments', 'Clients book a time online', 'Bookings or appointments from day one'], ['members', 'Paid subscribers or members', 'Paid posts, memberships or a paid newsletter', 'Paid subscribers or members'], ['sell', 'Selling online too', 'A few products or services to sell', 'Selling online too', (a) => a.what !== 'store'], ['blog', 'A blog or news section', 'Posts alongside the main pages', 'A blog or news section', (a) => a.what !== 'content'], ['none', 'Nothing special', 'The usual pages are enough', 'Nothing special from day one']] },
    { id: 'look', q: 'How much control over the design do you want?', opts: [['template', 'A good template is enough', 'Pick one and go', 'A good template is enough'], ['visual', 'Arrange things visually myself', 'Drag, drop and adjust', 'Arrange the design visually'], ['pixel', 'Every detail', 'Exactly to a designer’s layout', 'Control every detail of the design']] },
    // Where the site is now: starting fresh, every platform on the picker (options() adds them), or somewhere else. No points.
    { id: 'moving', q: 'Moving from somewhere?', hint: 'If you already have a site, pick where it runs now.', plats: true, opts: [['no', 'No, starting fresh', 'A new site, nothing to bring over', 'Starting fresh'], ['other', 'Somewhere else', 'A platform that isn’t listed', 'Moving from another platform']] },
    { id: 'budget', q: 'What can you spend each month?', opts: [['none', 'Nothing for now', 'Start free, upgrade later', 'Nothing for now: free to start'], ['low', 'Up to about $25', 'A basic plan', 'Up to about $25 a month'], ['mid', 'Up to about $100', 'Room for a store or more features', 'Up to about $100 a month'], ['any', 'Over $100, or it doesn’t matter', 'Cost isn’t the deciding factor', 'Cost isn’t the deciding factor']] },
  ];
  // A question's options for these answers, plus the platforms for "Moving from somewhere?"
  // The platforms go after the first answer, so "Somewhere else" closes their list
  const options = (q, a, data) => {
    const own = q.opts.filter((o) => !o[4] || o[4](a));
    const plats = q.plats && data ? data.platforms.map((p) => [p.id, p.name, '', `Moving from ${p.name}`, undefined, p]) : [];
    return [...own.slice(0, 1), ...plats, ...own.slice(1)];
  };
  const isAnswer = (q, a, data) => {
    const vs = options(q, a, data).map(([v]) => v), x = a[q.id];
    if (!q.multi) return vs.includes(x);
    const list = String(x || '').split(',');
    return x === q.multi || (!!x && list.every((v) => v !== q.multi && vs.includes(v)));
  };
  const WHAT = { site: 'Made for business and portfolio sites', store: 'Made for online stores', content: 'Made for blogs and publishing', custom: 'Made for custom builds' };
  // "Which best describes you or your site?": the reason a platform gets when its card has a "Good fit" line for that kind (quiz.fitFor)
  const KINDS = { local: 'Suits local businesses and services', creative: 'Suits creative work and portfolios', startup: 'Suits startups and product launches', b2b: 'Suits companies selling to other businesses', content: 'Suits sites with lots of content' };
  // Budget against the "What it costs to start" bands: 3 points off per band over, nothing for being within it.
  // Free software still needs paid hosting, so it counts as the lowest paid band.
  const COST_LEVEL = { free: 0, low: 1, software: 1, mid: 2, high: 3 };
  const BUDGET = { none: 0, low: 1, mid: 2 };
  // The cost row these answers pay: a store's (a site that sells too as well), the paid-members plan, or a website's.
  // Shared by the budget score, the "costs less" box and the card's cost line, so they agree.
  // "Anything you'll need from day one?" takes several answers, kept as one comma list ("bookings,sell")
  const need = (a, v) => String(a.needs || '').split(',').includes(v);
  const costRow = (a) => (a.what === 'store' || need(a, 'sell') ? 'cost_store' : need(a, 'members') ? 'cost_members' : 'cost_site');
  const LOOKS = { template: 'Good templates to start from', visual: 'Arrange your pages visually', pixel: 'Full control over the design' };
  // Moving an existing site, from a platform on the picker or another one
  const moving = (a) => !!a.moving && a.moving !== 'no';

  // What each part of the score says when it tipped a result: [the leader earned it, the runner-up lost it], given
  // (answers, runner-up, leader, the leader's points, the runner-up's points). Keys match fitScore's parts.
  const TIP = {
    goal: [(a, y, x) => `${x} is made for that`, (a, y) => `${y} isn’t made for that`],
    kind: [(a, y, x) => `${x} suits that`, null],
    members: [(a, y, x) => `${x} has them built in`, (a, y) => `${y} needs more than its own tools for that`],
    letters: [(a, y, x) => `${x} sends newsletters to them itself`, null],
    sellOnly: [null, (a, y) => `${y} is made only for selling`],
    frontEnd: [(a, y, x) => `${x} is built to feed a website and an app from one place`, null],
    hubspot: [(a, y, x) => `${x} works with them directly`, null],
    ease: [(a, y, x) => (a.who === 'easy' ? `${x} is easier to run` : `${x} is easier to learn`), (a, y) => (a.who === 'easy' ? `${y} is harder to run` : `${y} is harder to learn`)],
    agency: [(a, y, x) => `${x} is a common choice for them`, null],
    agencyOnly: [null, (a, y) => `${y} is mainly sold through agencies`],
    dev: [(a, y, x) => `${x} gives them full control`, (a, y) => `${y} isn’t built to be coded`],
    managed: [(a, y, x) => `${a.who === 'agency' ? 'your agency' : 'your developer'} can put ${x} on managed hosting, which handles them`, null],
    care: [(a, y, x) => `${x} handles them for you`, (a, y, x, own, theirs) => (theirs === -2 ? `${y} needs a managed host or someone to look after it` : `${y} leaves hosting and updates to you`)],
    sell: [(a, y, x) => `selling is easier to set up on ${x}`, (a, y) => `selling is harder to set up on ${y}`],
    sellFirst: [(a, y, x) => `${x} is made for selling first`, null],
    size: [(a, y, x) => `${x} handles large catalogues`, (a, y) => `${y} isn’t made for large catalogues`],
    small: [(a, y, x) => `${x} suits that`, null],
    b2b: [(a, y, x) => `${x} is built for B2B`, null],
    lang: [(a, y, x) => `that’s easier to set up on ${x}`, (a, y) => `that’s harder to set up on ${y}`],
    look: [(a, y, x) => ({ template: `${x} has good ones to start from`, visual: `${x} lets you do that`, pixel: `${x} gives you that` })[a.look], null],
    bookings: [(a, y, x) => `${x} has bookings built in`, (a, y) => `${y} needs an add-on for bookings`],
    blog: [(a, y, x) => `${x} has a blog built in`, (a, y) => `${y} needs more than its own tools for a blog`],
    imports: [(a, y, x) => `${x} imports your content from there`, null],   // no points, so never tips; here so every part has words
    links: [null, (a, y, x, own, theirs) => (theirs === -4 ? `${y} can’t keep old links working` : `${y} needs custom code to keep old links working`)],
    shopCost: [null, null],   // an estimate from two bands, not a stated price, so it's never given as a reason
    notIdeal: [null, (a, y) => `${y} isn’t ideal for answers like yours`],
    // Minus: when the leader is over the budget too (lost points of its own), it only costs less than the runner-up
    budget: [(a, y, x) => (a.budget === 'none' ? `${x} is free to start` : `${x} fits it`), (a, y, x, own) => (own < 0 ? `${x} costs less than ${y}` : `${y} costs more than that`)],
  };
  // An answer's own label, as the quiz shows it
  const answerLabel = (q, v) => ((QUESTIONS.find((x) => x.id === q).opts || []).find((o) => o[0] === v) || [])[1];
  // The answer behind each part, said first so the reason reads as a reply to it. Null when the wording names it.
  const LEAD = {
    goal: (a) => ({ site: 'you’re making a site for your business or work', store: 'you’re making an online store', content: 'you’re making a blog, newsletter or publication', custom: 'you’re building an app or portal' })[a.what],
    kind: (a) => ({ local: 'you’re a local business or service', creative: 'you’re showing creative work', startup: 'you’re launching a product', b2b: 'you sell to other businesses', content: 'you’ll have lots of content' })[a.kind],
    members: () => 'you want paid subscribers or members',
    letters: () => 'you want paid subscribers or members',
    sellOnly: () => 'you’re not making a store',
    frontEnd: () => 'you’re building an app or portal',
    hubspot: () => 'you already use HubSpot’s tools',
    ease: (a) => (a.who === 'easy' ? 'you’re not technical' : 'you’re building it yourself'),
    agency: () => 'a designer or agency is building it',
    agencyOnly: (a) => (a.who === 'dev' ? 'a developer is building it' : 'you’re building it yourself'),
    dev: () => 'a developer is building it',
    care: () => 'you want hosting, updates and security looked after',
    managed: () => 'you want hosting, updates and security looked after',
    sell: (a) => (a.what === 'store' ? 'you’re making an online store' : 'you want to sell online too'),
    sellFirst: () => 'you’re making an online store',
    size: (a) => (a.size === 'b2b' ? 'you’re selling to other businesses' : 'you have thousands of products'),
    small: () => 'you have a small shop',
    b2b: () => 'you’re selling to other businesses',
    lang: () => 'you need more than one language',
    look: (a) => ({ template: 'a good template is enough for you', visual: 'you want to arrange things visually', pixel: 'you want control over every detail' })[a.look],
    bookings: () => 'you need bookings from day one',
    blog: () => 'you want a blog alongside the site',
    imports: (a) => (a.moving && a.moving !== 'no' && a.moving !== 'other' ? `you’re moving from ${a.moving}` : null),
    links: (a) => (moving(a) ? 'you’re moving an existing site' : null),
    shopCost: null,
    notIdeal: null,
    budget: (a) => (a.budget === 'none' ? 'you want to start free' : ['low', 'mid'].includes(a.budget) ? `you want to spend ${lowerFirst(answerLabel('budget', a.budget))} a month` : undefined),
  };

  // Every key in "when" has one of its listed answers (quiz.notIdeal, quiz.fitFor)
  // A question's tick counts only while that question is asked; one not given reads as "no", so a line can apply unless it's ticked
  const TICKS = Object.fromEntries(QUESTIONS.filter((q) => q.also).map((q) => [q.also.id, q]));
  const ticked = (a, id) => a[id] === 'yes' && (!TICKS[id].when || TICKS[id].when(a));
  const matches = (when, a) => Object.entries(when).every(([q, vs]) => (q === 'needs' ? vs.some((v) => need(a, v)) : vs.includes(TICKS[q] ? (ticked(a, q) ? 'yes' : 'no') : a[q])));
  // The first of a platform's "Not ideal if" lines (quiz.notIdeal) these answers match
  const notIdealFor = (Q, id, a) => ((Q.notIdeal || {})[id] || []).find((n) => matches(n.when, a));
  // The card's first "Less suited if" line, skipping one a tick has answered ("You don't otherwise use HubSpot" when it's ticked)
  const lessSuited = (Q, p, a) => ((p.profile || {}).lessSuited || []).find((l) => !((Q.notIdeal || {})[p.id] || []).some((n) => l.startsWith(n.if) && Object.entries(n.when).some(([q, vs]) => TICKS[q] && ticked(a, q) && !vs.includes('yes'))));
  // The card's "Good fit" lines that answer these answers (quiz.fitFor), in card order; they break an exact tie
  const fitLines = (Q, id, a) => [...new Set(((Q.fitFor || {})[id] || []).filter((f) => matches(f.when, a)).map((f) => f.line))];

  function fitScore(data, p, a) {
    const Q = data.quiz, pr = p.profile || {}, why = [], but = [], pts = {}, links = {};   // but: what counted against an answer ("Worth knowing"); links: a reason's docs page
    const has = (list) => (Q[list] || []).includes(p.id);
    const verdict = (row) => ((data.answers[p.id] || {})[row] || {}).verdict;
    let s = 0;
    // One part of the score: its key (see TIP), its points, and the reason it adds, if any
    const add = (key, n, reason) => { s += n; pts[key] = (pts[key] || 0) + n; if (reason) why.push(reason); };
    if ((pr.goals || []).includes(a.what)) add('goal', 4, WHAT[a.what]); else add('goal', -8);
    if (a.what !== 'store' && has('storeOnly')) add('sellOnly', -6);
    // Suits that kind of business only where its own card says so: a "Good fit" line tagged with that kind
    if (a.what === 'site' && ((Q.fitFor || {})[p.id] || []).some((f) => (f.when.kind || []).includes(a.kind))) add('kind', 3, KINDS[a.kind]);
    if (need(a, 'members')) {
      // The "Sell memberships or paid posts" row: built in beats an add-on
      const m = verdict('members');
      add('members', { yes: 3, plugin: 0, code: -2, check: -2, no: -4 }[m] ?? 0, m === 'yes' && 'Paid memberships built in');
      // quiz.members: the platform sends newsletters to those members itself
      if (has('members')) add('letters', 2, 'Newsletters to your members built in');
      // A cut of what members pay (quiz.revenueShare), which the monthly cost bands don't show
      const cut = (Q.revenueShare || {})[p.id];
      if (cut) but.push(`it keeps ${cut.share}`);
    }
    // Already on HubSpot: its card's first "Good fit" line
    if (ticked(a, 'hubspot') && p.id === 'hubspot') add('hubspot', 4, 'Fits the HubSpot tools you already use');
    if (a.what === 'custom' && has('customFrontEnd')) add('frontEnd', 3, 'One place to manage content for a website and an app');
    const ease = Q.ease[p.id] ?? 1;
    // Building it yourself: one that needs a developer counts as heavily as one not made for what you're making
    if (a.who === 'easy') {
      add('ease', ease === 0 ? -8 : ease * 2 - 3, ease === 3 && 'Easy to run without technical skills');
      if (ease === 0) but.push('it needs a developer to build and run'); else if (ease === 1) but.push('it takes more learning to run without technical help');
    }
    if (a.who === 'learn') add('ease', ease >= 1 ? 1 : -8);
    if (a.who === 'agency' && has('agency')) add('agency', 2, 'A common choice for designers and agencies');
    if (a.who !== 'agency' && has('agencyOnly')) add('agencyOnly', -2);
    // A developer: platforms built to be coded (quiz.devControl)
    if (a.who === 'dev') { if (has('devControl')) add('dev', 2, 'Gives a developer full control'); else add('dev', -1); }
    if (a.care === 'no') {
      // Handled by the platform +2; a managed option the hosting line names (quiz.managedHosting) -2, or +2 when an
      // agency or developer builds it, as they arrange the managed host; yours -6
      const handled = /^Handled for you/.test(pr.hosting || ''), managed = has('managedHosting');
      if (managed && (a.who === 'agency' || a.who === 'dev')) add('managed', 2);
      else add('care', handled ? 2 : managed ? -2 : -6, handled && 'Hosting, updates and security are handled for you');
      if (!handled) but.push(managed ? 'it needs a managed host or someone to look after it' : 'hosting, updates and security are on you');
    }
    if (a.what !== 'store' && need(a, 'sell')) {
      // Selling on something that isn't a store: the "Sell online" row
      const v = verdict('store');
      add('sell', { yes: 2, plugin: 0, code: -2, no: -4 }[v] ?? 0, v === 'yes' && 'Selling online built in');
      const w = { plugin: 'selling online needs an add-on', code: 'selling online needs custom code', no: 'it doesn’t sell online' }[v];
      if (w) but.push(w);
    }
    if (a.what === 'store') {
      add('sell', { yes: 2, plugin: 0, code: -3, no: -6 }[verdict('store')] ?? 0);
      if (has('storeOnly')) add('sellFirst', 2);   // made for selling first, so it leads a tie with all-round builders
      // B2B is a large catalogue too, plus the platforms whose profiles name B2B (quiz.b2b)
      if (a.size === 'big' || a.size === 'b2b') { if (has('largeCatalogue')) add('size', 3, 'Handles large catalogues'); else add('size', -2); }
      if (a.size === 'b2b' && has('b2b')) add('b2b', 3, 'Suits selling to other businesses (B2B)');
      if (a.size === 'small' && has('smallShop')) add('small', 1);
    }
    if (a.lang === 'yes') {
      const l = verdict('languages');
      // An add-on for it counts a little against, except for a developer or agency, who adds plugins as a matter of course
      add('lang', { yes: 2, plugin: a.who === 'dev' || a.who === 'agency' ? 0 : -1, code: -2, no: -4 }[l] ?? 0, l === 'yes' && 'More than one language is built in');
      const w = { plugin: 'more than one language needs an add-on', code: 'more than one language needs custom code', no: 'it doesn’t do more than one language' }[l];
      if (w) but.push(w);
    }
    // No table row for bookings: quiz.bookings says which have them built in; the rest take an add-on
    if (need(a, 'bookings')) { if (has('bookings')) add('bookings', 3, 'Bookings built in'); else { add('bookings', -1); but.push('bookings need an add-on'); } }
    // A blog beside a site or store: the "Add a blog" row
    if (a.what !== 'content' && need(a, 'blog')) {
      const v = verdict('blog');
      add('blog', { yes: 2, plugin: 0, code: -2, no: -4 }[v] ?? 0, v === 'yes' && 'A blog built in');
      const w = { plugin: 'a blog needs an add-on', code: 'a blog needs custom code', no: 'it doesn’t do a blog' }[v];
      if (w) but.push(w);
    }
    if ((Q.look[p.id] || []).includes(a.look)) add('look', 2, LOOKS[a.look]);
    // Moving from a platform on the picker: a reason with its docs where this one imports from there (quiz.imports); no points
    const imp = ((Q.imports || {})[p.id] || {})[a.moving];
    const origin = imp && data.platforms.find((x) => x.id === a.moving);
    if (origin) { const line = `Imports your ${origin.name} ${imp.what}`; add('imports', 0, line); links[line] = imp.url; }
    // Moving an existing site: its old links must keep working (the "Keep old links working" row). A redirect plugin is
    // routine, so only needing code or not being possible counts against, and code not for a developer, who writes the
    // redirects into the front end they build
    if (moving(a)) {
      const v = verdict('gsc404');
      add('links', { code: a.who === 'dev' ? 0 : -2, check: -2, no: -4 }[v] ?? 0);
      const w = { code: 'keeping old links working needs custom code', check: 'keeping old links working needs custom code', no: 'it can’t keep old links working, so links to your current pages would break' }[v];
      if (w) but.push(w);
    }
    // The card's own "Not ideal if" lines that match (quiz.notIdeal): ruled out unless nothing else fits
    if (notIdealFor(Q, p.id, a)) add('notIdeal', -30);
    if (a.budget in BUDGET) {
      // No store plan ("Not offered") on a site that sells: its site plan plus a separate shop, so at least the lowest
      // paid band. No pricing page states that sum, so it counts under its own part, which never gives a reason
      const band = verdict(costRow(a));
      if (band === 'na') {
        const over = Math.max(COST_LEVEL[verdict('cost_site')] ?? 1, 1) - BUDGET[a.budget];
        add('shopCost', -3 * Math.max(0, over));
        if (over > 0) but.push('a separate shop adds to the cost of its site plan');
      }
      const level = COST_LEVEL[band];
      if (level !== undefined) {
        const over = level - BUDGET[a.budget];
        if (over > 0) { add('budget', -3 * over); but.push('it costs more to start than you planned to spend'); } else add('budget', 0, a.budget === 'none' ? 'Free to start' : 'Fits your budget');
        // Starting free where the free plan has only the platform's own address (quiz.freeDomain): a business wants its own
        const fd = a.budget === 'none' && band === 'free' && (Q.freeDomain || {})[p.id];
        if (fd) but.push(`the free plan uses an address like ${fd.address}; your own domain needs ${fd.needs || 'a paid plan'}`);
      }
    }
    // Every reason is shown, so two cards' lists match only when their reasons really do; "but" changes no score
    const fit = fitLines(Q, p.id, a);
    // Second tie-break, after the card lines: the builder whose card leads with the design control asked for (quiz.lookBest)
    const lb = (Q.lookBest || {})[p.id] || null;
    // Must-haves, ranked before the points: gate counts what rules it out (not made for it, made only for selling, its
    // card says not ideal, needs a developer someone building it themselves can't be), short how far it falls short of
    // having the must-haves built in
    const gate = (pts.goal < 0) + (pts.sellOnly < 0) + (pts.notIdeal < 0) + (pts.ease === -8);
    const must = musts(data, p.id, a);
    return { p, s, why, all: why, but, pts, fit, tb: fit.length, tb2: lb && lb.look === a.look ? 1 : 0, lookTag: lb && lb.tag, links, gate, must, short: must.reduce((n, m) => n + m.short, 0) };
  }

  // The must-haves for these answers (the need that matters most, the languages tick, and for a store selling itself and
  // a large or B2B catalogue), each with how the platform does it (how: the table's verdict, or 'notMade' for a
  // catalogue it isn't made for) and how far that falls short of built in. A developer or agency adds plugins as a matter
  // of course, so for them only "needs code" or "not possible" falls short; bookings count one step, as every platform
  // takes them with an add-on.
  const HAS = { yes: 3, auto: 3, plugin: 2, indirect: 2, code: 1, check: 1, no: 0 };
  function musts(data, id, a) {
    const Q = data.quiz, pro = a.who === 'dev' || a.who === 'agency', out = [];
    const verdict = (row) => ((data.answers[id] || {})[row] || {}).verdict;
    const row = (key, what, r) => { const v = verdict(r), lvl = pro && v === 'plugin' ? 3 : HAS[v] ?? 0; out.push({ key, what, how: v, short: 3 - lvl }); };
    if (need(a, 'bookings')) { const has = (Q.bookings || []).includes(id); out.push({ key: 'bookings', what: 'bookings', how: has ? 'yes' : 'plugin', short: !pro && !has ? 1 : 0 }); }
    if (need(a, 'members')) row('members', 'paid members', 'members');
    if (need(a, 'blog') && a.what !== 'content') row('blog', 'a blog', 'blog');
    if (need(a, 'sell') || a.what === 'store') row('sell', 'selling online', 'store');
    if (a.lang === 'yes') row('lang', 'more than one language', 'languages');
    if (a.what === 'store' && (a.size === 'big' || a.size === 'b2b')) { const has = (Q.largeCatalogue || []).includes(id); out.push({ key: 'size', what: 'a large catalogue', how: has ? 'yes' : 'notMade', short: has ? 0 : 3 }); }
    if (a.what === 'store' && a.size === 'b2b') { const has = (Q.b2b || []).includes(id); out.push({ key: 'b2b', what: 'selling to other businesses', how: has ? 'yes' : 'notMade', short: has ? 0 : 1 }); }
    // Moving an existing site: old links kept working, where a plugin counts as built in for everyone, and code for a
    // developer (see fitScore)
    if (moving(a)) { const v = verdict('gsc404'); out.push({ key: 'links', what: 'redirects from old links', how: v, short: { code: a.who === 'dev' ? 0 : 2, check: 2, no: 3 }[v] || 0 }); }
    return out;
  }
  // What a match lacks that the first has, for the divider above the matches that don't have every must-have built in:
  // the must-haves where it falls further short than the first, grouped by how it would get there, as one sentence
  // ("Framer needs an add-on for selling online.") and the worst of them, for the divider's heading
  const HOW = { plugin: 'needs an add-on for', indirect: 'needs an add-on for', code: 'needs custom code for', check: 'needs custom code for', no: 'can’t do', notMade: 'isn’t made for' };
  const HOW_RANK = { plugin: 1, indirect: 1, code: 2, check: 2, no: 3, notMade: 3 };
  function lacks(x, lead) {
    return sayGaps(x, x.must.filter((m) => m.short > ((lead.must.find((l) => l.key === m.key) || {}).short || 0) && HOW[m.how]));
  }
  // Must-haves a match falls short on, as one sentence grouped by how it would get there, and the worst of them
  function sayGaps(x, gaps) {
    if (!gaps.length) return null;
    const groups = [...new Set(gaps.map((m) => HOW[m.how]))].map((h) => `${h} ${listAnd(gaps.filter((m) => HOW[m.how] === h).map((m) => m.what))}`);
    return { text: `${x.p.name} ${groups.join(', and ')}.`, worst: Math.max(...gaps.map((m) => HOW_RANK[m.how])) };
  }
  // When even the first match falls short on a must-have, nothing that fits has them all built in (the ranking puts the
  // fewest gaps first): a note above the cards says so and what the first lacks. Null when it has them all, or when it
  // doesn't fit at all (the "closest" notice covers that).
  function firstGap(top) {
    const r = top[0];
    if (!r || r.gate) return null;
    const said = sayGaps(r, r.must.filter((m) => m.short > 0 && HOW[m.how]));
    return said && `None of the platforms that fit your answers has everything you need built in. ${said.text}`;
  }
  const listAnd = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0]);
  // The divider in the top three: before the first match that lacks a must-have the first has built in, with a heading by
  // the worst of what's missing and a sentence per match below it. Null when every match has them all.
  const DIVIDER = { 1: 'Also possible, with an add-on', 2: 'Also possible, with custom code', 3: 'Missing something you need' };
  function divider(top) {
    const at = top.findIndex((r, i) => i && r.gate === top[0].gate && r.short > top[0].short);
    if (at < 0) return null;
    const below = top.slice(at).map((r) => lacks(r, top[0])).filter(Boolean);
    if (!below.length) return null;
    return { at, head: DIVIDER[Math.max(...below.map((b) => b.worst))], lines: below.map((b) => b.text) };
  }
  // Which tier puts x ahead of y: 'gate' (y is ruled out), 'need' (x has more of the must-haves built in), or null when
  // they're level on both and the points decide
  const ahead = (x, y) => (x.gate < y.gate ? 'gate' : x.gate > y.gate ? null : x.short < y.short ? 'need' : null);
  const sameTier = (x, y) => x.gate === y.gate && x.short === y.short;

  // Must-haves first, then points; an exact tie goes to the card with more matching "Good fit" lines, then to lookBest,
  // else stays a tie
  const rank = (data, a) => data.platforms.map((p) => fitScore(data, p, a)).sort((x, y) => x.gate - y.gate || x.short - y.short || y.s - x.s || y.tb - x.tb || y.tb2 - x.tb2);
  // The matches: every platform but the one being left (it still ranks, for "Had a platform in mind?"), with the
  // ones whose card says not ideal behind every other
  function candidates(data, a) {
    const rs = rank(data, a).filter((r) => r.p.id !== a.moving);
    const ok = rs.filter((r) => !notIdealFor(data.quiz, r.p.id, a));
    return [...ok, ...rs.filter((r) => !ok.includes(r))];
  }
  const tied = (x, y) => sameTier(x, y) && x.s === y.s && x.tb === y.tb && x.tb2 === y.tb2;
  // Level on the must-haves and within n points: a "Good match" beside the first, or worth a look
  const near = (r, lead, n) => sameTier(r, lead) && lead.s - r.s <= n;

  // ---------- Telling the top matches apart, from the published answers and cards only ----------
  // How well an answer does it, and the table's verdict as the end of a sentence ("Webflow has it built in")
  const LEVEL = { yes: 3, auto: 3, plugin: 2, code: 1, no: 0 };
  const DOES = { yes: 'has it built in', auto: 'does it automatically', plugin: 'needs a plugin or app for it', code: 'needs code for it', no: 'can’t do it' };
  // Each table row as a short phrase for "If you want …, Webflow has it built in": what the row's own question asks,
  // no more ("Design every detail" is every detail, not design control in general)
  const PHRASE = {
    blog: 'a blog', store: 'to sell online', members: 'to sell memberships or paid posts', languages: 'more than one language', forms: 'contact and sign-up forms',
    design: 'to shape every detail of the design', meta_title: 'to set page titles and descriptions for search', urls: 'to choose page addresses',
    gsc404: 'old links to keep working when pages move', schema: 'to add details like prices and ratings for search engines', noindex: 'to keep a page out of search results',
    ai_crawlers: 'to choose which AI bots may read the site',
    cost_site: 'a cheaper start', cost_store: 'a cheaper store', cost_members: 'a cheaper start with paid members',   // never shown (weight 0), but every row needs one (the test checks)
  };
  // How much a row matters for these answers; 0 when the person has ruled it out
  function weight(row, a) {
    if (row.startsWith('cost_')) return 0;   // the budget question covers cost
    if (row === 'store') return a.what === 'store' || need(a, 'sell') ? 3 : 0;   // not selling
    if (row === 'languages') return a.lang === 'yes' ? 3 : 0;   // one language
    if (row === 'design') return a.look === 'template' ? 0 : a.look === 'pixel' ? 2 : 1;  // a good template is enough; every detail is what "pixel" asked for
    if (row === 'blog') return a.what === 'content' || need(a, 'blog') ? 3 : 1;
    if (row === 'members') return need(a, 'members') ? 3 : 1;
    return 1;
  }
  // Card tags about a row, left out of "is known for" when the answers rule that row out
  const TAG_ABOUT = { members: /paid member/i, design: /design control|canvas|animation/i, languages: /lingual|language|translat/i, store: /stor|sell|checkout|commerce/i };
  const lowerFirst = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const upperFirst = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  // A card tag inside a sentence: lower case, unless it starts with a name or an abbreviation (Figma, WooCommerce, SEO)
  const tagInSentence = (t) => (/^(Figma|[A-Z][a-z]*[A-Z]|[A-Z0-9]{2,})/.test(t) ? t : lowerFirst(t));
  // "a, b, and c": the serial comma, as some tags already contain "and" ("Forms and leads")
  const listOf = (xs) => (xs.length > 2 ? `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}` : xs.join(' and '));
  // The rows x does better than y and the person hasn't ruled out, most relevant first
  function edgeRows(data, a, x, y) {
    const ax = data.answers[x.p.id] || {}, ay = data.answers[y.p.id] || {};
    return data.items.map((it) => {
      const vx = (ax[it.id] || {}).verdict, vy = (ay[it.id] || {}).verdict, lx = LEVEL[vx] ?? -1, ly = LEVEL[vy] ?? -1;
      return { id: it.id, gap: lx - ly, w: weight(it.id, a), ly, vx, vy };
    }).filter((r) => r.gap > 0 && r.w > 0 && r.ly >= 0 && PHRASE[r.id]).sort((p, q) => q.w - p.w || q.gap - p.gap).slice(0, 2);
  }
  // Table rows where x does more than y, in the table's own verdicts, so the sentence can be checked against it; a
  // second row with the same verdicts is "The same goes if you want …"
  function rowsLine(rows, x, y) {
    const [r, s] = rows, line = (q) => `If you want ${PHRASE[q.id]}, ${x.p.name} ${DOES[q.vx]}, while ${y.p.name} ${DOES[q.vy]}.`;
    if (!s) return line(r);
    return `${line(r)} ${s.vx === r.vx && s.vy === r.vy ? `The same goes if you want ${PHRASE[s.id]}.` : line(s)}`;
  }
  // What sets x apart from y, from the comparison table first (rows the person asked about, then the rest), then the
  // card tags y doesn't have, then x's first "Good fit" line. Null when there's nothing to go on. behind: x is behind
  // y on the answers, so a card-only difference first says that nothing puts it ahead.
  function pickOver(data, a, x, y, behind) {
    const rows = edgeRows(data, a, x, y);
    if (rows.length) return rowsLine(rows, x, y);
    const none = behind ? `Nothing in your answers or the table puts ${x.p.name} ahead of ${y.p.name}. ` : '';
    const theirs = new Set(((y.p.profile || {}).tags || []).map((t) => t.toLowerCase()));
    const offers = ((x.p.profile || {}).tags || []).filter((t) => !theirs.has(t.toLowerCase())
      && !Object.keys(TAG_ABOUT).some((row) => weight(row, a) === 0 && TAG_ABOUT[row].test(t))).slice(0, 3);
    // Only what x's card highlights: another card leaving a tag out doesn't mean that platform lacks it
    if (offers.length) return `${none}${x.p.name} stands out for ${listOf(offers.map((t) => `“${t}”`))}.`;
    const fit = ((x.p.profile || {}).goodFit || [])[0];
    return fit ? `${none}${x.p.name} is a good fit for ${tagInSentence(fit)}.` : null;
  }
  // The parts each must-have tier is made of, so a result won on a tier leads with what decided it
  const TIER_PARTS = { gate: new Set(['goal', 'sellOnly', 'notIdeal', 'ease']), need: new Set(['bookings', 'members', 'sell', 'blog', 'lang', 'size', 'b2b', 'links']) };
  // The parts of the score where x beat y, those of the tier that put x ahead first, then the biggest gap, with wording in TIP
  function gaps(x, y) {
    const by = TIER_PARTS[ahead(x, y)], first = (g) => (by && by.has(g.k) ? 1 : 0);
    // Hosting is one comparison whichever way it was scored (handled by the platform, or a managed host arranged)
    const host = (p) => (p.pts.care || 0) + (p.pts.managed || 0);
    return [...new Set([...Object.keys(x.pts), ...Object.keys(y.pts)].map((k) => (k === 'managed' ? 'care' : k)))]
      .map((k) => (k === 'care' ? { k: 'managed' in x.pts ? 'managed' : 'care', d: host(x) - host(y) } : { k, d: (x.pts[k] || 0) - (y.pts[k] || 0) }))
      // x's own shop is over the budget too, so beating y on budget would read as if x were within it
      .filter((g) => g.d > 0 && TIP[g.k] && !(g.k === 'budget' && (x.pts.shopCost || 0) < 0)).sort((p, q) => first(q) - first(p) || q.d - p.d);
  }
  // x comes after y in the ranking and is behind it: on a must-have, or on points
  const isBehind = (x, y) => !sameTier(x, y) || x.s < y.s;
  // Parts whose other side names something missing (an add-on, a host, code), not just "harder": only these add it
  const LACKS = new Set(['bookings', 'members', 'blog', 'dev', 'care', 'size']);
  // Up to two of them in plain words, each after the answer behind it; an answer behind both is said once. The
  // first also gives the other platform's side when the score marks it down for the same thing ("…, while Framer
  // needs an add-on for bookings"), so the reason says what the other lacks only where the data says so.
  function reasons(a, x, y) {
    const two = gaps(x, y).slice(0, 2).sort((p, q) => (p.k === 'leave') - (q.k === 'leave'));
    let said = null;
    const lacks = [];
    const words = two.map(({ k }, i) => {
      const [plus, minus] = TIP[k], own = x.pts[k] || 0, theirs = y.pts[k] || 0;
      const f = own > 0 ? plus || minus : minus || plus;
      let w = f && f(a, y.p.name, x.p.name, own, theirs);
      if (!w) return null;
      const other = !i && LACKS.has(k) && own > 0 && theirs < 0 && minus && minus(a, y.p.name, x.p.name, own, theirs);
      if (other) { w = `${w}, while ${other}`; lacks.push(k); }
      const lead = LEAD[k] && LEAD[k](a);
      if (!lead || lead === said) return w;
      said = lead;
      return `${lead}, and ${w}`;
    }).filter(Boolean);
    const text = words.length > 1 ? `${words[0]}. ${upperFirst(words[1])}` : words[0];
    return text && Object.assign(new String(text), { lacks });   // a string, carrying the parts it says the other lacks
  }
  // For a match behind the first: what it scored better on, or else that it starts in a lower cost band
  function better(data, a, x, y) {
    const w = reasons(a, x, y);
    if (w) return `In ${x.p.name}’s favour: ${w}.`;
    if (!(a.budget in BUDGET)) return null;
    const band = (p) => (((data.answers[p.p.id] || {})[costRow(a)]) || {}).verdict;
    const bx = band(x), by = band(y);
    if (!(bx in COST_LEVEL) || !(by in COST_LEVEL) || COST_LEVEL[bx] >= COST_LEVEL[by]) return null;
    const label = (v) => (data.verdicts || {})[v] || v;
    return bx === 'free' ? `In ${x.p.name}’s favour: it’s free to start, against ${lowerFirst(label(by))} for ${y.p.name}.`
      : `In ${x.p.name}’s favour: it costs less to start, ${lowerFirst(label(bx))} against ${lowerFirst(label(by))} for ${y.p.name}.`;
  }
  const sameSet = (xs, ys) => xs.length === ys.length && xs.every((w) => ys.includes(w));
  // A box's sentence with its own platform's name taken out, to tell whether two boxes say the same thing
  const generic = (text, name) => text.split(name).join('·');
  // For the top matches: each card's reasons (the ones the other top cards don't share first) and a box on what sets
  // it apart from its neighbour. The second and third are compared with the first, or with each other when the third
  // would repeat the second; a first place level on points says what settled it (fitFor, lookBest).
  function explain(data, a, top) {
    const lead = top[0];
    const shared = (r, w) => top.filter((o) => o !== r && o.all.includes(w)).length;
    const order = (r) => [...r.why].sort((u, v) => shared(r, u) - shared(r, v));
    // kind: 'tie' (level on everything), 'card' (level, first on who it's made for), 'look' (level, first on the look
    // asked for), 'tipped' (ahead, with the answers behind it in reason), 'other' (ahead, on what it offers), 'versus'
    const box = (kind, head, than, text, reason) => (text ? { kind, head, than, text, reason } : null);
    const out = top.map((r, i) => {
      if (!i) {
        const next = top[1];
        let vs = null;
        if (next && sameTier(r, next) && next.s === r.s) {
          const name = r.p.name, other = next.p.name;
          if (tied(r, next)) vs = box('tie', `${name} or ${other}`, other, ['They fit your answers equally well.', better(data, a, r, next) || pickOver(data, a, r, next)].filter(Boolean).join(' '));
          // The "Good fit" line is also what earns the kind points, so a reason that only restates the kind is left out
          else if (r.tb !== next.tb) vs = box('card', `Why ${name} first`, other, [`It fits your answers as well as ${other} does, and comes first as a good fit for ${tagInSentence(r.fit[0])}.`, gaps(r, next)[0]?.k === 'kind' ? null : better(data, a, r, next) || pickOver(data, a, r, next)].filter(Boolean).join(' '));
          else vs = box('look', `Why ${name} first`, other, [`It fits your answers as well as ${other} does. The difference is the look: ${LEAD.look(a)}, and ${name} is known for its ${tagInSentence(r.lookTag)}.`, better(data, a, r, next)].filter(Boolean).join(' '));
        } else if (next) {
          const w = reasons(a, r, next);
          vs = w ? { ...box('tipped', `Why ${r.p.name} first`, next.p.name, `${upperFirst(`${w}`)}.`, `${w}`), lacks: w.lacks } : box('other', `Why ${r.p.name} first`, next.p.name, pickOver(data, a, r, next));
        }
        return { why: order(r), vs };
      }
      const why = sameSet(r.all, lead.all) ? [`Fits your answers for the same reasons as ${lead.p.name}`] : order(r);
      return { why, vs: box('versus', `Compared with ${lead.p.name}`, lead.p.name, better(data, a, r, lead) || pickOver(data, a, r, lead, isBehind(r, lead))) };
    });
    const [, second, third] = top;
    if (third) {
      const twin = sameSet(third.all, second.all) && !sameSet(third.all, lead.all);
      const echo = out[1].vs && out[2].vs && generic(out[1].vs.text, second.p.name) === generic(out[2].vs.text, third.p.name);
      if (twin || echo) {
        let text = better(data, a, third, second);
        // Still the second's sentence ("…has more plugins and apps for that" twice): what the third offers instead
        if (!text || (out[1].vs && generic(out[1].vs.text, second.p.name) === generic(text, third.p.name))) text = pickOver(data, a, third, second, isBehind(third, second));
        if (twin) out[2].why = [`Fits your answers for the same reasons as ${second.p.name}`];
        if (text) out[2].vs = box('versus', `Compared with ${second.p.name}`, second.p.name, text);
      }
    }
    return out;
  }

  // How far ahead the first is. Level on the must-haves: level, within CLOSE points ("slightly ahead", a close call),
  // within LEAD_BY ("ahead"), or more ("well ahead", a clear winner). Ahead on a must-have it's at least a clear lead,
  // and a clear winner when the other is ruled out or also behind on points by more than LEAD_BY. The words never
  // overstate a lead (the personas test checks)
  const CLOSE = 2, LEAD_BY = 5;
  const STEP = (x, y) => {
    const by = ahead(x, y), gap = x.s - y.s;
    if (by) return by === 'gate' || gap > LEAD_BY ? 'clear' : 'lead';
    return !gap ? 'level' : gap <= CLOSE ? 'close' : gap <= LEAD_BY ? 'lead' : 'clear';
  };
  function standing(top) {
    if (!top[1]) return null;
    const kind = STEP(top[0], top[1]), gap = top[0].s - top[1].s, tier = ahead(top[0], top[1]), x = top[0].p.name, y = top[1].p.name;
    const line = {
      level: ['A close call', `${x} and ${y} fit your answers equally well, so either is a sound choice.`],
      close: ['A close call', `${x} is slightly ahead of ${y} for your answers, and either would work.`],
      lead: ['A clear lead', `${x} is ahead of ${y} for what you need.`],
      clear: ['A clear winner', `${x} is well ahead of ${y} for what you need.`],
    }[kind];
    return { kind, gap, tier, pill: line[0], line: line[1] };
  }
  // The same steps for any platform against the first ("Had a platform in mind?"); the one being left can be ahead
  const behind = (r, lead) => {
    if (ahead(r, lead) || (sameTier(r, lead) && r.s > lead.s)) return 'ahead of';
    return { level: 'level with', close: 'slightly behind', lead: 'behind', clear: 'well behind' }[STEP(lead, r)];
  };

  // Answers that add and take nothing, used for questions an old shared link (v=1) didn't have
  const NEUTRAL = { needs: 'none', moving: 'no', budget: 'any' };
  // A first match under this fits poorly (less than being made for the thing earns): the page says "closest match"
  const LOW_FIT = 4;
  // The first is only the closest: something rules it out (gate), as nothing fits at all, or it scores under LOW_FIT
  const closest = (r) => !!r && (r.gate > 0 || r.s < LOW_FIT);
  // Answers that pull against each other, with the question to change
  const conflict = (a) => (a.what === 'custom' && a.who === 'easy' ? 'who' : null);
  // The platform being left fits these answers as well as the first match or better (and isn't only the closest
  // itself): the page says staying may be the better choice. Null otherwise, or when not moving from the picker.
  const stay = (data, a) => {
    const all = rank(data, a), origin = all.find((r) => r.p.id === a.moving), lead = candidates(data, a)[0];
    if (!origin || !lead || closest(origin)) return null;
    const where = behind(origin, lead);
    return where === 'ahead of' || where === 'level with' ? { origin, lead, where } : null;
  };
  const api = { QUESTIONS, options, rank, candidates, explain, standing, behind, tied, near, ahead, sameTier, divider, firstGap, HOW, fitLines, PHRASE, DOES, weight, TIP, LEAD, LACKS, NEUTRAL, notIdealFor, lessSuited, LOW_FIT, closest, conflict, costRow, stay, need, isAnswer };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.cmsScore = api;
})(typeof window !== 'undefined' ? window : globalThis);
