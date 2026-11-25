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
// narrow clip whose point is across its whole width. A part with a clip shows it on its stage on the jsal.ui page;
// adding one is a line here, its MP4 and its first frame as a WebP of the same name.
const clip = (name, w, h, x, y, alt, pw = 760) => ({ src: `/img/jsal-ui/ui/clips/${name}.mp4`, poster: `/img/jsal-ui/ui/clips/${name}.webp`, w, h, alt, pw, cx: +(x / w * 100).toFixed(2), cy: +(y / h * 100).toFixed(2) });
const CLIPS = {
  // the filter row and each upgrade's name, source and level, all across: zoomed out so a phone shows them together
  gear: clip("gear", 670, 684, 0, 0, "The Gear plan's upgrades for a hunter's chest, filtered by where they come from: dungeons, quests, crafted, world drops.", 420),
  professions: clip("professions", 824, 892, 60, 66, "Leatherworking's road to the cap: what to craft now, then each step ahead, with a recipe's tooltip saying where to learn it."),
  journal: clip("story", 836, 638, 0, 0, "The Journal's story of the day: levels reached, bosses defeated and loot, filtered by kind."),
  crafts: clip("orders", 836, 770, 12, 40, "Guild Crafts: orders from guildmates to make, the ones you asked for, and where each one stands."),
};

export const HOME = { ...shot("home", 1320, 880, "jsal.ui's Home for a level 46 hunter: the XP bar and how long to the next level, what's new in this version, a trainer visit ready now, and cards for the build, gear, professions, dungeons, the guild, today's games and the journal.", true), src: "/img/jsal-ui/ui/films/home.webp" };

// Home as a part of its own, first in the jsal.ui page's list
export const HOME_PART = { key: "home", when: "any", label: "Home", name: "Your whole character in one window", line: "What your next ding gets you, what's waiting at the trainer, and where each of your plans stands.", points: ["Opens with /jsal or the minimap button", "Every part has its own toggle in Settings", "Free, with its code on GitHub"], shot: HOME };

