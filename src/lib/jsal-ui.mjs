// jsal.ui's parts as the jsal.ui page shows them, in the store pages' three groups (Plan, Craft, Play), each with its
// window from the game in the addon's current look: a WebP under site/img/jsal-ui/ui/, at the game's own size.
// The headlines and points began as the store cards' own words; a few are softer here (20 Nov 2026), so nothing
// promises "the best" or "every" about the game's own data, which is new and still changing. Since 22 Nov 2026 the
// words are the store pages' looser ones: a player talking, with the slang any WoW player knows.
// menu: the window is the dashboard, with its menu down the left. A crop (a card, or a window on a phone) starts at
// the page's own content, under the title bar and past the menu: the dashboard's bar is 49px tall and its menu
// 233px wide, any other window's bar 33px. cx and cy are those as shares of the picture, for a CSS translate.
const shot = (name, w, h, alt, menu = false) => {
  const left = menu ? 233 : 0, top = menu ? 49 : 33;
  return { src: `/img/jsal-ui/ui/${name}.webp`, w, h, alt, menu, cx: +(left / w * 100).toFixed(2), cy: +(top / h * 100).toFixed(2) };
};

// A short clip of a part in use, played in place of its still: a muted MP4 under site/img/jsal-ui/ui/clips/, drawn
// from the same sim pages as the store pages' GIFs but at a steady 30 frames a second in full colour (a GIF's
// fades have two to seven frames and 256 colours), its first frame as the still shown until it plays. The clips
// are framed differently (a panel, or a window with some of the game round it), so x and y say where each one's own
// content starts, in its pixels, for the crops. pw is how wide a phone draws it (760 unless given): smaller for a
// narrow clip whose point is across its whole width. A part with a clip shows it on its stage on the jsal.ui page and,
// if it has a page of its own, at the top of that page; adding one is a line here, its MP4 and its first frame as
// a WebP of the same name.
const clip = (name, w, h, x, y, alt, pw = 760) => ({ src: `/img/jsal-ui/ui/clips/${name}.mp4`, poster: `/img/jsal-ui/ui/clips/${name}.webp`, w, h, alt, pw, cx: +(x / w * 100).toFixed(2), cy: +(y / h * 100).toFixed(2) });
const CLIPS = {
  // the filter row and each upgrade's name, source and level, all across: zoomed out so a phone shows them together
  gear: clip("gear", 670, 684, 0, 0, "The Gear plan's upgrades for a hunter's chest, filtered by where they come from: dungeons, quests, crafted, world drops.", 420),
  professions: clip("professions", 824, 892, 60, 66, "Leatherworking's road to the cap: what to craft now, then each step ahead, with a recipe's tooltip saying where to learn it."),
  journal: clip("story", 836, 638, 0, 0, "The Journal's story of the day: levels reached, bosses defeated and loot, filtered by kind."),
  crafts: clip("orders", 836, 770, 12, 40, "Guild Crafts: orders from guildmates to make, the ones you asked for, and where each one stands."),
};

export const HOME = shot("home", 1320, 880, "jsal.ui's Home for a level 34 hunter: the XP bar and how long to the next level, what's new in this version, a talent point and a trainer visit ready now, and cards for the build, gear, professions, dungeons, the guild, today's games and the journal.", true);

// Home as a part of its own, first in the jsal.ui page's list
export const HOME_PART = { key: "home", when: "any", label: "Home", name: "Your whole character in one window", line: "What your next ding gets you, what's waiting at the trainer, and where each of your plans stands.", points: ["Opens with /jsal or the minimap button", "Every part has its own toggle in Settings", "Free, with its code on GitHub"], shot: HOME };

