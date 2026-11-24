// The scroll reveal on the jsal.ui page and its part pages: each marked block below the first screen waits, hidden,
// and arrives once when a sixth of it shows (how far and how long is in the page's styles). data-rv is a block;
// data-rv-row is a row of two, which side by side arrive together, the second 110 ms after the first, and stacked
// each as it's reached; data-rv-cards holds cards that follow one another 110 ms apart when they sit in a row (a
// heading among them is a block of its own). Anything on screen or above it when the page opens simply shows; with
// reduced motion, or without this script, nothing is ever hidden. A page loaded ahead waits until it's shown.
(() => {
  if (!matchMedia('(prefers-reduced-motion: no-preference)').matches || !('IntersectionObserver' in window)) return;
  const GAP = 110;
  const start = () => {
    const sets = [];
    const add = (trigger, ...items) => sets.push([trigger, items]);
    const side = matchMedia('(min-width: 1280px)').matches;
    document.querySelectorAll('[data-rv]').forEach((b) => add(b, [b, 0]));
    document.querySelectorAll('[data-rv-row]').forEach((r) => {
      const [a, b] = r.children;
      if (side) add(r, [a, 0], [b, GAP]);
      else { add(a, [a, 0]); add(b, [b, 0]); }
    });
    document.querySelectorAll('[data-rv-cards]').forEach((c) => {
      const row = getComputedStyle(c).gridTemplateColumns.split(' ').length > 1;
      let i = 0;
      [...c.children].forEach((el) => {
        if (/^H\d$/.test(el.tagName)) add(el, [el, 0]);
        else add(el, [el, row ? Math.min(i++, 2) * GAP : 0]);
      });
    });
    const wait = new Map();
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      wait.get(e.target).forEach(([el]) => el.classList.add('in'));
    }), { threshold: 1 / 6 });
    sets.forEach(([trigger, items]) => {
      if (trigger.getBoundingClientRect().top < innerHeight) return;
      items.forEach(([el, d]) => {
        el.classList.add('rv');
        if (el.matches('figure')) el.classList.add('rv-win');
        if (d) el.style.setProperty('--d', `${d}ms`);
      });
      wait.set(trigger, items);
      io.observe(trigger);
    });
  };
  if (document.prerendering) document.addEventListener('prerenderingchange', start, { once: true });
  else start();
})();
