// Redirect Import tests: tricky addresses, each platform's documented rules and the audit-export traps, run through
// the real checks and file writer (site/redirects/js/core.js and formats.js). Run by .github\build\check.py (node
// .github/scripts/redirects.test.mjs), locally and on GitHub. Each failure prints a line starting FAIL. When a result
// should change, agree it first (the decisions are in .claude/rules/redirect-import.md), then update it here.
import { pathToFileURL, fileURLToPath } from "url";
import path from "path";
const js = path.join(path.dirname(fileURLToPath(import.meta.url)),"..", "..", "site", "redirects", "js");
const { analyse, writeFile, parseDelimited, pickColumns } = await import(pathToFileURL(path.join(js, "core.js")));
const { byId } = await import(pathToFileURL(path.join(js, "formats.js")));

let fail = 0, count = 0;
const plain = (s) => s.replace(/<[^>]+>/g, "");
function check(label, ok, got) {
  count++;
  if (!ok) { fail++; console.log(`FAIL ${label}${got === undefined ? "" : `: got ${got}`}`); }
}
const sheet = (pairs) => pairs.map(([o, n], i) => ({ id: i + 1, old: o, new: n, n: i + 2 }));
const notesOf = (it) => it.notes.map((x) => plain(x.text)).join(" | ");

// ── Tricky addresses (Shopify), each beside a row on new.com so new.com counts as the site's own ─────────────────
// [old, new, state, the line in the file or a fragment of a note]
const edge = [
  ["/a", "/b", "ok", "/a,/b"],
  ["  /a  ", " /b ", "ok", "/a,/b"],
  ["/a ", "/b", "ok", "/a,/b"],
  ["/a​", "/b", "ok", "/a,/b"],
  ["www.old.com/a", "/b", "fixed", "/a,/b"],
  ["old.com/a", "new.com/b", "fixed", "/a,/b"],
  ["//old.com/a", "/b", "fixed", "/a,/b"],
  ["HTTPS://OLD.COM/A", "/b", "fixed", "/A,/b"],
  ["https://old.com", "/b", "bad", "home page"],
  ["https://old.com/?p=123", "/b", "warn", "/?p=123,/b"],
  ["/a?utm_source=x&utm_medium=y", "/b", "fixed", "/a,/b"],
  ["/a?id=1&fbclid=z", "/b", "warn", "/a?id=1,/b"],
  ["/a#top", "/b", "fixed", "/a,/b"],
  ["/a", "/b#section", "ok", "/a,/b#section"],
  ["/a", "https://other.org/b", "ok", "/a,https://other.org/b"],
  ["/a", "mailto:x@y.com", "bad", "mailto"],
  ["/a", "tel:123", "bad", "tel"],
  ["javascript:alert(1)", "/b", "bad", "javascript"],
  ["/a", "N/A", "out", "Marked"],
  ["TBD", "/b", "out", "Marked"],
  ["/a", "-", "out", "Marked"],
  ["about-us", "pages/about", "warn", "/about-us,/pages/about"],
  ["index.php?id=4", "/b", "warn", "/index.php?id=4,/b"],
  ["/old page.html", "/b", "bad", "space"],
  ["/a\tb", "/b", "bad", "line break"],
  ["/a", "/b—c", "bad", "long dash"],
  ["/it’s", "/b", "bad", "Curly"],
  ["/a|b", "/b", "bad", "Not allowed"],
  ["/a%2", "/b", "bad", "%"],
  ["/a%20b", "/b", "ok", "/a%20b,/b"],
  ["/naïve-über", "/b", "fixed", "/na%C3%AFve-%C3%BCber,/b"],
  ["/日本語", "/b", "fixed", "/%E6%97%A5%E6%9C%AC%E8%AA%9E,/b"],
  ["/emoji-😀", "/b", "fixed", "/emoji-%F0%9F%98%80,/b"],
  ["https://bücher.de/a", "/b", "bad", "domain"],
  ["https://old.com:8080/a", "/b", "fixed", "/a,/b"],
  // A / or capital is the visitor's call: marked to test, never merged (2 Nov)
  ["/a", "/a/", "warn", "the last / differs"],
  ["/A", "/a", "warn", "capitals differ"],
  ["/a", "https://new.com/a", "out", "itself"],
  ["/a,b", "/c", "ok", '"/a,b",/c'],
  ["/a\"b", "/c", "bad", "Not allowed"],
  ["", "", "blank", ""],
  ["/only-old", "", "bad", "No new address"],
  ["", "/only-new", "bad", "No old address"],
];
for (const [o, n, want, expect] of edge) {
  const res = analyse([{ id: 1, old: o, new: n }, { id: 2, old: "/zz-anchor", new: "https://new.com/zz" }], byId("shopify"), { code: "301", newAddr: "path" });
  const it = res.items.get(1);
  const line = writeFile(res.ready.filter((r) => r.id === 1), byId("shopify"), { code: "301", sep: ",", statusCol: false }).body;
  const notes = notesOf(it);
  check(`edge ${JSON.stringify(o)} -> ${JSON.stringify(n)}`, it.state === want && (!expect || line === expect || notes.toLowerCase().includes(expect.toLowerCase())), `${it.state} [${line}] ${notes}`);
}

