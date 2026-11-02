// The checks and the file, with no page code, so they can be tested on their own.
// analyse() reads the sheet's rows ({ id, old, new }) and returns, for each row, its state and the notes shown under
// its cells, plus the redirects that go into the file. A row's own cells are never changed here: fixes only shape
// what goes into the file, and the notes say what changed.

const INVISIBLE = /[​-‍⁠﻿­]/g;
const TRACKING = /^(utm_[a-z]+|gclid|gbraid|wbraid|fbclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|_ga|_gl)$/i;
const JUNK = /^(n\/?a|none|null|tbd|tbc|todo|delete|remove|same|-+|\?+|x)$/i;
const HOSTLIKE = /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}(?::\d+)?(?:[/?#]|$)/i;
const FILE_NAME = /^[^/]*\.(html?|php|aspx?|jsp|cfm|pdf|jpe?g|png|gif|webp|svg|xml|txt)(?:[?#]|$)/i;   // page.html is a path, not a domain

export const tidy = (v) => String(v ?? "").replace(INVISIBLE, "").replace(/^[\s ]+|[\s ]+$/g, "");
const bare = (h) => h.toLowerCase().replace(/^www\./, "");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Characters that stop an address working, each with how it's shown and the one-click fix if there's an obvious one
const CHECKS = [
  { re: /[  ]/g, say: (w) => `A space in the ${w}`, fixes: [["Encode it", (s) => s.replace(/[  ]/g, "%20")], ["Use a hyphen", (s) => s.replace(/[  ]+/g, "-")]] },
  { re: /[–—]/g, say: () => "A long dash, often from Word", fixes: [["Use - instead", (s) => s.replace(/[–—]/g, "-")]] },
  { re: /[‘’“”]/g, say: () => "Curly quotes, often from Word", fixes: [["Remove them", (s) => s.replace(/[‘’“”]/g, "")]] },
  { re: /[<>"{}|\\^`]/g, say: () => "Not allowed in an address", fixes: [] },
  { re: /[\x00-\x1F\x7F]/g, say: () => "A hidden control character (a tab or line break)", fixes: [["Remove it", (s) => s.replace(/[\x00-\x1F\x7F]/g, "")]] },
  { re: /%(?![0-9a-f]{2})/gi, say: () => "A % that isn’t part of a code like %20", fixes: [["Encode it as %25", (s) => s.replace(/%(?![0-9a-f]{2})/gi, "%25")]] },
];

// The address with each problem character marked, for the note under the cell
function marked(s, re) {
  let out = "", last = 0;
  for (const m of s.matchAll(new RegExp(re.source, re.flags))) {
    const ch = m[0] === " " || m[0] === " " ? "&nbsp;" : /[\x00-\x1F\x7F]/.test(m[0]) ? "␣" : esc(m[0]);
    out += esc(s.slice(last, m.index)) + `<mark>${ch}</mark>`;
    last = m.index + m[0].length;
  }
  return out + esc(s.slice(last));
}

// Reads one cell: a full URL (with or without https://), a path, or something that isn't an address
export function readAddress(raw) {
  const v = tidy(raw);
  if (!v) return { kind: "empty" };
  if (JUNK.test(v)) return { kind: "junk" };
  let host = "", rest = v, added = false;
  const full = v.match(/^(?:https?:)?\/\/([^/?#]*)(.*)$/i);
  if (full) [, host, rest] = full;
  else if (HOSTLIKE.test(v) && !FILE_NAME.test(v)) { const m = v.match(/^([^/?#]*)(.*)$/); [, host, rest] = m; }
  else if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return { kind: "scheme", scheme: v.split(":")[0] };
  else if (!v.startsWith("/")) {
    if (/\s/.test(v) && !v.includes("/")) return { kind: "junk" };
    rest = "/" + v; added = true;
  }
  if (host && !/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return { kind: "badhost", host };
  if (!rest || rest[0] === "?" || rest[0] === "#") rest = "/" + rest;
  const hash = rest.indexOf("#");
  const path = hash < 0 ? rest : rest.slice(0, hash);
  return { kind: "ok", host: host.toLowerCase(), path, fragment: hash < 0 ? "" : rest.slice(hash), added };
}

// Problems with the characters of one address; accented letters are encoded the way browsers send them
function characters(path, which) {
  const problems = [];
  CHECKS.forEach((c, i) => {
    c.re.lastIndex = 0;
    if (c.re.test(path)) problems.push({ text: `${c.say(which)}: <code>${marked(path, c.re)}</code>`, title: c.say(which), group: "char" + i, fixes: c.fixes });
  });
  let encodedNote = "";
  const enc = path.replace(/[^\x00-\x7F]/gu, (ch) => {
    if (/[ –—‘’“”]/.test(ch)) return ch;
    const e = encodeURIComponent(ch);
    if (!encodedNote) encodedNote = `${esc(ch)} written as ${e}, the way browsers send it`;   // the first one stands for the rest
    return e;
  });
  return { problems, path: enc, encodedNote };
}

function stripTracking(path) {
  const q = path.indexOf("?");
  if (q < 0) return { path, removed: false };
  const kept = path.slice(q + 1).split("&").filter((p) => p && !TRACKING.test(p.split("=")[0]));
  const removed = kept.length !== path.slice(q + 1).split("&").filter(Boolean).length;
  return { path: path.slice(0, q) + (kept.length ? "?" + kept.join("&") : ""), removed };
}

// The site's own domains: every domain in the old column, and the new column's main domain when at least two rows
// and at least half of its full URLs use it (one link to another site never counts as yours)
export function siteHosts(rows) {
  const hosts = new Set(), counts = new Map(), spelled = new Map();   // spelled keeps the www. as the sheet writes it
  let full = 0;
  for (const r of rows) {
    const o = readAddress(r.old), n = readAddress(r.new);
    if (o.kind === "ok" && o.host) { hosts.add(bare(o.host)); if (!spelled.has(bare(o.host))) spelled.set(bare(o.host), o.host); }
    if (n.kind === "ok" && n.host) { full++; counts.set(bare(n.host), (counts.get(bare(n.host)) || 0) + 1); spelled.set(bare(n.host), n.host); }
  }
  const top = [...counts].sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 2 && top[1] * 2 >= full) hosts.add(top[0]);
  const main = top && hosts.has(top[0]) ? top[0] : [...hosts][0];
  return { hosts, newHost: main ? spelled.get(main) : "" };
}

/**
 * rows: [{ id, old, new }]; fmt: a platform from formats.js; opts: { code, newAddr: "path" | "url", newSite, keep }
 * keep maps a clash's old address to the row id the visitor kept.
 * Returns { items: Map(id -> { state, notes, clash, routine }), ready: [{ id, from, to, code }], done, site }
 * state: "ok", "fixed", "bad" (needs the visitor), "out" (left out on purpose) or "blank". A bad note carries a group
 * (the same problem on another row has the same one) and a generic title, so repeats can be fixed all at once.
 * done counts the routine changes made on the way into the file (a domain removed, tracking tags…), which are said
 * once above the sheet rather than on every row.
 */
export function analyse(rows, fmt, opts) {
  const items = new Map();
  const { hosts, newHost } = siteHosts(rows);
  const site = tidy(opts.newSite) || (newHost ? "https://" + newHost : "");
  const key = (p) => fmt.slashSame ? (p.length > 1 ? p.replace(/\/$/, "") : p).toLowerCase() : p;
  const live = [];

  rows.forEach((r, i) => {
    const notes = [], it = { state: "ok", notes, n: i + 1, routine: [] };
    items.set(r.id, it);
    const o = readAddress(r.old), n = readAddress(r.new);
    const bad = (cell, text, fixes = [], group = text, title = text) => { notes.push({ cell, kind: "bad", text, fixes, group: cell + ":" + group, title }); it.state = "bad"; };
    const fix = (cell, text) => { notes.push({ cell, kind: "fix", text }); if (it.state === "ok") it.state = "fixed"; };
    // A row left out keeps only the reason; what the file would have said no longer matters
    const out = (cell, text) => { notes.splice(0, notes.length, ...notes.filter((x) => x.kind !== "fix")); notes.push({ cell, kind: "out", text }); it.state = "out"; };

    if (o.kind === "empty" && n.kind === "empty") { it.state = "blank"; return; }
    if (o.kind === "junk") return out("o", "Not an address: left out");
    if (o.kind === "empty") return bad("o", "No old address. Add one, or this row stays out");
    if (o.kind === "scheme") return bad("o", `A ${esc(o.scheme)}: link, not a page address`, [], "scheme", "A link that isn’t a page address");
    if (o.kind === "badhost") return bad("o", `Not a valid domain: <code>${esc(o.host)}</code>`, [], "host", "Not a valid domain");
    if (n.kind === "empty") return bad("n", "No new address. Add one, or this row stays out");
    if (n.kind === "junk") return bad("n", "Not an address. Add the new address, or delete the row");
    if (n.kind === "scheme") return bad("n", `A ${esc(n.scheme)}: link, not a page address`, [], "scheme", "A link that isn’t a page address");
    if (n.kind === "badhost") return bad("n", `Not a valid domain: <code>${esc(n.host)}</code>`, [], "host", "Not a valid domain");

    // A cell that changes on its way into the file: routine changes are counted for the line above the sheet, and
    // anything else gets a note saying what the file says and why
    const inFile = (cell, value, why) => {
      for (const w of why.filter((w) => w.key)) it.routine.push(cell + ":" + w.key);
      const said = why.filter((w) => !w.key).map((w) => w.text);
      if (said.length) fix(cell, `In the file: <code>${esc(value)}</code> (${said.join("; ")})`);
      else if (why.length && it.state === "ok") it.state = "fixed";
    };

    // Old address: always a path
    const t = stripTracking(o.path);
    const oc = characters(t.path, "old address");
    for (const p of oc.problems) bad("o", p.text, p.fixes, p.group, p.title);
    inFile("o", oc.path, [o.host && { key: "domain" }, t.removed && { key: "tracking" }, o.fragment && { key: "hash" },
      o.added && { key: "slash" }, oc.encodedNote && { text: oc.encodedNote }].filter(Boolean));

    // New address: a path on this site, or the full URL when it's another site (or the visitor asked for full URLs)
    const nc = characters(n.path, "new address");
    for (const p of nc.problems) bad("n", p.text, p.fixes, p.group, p.title);
    const external = n.host && !hosts.has(bare(n.host));
    const newPath = nc.path + n.fragment;
    const to = external ? `https://${n.host}${newPath}` : newPath;
    inFile("n", to, [n.host && !external && opts.newAddr === "path" && { key: "domain" }, n.added && { key: "slash" },
      nc.encodedNote && { text: nc.encodedNote }].filter(Boolean));
    if (it.state === "bad") return;

    // With full URLs, old.com/page to new.com/page is a real redirect; as paths it would point to itself
    const domainOnly = o.host && n.host && bare(o.host) !== bare(n.host);
    if (!external && key(oc.path) === key(nc.path) && !(domainOnly && opts.newAddr === "url")) {
      if (domainOnly) return out("n", "Only the domain changes: left out. If the old domain still points at this platform, choose Full URLs in Format");
      return out("n", oc.path === nc.path ? "Points to itself: left out" : "Only a / or capital differs, which this platform treats as the same address: left out");
    }
    live.push({ id: r.id, it, from: oc.path, to, own: !external, internal: !external && !(domainOnly && opts.newAddr === "url"), fix, bad, out });
  });

  // The same old address on more than one row: every row of a clash offers all of its choices side by side
  const groups = new Map();
  for (const l of live) {
    const k = key(l.from);
    (groups.get(k) || groups.set(k, []).get(k)).push(l);
  }
  const kept = [];
  for (const [k, g] of groups) {
    if (g.length === 1) { kept.push(g[0]); continue; }
    const distinct = new Set(g.map((l) => l.to));
    if (distinct.size === 1) {
      kept.push(g[0]);
      g.slice(1).forEach((l) => l.out("o", `Same as row ${g[0].it.n}: left out`));
      continue;
    }
    const chosen = g.find((l) => l.id === opts.keep?.[k]);
    const options = g.map((l) => ({ id: l.id, n: l.it.n, to: l.to }));
    const others = (l) => g.filter((x) => x !== l).map((x) => `row ${x.it.n}`).join(" and ");
    for (const l of g) {
      l.it.clash = { key: k, kept: chosen?.id, options };
      if (!chosen) l.bad("o", `<code>${esc(l.from)}</code> is also in ${others(l)}. Send it to:`, [], "clash", "The same old address in two rows");
      else if (l === chosen) l.fix("o", `You chose this row over ${others(l)}`);
      else l.out("o", `You chose row ${chosen.it.n} instead: left out`);
    }
    if (chosen) kept.push(chosen);
  }

  // Chains (A → B, then B → C) are written as A → C; a chain that comes back round is a loop
  const map = new Map(kept.map((l) => [key(l.from), l]));
  const ready = [];
  for (const l of kept) {
    let to = l.to, internal = l.internal, own = l.own, hops = [];
    const seen = new Set([key(l.from)]);
    let loop = false;
    while (internal) {
      const next = map.get(key(to.split("#")[0]));
      if (!next) break;
      if (seen.has(key(next.from))) { loop = true; break; }
      seen.add(key(next.from)); hops.push(next); to = next.to; internal = next.internal; own = next.own;
      if (hops.length > 50) { loop = true; break; }
    }
    if (loop) { l.bad("n", `A loop: ${[l, ...hops].map((h) => `row ${h.it.n}`).join(" → ")} comes back here. Change one of them`, [], "loop", "A loop"); continue; }
    if (hops.length) l.fix("n", `In the file: <code>${esc(to)}</code> (${hops.map((h) => `row ${h.it.n}`).join(" and ")} ${hops.length > 1 ? "move" : "moves"} ${esc(l.to)} on, so this goes straight to the end)`);
    if (!own || opts.newAddr !== "url") ready.push({ id: l.id, from: l.from, to, code: opts.code || "301" });
    else ready.push({ id: l.id, from: l.from, to: site ? site.replace(/\/$/, "") + to : to, code: opts.code || "301" });
  }

  // The platform's own limits
  for (const r of ready) {
    const problems = (fmt.rules?.(r) || []).filter(Boolean);
    // A website platform always has a home page, and its redirects only run for addresses that don't exist
    if (r.from === "/" && fmt.group !== "Hosting and servers" && !problems.length) problems.push({ cell: "o", id: "home", text: `${fmt.name} won’t redirect the home page while the site has one.` });
    for (const p of problems) live.find((l) => l.id === r.id).bad(p.cell, p.text, p.fixes || [], "rule-" + p.id, p.text);
  }

  // A row that needs the visitor shows only what's wrong: what the file would say comes once it's fixed
  const done = {};
  for (const it of items.values()) {
    if (it.state === "bad") it.notes = it.notes.filter((x) => x.kind !== "fix");
    else if (it.state === "ok" || it.state === "fixed") for (const k of it.routine) done[k] = (done[k] || 0) + 1;
  }
  return { items, ready: ready.filter((r) => items.get(r.id).state !== "bad"), done, site };
}

// CSV fields are quoted when they hold the separator, a quote, a line break or an outer space
export function csvField(v, sep) {
  const s = String(v);
  return s.includes(sep) || /["\r\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** The file's body (without the header row) and the default header line, for one part of the redirects. */
export function writeFile(rows, fmt, opts) {
  if (fmt.kind === "csv") {
    const cols = fmt.cols(opts.statusCol ? opts.code : "");
    return { header: cols.map((c) => csvField(c.name, opts.sep)).join(opts.sep), cols: cols.length,
      body: rows.map((r) => cols.map((c) => csvField(c.val(r), opts.sep)).join(opts.sep)).join("\n") };
  }
  if (fmt.kind === "lines") return { header: null, body: rows.map(fmt.line).join("\n") };
  return { header: null, body: rows.length ? fmt.write(rows) : "" };
}

// ── Reading pasted text and files ──────────────────────────────────────────

/** Splits CSV or tab-separated text into rows, choosing the separator from the first lines. */
export function parseDelimited(text) {
  text = text.replace(/^﻿/, "");
  const sample = text.split(/\r?\n/).slice(0, 20).join("\n").replace(/"[^"]*"/g, "");
  const count = (c) => sample.split(c).length - 1;
  const sep = count("\t") ? "\t" : count(";") > count(",") ? ";" : ",";
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === sep) { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => tidy(c)));
}

const looksLikeAddress = (v) => { const a = readAddress(v); return a.kind === "ok" && (a.host || /^\//.test(tidy(v))); };
export const colLetter = (i) => (i >= 26 ? colLetter(Math.floor(i / 26) - 1) : "") + String.fromCharCode(65 + (i % 26));

/** Which two columns hold the old and new addresses, and whether the first row is a header. */
export function pickColumns(rows) {
  const width = Math.max(2, ...rows.map((r) => r.length));
  const score = Array.from({ length: width }, (_, c) => rows.reduce((s, r) => s + (looksLikeAddress(r[c]) ? 1 : 0), 0));
  const order = score.map((s, c) => [s, c]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).slice(0, 2).map((x) => x[1]).sort((a, b) => a - b);
  const [o, n] = order;
  const first = rows[0] || [];
  const header = rows.length > 1 && [first[o], first[n]].every((v) => tidy(v) && !looksLikeAddress(v) && !/^\//.test(tidy(v)));
  return { o, n, header, width, names: header ? first.map(tidy) : [] };
}
