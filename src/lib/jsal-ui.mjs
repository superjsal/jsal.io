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
      { key: "profit", when: "any", label: "Crafting profit", name: "Know what's worth making", line: "Every recipe your characters know, with what it costs to make against what it sells for.", points: ["Prices from Auctionator or your AH searches", "Every recipe, known or not", "Add a craft to your shopping list"],
        shot: shot("profit", 998, 919, "Crafting profit: 18 leatherworking recipes that make a profit, each with its cost to make, its sale price and the profit.") },
    ],
  },
  {
    key: "play", name: "Play", line: "The fun parts, and your guild.",
    parts: [
      { key: "journal", when: "any", label: "Journal", name: "A record of every level", line: "Your character's story, written as you play: levels, deaths, loot and favourite spots.", points: ["Time, gold and XP for each level", "Boss kills and raid nights at 60", "All your alts at a glance"],
        shot: shot("journal", 1320, 880, "The Journal for a level 46 hunter: a summary with the time spent on every level and counts like foes defeated and gold earned, then the story of each day, then each ten levels' time, XP, gold, kills and deaths.", true) },
      { key: "games", when: "fun", label: "Daily games", name: "A game a day with your guild", line: "Daily Word, Icon Guess and Pal run: same for everyone, with your guild's results side by side.", points: ["Your record and streaks", "Share a result in guild chat", "A Guild Word your GM sets"],
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

// A close-up for a part page's row: one card or list cut from a window at the game's own size (a WebP under
// site/img/jsal-ui/ui/), so its words read as they do in the game.
const closeup = (name, w, h, alt) => ({ src: `/img/jsal-ui/ui/${name}.webp`, w, h, alt });
// The whole screen a wide window shows in place of the film and the close-ups (John's pick of the job 146 mockups,
// 24 Nov 2026: "A. tooltip", with B's dim; then "bring back the 3 ticks" and "tooltip over to the side"): one sharp
// still of the part's whole window at the game's own size, w by h, cut with equal room round its cards. A page with
// a screen gives each row a box, [x, y, w, h] in the still's pixels round the thing it names, and ticks, its three
// points, for the tooltip that opens beside that box (to its right where it fits, else to its left). Phones and
// narrow windows keep the film and the close-ups.
const whole = (src, w, h, alt) => ({ src, w, h, alt });
// A stage is the whole screen made of pieces (John's pick of the job 150 mockups, 24 Nov 2026: "B for both"), for a
// part whose things aren't all in one window: its window, with the other pieces laid over its edge the way they sit
// over each other in the game, each at the game's own size. w by h is the stage; a piece is one cut picture (w by h,
// its own pixels) whose frame, 1px wider each side, has its top left corner at x, y; card gives it a deeper shadow.
// Each row gives a box on the stage (in the stage's pixels), the piece the box lies on, and the side its tooltip
// opens on (right, left, or above-end: over the box, at its right end); order is the order of the numbered dots.
const piece = (name, x, y, w, h, alt, card = false) => ({ src: `/img/jsal-ui/ui/${name}.webp`, x, y, w, h, alt, card });

// The six big parts each have a page of their own at /jsal-ui/<key>/ (John's pick of the landing mockups, 24 Nov
// 2026: "A, the tour"), all from one template (src/pages/jsal-ui/[part].astro): the part's window large under its
// headline, then a section for each thing it does, Good to know, two more parts and the download. A section is its
// picture (a close-up in shot, or a clip from CLIPS by its part's key) with its label, name and one short sentence
// (say) as a caption under it; one with no picture yet is its caption alone, and giving it a shot is all it takes to
// add one. A part with a clip in CLIPS shows it at the top of its page. Every word here is checked against the addon's
// own code and the store pages: nothing it doesn't do.
// more: the landing row's link. command: the /jsal word that opens it, where there is one. next: two parts to read
// about next, each linking to its own page or, for a small part, its card on the landing.
export const PAGES = {
  training: {
    more: "More on the Training Planner",
    title: "Training Planner: jsal.ui for WoW Forever",
    description: "jsal.ui's Training Planner for WoW Forever: which spells are ready at the trainer and what they'll cost, a pin on the nearest trainer, and every trainer visit from here to 60.",
    lead: "Know before you hearth: which spells are ready at the trainer and what they'll cost you, a pin on the nearest trainer, and every visit from here to 60 laid out on one road. Pet and weapon training too.",
    stage: { w: 1088, h: 1138, order: [0, 2, 1, 3], pieces: [
      piece("training-whole", 0, 0, 1086, 690, "The Training Planner at level 46: 7 spells ready for 8 gold 34 silver with the nearest trainer named, the pet's training and weapon skills, and the road to 60 as a line of trainer visits."),
      piece("training-whole-pin", 64, 676, 135, 36, "The label jsal.ui puts over the nearest trainer in the game world: the trainer's name and how many yards to go."),
      piece("training-whole-trainer", 658, 676, 388, 460, "jsal.ui's panel at a hunter trainer: three spells to train with their prices, what level 48 brings, a Train all button and a way back into the planner.", true),
    ] },
    rows: [
      { label: "Ready now", name: "What's ready, and what it costs", say: "Spells, pet and weapon training you can train now, and whether your gold covers it.",
        box: [15, 23, 526, 383], on: 0, side: "right", ticks: ["Spells, pet and weapon training", "Each spell's price, and the total", "A pin on the nearest trainer"],
        shot: closeup("training-now", 512, 331, "The Training Planner's Train now list at level 46: nine spells and pet abilities with their ranks and prices, 13 skipped, and the visit's total with the gold left after.") },
      { label: "Nearest trainer", name: "A pin on the nearest trainer", say: "Show trainer on map pins the nearest one and counts the yards as you walk.",
        box: [64, 676, 137, 38], on: 1, side: "right", ticks: ["The nearest trainer, pinned in the world", "The trainer's name over the pin", "The yards counted down as you walk"],
        shot: closeup("training-pin", 360, 140, "The pin jsal.ui puts on the nearest trainer in the game world: a gold diamond under a label with the trainer's name and 44 yards to go.") },
      { label: "The road to 60", name: "Every visit from here to 60", say: "What each visit costs, so the pricey visits never catch you short.",
        box: [15, 464, 1044, 204], on: 0, side: "above-end", ticks: ["Your road to 60, visit by visit", "What each visit costs", "What your next ding brings"],
        shot: closeup("training-road", 746, 216, "The road to 60 from level 44: trainer visits at 48, 50, 52 and 54, each with what it costs and the spells it brings.") },
      { label: "Beside the spellbook", name: "The same plan, where you train", say: "A small panel opens beside your spellbook and at any class, pet or weapon trainer.",
        box: [658, 676, 390, 462], on: 2, side: "left", ticks: ["Beside the spellbook and at trainers", "Where you trained last, with a map pin", "A way back into the planner"],
        shot: closeup("training-trainer", 382, 403, "jsal.ui's panel at a warrior trainer: two spells to train with their prices, what the next level brings, a Train all button and a way back into the planner.") },
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
      { label: "Ready-made builds", name: "A leveling build for every class", say: "Follow it level by level. Got dual spec? Each spec follows its own build.",
        shot: closeup("build-plan", 449, 450, "A suggested Beast Mastery leveling build, level by level: each talent with its points, and at 10 to 14 Deadly Aspects marked as the next one to learn.") },
      { label: "Your next point", name: "See it before you spend it", say: "Press Learn and it spends the point for you, after showing where it goes.",
        shot: closeup("build-next", 359, 165, "The Ready to learn card: Deadly Aspects, Beast Mastery rank 1 of 5, one point to spend and a Learn button.") },
      { label: "Share", name: "Theorycraft your own, then share it", say: "Share it as a Wowhead link or a short code. Import takes either.",
        shot: closeup("build-share", 512, 224, "Export for a Beast Mastery leveling build: its Wowhead talent calculator link and its jsal.ui code, each in a box to copy.") },
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
    stage: { w: 1275, h: 1032, pieces: [
      piece("gear-whole", 0, 72, 1238, 958, "The Gear plan for a level 46 Survival hunter: 16 slots that can be better, each with what's worn, its best upgrade near that level, where it comes from and how much better it is, and the dungeons to run for them."),
      piece("gear-whole-at60", 644, 252, 629, 739, "The Gear plan at 60 for a Survival hunter: every slot with the piece to aim for, where it comes from and how much better it is than what's worn.", true),
      piece("gear-whole-star", 1026, 0, 247, 98, "jsal.ui's lines on a helm's tooltip in the game: 5% better than equipped, starred in your gear plan, and +10 Intellect and +5 Agility over the helm you wear."),
    ] },
    rows: [
      { label: "Near your level", name: "Where every upgrade comes from", say: "Upgrades in order, each with the boss, quest, vendor or crafter it comes from.",
        box: [4, 251, 625, 735], on: 0, side: "right", ticks: ["Boss, quest, vendor or crafter", "Filter by where it comes from", "The dungeons to run for them"],
        shot: closeup("gear-slots", 620, 723, "The Gear plan's slots for a level 46 Survival hunter, armor, jewelry and weapons: what's worn in each, an arrow to the best upgrade near that level, where it comes from and how much better it is.") },
      { label: "At 60", name: "Your pre-raid BiS, slot by slot", say: "At 60 the plan turns into your pre-raid list. No switch to find.",
        box: [644, 252, 631, 741], on: 1, side: "left", ticks: ["The piece to aim for in every slot", "What you're already wearing", "Which dungeons to run for the rest"],
        shot: closeup("gear-at60", 620, 723, "The Gear plan at 60 for a Survival hunter: nine slots already at WoWSims' pre-raid set, and for each of the rest the piece to aim for, where it comes from and how much better it is.") },
      { label: "Stars", name: "Star a piece, hear about it when it drops", say: "A starred piece gets a gold line on its tooltip and a banner when it drops.",
        box: [1026, 0, 249, 100], on: 2, side: "left", ticks: ["A gold banner when it drops", "Its star on the boss in the Dungeon guide", "It clears once you're wearing it"],
        shot: closeup("gear-stars", 691, 310, "A starred chest piece's tooltip in the game: jsal.ui's gold line says it's starred in your gear plan and how much better it is than what you wear, beside the piece you have on, with its star lit in the list below.") },
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
      { label: "Bosses and loot", name: "Four drops a boss, and the trash", say: "A boss card keeps to the four drops worth your time. The rest is tucked underneath.",
        shot: closeup("dungeons-bosses", 484, 465, "Two of Maraudon's boss cards for a hunter: each boss's best drops with how often each one drops, upgrades marked with how much better they are, a starred piece, and the rest of a boss's loot as small pictures.") },
      { label: "Quests", name: "Every quest before you zone in", say: "Chains in order, with who gives each step and where.",
        shot: closeup("dungeons-quests", 620, 690, "The Dungeon guide's Quests tab for Maraudon: its quests grouped by where they start, a three-step chain marked where to start, and who gives each one and where.") },
      { label: "Map", name: "Forever's own dungeons, mapped", say: "Santiago Reyes's maps, used with his leave, with the bosses that have gear for you.", credit: true,
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
    screen: whole("/img/jsal-ui/ui/endgame-whole.webp", 1073, 668, "The Endgame page at 60: 9 of 16 slots toward your pre-raid set with Stratholme next for 2 pieces, and the build for 60, raid night's consumes on Simple with how many to get and what they cost, raid lockouts across three characters, and profession cooldowns."),
    rows: [
      { label: "Your set", name: "How close your pre-raid set is", say: "The next run that gets you closer, and the build that goes with it.",
        box: [28, 28, 329, 300], ticks: ["Your pre-raid set, slot by slot", "The next run to make", "Your build for 60"],
        shot: closeup("endgame-set", 346, 314, "The Your set card: 9 of 16 slots at the pre-raid set, Scholomance as the next run, and the build for 60 that goes with it.") },
      { label: "Raid night", name: "What to bring, and what it costs", say: "WoWSims' consumes for your spec: how many to get and what that costs.",
        box: [373, 28, 328, 516], ticks: ["Simple or Max DPS", "What it costs a night", "Kept on your shopping list"],
        shot: closeup("endgame-night", 345, 583, "The Raid night card: Simple or Max DPS, one night of three hours, each elixir, food and potion with how many to get and what it costs, about 26 gold in all, and the switch that keeps it on the shopping list.") },
      { label: "Raids and cooldowns", name: "Every character's lockouts", say: "Which raids each character is saved to, and long cooldowns like Transmute.",
        box: [717, 28, 328, 612], ticks: ["Raid lockouts across your characters", "Long cooldowns like Transmute", "Every character on one page"],
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
      { label: "Your road", name: "What to craft now, and every step after", say: "The one thing to make now, then each step ahead to the cap.",
        shot: closeup("professions-now", 513, 222, "Do this now on Leatherworking's road: Guardian Gloves three times, with the heavy leather, cured heavy hide and silken thread it takes against what's in the bags.") },
      { label: "Where you craft", name: "The road, beside the profession window", say: "The same road sits beside the game's profession window, a stop for each step.",
        shot: closeup("professions-craft", 418, 650, "jsal.ui's Leatherworking road beside the profession window: what to craft now, each stop to 300 with the trainer and patterns, and a button to put it all on the shopping list.") },
      { label: "Shopping list", name: "One click to a shopping list", say: "It counts your bags and bank first, and at a vendor a button buys it.",
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
