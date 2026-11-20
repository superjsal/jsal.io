---
version: 1
slug: "site-shell-css"
primary_target: "site/shell.css"
related_targets: ["src/layouts/Page.astro","src/components/TopBar.astro"]
---

# Shared look (every page), light mode

Scope: the shared shell (tokens, top bar, building blocks) in light mode. Mode: Operate. Dark mode's colours, the
logo, the gold gem and the Image Resizer's layout are fixed. The jsal.ui page waits for its own session.

## Direction contract

THESIS: Each tool wears its home tile's colour on its own page, so the home page and the tools read as one family. It
refuses the parchment page where every tool looks the same.

OWN-WORLD: A cool neutral ground (#f3f4f6) and white work surfaces. One deep colour per tool for its top bar (CMS
Picker lilac, Image Resizer teal, Clean Paste honey-brown, Redirect Import berry; slate on the site's own pages), its
soft tint for the settings or quiz panel, gold only for what you act on and what is selected. Lora titles, Inter
text.

STORY: A stranger landing on a tool sees which tool it is at a glance, does the job, and recognises the family when
they reach the home page.

FIRST VIEWPORT: The tool's bar across the full width in its deep colour (logo, tool name, About, theme button); the
"for" line; the tool's work area unchanged in position, settings on the tint, work surface white.

FORM: Colour-coded series identity; first on the ordered list (seed: none needed for the list position);
seed:11cb5192d91c3404.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
