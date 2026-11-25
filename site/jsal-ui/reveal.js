// The scroll reveal on the jsal.ui page: each block marked data-rv below the first screen waits, hidden, and arrives
// once when a sixth of it shows (how far and how long is in the page's styles). A block marked data-rv-steps arrives
// in turns instead: its parts marked data-rv-step follow one another 110 ms apart (three steps at most). Anything on
// screen or above it when the page opens simply shows; with reduced motion, or without this script, nothing is ever
// hidden. A page loaded ahead waits until it's shown.
(() => {
  if (!matchMedia('(prefers-reduced-motion: no-preference)').matches || !('IntersectionObserver' in window)) return;
  const GAP = 110;
  const start = () => {
    const wait = new Map();
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      wait.get(e.target).forEach((el) => el.classList.add('in'));
    }), { threshold: 1 / 6 });
    const hold = (trigger, items) => {
      if (trigger.getBoundingClientRect().top < innerHeight) return;
      items.forEach((el, i) => {
        el.classList.add('rv');
        if (i) el.style.setProperty('--d', `${Math.min(i, 3) * GAP}ms`);
      });
      wait.set(trigger, items);
      io.observe(trigger);
    };
    document.querySelectorAll('[data-rv]').forEach((b) => hold(b, [b]));
    document.querySelectorAll('[data-rv-steps]').forEach((b) => hold(b, [...b.querySelectorAll('[data-rv-step]')]));
  };
  if (document.prerendering) document.addEventListener('prerenderingchange', start, { once: true });
  else start();
})();