// when: "leveling" for the two planners that end at level 60, "sixty" for the page that starts there, "any" for a
// part that's useful all the way.
export const GROUPS = [
  {
    key: "plan", name: "Plan", line: "Know what's next at every level.",
    parts: [
      { key: "training", when: "leveling", label: "Training Planner", name: "Every trainer visit, planned to 60", line: "Know before you hearth: what's ready at the trainer, what it'll cost you and where the nearest one is.", points: ["Spells, pet and weapon training", "Your road to 60, visit by visit", "A pin on the nearest trainer"],
        shot: shot("training", 1317, 878, "The Training Planner: 9 spells ready for a level 46 hunter with their costs, the pet's training, and the road to 60 as a line of trainer visits.", true) },
      { key: "build", when: "leveling", label: "Build Planner", name: "Know where every point goes", line: "Follow a ready-made leveling build or theorycraft your own, and see what your next point does.", points: ["A leveling build for every class", "Your next point, and what it does", "Share a build as a line of text"],
        shot: shot("build", 1320, 880, "The Build Planner following a Beast Mastery leveling build: the plan level by level, with the next point, Deadly Aspects, ready to learn on the right.", true) },
      { key: "gear", when: "any", label: "Gear plan", name: "Upgrades for every slot, ranked for your spec", line: "Ranked with WoWSims' stat weights, with where each piece comes from. At 60 it turns into your pre-raid BiS list.", points: ["Boss, quest, vendor or crafter", "Tweak the weights if you disagree", "Star a piece, hear it when it drops"],
        shot: shot("gear", 1238, 859, "The Gear plan: every slot with what's worn and its best upgrade near your level, and for the ranged slot a list of upgrades with the quest each comes from.") },
      { key: "dungeons", when: "any", label: "Dungeon guide", name: "Know what drops before you zone in", line: "Each boss with its top drops for you and the drop chance on each, plus what falls off the trash.", points: ["Dungeons and raids down the side, by level", "Upgrades marked for your spec", "Quests to pick up before you go in"],
        shot: shot("dungeons", 1240, 860, "The Dungeon guide for Maraudon: each boss's best drops for you, then its quests, then its map with its bosses marked.") },
      { key: "endgame", when: "sixty", label: "Endgame", name: "Ready for raid night", line: "Your page for 60: how far along your pre-raid set is, which consumes to bring and what they'll cost.", points: ["Your pre-raid set, slot by slot", "Raid lockouts across your characters", "Long cooldowns like Transmute"],
        shot: shot("endgame", 1320, 880, "The Endgame page for a level 60 hunter: 9 of 16 slots at the pre-raid set, raid night's elixirs, food and potions with what they cost, raid lockouts and profession cooldowns.", true) },
    ],
  },
  {
    key: "craft", name: "Craft", line: "Level professions for less, and craft for each other.",
    parts: [
      { key: "professions", when: "any", label: "Professions", name: "A cheaper road to the cap", line: "Exactly what to craft and how many, using the mats in your bags and bank first.", points: ["What you have against what you need", "Where to learn or buy each recipe", "One click to a shopping list"],
        shot: shot("professions", 1320, 880, "Leatherworking's road to the cap: what to craft now, everything it takes against what's in the bags, and the steps ahead.", true) },
      { key: "crafts", when: "any", label: "Guild Crafts", name: "Craft for each other", line: "Ask the guild for a craft or an enchant, and the guildies who know the recipe hear about it.", points: ["Who makes what, and where they are", "Every order from asked to received", "Fills in the mail at the mailbox"],
        shot: shot("guild-crafts", 998, 919, "Guild Crafts: four open orders, one waiting for a crafter, two being made and one sent, each with its materials and where it stands.") },
      { key: "profit", when: "any", label: "Crafting profit", name: "Know what's worth making", line: "Every recipe your characters know, with what it costs to make against what it sells for.", points: ["Prices from Auctionator or your AH searches", "Every recipe, known or not", "Add a craft to your shopping list"],
        shot: shot("profit", 998, 919, "Crafting profit: 18 leatherworking recipes that make a profit, each with its cost to make, its sale price and the profit.") },
    ],
  },
  {
    key: "play", name: "Play", line: "The fun parts, and your guild.",
    parts: [
      { key: "journal", when: "any", label: "Journal", name: "A record of every level", line: "Your character's story, written as you play: levels, deaths, loot and favourite spots.", points: ["Time, gold and XP for each level", "Boss kills and raid nights at 60", "All your alts at a glance"],
        shot: shot("journal", 1320, 880, "The Journal's story for a level 34 hunter: each day's dungeon runs, first kills, levels and loot in the order they happened, with filters and days to jump to down the left.", true) },
      { key: "games", when: "any", label: "Daily games", name: "A game a day with your guild", line: "Daily Word, Icon Guess and Pal run: same for everyone, with your guild's results side by side.", points: ["Your record and streaks", "Share a result in guild chat", "A Guild Word your GM sets"],
        shot: shot("games", 1320, 880, "Daily games: today's Daily Word board, then Play on the Icon Guess card opens today's first icon.", true) },
      { key: "pals", when: "any", label: "Jsal's Pals", name: "A little friend that grows with you", line: "Hatch an egg, name whatever comes out and look after it. Your questing pays for its keep.", points: ["Feed it, play, tuck it in", "It grows up, twice", "It walks along your screen"],
        // One pal's life, from the addon's own pixel art (site/img/jsal-ui/pals/): [file, name, size in the art's pixels].
        // The page plays it with the addon's own pictures: the egg hatching (hatch: ten 96-pixel frames in a row) and
        // the light a pal grows in (grow: sixteen 128-pixel cells, eight to a row), timed as the addon times them.
        family: { say: "From a Toadstool egg: a Capling, then a Lanternshell, then a Bloomsage.", hatch: "capling-hatch", grow: "grow", forms: [["capling-egg", "Toadstool egg", 64], ["capling", "Capling", 64], ["lanternshell", "Lanternshell", 64], ["bloomsage", "Bloomsage", 80]] },
        shot: shot("pals", 458, 665, "A pal named Kevin asleep in its paddock, in pixel art, with its needs, how fond it is of you, and buttons to feed, treat, play and bath it.") },
    ],
  },
];

