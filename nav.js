// Shared by every jsal.io app (with /shell.css for the colours):
// - the logo marked data-jsal-nav (a link to jsal.io) becomes a menu for moving between the apps
//   (to add an app, add it to APPS)
// - the button marked data-jsal-theme switches light/dark for all the apps
// - on touch screens, text marked data-touch is swapped for that wording (data-touch="" removes it), so
//   instructions say tap instead of click, drop or a keyboard shortcut; the HTML keeps the desktop wording
// - window.jsalTrack('name', { params }) sends a GA4 event; a link or button can carry data-track="name"
//   with data-track-* params instead (data-track-platform="wix" → platform: "wix")
(() => {
  // Analytics events, on the GA4 tag every public page already has (the team Playbook has none, so
  // nothing is sent there). A page loaded ahead on hover only sends once it's actually shown.
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
  // Analytics choice. Each page's head sets the gtag queue and Consent Mode (off by default in the EU,
  // EEA, UK and Switzerland); visitors whose browser time zone is in Europe get this card to allow or
  // decline, and a [data-jsal-consent] button (the home page footer) brings it back for anyone. The
  // choice is kept in this browser as "granted" or "denied". Basic Consent Mode: Google's script is only
  // fetched where analytics may run (loadGA). No card or script where there's no GA4 tag (the Playbook).
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
  // Google's script: with a saved "granted", or outside Europe unless declined. In Europe it waits for
  // Allow. Fetched once the page is idle (2 s after load at most), so its ~180 KB doesn't compete with it.
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
  // Page transitions (/shell.css): while one plays, the page is a picture the browser can't click
  // into, so a click straight after arriving (on the logo, a link) did nothing. A press during a
  // transition now ends it at once, and the click goes to whatever is under the pointer.
  let replay = false;
  const quiet = (vt) => { for (const p of [vt.ready, vt.finished, vt.updateCallbackDone]) p.catch(() => {}); };   // a skipped transition rejects them all
  const watch = (vt) => {
    if (!vt) return;
    quiet(vt);
    const press = () => { vt.skipTransition(); replay = true; setTimeout(() => { replay = false; }, 1000); };
    addEventListener('pointerdown', press, { capture: true });
    vt.finished.catch(() => {}).finally(() => removeEventListener('pointerdown', press, { capture: true }));
  };
  addEventListener('pagereveal', (e) => watch(e.viewTransition));   // arriving from another page
  addEventListener('pageswap', (e) => { if (e.viewTransition) quiet(e.viewTransition); });   // leaving: a click meanwhile aborts it
  watch(document.activeViewTransition);                              // already running when this loaded
  addEventListener('click', (e) => {
    if (!replay) return;
    replay = false;
    // The press landed on the page root (the picture), so the browser sends the click there
    if (e.target !== document.documentElement && e.target !== document.body) return;
    const t = document.elementFromPoint(e.clientX, e.clientY);
    const hit = t && t.closest('a[href], button, summary, label, input, select, textarea, [role="button"], [tabindex]');
    if (hit) { e.preventDefault(); e.stopPropagation(); hit.click(); }
  }, true);

  const svg = (paths, size = 16) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

  // Achievements: unlocked by using the site, kept only in this browser (localStorage). An app unlocks
  // one with window.jsalAchieve('id'); to add one, add it here and call that where it happens. A pop-up
  // shows on any page; the home page lists them all. None on the team-only Playbook.
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
  // Its styles are in /shell.css (adding a stylesheet at the moment it pops up made the browser
  // restyle the whole page mid-animation), and the box is made once, while the page is idle
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
  // Using a tool, not just opening it: "First steps", and "Explorer" once all of them have been used. Each
  // tool calls window.jsalUsed() at its first real action (a paste, images loaded, a quiz answer…), so the
  // pop-up comes after something was done and never over a tool someone has only just opened. Kept under
  // its own key: the visits counted before this don't count as use.
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

  // Pages load ahead when a link is hovered (or pressed, on touch screens), so the click opens them
  // straight away, even on a first visit with nothing cached. Chrome, Edge and Brave; others ignore it.
  // Not the team Playbook (it signs in as it loads) or the logo (it opens the menu, not a page).
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

  // Theme button ([data-jsal-theme]): flips light/dark and remembers it for every app.
  // Each page applies the saved choice in its <head> so there's no flash. Apps that draw
  // with theme colours (e.g. a canvas) can listen for the "jsal-theme" event to redraw.
  const themeBtn = document.querySelector('[data-jsal-theme]');
  if (themeBtn) {
    const root = document.documentElement;
    const system = matchMedia('(prefers-color-scheme: dark)');
    const current = () => root.dataset.theme || (system.matches ? 'dark' : 'light');
    // Both icons are in each page's HTML (/shell.css shows the right one); only the label changes here
    const paint = () => {
      const label = current() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
      themeBtn.title = label;
      themeBtn.setAttribute('aria-label', label);
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
  // Opening the menu is a stronger signal than a hover: the pages it lists load ahead now (Chrome family), so
  // picking one swaps at once and a quick next click has a page to land on. Not the Playbook (it signs in).
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

  // Quick clicks while pages change hands used to be lost (or the logo, still a plain link, went home):
  // · before this file ran on the new page, the one-line script in each page's <head> holds the click;
  // · after an app was picked but before the new page took over, the old page holds it in sessionStorage.
  // Either way the new page replays it here: the logo opens the menu, anything else is clicked, with the
  // transition cut short. A page loaded ahead (prerendered) looks again when it's shown.
  // Held clicks are a queue, replayed in order: logo, then the menu item picked from the menu it opened.
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
    for (const c of early) {
      if (c.logo) { menu.hidden ? open(false) : close(); continue; }
      const t = document.elementFromPoint(c.x, c.y);
      const hit = t && t.closest('a[href], button, summary, label, input, select, textarea, [role="button"], [tabindex]');
      if (hit) hit.click();
    }
  }
  window.jsalNavReady = true;
  if (document.prerendering) document.addEventListener('prerenderingchange', replayEarly, { once: true }); else replayEarly();
})();