// when: "leveling" for the two planners that end at level 60, "sixty" for the page that starts there, "any" for a
// part that's useful all the way.
export const GROUPS = [
  {
    key: "plan", name: "Plan", line: "Know what's next at every level.",
    parts: [
      { key: "training", when: "leveling", label: "Training Planner", name: "Every trainer visit, planned to 60", line: "Know before you hearth: what's ready at the trainer, what it'll cost you and where the nearest one is.", points: ["Spells, pet and weapon training", "Your road to 60, visit by visit", "A pin on the nearest trainer"],
        shot: shot("training", 1317, 878, "The Training Planner at level 46: 8 spells ready at the trainer with what they cost, the 13 skipped ones opened and closed again, the pet's training, and the road to 60 as a line of trainer visits.", true) },
      { key: "build", when: "leveling", label: "Build Planner", name: "Know where every point goes", line: "Follow a ready-made leveling build or theorycraft your own, and see what your next point does.", points: ["A leveling build for every class", "Your next point, and what it does", "Share a build as a line of text"],
        shot: shot("build", 1320, 880, "The Build Planner following a warrior's Prot leveling build: the plan level by level with the next point, Shield Specialization, on the right, then Edit opens the whole talent tree.", true) },
      { key: "gear", when: "any", label: "Gear plan", name: "Upgrades for every slot, ranked for your spec", line: "Ranked with WoWSims' stat weights, with where each piece comes from. At 60 it turns into your pre-raid BiS list.", points: ["Boss, quest, vendor or crafter", "Tweak the weights if you disagree", "Star a piece, hear it when it drops"],
        shot: shot("gear", 1238, 859, "The Gear plan: every slot with what's worn and its best upgrade near your level, then the head slot's upgrades, filtered to dungeon drops.") },
      { key: "dungeons", when: "any", label: "Dungeon guide", name: "Know what drops before you zone in", line: "Each boss with its top drops for you and the drop chance on each, plus what falls off the trash.", points: ["Dungeons and raids down the side, by level", "Upgrades marked for your spec", "Quests to pick up before you go in"],
        shot: shot("dungeons", 1240, 860, "The Dungeon guide for Maraudon: each boss's best drops for you, then its quests, then its map with its bosses marked.") },
      { key: "endgame", when: "sixty", label: "Endgame", name: "Ready for raid night", line: "Your page for 60: how far along your pre-raid set is, which consumes to bring and what they'll cost.", points: ["Your pre-raid set, slot by slot", "Raid lockouts across your characters", "Long cooldowns like Transmute"],
        shot: shot("endgame", 1320, 880, "The Endgame page at 60: 9 of 16 slots toward your pre-raid set with Stratholme next, raid night's consumes on Simple and then on Max DPS with how many to get and what they cost, raid lockouts across your characters, and profession cooldowns.", true) },
    ],
  },
  {
    key: "craft", name: "Craft", line: "Level professions for less, and craft for each other.",
    parts: [
      { key: "professions", when: "any", label: "Professions", name: "A cheaper road to the cap", line: "Exactly what to craft and how many, using the mats in your bags and bank first.", points: ["What you have against what you need", "Where to learn or buy each recipe", "One click to a shopping list"],
        shot: shot("professions", 1320, 880, "Professions for Leatherworking, then First Aid, then Cooking: what to craft now, everything it takes against what's in your bags, and the road to the cap.", true) },
      { key: "crafts", when: "any", label: "Guild Crafts", name: "Craft for each other", line: "Ask the guild for a craft or an enchant, and the guildies who know the recipe hear about it.", points: ["Who makes what, and where they are", "Every order from asked to received", "Fills in the mail at the mailbox"],
        shot: shot("guild-crafts", 998, 919, "Guild Crafts: four open orders, one waiting for a crafter, two being made and one sent, each with its materials and where it stands.") },
      { key: "profit", when: "any", label: "Crafting profit", name: "Know what's worth making", line: "Every recipe your characters know, with what it costs to make against what it sells for.", points: ["Prices from Auctionator or your AH searches", "And the ones you don't know yet", "Add a craft to your shopping list"],
        shot: shot("profit", 998, 919, "Crafting profit: 18 leatherworking recipes that make a profit, each with its cost to make, its sale price and the profit.") },
    ],
  },
  {
    key: "play", name: "Play", line: "The fun parts, and your guild.",
    parts: [
      { key: "journal", when: "any", label: "Journal", name: "Your story, level by level", line: "From the day you install it: levels, deaths, boss kills, blues and purples, and where you spend your time.", points: ["Time, gold and XP for each level", "Boss kills and raid nights at 60", "All your alts at a glance"],
        shot: shot("journal", 1320, 880, "The Journal for a level 46 hunter: a summary with the time spent on every level and counts like foes defeated and gold earned, then the story of each day, then each ten levels' time, XP, gold, kills and deaths.", true) },
      { key: "games", when: "fun", label: "Daily games", name: "A game a day with your guild", line: "Daily Word, Icon Guess and Pal run, with your own pal as the runner: same for everyone, with your guild's results side by side.", points: ["Your record and streaks", "Share a result in guild chat", "A Guild Word your GM sets"],
        shot: shot("games", 1320, 880, "Daily games: today's Daily Word board, then Play on the Icon Guess card opens today's first icon.", true) },
      { key: "pals", when: "fun", label: "Jsal's Pals", name: "A little friend that grows with you", line: "Hatch an egg, name whatever comes out and look after it. Your questing pays for its keep.", points: ["Feed it, play, tuck it in", "It grows up, twice", "It walks along your screen"],
        // One pal's life, from the addon's own pixel art (site/img/jsal-ui/pals/): [file, name, size in the art's pixels].
        // The page plays it with the addon's own pictures: the egg hatching (hatch: ten 96-pixel frames in a row) and
        // the light a pal grows in (grow: sixteen 128-pixel cells, eight to a row), timed as the addon times them.
        family: { say: "From a Toadstool egg: a Capling, then a Lanternshell, then a Bloomsage.", hatch: "capling-hatch", grow: "grow", forms: [["capling-egg", "Toadstool egg", 64], ["capling", "Capling", 64], ["lanternshell", "Lanternshell", 64], ["bloomsage", "Bloomsage", 80]] },
        shot: shot("pals", 458, 665, "A pal named Kevin asleep in its paddock, in pixel art, with its needs, how fond it is of you, and buttons to feed, treat, play and bath it.") },
    ],
  },
];

for (const g of GROUPS) for (const p of g.parts) if (CLIPS[p.key]) p.clip = CLIPS[p.key];

