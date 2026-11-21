# Writes src/data/character.json, what Off the clock (/play/) shows about John's character, from two places:
#  - the journal the jsal.ui addon keeps in the game's SavedVariables (the character's own play: totals, the time at
#    each level, the latest journal entries of a few kinds, the top places, the hunter's pet, the most-used spells).
#    The game writes that file when the character logs out or the UI reloads, so run this afterwards.
#  - the character's page on Blizzard's armory (race, item level, attributes, talents, professions, the render, and
#    what is worn, each item with its tooltip and icon).
#   python -I .github/scripts/character.py [character name] [class]
# Only what is listed in `out` below leaves the PC. Never guildmates' names (the journal's "guild" entries are left
# out), chat, gold or the account's name. Nothing else in the file is read into the site, and the path it was found
# at is never written down. No key is needed: the armory page and Blizzard's pictures are public.
#
# Item icons are saved to site/img/wow/ exactly as Blizzard serves them (56 x 56 JPG, never altered: see
# off-the-clock.md), once each.
import glob, json, re, sys, urllib.error, urllib.request
from datetime import datetime
from pathlib import Path

NAME = sys.argv[1] if len(sys.argv) > 1 else 'Vizdenia'
CLASS = sys.argv[2] if len(sys.argv) > 2 else 'Hunter'   # the journal doesn't record the class
# Blizzard's own picture of a character in what it wears now, as its armory shows it, for when the armory page
# can't be read: a public address, by the character's realm and number there. Fetched on every run, as it changes
# with the gear, and saved exactly as served.
RENDERS = {'Vizdenia': 'https://render.worldofwarcraft.com/forever-us/character/251/27529979-main-raw.png'}
# The character's page on Blizzard's armory. Blizzard's public API has no Forever characters (its own armory reads
# them from a private one), but this public page carries the character as data. It is read once a run, for this one
# character, and what it gave last time is kept when it can't be reached.
ARMORY = {'Vizdenia': 'https://worldofwarcraft.blizzard.com/en-us/forever/us/armory/character/vizdenia-trueshot'}
ROOT = Path(__file__).resolve().parents[2]
SAVED = r'C:\Program Files (x86)\World of Warcraft\_forever_\WTF\Account\*\*\*\SavedVariables\jsalUI.lua'
# The journal's kinds of entry that are about the character alone
KINDS = {'level', 'death', 'boss', 'kill', 'loot', 'prof', 'pet'}
# The slots the page shows, by the armory's names for them, and the page's; a shirt and a tabard aren't gear
SLOTS = {'HEAD': 'head', 'NECK': 'neck', 'SHOULDER': 'shoulder', 'BACK': 'back', 'CHEST': 'chest', 'WRIST': 'wrist',
         'HANDS': 'hands', 'WAIST': 'waist', 'LEGS': 'legs', 'FEET': 'feet', 'FINGER_1': 'finger1', 'FINGER_2': 'finger2',
         'TRINKET_1': 'trinket1', 'TRINKET_2': 'trinket2', 'MAIN_HAND': 'mainhand', 'OFF_HAND': 'offhand', 'RANGED': 'ranged'}
PROFESSIONS = {129: 'First Aid', 164: 'Blacksmithing', 165: 'Leatherworking', 171: 'Alchemy', 182: 'Herbalism', 185: 'Cooking', 186: 'Mining',
               197: 'Tailoring', 202: 'Engineering', 333: 'Enchanting', 356: 'Fishing', 393: 'Skinning'}

TOKEN = re.compile(r'\s*(?:(--[^\n]*)|("(?:[^"\\]|\\.)*")|(-?\d+\.?\d*(?:e[+-]?\d+)?)|(true|false|nil)|([A-Za-z_]\w*)|(.))', re.S)