// ── Reading pasted text and files ──────────────────────────────────────────────────────────────────────────────
// A real-world CSV: BOM, CRLF, quoted commas and line breaks, trailing empty columns, a status column first
let raw = parseDelimited('﻿"Status","From","To",,\r\n301,"/a,b","/c",,\r\n301,/d,"/e\r\nf",,\r\n,,,,\r\n301,/g,/h,,\r\n');
let pick = pickColumns(raw);
check("csv columns", pick.o === 1 && pick.n === 2 && pick.header, JSON.stringify(pick));
check("csv quoted comma", raw[1][1] === "/a,b", raw[1][1]);
check("csv blank row keeps its place", raw[3].at === 4, raw[3].at);
check("no header", !pickColumns(parseDelimited("/a\t/b\n/c\t/d")).header);
// "disregard" and other instruction words, pasted the ways they arrive
const words = {
  "two columns": "Old\tNew\nhttps://blahblahblah.com/blahblah\tdisregard\n/keep-me\t/kept",
  "many spaces (email or PDF)": "https://blahblahblah.com/blahblah           disregard\n/keep-me           /kept",
};
for (const [label, text] of Object.entries(words)) {
  raw = parseDelimited(text); pick = pickColumns(raw);
  const rows = raw.slice(pick.header ? 1 : 0).map((r, i) => ({ id: i + 1, old: r[pick.o] ?? "", new: r[pick.n] ?? "" }));
  const res = analyse(rows, byId("shopify"), { code: "301", newAddr: "path" });
  check(`disregard, ${label}`, res.items.get(1).state === "out" && res.items.get(2).state === "ok", [...res.items.values()].map((x) => x.state).join(","));
}
{
  const res = analyse(sheet([["/a", "delete"], ["/b", "ignore"], ["/c", "no redirect"], ["/d", "keep"], ["/e", "404"], ["/f", "DO NOT REDIRECT"], ["/g", "skip"], ["/h", "/real-page"]]), byId("shopify"), { code: "301", newAddr: "path" });
  check("instruction words", [...res.items.values()].map((x) => x.state).join(",") === "out,out,out,out,out,out,out,ok", [...res.items.values()].map((x) => x.state).join(","));
}

