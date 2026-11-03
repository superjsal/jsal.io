// Updates on the home page, from the changelog collection, so a change is described once. An entry meant to lead its
// section carries a "short" line. For each section this takes the newest entry with one, and the home page shows the
// SHOWN most recent of them (newest first, SECTIONS order breaking a tie). A section with no short line stops the
// build; a line over MAX_CHARS (about one row at 1024px) is a note in the build log.
import { SECTIONS, inOrder } from './changelog.mjs';

const MAX_CHARS = 40;
const SHOWN = 3;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The rows Updates shows: { section, icon, name, date, label, short }, from getCollection('changelog'). */
export function updates(collection) {
  const found = inOrder(collection).filter((e) => e.short);
  const latest = SECTIONS.map((s) => found.find((e) => e.tag === s.name));
  const missing = SECTIONS.filter((s, i) => !latest[i]).map((s) => s.name);
  if (missing.length) throw new Error(`The changelog (src/content/changelog.json): no entry tagged ${missing.join(', ')} has a short line, so Updates has nothing for it`);
  for (const e of latest) {
    if (e.short.length > MAX_CHARS) console.warn(`[updates] Note: the ${e.tag} line "${e.short}" is ${e.short.length} characters; keep Updates lines to about ${MAX_CHARS} so each fits one row at 1024px`);
  }
  // Array sort is stable, so SECTIONS order breaks a tie
  return latest
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, SHOWN)
    .map((e) => {
      const [, m, d] = e.date.split('-');
      return { section: e.tag.toLowerCase().replace(/ /g, '-'), icon: `/img/icons/${SECTIONS.find((s) => s.name === e.tag).icon}.svg`, name: e.tag, date: e.date, label: `${MONTHS[+m - 1]} ${+d}`, short: e.short };
    });
}
