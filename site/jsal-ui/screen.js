// The whole screen on a jsal.ui part page (wide windows): a button over each thing the part does, with its numbered
// dot. Pointing at one, tabbing to it or tapping it gives it the gold edge, dims the rest of the window and opens the
// tooltip beside it; with none pointed at or focused the picture rests, no tooltip and no dim. Escape shuts it.
// On a single still each button's data-tip is where its tooltip goes (left, top, and which side of the thing it sits
// on) and data-hole the dim's hole round it. On a stage of pieces each button names its pieces (data-on-piece), the
// side its tooltip opens on and its hole in each of those pieces' dims; the tooltip is placed as drawn, since the
// stage may be drawn smaller than the tooltip, and turns to the other side where it would leave the window. All the
// notes stay in the page, so a screen reader has every one; the motion is in the page's styles, off with reduced
// motion. A page loaded ahead waits until it's shown.
(() => {
  const start = () => document.querySelectorAll('[data-screen]').forEach((screen) => {
    const areas = [...screen.querySelectorAll('.area')];
    const tip = screen.querySelector('.tip'), notes = [...tip.children], holes = [...screen.querySelectorAll('.hole')];
    let on = -1, timer = 0, lastPieces = [];
    // The tooltip's height follows its note, so a change of note eases rather than jumps (0 while the screen is hidden)
    const fit = () => {
      if (on < 0) return;
      const h = notes[on].offsetHeight, s = getComputedStyle(tip);
      tip.style.height = h ? `${h + parseFloat(s.paddingTop) + parseFloat(s.paddingBottom) + parseFloat(s.borderTopWidth) + parseFloat(s.borderBottomWidth)}px` : '';
    };
    // A stage's tooltip beside its thing, measured as drawn, 16px off; each piece's hole: round the thing on the pieces
    // it lies on (snapping there when it comes from other pieces), shut on the others so they dim whole
    const place = () => {
      if (on < 0) return;
      const a = areas[on], s = screen.getBoundingClientRect(), r = a.getBoundingClientRect();
      const x = r.left - s.left, y = r.top - s.top, W = tip.offsetWidth, H = parseFloat(tip.style.height) || tip.offsetHeight, G = 16;
      let side = a.dataset.side, left, top;
      if (side === 'right' && r.right + G + W > innerWidth - 8) side = 'left';
      else if (side === 'left' && r.left - G - W < 8) side = 'right';
      if (side === 'above-end') { side = 'above'; left = x + r.width - W; top = y - G - H; }
      else { left = side === 'right' ? x + r.width + G : x - G - W; top = y; }
      Object.assign(tip.style, { left: `${left}px`, top: `${top}px` });
      tip.dataset.side = side;
      const mine = a.dataset.onPiece.split(' ').map(Number), cuts = a.dataset.hole.split(' | ');
      holes.forEach((hole, k) => {
        const j = mine.indexOf(k);
        if (j < 0) { hole.style.cssText = 'left: 50%; top: 50%; width: 0; height: 0'; return; }
        if (!lastPieces.includes(k)) hole.setAttribute('data-snap', '');
        hole.style.cssText = cuts[j];
        requestAnimationFrame(() => requestAnimationFrame(() => hole.removeAttribute('data-snap')));
      });
      lastPieces = mine;
    };
    const show = (i) => {
      clearTimeout(timer);
      const opening = on < 0;
      on = i;
      areas.forEach((a, k) => a.toggleAttribute('data-on', k === i));
      notes.forEach((n, k) => n.toggleAttribute('data-on', k === i));
      if (i < 0) { tip.setAttribute('data-off', ''); screen.removeAttribute('data-pointing'); return; }
      // Opening from rest: the tooltip appears in place and fades in, it doesn't glide from where it last was
      if (opening) tip.setAttribute('data-snap', '');
      if (areas[i].dataset.tip) {
        const [left, top, side] = areas[i].dataset.tip.split(' ');
        Object.assign(tip.style, { left, top });
        tip.dataset.side = side;
        holes[0].style.cssText = areas[i].dataset.hole;
        fit();
      } else { fit(); place(); }
      tip.removeAttribute('data-off');
      screen.setAttribute('data-pointing', '');
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
    // A window widened past the switch shows the screen: its tooltip takes its note's height then; a stage's tooltip
    // follows its thing when the window's width changes
    matchMedia('(min-width: 1280px)').addEventListener('change', () => { fit(); if (on >= 0 && !areas[on].dataset.tip) place(); });
    if (!areas.some((a) => a.dataset.tip)) addEventListener('resize', () => { if (on >= 0) place(); });
    screen.setAttribute('data-in', '');
  });
  if (document.prerendering) document.addEventListener('prerenderingchange', start, { once: true });
  else start();
})();
