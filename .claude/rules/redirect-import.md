---
paths:
  - "site/redirects/**"
---

# Redirect Import: what to know before changing it

- **Built 1 November 2026** for John's team (web developers moving client sites), so the file pane assumes some know-how: the header row is edited in place and sets the separator, and Format holds the rest. John's test for the tool: if one file fails to import, the team goes back to find-and-replace in VS Code, so every format must match the platform's own docs exactly.
- **The tool's job, in John's words:** stop the bulk import where one row out of hundreds fails and the platform doesn't say which. Every check exists to catch that row before the upload.
- **Colours are outcomes:** green ✓ = will redirect; terracotta ? = goes in the file, check it after importing (a rule with warn: true); red ! = won't until fixed; grey – = left out on purpose. Blue only explains (notes, links), gold is the visitor's choices and the main button. Platform cautions sit in a terracotta box above the file, information in a blue one. Rows that only change domain are explained once above the sheet, with a button for full URLs.
- **Reading the sheet:** routine changes (domains, tracking tags, # parts, a missing /) are said once above the sheet ("Done for you"); rows carry notes only for unusual changes, problems and warnings. A problem on two or more rows gets a fix-all button there. Filters are Ready / Needs you / Left out; rows worked on stay visible under a filter until it's picked again.
- **Formats** (`js/formats.js`) were checked on 1 November 2026 against each platform's help page and sample file:
  - Shopify: sample file `Redirect from,Redirect to` (help.shopify.com sample-redirect-template.csv). Reserved starts `/apps /application /cart /carts /orders /services /shop /a /community /tools` and the exact list pages `/products /collections /collections/all` (and /vendors, /types) can't be redirected; `/products/<handle>` can. ? "might not work as expected" (a warning, not a block). Only broken (404) addresses redirect.
  - HubSpot: its sample `sample-redirect-import.csv` starts `original url,redirect to,redirect type,redirect style,…`; the tool writes the first four (STANDARD, 301/302). 500 per import, 140 characters, one bad row fails the import.
  - Duda: its template is `Old Page URL,Destination Page URL, Redirect Type`. Any % gives a 400 error, so accented letters stay as typed (`keepLetters`); no ? and no .php in old addresses; 200 per file.
  - BigCommerce: template `Domain,Old Path,Manual URL/Path,Dynamic Target Type,Dynamic Target ID`, with the store's domain in Domain (Format's Store domain).
  - Webflow: two columns, no header row documented (`headerOff`); old paths escape `% - & * ( ) = _ + ?` with %, and a / before ? stops a redirect firing. Still unverified: whether a header row is accepted.
  - Wix: a header row, then two columns (names not given); 500 per file.
  - Squarespace: `/old -> /new 301`; no ? (except ?format=rss in the new address), no home page, no image or file addresses.
  - Redirection: its importer (CsvParser) skips a `source,target` header and treats a source with ( ) [ ] $ ^ * as regex unless column 3 is 0, so regex 0 is always written.
  - Rank Math: lowercase headers `source,destination,type`; Yoast: `Origin,Target,Type,Format` with `plain`, UTF-8, Unix line endings.
  - Vercel: `statusCode` (permanent: true means 308), 2,048 in vercel.json; bulk redirects CSV (`source,destination,statusCode`) on Pro and Enterprise. Neither matches ?.
  - Netlify: case-sensitive, URL-encoded paths, no ? in the old path. Ghost: `301:` group of `old: new`, keys read as patterns.
- **Copy-paste traps from audits and reports** (`core.js`): addresses cut short with … (red), new addresses on a platform's preview domain or localhost (red, "Use the path"; Wix also drops its site-name folder), preview links like ?preview_theme_id (red), netlify.app / vercel.app / github.io and staging-style subdomains (terracotta), addresses with no letters or numbers (terracotta). A preview domain that is most of the sheet's full URLs is taken as the new site and removed as routine ("Done for you"), but never used to write full URLs.
- **Rules worth keeping:** old addresses are always paths; a new address keeps its domain unless the domain is the site's own (in the old column, or used by at least two rows and half the new full URLs). Same path on a new domain is "only the domain changes" unless Format is set to full URLs. `slashSame` means the platform treats `/a` and `/a/` as one address.
- **Tests:** none in the repo yet. The scratch tests covered 43 tricky addresses, each platform's documented rules, a hand-built .xlsx, a Windows-1252 semicolon CSV, Wix's 500 per import and 5,000 rows for speed. Re-run something like them after changing `core.js` or `formats.js`.
- **Analytics:** `redirect_file` (platform, redirects, action) on Copy and Download; never the addresses.
