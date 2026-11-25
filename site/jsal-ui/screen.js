// The whole screen on a jsal.ui part page (wide windows): a button over each thing the part does, with its numbered
// dot. Pointing at one, tabbing to it or tapping it gives it the gold edge, dims the rest of the window and moves the
// tooltip beside it; the first one's tooltip is open from the start, and the last one shown stays open when the
// pointer leaves (with the dim gone). Escape shuts it. Each button's data-tip is where its tooltip goes (left, top,
// and which side of the thing it sits on) and data-hole the dim's hole round it. All the notes stay in the page, so a screen reader has every one;
// the motion is in the page's styles, off with reduced motion. A page loaded ahead waits until it's shown.
(() => {
  const start = () => document.querySelectorAll('[data-screen]').forEach((screen) => {
    const areas = [...screen.querySelectorAll('.area')];
    const tip = screen.querySelector('.tip'), notes = [...tip.children], hole = screen.querySelector('.hole');
    let on = 0;
    // The tooltip's height follows its note, so a change of note eases rather than jumps (0 while the screen is hidden)
    const fit = () => {
      if (on < 0) return;
      const h = notes[on].offsetHeight, s = getComputedStyle(tip);
      tip.style.height = h ? `${h + parseFloat(s.paddingTop) + parseFloat(s.paddingBottom) + parseFloat(s.borderTopWidth) + parseFloat(s.borderBottomWidth)}px` : '';
    };
    const show = (i) => {
      on = i;
      areas.forEach((a, k) => a.toggleAttribute('data-on', k === i));
      notes.forEach((n, k) => n.toggleAttribute('data-on', k === i));
      tip.toggleAttribute('data-off', i < 0);
      if (i < 0) return;
      const [left, top, side] = areas[i].dataset.tip.split(' ');
      Object.assign(tip.style, { left, top });
      tip.dataset.side = side;
      hole.style.cssText = areas[i].dataset.hole;
      fit();
    };
    const point = (yes) => screen.toggleAttribute('data-pointing', yes);
    // Still on the screen's things: the pointer went to another button or into the tooltip
    const near = (el) => !!(el && el.closest && screen.contains(el) && el.closest('.area, .tip'));
    areas.forEach((a, i) => {
      a.addEventListener('pointerenter', () => { show(i); point(true); });
      a.addEventListener('focus', () => { show(i); point(true); });
      a.addEventListener('click', () => { show(i); point(true); });
      a.addEventListener('pointerleave', (e) => { if (!near(e.relatedTarget) && !a.matches(':focus-visible')) point(false); });
      a.addEventListener('blur', (e) => { if (!areas.includes(e.relatedTarget)) point(false); });
    });
    tip.addEventListener('pointerleave', (e) => { if (!near(e.relatedTarget)) point(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && on >= 0) { show(-1); point(false); } });
    // A window widened past the switch shows the screen: its tooltip takes its note's height then
    matchMedia('(min-width: 1280px)').addEventListener('change', fit);
    show(0);
    screen.setAttribute('data-in', '');
  });
  if (document.prerendering) document.addEventListener('prerenderingchange', start, { once: true });
  else start();
})();
