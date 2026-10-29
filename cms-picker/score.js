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
    // short: the question's name on its answer button above the results
    { id: 'what', short: 'Making', q: 'What are you making?', opts: [['site', 'A site for my business or work', 'Services, portfolio, about and contact'], ['store', 'An online store', 'Products, checkout and payments'], ['content', 'A blog, newsletter or publication', 'Writing is the main thing'], ['custom', 'Something custom', 'An app or portal, built with a developer']] },
    { id: 'who', short: 'Who builds it', q: 'Who’ll build and update it?', opts: [['easy', 'Me, and I’m not technical', 'It needs to be simple'], ['learn', 'Me, and I’m happy to learn', 'A bit of a learning curve is fine'], ['agency', 'A designer or agency', 'They build it; I might edit'], ['dev', 'A developer', 'Code is fine']] },
    { id: 'care', short: 'Hosting and updates', q: 'Do you want to look after hosting, updates and security?', opts: [['no', 'No, handle it for me', 'Everything included'], ['yes', 'That’s fine', 'Or someone will do it for me']] },
    { id: 'size', short: 'Shop size', q: 'How big is the shop?', when: (a) => a.what === 'store', opts: [['small', 'Up to a few dozen products', 'A small shop'], ['big', 'Hundreds of products, or B2B', 'A large catalogue, or selling to businesses']] },
    { id: 'lang', short: 'Languages', q: 'Will it be in more than one language?', opts: [['no', 'No', 'One language'], ['yes', 'Yes', 'Two or more']] },
    { id: 'look', short: 'Design control', q: 'How much control over the design do you want?', opts: [['template', 'A good template is enough', 'Pick one and go'], ['visual', 'Arrange things visually myself', 'Drag, drop and adjust'], ['pixel', 'Every detail', 'Exactly as designed']] },
    { id: 'leave', short: 'Switching later', q: 'How important is taking everything with you if you switch later?', opts: [['yes', 'Very important', 'I want to own all of it'], ['no', 'Not a big concern', 'I’ll probably stay']] },
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
    // A developer: platforms built to be coded (quiz.devControl); until a publish carries that list, the hardest to run
    const devControl = Q.devControl ? has('devControl') : ease <= 1;
    if (a.who === 'dev') { if (devControl) { s += 2; why.push('Gives a developer full control'); } else s -= 1; }
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

  const api = { QUESTIONS, fitScore, rank };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.cmsScore = api;
})(typeof window !== 'undefined' ? window : globalThis);
