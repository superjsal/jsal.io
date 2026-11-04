// Check live redirects: once the new site is live, jsal.io's checker (/api/redirect-check) visits each old address
// and reports every hop; this reads those hops against the address each row should reach, by the platform's rules.
// The page talks to the checker only when the visitor asks; nothing else here leaves the browser.

export const BATCH = 8;      // addresses per request: the checker follows up to 5 redirects each, within its 50 requests
const PAUSE = 250;           // between requests, so the site being checked isn't hurried
const RETRY_AFTER = 15000;   // after a "slow down" (429) from the checker, wait and try again, up to 3 times

// An address as a page on the site: host without www, path decoded and without its last /, capitals folded unless the
// platform documents that they matter (capsExact). A ? part counts only when the expected address has one.
function page(u, fmt) {
  const x = new URL(u);
  let path = x.pathname;
  try { path = decodeURI(path); } catch (e) { /* kept as sent */ }
  path = path.replace(/\/+$/, "") || "/";
  if (!fmt || !fmt.capsExact) path = path.toLowerCase();
  return { host: x.hostname.toLowerCase().replace(/^www\./, ""), path, query: [...x.searchParams].map(([k, v]) => `${k}=${v}`).sort().join("&") };
}
export function samePage(a, b, fmt) {
  const x = page(a, fmt), y = page(b, fmt);
  return x.host === y.host && x.path === y.path && (!y.query || x.query === y.query);
}

// How an address reads in a note: its path on the checked site, the full address elsewhere
const shown = (u, site) => { try { const x = new URL(u); return x.hostname.replace(/^www\./, "") === site ? x.pathname + x.search : u; } catch (e) { return u; } };
const isRedirect = (s) => s >= 300 && s < 400;
const PERMANENT = new Set([301, 308]);
const CHAIN = 3;   // this many redirects or more is worth shortening

/**
 * One row's live result. item: { old, expected } as full addresses; res: the checker's { hops: [{ url, status,
 * location? }], error? }; fmt: the platform (formats.js), or null for a plain CSV.
 * Returns { kind, text, final }: kind is "ok", "chain", "temporary", "elsewhere", "live", "missing", "broken",
 * "loop" or "error"; text is the note shown under the row.
 */
export function classify(item, res, fmt) {
  const site = new URL(item.old).hostname.replace(/^www\./, "");
  const hops = (res && res.hops) || [];
  const err = res && res.error;
  const first = hops[0], last = hops[hops.length - 1];
  const redirects = hops.filter((h) => isRedirect(h.status) && h.location);
  const to = shown(item.expected, site);
  if (!first) return { kind: "error", text: `Couldn’t check: ${err || "no answer"}` };
  // The loop: the last redirect points back to an address already visited (the checker stops there)
  const back = last && last.location && hops.some((h) => h.url === last.location);
  if (back || (res && res.loop)) return { kind: "loop", text: `Loops: ${[...hops.map((h) => h.url), last.location].map((u) => shown(u, site)).join(" → ")}` };
  if (h0(first.status) === 2) return { kind: "live", text: `The old page still shows (${first.status}): a live page at this address wins over the redirect. Remove it or change its address.`, final: first.url };
  if (first.status === 404 || first.status === 410) return { kind: "missing", text: `Not found (${first.status}): the redirect isn’t live. Imported and published?`, final: first.url };
  if (!isRedirect(first.status)) return { kind: "error", text: statusText(first.status) };
  if (err) return { kind: "error", text: err === "too many hops" ? `Couldn’t check: more than 5 redirects in a row` : `Couldn’t check where it leads: ${err}` };
  const final = last.url;
  if (h0(last.status) !== 2) {
    if (last.status === 404 || last.status === 410) return { kind: "broken", text: `Redirects to ${shown(final, site)}, which is not found (${last.status})`, final };
    return { kind: "error", text: `Redirects to ${shown(final, site)}, which answers: ${statusText(last.status)}`, final };
  }
  if (!samePage(final, item.expected, fmt)) return { kind: "elsewhere", text: `Ends on ${shown(final, site)} instead of ${to}`, final };
  if (!PERMANENT.has(first.status)) return { kind: "temporary", text: `Lands on ${to}, but with a temporary ${first.status}: make it a 301`, final };
  if (redirects.length >= CHAIN) return { kind: "chain", text: `Lands on ${to}, but in ${redirects.length} redirects: point it straight there`, final };
  return { kind: "ok", text: `Lands on ${to} (${first.status})`, final };
}
const h0 = (s) => Math.floor(s / 100);
function statusText(s) {
  if (s === 403 || s === 401) return `The site refused the check (${s})`;
  if (s === 429) return "The site asked to slow down (429). Try these again in a minute";
  if (h0(s) === 5) return `The site answered with an error (${s})`;
  return `Unexpected answer (${s})`;
}

/**
 * Asks the checker about every item, BATCH at a time, and calls onResults(items, results) after each answer.
 * items: [{ id, old, expected }]. Stops early when signal is aborted. Resolves to the number checked.
 */
export async function checkLive(items, { onResults, signal, endpoint = "/api/redirect-check" } = {}) {
  let done = 0;
  for (let i = 0; i < items.length; i += BATCH) {
    if (signal && signal.aborted) break;
    const part = items.slice(i, i + BATCH);
    let res = await ask(endpoint, part, signal);
    for (let tries = 0; res.status === 429 && tries < 3 && !(signal && signal.aborted); tries++) { await wait(RETRY_AFTER, signal); res = await ask(endpoint, part, signal); }
    const results = res.ok ? res.body.results : part.map(() => ({ hops: [], error: res.error }));
    done += part.length;
    if (onResults) onResults(part, results);
    if (i + BATCH < items.length) await wait(PAUSE, signal);
  }
  return done;
}
async function ask(endpoint, part, signal) {
  try {
    const r = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ urls: part.map((x) => x.old) }), signal });
    const body = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, body } : { ok: false, status: r.status, error: r.status === 429 ? "the checker is busy, try again in a minute" : body.error || `the checker answered ${r.status}` };
  } catch (e) {
    return { ok: false, error: e.name === "AbortError" ? "stopped" : "couldn’t reach jsal.io’s checker" };
  }
}
const wait = (ms, signal) => new Promise((done) => { const t = setTimeout(done, ms); if (signal) signal.addEventListener("abort", () => { clearTimeout(t); done(); }, { once: true }); });
