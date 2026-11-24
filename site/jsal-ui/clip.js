// The clip at the top of a jsal.ui part page: it plays, muted and looping, over the part's still while a third of it
// is on screen, and pauses when it leaves. Nothing is fetched until then, and with reduced motion, when the browser
// is asked to save data, or if the clip can't load, the still simply stays. It moves for more than five seconds, so it
// carries a Pause/Play button, and a pause holds until Play. A page loaded ahead waits until it's shown.
(() => {
  const fig = document.querySelector('figure[data-clip]');
  if (!fig || !('IntersectionObserver' in window) || !matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
  if (navigator.connection && navigator.connection.saveData) return;
  const img = fig.querySelector('img');
  let vid = null, btn = null, ctl = null, held = false;
  const say = () => {
    btn.textContent = vid.paused ? 'Play' : 'Pause';
    btn.setAttribute('aria-label', `${btn.textContent} the ${fig.dataset.name} clip`);
  };
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      if (!vid) make();
      if (vid && !held) vid.play().catch(() => {});
    } else if (vid && !vid.paused) vid.pause();
  }, { threshold: 0.33 });
  const make = () => {
    vid = document.createElement('video');
    Object.assign(vid, { muted: true, loop: true, playsInline: true, preload: 'auto', poster: img.currentSrc || img.src, className: 'hero-clip', width: +fig.dataset.w, height: +fig.dataset.h });
    vid.setAttribute('muted', '');
    vid.setAttribute('aria-label', img.alt);
    ctl = Object.assign(document.createElement('span'), { className: 'clip-ctl jsal-dark' });
    btn = Object.assign(document.createElement('button'), { type: 'button', className: 'jsal-btn small' });
    ctl.append(btn);
    vid.addEventListener('play', say);
    vid.addEventListener('pause', say);
    // a clip that can't load leaves the still as it was
    vid.addEventListener('error', () => { io.disconnect(); vid.remove(); ctl.remove(); img.removeAttribute('aria-hidden'); vid = null; });
    btn.addEventListener('click', () => {
      if (vid.paused) { held = false; vid.play().catch(() => {}); }
      else { held = true; vid.pause(); }
    });
    vid.src = fig.dataset.clip;
    // a clip framed differently from the still can't take the still's crop on a phone: there it shows whole
    const same = Math.abs(+fig.dataset.w - +img.getAttribute('width')) <= 4 && Math.abs(+fig.dataset.h - +img.getAttribute('height')) <= 4;
    if (!same) fig.classList.add('fit');
    img.setAttribute('aria-hidden', 'true');
    fig.append(vid, ctl);
    say();
  };
  const start = () => io.observe(fig);
  if (document.prerendering) document.addEventListener('prerenderingchange', start, { once: true });
  else start();
})();
