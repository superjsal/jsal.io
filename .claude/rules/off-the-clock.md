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
  - **It is laid out as the game's character sheet, tidied** (John, 20 Nov 2026: "more like a modernized character
    sheet like you see in game", then "looks great" of the mockup, and "add parts of the journal in a different
    card"): a title bar; the slots down both sides of the middle with the weapons under it; the journal's totals,
    professions and the hunter's pet where the game shows attributes. The middle holds the level and class, as
    there is no portrait (a screenshot John picks would go there). Slot tiles wear the item's quality colour and
    hold the item's own icon (John, 20 Nov 2026: "Real item icons"): the exporter asks Blizzard's Forever game data
    which icon each worn item has and saves new ones to `site/img/wow/` as served, when `BLIZZARD_CLIENT_ID` and
    `BLIZZARD_CLIENT_SECRET` are set in the terminal John runs it in; `src/data/item-icons.json` remembers which
    icon an item has. A slot with no icon yet shows a diamond in the quality's colour. The icon is shown at its own
    56 pixels and the sheet carries "Item icons © Blizzard Entertainment" whenever one is shown. The gear columns
    are `.side`, not `.slots`, which is the Backpack's.
  - **Under it, "The journey so far"** (John: "I also like the misc stats... as fun tidbits of my journey", "should
    be more of a fun layout"): six tidbit tiles in tints, each a total, what it counts and a line worked out from
    the journal itself (days played, jumps an hour, time between deaths, marathons walked, foes for each death,
    quests a level), so the lines stay true as the numbers move; then the time at each level, the latest entries
    and where the time went. The numbers count up once when scrolled to, and a tidbit tips under the pointer; with
    reduced motion neither happens. A new tidbit's line must be arithmetic on the journal, never a guess.
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
  - **The portrait is Blizzard's own render of the character** (John, 20 Nov 2026: "Yes, official render"), the
    picture its armory shows of her in what she wears now: a public address by realm and character number
    (`RENDERS` in the exporter; hers is realm 251, read from her armory page,
    `worldofwarcraft.blizzard.com/en-us/forever/us/armory/character/vizdenia-trueshot`). The exporter fetches it on
    every run, as it changes with the gear, and saves it as served (a 1600 x 1200 PNG with her small in the
    middle); CSS draws it large and places it so she fills the frame, with the level and class under her feet. A
    screenshot at `site/img/play/<name>.webp` is the fallback when there is no render.
  - **What is worn, and each item's tooltip, come from John's own small addon,** `jsalGear` (in `private\jsal-gear`,
    linked into the game's AddOns; saved as `jsalGearDB.equipped`, per character, in `jsalGear.lua` beside the
    journal's file). It was first built into jsal.ui and taken out again (John, 20 Nov 2026: "keep it mine only"),
    so no other player's game saves gear. The exporter reads that file and falls back to the journal's file only
    until the addon has saved. A tooltip is the game's own lines with their colours (green, the game's yellow,
    grey); a crafted item's "Made by" line is never published, as it names another player. Blizzard's page for an
    item is the fallback tooltip, and half of them answer 404.
  - **Blizzard's API** has Forever's game data under undocumented `forever` namespaces (`static-forever-us`: items,
    icons), which is where the item icons come from. Its character profile was tested on 20 Nov 2026 with the wrong
    realm (91, the game's folder; the armory files her under 251) and found nothing: the armory shows item levels,
    health, mana, attributes, crit, talents and Skinning, so the profile API very likely answers with the right
    realm. Not retested; none of that is on the page. The secret is John's, set in his own terminal, never in chat
    or a file.
  - Numbers here are the character's own play, so the jsal.ui page's rule against counting Forever's game data
    doesn't apply to them.

- **WoW Forever art** (on `/play/` and its share image `og/play.png`; `site\img\wow-forever.webp`, Blizzard's 3840×1600 original scaled to 1920×800, plus `wow-forever-1200.webp` at 1200×500 for 1x desktop screens via `srcset`) is Blizzard's, used under their fan-site policy: it may be scaled down and saved as WebP, but never crop, retouch or otherwise alter the picture (fade and frame it with CSS only), keep the "Art © Blizzard Entertainment" credit, and remove it if the site ever becomes commercial.
- **Item icons** in the Backpack (`site\img\wow\*.jpg`: the socials, the Lantern, the Pocket Watch, the Hearthstone, the bag icons and each achievement's trophy) are Blizzard's WoW icons, used under the same terms: Blizzard's Legal FAQ allows its images on non-commercial web pages if notices stay and the files aren't altered, and Blizzard can withdraw that. Each is saved exactly as `https://render.worldofwarcraft.com/us/icons/56/<name>.jpg` serves it (56×56 JPG, never resized, cropped, recoloured or converted; CSS may frame or round it), named after Blizzard's icon, and nothing links to Blizzard's server. Keep the "Item icons © Blizzard Entertainment" line under the bag. The socials' logos are separate badges drawn over the icon, not edits to it. Find candidates by name (inv_letter_*, inv_misc_bag_*, inv_misc_coin_*…) on that server and ask John before downloading new ones.
- **The Backpack** holds mostly John's socials (he'll add more; keep a few slots free), plus the Lantern (theme), the Pocket Watch (changelog) and the Hearthstone. Don't fill it with site links. Trophies go in the second bag, from `TROPHIES`. New items glow until inspected: add a new item's id to `NEW` so returning visitors notice it.