// A film is a part's still, moving: its window recorded in the game, drawn in the stage's frame (the stage's width,
// top-aligned, held to Home's 3:2 shape and cut by the same fade) and played like the clips above. Where a part has
// both, the film is shown and the clip isn't. Its MP4 and its first frame as a WebP of the same name go in
// site/img/jsal-ui/ui/films/; w and h are its size in pixels, s how many seconds it runs.
// The own windows (gear, dungeons, profit, crafts) are the whole window. A page of the dashboard is its page
// alone (page): the menu down the left and the title bar are cut off, so the page's words come out larger on the
// stage; it needs no crop offset (cx, cy 0), and a phone draws it 626px wide, the scale the whole window had there.
const film = (name, w, h, s, page = false) => ({ src: `/img/jsal-ui/ui/films/${name}.mp4`, poster: `/img/jsal-ui/ui/films/${name}.webp`, w, h, s, ...(page ? { cx: 0, cy: 0, pw: 626 } : {}) });
const FILMS = {
  journal: film("journal", 1086, 830, 9.2, true),
  training: film("training", 1086, 830, 7.4, true),
  build: film("build", 1086, 830, 7.4, true),
  gear: film("gear", 1240, 960, 9.2),
  dungeons: film("dungeons", 1240, 860, 9.2),
  endgame: film("endgame", 1086, 830, 7.4, true),
  professions: film("professions", 1086, 830, 9.2, true),
  profit: film("profit", 1000, 920, 9.2),
  crafts: film("crafts", 1000, 920, 7.4),
  games: film("games", 1086, 830, 9.2, true),
  pals: film("pals", 1320, 880, 9.4),
};
for (const g of GROUPS) for (const p of g.parts) if (FILMS[p.key]) p.film = FILMS[p.key];

// The parts you'll use most, under the tour: the addon's three groups again, each a small bento of the things you'll use most,
// shown from a side the tour doesn't (John, 25 Nov 2026: Plan, Craft and Play, "dynamic", windows zoomed out "to
// showcase the feature", not to be read). Each group's tiles fill named slots in its layout (big, wide, s1, s2): a tile
// with a shot shows a window drawn to fit its tile, sw of the window's pixels across it from x, y (and on a phone
// psw from px, py, closer and so more readable); x "center" sits a narrow window in the middle of its tile instead,
// never drawn larger than the game draws it; a pen tile shows a pal in its meadow. The words are a player's: what it
// does for you in the game, never a sales line.
const look = (src, nw, alt, [x, y, sw], [px, py, psw]) => ({ src: `/img/jsal-ui/ui/${src}`, nw, alt, x, y, sw, px, py, psw, center: x === "center" });
export const CLOSER = [
  { key: "plan", name: "Plan", line: "Know what's next at every level.", tiles: [
    { slot: "big", beside: true, icon: "training", name: "Train right at the trainer",
      line: "A panel beside the trainer's window: what you can train, what it costs, and what your next level brings. One click trains it all.",
      shot: { ...look("training-whole-trainer.webp", 388, "jsal.ui's panel beside a hunter trainer: three spells to train with their prices, what level 48 brings, and a Train all button.", ["center", 0, 520], ["center", 0, 620]), bg: "peaks" } },
    { slot: "s1", icon: "build", name: "See your next talent point", line: "When a point comes in, the Ready to learn card names it. Learn spends it, after it asks." },
    { slot: "s2", icon: "dungeons", name: "Every dungeon, boss by boss", line: "Each boss's best drops for your spec, the quests to grab first, and a map." },
    { slot: "wide", beside: true, icon: "gear", name: "Star the gear you're after", line: "Its tooltip says so wherever it turns up, and you'll hear when it drops.",
      shot: look("gear-stars.webp", 691, "A starred chest piece's tooltip in the game: jsal.ui's gold line says it's starred in your gear plan and how much better it is than what you wear.", [0, 0, 560], [0, 0, 460]) },
  ] },
  { key: "craft", name: "Craft", line: "Level professions for less, and craft for each other.", tiles: [
    { slot: "wide", icon: "shop", name: "Shop once for the whole road", line: "It counts your bags and bank first. At a vendor, a button buys the rest.",
      shot: { ...look("professions-whole-list.webp", 378, "jsal.ui's Shopping list: five crafts with how many of each, then what's still to get from a vendor, with prices.", ["center", 0, 500], ["center", 0, 560]), bg: "fields", top: true } },
    { slot: "s1", icon: "profit", name: "Crafts that pay for themselves", line: "See which recipes come out ahead before you craft for the auction house." },
    { slot: "s2", icon: "crafts", name: "Ask the guild for a craft", line: "Need an enchant or a piece you can't make? Guildies who know the recipe hear about it." },
    { slot: "big", icon: "professions", name: "Your road to the cap", line: "Each step with what to make and how many, and where to learn or buy each recipe.",
      shot: look("professions-whole.webp", 1086, "Leatherworking's road to 300: each step with the craft to make, how many, and whether its recipe comes from the trainer or a pattern.", [26, 344, 1040], [20, 380, 540]) },
  ] },
  { key: "sixty", name: "At 60", line: "It keeps going after you ding.", tiles: [
    { slot: "big", beside: true, icon: "endgame", name: "Know where to go next",
      line: "Your page for 60 counts how close your pre-raid set is, names the next run that gets you closer, and pairs it with the build for 60.",
      shot: { ...look("endgame-set.webp", 346, "The Your set card: 9 of 16 slots at the pre-raid set, Scholomance as the next run with one piece for you, and the build for 60 that goes with the set.", ["center", 0, 480], ["center", 0, 440]), bg: "tree" } },
    { slot: "s1", icon: "gear", name: "Your pre-raid BiS", line: "At 60 the Gear plan turns into your pre-raid list, slot by slot." },
    { slot: "s2", icon: "journal", name: "Raid nights, remembered", line: "At 60 the Journal switches to boss kills and raid nights." },
    { slot: "wide", icon: "endgame", name: "Every alt's lockouts", line: "Which raids each character is saved to, and cooldowns like Transmute and Mooncloth.",
      shot: { ...look("endgame-raids.webp", 346, "The Raids and Cooldowns cards: one character saved to Molten Core at 4 of 10 with two free, and Transmute and Mooncloth ready on the characters who have them.", ["center", 0, 600], ["center", 0, 590]), bg: "rock" } },
  ] },
  { key: "play", name: "Play", line: "The fun parts, and your guild.", tiles: [
    { slot: "big", icon: "journal", name: "Every level, remembered", line: "Hours on each level, foes defeated, deaths, flights and gold, from the day you install it. All your alts too.",
      shot: look("films/journal.webp", 1086, "The Journal's numbers: time on every level as a chart, ten counts such as foes defeated, quests done and gold earned, and what you've used and where you've been most.", [0, 270, 1086], [26, 400, 540]) },
    { slot: "wide", beside: true, icon: "pals", name: "A pal to raise", line: "Hatch an egg and look after what comes out. It grows up twice, and your questing pays for its keep.",
      pen: { src: "/img/jsal-ui/pals/capling.png", alt: "A Capling, a baby pal, in the addon's pixel art, standing in its meadow pen." } },
    { slot: "s1", icon: "games", name: "A game a day", line: "Daily Word, Icon Guess and Pal run: the same for everyone, so the whole guild can compare." },
  ] },
];

