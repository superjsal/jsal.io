// Shared by every jsal.io app (with /shell.css for the colours):
// - the logo marked data-jsal-nav (a link to jsal.io) becomes a menu for moving between the apps
//   (to add an app, add it to APPS)
// - the button marked data-jsal-theme switches light/dark for all the apps
(() => {
  const APPS = [
    { href: '/image-resizer/', name: 'Image Resizer', desc: 'Resize, crop and convert images',
      icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 9"/>' },
    { href: '/formatter/', name: 'Clean Paste', desc: 'Clean up Word and Google Docs content',
      icon: '<path d="M4 6h16M4 12h10M4 18h13"/>' },
    { href: '/cms-picker/', name: 'CMS Picker', desc: 'Which CMS fits, and what you can change for SEO',
      icon: '<path d="M3 5h18v14H3z"/><path d="M3 10h18M9 5v14"/>' },
    { href: '/ic/', name: 'Platform Playbook', desc: 'Platform answers for the IC form', tag: 'Team',
      icon: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>' },
  ];
  const HOME = { href: '/', name: 'jsal.io home', icon: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>' };
  // Page transitions (/shell.css): while one plays, the page is a picture the browser can't click
  // into, so a click straight after arriving (on the logo, a link) did nothing. A press during a
  // transition now ends it at once, and the click goes to whatever is under the pointer.
  let replay = false;
  const watch = (vt) => {
    if (!vt) return;
    const press = () => { vt.skipTransition(); replay = true; setTimeout(() => { replay = false; }, 1000); };
    addEventListener('pointerdown', press, { capture: true });
    vt.finished.finally(() => removeEventListener('pointerdown', press, { capture: true }));
  };
  addEventListener('pagereveal', (e) => watch(e.viewTransition));   // arriving from another page
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

  // Theme button ([data-jsal-theme]): flips light/dark and remembers it for every app.
  // Each page applies the saved choice in its <head> so there's no flash. Apps that draw
  // with theme colours (e.g. a canvas) can listen for the "jsal-theme" event to redraw.
  const themeBtn = document.querySelector('[data-jsal-theme]');
  if (themeBtn) {
    const root = document.documentElement;
    const system = matchMedia('(prefers-color-scheme: dark)');
    const current = () => root.dataset.theme || (system.matches ? 'dark' : 'light');
    // Pages carry both icons in their HTML (/shell.css shows the right one); this only fills
    // the button in for a page that doesn't
    const hasIcons = !!themeBtn.querySelector('.i-sun');
    const paint = () => {
      const dark = current() === 'dark';
      if (!hasIcons) themeBtn.innerHTML = dark
        ? svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>')
        : svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>');
      const label = dark ? 'Switch to light theme' : 'Switch to dark theme';
      themeBtn.title = label;
      themeBtn.setAttribute('aria-label', label);
    };
    themeBtn.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('jsal-theme', next); } catch (e) {}
      paint();
      dispatchEvent(new Event('jsal-theme'));
    });
    system.addEventListener('change', () => { if (!root.dataset.theme) { paint(); dispatchEvent(new Event('jsal-theme')); } });
    paint();
  }

  const trigger = document.querySelector('[data-jsal-nav]');
  if (!trigger) return;
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
    .jsal-menu .ico { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 8px; background: var(--jsal-sunk); color: var(--jsal-accent); }
    .jsal-menu b { display: block; font-weight: 600; }
    .jsal-menu small { display: block; font-size: 12px; color: var(--jsal-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .jsal-menu .tag { font-size: 11px; font-weight: 700; color: var(--jsal-accent); border: 1px solid currentColor; border-radius: 99px; padding: 0 7px; }
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
  menu.innerHTML = APPS.map((a) => item(a)).join('') + '<hr>' + item(HOME, true);
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
  function open(focusFirst) {
    menu.hidden = false;
    place();
    trigger.setAttribute('aria-expanded', 'true');
    if (focusFirst) (menu.querySelector('[aria-current]') || links()[0]).focus();
  }
  function close(refocus) {
    if (menu.hidden) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (refocus) trigger.focus();
  }

  trigger.addEventListener('click', (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;   // new tab: let the link work
    e.preventDefault();
    menu.hidden ? open(e.detail === 0) : close();
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
  document.addEventListener('pointerdown', (e) => { if (!menu.hidden && !menu.contains(e.target) && !trigger.contains(e.target)) close(); });
  addEventListener('resize', () => { if (!menu.hidden) place(); });
  addEventListener('scroll', () => { if (!menu.hidden) place(); }, { passive: true });
})();
