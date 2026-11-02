// What each platform imports, checked against each platform's own help page and, where it has one, its sample file
// (doc). kind: "csv" (columns, a header row and a separator the visitor can change), "lines" (one line of text per
// redirect), or a whole file written by write(). codes: false when the platform has no status setting, "optional"
// or "required". slashSame: the platform treats /page and /page/ as one address. keepLetters: accented letters stay
// as typed, for a platform that rejects any %. caution: what could go wrong on import, and note: worth knowing,
// both said above the file. A rule with warn: true is said under the cell
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
// Webflow's old paths escape these characters with %, and a / just before ? stops the redirect firing
const webflowPath = (p) => p.replace(/\/(?=\?)/, "").replace(/[%\-&*()=_+?]/g, "%$&");
// Shopify: paths it keeps for itself (whole path segments), and its fixed list pages
const SHOPIFY_PREFIX = /^\/((apps|application|cart|carts|orders|services|shop)(\/|\?|$)|(a|community|tools)\/)/i;
const SHOPIFY_FIXED = /^\/(products|collections|collections\/all|collections\/vendors|collections\/types)\/?$/i;

export const FORMATS = [
  { id: "shopify", name: "Shopify", group: "Website platforms", kind: "csv", file: "shopify-redirects.csv",
    where: "Content → Menus → URL redirects → Import",
    caution: "A redirect only works once the old page is gone and shows Page not found.",
    doc: "https://help.shopify.com/en/manual/online-store/menus-and-links/url-redirect",
    cols: () => [FROM("Redirect from"), TO("Redirect to")], codes: false, slashSame: true,
    rules: (r) => [
      SHOPIFY_PREFIX.test(r.from) && { cell: "o", id: "reserved", text: `Shopify reserves <code>${r.from.match(SHOPIFY_PREFIX)[0].replace(/[/?]$/, "")}</code>`, title: "start with an address Shopify reserves" },
      SHOPIFY_FIXED.test(r.from) && { cell: "o", id: "fixed", text: "Shopify’s own list page: can’t redirect" },
      /\.html$/i.test(r.from) && r.to.toLowerCase() === r.from.toLowerCase().replace(/\.html$/, "") && { cell: "n", id: "html", text: "Same page to Shopify (.html): can’t redirect" },
      r.from.includes("?") && { cell: "o", id: "query", warn: true, text: "? may not work on Shopify. Test after import" },
      // From a third-party test of 100 address formats: the only one Shopify's import refused had a semicolon
      (r.from.includes(";") || r.to.includes(";")) && { cell: r.from.includes(";") ? "o" : "n", id: "semicolon", warn: true, text: "; may not import on Shopify. Test after import" },
    ] },
  { id: "wix", name: "Wix", group: "Website platforms", kind: "csv", file: "wix-redirects.csv", limit: 500,
    where: "SEO & GEO → URL Redirect Manager → More Actions → Import redirects",
    doc: "https://support.wix.com/en/article/importing-or-exporting-url-redirects-with-a-csv-file",
    cols: () => [FROM("Old URL"), TO("New URL")], codes: false, slashSame: true },
  { id: "squarespace", name: "Squarespace", group: "Website platforms", kind: "lines", file: "squarespace-url-mappings.txt",
    where: "Settings → Developer tools → URL mappings: paste the lines", paste: true,
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
    caution: "An import replaces every redirect already there: export yours first and add them to this file. Webflow’s help doesn’t mention a header row, so the file has none.",
    note: "Old paths have - _ ? = & and the like escaped with %, as Webflow asks.",
    where: "Site settings → Publishing → 301 redirects → Import",
    doc: "https://help.webflow.com/hc/en-us/articles/33961294898835",
    cols: () => [col("old path", (r) => webflowPath(r.from)), TO("redirect to path")], codes: false, slashSame: true },
  { id: "framer", name: "Framer", group: "Website platforms", kind: "csv", file: "framer-redirects.csv",
    where: "The Redirect Sync plugin → Import",
    doc: "https://www.framer.com/help/articles/bulk-importing-exporting-redirects/",
    cols: () => [FROM("from"), TO("to")], codes: false, slashSame: true },
  { id: "hubspot", name: "HubSpot", group: "Website platforms", kind: "csv", file: "hubspot-redirects.csv", limit: 500,
    where: "Settings → Content → Domains & URLs → URL redirects → Import",
    caution: "One bad row stops the whole import, so fix everything marked first.",
    doc: "https://knowledge.hubspot.com/domains-and-urls/bulk-upload-url-redirects",
    cols: () => [FROM("original url"), TO("redirect to"), col("redirect type", () => "STANDARD"), CODE("redirect style")],
    codes: "required", slashSame: true,
    rules: (r) => [
      r.from.length > 140 && { cell: "o", id: "long", text: `Over HubSpot’s 140 characters (${r.from.length})` },
      r.to.length > 140 && { cell: "n", id: "long", text: `Over HubSpot’s 140 characters (${r.to.length})` },
    ] },
  { id: "bigcommerce", name: "BigCommerce", group: "Website platforms", kind: "csv", file: "bigcommerce-redirects.csv", needsDomain: "Store domain",
    where: "Settings → 301 Redirects → Import",
    doc: "https://support.bigcommerce.com/articles/en_US/Knowledge/MSF-301-Redirects",
    cols: (code, opts) => [col("Domain", () => opts.domain || ""), FROM("Old Path"), TO("Manual URL/Path"), col("Dynamic Target Type", () => ""), col("Dynamic Target ID", () => "")],
    codes: false, slashSame: true },
  { id: "duda", name: "Duda", group: "Website platforms", kind: "csv", file: "duda-redirects.csv", limit: 200, keepLetters: true,
    where: "More → Settings → URL Redirect → Import Multiple Redirects (it appears once the site has one redirect)",
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
    where: "Settings → Advanced → Labs → Beta features → Redirects",
    caution: "An upload replaces your whole redirects file: download yours first and add these lines to it.",
    doc: "https://ghost.org/help/redirects/",
    codes: "required", slashSame: true,
    // Ghost reads each old address as a pattern, so it's escaped and pinned to the whole path
    write: (rows) => {
      const by = {};
      const pattern = (p) => p.includes("?") ? `^${reEscape(p)}$` : `^${reEscape(noSlash(p))}/?$`;
      for (const r of rows) (by[r.code] ||= []).push(`  ${yamlQuote(pattern(r.from))}: ${yamlQuote(r.to)}`);
      return Object.keys(by).sort().map((c) => `${c}:\n${by[c].join("\n")}`).join("\n");
    } },

  // Redirection reads an old address with ( ) [ ] $ ^ or * as a pattern unless the regex column says 0, so it's always written
  { id: "redirection", name: "Redirection", group: "WordPress plugins", kind: "csv", file: "redirection.csv", headerOff: true,
    where: "Tools → Redirection → Import/Export → Import",
    doc: "https://redirection.me/support/import-export-redirects/",
    cols: () => [FROM("source"), TO("target"), col("regex", () => "0"), CODE("code")],
    codes: "required", slashSame: true },
  { id: "rankmath", name: "Rank Math (Pro)", group: "WordPress plugins", kind: "csv", file: "rank-math-redirects.csv",
    where: "Rank Math SEO → Redirections → Import & Export (Rank Math PRO)",
    doc: "https://rankmath.com/kb/how-to-manage-redirects-via-csv/",
    cols: (code) => code ? [FROM("source"), TO("destination"), CODE("type")] : [FROM("source"), TO("destination")],
    codes: "optional", slashSame: true },
  { id: "yoast", name: "Yoast SEO Premium", group: "WordPress plugins", kind: "csv", file: "yoast-redirects.csv",
    where: "Yoast SEO → Tools → Import and Export → Import redirects",
    note: "Redirects already in Yoast are skipped, not updated.",
    doc: "https://yoast.com/help/import-redirects/",
    cols: () => [FROM("Origin"), TO("Target"), CODE("Type"), col("Format", () => "plain")], codes: "required", slashSame: true },

  { id: "netlify", name: "Netlify (_redirects)", group: "Hosting and servers", kind: "lines", file: "_redirects",
    where: "A _redirects file in the folder the site publishes",
    note: "Netlify matches capitals exactly: /About and /about are different addresses.",
    doc: "https://docs.netlify.com/routing/redirects/",
    line: (r) => `${r.from}  ${r.to}  ${r.code}`, codes: "required",
    rules: (r) => [r.from.includes("?") && { cell: "o", id: "query", fixes: DROP_QUERY, text: "_redirects can’t match the ? part" }] },
  { id: "vercel", name: "Vercel (vercel.json)", group: "Hosting and servers", kind: "file", file: "vercel.json", max: 2048,
    where: "The redirects list in vercel.json at the root of the project (up to 2,048 redirects)",
    doc: "https://vercel.com/docs/routing/redirects/configuration-redirects",
    codes: "required",
    rules: (r) => [r.from.includes("?") && { cell: "o", id: "query", fixes: DROP_QUERY, text: "Vercel ignores the ? part" }],
    write: (rows) => JSON.stringify({ redirects: rows.map((r) => ({
      source: r.from.replace(/[:()*+?{}]/g, "\\$&"), destination: r.to, statusCode: +r.code })) }, null, 2) },
  { id: "vercel-bulk", name: "Vercel bulk redirects (CSV)", group: "Hosting and servers", kind: "csv", file: "redirects.csv",
    where: "Pro and Enterprise plans: point bulkRedirectsPath in vercel.json at this file, or upload it in the project’s redirects",
    doc: "https://vercel.com/docs/routing/redirects/bulk-redirects",
    cols: () => [FROM("source"), TO("destination"), CODE("statusCode")], codes: "required",
    rules: (r) => [r.from.includes("?") && { cell: "o", id: "query", fixes: DROP_QUERY, text: "Vercel ignores the ? part" }] },
  { id: "apache", name: "Apache (.htaccess)", group: "Hosting and servers", kind: "lines", file: "htaccess-redirects.txt",
    where: "Add the lines to .htaccess, above any other rewrite rules",
    doc: "https://httpd.apache.org/docs/current/mod/mod_alias.html#redirectmatch",
    line: (r) => `RedirectMatch ${r.code} ${quoteIfSpace("^" + reEscape(noSlash(decoded(r.from))) + "/?$")} ${r.to}`, codes: "required", slashSame: true,
    rules: (r) => [r.from.includes("?") && { cell: "o", id: "query", fixes: DROP_QUERY, text: "RedirectMatch can’t match the ? part" }] },
  { id: "nginx", name: "Nginx", group: "Hosting and servers", kind: "lines", file: "nginx-redirects.conf",
    where: "Add the lines inside the site’s server block",
    doc: "https://nginx.org/en/docs/http/ngx_http_core_module.html#location",
    line: (r) => `location = ${quoteIfSpace(decoded(r.from))} { return ${r.code} ${r.to}; }`, codes: "required",
    rules: (r) => [r.from.includes("?") && { cell: "o", id: "query", fixes: DROP_QUERY, text: "nginx can’t match the ? part" }] },
  { id: "plain", name: "Plain CSV", group: "Hosting and servers", kind: "csv", file: "redirects.csv",
    where: "Change the header row and separator to fit any importer",
    cols: (code) => code ? [FROM("old"), TO("new"), CODE("status")] : [FROM("old"), TO("new")], codes: "optional" },
];

export const byId = (id) => FORMATS.find((f) => f.id === id) || FORMATS[0];
