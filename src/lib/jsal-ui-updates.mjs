// jsal.ui's releases for the updates page (/jsal-ui/updates/), from src/data/jsal-ui-updates.json: one entry a
// released version, newest first, each change with its kind, the part of the addon it touches and its words. Written
// at release time from a draft (.github/scripts/jsal_ui_updates_draft.py) and read through by hand. The build checks
// every entry: a missing field, an unknown kind, a bad date, a beta's version or releases out of order stop it,
// naming the entry. src/data/jsal-ui-updates.next.json holds the release being made, and is never read here.
import RELEASES from '../data/jsal-ui-updates.json';

// The kinds, in the order a release lists them: the key in the data, and the word on its pill
export const KINDS = [
  { key: 'new', word: 'New' },
  { key: 'better', word: 'Better' },
  { key: 'fixed', word: 'Fixed' },
  { key: 'out', word: 'Taken out' },
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = (iso) => { const [y, m, d] = iso.split('-'); return `${+d} ${MONTHS[+m - 1]} ${y}`; };
const parts = (v) => v.split('.').map(Number);
const newer = (a, b) => { const x = parts(a), y = parts(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };

function check(list) {
  const where = 'jsal.ui updates (src/data/jsal-ui-updates.json)';
  if (!Array.isArray(list) || !list.length) throw new Error(`${where}: no releases: is it a JSON list?`);
  const keys = KINDS.map((k) => k.key);
  list.forEach((r, i) => {
    const name = `the entry ${i + 1}${r && r.version ? ` (${r.version})` : ''}`;
    for (const f of ['version', 'date', 'restart', 'changes']) if (!r || r[f] === undefined) throw new Error(`${where}: ${name} has no "${f}"`);
    if (!/^\d+\.\d+\.\d+$/.test(r.version)) throw new Error(`${where}: ${name}'s version isn't a released one (x.y.z; betas don't go here)`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) throw new Error(`${where}: ${name}'s date isn't YYYY-MM-DD`);
    if (typeof r.restart !== 'boolean') throw new Error(`${where}: ${name}'s restart isn't true or false`);
    if (!Array.isArray(r.changes) || !r.changes.length) throw new Error(`${where}: ${name} has no changes`);
    r.changes.forEach((c, j) => {
      const line = `${name}, change ${j + 1}`;
      for (const f of ['kind', 'part', 'text']) if (typeof c[f] !== 'string' || !c[f].trim()) throw new Error(`${where}: ${line} has no "${f}"`);
      if (!keys.includes(c.kind)) throw new Error(`${where}: ${line}'s kind "${c.kind}" isn't one of ${keys.join(', ')}`);
      const extra = Object.keys(c).filter((f) => !['kind', 'part', 'text', 'thanks'].includes(f));
      if (extra.length) throw new Error(`${where}: ${line} has a field the page doesn't know: ${extra.join(', ')}`);
      if (c.thanks !== undefined && (typeof c.thanks !== 'string' || !c.thanks.trim())) throw new Error(`${where}: ${line}'s thanks is empty`);
    });
    if (i && !newer(list[i - 1].version, r.version)) throw new Error(`${where}: not newest first: ${r.version} comes after ${list[i - 1].version}`);
    if (i && r.date > list[i - 1].date) throw new Error(`${where}: ${r.version}'s date is after ${list[i - 1].version}'s`);
  });
}

/** The releases as the page draws them, newest first: each with its long date, its changes in the kinds' order,
 * and its counts by kind. Stops the build when the data is wrong. */
export function releases() {
  check(RELEASES);
  return RELEASES.map((r, i) => {
    const changes = KINDS.flatMap((k) => r.changes.filter((c) => c.kind === k.key).map((c) => ({ ...c, word: k.word })));
    const counts = KINDS.map((k) => ({ ...k, n: r.changes.filter((c) => c.kind === k.key).length })).filter((k) => k.n);
    return { ...r, latest: i === 0, when: longDate(r.date), changes, counts };
  });
}

/** The release before the oldest on the page ("0.3.58"), for the line to the older ones; null at the first. */
export function olderThan(list) {
  const [a, b, c] = parts(list.at(-1).version);
  return c > 0 ? `${a}.${b}.${c - 1}` : null;
}
