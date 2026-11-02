---
paths:
  - "site/redirects/**"
---

# Redirect Import: what to know before changing it

- **Built 1 November 2026** for John's team (web developers moving client sites), so the file pane assumes some know-how: the header row is edited in place and sets the separator, and Format holds the rest. The warnings under each cell are wanted (John likes them); each one says what goes into the file and why, under the cell it's about.
- **Formats** live in `js/formats.js`, one entry per platform. Sourced from each platform's own help page (`doc`), except the header rows marked `unverified: true` (Wix, Webflow, HubSpot, BigCommerce, Duda): those came from third-party guides, and the file pane says so. When someone sends a platform's own sample file, match its header exactly and drop the flag. Drupal is left out until its import format (the path_redirect_import module) is confirmed.
- **Rules worth keeping:** old addresses are always paths; a new address keeps its domain unless the domain is the site's own (in the old column, or used by at least two rows and half the new full URLs), so one link to another site is never stripped. Same path on a new domain is "only the domain changes" unless Format is set to full URLs. `slashSame` means the platform treats `/a` and `/a/` as one address (Apache's patterns and the WordPress plugins too).
- **Tests:** there's no test file in the repo yet. The scratch tests used 43 tricky addresses (spaces at the ends, NBSP, zero-width spaces, Word dashes and quotes, stray %, accents, emoji, non-ASCII domains, mailto:, N/A), a hand-built .xlsx (rich-text shared strings, an inline string, a gap row), a Windows-1252 semicolon CSV, 620 rows into Wix's 500 per import, and 5,000 rows for speed (about 1.3 s to load, 0.2 s per edit). Re-run something like them after changing `core.js`.
- **Analytics:** `redirect_file` (platform, redirects, action) on Copy and Download; never the addresses.