// The small helpers, each with its own toggle in Settings, in groups by where you'd notice them (John, 25 Nov 2026,
// his pick of two mockups: "1, the groups"), each told in one short line. In page order, which is also column order:
// the three columns read Questing then crafters and hunters, Bags and vendors, Getting around then Your screen. The
// level-up note isn't listed, and the quest tags cover RestedXP's guide too (John, the same day).
export const LITTLE = [
  { name: "Questing", items: [
    ["Quest tags", "Where each quest sits in its chain and roughly how long it takes, beside your tracker or each step of RestedXP's guide."],
    ["Quest reward upgrades", "An arrow on rewards that are upgrades for your spec, gold on the best."],
    ["Drop log", "Counts how often mobs drop the quest items you need. /jsal drops shows it."],
  ] },
  { name: "For crafters and hunters", items: [
    ["Profession window extras", "Skill-up colours, mats in your bags and bank, and a craft timer."],
    ["Hunter helpers", "Hunters only: pet happiness, melee and range at a glance, and new pet ranks on a beast's tooltip."],
  ] },
  { name: "Bags and vendors", items: [
    ["Vendor run", "Repairs and sells your greys at any vendor."],
    ["Bag and gear warnings", "A heads-up before your bags fill or your gear breaks."],
    ["Bag button", "Your free bag space in one button. Point at it for your cheapest items."],
    ["Food reminder", "A glowing tile while you aren't Well Fed. Click a food to eat it."],
  ] },
  { name: "Getting around", items: [
    ["Flight bar", "Your route, the time left and today's games while you fly."],
    ["Waypoint label", "Where the arrow's taking you, and how far."],
    ["Quick buttons", "A small bar you can park anywhere, with a gold dot when something's waiting."],
  ] },
  { name: "Your screen", items: [
    ["Unlock Mode", "Move every jsal.ui piece at once, or type an exact spot and size."],
    ["Menu bar look", "The game's menu bar as gold icons on dark tiles."],
    ["jsal.ui's font in other addons", "Its font in the font lists of addons like EllesmereUI."],
  ] },
];