for (const g of GROUPS) for (const p of g.parts) if (CLIPS[p.key]) p.clip = CLIPS[p.key];

// A film is a part's still, moving: the same whole window recorded in the game, drawn in the still's own box (the
// stage's width, top-aligned, cut by the same fade) and played like the clips above. Where a part has both, the
// film is shown and the clip isn't. Its MP4 and its first frame as a WebP of the same name go in
// site/img/jsal-ui/ui/films/; w and h are its size in pixels, s how many seconds it runs.
// y: where a phone's crop starts when the film's first frame is scrolled, so the crop's top falls between two rows
const film = (name, w, h, s, y) => ({ src: `/img/jsal-ui/ui/films/${name}.mp4`, poster: `/img/jsal-ui/ui/films/${name}.webp`, w, h, s, ...(y ? { cy: +(y / h * 100).toFixed(2) } : {}) });
const FILMS = {
  home: film("home", 1320, 880, 6.6),
  journal: film("journal", 1320, 880, 9.2),
  training: film("training", 1320, 880, 7.4),
  build: film("build", 1320, 880, 7.4),
  gear: film("gear", 1240, 960, 9.2),
  dungeons: film("dungeons", 1240, 860, 9.2),
  endgame: film("endgame", 1320, 880, 7.4, 116),
  professions: film("professions", 1320, 880, 9.2),
  profit: film("profit", 1000, 920, 9.2),
  crafts: film("crafts", 1000, 920, 7.4),
  games: film("games", 1320, 880, 9.2),
  pals: film("pals", 1320, 880, 9.4),
};
if (FILMS.home) HOME_PART.film = FILMS.home;
for (const g of GROUPS) for (const p of g.parts) if (FILMS[p.key]) p.film = FILMS[p.key];

// A close-up for a part page's row: one card or list cut from a window at the game's own size (a WebP under
// site/img/jsal-ui/ui/), so its words read as they do in the game.
const closeup = (name, w, h, alt) => ({ src: `/img/jsal-ui/ui/${name}.webp`, w, h, alt });

