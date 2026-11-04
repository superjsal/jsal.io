// What each platform imports, checked against each platform's own help page and, where it has one, its sample file
// (doc). kind: "csv" (columns, a header row and a separator the visitor can change), "lines" (one line of text per
// redirect), or a whole file written by write(). codes: false when the platform has no status setting, "optional"
// or "required". slashSame: chains are followed as if /page and /page/ were one address. slashLoop: /page and
// /page/ are known to match as one, so a row from one to the other loops and two rows with them are one address.
// capsExact: capitals are documented to matter, so /About and /about are different addresses. capsSame: capitals are
// documented to be ignored, like slashLoop for the last /. exact: the match is documented as exact, so addresses
// differing by a / or capital are never marked as maybe the same. short: the name notes use. keepLetters: accented letters stay
// as typed, for a platform that rejects any %. caution: what could go wrong on import, and note: worth knowing,
// both said above the file. A file that strays from the help page (another separator, header row or names) gets a
// caution. seps: the only separators the importer reads, where its code says so. heads: the names it accepts for each
// of the first columns, where it skips only a header row that uses them. anyHead: the help names no columns. fixedName: the
// platform reads the file by its name, so it can't be renamed. unescape: turns an old path in the platform's own
// escaped form (from its export) back into the plain address. refs: wildcard references allowed in a new address. A rule
// with warn: true is said under the cell
// without keeping the row out of the file.

const col = (name, val) => ({ name, val });
const FROM = (n) => col(n, (r) => r.from);
const TO = (n) => col(n, (r) => r.to);
const CODE = (n) => col(n, (r) => r.code);

