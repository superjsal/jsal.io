// What each platform imports. kind: "csv" (columns, a header row and a separator the visitor can change), "lines"
// (one line of text per redirect), or a whole file written by write(). codes: false when the platform has no
// status setting, "optional" or "required". slashSame: the platform treats /page and /page/ as one address.
// unverified: the header comes from guides rather than the platform's own template.

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
const DROP_QUERY = [["Remove the ? part", (s) => s.replace(/\?[^#]*/, "")]];

export const FORMATS = [
  { id: "shopify", name: "Shopify", group: "Website platforms", kind: "csv", file: "shopify-redirects.csv",
    where: "Content → Menus → URL redirects → Import",
    doc: "https://help.shopify.com/en/manual/online-store/menus-and-links/url-redirect",
    cols: () => [FROM("Redirect from"), TO("Redirect to")], codes: false, slashSame: true },
  { id: "wix", name: "Wix", group: "Website platforms", kind: "csv", file: "wix-redirects.csv", limit: 500, unverified: true,
    where: "Dashboard → SEO & GEO → URL Redirect Manager → Import",
    doc: "https://support.wix.com/en/article/importing-or-exporting-url-redirects-with-a-csv-file",
    cols: () => [FROM("Old URL"), TO("New URL")], codes: false, slashSame: true },
  { id: "squarespace", name: "Squarespace", group: "Website platforms", kind: "lines", file: "squarespace-url-mappings.txt",
    where: "Settings → Developer tools → URL mappings: paste the lines", paste: true,
    doc: "https://support.squarespace.com/hc/en-us/articles/205815308-URL-mappings",
    line: (r) => `${r.from} -> ${r.to} ${r.code}`, codes: "required", slashSame: true,
    rules: (r) => [
      r.from.includes("?") && { cell: "o", id: "query", fixes: DROP_QUERY, text: "Squarespace can’t redirect an address with ? in it." },
      r.from === "/" && { cell: "o", id: "home", text: "Squarespace can’t redirect the home page." },
      /\?(?!format=rss$)/.test(r.to) && { cell: "n", id: "query", fixes: DROP_QUERY, text: "Squarespace takes a ? in the new address only for ?format=rss." },
    ] },
  { id: "webflow", name: "Webflow", group: "Website platforms", kind: "csv", file: "webflow-redirects.csv", unverified: true,
    where: "Site settings → Publishing → 301 redirects → Import. An import replaces every redirect already there.",
    doc: "https://help.webflow.com/hc/en-us/articles/33961211526291",
    cols: () => [FROM("source"), TO("target")], codes: false, slashSame: true },
  { id: "framer", name: "Framer", group: "Website platforms", kind: "csv", file: "framer-redirects.csv",
    where: "The Redirect Sync plugin → Import",
    doc: "https://www.framer.com/help/articles/bulk-importing-exporting-redirects/",
    cols: () => [FROM("from"), TO("to")], codes: false, slashSame: true },
  { id: "hubspot", name: "HubSpot", group: "Website platforms", kind: "csv", file: "hubspot-redirects.csv", limit: 500, unverified: true,
    where: "Settings → Content → Domains & URLs → URL redirects → Import. One bad row stops the whole import.",
    doc: "https://knowledge.hubspot.com/domains-and-urls/bulk-upload-url-redirects",
    cols: () => [FROM("Original URL"), TO("Redirect to")], codes: false, slashSame: true,
    rules: (r) => [
      r.from.length > 140 && { cell: "o", id: "long", text: `HubSpot takes addresses up to 140 characters; this one has ${r.from.length}.` },
      r.to.length > 140 && { cell: "n", id: "long", text: `HubSpot takes addresses up to 140 characters; this one has ${r.to.length}.` },
    ] },
  { id: "bigcommerce", name: "BigCommerce", group: "Website platforms", kind: "csv", file: "bigcommerce-redirects.csv", unverified: true,
    where: "Settings → 301 redirects → Import",
    doc: "https://support.bigcommerce.com/articles/en_US/Knowledge/MSF-301-Redirects",
    cols: () => [col("Domain", () => ""), FROM("Old Path"), TO("Manual URL/Path"), col("Dynamic Target Type", () => ""), col("Dynamic Target ID", () => "")],
    codes: false, slashSame: true },
  { id: "duda", name: "Duda", group: "Website platforms", kind: "csv", file: "duda-redirects.csv", limit: 200, unverified: true,
    where: "More → Settings → URL redirect → Import multiple redirects",
    doc: "https://support.duda.co/hc/en-us/articles/26519925447703-URL-Redirects",
    cols: () => [FROM("Source URL"), TO("Destination URL")], codes: false, slashSame: true },
  { id: "ghost", name: "Ghost", group: "Website platforms", kind: "file", file: "redirects.yaml",
    where: "Settings → Advanced → Labs → Redirects → Upload redirects file. It replaces the file already there.",
    doc: "https://ghost.org/docs/themes/routing/#redirects",
    codes: "required", slashSame: true,
    write: (rows) => {
      const by = {};
      const pattern = (p) => p.includes("?") ? `^${reEscape(p)}$` : `^${reEscape(noSlash(p))}/?$`;
      for (const r of rows) (by[r.code] ||= []).push(`  ${yamlQuote(pattern(r.from))}: ${yamlQuote(r.to)}`);
      return Object.keys(by).sort().map((c) => `${c}:\n${by[c].join("\n")}`).join("\n");
    } },

  { id: "redirection", name: "Redirection", group: "WordPress plugins", kind: "csv", file: "redirection.csv", headerOff: true,
    where: "Tools → Redirection → Import/Export → Import",
    doc: "https://redirection.me/support/import-export-redirects/",
    cols: (code) => code ? [FROM("source"), TO("target"), col("regex", () => "0"), CODE("code")] : [FROM("source"), TO("target")],
    codes: "optional", slashSame: true },
  { id: "rankmath", name: "Rank Math (Pro)", group: "WordPress plugins", kind: "csv", file: "rank-math-redirects.csv",
    where: "Rank Math SEO → Redirections → Import & Export",
    doc: "https://rankmath.com/kb/how-to-manage-redirects-via-csv/",
    cols: (code) => code ? [FROM("source"), TO("destination"), CODE("type")] : [FROM("source"), TO("destination")],
    codes: "optional", slashSame: true },
  { id: "yoast", name: "Yoast SEO Premium", group: "WordPress plugins", kind: "csv", file: "yoast-redirects.csv",
    where: "Yoast SEO → Tools → Import and Export → Import redirects",
    doc: "https://yoast.com/help/import-redirects/",
    cols: () => [FROM("Origin"), TO("Target"), CODE("Type"), col("Format", () => "plain")], codes: "required", slashSame: true },

  { id: "netlify", name: "Netlify (_redirects)", group: "Hosting and servers", kind: "lines", file: "_redirects",
    where: "A _redirects file in the folder the site publishes",
    doc: "https://docs.netlify.com/routing/redirects/",
    line: (r) => `${r.from}  ${r.to}  ${r.code}`, codes: "required" },
  { id: "vercel", name: "Vercel (vercel.json)", group: "Hosting and servers", kind: "file", file: "vercel.json",
    where: "The redirects list in vercel.json at the root of the project",
    doc: "https://vercel.com/docs/project-configuration#redirects",
    codes: "required",
    rules: (r) => [r.from.includes("?") && { cell: "o", id: "query", fixes: DROP_QUERY, text: "vercel.json matches ? with a has rule, which this file doesn’t write." }],
    write: (rows) => JSON.stringify({ redirects: rows.map((r) => ({
      source: r.from.replace(/[:()*+?{}]/g, "\\$&"), destination: r.to, permanent: r.code !== "302" })) }, null, 2) },
  { id: "apache", name: "Apache (.htaccess)", group: "Hosting and servers", kind: "lines", file: "htaccess-redirects.txt",
    where: "Add the lines to .htaccess, above any other rewrite rules",
    doc: "https://httpd.apache.org/docs/current/mod/mod_alias.html#redirectmatch",
    line: (r) => `RedirectMatch ${r.code} ${quoteIfSpace("^" + reEscape(noSlash(decoded(r.from))) + "/?$")} ${r.to}`, codes: "required", slashSame: true,
    rules: (r) => [r.from.includes("?") && { cell: "o", id: "query", fixes: DROP_QUERY, text: "RedirectMatch can’t see what comes after ?; that needs a rewrite rule." }] },
  { id: "nginx", name: "Nginx", group: "Hosting and servers", kind: "lines", file: "nginx-redirects.conf",
    where: "Add the lines inside the site’s server block",
    doc: "https://nginx.org/en/docs/http/ngx_http_core_module.html#location",
    line: (r) => `location = ${quoteIfSpace(decoded(r.from))} { return ${r.code} ${r.to}; }`, codes: "required",
    rules: (r) => [r.from.includes("?") && { cell: "o", id: "query", fixes: DROP_QUERY, text: "An nginx location can’t match what comes after ?." }] },
  { id: "plain", name: "Plain CSV", group: "Hosting and servers", kind: "csv", file: "redirects.csv",
    where: "Change the header row and separator to fit any importer",
    cols: (code) => code ? [FROM("old"), TO("new"), CODE("status")] : [FROM("old"), TO("new")], codes: "optional" },
];

export const byId = (id) => FORMATS.find((f) => f.id === id) || FORMATS[0];
