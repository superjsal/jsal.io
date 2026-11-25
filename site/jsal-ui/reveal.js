// The scroll reveal on the jsal.ui page: each block marked data-rv below the first screen waits, hidden, and arrives
// once when a sixth of it shows (how far and how long is in the page's styles). Anything on screen or above it when
// the page opens simply shows; with reduced motion, or without this script, nothing is ever hidden. A page loaded
// ahead waits until it's shown.
(() => {
  if (!matchMedia('(prefers-reduced-motion: no-preference)').matches || !('IntersectionObserver' in window)) return;
  const start = () => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.classList.add('in');
    }), { threshold: 1 / 6 });
    document.querySelectorAll('[data-rv]').forEach((b) => {
      if (b.getBoundingClientRect().top < innerHeight) return;
      b.classList.add('rv');
      io.observe(b);
    });
  };
  if (document.prerendering) document.addEventListener('prerenderingchange', start, { once: true });
  else start();
})();