// The six big parts each have a page of their own at /jsal-ui/<key>/ (John's pick of the landing mockups, 24 Nov
// 2026: "A, the tour"), all from one template (src/pages/jsal-ui/[part].astro): the part's window large under its
// headline, then a row for each thing it does, Good to know, two more parts and the download. A row shows a picture
// where the site has one of that view (a close-up in shot, or a clip from CLIPS by its part's key); the rest read
// as words alone until one is drawn. A part with a clip in CLIPS shows it at the top of its page. Every word here is checked against the addon's own code and the store pages: nothing it doesn't do.
// more: the landing row's link. command: the /jsal word that opens it, where there is one. next: two parts to read
// about next, each linking to its own page or, for a small part, its card on the landing.
export const PAGES = {
  training: {
    more: "More on the Training Planner",
    title: "Training Planner: jsal.ui for WoW Forever",
    description: "jsal.ui's Training Planner for WoW Forever: which spells are ready at the trainer and what they'll cost, a pin on the nearest trainer, and every trainer visit from here to 60.",
    lead: "Know before you hearth: which spells are ready at the trainer and what they'll cost you, a pin on the nearest trainer, and every visit from here to 60 laid out on one road. Pet and weapon training too.",
    rows: [
      { label: "Ready now", name: "What's ready, and what it costs", say: "The spells you can train right now, each with its price and the total, and whether your gold covers it. Your pet's training and new weapon skills sit on the same page.", points: ["Spells, pet and weapon training", "Each spell's price, and the total", "A pin on the nearest trainer"],
        shot: closeup("training-now", 512, 331, "The Training Planner's Train now list at level 46: nine spells and pet abilities with their ranks and prices, 13 skipped, and the visit's total with the gold left after.") },
      { label: "The road to 60", name: "Every visit from here to 60", say: "Each level where something new waits at the trainer, laid out on one road with how many spells it brings and what they cost, so the pricey visits never catch you short.", points: ["Your road to 60, visit by visit", "What each visit costs", "What your next ding brings"],
        shot: closeup("training-road", 746, 216, "The road to 60 from level 44: trainer visits at 48, 50, 52 and 54, each with what it costs and the spells it brings.") },
      { label: "Beside the spellbook", name: "The same plan, where you train", say: "A small panel opens beside your spellbook and at any class, pet or weapon trainer: what you can train now, what it costs and what the next level brings. At a trainer it shows only what that trainer teaches.", points: ["Beside the spellbook and at trainers", "Where you trained last, with a map pin", "A way back into the planner"] },
    ],
    good: [
      ["Train from the panel", "With its switch on in Settings, the panel stands in for the trainer's own window, with a Train button on each spell."],
      ["On Home too", "Home says what your next ding brings at the trainer, and whether you can afford it."],
      ["Its own switch", "Every part of jsal.ui starts on except the talent helper. Switch off any you don't want in Settings."],
    ],
    next: ["build", "gear"],
  },
  build: {
    more: "More on the Build Planner",
    title: "Build Planner: jsal.ui for WoW Forever",
    description: "jsal.ui's Build Planner for WoW Forever: follow a ready-made leveling build for your class or theorycraft your own, see your next talent point before you spend it, and share builds with your guild.",
    lead: "Follow a ready-made leveling build for your class, or theorycraft your own and share it. A card shows your next point and what it does, and when the point comes in, Learn spends it for you.",
    rows: [
      { label: "Ready-made builds", name: "A leveling build for every class", say: "Pick a build for your class and follow it level by level, so you know where each point goes before you get it. Got dual spec? Each spec follows its own build.", points: ["A leveling build for every class", "The plan, level by level", "Each spec follows its own build"],
        shot: closeup("build-plan", 449, 450, "A suggested Beast Mastery leveling build, level by level: each talent with its points, and at 10 to 14 Deadly Aspects marked as the next one to learn.") },
      { label: "Your next point", name: "See it before you spend it", say: "A card shows your next point and what it does. When the point comes in, press Learn on the card and it spends it for you, after showing each point it would spend and where it goes.", points: ["Your next point, and what it does", "Learn spends it for you", "It asks before it spends"],
        shot: closeup("build-next", 359, 165, "The Ready to learn card: Deadly Aspects, Beast Mastery rank 1 of 5, one point to spend and a Learn button.") },
      { label: "Share", name: "Theorycraft your own, then share it", say: "Make a build of your own and share it as a Wowhead talent calculator link or a short code for a guildmate. Import takes either, so a friend's build is a paste away.", points: ["A Wowhead link or a short code", "Import a guildmate's build", "Read as plain text, never run"],
        shot: closeup("build-share", 520, 232, "Export for a Beast Mastery leveling build: its Wowhead talent calculator link and its jsal.ui code, each in a box to copy.") },
    ],
    good: [
      ["The talent helper", "The one part that starts off. Switch it on in Settings and it names your next talent when a point comes in, and marks it in the talent window."],
      ["Nothing spent by surprise", "The helper's note never spends a point. Points are spent on the Build page, with Learn, after it asks."],
      ["On Endgame", "Endgame shows the build that goes with your pre-raid set, and before 60, how far along your leveling build you are."],
    ],
    next: ["training", "gear"],
  },
  gear: {
    more: "More on the Gear plan",
    command: "gear",
    title: "Gear plan: jsal.ui for WoW Forever",
    description: "jsal.ui's Gear plan for WoW Forever: upgrades for every slot ranked for your spec with WoWSims' stat weights, where each piece comes from, and your pre-raid BiS list at 60.",
    lead: "Every slot with what you're wearing and its upgrades near your level, ranked for your spec with WoWSims' stat weights, and where each piece comes from. At 60 it turns into your pre-raid BiS list.",
    rows: [
      { label: "Near your level", name: "Where every upgrade comes from", say: "Pick a slot for its upgrades in order, each with the boss, quest, vendor or crafter it comes from. Filter the list to dungeons, quests, crafted pieces or world drops.", points: ["Boss, quest, vendor or crafter", "Filter by where it comes from", "The dungeons to run for them"],
        shot: closeup("gear-slots", 552, 723, "The Gear plan's slots for a level 40 hunter: what's worn in each and the best upgrade near that level, with where it comes from and what it adds.") },
      { label: "At 60", name: "Your pre-raid BiS, slot by slot", say: "At 60 the plan turns into your pre-raid list: the piece to aim for in every slot, what you're already wearing, and which dungeons to run for the rest. No switch to find, and you can look ahead to it at any level.", points: ["The piece to aim for in every slot", "What you're already wearing", "Which dungeons to run for the rest"] },
      { label: "Stars", name: "Star a piece, hear about it when it drops", say: "Star the pieces you're after, even one the plan doesn't list. A starred piece gets a gold line on its tooltip anywhere, a banner when it drops and a line in chat as you walk into its dungeon.", points: ["A gold banner when it drops", "Its star on the boss in the Dungeon guide", "It clears once you're wearing it"] },
    ],
    good: [
      ["Your own weights", "Change any of WoWSims' numbers for your spec, or paste a whole Pawn scale. Reset goes back to WoWSims'."],
      ["Quest rewards too", "An arrow on every quest reward that's an upgrade for your spec, gold on the best one."],
      ["Its own window", "The Gear plan opens in a window of its own, with room for every slot."],
    ],
    next: ["dungeons", "endgame"],
  },
  dungeons: {
    more: "More on the Dungeon guide",
    command: "dungeons",
    title: "Dungeon guide: jsal.ui for WoW Forever",
    description: "jsal.ui's Dungeon guide for WoW Forever: every dungeon by level, each boss with its top drops for your spec and the drop chance on each, the trash loot, the quests to grab first and maps of Forever's own dungeons.",
    lead: "Every dungeon down the side by level. Each boss with its top drops for you and the chance of each, what falls off the trash, the quests to grab first and a map of Forever's own dungeons.",
    rows: [
      { label: "Bosses and loot", name: "Four drops a boss, and the trash", say: "A boss card keeps to the four drops worth your time: the pieces you've starred, then upgrades for your spec, then what you're likeliest to wear. The rest of its loot is tucked underneath. Under the bosses, a Trash card lists what the ordinary creatures drop.", points: ["The drop chance on every line", "Upgrades marked with how much better they are", "A star on what's on your Gear plan"],
        shot: closeup("dungeons-bosses", 484, 465, "Two of Maraudon's boss cards for a hunter: each boss's best drops with how often each one drops, upgrades marked with how much better they are, a starred piece, and the rest of a boss's loot as small pictures.") },
      { label: "Quests", name: "Every quest before you zone in", say: "What to pick up before the run, chains in order, with who gives each step and where. Quests already in your log show the game's own marks.", points: ["Chains, step by step", "Who gives it, and where", "A map pin for any step"] },
      { label: "Map", name: "Forever's own dungeons, mapped", say: "Forever's own dungeons come with Santiago Reyes's maps, used with his leave, and the bosses listed beside them with which ones have gear for you.", points: ["The map whole, floor by floor", "Bosses with gear for you, listed beside it", "Finding the bosses is up to you"], credit: true,
        shot: closeup("dungeons-map", 634, 477, "Santiago Reyes's map of Alcaz Prison's Main Unit in the Dungeon guide's Map tab, a button for each floor above it and his credit under it.") },
    ],
    good: [
      ["Its own window", "It opens in a window of its own, so a run's plan can stay up while you look at the rest."],
      ["Follows your spec", "Upgrades are marked for your spec, as on your Gear plan, and a piece you've starred shows on its boss."],
      ["Where the numbers come from", "Every line says how often it drops. \"About these numbers\", at the window's foot, says where they come from."],
    ],
    next: ["gear", "endgame"],
  },
  endgame: {
    more: "More on Endgame",
    title: "Endgame: jsal.ui for WoW Forever",
    description: "jsal.ui's Endgame page for WoW Forever at level 60: how far along your pre-raid set is, the consumes for raid night and what they'll cost, raid lockouts across your characters and long cooldowns.",
    lead: "Your page for 60: how far along your pre-raid set is, which consumes to bring to raid night and what they'll cost, and your raid lockouts and long cooldowns across your characters.",
    rows: [
      { label: "Your set", name: "How close your pre-raid set is", say: "Where your pre-raid set stands, slot by slot, with the next run that gets you closer and the build that goes with it.", points: ["Your pre-raid set, slot by slot", "The next run to make", "Your build for 60"],
        shot: closeup("endgame-set", 346, 314, "The Your set card: 9 of 16 slots at the pre-raid set, Scholomance as the next run, and the build for 60 that goes with it.") },
      { label: "Raid night", name: "What to bring, and what it costs", say: "WoWSims' consumes for your spec: what you're short of, how many to get and what that costs, from a vendor's price or the auction house's. Pick Simple or Max DPS, and how many nights you stock for.", points: ["Simple or Max DPS", "What it costs a night", "Kept on your shopping list"],
        shot: closeup("endgame-night", 345, 583, "The Raid night card: Simple or Max DPS, one night of three hours, each elixir, food and potion with how many to get and what it costs, about 27 gold in all, and the switch that keeps it on the shopping list.") },
      { label: "Raids and cooldowns", name: "Every character's lockouts", say: "Which raids each of your characters is saved to, and the long cooldowns like Transmute, so you know who's free and what's ready.", points: ["Raid lockouts across your characters", "Long cooldowns like Transmute", "Every character on one page"],
        shot: closeup("endgame-raids", 346, 438, "The Raids and Cooldowns cards: one character saved to Molten Core at 4 of 10 with two free, and Transmute and Mooncloth ready on the characters who have them.") },
    ],
    good: [
      ["Before 60 too", "Below 60 it leads with your goal for 60 and the build for it, with raid night folded to one line."],
      ["The Journal turns too", "At 60 the Journal switches to boss kills, lockouts and raid nights."],
      ["Its own switch", "Every part of jsal.ui starts on except the talent helper. Switch off any you don't want in Settings."],
    ],
    next: ["gear", "dungeons"],
  },
  professions: {
    more: "More on Professions",
    title: "Professions: jsal.ui for WoW Forever",
    description: "jsal.ui's Professions for WoW Forever: a cheaper road to your next rank, using the mats in your bags and bank first, where to learn or buy each recipe, and one click to a shopping list.",
    lead: "Exactly what to craft and how many, using the mats in your bags and bank first, where to learn or buy each recipe, and one click to turn it all into a shopping list.",
    rows: [
      { label: "Your road", name: "What to craft now, and every step after", say: "The road to your next rank: the one thing to make now, with what it takes against what's in your bags, then each step ahead to the cap. A recipe's tooltip says where to learn it.", points: ["What you have against what you need", "Every step to the cap", "Where to learn or buy each recipe"],
        shot: closeup("professions-now", 513, 222, "Do this now on Leatherworking's road: Guardian Gloves three times, with the heavy leather, cured heavy hide and silken thread it takes against what's in the bags.") },
      { label: "Where you craft", name: "The road, beside the profession window", say: "The same road sits beside the game's profession window, a stop for each step and a gold stop where the next rank is trained, with the recipes still to learn on a tab of their own.", points: ["Opens with the profession window", "A gold stop at each new rank", "Recipes to learn, on their own tab"] },
      { label: "Shopping list", name: "One click to a shopping list", say: "Put the whole road on your shopping list. It counts your bags and bank first, says what's left to buy, and at a vendor who sells something on it, a button buys it.", points: ["Bags and bank counted first", "Vendor and auction prices", "A Buy button at the vendor"],
        shot: closeup("professions-list", 515, 198, "Everything Leatherworking needs to reach 225, what's in the bags against what's needed, and Add the road to my shopping list.") },
    ],
    good: [
      ["Where prices come from", "Vendor prices come with the addon. Auction prices come from Auctionator's scan if you run it (while Crafting profit is on, as it is by default), and otherwise from your own auction house searches."],
      ["Straight to the list", "/jsal shop opens the shopping list on its own."],
      ["Its own switch", "Every part of jsal.ui starts on except the talent helper. Switch off any you don't want in Settings."],
    ],
    next: ["crafts", "profit"],
  },
};