// ── Junk-looking addresses and cut-short ones ──────────────────────────────────────────────────────────────────
const junk = [
  ["shopify", "/,,,,.::;;", "/collections/sale2024", "warn"], ["shopify", "/-", "/pages/a", "warn"], ["shopify", "/.", "/pages/a", "warn"],
  ["shopify", "/a;b", "/pages/a", "warn"], ["shopify", "/old", "/new;x", "warn"], ["shopify", "/2024", "/news", "ok"],
  ["shopify", "/café", "/menu", "fixed"], ["shopify", "/old", "/", "ok"], ["wix", "/a;b", "/pages/a", "ok"], ["wix", "/---", "/pages/a", "warn"],
  ["wix", "/?id=5", "/pages/a", "ok"], ["netlify", "/old", "https://other.org/", "ok"],
];
for (const [id, o, n, want] of junk) {
  const it = analyse([{ id: 1, old: o, new: n }], byId(id), { code: "301", newAddr: "path" }).items.get(1);
  check(`junk ${id} ${o} -> ${n}`, it.state === want, `${it.state} ${notesOf(it)}`);
}
const cut = [
  ["https://www.site.com/blog/how-to-choose-a…", "/blogs/news/choosing", "bad"], ["https://www.site.com/…/how-to-choose", "/x", "bad"],
  ["/blog/post...", "/x", "bad"], ["/old", "https://www.site.com/collections/summ…", "bad"], ["/v1.2/page", "/x", "ok"], ["/a..b", "/x", "ok"],
];
for (const [o, n, want] of cut) {
  const rows = [{ id: 1, old: o, new: n }, { id: 2, old: "/z1", new: "https://www.site.com/z" }, { id: 3, old: "/z2", new: "https://www.site.com/y" }];
  const it = analyse(rows, byId("shopify"), { code: "301", newAddr: "path" }).items.get(1);
  check(`cut short ${o} -> ${n}`, it.state === want, `${it.state} ${notesOf(it)}`);
}

// ── Preview and staging sites ──────────────────────────────────────────────────────────────────────────────────
const previews = [
  ["https://acme-store-2.myshopify.com/products/blue-mug", "bad", "/products/blue-mug"],
  ["https://acme.com/products/blue-mug?preview_theme_id=1234567", "bad", "https://acme.com/products/blue-mug"],
  ["https://acme-new.webflow.io/about", "bad", "/about"], ["https://jane1234.wixsite.com/acme/about", "bad", "/about"],
  ["https://lemur-yellow-abc1.squarespace.com/contact", "bad", "/contact"], ["https://acmestg.wpengine.com/services/", "bad", "/services/"],
  ["https://staging-acme.kinsta.cloud/blog/", "bad", "/blog/"], ["https://acme-1234567.hs-sites.com/pricing", "bad", "/pricing"],
  ["https://acme.multiscreensite.com/menu", "bad", "/menu"], ["https://deploy-preview-42--acme.netlify.app/about", "bad", "/about"],
  ["https://acme-git-redesign.vercel.app/about", "bad", "/about"], ["https://acme.netlify.app/about", "warn", "/about"],
  ["https://staging.acme.com/team", "warn", "/team"], ["https://dev.acme.com/team", "warn", "/team"], ["https://new.acme.com/team", "warn", "/team"],
  ["http://localhost:3000/team", "bad", "/team"], ["http://acme.local/team", "bad", "/team"],
  ["https://www.acme.com/team", "ok", null], ["https://newsletter.acme.com/join", "ok", null], ["/page?preview=true&id=4", "bad", "/page?id=4"],
];
for (const [n, want, fixed] of previews) {
  const rows = [{ id: 1, old: "/old", new: n }, { id: 90, old: "/z1", new: "/pages/z1" }, { id: 91, old: "/z2", new: "/pages/z2" }];
  const it = analyse(rows, byId("shopify"), { code: "301", newAddr: "path" }).items.get(1);
  const fixNote = it.notes.find((x) => x.fixes?.length), after = fixNote ? fixNote.fixes[0][1](n) : null;
  check(`preview ${n}`, it.state === want && (fixed === null || after === fixed), `${it.state} fix ${after}`);
}
{
  // A whole sheet mapped on a Wix preview: the preview is the main domain, so it's removed as routine with Wix's folder
  const res = analyse(sheet([["/a", "https://jane.wixsite.com/acme/about"], ["/b", "https://jane.wixsite.com/acme/contact"]]), byId("wix"), { code: "301", newAddr: "path" });
  check("whole sheet on a Wix preview", res.ready.map((r) => r.to).join(" ") === "/about /contact" && res.done["n:preview"] === 2, JSON.stringify(res.ready));
}