def parse(text):
    """A SavedVariables file (Lua tables of strings, numbers and booleans) as Python dicts."""
    toks = [m for m in TOKEN.finditer(text) if not m.group(1) and m.group(0).strip()]
    pos = 0

    def value():
        nonlocal pos
        m = toks[pos]; pos += 1
        if m.group(2) is not None: return json.loads(m.group(2).replace('\\\n', '\\n'))
        if m.group(3) is not None: return float(m.group(3)) if re.search(r'[.e]', m.group(3)) else int(m.group(3))
        if m.group(4) is not None: return {'true': True, 'false': False, 'nil': None}[m.group(4)]
        if m.group(6) != '{': raise ValueError(f'unexpected {m.group(0)!r}')
        out, n = {}, 1
        while toks[pos].group(6) != '}':
            if toks[pos].group(6) == '[':
                pos += 1; key = value(); pos += 2   # past "] ="
                out[key] = value()
            elif toks[pos].group(5) and toks[pos + 1].group(6) == '=':
                key = toks[pos].group(5); pos += 2; out[key] = value()
            else:
                out[n] = value(); n += 1
            if toks[pos].group(6) in ',;': pos += 1
        pos += 1
        return out

    data = {}
    while pos < len(toks):
        name = toks[pos].group(5); pos += 2
        data[name] = value()
    return data


files = [p for p in glob.glob(SAVED) if Path(p).parents[1].name.split('-')[0] == NAME]
if not files:
    raise SystemExit(f'No jsal.ui journal found for {NAME}. Log the character out first, so the game writes it.')
path = max(files, key=lambda p: Path(p).stat().st_mtime)
db = parse(Path(path).read_text(encoding='utf-8'))['jsalUICharDB']
journal, stats = db['journal'], db['journal']['stats']
day = lambda t: datetime.fromtimestamp(t).strftime('%Y-%m-%d')
levels = {int(k): v for k, v in journal['levels'].items()}
minutes = [round(levels[k]['seconds'] / 60) for k in sorted(levels)]
events = [journal['events'][k] for k in sorted(journal['events']) if journal['events'][k].get('k') in KINDS]
last = events[-1]
TARGET = ROOT / 'src' / 'data' / 'character.json'
before = json.loads(TARGET.read_text(encoding='utf-8')) if TARGET.exists() else {}
why = ['']   # why the last request came back with nothing, for the line that reports it


def ask(url, headers=None):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers or {}), timeout=20) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        why[0] = f'HTTP {e.code}'
    except (urllib.error.URLError, TimeoutError) as e:
        why[0] = type(e).__name__
    return None


def icon(piece):
    """The file name of a worn item's icon in site/img/wow/, saving it from Blizzard the first time, or None."""
    media = piece.get('media') or {}
    assets = (media.get('content') or {}).get('assets') or media.get('assets') or []
    url = next((a.get('value') for a in assets if a.get('key') == 'icon'), None)
    # only Blizzard's own icon server, at the size the page shows
    if not url or not re.fullmatch(r'https://render\.worldofwarcraft\.com/[a-z\-]+/icons/56/[a-z0-9_\-]+\.jpg', url):
        return None
    name = url.rsplit('/', 1)[1]
    target = ROOT / 'site' / 'img' / 'wow' / name
    if not target.exists():
        picture = ask(url)
        if not picture or picture[:2] != b'\xff\xd8':
            print(f"Icons: none fetched for {piece.get('name')} ({why[0] or 'not a picture'}).")
            return None
        target.write_bytes(picture)
        print(f'Icons: saved {name}.')
    return name


