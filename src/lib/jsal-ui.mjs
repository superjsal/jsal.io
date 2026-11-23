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
// narrow clip whose point is across its whole width.
const clip = (name, w, h, x, y, alt, pw = 760) => ({ src: `/img/jsal-ui/ui/clips/${name}.mp4`, poster: `/img/jsal-ui/ui/clips/${name}.webp`, w, h, alt, pw, cx: +(x / w * 100).toFixed(2), cy: +(y / h * 100).toFixed(2) });
const CLIPS = {
  // the filter row and each upgrade's name, source and level, all across: zoomed out so a phone shows them together
  gear: clip("gear", 670, 684, 0, 0, "The Gear plan's upgrades for a hunter's chest, filtered by where they come from: dungeons, quests, crafted, world drops.", 420),
  professions: clip("professions", 824, 892, 60, 66, "Leatherworking's road to the cap: what to craft now, then each step ahead, with a recipe's tooltip saying where to learn it."),
  journal: clip("story", 836, 638, 0, 0, "The Journal's story of the day: levels reached, bosses defeated and loot, filtered by kind."),
  crafts: clip("orders", 836, 770, 12, 40, "Guild Crafts: orders from guildmates to make, the ones you asked for, and where each one stands."),
};

export const HOME = shot("home", 1318, 877, "jsal.ui's Home for a level 46 hunter: the XP bar and what level 47 brings, what's new in this version, a trainer visit ready now, and cards for the build, gear, professions, dungeons, the guild, today's games and the journal.", true);

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
        shot: shot("build", 1317, 877, "The Build Planner following a Beast Mastery leveling build: the plan level by level, with the next point, Careful Aim, described on the right.", true) },
      { key: "gear", when: "any", label: "Gear plan", name: "Upgrades for every slot, ranked for your spec", line: "Ranked with WoWSims' stat weights, with where each piece comes from. At 60 it turns into your pre-raid BiS list.", points: ["Boss, quest, vendor or crafter", "Tweak the weights if you disagree", "Star a piece, hear it when it drops"],
        shot: shot("gear", 1238, 859, "The Gear plan: every slot with what's worn and its best upgrade near your level, and for the ranged slot a list of upgrades with the quest each comes from.") },
      { key: "dungeons", when: "any", label: "Dungeon guide", name: "Know what drops before you zone in", line: "Each boss with its top drops for you and the drop chance on each, plus what falls off the trash.", points: ["Dungeons and raids down the side, by level", "Upgrades marked for your spec", "Quests to pick up before you go in"],
        shot: shot("dungeons", 1240, 860, "The Dungeon guide on Maraudon: the dungeons listed down the left by level, and each boss as a card with its drops for a hunter and how often each one drops.") },
      { key: "endgame", when: "sixty", label: "Endgame", name: "Ready for raid night", line: "Your page for 60: how far along your pre-raid set is, which consumes to bring and what they'll cost.", points: ["Your pre-raid set, slot by slot", "Raid lockouts across your characters", "Long cooldowns like Transmute"],
        shot: shot("endgame", 1311, 878, "The Endgame page for a level 60 hunter: 9 of 16 slots at the pre-raid set, raid night's elixirs, food and potions with what they cost, raid lockouts and profession cooldowns.", true) },
    ],
  },
  {
    key: "craft", name: "Craft", line: "Level professions for less, and craft for each other.",
    parts: [
      { key: "professions", when: "any", label: "Professions", name: "A cheaper road to the cap", line: "Exactly what to craft and how many, using the mats in your bags and bank first.", points: ["What you have against what you need", "Where to learn or buy each recipe", "One click to a shopping list"],
        shot: shot("professions", 1319, 879, "Leatherworking's road to the cap: what to craft now, everything it takes against what's in the bags, and the steps ahead.", true) },
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
        shot: shot("journal", 1319, 885, "The Journal's summary for a level 40 hunter: time at each level as a chart, then foes defeated, miles travelled, quests, deaths and the most-used spells and places.", true) },
      { key: "games", when: "any", label: "Daily games", name: "A game a day with your guild", line: "Daily Word, Icon Guess and Pal run: same for everyone, with your guild's results side by side.", points: ["Your record and streaks", "Share a result in guild chat", "A Guild Word your GM sets"],
        shot: shot("games", 1318, 878, "Today's games: Daily Word solved in 4, Icon Guess 9 of 10 and Pal run, with a card for the Guild Word and the guild's results beside it.", true) },
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
];