// ── Each platform's documented rules and file ──────────────────────────────────────────────────────────────────
function run(id, pairs, opts = {}) {
  const fmt = byId(id);
  const o = { code: "301", newAddr: "path", sep: ",", statusCol: fmt.codes === "required", ...opts };
  const res = analyse(sheet(pairs), fmt, o), w = writeFile(res.ready, fmt, o);
  return { text: (fmt.kind === "csv" ? w.header + "\n" : "") + w.body, body: w.body, state: (i) => res.items.get(i).state, notes: (i) => notesOf(res.items.get(i)) };
}
let r = run("shopify", [["/shop/mugs", "/x"], ["/products", "/x"], ["/products/old-shirt", "/products/new-shirt"], ["/shopping-guide", "/x"],
  ["/collections/all", "/x"], ["/collections/summer", "/collections/sun"], ["/a/b", "/x"], ["/page?id=3", "/x"], ["/about.html", "/about"], ["/cart", "/x"]]);
["bad", "bad", "ok", "ok", "bad", "ok", "bad", "warn", "bad", "bad"].forEach((s, i) => check(`shopify row ${i + 1}`, r.state(i + 1) === s, `${r.state(i + 1)} ${r.notes(i + 1)}`));
check("shopify ? row still in the file", r.text.includes("/page?id=3,/x"));
check("shopify header", r.text.split("\n")[0] === "Redirect from,Redirect to", r.text.split("\n")[0]);

r = run("duda", [["/café", "/menu"], ["/a%20b", "/x"], ["/page?x=1", "/y"], ["/old.php", "/new"], ["/fine", "/good"]]);
check("duda header", r.text.split("\n")[0] === "Old Page URL,Destination Page URL,Redirect Type", r.text.split("\n")[0]);
check("duda keeps é", r.text.includes("/café,/menu,301"));
["ok", "bad", "bad", "bad", "ok"].forEach((s, i) => check(`duda row ${i + 1}`, r.state(i + 1) === s, `${r.state(i + 1)} ${r.notes(i + 1)}`));

r = run("webflow", [["/old-page_1/?id=3&b=(x)", "/new"], ["/simple", "/new-2"], ["/spring%-sale", "/sale"]]);
check("webflow escaped", r.body.split("\n")[0] === "/old%-page%_1%?id%=3%&b%=%(x%),/new", r.body.split("\n")[0]);
check("webflow plain", r.body.split("\n")[1] === "/simple,/new-2", r.body.split("\n")[1]);
check("webflow export read back and escaped once", r.body.split("\n")[2] === "/spring%-sale,/sale", r.body.split("\n")[2]);
check("webflow header off by default", byId("webflow").headerOff === true);

// HubSpot: its sample file's columns, a ? part matched only where the row has one, and the last / ignored as by
// default, so a row that only adds or drops it loops
r = run("hubspot", [["/a", "/b"], ["/page?id=2", "/c"], ["/about", "/about/"]]);
check("hubspot file", r.text === "original url,redirect to,redirect type,redirect style,match query strings,ignore trailing slash\n/a,/b,STANDARD,301,FALSE,TRUE\n/page?id=2,/c,STANDARD,301,TRUE,TRUE", r.text);
check("hubspot last / loops", r.state(3) === "bad" && r.notes(3).includes("Would loop"), `${r.state(3)} ${r.notes(3)}`);
r = run("hubspot", [["/" + "a".repeat(140), "/b"]]);
check("hubspot 140 characters", r.state(1) === "bad", r.state(1));

r = run("bigcommerce", [["/a", "/b"]], { domain: "shop.example.com" });
check("bigcommerce", r.text === "Domain,Old Path,Manual URL/Path,Dynamic Target Type,Dynamic Target ID\nshop.example.com,/a,/b,,", r.text);

r = run("redirection", [["/old-(2019)", "/new"]]);
check("redirection regex 0", r.text === "source,target,regex,code\n/old-(2019),/new,0,301", r.text);

r = run("rankmath", [["/a", "/b"]]);
check("rank math, no status column unless asked", r.text === "source,destination\n/a,/b", r.text);
r = run("rankmath", [["/a", "/b"]], { statusCol: true });
check("rank math with status", r.text === "source,destination,type\n/a,/b,301", r.text);
r = run("yoast", [["/a", "/b"]]);
check("yoast", r.text === "Origin,Target,Type,Format\n/a,/b,301,plain", r.text);

