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

  function fitScore(data, p, a) {
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
    // A developer: platforms built to be coded (quiz.devControl)
    if (a.who === 'dev') { if (has('devControl')) { s += 2; why.push('Gives a developer full control'); } else s -= 1; }
    if (a.care === 'no') {
      const handled = /^Handled for you/.test(pr.hosting || '');
      s += handled ? 2 : -3;
      if (handled) why.push('Hosting, updates and security are handled for you');
    }
    if (a.what === 'store') {
      s += { yes: 2, plugin: 0, code: -3, no: -6 }[verdict('store')] ?? 0;
      if (has('storeOnly')) s += 2;   // made for selling first, so it leads a tie with all-round builders
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

  // Every platform, best fit first
  const rank = (data, a) => data.platforms.map((p) => fitScore(data, p, a)).sort((x, y) => y.s - x.s);

  const api = { QUESTIONS, rank };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.cmsScore = api;
})(typeof window !== 'undefined' ? window : globalThis);
