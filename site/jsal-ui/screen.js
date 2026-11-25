// The whole screen on a jsal.ui part page (wide windows): a button over each thing the part does, with its numbered
// dot. Pointing at one, tabbing to it or tapping it gives it the gold edge, dims the rest of the window and opens the
// tooltip beside it; with none pointed at or focused the picture rests, no tooltip and no dim. Escape shuts it. Each button's data-tip is where its tooltip goes (left, top,
// and which side of the thing it sits on) and data-hole the dim's hole round it. All the notes stay in the page, so a screen reader has every one;
// the motion is in the page's styles, off with reduced motion. A page loaded ahead waits until it's shown.
(() => {
  const start = () => document.querySelectorAll('[data-screen]').forEach((screen) => {
    const areas = [...screen.querySelectorAll('.area')];
    const tip = screen.querySelector('.tip'), notes = [...tip.children], hole = screen.querySelector('.hole');
    let on = -1, timer = 0;
    // The tooltip's height follows its note, so a change of note eases rather than jumps (0 while the screen is hidden)
    const fit = () => {
      if (on < 0) return;
      const h = notes[on].offsetHeight, s = getComputedStyle(tip);
      tip.style.height = h ? `${h + parseFloat(s.paddingTop) + parseFloat(s.paddingBottom) + parseFloat(s.borderTopWidth) + parseFloat(s.borderBottomWidth)}px` : '';
    };
    const show = (i) => {
      clearTimeout(timer);
      const opening = on < 0;
      on = i;
      areas.forEach((a, k) => a.toggleAttribute('data-on', k === i));
      notes.forEach((n, k) => n.toggleAttribute('data-on', k === i));
      if (i < 0) { tip.setAttribute('data-off', ''); screen.removeAttribute('data-pointing'); return; }
      const [left, top, side] = areas[i].dataset.tip.split(' ');
      // Opening from rest: the tooltip appears in place and fades in, it doesn't glide from where it last was
      if (opening) tip.setAttribute('data-snap', '');
      Object.assign(tip.style, { left, top });
      tip.dataset.side = side;
      hole.style.cssText = areas[i].dataset.hole;
      tip.removeAttribute('data-off');
      screen.setAttribute('data-pointing', '');
      fit();
      if (opening) { void tip.offsetWidth; requestAnimationFrame(() => tip.removeAttribute('data-snap')); }
    };
    // Back to rest after a tiny grace, so moving straight from one thing to the next glides instead of shutting and reopening
    const rest = () => { clearTimeout(timer); timer = setTimeout(() => { if (!areas.some((a) => a.matches(':hover, :focus-visible'))) show(-1); }, 60); };
    areas.forEach((a, i) => {
      a.addEventListener('pointerenter', () => show(i));
      a.addEventListener('focus', () => show(i));
      a.addEventListener('click', () => show(i));
      a.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') rest(); });
      a.addEventListener('blur', rest);
    });
    // A touch has no leaving: a tap elsewhere puts it back to rest
    document.addEventListener('pointerdown', (e) => { if (on >= 0 && e.pointerType === 'touch' && !(e.target.closest && e.target.closest('.area'))) show(-1); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && on >= 0) show(-1); });
    // A window widened past the switch shows the screen: its tooltip takes its note's height then
    matchMedia('(min-width: 1280px)').addEventListener('change', fit);
    screen.setAttribute('data-in', '');
  });
  if (document.prerendering) document.addEventListener('prerenderingchange', start, { once: true });
  else start();
})();