r = run("vercel", [["/a", "/b"]]);
check("vercel status", JSON.parse(r.text).redirects[0].statusCode === 301, r.text);
r = run("vercel-bulk", [["/a", "/b"], ["/q?x=1", "/c"]]);
check("vercel bulk", r.text.split("\n").slice(0, 2).join(" / ") === "source,destination,statusCode / /a,/b,301", r.text);
check("vercel bulk ? refused", r.state(2) === "bad");

r = run("squarespace", [["/files/menu.pdf", "/menu"], ["/menu", "/food"]]);
check("squarespace pdf", r.state(1) === "bad");
check("squarespace line", r.body === "/menu -> /food 301", r.body);

r = run("netlify", [["/Old?x=1", "/new"], ["/Old", "/new"], ["/page", "/page/"]]);
check("netlify ?", r.state(1) === "bad");
check("netlify case kept", r.body === "/Old  /new  301", r.body);
check("netlify last / loops", r.state(3) === "bad");

r = run("apache", [["/a b", "/c"]]);
check("apache pattern", r.body === 'RedirectMatch 301 "^/a b/?$" /c' || r.state(1) === "bad", r.body);
r = run("nginx", [["/a", "/a/"]]);
check("nginx exact, so a last / isn't marked", r.state(1) === "ok", `${r.state(1)} ${r.notes(1)}`);

