---
paths:
  - "site/redirects/**"
  - "src/pages/redirects/**"
---

# Redirect Import: what to know before changing it

- **Built 1 November 2026** for John's team (web developers moving client sites), so the file pane assumes some know-how: the header row is edited in place and sets the separator, and Settings holds the rest (a gear button, `#fmtBtn`; called Format until John's pick of three mockups on 2 Nov, when the bar's "Comma · paths" summary went too, so the file's name and Settings share one line at 1280px). Whether the file has a header row is shown in the file itself (John's pick of three mockups, 2 Nov): a "Header row" tag and × on the line (above it since 4 Nov, John's pick B of two: a long header such as BigCommerce's wraps in its box, and the file's lines wrap at the pane's edge like a code editor's, under their row numbers, so nothing scrolls sideways in a narrow pane), or, when off, one plain line, "No header row. Add one" (John's pick B of three, 2 Nov, replacing a dashed box that showed the header it would add), in terracotta with the reason where the platform's help shows a header row, muted where none is needed. It's no longer a switch under Format. John's test for the tool: if one file fails to import, the team goes back to find-and-replace in VS Code, so every format must match the platform's own docs exactly.
- **No platform is picked for the visitor** (John, 3 Nov; mockup C2 of four): the list opens on "Pick a platform" (a
  disabled option) and, until one is picked, the file is the plain CSV with only the shared checks, a blue box saying
  so, and buttons that read "Copy plain CSV" / "Download plain CSV (6 of 10)", neither gold. Shopify was the default
  before, so its rules showed on sheets for other platforms. Nothing is blocked: a platform that isn't listed picks
  "Not listed: plain CSV" (its own Other group), whose header row and separator fit any importer. Once picked, the
  platform is remembered (`jsal-redirects-platform`); analytics sends `none` while nothing is picked.
- **The tool's job, in John's words:** stop the bulk import where one row out of hundreds fails and the platform doesn't say which. Every check exists to catch that row before the upload.
- **Colours are outcomes:** green ✓ = will redirect; terracotta ? = goes in the file, check it after importing (a rule with warn: true); red ! = won't until fixed; grey – = left out on purpose. Blue only explains (notes, links), gold is the visitor's choices and the main button. Platform cautions sit in a terracotta box above the file, information in a blue one. Rows that only change domain are explained once above the sheet, with a button for full URLs.
- **Reading the sheet:** routine changes (domains, tracking tags, # parts, a missing /) are said once above the sheet ("Done for you"); rows carry notes only for unusual changes, problems and warnings. A problem on two or more rows gets a fix-all button there. Filters are Ready / Needs you / Left out; rows worked on stay visible under a filter until it's picked again.
- **Formats** (`js/formats.js`) were checked on 1 November 2026 against each platform's help page and sample file:
  - Shopify: sample file `Redirect from,Redirect to` (help.shopify.com sample-redirect-template.csv). Reserved starts `/apps /application /cart /carts /orders /services /shop /a /community /tools` and the exact list pages `/products /collections /collections/all` (and /vendors, /types) can't be redirected; `/products/<handle>` can. ? "might not work as expected" (a warning, not a block). Only broken (404) addresses redirect.
  - HubSpot: its sample `sample-redirect-import.csv` (rechecked 3 Nov) is `original url,redirect to,redirect type,redirect style,priority,match query strings,ignore trailing slash,ignore protocol,disable if page exists,note`; the tool writes the first four (STANDARD, 301/302) plus `match query strings` (TRUE only where the old address has a ?, as HubSpot otherwise ignores the ? part, so `/page?id=1` and `/page?id=2` would be one address) and `ignore trailing slash` (TRUE, HubSpot's default, so `/page/` still redirects). With the last / ignored, a row that only adds or drops it loops (`slashLoop`). The note says to tick "Overwrite existing redirects with same original URL" to change redirects already there. 500 per import, 140 characters, one bad row fails the import.
  - Duda: its template is `Old Page URL,Destination Page URL, Redirect Type`. Any % gives a 400 error, so accented letters stay as typed (`keepLetters`); no ? and no .php in old addresses; 200 per file.
  - BigCommerce: template `Domain,Old Path,Manual URL/Path,Dynamic Target Type,Dynamic Target ID`, with the store's domain in Domain (Format's Store domain).
  - Webflow: two columns, no header row documented (`headerOff`); old paths escape `% - & * ( ) = _ + ?` with %, and a / before ? stops a redirect firing. Still unverified: whether a header row is accepted (its help names no columns; a site's own Export would settle it). Webflow's import replaces every redirect on the site, so the team loads Webflow's export, adds rows and imports the whole file back: old paths already escaped (`/spring%-sale`, from that export) are read back plainly (`unescape`), so duplicates and chains match across exported and new rows, and escaped once on the way out; its wildcard `(.*)` is never escaped and `%1`–`%9` in a new address aren't a stray % (`refs`). Not checked: how Webflow wants an accented letter in an old path (the file writes `%%C3%%A9`).
  - Wix: a header row, then two columns (names not given); 500 per file.
  - Squarespace: `/old -> /new 301`; no ? (except ?format=rss in the new address), no home page, no image or file addresses.
  - Redirection (source read 2 Nov 2026, github.com/johngodley/redirection `includes/import-export/`): the browser check (`import-sniff.ts`) and the server (`CsvParser`) both take a `source,target` or `source url,target url` header, any case, and skip it; with no header the first row must look like a redirect. `source,target,regex,code` is how its own export starts, so the header row is on by default. A source with ( ) [ ] $ ^ * is regex unless column 3 is 0, so regex 0 is always written. A two-column `source url,target url` file also imports (missing columns take the defaults), but John chose to keep all four columns every time (2 Nov): the same shape for every file, and the odd regex-like address or 302 can't go quietly wrong. Only the first two header names are checked; any other header row is read as a redirect, so `heads` on the format lists the accepted names and an edited header without them gets a caution above the file. The server tries only `,` `;` `|` as separators, so a Tab file passes the browser check and then imports nothing: `seps` on the format lists the ones it reads, and any other separator gets a caution above the file. An old address with a non-English letter is a terracotta warning (whether its matching decodes `%C3%A9` wasn't checked).
  - Rank Math: lowercase headers `source,destination,type`; Yoast: `Origin,Target,Type,Format` with `plain`, UTF-8, Unix line endings.
  - Vercel: `statusCode` (permanent: true means 308), 2,048 in vercel.json; bulk redirects CSV (`source,destination,statusCode`) on Pro and Enterprise. Neither matches ?.
  - Netlify: case-sensitive (`capsExact`), URL-encoded paths, no ? in the old path. Ghost: `301:` group of `old: new`, keys read as patterns.
- **Copy-paste traps from audits and reports** (`core.js`): addresses cut short with … (red), new addresses on a platform's preview domain or localhost (red, "Use the path"; Wix also drops its site-name folder), preview links like ?preview_theme_id (red), netlify.app / vercel.app / github.io and staging-style subdomains (terracotta), addresses with no letters or numbers (terracotta). A preview domain that is most of the sheet's full URLs is taken as the new site and removed as routine ("Done for you"), but never used to write full URLs.
- **Audit-export traps** (`core.js`, 3 Nov): what a crawl, Search Console export or document copies in with the
  addresses. In a new address they're red, as visitors would land on nothing; in an old one terracotta, as a real
  404 can carry them (a link that took the full stop with it), and no note at all when the row sends it to the address
  without the mistake. Punctuation at the end (`. , ; :`, and `)` `]` only without an opening one; "Remove it");
  encoded twice (`%2520`, only where decoding once gives a sound address; "Decode it once"). Garbled letters (`Ã©`, a
  UTF-8 file opened as Windows-1252) are red with "Fix the letters", which decodes them again; the other character
  checks look past a garbled run, as it holds curly quotes and dashes of its own. A lost letter (U+FFFD, shown as �) is red with
  no fix; a ? inside a word with no = after it (`/caf?-menu`, Excel's plain CSV) is terracotta. Files, feeds,
  sitemaps, robots.txt and WordPress or server system addresses sent to a page are terracotta with Leave it out, said
  only on rows the platform hasn't refused (Squarespace's own file rule stays), and the line above the sheet offers
  "Leave all N out" (`leaveAll`). One page listed with two or more ? parts, all to one new address, without the page
  itself in the sheet, is terracotta with "Remove the ? part": done on all, the repeats become "Same as row N". Not
  for `/` or `.php`-style pages, whose ? part says which page it is, nor where the platform already refuses the ?.
- **Rules worth keeping:** old addresses are always paths; a new address keeps its domain unless the domain is the site's own (in the old column, or used by at least two rows and half the new full URLs). Same path on a new domain is "only the domain changes" unless Format is set to full URLs. `slashSame` only decides whether chains and domain-only rows are followed through a last / and capitals.
- **A / or capital is the visitor's call, unless the docs settle it** (John, 2 Nov; the documented rules named 4 Nov):
  where a platform doesn't document how it matches the last / or capitals, addresses that differ only there are
  terracotta, never merged: two old addresses ("Row 10 has it without the last /. May be one page on Shopify") and a
  row whose new address differs only there ("Only capitals differ from the old address…"); the note names what
  differs (John, 2 Nov), each with Leave it out. Exact duplicates stay red. Where the docs settle it, the note names
  the rule instead of "may be" (the platform's short name, `short`, so "Vercel", not "Vercel bulk redirects"):
  - The last / (`slashLoop`), each with its source (rechecked 4 Nov): Netlify ("will match paths to rules regardless
    of whether or not they contain a trailing slash", with a looping example, on docs.netlify.com
    `manage/routing/redirects/redirect-options`); HubSpot, as the file sets `ignore trailing slash` (the redirect
    applies "whether the original URL includes a forward slash / at the end or not", knowledge.hubspot.com
    `create-and-manage-url-redirects`, linked from its bulk-upload page); Apache, as the tool writes `RedirectMatch`
    patterns with `/?$` (httpd.apache.org mod_alias); and Ghost, whose keys are JavaScript regular expressions
    (ghost.org/tutorials/implementing-redirects), written with `/?$` too. A
    row that only adds or drops it is red, "Would loop: Netlify matches it with or without the last /". Two old
    addresses that differ only by it are one address: to the same page the repeat is out ("Same as row N"), and a
    new address on the site that differs only by its last / is the same page there too (/a → /p with /a/ → /p/;
    John, 4 Nov) where the site serves its pages either way (`slashPages`): Netlify, whose Pretty URLs (on by
    default) forward /about to /about/ (docs.netlify.com redirect options, "Trailing slash"), and Ghost, whose
    pretty-URL middleware adds the last / with a 301 (connect-slashes in Ghost's `pretty-urls.js`, read 4 Nov). Not
    Apache (a file at /p gives a 404 at /p/) or HubSpot (not documented), where both rows stay red; to
    different pages both are red, "Same address as row N: Netlify matches it with or without the last /", with
    Leave this one out.
  - Capitals matter (`capsExact`): Netlify ("Paths are case-sensitive", docs.netlify.com, checked 4 Nov). /About →
    /about (or /About/ → /about) is a real redirect, and /B and /b are two addresses: no note on either.
  - Capitals ignored (`capsSame`): Vercel bulk, whose `caseSensitive` column defaults to false and isn't written
    (vercel.com bulk redirects docs, checked 4 Nov). /About → /about is red, "Would loop: Vercel ignores capitals";
    /B and /b are grouped as one address, as above. Its last / isn't documented, so that stays terracotta, and the
    note names only the / ("Only the last / differs…" for /About/ → /about), as the capitals aren't in doubt.
  - Where capitals differ as well as a documented last /, the terracotta note stays and names only the capitals
    (HubSpot's /a and /A/: "Row 3 has it with different capitals"; /About → /about/: "Only capitals differ…"), except
    on Netlify, where capitals matter. A "may be" note never names what the platform's docs settle. Nginx's
    `location =` is exact (`exact`), so it gets none of these.
  - The help link above the file (`doc`) is each platform's page on importing redirects; where the matching rule is on
    another page (Netlify's Redirect options, HubSpot's advanced options), that page is reached from it.
- **"Leave this one out" or "Leave it out":** "this one" only on notes that name another row (a duplicate or same
  address, "Row 10 has it…"); every other note says "Leave it out".
- **Off the docs is always said** (John, 2 Nov): a file that strays from the platform's help page gets a terracotta
  caution, as it still downloads: a separator other than a comma, a missing header row where the help shows one, a
  header row where it shows none (Webflow), or header names unlike the help's (`offDocs()` in `main.js`; Wix's help
  names no columns, `anyHead`). Header cautions sit under the header row, with a terracotta edge on it, as the box above
  the file was easy to miss while typing there. Where the importer's code was read (Redirection: `seps`, `heads`) the
  caution says what will happen instead of "may not import". Download stays allowed while one shows (John's call): on a
  platform known only from its help page, "may not import" is a guess, not a known failure.
- **The file can be renamed** in place (the name in the file pane is a box, like the header row); the extension stays
  as text beside it, and a split file adds -part-N after the name. It's kept with the sheet, survives "Back to the
  platform's format" and resets when the platform changes. Netlify's `_redirects` and `vercel.json` can't be renamed
  (`fixedName`), as those platforms find the file by its name.
- **Tests:** `.github/scripts/redirects.test.mjs` (4 Nov; 253 checks) runs the real `core.js` and `formats.js` on tricky
  addresses, pasted text, junk and cut-short addresses, preview sites, each platform's documented rules and file, the
  audit-export traps, chains, duplicates and capitals. `check.py` (so `check.ps1`) and Site checks run it on every push
  to `main` and `staging`; a failure prints FAIL lines. When a result should change, agree it first, then update the
  expectation. Browser flows (paste, filters, folding, 5,000 rows for speed) are still scratch tests in
  `private\redirect-import\tests\`, run by hand against port 8766.
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
  Both rows are terracotta, in the standard term ("Redirect chain: row 9 sends this on to /x"; "Redirect chain: row 8
  points here"), with a "Point to the end" button on the first and a fix-all line above the sheet for two or more.
  Chains and loops are followed to their end however long (code review, 4 Nov: a 50-hop limit once called a long
  chain a loop and left its row out of the file); past 50 hops where a row leads is worked out once and shared, so
  5,000 rows in one chain take about 0.2 s. Past 12 rows a note names the first three and how many ("rows 3, 4, 5 …
  (59 rows) send this on to /p60"; "Loop: rows 2 → 3 → 4 → … (60 rows) → back here"). The point is that the
  team feels in control of their redirects.
- **A loop is red only when it's certain** (John, 4 Nov): every step is the same address on the platform (as typed,
  or alike by its documented rule, `slashLoop` / `capsSame`). Where a step needs a / or capitals to match and the docs
  don't settle it, the row is terracotta and stays in the file: "May loop: rows 2 → 3 → back here, if /A and /a are
  one page on Shopify", with Leave this one out. Loops are looked for through every step that may match, on every
  platform whose notes say "may be" (Vercel bulk's last /: /a → /b/ with /b → /a is "May loop… if /b/ and /b are one
  page on Vercel"); `slashSame` still decides only which steps a "Redirect chain" note follows, and domain-only rows.
  Every step that only may match is named, as each is a condition ("…if /B and /b are one page on Shopify, and so are
  /a/ and /a"; past three, "(and 4 more steps that may match)"). Where a step may match two or more rows and the first
  leads nowhere back, the others are tried too (/x → /Y with /y → /z and /y/ → /x: "May loop: rows 2 → 4 → back
  here, if /Y and /y/ are one page"), in a search capped at 300 steps a row (code review, 4 Nov). A
  certain Loop drops the row's "may be one page" notes, which would read as doubt beside it. A row whose new address
  may be its own old one gets only its "may be one page" note, never a loop as well, and a chain from another row
  doesn't turn back into it on a may-match (it looks for another row that may match): on Shopify /About → /ABOUT/
  with /about → /About, row 3 is "May loop: rows 3 → 2 → back here, if /ABOUT/ and /about are one page", row 2 only
  its may-be note (code review, 4 Nov). A loop note names every row it passes and where it comes back to ("back
  here", or "back to row 3" for a row that leads into a loop). On Vercel bulk, /About → /about/ with /About/ → /about
  is a certain loop, as capitals are ignored and each step then matches exactly.
- **Blue notes say "In the download:"**, never "In the file", which read as ambiguous.
- **A note says only what that row needs** (John's reading pass, 3 Nov): never what the row's mark already says (no
  "Test after import" on a ?, no ": left out" on a –) or what its button says (no "Leave one out" above Leave this one
  out). Rules name the platform, not its file or directive ("Netlify can't match the ? part", not "_redirects").
- **The end is said:** with nothing missing the file pane reads "All N redirects are in the file." in green, and an
  empty Needs you reads "Nothing needs you now. Show all rows".
- **Hide file** is a word ("Hide ›") after Format, never an icon alone; hidden, the file is a 104px tab with level text
  (Show file, "4 of 10 rows in it", "6 to fix"), the whole tab one button. Sideways text was tried and read badly.
- **Copy sheet** copies the two columns as edited (deleted and empty rows dropped, the file's own headings first if it
  had them), tab-separated, to paste back over the source spreadsheet.
- **Clipboard buttons:** read `e.currentTarget` before `await navigator.clipboard…`; after the await it's null, and
  "Copied" silently never shows.
