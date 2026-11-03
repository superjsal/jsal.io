---
paths:
  - "site/play/**"
  - "src/pages/play/**"
  - "site/img/wow-forever*"
  - ".github/build/og/**"
---

# Off the clock (/play/)

- **WoW Forever art** (on `/play/` and its share image `og/play.png`; `site\img\wow-forever.webp`, Blizzard's 3840×1600 original scaled to 1920×800, plus `wow-forever-1200.webp` at 1200×500 for 1x desktop screens via `srcset`) is Blizzard's, used under their fan-site policy: it may be scaled down and saved as WebP, but never crop, retouch or otherwise alter the picture (fade and frame it with CSS only), keep the "Art © Blizzard Entertainment" credit, and remove it if the site ever becomes commercial.
- **Item icons** in the Backpack (`site\img\wow\*.jpg`: the socials, the Lantern, the Pocket Watch, the Hearthstone, the bag icons and each achievement's trophy) are Blizzard's WoW icons, used under the same terms: Blizzard's Legal FAQ allows its images on non-commercial web pages if notices stay and the files aren't altered, and Blizzard can withdraw that. Each is saved exactly as `https://render.worldofwarcraft.com/us/icons/56/<name>.jpg` serves it (56×56 JPG, never resized, cropped, recoloured or converted; CSS may frame or round it), named after Blizzard's icon, and nothing links to Blizzard's server. Keep the "Item icons © Blizzard Entertainment" line under the bag. The socials' logos are separate badges drawn over the icon, not edits to it. Find candidates by name (inv_letter_*, inv_misc_bag_*, inv_misc_coin_*…) on that server and ask John before downloading new ones.
- **The Backpack** holds mostly John's socials (he'll add more; keep a few slots free), plus the Lantern (theme), the Pocket Watch (changelog) and the Hearthstone. Don't fill it with site links. Trophies go in the second bag, from `TROPHIES`. New items glow until inspected: add a new item's id to `NEW` so returning visitors notice it.