def tip(p):
    """A worn item's tooltip, as lines in the game's order, from the armory's record of it: [{t, tone, r}], where r
    is the words set at the line's right end (a weapon's speed, an armour's kind)."""
    out = []
    shown = lambda d: (d or {}).get('display_string') or ((d or {}).get('display') or {}).get('display_string')

    def add(text, tone=None, right=None):
        # a crafted item names the player who made it: never published
        if text and not re.search(r'\bMade by\b', str(text)):
            out.append({k: v for k, v in (('t', str(text)), ('tone', tone), ('r', right)) if v})

    add(shown(p.get('level')), 'gold')
    # a worn item is bound to the character, which the game says as "Soulbound"
    add('Soulbound' if p.get('binding') else None)
    add(p.get('unique_equipped'))
    kind = None if p.get('is_subclass_hidden') else (p.get('item_subclass') or {}).get('name')
    add((p.get('inventory_type') or {}).get('name'), None, None if kind == 'Miscellaneous' else kind)   # a ring or a trinket has no kind worth saying
    weapon = p.get('weapon') or {}
    add(shown(weapon.get('damage')), None, shown(weapon.get('attack_speed')))
    add(shown(weapon.get('dps')))
    armor = (p.get('armor') or {}).get('value')
    add(shown(p.get('armor')) or (f'{armor} Armor' if armor else None))
    # the game shows the five base stats and resistances in white, then every other bonus as a green Equip line
    order = ('STRENGTH', 'AGILITY', 'STAMINA', 'INTELLECT', 'SPIRIT')
    kind_of = lambda s: (s.get('type') or {}).get('type') or ''
    base = lambda s: kind_of(s) in order or kind_of(s).endswith('_RESISTANCE')
    stats = p.get('stats') or []
    for stat in sorted((s for s in stats if base(s)), key=lambda s: order.index(kind_of(s)) if kind_of(s) in order else len(order)): add(shown(stat))
    for stat in [s for s in stats if not base(s)]: add(f'Equip: {shown(stat)}.', 'green')
    for enchant in p.get('enchantments') or []: add(enchant.get('display_string'), 'green')
    for spell in p.get('spells') or []: add(spell.get('description'), 'green')
    add(shown(p.get('durability')))
    needs = p.get('requirements') or {}
    for key in ('level', 'skill', 'playable_classes', 'playable_races', 'faction'): add(shown(needs.get(key)))
    add(f'"{p["description"]}"' if p.get('description') else None, 'gold')
    return out


def armory():
    """What the armory page says of the character, or None when it can't be read: race, item level, the attributes
    the game's character sheet shows, talent points by tree, professions, the render's address and what is worn."""
    url = ARMORY.get(NAME)
    if not url: return None
    page = ask(url, {'Accept-Language': 'en-US', 'User-Agent': 'Mozilla/5.0'})
    mark = 'var characterProfileInitialState = '
    if not page or mark not in page.decode('utf-8', 'replace'):
        print(f'Armory: the page could not be read ({why[0] or "no character data in it"}); keeping what it said last time.')
        return None
    text = page.decode('utf-8', 'replace')
    try:
        c = json.JSONDecoder().raw_decode(text[text.index(mark) + len(mark):])[0]['character']
        stats = {s['slug']: s['value'] for group in c['stats']['groups'] for s in group['stats']}
        number = lambda slug: (stats.get(slug) or {}).get('value')
        whole = lambda slug: None if number(slug) is None else round(number(slug))
        shown = [('Health', whole('health')), ('Mana', whole('mana')), ('Agility', whole('agility')), ('Stamina', whole('stamina')),
                 ('Strength', whole('strength')), ('Intellect', whole('intellect')), ('Attack', whole('attack-power')), ('Armor', whole('armor')),
                 ('Crit', None if number('critical-strike') is None else f"{number('critical-strike'):.1f}%"),
                 ('Dodge', None if number('dodge') is None else f"{number('dodge'):.1f}%")]
        render = (c.get('media') or {}).get('main-raw')
        worn = {SLOTS[g['slot']['type']]: g for g in (c.get('gear') or {}).values()
                if isinstance(g, dict) and g.get('name') and (g.get('slot') or {}).get('type') in SLOTS}
        return {
            'race': c['race']['name'], 'itemLevel': c.get('averageItemLevel'), 'updated': c['lastUpdatedTimestamp']['iso8601'][:10],
            'attributes': [[label, value] for label, value in shown if value is not None],
            'talents': [[s['name'], s['spentPoints']] for s in c.get('specs') or [] if s.get('spentPoints')],
            'professions': [[p['name'], p['tiers'][0]['skillPoints'], p['tiers'][0]['maxSkillPoints']] for kind in ('primaries', 'secondaries') for p in (c.get('professions') or {}).get(kind) or [] if p.get('tiers')],
            'render': render.get('url') if isinstance(render, dict) else render,
            # each slot that holds something, in the page's order, by the page's name for the slot
            'gear': {slot: {'name': worn[slot]['name'], 'quality': (worn[slot].get('quality') or {}).get('type', 'COMMON').lower(),
                            'icon': icon(worn[slot]), 'tip': tip(worn[slot])} for slot in SLOTS.values() if slot in worn} or None,
        }
    except (KeyError, IndexError, TypeError, ValueError) as e:
        print(f'Armory: the page has changed shape ({type(e).__name__}: {e}); keeping what it said last time.')
        return None