// Apache and nginx match the decoded path, so their patterns are written decoded, and quoted when they hold a space
const decoded = (p) => { try { return decodeURIComponent(p); } catch (e) { return p; } };
const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const quoteIfSpace = (s) => (/\s/.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s);
const yamlQuote = (s) => `'${s.replace(/'/g, "''")}'`;
const noSlash = (p) => (p.length > 1 ? p.replace(/\/$/, "") : p);
// The one-click fix for a platform that can't match what comes after ?: drop that part from the cell
const DROP_QUERY = [["Remove the ? part", (s) => s.replace(/\?[^#]*/, ""), true]];
const QUERY = (name) => ({ cell: "o", id: "query", fixes: DROP_QUERY, text: `${name} can’t redirect a ? address` });
// Webflow's old paths escape these characters with %, and a / just before ? stops the redirect firing. (.*) is its
// wildcard, kept as written; paths from its own export arrive escaped, so they're read back plainly first
const WEBFLOW_SPECIAL = /[%\-&*()=_+?]/g;
const webflowPath = (p) => p.replace(/\/(?=\?)/, "").split(/(\(\.\*\))/)
  .map((s, i) => (i % 2 ? s : s.replace(WEBFLOW_SPECIAL, "%$&"))).join("");
// Shopify: paths it keeps for itself (whole path segments), and its fixed list pages
const SHOPIFY_PREFIX = /^\/((apps|application|cart|carts|orders|services|shop)(\/|\?|$)|(a|community|tools)\/)/i;
const SHOPIFY_FIXED = /^\/(products|collections|collections\/all|collections\/vendors|collections\/types)\/?$/i;

export const FORMATS = [
  { id: "shopify", name: "Shopify", group: "Website platforms", kind: "csv", file: "shopify-redirects.csv",
    caution: "A redirect only works once the old page is gone and shows Page not found.",
    doc: "https://help.shopify.com/en/manual/online-store/menus-and-links/url-redirect",
    cols: () => [FROM("Redirect from"), TO("Redirect to")], codes: false, slashSame: true,
    rules: (r) => [
      SHOPIFY_PREFIX.test(r.from) && { cell: "o", id: "reserved", text: `Shopify reserves <code>${r.from.match(SHOPIFY_PREFIX)[0].replace(/[/?]$/, "")}</code>: can’t redirect`, title: "start with an address Shopify reserves" },
      SHOPIFY_FIXED.test(r.from) && { cell: "o", id: "fixed", text: "Shopify’s own list page: can’t redirect" },
      /\.html$/i.test(r.from) && r.to.toLowerCase() === r.from.toLowerCase().replace(/\.html$/, "") && { cell: "n", id: "html", text: "Shopify drops .html, so this points to itself" },
      r.from.includes("?") && { cell: "o", id: "query", warn: true, text: "? may not work on Shopify" },
      // From a third-party test of 100 address formats: the only one Shopify's import refused had a semicolon
      (r.from.includes(";") || r.to.includes(";")) && { cell: r.from.includes(";") ? "o" : "n", id: "semicolon", warn: true, text: "; may not import on Shopify" },
    ] },
  { id: "wix", name: "Wix", group: "Website platforms", kind: "csv", file: "wix-redirects.csv", limit: 500,
    doc: "https://support.wix.com/en/article/importing-or-exporting-url-redirects-with-a-csv-file",
    cols: () => [FROM("Old URL"), TO("New URL")], codes: false, slashSame: true, anyHead: true },
  { id: "squarespace", name: "Squarespace", group: "Website platforms", kind: "lines", file: "squarespace-url-mappings.txt",
    paste: true,
    caution: "A redirect only works once the old page is deleted or disabled.",
    doc: "https://support.squarespace.com/hc/en-us/articles/205815308-URL-mappings",
    line: (r) => `${r.from} -> ${r.to} ${r.code}`, codes: "required", slashSame: true,
    rules: (r) => [
      r.from.includes("?") && QUERY("Squarespace"),
      r.from === "/" && { cell: "o", id: "home", text: "Can’t redirect the home page" },
      /\.(jpe?g|png|gif|webp|svg|pdf|docx?|xlsx?|pptx?|zip|mp3|mp4|mov)$/i.test(r.from) && { cell: "o", id: "file", text: "Squarespace can’t redirect files" },
      /\?(?!format=rss$)/.test(r.to) && { cell: "n", id: "query", fixes: DROP_QUERY, text: "Squarespace allows ? here only for ?format=rss" },
    ] },
  { id: "webflow", name: "Webflow", group: "Website platforms", kind: "csv", file: "webflow-redirects.csv", headerOff: true,
    caution: "Importing deletes the redirects already in Webflow. Export them first and add them to your sheet to keep them.",
    note: "Webflow wants symbols in old paths written as % codes, so /spring-sale becomes /spring%-sale. The file does this for you.",
    doc: "https://help.webflow.com/hc/en-us/articles/33961294898835",
    unescape: (p) => p.replace(/%([%\-&*()=_+?])/g, "$1"), refs: /%[1-9]/g,
    cols: () => [col("old path", (r) => webflowPath(r.from)), TO("redirect to path")], codes: false, slashSame: true },
  { id: "framer", name: "Framer", group: "Website platforms", kind: "csv", file: "framer-redirects.csv",
    note: "Framer imports redirects through its Redirect Sync plugin.",
    doc: "https://www.framer.com/help/articles/bulk-importing-exporting-redirects/",
    cols: () => [FROM("from"), TO("to")], codes: false, slashSame: true },
  // HubSpot ignores the ? part unless a row says to match it, so a row with one matches only that address; the last /
  // is ignored, as HubSpot does by default, so /page and /page/ are one address there
  { id: "hubspot", name: "HubSpot", group: "Website platforms", kind: "csv", file: "hubspot-redirects.csv", limit: 500,
    caution: "One bad row stops the whole import, so fix everything marked first.",
    note: "To change redirects already in HubSpot, tick Overwrite existing redirects with same original URL when importing.",
    doc: "https://knowledge.hubspot.com/domains-and-urls/bulk-upload-url-redirects",
    cols: () => [FROM("original url"), TO("redirect to"), col("redirect type", () => "STANDARD"), CODE("redirect style"),
      col("match query strings", (r) => (r.from.includes("?") ? "TRUE" : "FALSE")), col("ignore trailing slash", () => "TRUE")],
    codes: "required", slashSame: true, slashLoop: true,
    rules: (r) => [
      r.from.length > 140 && { cell: "o", id: "long", text: `Over HubSpot’s 140 characters (${r.from.length})` },
      r.to.length > 140 && { cell: "n", id: "long", text: `Over HubSpot’s 140 characters (${r.to.length})` },
    ] },
  { id: "bigcommerce", name: "BigCommerce", group: "Website platforms", kind: "csv", file: "bigcommerce-redirects.csv", needsDomain: "Store domain",
    doc: "https://support.bigcommerce.com/articles/en_US/Knowledge/MSF-301-Redirects",
    cols: (code, opts) => [col("Domain", () => opts.domain || ""), FROM("Old Path"), TO("Manual URL/Path"), col("Dynamic Target Type", () => ""), col("Dynamic Target ID", () => "")],
    codes: false, slashSame: true },
  { id: "duda", name: "Duda", group: "Website platforms", kind: "csv", file: "duda-redirects.csv", limit: 200, keepLetters: true,
    note: "Duda shows Import Multiple Redirects once the site has one redirect.",
    caution: "A redirect only works once the old page is deleted.",
    doc: "https://support.duda.co/hc/en-us/articles/26519925447703-URL-Redirects",
    cols: () => [FROM("Old Page URL"), TO("Destination Page URL"), CODE("Redirect Type")], codes: "required", slashSame: true,
    rules: (r) => [
      r.from.includes("?") && QUERY("Duda"),
      r.from.includes("%") && { cell: "o", id: "percent", text: "Duda errors on any %" },
      r.to.includes("%") && { cell: "n", id: "percent", text: "Duda errors on any %" },
      /\.php/i.test(r.from) && { cell: "o", id: "php", text: "Duda can’t redirect .php addresses" },
    ] },
  { id: "ghost", name: "Ghost", group: "Website platforms", kind: "file", file: "redirects.yaml",
    caution: "Uploading replaces Ghost’s whole redirects file. Download the current one first and add these lines to it.",
    doc: "https://ghost.org/help/redirects/",
    codes: "required", slashSame: true, slashLoop: true,
    // Ghost reads each old address as a pattern, so it's escaped and pinned to the whole path, with or without its last /
    write: (rows) => {
      const by = {};
      const pattern = (p) => p.includes("?") ? `^${reEscape(p)}$` : `^${reEscape(noSlash(p))}/?$`;
      for (const r of rows) (by[r.code] ||= []).push(`  ${yamlQuote(pattern(r.from))}: ${yamlQuote(r.to)}`);
      return Object.keys(by).sort().map((c) => `${c}:\n${by[c].join("\n")}`).join("\n");
    } },

  // Redirection reads an old address with ( ) [ ] $ ^ or * as a pattern unless the regex column says 0, so it's always
  // written; the header row is the one its own export starts with, which its import skips
  { id: "redirection", name: "Redirection", label: "WordPress: Redirection", group: "WordPress plugins", kind: "csv", file: "redirection.csv",
    doc: "https://redirection.me/support/import-export-redirects/",
    cols: () => [FROM("source"), TO("target"), col("regex", () => "0"), CODE("code")],
    codes: "required", slashSame: true, seps: [",", ";", "|"], heads: [["source", "source url"], ["target", "target url"]],
    rules: (r) => {
      const letter = decoded(r.from).match(/[^\x00-\x7F]/u);
      return [letter && { cell: "o", id: "letters", warn: true, text: `<code>${letter[0]}</code> may not match on Redirection` }];
    } },
  { id: "rankmath", name: "Rank Math (Pro)", label: "WordPress: Rank Math (Pro)", group: "WordPress plugins", kind: "csv", file: "rank-math-redirects.csv",
    doc: "https://rankmath.com/kb/how-to-manage-redirects-via-csv/",
    cols: (code) => code ? [FROM("source"), TO("destination"), CODE("type")] : [FROM("source"), TO("destination")],
    codes: "optional", slashSame: true },
  { id: "yoast", name: "Yoast SEO Premium", label: "WordPress: Yoast SEO Premium", group: "WordPress plugins", kind: "csv", file: "yoast-redirects.csv",
    note: "Redirects already in Yoast are skipped, not updated.",
    doc: "https://yoast.com/help/import-redirects/",
    cols: () => [FROM("Origin"), TO("Target"), CODE("Type"), col("Format", () => "plain")], codes: "required", slashSame: true },

  { id: "netlify", name: "Netlify (_redirects)", group: "Hosting and servers", kind: "lines", file: "_redirects", fixedName: true, slashLoop: true, capsExact: true,
    note: "Netlify matches capitals exactly: /About and /about are different addresses.",
    doc: "https://docs.netlify.com/manage/routing/redirects/overview/",
    line: (r) => `${r.from}  ${r.to}  ${r.code}`, codes: "required",
    rules: (r) => [r.from.includes("?") && { cell: "o", id: "query", fixes: DROP_QUERY, text: "Netlify can’t match the ? part" }] },
  { id: "vercel", name: "Vercel (vercel.json)", group: "Hosting and servers", kind: "file", file: "vercel.json", fixedName: true, max: 2048,
    doc: "https://vercel.com/docs/routing/redirects/configuration-redirects",
    codes: "required",
    rules: (r) => [r.from.includes("?") && { cell: "o", id: "query", fixes: DROP_QUERY, text: "Vercel ignores the ? part" }],
    write: (rows) => JSON.stringify({ redirects: rows.map((r) => ({
      source: r.from.replace(/[:()*+?{}]/g, "\\$&"), destination: r.to, statusCode: +r.code })) }, null, 2) },
  // Bulk redirects ignore capitals unless a row's caseSensitive column says otherwise, and the file doesn't write it
  { id: "vercel-bulk", name: "Vercel bulk redirects (CSV)", short: "Vercel", group: "Hosting and servers", kind: "csv", file: "redirects.csv", capsSame: true,
    note: "Bulk redirects are on Vercel’s Pro and Enterprise plans.",
    doc: "https://vercel.com/docs/routing/redirects/bulk-redirects",
    cols: () => [FROM("source"), TO("destination"), CODE("statusCode")], codes: "required",
    rules: (r) => [r.from.includes("?") && { cell: "o", id: "query", fixes: DROP_QUERY, text: "Vercel ignores the ? part" }] },
  { id: "apache", name: "Apache (.htaccess)", group: "Hosting and servers", kind: "lines", file: "htaccess-redirects.txt",
    note: "Put the lines above any other rewrite rules in .htaccess.",
    doc: "https://httpd.apache.org/docs/current/mod/mod_alias.html#redirectmatch",
    line: (r) => `RedirectMatch ${r.code} ${quoteIfSpace("^" + reEscape(noSlash(decoded(r.from))) + "/?$")} ${r.to}`, codes: "required", slashSame: true, slashLoop: true,
    rules: (r) => [r.from.includes("?") && { cell: "o", id: "query", fixes: DROP_QUERY, text: "Apache can’t match the ? part" }] },
  { id: "nginx", name: "Nginx", group: "Hosting and servers", kind: "lines", file: "nginx-redirects.conf",
    doc: "https://nginx.org/en/docs/http/ngx_http_core_module.html#location",
    line: (r) => `location = ${quoteIfSpace(decoded(r.from))} { return ${r.code} ${r.to}; }`, codes: "required", exact: true,
    rules: (r) => [r.from.includes("?") && { cell: "o", id: "query", fixes: DROP_QUERY, text: "Nginx can’t match the ? part" }] },
  { id: "plain", name: "Plain CSV", label: "Not listed: plain CSV", group: "Other", kind: "csv", file: "redirects.csv",
    note: "Change the header row and separator to fit your importer.",
    cols: (code) => code ? [FROM("old"), TO("new"), CODE("status")] : [FROM("old"), TO("new")], codes: "optional" },
];

export const byId = (id) => FORMATS.find((f) => f.id === id) || FORMATS[0];
