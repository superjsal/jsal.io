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
  the places most time went, the hunter's pet, most-used spells and professions. A small moss link beside "The
  journey so far" (`.ui`: the logo, "jsal.ui", "My free WoW Forever addon", "See it") names the journey's source;
  it replaced a full-width jsal.ui card, whose "wrote all of this" stopped being true once the sheet came from the
  armory (John, 21 Nov 2026, "card B" of two mockups). Her render stands on the game's dark stage (`--stage*`) in
  both themes (John, "Portrait 1" of three).
  - **It is laid out as the game's character sheet, tidied** (John, 20 Nov 2026: "more like a modernized character
    sheet like you see in game", then "looks great" of the mockup, and "add parts of the journal in a different
    card"): a title bar; the slots down both sides of the middle with the weapons under it; the journal's totals,
    professions and the hunter's pet where the game shows attributes. The middle holds the level and class, as
    there is no portrait (a screenshot John picks would go there). Slot tiles wear the item's quality colour and
    hold the item's own icon (John, 20 Nov 2026: "Real item icons"): the armory page gives each worn item's icon
    address, and the exporter saves new ones to `site/img/wow/` as served. A slot with no icon shows a diamond in
    the quality's colour. The icon is shown at its own
    56 pixels and the sheet carries "Item icons © Blizzard Entertainment" whenever one is shown. The gear columns
    are `.side`, not `.slots`, which is the Backpack's.
  - **On phones (under 700px) the sheet is the game's character window** (John, 20 Nov 2026: "Build A", of two
    mockups; stacked rows made the sheet three screens tall): the icons down both sides of her, the weapons in a
    row under, no names. A name is in its tooltip, which a tap opens beside the icon (above the weapons), never
    wider than the sheet. The names stay in the page for screen readers. She is sized by the frame's height
    there, as the frame is seven icons tall at any width.
  - **Under it, "The journey so far"** (John: "I also like the misc stats... as fun tidbits of my journey", "should
    be more of a fun layout"): six tidbit tiles in tints, each a total, what it counts and a line worked out from
    the journal itself (days played, jumps an hour, time between deaths, marathons walked, foes for each death,
    quests a level), so the lines stay true as the numbers move; then the time at each level, the latest entries
    and where the time went. The numbers count up once when scrolled to, and a tidbit tips under the pointer; with
    reduced motion neither happens. A new tidbit's line must be arithmetic on the journal, never a guess.
  - **Game icons** (John, 21 Nov 2026: classic over the newer achievement icons): each tidbit has one (pocket watch,
    Aspect of the Monkey, skull, Sprint, crossed swords, quest note: the fifth item of each `TIDBITS` row), and the
    talents, professions, pet and most-used spells have the game's own icon from `ICONS` (a name missing there shows
    without one, so add a new spell or profession's icon there). An icon takes the shape of what holds it: rounded
    in a rounded tile, square in a plain row ("round if the card is rounded, squared if not"). All are drawn 14%
    larger than their box so Blizzard's dark frame falls outside it (the files stay as served), and a tidbit's has
    a thin ring in its tile's own ink (his pick 2 of four). On phones a tidbit's icon sits above the number.
  - **"Where the time went" shows the top zone itself** (John, 21 Nov 2026: "the card background be wetlands
    itself"). Blizzard has no per-zone scenic art for Forever (its loading screens are continent ink drawings), so
    the picture is cropped from John's own screenshot there (`ZONE_ART`, `site/img/play/zone-<zone>.webp`): the
    level 25 shot, cropped to the hills and tree so no game UI, chat or names show ("crop for now"; a clean Alt+Z
    shot can replace it). It is drawn like the WoW Forever tile, shaded on the left with light words in both
    themes; a zone with no picture keeps the plain box. jsal.ui takes a screenshot at every level-up, and the
    journal's level entries say where, which is how a zone's shots are found.
  - **Where the data comes from:** `python -I .github/scripts/character.py [name] [class]` reads the journal jsal.ui
    keeps in the game's SavedVariables on John's PC and writes that file. The game only writes its file at logout
    or a reload, and the site only changes when the new JSON is committed, so the page is as fresh as the last run;
    it says the date. Nothing runs it automatically yet.
  - **Only a fixed list leaves the PC** (the `out` table in the script): never guildmates' names (the journal's
    "guild" entries are skipped), chat, gold or the account's name. The guild's own name is shown; John can drop it.
    The class isn't in the journal, so it's an argument.
  - **Two sources, split by what each knows** (John, 21 Nov 2026: "blizzard ... for character portrait and
    equipment, then fun stats from" jsal.ui, and the armory page over his own gear addon as the simpler of the two):
    Blizzard's armory page gives the portrait, what is worn with each item's tooltip and icon, race, item level,
    attributes, talents and professions; the jsal.ui journal gives everything about her play (totals, the journey,
    places, the pet, spells). The armory has no quest, death or play-time counts, so the journal stays.
  - **The portrait is Blizzard's own render of the character** (John, 20 Nov 2026: "Yes, official render"), the
    picture its armory shows of her in what she wears now: a public address by realm and character number
    (`RENDERS` in the exporter; hers is realm 251, read from her armory page,
    `worldofwarcraft.blizzard.com/en-us/forever/us/armory/character/vizdenia-trueshot`). The exporter fetches it on
    every run, as it changes with the gear, and saves it as served (a 1600 x 1200 PNG with her small in the
    middle); CSS draws it large and places it so she fills the frame, with the level and class under her feet. A
    screenshot at `site/img/play/<name>.webp` is the fallback when there is no render.
  - **Her armory page** (`ARMORY` in the exporter) carries the character as data in its own source
    (`characterProfileInitialState`), in the shape of Blizzard's profile API, gear included with every stat. The
    exporter reads that one public page once a run, needs no key, and keeps what it gave last time (`armory` and
    `gear` in the JSON) when the page can't be read or changes shape. Each tooltip is built from it the way the game
    lays one out: item level, "Soulbound" (a worn item is bound), slot and kind, armour or damage, the base stats
    and resistances in white (strength, agility, stamina, intellect, spirit), every other bonus as a green "Equip:"
    line, enchants and Use effects in green, durability, requirements; no sell price. Some bonuses read in the
    armory's words, not the game's ("+12 Spell Power", "+10 Hit"). A "Made by" line is never published, as it names
    another player. The sheet shows Attributes (two columns, short labels so none wraps: "Attack", "Crit"),
    Talents, Professions and Companion; the most used spells sit under "Lately" in the journey. The armory lags the
    game by its own refresh, so the gear and numbers can be a little behind the journal's.
  - **Blizzard's public API has no Forever characters.** It has Forever's game data (`static-forever-us`), but the
    profile and realm lookups answer 404 under `profile-forever-us` and `dynamic-forever-us` for every realm
    (91, 251, "normal") and name form tried (20 and 21 Nov 2026); Blizzard's own armory reads characters from a
    private partner API. Fan armories (armorywowforever.com) read Blizzard's armory pages too. John's `jsalGear`
    addon (`private\jsal-gear`), which saved gear and the game's own tooltips, is no longer read.
  - Numbers here are the character's own play, so the jsal.ui page's rule against counting Forever's game data
    doesn't apply to them.

- **WoW Forever art** (on `/play/` and its share image `og/play.png`; `site\img\wow-forever.webp`, Blizzard's 3840×1600 original scaled to 1920×800, plus `wow-forever-1200.webp` at 1200×500 for 1x desktop screens via `srcset`) is Blizzard's, used under their fan-site policy: it may be scaled down and saved as WebP, but never crop, retouch or otherwise alter the picture (fade and frame it with CSS only), keep the "Art © Blizzard Entertainment" credit, and remove it if the site ever becomes commercial.
- **Item icons** in the Backpack (`site\img\wow\*.jpg`: the socials, the Lantern, the Pocket Watch, the Hearthstone, the bag icons and each achievement's trophy) are Blizzard's WoW icons, used under the same terms: Blizzard's Legal FAQ allows its images on non-commercial web pages if notices stay and the files aren't altered, and Blizzard can withdraw that. Each is saved exactly as `https://render.worldofwarcraft.com/us/icons/56/<name>.jpg` serves it (56×56 JPG, never resized, cropped, recoloured or converted; CSS may frame or round it), named after Blizzard's icon, and nothing links to Blizzard's server. Keep the "Item icons © Blizzard Entertainment" line under the bag. The socials' logos are separate badges drawn over the icon, not edits to it. Find candidates by name (inv_letter_*, inv_misc_bag_*, inv_misc_coin_*…) on that server and ask John before downloading new ones.
- **The Backpack** holds mostly John's socials (he'll add more; keep a few slots free), plus the Lantern (theme), the Pocket Watch (changelog) and the Hearthstone. Don't fill it with site links. Trophies go in the second bag, from `TROPHIES`. New items glow until inspected: add a new item's id to `NEW` so returning visitors notice it.
