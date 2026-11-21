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
  - **Gear comes from the addon too.** jsal.ui saves what the character wears as `jsalUICharDB.equipped`
    (`{ at, items = { { slot, id, name, quality } } }`, replaced whole at each save; in the addon from its commit
    8003e69, 20 Nov 2026). The exporter turns it into `gear` (slot, name, quality in words) and the page shows a
    "Wearing" block, each name in its quality's colour with the quality in words beside it. The block is styled by
    attributes (`data-worn`, `data-q`), not classes, as it is absent until the addon has saved gear and the checks
    fail a class that no page uses.
  - **Blizzard's API can't supply a character** (tested with John's API client, 20 Nov 2026). Forever's game data
    answers under undocumented `forever` namespaces (`static-forever-us` gave 9 classes), but Forever has no realms
    in the API (the realm list is 404, realm search returns none), so a profile has no address: every guess at
    `profile-forever-us` was 404. Rerun `private\blizzard-test2.py` if Blizzard adds it; the secret is John's, set
    in his own terminal, never in chat or a file. So there is no automatic portrait: it would be a screenshot he
    picks.
  - Numbers here are the character's own play, so the jsal.ui page's rule against counting Forever's game data
    doesn't apply to them.

- **WoW Forever art** (on `/play/` and its share image `og/play.png`; `site\img\wow-forever.webp`, Blizzard's 3840×1600 original scaled to 1920×800, plus `wow-forever-1200.webp` at 1200×500 for 1x desktop screens via `srcset`) is Blizzard's, used under their fan-site policy: it may be scaled down and saved as WebP, but never crop, retouch or otherwise alter the picture (fade and frame it with CSS only), keep the "Art © Blizzard Entertainment" credit, and remove it if the site ever becomes commercial.
- **Item icons** in the Backpack (`site\img\wow\*.jpg`: the socials, the Lantern, the Pocket Watch, the Hearthstone, the bag icons and each achievement's trophy) are Blizzard's WoW icons, used under the same terms: Blizzard's Legal FAQ allows its images on non-commercial web pages if notices stay and the files aren't altered, and Blizzard can withdraw that. Each is saved exactly as `https://render.worldofwarcraft.com/us/icons/56/<name>.jpg` serves it (56×56 JPG, never resized, cropped, recoloured or converted; CSS may frame or round it), named after Blizzard's icon, and nothing links to Blizzard's server. Keep the "Item icons © Blizzard Entertainment" line under the bag. The socials' logos are separate badges drawn over the icon, not edits to it. Find candidates by name (inv_letter_*, inv_misc_bag_*, inv_misc_coin_*…) on that server and ask John before downloading new ones.
- **The Backpack** holds mostly John's socials (he'll add more; keep a few slots free), plus the Lantern (theme), the Pocket Watch (changelog) and the Hearthstone. Don't fill it with site links. Trophies go in the second bag, from `TROPHIES`. New items glow until inspected: add a new item's id to `NEW` so returning visitors notice it.
