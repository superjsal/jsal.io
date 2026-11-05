// Shared by every jsal.io app (with /shell.css for the colours): the logo marked data-jsal-nav becomes the app
// menu (APPS); the button marked data-jsal-theme switches light/dark; on touch screens text marked data-touch is
// swapped for that wording (data-touch="" removes it); window.jsalTrack('name', { params }) or data-track="name"
// with data-track-* params sends a GA4 event.
(() => {
  // Analytics events on the GA4 tag every public page has (none on the Playbook); a page loaded ahead sends once shown
  const track = (name, params = {}) => {
    const send = () => { try { if (typeof window.gtag === 'function') window.gtag('event', name, params); } catch (e) {} };
    if (document.prerendering) document.addEventListener('prerenderingchange', send, { once: true }); else send();
  };
  window.jsalTrack = track;
  // "It worked", said on the button that did it: green, a tick and the past tense for two seconds, then its own label
  // again (/shell.css .jsal-done); a hidden live region says it too, as a changing label isn't always read out
  const doneTimers = new WeakMap();
  let doneSay;
  window.jsalDone = (btn, word = 'Copied') => {
    const label = [...btn.childNodes].reverse().find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!doneTimers.has(btn)) {
      if (label) btn.dataset.jsalLabel = label.textContent;
      btn.style.minWidth = btn.offsetWidth + 'px';   // a shorter word doesn't shift the buttons beside it
    }
    if (label) label.textContent = (/^\s/.test(label.textContent) ? ' ' : '') + word;
    btn.classList.add('jsal-done');
    if (!doneSay) { doneSay = document.createElement('span'); doneSay.className = 'sr-only'; doneSay.setAttribute('aria-live', 'polite'); document.body.append(doneSay); }
    doneSay.textContent = '';
    setTimeout(() => { doneSay.textContent = word; }, 50);
    clearTimeout(doneTimers.get(btn));
    doneTimers.set(btn, setTimeout(() => {
      if (label && btn.dataset.jsalLabel) label.textContent = btn.dataset.jsalLabel;
      btn.classList.remove('jsal-done');
      btn.style.minWidth = '';
      doneTimers.delete(btn);
    }, 2000));
  };
  // A tool's example tour, called when its example loads: one box at a time beside the control it explains, a blue
  // ring round that control, Back and Next (/shell.css .jsal-tour). Once per tool in this browser; Esc or × ends it.
  // Each step is { el: a selector or a function giving the element, title, text (the app's own HTML) }; a step whose
  // control isn't on screen at this width is passed over.
  window.jsalTour = (id, steps) => {
    const seen = 'jsal-tour-' + id;
    try { if (localStorage.getItem(seen)) return; } catch (e) {}
    if (document.querySelector('.jsal-tour')) return;
    const ring = document.createElement('div');
    ring.className = 'jsal-tour-ring';
    const box = document.createElement('div');
    box.className = 'jsal-tour';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-labelledby', 'jsal-tour-t');
    box.setAttribute('aria-describedby', 'jsal-tour-d');
    box.tabIndex = -1;
    box.innerHTML = '<div class="jsal-tour-head"><span class="jsal-tour-label">Tour<span class="sr-only"></span></span><button type="button" class="jsal-tour-x" aria-label="Close the tour">×</button></div>'
      + '<p class="jsal-tour-title" id="jsal-tour-t"></p><p class="jsal-tour-text" id="jsal-tour-d"></p>'
      + '<div class="jsal-tour-acts"><span class="jsal-tour-dots" aria-hidden="true">' + steps.map(() => '<i></i>').join('') + '</span>'
      + '<button type="button" class="jsal-btn small">Back</button><button type="button" class="jsal-btn small primary">Next</button></div>';
    const [prev, next] = box.querySelectorAll('.jsal-tour-acts button');
    const shown = (el) => el && el.isConnected && el.getClientRects().length ? el : null;
    const find = (s) => shown(typeof s.el === 'function' ? s.el() : document.querySelector(s.el));
    let at = 0, target = null, frame = 0;
    // Beside the control where there's room (right, then left), otherwise under it with the point above the control.
    // Moving to the next step, the box and ring glide there so the eye follows; where the box changes side of its
    // control, gliding across would cross the page, so it fades in at its new place instead.
    let glideEnd = 0;
    const place = (move) => {
      frame = 0;
      if (!shown(target)) return end();
      const r = target.getBoundingClientRect(), vw = document.documentElement.clientWidth, w = Math.min(320, vw - 32);
      let side = 'below', left = Math.max(16, Math.min(r.left, vw - 16 - w)), top = r.bottom + 14;
      if (vw - r.right >= w + 40) { side = 'right'; left = r.right + 16; top = r.top; }
      else if (r.left >= w + 40) { side = 'left'; left = r.left - 16 - w; top = r.top; }
      if (move === true) {
        const same = box.dataset.side === side;
        ring.classList.add('jsal-tour-glide');
        box.classList.toggle('jsal-tour-glide', same);
        if (!same) { box.style.animation = 'none'; void box.offsetWidth; box.style.animation = ''; }
        clearTimeout(glideEnd);
        glideEnd = setTimeout(() => { ring.classList.remove('jsal-tour-glide'); box.classList.remove('jsal-tour-glide'); }, 400);
      }
      Object.assign(ring.style, { left: r.left + scrollX - 4 + 'px', top: r.top + scrollY - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px' });
      box.dataset.side = side;
      box.style.width = w + 'px';
      box.style.setProperty('--jsal-tour-ax', Math.max(16, Math.min(r.left + 20 - left, w - 32)) + 'px');
      box.style.left = left + scrollX + 'px';
      box.style.top = top + scrollY + 'px';
    };
    const later = () => { if (!frame) frame = requestAnimationFrame(place); };
    const ro = new ResizeObserver(later);
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); end('closed'); } };
    const show = (i) => {
      const dir = i < at ? -1 : 1;
      while (i >= 0 && i < steps.length && !find(steps[i])) i += dir;
      if (i < 0 || i >= steps.length) return end();
      at = i;
      target = find(steps[i]);
      box.querySelector('.jsal-tour-title').textContent = steps[i].title;
      box.querySelector('.jsal-tour-text').innerHTML = steps[i].text;
      box.querySelector('.jsal-tour-label .sr-only').textContent = `, step ${i + 1} of ${steps.length}`;
      [...box.querySelectorAll('.jsal-tour-dots i')].forEach((d, n) => d.classList.toggle('on', n === i));
      prev.disabled = !steps.slice(0, i).some(find);
      next.textContent = steps.slice(i + 1).some(find) ? 'Next' : 'Done';
      // Off screen, or too close to the bottom for the box under it: brought into view first
      const r = target.getBoundingClientRect();
      if (r.top < 64 || r.bottom > innerHeight - 200) target.scrollIntoView({ block: r.height > innerHeight / 2 ? 'start' : 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      place(box.isConnected && !!box.dataset.side);
      box.focus({ preventScroll: true });
    };
    // Ends once, however it ends: Done, × or Esc ("closed"), or its control gone from the page ("gone", such as
    // after Clear). Analytics hears which, the tool and the step it ended on, nothing else.
    let over = false;
    function end(how = 'gone') {
      if (over) return;
      over = true;
      cancelAnimationFrame(frame);
      track('tour_end', { tour: id, step: at + 1, how });
      try { localStorage.setItem(seen, '1'); } catch (e) {}
      const was = target;
      target = null;
      ring.remove(); box.remove(); ro.disconnect();
      removeEventListener('resize', later);
      removeEventListener('scroll', later, true);
      removeEventListener('keydown', key, true);
      if (shown(was) && was.matches('a[href], button, input, select, textarea, [tabindex]')) was.focus({ preventScroll: true });
    }
    prev.addEventListener('click', () => show(at - 1));
    next.addEventListener('click', () => (next.textContent === 'Done' ? end('done') : show(at + 1)));
    box.querySelector('.jsal-tour-x').addEventListener('click', () => end('closed'));
    addEventListener('resize', later);
    addEventListener('scroll', later, true);
    addEventListener('keydown', key, true);
    document.body.append(ring, box);
    ro.observe(document.body);
    show(0);
  };
  addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('[data-track]');
    if (!t) return;
    const params = {};
    for (const [k, v] of Object.entries(t.dataset)) {
      if (k.startsWith('track') && k !== 'track') params[k.slice(5).replace(/^./, (c) => c.toLowerCase()).replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = v;
    }
    track(t.dataset.track, params);
  });
  // Analytics choice. Each page's head sets Consent Mode (off by default in the EU, EEA, UK and Switzerland); visitors
  // in a European time zone get this card to allow or decline, and a [data-jsal-consent] button brings it back for
  // anyone. The choice is kept in this browser; Google's script is only fetched where analytics may run (loadGA).
  const CONSENT = 'jsal-analytics';
  const saved = () => { try { return localStorage.getItem(CONSENT); } catch (e) { return null; } };
  const europe = (() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      return tz.startsWith('Europe/') || ['Atlantic/Reykjavik', 'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores', 'Atlantic/Faroe', 'Arctic/Longyearbyen'].includes(tz);
    } catch (e) { return false; }
  })();
  let card = null, opener = null;
  // Opened from a button, the card sits just above it (below, if there's no room), on the button's side of the
  // screen, and scrolls with the page; on its own (the first visit) it's fixed in the bottom-left corner
  const placeCard = () => {
    if (!card || !opener) return;
    const r = opener.getBoundingClientRect(), w = card.offsetWidth, h = card.offsetHeight, vw = document.documentElement.clientWidth;
    let x = r.left + r.width / 2 > vw / 2 ? r.right - w : r.left;
    x = Math.max(16, Math.min(x, vw - 16 - w));
    const y = r.top - h - 8 >= 8 ? r.top - h - 8 : r.bottom + 8;
    card.style.left = `${Math.round(x + scrollX)}px`;
    card.style.top = `${Math.round(y + scrollY)}px`;
  };
  const closeCard = () => {
    card.remove();
    card = null;
    document.documentElement.style.removeProperty('--jsal-consent-lift');
    removeEventListener('resize', placeCard);
    if (opener && opener.isConnected) opener.focus();
    opener = null;
  };
  const consentCard = (from) => {
    if (typeof window.gtag !== 'function') return;
    if (card) {
      if (from && from !== opener) { opener = from; card.classList.add('jsal-consent-near'); document.documentElement.style.removeProperty('--jsal-consent-lift'); placeCard(); addEventListener('resize', placeCard); }
      if (from) card.querySelector('button').focus();
      return;
    }
    opener = from || null;
    card = document.createElement('section');
    card.className = 'jsal-consent';
    card.setAttribute('aria-label', 'Analytics choice');
    card.innerHTML = '<p><b>Can I count your visit?</b> Basic usage stats (Google Analytics, no ads or profiles) show me which tools get used. '
      + 'Your files never leave your browser either way. <a href="/privacy/">Privacy</a></p><div><button type="button" class="jsal-btn primary jsal-consent-yes">Allow</button>'
      + '<button type="button" class="jsal-btn">No thanks</button></div>';
    card.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const v = b.classList.contains('jsal-consent-yes') ? 'granted' : 'denied';
      try { localStorage.setItem(CONSENT, v); } catch (e) {}
      window.gtag('consent', 'update', { analytics_storage: v });
      if (v === 'granted') loadGA();
      // Declining also removes any GA cookies already set (_ga, _ga_<id>), on this host and on .jsal.io
      if (v === 'denied') {
        document.cookie.split(';').map((c) => c.trim().split('=')[0]).filter((n) => n === '_ga' || n.startsWith('_ga_')).forEach((n) => {
          [location.hostname, `.${location.hostname.replace(/^www\./, '')}`].forEach((d) => { document.cookie = `${n}=; Max-Age=0; path=/; domain=${d}`; });
          document.cookie = `${n}=; Max-Age=0; path=/`;
        });
      }
      closeCard();
    }));
    // Escape puts it away without choosing, back to the button that opened it
    card.addEventListener('keydown', (e) => { if (e.key === 'Escape' && opener) { e.preventDefault(); closeCard(); } });
    document.body.append(card);
    if (opener) {
      card.classList.add('jsal-consent-near');
      placeCard();
      addEventListener('resize', placeCard);
      card.querySelector('button').focus();
    } else {
      // Achievement pop-ups (bottom centre) sit above the card while it's open
      document.documentElement.style.setProperty('--jsal-consent-lift', `${card.offsetHeight + 12}px`);
    }
  };
  // Google's script: with a saved "granted", or outside Europe unless declined; in Europe after Allow. Fetched once idle.
  // Only on the live site: a copy served anywhere else (a local preview, the checks) never counts as a visit
  const live = /(^|\.)jsal\.io$/.test(location.hostname);
  let gaLoaded = false;
  function loadGA() {
    const c = saved();
    if (gaLoaded || !live || typeof window.gtag !== 'function' || !(c === 'granted' || (!europe && c !== 'denied'))) return;
    gaLoaded = true;
    const fetchIt = () => (window.requestIdleCallback || setTimeout)(() => {
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=G-Z0BSTC9TT9';
      document.head.append(s);
    }, { timeout: 2000 });
    if (document.readyState === 'complete') fetchIt(); else addEventListener('load', fetchIt, { once: true });
  }
  const askConsent = () => { if (europe && !saved()) consentCard(); loadGA(); };
  const whenReady = (fn) => (document.body ? fn() : addEventListener('DOMContentLoaded', fn, { once: true }));
  if (document.prerendering) document.addEventListener('prerenderingchange', () => whenReady(askConsent), { once: true });
  else whenReady(askConsent);
  addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-jsal-consent]'); if (b) consentCard(b); });
  if (matchMedia('(pointer: coarse)').matches) {
    for (const el of document.querySelectorAll('[data-touch]')) {
      if (el.dataset.touch) el.textContent = el.dataset.touch;
      else el.remove();
    }
  }
  // Each app's icon is a small line drawing of what it does on its 32-unit grid: round-ended lines (.l), a solid shape
  // where one is needed (.f) and the gold gem (.g) used once, on a tile in the tool's colour (--jsal-tool-*). Home is
  // the logo's own tile, and Off the clock a loot bag holding the gem, on /play/'s green.
  const APPS = [   // the homepage's order: CMS Picker first, the team's Playbook last
    { href: '/cms-picker/', name: 'CMS Picker', tile: 'var(--jsal-tool-cms)',
      icon: '<path class="l" d="M9.21 23.35Q7.95 23.35 7.95 22.09L7.95 17.96Q7.95 16.7 9.21 16.7L11.59 16.7Q12.85 16.7 12.85 15.44L12.85 14.46Q12.85 13.2 14.11 13.2L17.89 13.2Q19.15 13.2 19.15 14.46L19.15 17.89Q19.15 19.15 20.41 19.15L22.79 19.15Q24.05 19.15 24.05 20.41L24.05 22.09Q24.05 23.35 22.79 23.35zM12.85 16.7v6.65M19.15 19.15v4.2" stroke-width="2.2"/><path class="g" d="M16 6.9l2.1 2.1-2.1 2.1-2.1-2.1z"/>' },
    { href: '/formatter/', name: 'Clean Paste', tile: 'var(--jsal-tool-paste)',
      icon: '<path class="l" d="M12.85 9.7H10.4v13.3h11.2V9.7h-2.45M13.2 15.3h5.6M13.2 19.15h3.5" stroke-width="2.2"/><path class="g" d="M16 7.25l2.1 2.1-2.1 2.1-2.1-2.1z"/>' },
    { href: '/image-resizer/', name: 'Image Resizer', tile: 'var(--jsal-tool-resize)',
      icon: '<path class="l" d="M8.65 10.4h14.7v11.9h-14.7zM8.65 19.5l4.55-4.55 3.5 3.5 2.1-2.1 4.55 4.55" stroke-width="2.2"/><path class="g" d="M20.2 11.73l1.61 1.61-1.61 1.61-1.61-1.61z"/>' },
    { href: '/redirects/', name: 'Redirect Import', tile: 'var(--jsal-tool-redirect)',
      icon: '<path class="l" d="M9.35 8.65H22.65a2.45 2.45 0 0 1 2.45 2.45V20.9a2.45 2.45 0 0 1-2.45 2.45H9.35a2.45 2.45 0 0 1-2.45-2.45V11.1a2.45 2.45 0 0 1 2.45-2.45zM10.75 20.55V18.94C10.75 16.28 12.15 14.95 14.6 14.95H15.3" stroke-width="2.2"/><path class="f" d="M19.36 14.95L15.16 11.87V18.03z"/><path class="g" d="M21.67 13.27l1.68 1.68-1.68 1.68-1.68-1.68z"/>' },
    { href: '/ic/', name: 'Platform Playbook', tag: 'Team', tile: 'var(--jsal-tool-playbook)',
      icon: '<path class="l" d="M16 12.15C13.9 10.75 11.1 10.4 8.65 11.1v10.5c2.45-0.7 5.25-0.35 7.35 1.05 2.1-1.4 4.9-1.75 7.35-1.05V11.1C20.9 10.4 18.1 10.75 16 12.15zM16 12.15v10.5" stroke-width="2.2"/><path class="g" d="M16 6.48l1.82 1.82-1.82 1.82-1.82-1.82z"/>' },
  ];
  const HOME = { href: '/', name: 'jsal.io home', tile: 'var(--jsal-tool-home)', edge: true,
    icon: '<path class="l" d="M20 15V20a4.5 4.5 0 0 1-9 0" stroke-width="4"/><path class="g" d="M20 5l3 3-3 3-3-3z"/>' };
  const PLAY = { href: '/play/', name: 'Off the clock', tile: 'var(--jsal-tool-play)',
    icon: '<path class="l" d="M14.18 12.08 13.34 9.35h5.32l-0.84 2.73M14.18 12.08C10.82 13.48 9 16 9 18.66c0 2.66 2.24 4.13 7 4.13s7-1.47 7-4.13c0-2.66-1.82-5.18-5.18-6.58zM14.04 12.08h3.92" stroke-width="2.2"/><path class="g" d="M16 15.44l2.38 2.38-2.38 2.38-2.38-2.38z"/>' };
  // An app's icon on its tile, or a plain one (home, Off the clock) in the row's ink
  const appIcon = (a) => `<svg viewBox="0 0 32 32" width="${a.tile ? 32 : 22}" height="${a.tile ? 32 : 22}" aria-hidden="true"${a.tile ? ` style="--tile: ${a.tile}${a.edge ? '; --tile-edge: var(--jsal-tool-edge)' : ''}"` : ''}>${a.tile ? '<rect class="t" x=".5" y=".5" width="31" height="31" rx="6.5"/>' : ''}${a.icon}</svg>`;
  // Page transitions (/shell.css): while one plays the page is a picture, so a click straight after arriving did
  // nothing; a press during a transition ends it at once and the click lands on what's under the pointer
  let replay = false;
  // Each page loads this file before its own scripts, so the logo works sooner; a click replayed on the page itself
  // waits for them (DOMContentLoaded), or it would land on a button with nothing listening yet
  let appsReady = document.readyState === 'complete';
  for (const ev of ['DOMContentLoaded', 'load']) addEventListener(ev, () => { appsReady = true; }, { once: true });
  const whenApps = (fn) => { if (appsReady) fn(); else addEventListener('DOMContentLoaded', fn, { once: true }); };
  const quiet = (vt) => { for (const p of [vt.ready, vt.finished, vt.updateCallbackDone]) p.catch(() => {}); };   // a skipped transition rejects them all
  const watch = (vt) => {
    if (!vt) return;
    quiet(vt);
    const press = () => { vt.skipTransition(); replay = true; setTimeout(() => { replay = false; }, 1000); };
    addEventListener('pointerdown', press, { capture: true });
    vt.finished.catch(() => {}).finally(() => removeEventListener('pointerdown', press, { capture: true }));
  };
  // Arriving from another page (Back's direction is set earlier, by the page's first script in <head>)
  addEventListener('pagereveal', (e) => watch(e.viewTransition));
  addEventListener('pageswap', (e) => { if (e.viewTransition) quiet(e.viewTransition); });   // leaving: a click meanwhile aborts it
  watch(document.activeViewTransition);                              // already running when this loaded
  addEventListener('click', (e) => {
    if (!replay) return;
    replay = false;
    // The press landed on the page root (the picture), so the browser sends the click there
    if (e.target !== document.documentElement && e.target !== document.body) return;
    const t = document.elementFromPoint(e.clientX, e.clientY);
    const hit = t && t.closest('a[href], button, summary, label, input, select, textarea, [role="button"], [tabindex]');
    if (hit) { e.preventDefault(); e.stopPropagation(); whenApps(() => hit.click()); }
  }, true);

  const svg = (paths, size = 16) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

  // Achievements: unlocked by using the site, kept in this browser only. An app unlocks one with window.jsalAchieve('id');
  // to add one, add it here and call that where it happens. None on the Playbook.
  const ACH = [
    { id: 'first', name: 'First steps', done: 'Used a tool', todo: 'Use a tool', icon: '<path d="M14 4h5v16h-5"/><path d="M3 12h11M10 8l4 4-4 4"/>' },
    { id: 'explorer', name: 'Explorer', done: 'Used every tool', todo: 'Use every tool', icon: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>' },
    { id: 'night', name: 'Night owl', done: 'Tried dark mode', todo: 'Try dark mode', icon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>' },
    { id: 'pixel', name: 'Pixel pusher', done: 'Resized an image', todo: 'Resize an image', icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 9"/>' },
    { id: 'spotless', name: 'Spotless', done: 'Cleaned a paste', todo: 'Clean a paste', icon: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17v4M17 19h4"/>' },
    { id: 'decision', name: 'Decision made', done: 'Found a CMS fit', todo: 'Find your CMS fit', icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>' },
    { id: 'compare', name: 'Side by side', done: 'Compared platforms', todo: 'Compare platforms', icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/>' },
    { id: 'twocents', name: 'Two cents', done: 'Told the quiz what you’d pick', todo: 'Tell the quiz what you’d pick', icon: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8.5 12 2.5 2.5 4.5-5"/>' },
    { id: 'opinion', name: 'Second opinion', done: 'Checked a platform you had in mind', todo: 'Check a platform you had in mind', icon: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>' },
    { id: 'share', name: 'Word of mouth', done: 'Copied the link to a result', todo: 'Copy the link to a result', icon: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>' },
    { id: 'batch', name: 'Batch job', done: 'Resized 10 images at once', todo: 'Resize 10 images at once', icon: '<rect x="7" y="3" width="14" height="14" rx="2"/><path d="M17 21H5a2 2 0 0 1-2-2V7"/>' },
    { id: 'blocks', name: 'Ready to publish', done: 'Copied WordPress blocks', todo: 'Copy WordPress blocks', icon: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="18" height="8" rx="1.5"/>' },
    { id: 'moved', name: 'Change of address', done: 'Saved a redirect file', todo: 'Copy or download a redirect file', icon: '<path d="M4 19v-8a4 4 0 0 1 4-4h12"/><path d="m16 3 4 4-4 4"/>' },
    { id: 'roadtest', name: 'Road test', done: 'Ran a Live check', todo: 'Run a Live check', icon: '<path d="M3 12h4l3-8 4 16 3-8h4"/>' },
    { id: 'social', name: 'Social butterfly', done: 'Said hi', todo: 'Say hi', icon: '<path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 20.5l1.4-5.1A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01"/>' },
    { id: 'lost', name: 'Lost adventurer', done: 'Found the 404 page', todo: 'Secret', secret: true, icon: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>' },
    { id: 'inspector', name: 'Bag inspector', done: 'Inspected every item', todo: 'Secret', secret: true, icon: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>' },
    { id: 'persistent', name: 'Persistent', done: 'Clicked the logo 10 times', todo: 'Secret', secret: true, icon: '<path d="M6 3l13 7-5.5 1.5L11 17z"/><path d="M14 14l5 5"/>' },
    { id: 'secret', name: 'Up, up, down, down', done: 'Found the secret', todo: 'Secret', secret: true, icon: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10.5v4M5 12.5h4M15.5 12h.01M18 14h.01"/>' },
    { id: 'complete', name: 'Completionist', done: 'Earned every achievement', todo: 'Secret', secret: true, icon: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>' },
  ];
  const TOOLS = ['/image-resizer/', '/formatter/', '/redirects/', '/cms-picker/'];   // "Explorer": the public tools
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const team = location.pathname.startsWith('/ic/');
  const queue = [];
  let toastEl = null, showing = false;
  // Styles in /shell.css (adding a stylesheet as it pops up restyled the page mid-animation); made once, while idle
  function makeToast() {
    if (toastEl || team || !document.body) return;
    toastEl = document.createElement('div');
    toastEl.className = 'jsal-ach';
    toastEl.setAttribute('role', 'status');
    toastEl.dataset.hide = '';
    document.body.append(toastEl);
  }
  function showNext() {
    if (showing || !queue.length) return;
    const a = queue.shift();
    showing = true;
    if (!toastEl) makeToast();
    toastEl.innerHTML = `<span class="medal">${svg(a.icon, 20)}</span><span><small>Achievement unlocked</small><b>${a.name}</b><span class="d">${a.done}</span></span>`;
    requestAnimationFrame(() => requestAnimationFrame(() => delete toastEl.dataset.hide));
    setTimeout(() => {
      toastEl.dataset.hide = '';
      setTimeout(() => { showing = false; showNext(); }, 350);
    }, 4000);
  }
  function unlock(id) {
    const a = ACH.find((x) => x.id === id), got = read('jsal-achievements', {});
    if (!a || got[id] || team) return;
    got[id] = Date.now();
    write('jsal-achievements', got);
    queue.push(a);
    if (document.body) showNext(); else addEventListener('DOMContentLoaded', showNext);
    dispatchEvent(new CustomEvent('jsal-achievement', { detail: id }));
    // "Completionist" (a secret): every other one earned
    if (ACH.every((x) => x.id === 'complete' || got[x.id])) unlock('complete');
  }
  window.jsalAchieve = unlock;
  (window.requestIdleCallback || setTimeout)(makeToast);
  window.jsalAchievements = { list: ACH, got: () => read('jsal-achievements', {}) };
  // Using a tool, not just opening it: "First steps", and "Explorer" once all have been used. Each tool calls
  // window.jsalUsed() at its first real action, so the pop-up never covers a tool someone has only just opened
  const tool = TOOLS.find((t) => location.pathname.startsWith(t));
  window.jsalUsed = () => {
    if (!tool) return;
    const used = new Set(read('jsal-tools-used', []));
    used.add(tool);
    write('jsal-tools-used', [...used]);
    unlock('first');
    if (TOOLS.every((t) => used.has(t))) unlock('explorer');
  };
  // "Lost adventurer": the 404 page marks its body
  if (document.body && document.body.hasAttribute('data-jsal-lost')) {
    if (document.prerendering) document.addEventListener('prerenderingchange', () => unlock('lost'), { once: true }); else unlock('lost');
  }

  // Pages load ahead when a link is hovered (or pressed, on touch), so the click opens them at once. The Chrome family
  // prerenders them; browsers without speculation rules that can prefetch (Brave, Firefox) fetch the page instead, a
  // moment into the hover. Not the Playbook (it signs in as it loads) or the logo (it opens the menu)
  const SPECULATES = !!(window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules'));
  const PREFETCHES = !SPECULATES && document.createElement('link').relList.supports('prefetch');
  const fetched = new Set();
  function fetchAhead(href) {
    if (fetched.has(href)) return;
    fetched.add(href);
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.append(link);
  }
  if (SPECULATES) {
    // Written out as one fixed string: the site's content security policy allows it by its hash
    const rules = document.createElement('script');
    rules.type = 'speculationrules';
    rules.textContent = '{"prerender":[{"eagerness":"moderate","where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":"/ic/*"}},{"not":{"selector_matches":"[data-jsal-nav]"}}]}}]}';
    document.head.append(rules);
  } else if (PREFETCHES) {
    // Another page of this site, the same exclusions as the rules above
    const target = (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.matches('[data-jsal-nav]') || a.target || a.origin !== location.origin || a.pathname.startsWith('/ic/') || a.pathname === location.pathname) return null;
      return a.pathname + a.search;
    };
    let wait = 0;
    document.addEventListener('pointerover', (e) => { clearTimeout(wait); const href = target(e); if (href) wait = setTimeout(() => fetchAhead(href), 150); });
    document.addEventListener('pointerout', () => clearTimeout(wait));
    document.addEventListener('pointerdown', (e) => { const href = target(e); if (href) fetchAhead(href); });
  }
  // The secret: the Konami code, anywhere but in a text field
  const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let step = 0;
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    step = k === CODE[step] ? step + 1 : k === CODE[0] ? 1 : 0;
    if (step === CODE.length) { step = 0; unlock('secret'); }
  });

  // The page's address for the top bar on paper (/shell.css), as jsal.io gives it, so a printout says where it's from;
  // none on the home page, where it would only repeat the name
  const topBar = document.querySelector('.jsal-top'), canon = document.querySelector('link[rel="canonical"]');
  if (topBar && canon && new URL(canon.href).pathname !== '/') topBar.dataset.jsalAddress = canon.href.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Theme button: flips light/dark and remembers it for every app (each page applies it in its <head>, so no flash);
  // apps that draw with theme colours can listen for the "jsal-theme" event
  const themeBtn = document.querySelector('[data-jsal-theme]');
  if (themeBtn) {
    const root = document.documentElement;
    const system = matchMedia('(prefers-color-scheme: dark)');
    const current = () => root.dataset.theme || (system.matches ? 'dark' : 'light');
    // Both icons are in each page's HTML (/shell.css shows the right one); only the label changes here
    // The browser's own bar takes the page colour: each page's head names one per system theme, and a theme picked
    // here wins over the system's, so both of those tags take its colour until the system decides again
    const bars = [...document.querySelectorAll('meta[name="theme-color"]')];
    bars.forEach((m) => { m.dataset.own = m.content; });
    const paint = () => {
      const label = current() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
      themeBtn.title = label;
      themeBtn.setAttribute('aria-label', label);
      const picked = root.dataset.theme;
      bars.forEach((m) => { m.content = !picked ? m.dataset.own : picked === 'dark' ? '#111318' : '#f5efe2'; });
    };
    themeBtn.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('jsal-theme', next); } catch (e) {}
      paint();
      dispatchEvent(new Event('jsal-theme'));
      if (next === 'dark') unlock('night');
    });
    system.addEventListener('change', () => { if (!root.dataset.theme) { paint(); dispatchEvent(new Event('jsal-theme')); } });
    paint();
  }

  const trigger = document.querySelector('[data-jsal-nav]');
  if (!trigger) { window.jsalNavReady = true; return; }
  const here = location.pathname;

  document.head.insertAdjacentHTML('beforeend', `<style>
    [data-jsal-nav], [data-jsal-nav]:hover { cursor: pointer; text-decoration: none; border-radius: 6px; }
    [data-jsal-nav]:focus-visible { outline: 2px solid var(--jsal-accent, currentColor); outline-offset: 3px; }
    .jsal-menu { position: fixed; z-index: 2147483000; width: min(300px, calc(100vw - 24px)); padding: var(--jsal-space-8); border-radius: 12px;
      background: var(--jsal-surface); color: var(--jsal-ink); border: 1px solid var(--jsal-line); box-shadow: 0 16px 40px rgb(0 0 0 / .28), 0 2px 6px rgb(0 0 0 / .12);
      font: 14px/1.35 var(--jsal-font); overflow-y: auto; overscroll-behavior: contain; }
    .jsal-menu[hidden] { display: none; }
    .jsal-menu a { display: grid; grid-template-columns: 32px minmax(0, 1fr) auto; gap: var(--jsal-space-8); align-items: center; padding: var(--jsal-space-8); border-radius: 8px; color: inherit; text-decoration: none; outline: none; }
    .jsal-menu a:hover, .jsal-menu a:focus-visible { background: var(--jsal-sunk); }
    .jsal-menu a[aria-current="page"] { background: var(--jsal-accent-soft); }
    .jsal-menu .ico { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 8px; background: var(--jsal-sunk); color: var(--jsal-ink-2); }
    .jsal-menu b { display: block; font-weight: 600; }
    .jsal-menu .tag { font-size: 12px; font-weight: 700; color: var(--jsal-muted); border: 1px solid currentColor; border-radius: 99px; padding: 0 var(--jsal-space-8); }
    .jsal-menu hr { border: 0; border-top: 1px solid var(--jsal-line); margin: var(--jsal-space-8) var(--jsal-space-4); }
    .jsal-menu .home { grid-template-columns: 32px minmax(0, 1fr); }
    .jsal-menu .home .ico { background: none; color: var(--jsal-muted); }
    .jsal-menu .ico .l { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
    .jsal-menu .ico .g { fill: currentColor; }
    .jsal-menu .ico .f { fill: currentColor; stroke: currentColor; stroke-width: 1.45; stroke-linejoin: round; }   /* an arrowhead, its points rounded */
    /* jsal-ico-tile, not "tile": the menu sits on every page, and the home page's bento boxes are .tile */
    .jsal-menu .ico.jsal-ico-tile { background: none; color: var(--jsal-tool-ink); }   /* outranks the home rows' muted ink */
    .jsal-menu .jsal-ico-tile .t { fill: var(--tile); stroke: var(--tile-edge, none); }
    .jsal-menu .jsal-ico-tile .g { fill: var(--jsal-tool-gem); }
  </style>`);

  const isHere = (href) => href !== '/' && here.startsWith(href);
  const item = (a, home) => `<a href="${a.href}" role="menuitem"${isHere(a.href) ? ' aria-current="page"' : ''}${home ? ' class="home"' : ''}>
      <span class="ico${a.tile ? ' jsal-ico-tile' : ''}">${appIcon(a)}</span>
      <b>${a.name}</b>
      ${home ? '' : a.tag ? `<span class="tag">${a.tag}</span>` : '<span></span>'}
    </a>`;
  const menu = document.createElement('div');
  menu.className = 'jsal-menu';
  menu.id = 'jsal-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'jsal.io apps');
  menu.hidden = true;
  menu.innerHTML = APPS.map((a) => item(a)).join('') + '<hr>' + item(HOME, true) + item(PLAY, true);
  document.body.append(menu);

  if (!trigger.querySelector('.jsal-caret')) trigger.insertAdjacentHTML('beforeend', `<span class="jsal-caret">${svg('<path d="m6 9 6 6 6-6"/>', 12)}</span>`);
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'jsal-menu');
  trigger.removeAttribute('aria-hidden');
  if (!trigger.getAttribute('aria-label')) trigger.setAttribute('aria-label', 'jsal.io apps');

  function place() {
    const r = trigger.getBoundingClientRect();
    const w = menu.offsetWidth;
    menu.style.top = `${Math.round(r.bottom + 8)}px`;
    menu.style.maxHeight = `${Math.max(160, innerHeight - Math.round(r.bottom + 8) - 12)}px`;   // short screens: it scrolls rather than running off the bottom
    menu.style.left = `${Math.round(Math.max(12, Math.min(r.left, innerWidth - w - 12)))}px`;
  }
  const links = () => [...menu.querySelectorAll('a')];
  // Opening the menu loads the pages it lists ahead (prerendered in the Chrome family, fetched in Brave and Firefox),
  // so picking one swaps at once. Not the Playbook
  let warmed = false;
  function warm() {
    if (warmed || !(SPECULATES || PREFETCHES)) return;
    warmed = true;
    if (!SPECULATES) return [...APPS.map((a) => a.href), HOME.href, PLAY.href].filter((h) => h !== '/ic/' && h !== here && !isHere(h)).forEach(fetchAhead);
    // Every link in the menu but this page's and the Playbook's, as one fixed string (allowed by its hash, as above)
    const rules = document.createElement('script');
    rules.type = 'speculationrules';
    rules.textContent = '{"prerender":[{"eagerness":"immediate","where":{"and":[{"selector_matches":".jsal-menu a"},{"not":{"selector_matches":"[aria-current]"}},{"not":{"href_matches":"/ic/*"}}]}}]}';
    document.head.append(rules);
  }
  function open(focusFirst) {
    menu.hidden = false;
    place();
    warm();
    trigger.setAttribute('aria-expanded', 'true');
    if (focusFirst) (menu.querySelector('[aria-current]') || links()[0]).focus();
  }
  function close(refocus) {
    if (menu.hidden) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (refocus) trigger.focus();
  }

  // "Persistent": ten clicks on the logo in a row (each within 1.5 seconds of the last)
  let clicks = 0, lastClick = 0;
  trigger.addEventListener('click', (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;   // new tab: let the link work
    e.preventDefault();
    menu.hidden ? open(e.detail === 0) : close();
    clicks = Date.now() - lastClick < 1500 ? clicks + 1 : 1;
    lastClick = Date.now();
    if (clicks >= 10) unlock('persistent');
  });
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || ((e.key === 'Enter' || e.key === ' ') && trigger.tagName !== 'A')) { e.preventDefault(); open(true); }
  });
  menu.addEventListener('keydown', (e) => {
    const l = links(), i = l.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); l[(i + 1) % l.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); l[(i - 1 + l.length) % l.length].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); l[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); l[l.length - 1].focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); close(true); }
    else if (e.key === 'Tab') close();
  });
  // Esc also works after a mouse click, when focus is still on the logo
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden && !menu.contains(e.target)) close(true); });
  // Not for a press that lands on a page transition's picture (replay is set): that click is about to be replayed on
  // whatever is under it, which may be the menu
  document.addEventListener('pointerdown', (e) => { if (!replay && !menu.hidden && !menu.contains(e.target) && !trigger.contains(e.target)) close(); });
  addEventListener('resize', () => { if (!menu.hidden) place(); });
  addEventListener('scroll', () => { if (!menu.hidden) place(); }, { passive: true });

  // Quick clicks while pages change hands used to be lost (or the logo, still a plain link, went home). Before this
  // file runs, the one-line script in each page's <head> holds the click; after an app was picked but before the new
  // page took over, the old page holds it in sessionStorage. The new page replays them here, in order (the logo opens
  // the menu, anything else is clicked) with the transition cut short; a prerendered page looks again when shown.
  // From the first click on the page itself, the rest wait for the app's scripts (whenApps).
  const KEY = 'jsal-early-clicks';
  let leaving = false;
  const heldHere = [];
  // Only a plain click leaves: Ctrl, ⌘ or Shift opens the app in a new tab or window and this page stays in use
  menu.addEventListener('click', (e) => { if (e.target.closest('a[href]') && e.button === 0 && !(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)) leaving = true; });
  addEventListener('click', (e) => {
    if (!leaving) return;
    const l = e.target.closest && e.target.closest('[data-jsal-nav]');
    if (!l && !heldHere.length && e.target !== document.documentElement && e.target !== document.body) return;
    e.preventDefault(); e.stopPropagation();
    heldHere.push({ x: e.clientX, y: e.clientY, logo: !!l, at: Date.now() });
    // Both stores: a page loaded ahead keeps the session storage it started with, but reads local storage live
    try { sessionStorage.setItem(KEY, JSON.stringify(heldHere)); localStorage.setItem(KEY, JSON.stringify(heldHere)); } catch (err) {}
  }, true);
  // Back from the browser's cache: the page returns as it was when a menu item was picked, still holding clicks and
  // with the menu open. Start afresh.
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    leaving = false;
    heldHere.length = 0;
    try { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); } catch (err) {}
    close();
  });
  function replayEarly() {
    let early = window.jsalEarlyClicks || [];
    delete window.jsalEarlyClicks;
    try {
      const held = sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
      if (!early.length && held) early = JSON.parse(held);
      sessionStorage.removeItem(KEY); localStorage.removeItem(KEY);
    } catch (err) {}
    early = early.filter((c) => Date.now() - c.at < 3000);
    if (!early.length) return;
    const vt = document.activeViewTransition;
    if (vt) { quiet(vt); vt.skipTransition(); }
    const play = (c) => {
      if (c.logo) { menu.hidden ? open(false) : close(); return; }
      const t = document.elementFromPoint(c.x, c.y);
      const hit = t && t.closest('a[href], button, summary, label, input, select, textarea, [role="button"], [tabindex]');
      if (hit) hit.click();
    };
    const onPage = early.findIndex((c) => !c.logo);
    early.slice(0, onPage < 0 ? early.length : onPage).forEach(play);
    if (onPage < 0) return;
    whenApps(() => early.slice(onPage).forEach(play));
  }
  window.jsalNavReady = true;
  if (document.prerendering) document.addEventListener('prerenderingchange', replayEarly, { once: true }); else replayEarly();

  // The name's width rounded up to a whole pixel, so the caret after it sits on one: a page change draws the logo as a
  // still with its parts on whole pixels, and a caret on a fraction of one nudged sideways while it showed
  (() => {
    const name = document.querySelector('[data-jsal-nav] .jsal-name');
    if (!name) return;
    const fit = () => { name.style.width = ''; name.style.width = Math.ceil(name.getBoundingClientRect().width) + 'px'; };
    fit();
    if (document.fonts) document.fonts.ready.then(fit);
  })();

  // The logo on the first page of a visit: it opens as the tab icon's mark, the short j with the deep hook wearing the
  // gem as its dot (folded by the head script before the first paint). The j's curve shortens into the name's j as its
  // stem rises into the gem; the stem's top pinches off as the j's own dot and knocks the gem over the name to land as
  // the full stop, with "sal" showing in its wake, while the dot overshoots its place and settles. "io" slides out of
  // the landed gem, which ends it. Once per visit; a page loaded ahead shows the
  // name as it is.
  (() => {
    const root = document.documentElement;
    const unfold = () => root.classList.remove('jsal-intro');
    const logo = document.querySelector('[data-jsal-nav]');
    const part = (c) => logo && logo.querySelector('.jsal-' + c);
    const [j, sal, stop, io, caret] = ['j', 'sal', 'stop', 'io', 'caret'].map(part);
    const [fold, dot] = ['fold', 'dot'].map((c) => j && j.querySelector('.jsal-j-' + c));
    if (!root.classList.contains('jsal-intro') || document.prerendering || !(j && sal && stop && io && fold && dot)) return unfold();
    try { sessionStorage.setItem('jsal-intro', '1'); } catch (e) {}
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (t) => Math.max(0, Math.min(1, t));
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2);
    const out = (t) => 1 - (1 - t) ** 3;
    const play = () => {
      if (!root.classList.contains('jsal-intro')) return;
      const em = parseFloat(getComputedStyle(logo).fontSize);
      // The gem is moved from where it sits unfolded: its centre is 0.24em after the end of "sal" (the stop's 0.07em
      // margin and half its 0.34em width) and 0.17em above the baseline, measured to the sub-pixel from boxes the fold
      // doesn't move. Folded, it sits on the short j as its dot, 0.1355em into the j's box and 0.559em above the
      // baseline, at 0.657 of its size, as the stylesheet folds it.
      const salBox = sal.getBoundingClientRect(), home = salBox.right + 0.24 * em;
      const jLeft = j.getBoundingClientRect().left, x0 = jLeft + 0.1355 * em - home, y0 = -0.389 * em;
      // The arrow starts 6px after the folded mark (whose gem ends 0.2475em into the j's box), as it sits 6px after "io"
      // (its place is measured from the end of "io", which the fold doesn't move; its margin travels with it)
      const caretFrom = caret ? io.getBoundingClientRect().right - (jLeft + 0.2475 * em) : 0;
      // The j is reshaped in its own drawing (the top bar's inline SVG, in thousandths of an em): its short path goes
      // from the icon's j (a half-circle hook) to the name's j (taller, its hook turning a third past the quarter), round
      // ends throughout. Its last frame is the name's path exactly, which then shows in its place.
      const n = (v) => Math.round(v * 100) / 100;
      const quad = (a, c, b, f) => (1 - f) ** 2 * a + 2 * (1 - f) * f * c + f * f * b;
      const foldD = fold.getAttribute('d'), foldW = fold.getAttribute('stroke-width');
      const dotY = dot.getAttribute('cy'), dotR = dot.getAttribute('r');
      const shape = (m, top) => {
        const x = 585.5, r = lerp(167.6, 100, m), y = lerp(638, 780, m), th = lerp(Math.PI, (2 * Math.PI) / 3, m);
        const w = lerp(149, 147, m), ex = x - r + r * Math.cos(th), ey = y + r * Math.sin(th);
        fold.setAttribute('d', `M${x} ${n(top)}V${n(y)}A${n(r)} ${n(r)} 0 0 1 ${n(ex)} ${n(ey)}`);
        fold.setAttribute('stroke-width', n(w));
      };
      // The stem's top meets the gem's lowest point at 376.5 (its round end reaching 303). Once it pinches off, the dot
      // shoots up past its place (57.5) to -62.5, drops a little below it to 87.5, close enough to the stem to stay
      // clear of it at 150% scaling, and rises back; a neck joins it to the stem for a moment as it pinches
      const HIT = 520;
      const shot = (tau) => {
        if (tau < 280) return lerp(376.5, -62.5, 1 - (1 - tau / 280) ** 2);
        if (tau < 460) return lerp(-62.5, 87.5, ease((tau - 280) / 180));
        return lerp(87.5, 57.5, out(clamp((tau - 460) / 200)));
      };
      const neck = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      neck.style.display = 'none';
      fold.after(neck);
      // "io" slides out from behind the gem's right point, measured from where it sits
      const ioLeft = io.getBoundingClientRect().left;
      logo.classList.add('jsal-unfolding');
      // t in ms: 300 still; the j's curve reshapes (300-900) while its stem rises, speeding up (360-520), until its top
      // touches the gem. The top pinches off as the dot (520), which flies up and back down into place (by 1180) and
      // throws the gem over the name on a spinning arc (520-1120) to land with a small swell (1120-1280); "io" slides
      // out of it (1110-1320). The arrow slides out meanwhile (480-1000).
      const draw = (t) => {
        const tau = t - HIT;
        let top = 452 - 75.5 * clamp((t - (HIT - 160)) / 160) ** 2;
        if (tau < 0) dot.style.opacity = 0;
        else {
          const y = shot(tau), w = 147 * (1 - clamp(tau / 110)) ** 1.5;
          top = lerp(376.5, 277.5, out(clamp(tau / 300)));
          dot.style.opacity = 1;
          dot.setAttribute('cy', n(y));
          dot.setAttribute('r', n(lerp(73.5, 77, out(clamp(tau / 200)))));
          neck.style.display = w > 1 ? '' : 'none';
          neck.setAttribute('d', `M585.5 ${n(y)}V${n(top)}`);
          neck.setAttribute('stroke-width', n(w));
        }
        shape(ease(clamp((t - 300) / 600)), top);
        // the gem's arc: from its place on the j, steeply up and high over "sal"
        const f = clamp(tau / 600);
        const gx = quad(x0, 0.7 * x0, 0, f), gy = quad(y0, -1.5 * em, 0, f);
        const scale = lerp(0.657, 1, f) * (1 + 0.12 * Math.sin(Math.PI * clamp(tau / 90)))
          * (1 + 0.1 * Math.sin(Math.PI * clamp((tau - 600) / 160)));
        stop.style.transform = `translate(${gx}px, ${gy}px) rotate(${180 * f}deg) scale(${scale})`;
        // "sal" shows just behind the gem through a soft edge (none once it lands), so no letter slips out ahead of it
        const edge = home + gx - 0.6 * 0.17 * em * scale - salBox.left, soft = 0.35 * em * (1 - f);
        sal.style.webkitMaskImage = sal.style.maskImage = `linear-gradient(90deg, black ${edge - soft}px, transparent ${edge}px)`;
        const o = out(clamp((t - 1110) / 210)), dx = -(1 - o) * 0.55 * em, cut = home + gx + 0.17 * em * scale - (ioLeft + dx);
        io.style.opacity = t < 1110 ? 0 : 1;
        io.style.transform = `translateX(${dx}px)`;
        io.style.webkitMaskImage = io.style.maskImage = `linear-gradient(90deg, transparent ${cut}px, black ${cut + 0.04 * em}px)`;
        // the arrow slides out ahead of the name, reaching its place before "io" comes out behind it, still turned over
        // if the menu was opened meanwhile
        const c = ease(clamp((t - 480) / 520));
        if (caret) caret.style.transform = `translateX(${-(1 - c) * caretFrom}px)` + (logo.getAttribute('aria-expanded') === 'true' ? ' rotate(180deg)' : '');
      };
      draw(0);
      unfold();
      const start = performance.now();
      const step = (now) => {
        const t = now - start;
        draw(Math.min(t, 1320));
        if (t < 1320) return requestAnimationFrame(step);
        // Settle: the name's own path takes over from the reshaped one (the same shape), the short path goes back to
        // the fold, and the inline styles go; "sal"'s mask is left fully open as drawn, so no pixel changes
        stop.style.transform = io.style.transform = io.style.opacity = dot.style.opacity = '';
        io.style.webkitMaskImage = io.style.maskImage = '';
        if (caret) caret.style.transform = '';
        logo.classList.remove('jsal-unfolding');
        fold.setAttribute('d', foldD); fold.setAttribute('stroke-width', foldW);
        dot.setAttribute('cy', dotY); dot.setAttribute('r', dotR);
        neck.remove();
      };
      requestAnimationFrame(step);
    };
    document.fonts.ready.then(play, play);
  })();
})();
