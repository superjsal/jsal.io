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
  let card = null;
  const consentCard = () => {
    if (card || typeof window.gtag !== 'function') return;
    card = document.createElement('section');
    card.className = 'jsal-consent';
    card.setAttribute('aria-label', 'Analytics choice');
    card.innerHTML = '<p><b>Can I count your visit?</b> Basic usage stats (Google Analytics, no ads or profiles) show me which tools get used. '
      + 'Your files never leave your browser either way. <a href="/privacy/">Privacy</a></p><div><button type="button" class="jsal-consent-yes">Allow</button>'
      + '<button type="button">No thanks</button></div>';
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
      card.remove();
      card = null;
      document.documentElement.style.removeProperty('--jsal-consent-lift');
    }));
    document.body.append(card);
    // Achievement pop-ups (bottom centre) sit above the card while it's open
    document.documentElement.style.setProperty('--jsal-consent-lift', `${card.offsetHeight + 12}px`);
  };
  // Google's script: with a saved "granted", or outside Europe unless declined; in Europe after Allow. Fetched once idle
  let gaLoaded = false;
  function loadGA() {
    const c = saved();
    if (gaLoaded || typeof window.gtag !== 'function' || !(c === 'granted' || (!europe && c !== 'denied'))) return;
    gaLoaded = true;
    const fetchIt = () => (window.requestIdleCallback || setTimeout)(() => {
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=G-ND4L6CSD8S';
      document.head.append(s);
    }, { timeout: 2000 });
    if (document.readyState === 'complete') fetchIt(); else addEventListener('load', fetchIt, { once: true });
  }
  const askConsent = () => { if (europe && !saved()) consentCard(); loadGA(); };
  const whenReady = (fn) => (document.body ? fn() : addEventListener('DOMContentLoaded', fn, { once: true }));
  if (document.prerendering) document.addEventListener('prerenderingchange', () => whenReady(askConsent), { once: true });
  else whenReady(askConsent);
  addEventListener('click', (e) => { if (e.target.closest && e.target.closest('[data-jsal-consent]')) consentCard(); });
  if (matchMedia('(pointer: coarse)').matches) {
    for (const el of document.querySelectorAll('[data-touch]')) {
      if (el.dataset.touch) el.textContent = el.dataset.touch;
      else el.remove();
    }
  }
  const APPS = [   // the homepage's order: CMS Picker first, the team's Playbook last
    // Descriptions stay under about 35 characters, so they fit on one line on a phone
    { href: '/cms-picker/', name: 'CMS Picker', desc: 'Find the CMS that fits, and its SEO',
      icon: '<path d="M3 5h18v14H3z"/><path d="M3 10h18M9 5v14"/>' },
    { href: '/formatter/', name: 'Clean Paste', desc: 'Clean up Word and Google Docs text',
      icon: '<path d="M4 6h16M4 12h10M4 18h13"/>' },
    { href: '/image-resizer/', name: 'Image Resizer', desc: 'Resize, crop and convert images',
      icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 9"/>' },
    { href: '/ic/', name: 'Platform Playbook', desc: 'SEO steps by platform, for my team', tag: 'Team',
      icon: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>' },
  ];
  const HOME = { href: '/', name: 'jsal.io home', icon: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>' };
  const PLAY = { href: '/play/', name: 'Off the clock', icon: '<path d="M6 11h4M8 9v4"/><circle cx="15.5" cy="10.5" r=".8"/><circle cx="17.5" cy="13" r=".8"/><path d="M7 5h10a5 5 0 0 1 4.6 7l-1.4 3.6a2.6 2.6 0 0 1-4.6.6L14 14h-4l-1.6 2.2a2.6 2.6 0 0 1-4.6-.6L2.4 12A5 5 0 0 1 7 5z"/>' };
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
  addEventListener('pagereveal', (e) => {   // arriving from another page
    // Browser back slides the other way (/shell.css): the attribute must be on before the transition's first frame
    const a = window.navigation && navigation.activation;
    if (e.viewTransition && a && a.navigationType === 'traverse' && a.from && a.entry.index < a.from.index) {
      document.documentElement.dataset.jsalBack = '';
      e.viewTransition.finished.catch(() => {}).finally(() => { delete document.documentElement.dataset.jsalBack; });
    }
    watch(e.viewTransition);
  });
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
    { id: 'social', name: 'Social butterfly', done: 'Said hi', todo: 'Say hi', icon: '<path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 20.5l1.4-5.1A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01"/>' },
    { id: 'lost', name: 'Lost adventurer', done: 'Found the 404 page', todo: 'Secret', secret: true, icon: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>' },
    { id: 'inspector', name: 'Bag inspector', done: 'Inspected every item', todo: 'Secret', secret: true, icon: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>' },
    { id: 'persistent', name: 'Persistent', done: 'Clicked the logo 10 times', todo: 'Secret', secret: true, icon: '<path d="M6 3l13 7-5.5 1.5L11 17z"/><path d="M14 14l5 5"/>' },
    { id: 'secret', name: 'Up, up, down, down', done: 'Found the secret', todo: 'Secret', secret: true, icon: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10.5v4M5 12.5h4M15.5 12h.01M18 14h.01"/>' },
  ];
  const TOOLS = ['/image-resizer/', '/formatter/', '/cms-picker/'];   // "Explorer": the public tools
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

  // Pages load ahead when a link is hovered (or pressed, on touch), so the click opens them at once (Chrome family;
  // others ignore it). Not the Playbook (it signs in as it loads) or the logo (it opens the menu)
  if (window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
    const rules = document.createElement('script');
    rules.type = 'speculationrules';
    rules.textContent = JSON.stringify({ prerender: [{ eagerness: 'moderate', where: { and: [
      { href_matches: '/*' }, { not: { href_matches: '/ic/*' } }, { not: { selector_matches: '[data-jsal-nav]' } },
    ] } }] });
    document.head.append(rules);
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
    .jsal-menu { position: fixed; z-index: 2147483000; width: min(300px, calc(100vw - 24px)); padding: 6px; border-radius: 12px;
      background: var(--jsal-surface); color: var(--jsal-ink); border: 1px solid var(--jsal-line); box-shadow: 0 16px 40px rgb(0 0 0 / .28), 0 2px 6px rgb(0 0 0 / .12);
      font: 14px/1.35 var(--jsal-font); }
    .jsal-menu[hidden] { display: none; }
    .jsal-menu a { display: grid; grid-template-columns: 32px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 7px 8px; border-radius: 8px; color: inherit; text-decoration: none; outline: none; }
    .jsal-menu a:hover, .jsal-menu a:focus-visible { background: var(--jsal-sunk); }
    .jsal-menu a[aria-current="page"] { background: var(--jsal-accent-soft); }
    .jsal-menu .ico { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 8px; background: var(--jsal-sunk); color: var(--jsal-ink-2); }
    .jsal-menu b { display: block; font-weight: 600; }
    .jsal-menu small { display: block; font-size: 12px; line-height: 1.35; color: var(--jsal-muted); text-wrap: pretty; }   /* wraps rather than cutting off beside a tag on a phone */
    .jsal-menu .tag { font-size: 11px; font-weight: 700; color: var(--jsal-muted); border: 1px solid currentColor; border-radius: 99px; padding: 0 7px; }
    .jsal-menu .here { font-size: 11px; color: var(--jsal-muted); }
    .jsal-menu hr { border: 0; border-top: 1px solid var(--jsal-line); margin: 6px 4px; }
    .jsal-menu .home { grid-template-columns: 32px minmax(0, 1fr); }
    .jsal-menu .home .ico { background: none; color: var(--jsal-muted); }
  </style>`);

  const isHere = (href) => href !== '/' && here.startsWith(href);
  const item = (a, home) => `<a href="${a.href}" role="menuitem"${isHere(a.href) ? ' aria-current="page"' : ''}${home ? ' class="home"' : ''}>
      <span class="ico">${svg(a.icon)}</span>
      <span><b>${a.name}</b>${a.desc ? `<small>${a.desc}</small>` : ''}</span>
      ${home ? '' : isHere(a.href) ? '<span class="here">You’re here</span>' : a.tag ? `<span class="tag">${a.tag}</span>` : '<span></span>'}
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
    menu.style.left = `${Math.round(Math.max(12, Math.min(r.left, innerWidth - w - 12)))}px`;
  }
  const links = () => [...menu.querySelectorAll('a')];
  // Opening the menu loads the pages it lists ahead (Chrome family), so picking one swaps at once. Not the Playbook
  let warmed = false;
  function warm() {
    if (warmed || !(window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules'))) return;
    warmed = true;
    const urls = [...APPS.map((a) => a.href), HOME.href, PLAY.href].filter((h) => h !== '/ic/' && h !== here && !isHere(h));
    const rules = document.createElement('script');
    rules.type = 'speculationrules';
    rules.textContent = JSON.stringify({ prerender: [{ urls, eagerness: 'immediate' }] });
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
  menu.addEventListener('click', (e) => { if (e.target.closest('a[href]')) leaving = true; });
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

  // The logo on the first page of a visit: it opens as the tab icon's mark, the short j with the deep hook wearing the
  // gem as its dot (folded by the head script before the first paint). The gem lifts off and arcs over the name to land
  // as the full stop, with "sal" showing in its wake, while the j's curve shortens into the name's j and its own dot
  // fills in; then "io" fades in and a light runs across the gem and on over "io". Once per visit; a page loaded ahead
  // shows the name as it is.
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
      const foldD = fold.getAttribute('d'), foldW = fold.getAttribute('stroke-width');
      const shape = (m) => {
        const x = 585.5, r = lerp(167.6, 100, m), y = lerp(638, 780, m), th = lerp(Math.PI, (2 * Math.PI) / 3, m);
        const top = lerp(452, 277.5, m), w = lerp(149, 147, m);
        const ex = x - r + r * Math.cos(th), ey = y + r * Math.sin(th);
        fold.setAttribute('d', `M${x} ${n(top)}V${n(y)}A${n(r)} ${n(r)} 0 0 1 ${n(ex)} ${n(ey)}`);
        fold.setAttribute('stroke-width', n(w));
      };
      logo.classList.add('jsal-unfolding');
      // t in ms: 300 still, the gem lifts (300-500), arcs over the name (480-1100) and lands with a small swell
      // (1100-1260); the j reshapes (560-1040) and its dot fills in over the second half of that; the arrow slides
      // out (480-1000) and "io" fades in behind it (1000-1320)
      const draw = (t) => {
        const m = ease(clamp((t - 560) / 480));
        shape(m);
        dot.style.opacity = clamp((m - 0.55) / 0.45);
        const lift = out(clamp((t - 300) / 200)), f = ease(clamp((t - 480) / 620));
        const ax = x0, ay = y0 - 0.09 * em * lift, cx = x0 / 2, cy = -1.08 * em;   // the arc: from above the j, high over "sal"
        const gx = (1 - f) ** 2 * ax + 2 * (1 - f) * f * cx;
        const gy = (1 - f) ** 2 * ay + 2 * (1 - f) * f * cy;
        const scale = lerp(0.657, 1, f) * (1 + 0.1 * Math.sin(Math.PI * clamp((t - 1100) / 160)));
        stop.style.transform = `translate(${gx}px, ${gy}px) rotate(${180 * f}deg) scale(${scale})`;
        // "sal" shows just behind the gem through a soft edge (none once it lands), so no letter slips out ahead of it
        const edge = home + gx - 0.6 * 0.17 * em * scale - salBox.left, soft = 0.35 * em * (1 - f);
        sal.style.webkitMaskImage = sal.style.maskImage = `linear-gradient(90deg, black ${edge - soft}px, transparent ${edge}px)`;
        const o = ease(clamp((t - 1000) / 320));
        io.style.opacity = o;
        io.style.transform = `translateX(${-(1 - o) * 0.12 * em}px)`;
        // the arrow slides out ahead of the name, reaching its place as "io" fades in behind it, still turned over if
        // the menu was opened meanwhile
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
        // the fold, and the inline styles go; "sal"'s mask is left fully open as drawn, so no pixel changes. Then the glint
        stop.style.transform = io.style.transform = io.style.opacity = dot.style.opacity = '';
        if (caret) caret.style.transform = '';
        logo.classList.remove('jsal-unfolding');
        fold.setAttribute('d', foldD); fold.setAttribute('stroke-width', foldW);
        setTimeout(() => logo.classList.add('jsal-glint'), 130);
        setTimeout(() => logo.classList.remove('jsal-glint'), 980);
      };
      requestAnimationFrame(step);
    };
    document.fonts.ready.then(play, play);
  })();
})();
