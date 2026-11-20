// jsal.ui's parts as the jsal.ui page shows them, in the store pages' three groups (Plan, Craft, Play), each with its
// window from the game in the addon's current look: a WebP under site/img/jsal-ui/ui/, at the game's own size.
// The headlines and points are the store cards' own words.
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
// narrow clip whose point is across its whole width.
const clip = (name, w, h, x, y, alt, pw = 760) => ({ src: `/img/jsal-ui/ui/clips/${name}.mp4`, poster: `/img/jsal-ui/ui/clips/${name}.webp`, w, h, alt, pw, cx: +(x / w * 100).toFixed(2), cy: +(y / h * 100).toFixed(2) });
const CLIPS = {
  // the filter row and each upgrade's name, source and level, all across: zoomed out so a phone shows them together
  gear: clip("gear", 670, 684, 0, 0, "The Gear plan's upgrades for a hunter's chest, filtered by where they come from: dungeons, quests, crafted, world drops.", 420),
  professions: clip("professions", 824, 892, 60, 66, "Leatherworking's road to the cap: what to craft now, then each step ahead, with a recipe's tooltip saying where to learn it."),
  journal: clip("story", 836, 638, 0, 0, "The Journal's story of the day: levels reached, bosses defeated and loot, filtered by kind."),
  dungeons: clip("dungeons", 836, 722, 24, 44, "The Dungeon guide picking Maraudon: each boss's loot with drop chances and the upgrades marked, then the quests to pick up."),
  crafts: clip("orders", 836, 770, 12, 40, "Guild Crafts: orders from guildmates to make, the ones you asked for, and where each one stands."),
};

export const HOME = shot("home", 1319, 806, "jsal.ui's Home for a level 40 hunter: the XP bar and what level 41 brings, a trainer visit ready now, and cards for the build, gear, professions, dungeons, the guild, today's games and the journal.", true);