def portrait():
    play = ROOT / 'site' / 'img' / 'play'
    render, shot = play / f'{NAME.lower()}-render.png', play / f'{NAME.lower()}.webp'
    url = (seen or {}).get('render') or RENDERS.get(NAME)
    if url and re.fullmatch(r'https://render\.worldofwarcraft\.com/[a-z\-]+/character/\d+/\d+-main-raw\.png', url):
        picture = ask(url)
        if picture and picture[:8] == b'\x89PNG\r\n\x1a\n':
            if not render.exists() or render.read_bytes() != picture:
                play.mkdir(parents=True, exist_ok=True)
                render.write_bytes(picture)
                print(f'Portrait: saved Blizzard\'s render of {NAME}.')
        elif not render.exists():
            print(f'Portrait: Blizzard\'s render of {NAME} could not be fetched ({why[0] or "not a picture"}).')
    if render.exists():
        size = [int.from_bytes(render.read_bytes()[16:20], 'big'), int.from_bytes(render.read_bytes()[20:24], 'big')]
        return {'portrait': f'/img/play/{render.name}', 'portraitKind': 'render', 'portraitSize': size}
    if shot.exists():
        return {'portrait': f'/img/play/{shot.name}', 'portraitKind': 'photo', 'portraitSize': [621, 1095]}
    return {'portrait': None}


fresh = armory()
seen = fresh or before.get('armory')
out = {
    'name': NAME, 'class': CLASS, 'level': max(levels), 'guild': journal.get('guild') or None,
    'since': day(journal['since']), 'updated': day(Path(path).stat().st_mtime),
    'lastZone': last.get('z'), 'lastSeen': day(last['t']),
    'stats': {'hours': round(stats['seconds'] / 3600), 'foes': stats['foes'], 'quests': stats['quests'], 'deaths': stats['deaths'],
              'miles': round(stats['yards'] / 1760), 'jumps': stats['jumps']},
    'levelMinutes': minutes,
    'events': [{'kind': e['k'], 'text': e['s'] if e['k'] != 'death' or not e.get('z') else f"Died in {e['z']}", 'date': day(e['t'])} for e in reversed(events[-6:])],
    'zones': [[zone, round(seconds / 3600)] for zone, seconds in sorted(journal['zones'].items(), key=lambda z: -z[1])[:5]],
    'professions': sorted(([PROFESSIONS.get(int(k), f'Profession {k}'), p['skill'], p['cap']] for k, p in db.get('professions', {}).items()), key=lambda p: -p[1]),
    'pet': {k: db['pet'][k] for k in ('name', 'family', 'level')} if db.get('pet', {}).get('name') else None,
    'spells': [[spell, n] for spell, n in sorted(journal.get('spells', {}).items(), key=lambda s: -s[1])[:3]],
    # what is worn, as the armory last showed it; absent until it has been read once
    'gear': fresh['gear'] if fresh else before.get('gear'),
    'gearDate': fresh['updated'] if fresh and fresh.get('gear') else before.get('gearDate'),
}
out.update(portrait())
if seen:
    # the armory knows the race, the item level and Skinning, which the journal doesn't; its professions replace the journal's
    out['race'], out['itemLevel'], out['attributes'], out['talents'] = seen.get('race'), seen.get('itemLevel'), seen.get('attributes'), seen.get('talents')
    if seen.get('professions'): out['professions'] = sorted(seen['professions'], key=lambda p: -p[1])
    out['armory'] = {k: v for k, v in seen.items() if k not in ('gear', 'itemLevels')}
TARGET.write_text(json.dumps(out, indent=1, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
print(f"{TARGET.relative_to(ROOT)}: {out['name']}, level {out['level']} {out['class']}, {out['stats']['hours']} hours, last seen in {out['lastZone']} on {out['lastSeen']}, {len(out['gear'] or {})} items worn")