// The small helpers, each with its own toggle in Settings
export const LITTLE = [
  ["Quick buttons", "A small bar you can park anywhere, with a gold dot when something's waiting."],
  ["Unlock Mode", "Move every jsal.ui piece at once, or type in an exact spot and size."],
  ["Flight bar", "On a flight: the route, the time left and today's games. Once you've flown a route, it's timed from your own flight."],
  ["Waypoint label", "Where the arrow's taking you, and how far."],
  ["Vendor run", "Repairs and sells your greys at any vendor."],
  ["Bag and gear warnings", "A heads-up before your bags fill up or your gear breaks."],
  ["Quest reward upgrades", "An arrow on every quest reward that's an upgrade for your spec, gold on the best one."],
  ["Quest tags", "Next to each tracked quest: where it sits in its chain and roughly how long it takes."],
  ["Tags on RestedXP's guide", "The same tags beside each step of RestedXP's guide, for when you keep the quest tracker hidden."],
  ["Level-up note", "On each new level, a line in chat with your talent points and whether the trainer has new ranks."],
  ["Bag button", "One button with your free bag space in place of the bag bar. Point at it for your cheapest items."],
  ["Menu bar look", "The game's menu bar drawn like the quick buttons: gold icons on dark tiles."],
  ["Food reminder", "A glowing tile while you aren't Well Fed. Point at it for the food in your bags and click one to eat."],
  ["Hunter helpers", "A tile to feed your pet when it isn't happy, a box that shows if you're in melee, the dead zone or shooting range, and a line on a beast's tooltip when taming it would teach your pet an ability rank it doesn't have yet."],
  ["Profession window extras", "On each recipe, the skill where it turns yellow, green and grey; beside each reagent, how many are in your bags and bank; a craft timer and a heads-up when your next rank can be trained."],
  ["Drop log", "Counts how often the creatures you loot drop the quest items you need, so quest tags can use Forever's own drop chances. /jsal drops shows it."],
  ["Outfit in other addons", "jsal.ui's font in the font lists of addons that share fonts, such as EllesmereUI."],
];
