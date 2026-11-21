---
paths:
  - "site/play/**"
  - "src/pages/play/**"
  - "site/img/wow-forever*"
  - ".github/build/og/**"
---

# Off the clock (/play/)

- **The page leads with John's character** (John, 20 Nov 2026: "is there something I can connect so I can see my
  current char", then "my addon" and Blizzard's API together). The panel under the headline is read from
  `src/data/character.json`: who and where, six totals, the time at each level as bars, the latest journal entries,
  the places most time went, the hunter's pet, most-used spells and professions. The jsal.ui tile under it says the
  journal is the addon's, so the page is a live demo of it.
  - **Where the data comes from:** `python -I .github/scripts/character.py [name] [class]` reads the journal jsal.ui
    keeps in the game's SavedVariables on John's PC and writes that file. The game only writes its file at logout
    or a reload, and the site only changes when the new JSON is committed, so the page is as fresh as the last run;
    it says the date. Nothing runs it automatically yet.
  - **Only a fixed list leaves the PC** (the `out` table in the script): never guildmates' names (the journal's
    "guild" entries are skipped), chat, gold or the account's name. The guild's own name is shown; John can drop it.
    The class isn't in the journal, so it's an argument.
  - **Blizzard's API** (asked for gear and a character portrait) isn't connected. Its documentation lists namespaces
    for retail, Classic Era, Mists Classic and Burning Crusade Anniversary only, none for WoW Forever (checked
    20 Nov 2026), so it may not serve Forever characters at all. Testing needs an API client John creates at
    develop.battle.net; its secret goes in Cloudflare as a Worker secret, set by him, never in chat or a file.
  - Numbers here are the character's own play, so the jsal.ui page's rule against counting Forever's game data
    doesn't apply to them.

- **WoW Forever art** (on `/play/` and its share image `og/play.png`; `site\img\wow-forever.webp`, Blizzard's 3840×1600 original scaled to 1920×800, plus `wow-forever-1200.webp` at 1200×500 for 1x desktop screens via `srcset`) is Blizzard's, used under their fan-site policy: it may be scaled down and saved as WebP, but never crop, retouch or otherwise alter the picture (fade and frame it with CSS only), keep the "Art © Blizzard Entertainment" credit, and remove it if the site ever becomes commercial.
- **Item icons** in the Backpack (`site\img\wow\*.jpg`: the socials, the Lantern, the Pocket Watch, the Hearthstone, the bag icons and each achievement's trophy) are Blizzard's WoW icons, used under the same terms: Blizzard's Legal FAQ allows its images on non-commercial web pages if notices stay and the files aren't altered, and Blizzard can withdraw that. Each is saved exactly as `https://render.worldofwarcraft.com/us/icons/56/<name>.jpg` serves it (56×56 JPG, never resized, cropped, recoloured or converted; CSS may frame or round it), named after Blizzard's icon, and nothing links to Blizzard's server. Keep the "Item icons © Blizzard Entertainment" line under the bag. The socials' logos are separate badges drawn over the icon, not edits to it. Find candidates by name (inv_letter_*, inv_misc_bag_*, inv_misc_coin_*…) on that server and ask John before downloading new ones.
- **The Backpack** holds mostly John's socials (he'll add more; keep a few slots free), plus the Lantern (theme), the Pocket Watch (changelog) and the Hearthstone. Don't fill it with site links. Trophies go in the second bag, from `TROPHIES`. New items glow until inspected: add a new item's id to `NEW` so returning visitors notice it.
