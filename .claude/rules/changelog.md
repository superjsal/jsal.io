---
paths:
  - "src/content/changelog.json"
  - "src/content.config.mjs"
  - "src/lib/changelog.mjs"
  - "src/lib/updates.mjs"
  - "src/pages/changelog/**"
---

# Changelog

- Add a line at the top of `src\content\changelog.json` (newest first, one entry per line: `{"date": "YYYY-MM-DD", "tag": "…", "text": "…"}`), one sentence of about 20 words, only if a visitor would notice it, and edit that day's line rather than adding another when the same feature changes again (the changelog rules in `voice.md`; small fixes share one "Small fixes: …" line a day).
- The tag is its app: CMS Picker, Clean Paste, Image Resizer, Redirect Import, Off the clock for `/play/`, or Site (`SECTIONS` in `src\lib\changelog.mjs`, in Updates order; a new tool goes there with its address and icon). Links are Markdown (`[Privacy](/privacy/)`); no HTML.
- If it should lead its section in **Updates** on the home page, add `"short": "…"` (about 40 characters, so it stays on one line at 1024px and up): Updates shows each section's newest `short` and its date, the three most recent.
- The build checks every entry (the schema in `src\content.config.mjs`): a bad date, an unknown tag or field, HTML, entries out of order or a section with no `short` stop it, naming the entry by its line; a line past 40 characters is a note. `/changelog/` is noindex and not in the sitemap.