// ── Audit-export traps: [old, new, platform, state, a word the note should hold] ───────────────────────────────
const traps = [
  ["/page.", "/new-page", "plain", "warn", "Punctuation at the end"], ["/page.", "/page", "plain", "ok", ""],
  ["/page),", "/new", "plain", "warn", "<mark>),</mark>"], ["/wiki/Foo_(bar)", "/new", "plain", "ok", ""],
  ["/old", "/new-page.", "plain", "bad", "Punctuation at the end"], ["/old", "https://other.com/page;", "plain", "bad", "Punctuation"],
  ["/old", "/new...", "plain", "bad", "Cut short"], ["/page.?utm_source=x", "/new", "plain", "warn", "Punctuation"],
  ["/file.pdf", "/files/menu.pdf", "plain", "ok", ""],
  ["/my%2520page", "/my-page", "plain", "warn", "Encoded twice"], ["/my%2520page", "/my%20page", "plain", "ok", ""],
  ["/old", "/my%2520page", "plain", "bad", "Encoded twice"], ["/50%25off", "/sale", "plain", "ok", ""],
  ["/caf%25C3%25A9", "/cafe", "plain", "warn", "Encoded twice"],
  ["/cafÃ©-menu", "/menu", "plain", "bad", "Garbled letters"], ["/old", "/rÃ©sumÃ©", "plain", "bad", "Garbled letters"],
  ["/zażółć", "/new", "plain", "ok", ""], ["/Å‘rÃ¼lt", "/new", "plain", "bad", "Garbled"],
  ["/caf�-menu", "/menu", "plain", "bad", "lost when the file"], ["/caf?-menu", "/menu", "plain", "warn", "A ? inside a word"],
  ["/se?or-tacos", "/tacos", "plain", "warn", "A ? inside a word"], ["/page?amp", "/new", "plain", "ok", ""], ["/?p=123", "/post", "plain", "ok", ""],
  ["/sitemap.xml", "/", "plain", "warn", "A sitemap"], ["/post-sitemap.xml", "/blog", "plain", "warn", "A sitemap"],
  ["/feed/", "/blog", "plain", "warn", "A feed"], ["/blog/feed", "/rss.xml", "plain", "ok", ""],
  ["/wp-admin/", "/", "plain", "warn", "WordPress system"], ["/wp-json/wp/v2/posts", "/blog", "plain", "warn", "WordPress system"],
  ["/xmlrpc.php", "/", "plain", "warn", "WordPress system"], ["/wp-content/uploads/2020/05/photo.jpg", "/gallery", "plain", "warn", ".jpg file"],
  ["/wp-content/uploads/menu.pdf", "https://cdn.shopify.com/s/files/menu.pdf", "plain", "ok", ""],
  ["/robots.txt", "/", "plain", "warn", "robots.txt"], ["/.well-known/apple-app-site-association", "/", "plain", "warn", "server address"],
  ["/photo.jpg", "/gallery", "squarespace", "bad", "Squarespace can’t redirect files"], ["/about", "/about-us", "plain", "ok", ""],
];
for (const [o, n, p, state, word] of traps) {
  const it = analyse([{ id: 1, old: o, new: n, n: 2 }], byId(p), { code: "301", newAddr: "path" }).items.get(1);
  const text = it.notes.map((x) => x.text).join(" | "), st = it.state === "fixed" ? "ok" : it.state;
  check(`trap ${o} -> ${n} (${p})`, st === state && (!word || text.includes(word)) && (word || !it.notes.some((x) => x.kind === "warn" || x.kind === "bad")), `${it.state} ${text}`);
}
const items = (pairs, p = "plain") => analyse(sheet(pairs), byId(p), { code: "301", newAddr: "path" }).items;
const variants = (it) => it.get(1).notes.some((x) => x.group === "o:variants");
check("query variants", items([["/shoes?page=2", "/footwear"], ["/shoes?sort=price", "/footwear"], ["/about", "/about-us"]]).get(1).notes.some((x) => x.group === "o:variants" && x.text.includes("Row 3 has")));
check("query variants with the page itself", !variants(items([["/shoes?page=2", "/footwear"], ["/shoes?sort=price", "/footwear"], ["/shoes", "/footwear"]])));
check("query variants to different pages", !variants(items([["/shoes?color=red", "/red-shoes"], ["/shoes?color=blue", "/blue-shoes"]])));
check("query variants of a .php page", !variants(items([["/index.php?id=5", "/a"], ["/index.php?id=6", "/a"]])));
{ const it = items([["/shoes?page=2", "/footwear"], ["/shoes?sort=price", "/footwear"]], "netlify"); check("query variants where ? is refused", it.get(1).state === "bad" && !variants(it)); }
const fixOf = (o, n, cell = "o") => { const x = items([[o, n]]).get(1).notes.find((x) => x.cell === cell && x.fixes?.length); return x ? x.fixes[0][1](cell === "o" ? o : n) : null; };
for (const [got, want] of [
  [fixOf("/page.", "/new"), "/page"], [fixOf("https://old.com/page.?utm_source=x", "/new"), "https://old.com/page?utm_source=x"],
  [fixOf("/my%2520page", "/new"), "/my%20page"], [fixOf("/cafÃ©-menu", "/new"), "/café-menu"],
  [fixOf("/old", "/rÃ©sumÃ©", "n"), "/résumé"], [fixOf("/old", "/new-page.", "n"), "/new-page"],
]) check(`fix gives ${want}`, got === want, got);
check("repeats left out as the same", items([["/shoes", "/footwear"], ["/shoes", "/footwear"]]).get(2).state === "out");

// ── Chains, duplicates and capitals ────────────────────────────────────────────────────────────────────────────
let it = items([["/a", "/b"], ["/b", "/c"]], "shopify");
check("chain marked on both rows", it.get(1).state === "warn" && it.get(2).state === "warn" && plain(it.get(1).notes[0].text).includes("row 3 sends this on to /c"), notesOf(it.get(1)));
check("chain fix points to the end", it.get(1).notes[0].fixes[0][1]("/b") === "/c");
it = items([["/a", "/b"], ["/b", "/a"]], "shopify");
check("loop", it.get(1).state === "bad" && notesOf(it.get(1)).includes("Loop"), notesOf(it.get(1)));
it = items([["/a", "/b"], ["/a", "/c"]], "shopify");
check("duplicate to different pages", it.get(1).state === "bad" && notesOf(it.get(1)).includes("Duplicate of row 3"), notesOf(it.get(1)));
it = items([["/about-us/", "/x"], ["/About-us", "/y"]], "shopify");
check("alike old addresses marked, not merged", it.get(1).state === "warn" && it.get(2).state === "warn", notesOf(it.get(1)));

console.log(fail ? `${fail} of ${count} Redirect Import tests failed` : `All ${count} Redirect Import tests passed`);
process.exit(fail ? 1 : 0);