export const GROUPS = [
  {
    key: "plan", name: "Plan", line: "Know what's next at every level.",
    parts: [
      { key: "training", label: "Training Planner", name: "Every trainer visit, planned to 60", line: "Know what's ready, what it costs and where the nearest trainer is.", points: ["Spells, pet and weapon training", "Your road to 60, visit by visit", "A pin on the nearest trainer"],
        shot: shot("training", 1323, 879, "The Training Planner: 18 spells ready for a level 40 hunter with their costs, the pet's training, and the road to 60 as a line of trainer visits.", true) },
      { key: "build", label: "Build Planner", name: "Know where every point goes", line: "Follow a ready-made leveling build or plan your own, and see what your next point gives you.", points: ["A leveling build for every class", "Your next point, and what it does", "Share a build as a line of text"],
        shot: shot("build", 1319, 879, "The Build Planner following a Beast Mastery leveling build: the plan level by level, with the next point, Lethal Attacks, described on the right.", true) },
      { key: "gear", label: "Gear plan", name: "The best upgrade for every slot", line: "Ranked for your spec by WoWSims' stat weights, with where each piece comes from.", points: ["Boss, quest, vendor or crafter", "Weights you can change", "Star a piece, hear when it drops"],
        shot: shot("gear", 1238, 859, "The Gear plan: every slot with what's worn and its best upgrade near your level, and for the ranged slot a list of upgrades with the quest each comes from.") },
      { key: "dungeons", label: "Dungeon guide", name: "Know what drops before you go", line: "Every boss with its loot and drop chances, and what's an upgrade for you.", points: ["Bosses in the order you meet them", "Upgrades marked for your spec", "Quests to pick up on the way in"],
        shot: shot("dungeons", 998, 859, "The Dungeon guide for The Drowned City: each boss as a card with its loot, drop chances and the upgrades marked.") },
    ],
  },
  {
    key: "craft", name: "Craft", line: "Level professions for less, and craft for each other.",
    parts: [
      { key: "professions", label: "Professions", name: "The cheapest road to the cap", line: "Exactly what to craft and how many, using what's in your bags and bank first.", points: ["What you have against what you need", "Where to learn or buy each recipe", "One click to a shopping list"],
        shot: shot("professions", 1319, 879, "Leatherworking's road to the cap: what to craft now, everything it takes against what's in the bags, and the steps ahead.", true) },
      { key: "crafts", label: "Guild Crafts", name: "Craft for each other", line: "Ask the guild for a craft or an enchant. Guildmates who know the recipe hear about it.", points: ["Who makes what, and where they are", "Every order from asked to received", "Fills in the letter at the mailbox"],
        shot: shot("guild-crafts", 998, 919, "Guild Crafts: four open orders, one waiting for a crafter, two being made and one sent, each with its materials and where it stands.") },
      { key: "profit", label: "Crafting profit", name: "Know what's worth making", line: "Every recipe your characters know, by what it costs to make and what it sells for.", points: ["Prices from Auctionator or your searches", "Every recipe, known or not", "Add a craft to your shopping list"],
        shot: shot("profit", 998, 919, "Crafting profit: 18 leatherworking recipes that make a profit, each with its cost to make, its sale price and the profit.") },
    ],
  },
  {
    key: "play", name: "Play", line: "The fun parts, and your guild.",
    parts: [
      { key: "journal", label: "Journal", name: "A record of every level", line: "Your levels, deaths, loot and favourite places, written as you play.", points: ["Time, gold and XP for each level", "A story of your days", "All your characters at a glance"],
        shot: shot("journal", 1319, 885, "The Journal's summary for a level 40 hunter: time at each level as a chart, then foes defeated, miles travelled, quests, deaths and the most-used spells and places.", true) },
      { key: "games", label: "Daily games", name: "A game a day with your guild", line: "Daily Word, Icon Guess and Pal run: the same for everyone, with your guild's results side by side.", points: ["Your record and streaks", "Your guild's day under the games", "Share a result in guild chat"],
        shot: shot("games", 1319, 879, "Today's games: Daily Word solved in 3, Icon Guess 10 of 10 and a Pal run time, with the guild's results below.", true) },
      { key: "guild", label: "Guild", name: "See how your guild is doing", line: "Who in the guild runs jsal.ui, who's online, and how everyone did in today's games.", points: ["Today's games, guildmate by guildmate", "Today's best, at a glance", "A Guild Word your guild master sets"],
        shot: shot("guild", 1319, 879, "The Guild page: seven guildmates who run jsal.ui, four online, with each one's scores in today's games and today's best beside them.", true) },
      { key: "pals", label: "Jsal's Pals", name: "A little friend that grows with you", line: "Hatch an egg, name what comes out and look after it. Your questing pays for its keep.", points: ["Feed it, play, tuck it in", "It grows up, twice", "It walks along your screen"],
        shot: shot("pals", 458, 665, "A pal named Kevin asleep in its paddock, in pixel art, with its needs, how fond it is of you, and buttons to feed, treat, play and bath it.") },
    ],
  },
];

for (const g of GROUPS) for (const p of g.parts) if (CLIPS[p.key]) p.clip = CLIPS[p.key];

// The small helpers, each with its own switch in Settings
export const LITTLE = [
  ["Quick buttons", "A small bar you can put anywhere, with a gold dot when something's waiting."],
  ["Unlock Mode", "Move every jsal.ui piece at once, or type its exact spot and size."],
  ["Flight bar", "While you fly: the route, the time left and today's games."],
  ["Waypoint label", "Where the game's arrow is taking you, and how far."],
  ["Vendor run", "Repairs and sells your greys at any vendor."],
  ["Bag and gear warnings", "A heads-up before your bags fill or your gear breaks."],
  ["Layers", "Shows which layer you're on, and joins a guildmate's."],
  ["Quest tags", "Beside each tracked quest: its place in a chain and about how long it takes."],
];
