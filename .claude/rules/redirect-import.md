---
paths:
  - "site/redirects/**"
---

# Redirect Import: what to know before changing it

- **Built 1 November 2026** for John's team (web developers moving client sites), so the file pane assumes some know-how: the header row is edited in place and sets the separator, and Format holds the rest. Whether the file has a header row is shown in the file itself (John's pick of three mockups, 2 Nov): a "Header row" tag and × on the line, or, when off, a dashed "+ Add a header row" line showing what it would add. It's no longer a switch under Format. John's test for the tool: if one file fails to import, the team goes back to find-and-replace in VS Code, so every format must match the platform's own docs exactly.
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
  - Redirection (source read 2 Nov 2026, github.com/johngodley/redirection `includes/import-export/`): the browser check (`import-sniff.ts`) and the server (`CsvParser`) both take a `source,target` or `source url,target url` header, any case, and skip it; with no header the first row must look like a redirect. `source,target,regex,code` is how its own export starts, so the header row is on by default. A source with ( ) [ ] $ ^ * is regex unless column 3 is 0, so regex 0 is always written. A two-column `source url,target url` file also imports (missing columns take the defaults), but John chose to keep all four columns every time (2 Nov): the same shape for every file, and the odd regex-like address or 302 can't go quietly wrong. Only the first two header names are checked; any other header row is read as a redirect, so `heads` on the format lists the accepted names and an edited header without them gets a caution above the file. The server tries only `,` `;` `|` as separators, so a Tab file passes the browser check and then imports nothing: `seps` on the format lists the ones it reads, and any other separator gets a caution above the file. An old address with a non-English letter is a terracotta warning (whether its matching decodes `%C3%A9` wasn't checked).
  - Rank Math: lowercase headers `source,destination,type`; Yoast: `Origin,Target,Type,Format` with `plain`, UTF-8, Unix line endings.
  - Vercel: `statusCode` (permanent: true means 308), 2,048 in vercel.json; bulk redirects CSV (`source,destination,statusCode`) on Pro and Enterprise. Neither matches ?.
  - Netlify: case-sensitive, URL-encoded paths, no ? in the old path. Ghost: `301:` group of `old: new`, keys read as patterns.
- **Copy-paste traps from audits and reports** (`core.js`): addresses cut short with … (red), new addresses on a platform's preview domain or localhost (red, "Use the path"; Wix also drops its site-name folder), preview links like ?preview_theme_id (red), netlify.app / vercel.app / github.io and staging-style subdomains (terracotta), addresses with no letters or numbers (terracotta). A preview domain that is most of the sheet's full URLs is taken as the new site and removed as routine ("Done for you"), but never used to write full URLs.
- **Rules worth keeping:** old addresses are always paths; a new address keeps its domain unless the domain is the site's own (in the old column, or used by at least two rows and half the new full URLs). Same path on a new domain is "only the domain changes" unless Format is set to full URLs. `slashSame` means the platform treats `/a` and `/a/` as one address.
- **Tests:** none in the repo yet. The scratch tests covered 43 tricky addresses, each platform's documented rules, a hand-built .xlsx, a Windows-1252 semicolon CSV, Wix's 500 per import and 5,000 rows for speed. Re-run something like them after changing `core.js` or `formats.js`.
- **Analytics:** `redirect_file` (platform, redirects, action) on Copy and Download; never the addresses.
- **A partial file is always said:** while rows need you, Copy and Download read "Copy 4 of 10" / "Download 4 of 10" and
  the file pane opens with "6 rows need fixing before they go in the file. Fix them" (Needs you filter, first row
  focused). Don't go back to a plain "Download file" while rows are missing: a silently short file is the problem the
  tool exists to stop.
- **Kept in this browser:** the sheet (rows, edits, deletes, the platform's Format settings) is saved to localStorage
  (`jsal-redirects-sheet`) after each change and on `pagehide`, and comes back on load; Clear forgets it. The other
  columns of a loaded file aren't kept, so the column pickers hide after a restore. `/privacy/` says so; update it if
  what's kept changes. `jsal-redirects-folded` remembers Hide file (desktop only; phones already show one pane).
- **Row numbers are the spreadsheet's** (`r.n`): the headings are row 1, blank rows keep their place (`at` from
  `parseDelimited` and the .xlsx reader), a delete leaves a gap, and added rows number on from the last. Notes that name a
  row ("Duplicate of row 8") use the same numbers, so the visitor can find it in Excel.
- **Every red row has a way forward:** an edit, a fix button, or, where editing can't help (the platform refuses the
  address, a duplicate, no new address), "Leave it out" (`leave` on the note). A left-out row stays in the sheet, grey,
  "Left out by you · Put it back" (`r.skip`, kept with the sheet); Copy sheet drops it, like a deleted row.
- **Chains are the visitor's call** (John, 2 Nov): A → B plus B → C go in the file as typed, never shortened silently.
  Both rows are terracotta ("Row 9 redirects /x again, so visitors are redirected twice"; "Row 8 points here"), with a
  "Skip the extra step" button on the first and a fix-all line above the sheet for two or more. The point is that the
  team feels in control of their redirects.
- **Blue notes say "In the download:"**, never "In the file", which read as ambiguous.
- **The end is said:** with nothing missing the file pane reads "All N redirects are in the file." in green, and an
  empty Needs you reads "Nothing needs you now. Show all rows".
- **Hide file** is a word ("Hide ›") after Format, never an icon alone; hidden, the file is a 104px tab with level text
  (Show file, "4 of 10 rows in it", "6 to fix"), the whole tab one button. Sideways text was tried and read badly.
- **Copy sheet** copies the two columns as edited (deleted and empty rows dropped, the file's own headings first if it
  had them), tab-separated, to paste back over the source spreadsheet.
- **Clipboard buttons:** read `e.currentTarget` before `await navigator.clipboard…`; after the await it's null, and
  "Copied" silently never shows.
