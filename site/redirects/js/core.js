// The checks and the file, with no page code, so they can be tested on their own.
// analyse() reads the sheet's rows ({ id, old, new }) and returns, for each row, its state and the notes shown under
// its cells, plus the redirects that go into the file. A row's own cells are never changed here: fixes only shape
// what goes into the file, and the notes say what changed.

const INVISIBLE = /[​-‍⁠﻿­]/g;
const TRACKING = /^(utm_[a-z]+|gclid|gbraid|wbraid|fbclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|_ga|_gl)$/i;
// Words people write in a redirect sheet instead of an address, meaning "don't redirect this one"
const JUNK = /^(n\/?a|na|none|null|tbd|tbc|todo|delete|remove|drop|kill|retire|same|disregard|ignore|skip|keep|leave|gone|404|410|no|x|dnr|not needed|no change|keep as is|no redirect|do not redirect|don[’']?t redirect|-+|\?+)[.!]*$/i;
const HOSTLIKE = /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}(?::\d+)?(?:[/?#]|$)/i;
const FILE_NAME = /^[^/]*\.(html?|php|aspx?|jsp|cfm|pdf|jpe?g|png|gif|webp|svg|xml|txt)(?:[?#]|$)/i;   // page.html is a path, not a domain

export const tidy = (v) => String(v ?? "").replace(INVISIBLE, "").replace(/^[\s ]+|[\s ]+$/g, "");
const bare = (h) => h.toLowerCase().replace(/^www\./, "");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// A UTF-8 file opened as Windows-1252 (how Excel opens a CSV by default) shows é as Ã©: such a run is read back
// as the bytes it was and decoded again
const CP1252 = "€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008DŽ\u008F\u0090‘’“”•–—˜™š›œ\u009DžŸ";
const CONT = "\\u0080-\\u00BF€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
const MOJIBAKE = new RegExp(`[\\u00C2-\\u00DF][${CONT}]|[\\u00E0-\\u00EF][${CONT}]{2}`, "g");
const byteOf = (ch) => { const c = ch.charCodeAt(0), i = CP1252.indexOf(ch); return c >= 0x80 && c <= 0x9F ? c : i >= 0 ? 0x80 + i : c; };
const unmangle = (s) => s.replace(MOJIBAKE, (m) => { try { return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from([...m], byteOf)); } catch (e) { return m; } });

// Characters that stop an address working, each with how it's shown and the one-click fix if there's an obvious one
const CHECKS = [
  { re: MOJIBAKE, say: () => "Garbled letters", fixes: [["Fix the letters", unmangle, true]] },
  // A letter the file couldn't hold when it was saved; only the original says which it was
  { re: /�/g, say: () => "A letter was lost when the file was saved. Copy the address again", fixes: [] },
  // Reports shorten long addresses for display (…/how-to-choose-a…), and copying the text copies the shortened one
  { re: /\u2026|\.{3,}/g, say: () => "Cut short. Copy the full address", fixes: [] },
  // No fix offered: only the original says whether the space was real (sent as %20) or crept in when copying
  { re: /[  ]/g, say: () => "Has a space", fixes: [] },
  { re: /[–—]/g, say: () => "Long dash", fixes: [["Use a hyphen", (s) => s.replace(/[–—]/g, "-")]] },
  { re: /[‘’“”]/g, say: () => "Curly quotes", fixes: [["Remove them", (s) => s.replace(/[‘’“”]/g, "")]] },
  { re: /[<>"{}|\\^`]/g, say: () => "Not allowed in an address", fixes: [] },
  { re: /[\x00-\x1F\x7F]/g, say: () => "Hidden tab or line break", fixes: [["Remove it", (s) => s.replace(/[\x00-\x1F\x7F]/g, "")]] },
  { re: /%(?![0-9a-f]{2})/gi, say: () => "Stray %", fixes: [["Encode it as %25", (s) => s.replace(/%(?![0-9a-f]{2})/gi, "%25")]] },
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
  if (JUNK.test(v)) return { kind: "junk", word: v };
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

// Problems with the characters of one address; accented letters are encoded the way browsers send them, unless the
// platform rejects any % (keepLetters). refs: the platform's own wildcard references (%1), which aren't stray
function characters(path, which, keepLetters, refs) {
  const problems = [];
  const plain = refs ? path.replace(refs, "") : path;
  const unmangled = plain.replace(MOJIBAKE, (m) => "x".repeat(m.length));
  CHECKS.forEach((c, i) => {
    c.re.lastIndex = 0;
    if (c.re.test(c.re === MOJIBAKE ? plain : unmangled)) problems.push({ text: `${c.say(which)}: <code>${marked(path, c.re)}</code>`, title: c.say(which), group: "char" + i, fixes: c.fixes });
  });
  let encodedNote = "";
  if (keepLetters) return { problems, path, encodedNote };
  const enc = path.replace(/[^\x00-\x7F]/gu, (ch) => {
    if (/[\u2026 –—‘’“”]/.test(ch)) return ch;
    const e = encodeURIComponent(ch);
    if (!encodedNote) encodedNote = `${esc(ch)} encoded`;   // the first one stands for the rest
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

// Audit exports and documents leave traps an address doesn't show at a glance. Punctuation copied with it from the
// sentence around it (a bracket only when it has no opening one):
function trailing(p) {
  const a = p.split("#")[0];
  if (/\.\.$/.test(a)) return "";   // cut short, said on its own
  let end = a.length;
  const open = (s, o, c) => s.split(o).length < s.split(c).length;
  while (end > 1) {
    const ch = a[end - 1], s = a.slice(0, end);
    if (".,;:".includes(ch) || (ch === ")" && open(s, "(", ")")) || (ch === "]" && open(s, "[", "]"))) end--;
    else break;
  }
  return /[a-z0-9]/i.test(a.slice(0, end).split("?")[0]) ? a.slice(end) : "";
}
// The fix works on the cell as typed, where the punctuation may sit before a tracking tag or a # part
const dropTrailing = (s) => {
  const v = tidy(s), h = v.indexOf("#"), a = h < 0 ? v : v.slice(0, h), f = h < 0 ? "" : v.slice(h);
  let t = trailing(a);
  if (t) return a.slice(0, -t.length) + f;
  const q = a.indexOf("?");
  t = q > 0 ? trailing(a.slice(0, q)) : "";
  return t ? a.slice(0, q - t.length) + a.slice(q) + f : v;
};
// An address encoded twice (%2520 for a space), when decoding it once gives a sound address
const TWICE = /%25(?=[0-9a-f]{2})/gi;
const decodeOnce = (s) => s.replace(TWICE, "%");
function encodedTwice(p) {
  TWICE.lastIndex = 0;
  if (!TWICE.test(p)) return false;
  try { decodeURIComponent(decodeOnce(p)); return true; } catch (e) { return false; }
}
// A letter Excel can't store in a plain CSV is saved as ?: a ? inside a word, with no = after it
function lostLetter(p) {
  const q = p.indexOf("?");
  if (q < 0) return false;
  const after = p.slice(q + 1);
  if (/[=&]/.test(after)) return false;
  return /^[-_]/.test(after) || /[/?]/.test(after) || (/[a-z]$/i.test(p.slice(0, q)) && /^[a-z0-9]+[-_][a-z0-9]/i.test(after));
}
const dropQuery = (s) => s.replace(/\?[^#]*/, "");

// Addresses a crawl or report lists beside the pages: files, feeds, sitemaps and the old site's system addresses.
// They import, but are rarely meant for the new site's pages
const NOT_PAGES = [
  [/^\/(sitemap[\w-]*|[\w-]+-sitemap\d*)\.xml(\.gz)?$|^\/sitemaps?\/.*\.xml$/i, "sitemap", "A sitemap: the new site makes its own", "are sitemaps"],
  [/^\/robots\.txt$/i, "robots", "robots.txt: the new site has its own", "are robots.txt"],
  [/(^|\/)(feed|rss|atom)(\/|\.xml|\.rss)?$|\/feed\/(rss2?|atom)\/?$|[?&]feed=/i, "feed", "A feed: point it at the new site’s feed, if it has one", "are feeds"],
  [/^\/(wp-admin|wp-includes|wp-json|wp-content\/(plugins|themes|cache))(\/|$)|^\/(wp-login|wp-cron|wp-signup|xmlrpc)\.php|\/trackback\/?$|[?&]replytocom=/i, "wordpress", "A WordPress system address, not a page", "are WordPress system addresses"],
  [/^\/(cdn-cgi|cgi-bin|\.well-known)(\/|$)/i, "server", "A server address, not a page", "are server addresses"],
];
const FILE_EXT = /\.(jpe?g|png|gif|webp|avif|svg|ico|bmp|tiff?|heic|pdf|docx?|xlsx?|pptx?|csv|zip|mp3|mp4|m4a|mov|webm|wav|css|js|woff2?|ttf|otf|eot)$/i;
// Pages whose ? part says which page it is (/index.php?id=5), so their variants are different pages
const BY_QUERY = /\.(php|aspx?|cfm|jsp|cgi|pl)$/i;

// Preview and staging addresses: a new site's mapping is often made on its preview before launch, and a redirect to
// the preview sends visitors there once the site is live. "preview" is a platform's preview or a local computer (red);
// "maybe" could be a live site but rarely is (terracotta); "staging" is a staging-style subdomain (terracotta).
const PREVIEW_HOSTS = /(^|\.)(myshopify\.com|webflow\.io|wixsite\.com|squarespace\.com|wpengine\.com|wpenginepowered\.com|kinsta\.cloud|hs-sites\.com|hubspotpagebuilder\.com|multiscreensite\.com|dudaone\.com|ngrok\.io|ngrok-free\.app)$|^(localhost|127\.0\.0\.1)$|\.(local|test|localhost)$/i;
const HOSTING_HOSTS = /(^|\.)(netlify\.app|vercel\.app|pages\.dev|github\.io)$/i;
const STAGING_LABEL = /^(staging|stage|stg|dev|test|preview|new|beta|uat|qa)[-\d]*$|^staging-/i;
const PREVIEW_QUERY = /[?&](preview_theme_id|preview_id|preview|preview_nonce)=/i;
export function previewKind(host) {
  const h = bare(host).replace(/:\d+$/, "");
  if (PREVIEW_HOSTS.test(h)) return "preview";
  if (HOSTING_HOSTS.test(h)) return /--|-git-|^deploy-preview/i.test(h) ? "preview" : "maybe";
  return STAGING_LABEL.test(h.split(".")[0]) && h.split(".").length > 2 ? "staging" : "";
}
// The address without its preview domain; a Wix preview also carries the site's name as the first folder
function previewPath(host, path) {
  return /(^|\.)wixsite\.com$/i.test(host) ? path.replace(/^\/[^/?#]+/, "") || "/" : path;
}
const usePath = (s) => {
  const a = readAddress(s);
  return a.kind === "ok" && a.host ? previewPath(a.host, a.path) + a.fragment : s;
};
const dropPreview = (s) => s.replace(new RegExp(PREVIEW_QUERY.source + "[^&#]*", "gi"), (m) => m[0] === "?" ? "?" : "").replace(/\?&/, "?").replace(/\?(?=#|$)/, "");

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
  const live = (h) => h && !previewKind(h);   // full URLs are never written on a preview domain
  const main = top && hosts.has(top[0]) && live(top[0]) ? top[0] : [...hosts].find(live);
  return { hosts, newHost: main ? spelled.get(main) : "" };
}

/**
 * rows: [{ id, old, new }]; fmt: a platform from formats.js; opts: { code, newAddr: "path" | "url", newSite }
 * Returns { items: Map(id -> { state, notes, routine }), ready: [{ id, from, to, code }], done, site }
 * state: "ok", "fixed", "warn" (goes in the file, but check it after importing), "bad" (needs the visitor), "out"
 * (left out on purpose) or "blank". A bad note carries a group
 * (the same problem on another row has the same one) and a generic title, so repeats can be fixed all at once.
 * done counts the routine changes made on the way into the file (a domain removed, tracking tags…), which are said
 * once above the sheet rather than on every row.
 */
export function analyse(rows, fmt, opts) {
  const items = new Map();
  const { hosts, newHost } = siteHosts(rows);
  const site = tidy(opts.newSite) || (newHost ? "https://" + newHost : "");
  // same: the address as the platform is documented to match it (with or without the last /, or any capitals), so two
  // addresses alike there are one. loose: without its last / or capitals; where the docs don't settle those, two
  // addresses that differ only there are marked to test, never merged. key follows the platform's setting for chains
  const trim = (p) => (p.length > 1 ? p.replace(/\/$/, "") : p);
  const same = (p) => { const s = fmt.slashLoop ? trim(p) : p; return fmt.capsSame ? s.toLowerCase() : s; };
  const loose = (p) => fmt.capsExact ? trim(p) : trim(p).toLowerCase();
  const key = (p) => fmt.slashSame ? loose(p) : same(p);
  // How b differs from a when they match loosely, so the note names it: "the last /", "capitals" or both
  const looseDiff = (a, b) => ({ slash: trim(a) !== a ? (trim(b) !== b ? "" : "without") : (trim(b) !== b ? "with" : ""), caps: trim(a) !== trim(b) });
  const short = fmt.doc ? esc(fmt.short || fmt.name.replace(/ \(.*/, "")) : "";
  const on = short ? "on " + short : "on some platforms";
  const matches = short ? short + " matches" : "some platforms match";
  // Why two addresses that differ only by d are one on this platform
  const why = (d) => [d.caps && `${short} ignores capitals`, d.slash && `${matches} it with or without the last /`].filter(Boolean).join(", and ");
  const live = [], olds = new Set();

  rows.forEach((r, i) => {
    const notes = [], it = { state: "ok", notes, n: r.n ?? i + 1, routine: [] };
    items.set(r.id, it);
    const o = readAddress(r.old), n = readAddress(r.new);
    // leave: a problem that can't be fixed by editing (the platform refuses the address, or there's nowhere to send
    // it) offers to leave the row out, named by the button's label
    const bad = (cell, text, fixes = [], group = text, title = text, leave = "") => { notes.push({ cell, kind: "bad", text, fixes, group: cell + ":" + group, title, leave }); it.state = "bad"; };
    const fix = (cell, text) => { notes.push({ cell, kind: "fix", text }); if (it.state === "ok") it.state = "fixed"; };
    // A row left out keeps only the reason; what the file would have said no longer matters
    const out = (cell, text, group) => { notes.splice(0, notes.length, ...notes.filter((x) => x.kind !== "fix")); notes.push({ cell, kind: "out", text, group }); it.state = "out"; };

    if (o.kind === "empty" && n.kind === "empty") { it.state = "blank"; return; }
    if (r.skip) return out("o", "Left out by you", "skip");
    if (o.kind === "junk") return out("o", o.word ? `Marked “${esc(o.word)}”` : "Not an address");
    if (o.kind === "empty") return bad("o", "No old address");
    if (o.kind === "scheme") return bad("o", `A ${esc(o.scheme)}: link, not a page address`, [], "scheme", "A link that isn’t a page address");
    if (o.kind === "badhost") return bad("o", `Not a valid domain: <code>${esc(o.host)}</code>`, [], "host", "Not a valid domain");
    if (n.kind === "empty") return bad("n", "No new address", [], "No new address", "No new address", "Leave it out");
    if (n.kind === "junk") return n.word ? out("n", `Marked “${esc(n.word)}”`) : bad("n", "Not an address");
    if (n.kind === "scheme") return bad("n", `A ${esc(n.scheme)}: link, not a page address`, [], "scheme", "A link that isn’t a page address");
    if (n.kind === "badhost") return bad("n", `Not a valid domain: <code>${esc(n.host)}</code>`, [], "host", "Not a valid domain");

    // A cell that changes on its way into the file: routine changes are counted for the line above the sheet, and
    // anything else gets a note saying what the file says and why
    const inFile = (cell, value, why) => {
      for (const w of why.filter((w) => w.key)) it.routine.push(cell + ":" + w.key);
      const said = why.filter((w) => !w.key).map((w) => w.text);
      if (said.length) fix(cell, `In the download: <code>${esc(value)}</code> (${said.join("; ")})`);
      else if (why.length && it.state === "ok") it.state = "fixed";
    };

    // Old address: always a path
    const t = stripTracking(fmt.unescape ? fmt.unescape(o.path) : o.path);
    const oc = characters(t.path, "old address", fmt.keepLetters);
    olds.add(oc.path);
    for (const p of oc.problems) bad("o", p.text, p.fixes, p.group, p.title);
    inFile("o", oc.path, [o.host && { key: "domain" }, t.removed && { key: "tracking" }, o.fragment && { key: "hash" },
      oc.encodedNote && { text: oc.encodedNote }].filter(Boolean));
    const noSlash = (cell) => notes.push({ cell, kind: "warn", group: cell + ":noslash", title: "have no / at the start", text: "No / at the start: is this an address?" });
    if (o.added) noSlash("o");
    const ends = (p, t) => `Punctuation at the end: <code>${esc(p.slice(0, p.length - t.length))}<mark>${esc(t)}</mark></code>`;
    const twice = (p) => `Encoded twice: <code>${marked(p, TWICE)}</code>`;
    const lost = (p) => `A ? inside a word, as Excel saves a letter it can’t store: <code>${marked(p, /\?/g)}</code>`;
    const warn = (cell, group, title, text, fixes = []) => notes.push({ cell, kind: "warn", group: cell + ":" + group, title, text, fixes });

    // New address: a path on this site, or the full URL when it's another site (or the visitor asked for full URLs)
    const nc = characters(n.path, "new address", fmt.keepLetters, fmt.refs);
    for (const p of nc.problems) bad("n", p.text, p.fixes, p.group, p.title);
    const external = n.host && !hosts.has(bare(n.host));
    const pv = n.host ? previewKind(n.host) : "";
    const newPath = (pv && !external ? previewPath(n.host, nc.path) : nc.path) + n.fragment;
    const to = external ? `https://${n.host}${newPath}` : newPath;
    inFile("n", to, [n.host && !external && opts.newAddr === "path" && { key: pv ? "preview" : "domain" },
      nc.encodedNote && { text: nc.encodedNote }].filter(Boolean));
    const host = esc(n.host.replace(/^www\./i, ""));
    if (pv && external) {
      const fixes = [["Use the path", usePath, true]];   // true: the button shows the result, as it visibly differs
      if (pv === "preview") bad("n", `Preview site: <code>${host}</code>`, fixes, "preview:" + host, `point at <code>${host}</code>, a preview site`);
      else notes.push({ cell: "n", kind: "warn", fixes, group: "n:check:" + host, title: `point at <code>${host}</code>, which ${pv === "maybe" ? "is usually a preview or hosting address" : "looks like a staging site"}`, text: pv === "maybe"
        ? `Preview or hosting site? <code>${host}</code>`
        : `Staging site? <code>${host}</code>` });
    }
    if (PREVIEW_QUERY.test(n.path)) bad("n", "Preview link", [["Remove the preview part", dropPreview, true]], "preview-link", "Preview links");
    if (n.added) noSlash("n");
    // An old address can be a real one with the mistake in it (a 404 from a link that took the full stop with it), so
    // it's marked to check, and not at all when the row sends it to the address without the mistake
    const ot = trailing(oc.path);
    if (ot && nc.path !== oc.path.slice(0, -ot.length)) warn("o", "trail", "end in punctuation", ends(oc.path, ot), [["Remove it", dropTrailing, true]]);
    if (encodedTwice(oc.path) && nc.path !== decodeOnce(oc.path)) warn("o", "twice", "are encoded twice", twice(oc.path), [["Decode it once", decodeOnce, true]]);
    if (lostLetter(oc.path)) warn("o", "lost", "may have lost a letter", lost(oc.path));
    // A new address with these sends visitors to a page that isn't there
    const nt = trailing(n.path);
    if (nt) bad("n", ends(n.path, nt), [["Remove it", dropTrailing, true]], "trail", "end in punctuation");
    if (encodedTwice(n.path)) bad("n", twice(n.path), [["Decode it once", decodeOnce, true]], "twice", "are encoded twice");
    if (lostLetter(n.path)) warn("n", "lost", "may have lost a letter", lost(n.path));
    if (it.state === "bad") return;

    // With full URLs, old.com/page to new.com/page is a real redirect; as paths it would point to itself
    const domainOnly = o.host && n.host && bare(o.host) !== bare(n.host);
    if (!external && !(domainOnly && opts.newAddr === "url")) {
      if (domainOnly && key(oc.path) === key(nc.path)) return out("n", "Only the domain changes", "domain-only");
      if (oc.path === nc.path) return out("n", "Points to itself");
      // Where the platform is known to match both as one address, a row that only changes its last / or capitals loops
      if (same(oc.path) === same(nc.path)) {
        const d = looseDiff(oc.path, nc.path), what = d.caps ? "capitals" : "the last /";
        return bad("n", `Would loop: ${why(d)}`, [], d.caps ? "capsloop" : "slashloop", `would loop: only ${what} ${d.caps ? "differ" : "differs"}`, "Leave it out");
      }
      if (!fmt.exact && loose(oc.path) === loose(nc.path)) {
        const d = looseDiff(oc.path, nc.path);
        notes.push({ cell: "n", kind: "warn", group: "n:slashcase", leave: "Leave it out",
          title: "differ from their old address only by a / or capital",
          text: `Only ${d.caps && d.slash ? "capitals and the last / differ" : d.caps ? "capitals differ" : "the last / differs"} from the old address. May be one page ${on}` });
      }
    }
    live.push({ id: r.id, raw: r.new, it, from: oc.path, to, own: !external, internal: !external && !(domainOnly && opts.newAddr === "url"), fix, bad, out });
  });

  // The same old address on more than one row (or one the platform matches as the same): to the same page, the
  // repeats are dropped; to different pages, each row is a duplicate to delete until one is left
  const groups = new Map();
  for (const l of live) (groups.get(same(l.from)) || groups.set(same(l.from), []).get(same(l.from))).push(l);
  const rowList = (ls) => { const n = ls.map((x) => x.it.n); return (n.length > 1 ? "rows " : "row ") + (n.length > 1 ? `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}` : n[0]); };
  const kept = [];
  for (const [k, g] of groups) {
    if (g.length === 1) { kept.push(g[0]); continue; }
    const distinct = new Set(g.map((l) => l.to));
    if (distinct.size === 1) {
      kept.push(g[0]);
      g.slice(1).forEach((l) => l.out("o", `Same as row ${g[0].it.n}`));
      continue;
    }
    for (const l of g) {
      const others = g.filter((x) => x !== l), differ = others.filter((x) => x.from !== l.from);
      const d = differ.reduce((a, x) => { const y = looseDiff(l.from, x.from); return { caps: a.caps || y.caps, slash: a.slash || y.slash }; }, { caps: false, slash: "" });
      l.bad("o", differ.length ? `Same address as ${rowList(others)}: ${why(d)}` : `Duplicate of ${rowList(others)}`, [], "clash", "Duplicates", "Leave this one out");
    }
  }
  // Old addresses that differ only by the last / or capitals (/about-us/ and /About-us) go in the file, marked to test
  const alike = new Map();
  for (const l of kept) (alike.get(loose(l.from)) || alike.set(loose(l.from), []).get(loose(l.from))).push(l);
  for (const g of alike.values()) {
    if (g.length < 2 || fmt.exact) continue;
    for (const l of g) {
      const others = g.filter((x) => x !== l), ds = others.map((x) => looseDiff(l.from, x.from));
      const d = ds.every((x) => x.slash === ds[0].slash && x.caps === ds[0].caps) ? ds[0] : null;
      const how = d ? [d.caps && "with different capitals", d.slash && `${d.slash} the last /`].filter(Boolean).join(" and ") : "with a different / or capitals";
      const who = rowList(others).replace(/^r/, "R");
      l.it.notes.push({ cell: "o", kind: "warn", group: "o:alike", leave: "Leave this one out", title: "may share an address with another row",
        text: `${who} ${others.length > 1 ? "have" : "has"} it ${how}. May be one page ${on}` });
    }
  }

  // Chains (A → B, then B → C) go in the file as typed, so the visitor stays in charge of their redirects; both rows
  // are marked to check, and a button sends A straight to C. A chain that comes back round is a loop.
  const map = new Map(kept.map((l) => [key(l.from), l]));
  const ends = new Map(), into = new Map();   // a new address as typed → the end of its chain; a row → rows leading in
  const straight = [["Point to the end", (v) => ends.get(v) ?? v]];   // the note names where it ends, so the button stays short
  const ready = [];
  for (const l of kept) {
    let to = l.to, internal = l.internal, hops = [];
    const seen = new Set([key(l.from)]);
    let loop = false;
    while (internal) {
      const next = map.get(key(to.split("#")[0]));
      if (!next || (next === l && !hops.length)) break;   // a row that only changes its last / or capitals is marked to test, not a loop
      if (seen.has(key(next.from))) { loop = true; break; }
      seen.add(key(next.from)); hops.push(next); to = next.to; internal = next.internal;
      if (hops.length > 50) { loop = true; break; }
    }
    if (loop) { l.bad("n", `Loop: rows ${[l, ...hops].map((h) => h.it.n).join(" → ")} → back here`, [], "loop", "A loop"); continue; }
    if (hops.length) {
      ends.set(l.raw, to);
      (into.get(hops[0]) || into.set(hops[0], []).get(hops[0])).push(l);
      const by = hops.length > 1 ? `rows ${hops.slice(0, -1).map((h) => h.it.n).join(", ")} and ${hops[hops.length - 1].it.n} send` : `row ${hops[0].it.n} sends`;
      l.it.notes.push({ cell: "n", kind: "warn", fixes: straight, group: "n:chain", title: "start a redirect chain",
        text: `Redirect chain${hops.length > 1 ? ` (${hops.length + 1} hops)` : ""}: ${by} this on to <code>${esc(to)}</code>` });
    }
    if (!l.own || opts.newAddr !== "url") ready.push({ id: l.id, from: l.from, to: l.to, code: opts.code || "301" });
    else ready.push({ id: l.id, from: l.from, to: site ? site.replace(/\/$/, "") + l.to : l.to, code: opts.code || "301" });
  }
  // The row a chain runs through says who leads into it
  for (const [h, ls] of into) {
    const n = ls.map((x) => x.it.n);
    h.it.notes.push({ cell: "o", kind: "warn", text: `Redirect chain: ${n.length > 1 ? `rows ${n.slice(0, -1).join(", ")} and ${n[n.length - 1]} point here` : `row ${n[0]} points here`}` });
  }

  // The platform's own limits
  for (const r of ready) {
    const problems = (fmt.rules?.(r) || []).filter(Boolean);
    // A website platform always has a home page, and its redirects only run for addresses that don't exist
    if (r.from === "/" && !["Hosting and servers", "Other"].includes(fmt.group) && !problems.length) problems.push({ cell: "o", id: "home", text: "Can’t redirect the home page" });
    // An address with no letters or numbers (/,,., or a stray /-) is allowed, but almost never a real page
    const noWords = (a) => { const p = a.split(/[?#]/)[0]; return p !== "/" && !/^https?:/i.test(a) && !/[a-z0-9]/i.test(p); };
    if (noWords(r.from)) problems.push({ cell: "o", warn: true, text: "Doesn’t look like a page address" });
    if (noWords(r.to)) problems.push({ cell: "n", warn: true, text: "Doesn’t look like a page address" });
    const l = live.find((x) => x.id === r.id);
    for (const p of problems) {
      if (p.warn) l.it.notes.push({ cell: p.cell, kind: "warn", text: p.text });   // said, but the row still goes in
      else l.bad(p.cell, p.text, p.fixes || [], "rule-" + p.id, p.title || p.text, "Leave it out");
    }
  }

  // Files, feeds and system addresses sent to a page, said on rows the platform hasn't already refused. leaveAll: the
  // line above the sheet offers to leave them all out, as a crawl can list dozens
  const going = ready.map((r) => live.find((x) => x.id === r.id)).filter((l) => l.it.state !== "bad");
  for (const l of going) {
    const p = l.from.split("?")[0], to = l.to.split(/[?#]/)[0];
    const kind = NOT_PAGES.find(([re]) => re.test(p) || re.test(l.from));
    if (kind && !kind[0].test(to.replace(/^https?:\/\/[^/]+/i, ""))) {
      l.it.notes.push({ cell: "o", kind: "warn", group: "o:notpage:" + kind[1], title: kind[3], text: kind[2], leave: "Leave it out", leaveAll: true });
    } else if (FILE_EXT.test(p) && !FILE_EXT.test(to)) {
      l.it.notes.push({ cell: "o", kind: "warn", group: "o:notpage:file", title: "are files, not pages", text: `A ${esc(p.match(FILE_EXT)[0].toLowerCase())} file, not a page`, leave: "Leave it out", leaveAll: true });
    }
  }
  // One page listed with several ? parts (?page=2, ?sort=price), all sent to one place, without the page itself: most
  // likely one redirect, which removing the ? parts makes (the repeats are then left out as the same as the first)
  const variants = new Map();
  for (const l of going) {
    const [p, q] = l.from.split("?");
    if (q === undefined || p === "/" || BY_QUERY.test(p) || olds.has(p)) continue;
    (variants.get(p) || variants.set(p, []).get(p)).push(l);
  }
  for (const [p, g] of variants) {
    if (g.length < 2 || new Set(g.map((l) => l.to)).size > 1) continue;
    for (const l of g) {
      const others = g.filter((x) => x !== l), who = rowList(others).replace(/^r/, "R");
      l.it.notes.push({ cell: "o", kind: "warn", group: "o:variants", title: "are one page with different ? parts", fixes: [["Remove the ? part", dropQuery, true]],
        text: `${who} ${others.length > 1 ? "have" : "has"} this page with another ? part, and <code>${esc(p)}</code> itself isn’t in the sheet` });
    }
  }

  // A row that needs the visitor shows only what's wrong: what the file would say comes once it's fixed
  const done = {};
  for (const it of items.values()) {
    if (it.state === "bad") it.notes = it.notes.filter((x) => x.kind !== "fix");
    else if (it.state === "ok" || it.state === "fixed") {
      if (it.notes.some((x) => x.kind === "warn")) it.state = "warn";
      for (const k of it.routine) done[k] = (done[k] || 0) + 1;
    }
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
    const cols = fmt.cols(opts.statusCol ? opts.code : "", opts);
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
  // No tabs, commas or semicolons: columns copied from an email or PDF are separated by spaces instead
  if (!count("\t") && !count(",") && !count(";")) {
    const lines = text.split(/\r?\n/).filter((l) => tidy(l));
    // Two values with one space between them: an address, then an address or an instruction ("disregard"); a single
    // address with a space in it (/our team) isn't split
    const pairs = lines.every((l) => {
      const [a, b, more] = tidy(l).split(/\s+/);
      return b && !more && looksLikeAddress(a) && (looksLikeAddress(b) || /^https?:|^www\./i.test(b) || JUNK.test(b));
    });
    if (pairs) return lines.map((l) => tidy(l).split(/\s+/));
    if (lines.some((l) => /\S {2,}\S/.test(l))) return lines.map((l) => tidy(l).split(/ {2,}/));
  }
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
  // Each row keeps its place in the sheet, so the numbers shown match the spreadsheet's even past a blank row
  rows.forEach((r, i) => (r.at = i));
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
