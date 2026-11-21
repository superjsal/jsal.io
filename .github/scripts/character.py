# Writes src/data/character.json, what Off the clock (/play/) shows about John's character, from the journal the
# jsal.ui addon keeps in the game's SavedVariables. The game writes that file when the character logs out or the UI
# reloads, so run this afterwards:
#   python -I .github/scripts/character.py [character name] [class]
# Only what is listed in `out` below leaves the PC: totals, the time at each level, the latest journal entries of a
# few kinds, the top places, professions, the hunter's pet, the most-used spells and what is worn (each slot's
# item name and quality, once the addon has saved it: jsalUICharDB.equipped). Never guildmates' names (the
# journal's "guild" entries are left out), chat, gold or the account's name. Nothing else in the file is read into
# the site, and the path it was found at is never written down.
#
# Item icons: with BLIZZARD_CLIENT_ID and BLIZZARD_CLIENT_SECRET set in the terminal it runs in, it also asks
# Blizzard's game data (the Forever namespace) which icon each worn item has and saves any it doesn't have yet to
# site/img/wow/, exactly as Blizzard serves it (56 x 56 JPG, never altered: see off-the-clock.md). Which icon an
# item has is remembered in src/data/item-icons.json, so a run without the secret keeps the icons already known.
# Tooltips: the addon saves each worn item's tooltip as the game shows it, and those are used. For an item it
# hasn't saved one for, Blizzard's page for the item is used when it has one (fetched once, with the same keys).
import base64, glob, json, os, re, sys, urllib.error, urllib.request
from datetime import datetime
from pathlib import Path

NAME = sys.argv[1] if len(sys.argv) > 1 else 'Vizdenia'
CLASS = sys.argv[2] if len(sys.argv) > 2 else 'Hunter'   # the journal doesn't record the class
# Blizzard's own picture of a character in what it wears now, as its armory shows it: a public address, by the
# character's realm and number there (read from the character's armory page). Fetched on every run, as it changes
# with the gear, and saved exactly as served.
RENDERS = {'Vizdenia': 'https://render.worldofwarcraft.com/forever-us/character/251/27529979-main-raw.png'}
# The character's page on Blizzard's armory. Blizzard's API has no Forever characters, but this public page carries
# the character as data: race, item level, attributes, talents and professions. It is read once a run, for this one
# character, and what it gave last time is kept when it can't be reached.
ARMORY = {'Vizdenia': 'https://worldofwarcraft.blizzard.com/en-us/forever/us/armory/character/vizdenia-trueshot'}
ROOT = Path(__file__).resolve().parents[2]
SAVED = r'C:\Program Files (x86)\World of Warcraft\_forever_\WTF\Account\*\*\*\SavedVariables\jsalUI.lua'
# The journal's kinds of entry that are about the character alone
KINDS = {'level', 'death', 'boss', 'kill', 'loot', 'prof', 'pet'}
# The slots the page shows, by the addon's names for them; a shirt and a tabard aren't gear
SLOTS = ('head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2', 'mainhand', 'offhand', 'ranged')
QUALITY = {0: 'poor', 1: 'common', 2: 'uncommon', 3: 'rare', 4: 'epic', 5: 'legendary'}
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
# What is worn is saved by John's own small addon (jsalGearDB, in jsalGear.lua beside the journal's file), in the
# shape jsal.ui first saved it in; the journal's file is read for it only until that addon has saved.
gear_file = Path(path).with_name('jsalGear.lua')
own_gear = parse(gear_file.read_text(encoding='utf-8')).get('jsalGearDB', {}).get('equipped') if gear_file.exists() else None
worn = own_gear or db.get('equipped') or {}


API = 'https://us.api.blizzard.com/data/wow'
NS = 'namespace=static-forever-us&locale=en_US'
DATA = ROOT / 'src' / 'data'
_token = []


why = ['']   # why the last request came back with nothing, for the line that reports it


def ask(url, headers=None, data=None):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers or {}, data=data), timeout=20) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        why[0] = f'HTTP {e.code}'
    except (urllib.error.URLError, TimeoutError) as e:
        why[0] = type(e).__name__
    return None


def auth():
    """The header that signs a request to Blizzard, or None without the keys or if the sign-in fails. Asked for once."""
    if not _token:
        client, secret = os.environ.get('BLIZZARD_CLIENT_ID'), os.environ.get('BLIZZARD_CLIENT_SECRET')
        token = None
        if client and secret:
            basic = base64.b64encode(f'{client}:{secret}'.encode()).decode()
            token = json.loads(ask('https://oauth.battle.net/token', {'Authorization': f'Basic {basic}'}, b'grant_type=client_credentials') or b'{}').get('access_token')
            if not token: print('Blizzard: the sign-in failed, so nothing new is fetched this run.')
        _token.append({'Authorization': f'Bearer {token}'} if token else None)
    return _token[0]


def table(name, new=None):
    """A table kept in src/data, by item id: read it, or write it back in order."""
    path = DATA / name
    if new is None:
        return json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    path.write_text(json.dumps(dict(sorted(new.items(), key=lambda kv: int(kv[0]))), indent=1, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')


def icons_for(ids):
    """{item id: icon file name} for the items whose icon is known, fetching the unknown ones when the keys are set."""
    known = table('item-icons.json')
    missing = [i for i in ids if str(i) not in known]
    if missing and auth():
        for item in missing:
            media = json.loads(ask(f'{API}/media/item/{item}?{NS}', auth()) or b'{}')
            url = next((a.get('value') for a in media.get('assets', []) if a.get('key') == 'icon'), None)
            # only Blizzard's own icon server, at the size the page shows
            if not url or not re.fullmatch(r'https://render\.worldofwarcraft\.com/[a-z\-]+/icons/56/[a-z0-9_\-]+\.jpg', url):
                print(f'Icons: none found for item {item}.')
                continue
            name = url.rsplit('/', 1)[1]
            target = ROOT / 'site' / 'img' / 'wow' / name
            if not target.exists():
                picture = ask(url)
                if not picture: continue
                target.write_bytes(picture)
                print(f'Icons: saved {name}.')
            known[str(item)] = name
        table('item-icons.json', known)
    elif missing:
        print(f'Icons: {len(missing)} worn item(s) have no icon yet. Set BLIZZARD_CLIENT_ID and BLIZZARD_CLIENT_SECRET in this terminal and run again to fetch them.')
    return {i: known[str(i)] for i in ids if str(i) in known and (ROOT / 'site' / 'img' / 'wow' / known[str(i)]).exists()}


def tip(item):
    """An item's tooltip, as lines in the game's order, read from Blizzard's page for the item: [{t, tone, r}], where
    r is the words set at the line's right end (a weapon's speed, an armour's kind)."""
    p = item.get('preview_item') or {}
    out = []
    shown = lambda d: (d or {}).get('display_string') or ((d or {}).get('display') or {}).get('display_string')

    def add(text, tone=None, right=None):
        if text: out.append({k: v for k, v in (('t', str(text)), ('tone', tone), ('r', right)) if v})

    add(shown(p.get('level')) or (f"Item Level {item['level']}" if item.get('level') else None), 'gold')
    add((p.get('binding') or {}).get('name'))
    add(p.get('unique_equipped'))
    kind = (p.get('item_subclass') or {}).get('name')
    add((p.get('inventory_type') or {}).get('name'), None, None if kind == 'Miscellaneous' else kind)   # a ring or a trinket has no kind worth saying
    weapon = p.get('weapon') or {}
    add(shown(weapon.get('damage')), None, shown(weapon.get('attack_speed')))
    add(shown(weapon.get('dps')))
    add(shown(p.get('armor')))
    for stat in p.get('stats') or []: add(shown(stat), 'green' if stat.get('is_equip_bonus') else None)
    for spell in p.get('spells') or []: add(spell.get('description'), 'green')
    add(shown(p.get('durability')))
    needs = p.get('requirements') or {}
    for key in ('level', 'skill', 'playable_classes', 'playable_races', 'faction'): add(shown(needs.get(key)))
    add(f'"{p["description"]}"' if p.get('description') else None, 'gold')
    sell = (p.get('sell_price') or {}).get('display_strings') or {}
    coins = ' '.join(f'{sell[k]}{k[0]}' for k in ('gold', 'silver', 'copper') if str(sell.get(k) or '0') != '0')
    add(f'Sells for {coins}' if coins else None, 'muted')
    return out


def tone(colour):
    """What a line's colour in the game means on the page: the game's green (a bonus, an Equip line), its yellow
    (item level, a set's name), or its grey; white and anything else is plain text."""
    if not colour or not re.fullmatch(r'[0-9a-f]{6}', colour): return None
    r, g, b = (int(colour[i:i + 2], 16) for i in (0, 2, 4))
    if g > 160 and r < 140 and b < 140: return 'green'
    if r > 200 and g > 150 and b < 100: return 'gold'
    if max(r, g, b) - min(r, g, b) < 24 and r < 200: return 'muted'
    return None


def game_tip(lines):
    """A tooltip the addon saved from the game itself (jsalUICharDB.equipped.items[n].tip: each line's left and right
    words with their colours), as the page's lines. This is the worn item exactly, enchants and all."""
    out = []
    for n in sorted(lines):
        line = lines[n]
        left, right = (line.get('left') or '').strip(), (line.get('right') or '').strip()
        if not (left or right): continue
        # a crafted item names the player who made it: never published
        if re.search(r'\bMade by\b', left + ' ' + right): continue
        # a note about the moment it was saved, not about the item
        if left.startswith('Cannot change equip status'): continue
        out.append({k: v for k, v in (('t', left or right), ('tone', tone(line.get('leftColor') if left else line.get('rightColor'))), ('r', right if left else None)) if v})
    return out


def tips_for(ids, have=()):
    """{item id: tooltip lines}. Blizzard's page for each worn item is fetched once, when the keys are set, and kept
    as it came in private/blizzard-items/ (never committed); the lines are worked out from those copies on every
    run, so a change to how they're read needs no new request. The lines themselves go in src/data/item-tips.json,
    which is committed, so the site builds without the private copies."""
    raw = ROOT / 'private' / 'blizzard-items'
    raw.mkdir(parents=True, exist_ok=True)
    known, waiting = table('item-tips.json'), 0
    for item in ids:
        copy = raw / f'{item}.json'
        # an item whose tooltip the game itself gave is never asked for: Blizzard has no page for half of them
        if not copy.exists() and item not in have and auth():
            body = ask(f'{API}/item/{item}?{NS}', auth())
            if body: copy.write_bytes(body); print(f'Items: fetched {item}.')
            else: print(f'Items: Blizzard gave nothing for item {item} ({why[0]}).')
        if copy.exists(): known[str(item)] = tip(json.loads(copy.read_text(encoding='utf-8')))
        elif str(item) not in known: waiting += 1
    table('item-tips.json', known)
    return {i: known[str(i)] for i in ids if known.get(str(i))}


items = {i['slot']: i for i in (worn.get('items') or {}).values() if i.get('name')}
worn_ids = [i['id'] for i in items.values() if i.get('id')]
# the game's own tooltip for a worn item, when the addon has saved one, is used before Blizzard's page for the item
own = {i['id']: game_tip(i['tip']) for i in items.values() if i.get('id') and isinstance(i.get('tip'), dict)}
icons, tips = icons_for(worn_ids), tips_for(worn_ids, {k for k, v in own.items() if v})
tips = {**tips, **{k: v for k, v in own.items() if v}}

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
    # each slot that holds something, by the addon's name for the slot; absent until the addon has saved it
    'gear': {slot: {'name': items[slot]['name'], 'quality': QUALITY.get(items[slot].get('quality'), 'common'), 'icon': icons.get(items[slot].get('id')), 'tip': tips.get(items[slot].get('id'))} for slot in SLOTS if slot in items} or None,
    # a picture of the character: Blizzard's own render when there is one, else a screenshot John has put at
    # site/img/play/<name>.webp
    'gearDate': day(worn['at']) if items and worn.get('at') else None,
}
def armory():
    """What the armory page says of the character, or what it said last time: race, item level, the attributes the
    game's character sheet shows, talent points by tree, professions, and each worn item's level by item id."""
    target = DATA / 'character.json'
    before = (json.loads(target.read_text(encoding='utf-8')).get('armory') if target.exists() else None) or None
    url = ARMORY.get(NAME)
    if not url: return before
    page = ask(url, {'Accept-Language': 'en-US', 'User-Agent': 'Mozilla/5.0'})
    mark = 'var characterProfileInitialState = '
    if not page or mark not in page.decode('utf-8', 'replace'):
        print(f'Armory: the page could not be read ({why[0] or "no character data in it"}); keeping what it said last time.')
        return before
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
        media = c.get('media') or {}
        render = media.get('main-raw')
        return {
            'race': c['race']['name'], 'itemLevel': c.get('averageItemLevel'), 'updated': c['lastUpdatedTimestamp']['iso8601'][:10],
            'attributes': [[label, value] for label, value in shown if value is not None],
            'talents': [[s['name'], s['spentPoints']] for s in c.get('specs') or [] if s.get('spentPoints')],
            'professions': [[p['name'], p['tiers'][0]['skillPoints'], p['tiers'][0]['maxSkillPoints']] for kind in ('primaries', 'secondaries') for p in (c.get('professions') or {}).get(kind) or [] if p.get('tiers')],
            'itemLevels': {str(g['id']): g['level']['value'] for g in (c.get('gear') or {}).values() if isinstance(g, dict) and g.get('id') and (g.get('level') or {}).get('value')},
            'render': render.get('url') if isinstance(render, dict) else render,
        }
    except (KeyError, IndexError, TypeError, ValueError) as e:
        print(f'Armory: the page has changed shape ({type(e).__name__}: {e}); keeping what it said last time.')
        return before


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


seen = armory()
out.update(portrait())
if seen:
    # the armory knows the race, the item level and Skinning, which the journal doesn't; its professions replace the journal's
    out['race'], out['itemLevel'], out['attributes'], out['talents'] = seen.get('race'), seen.get('itemLevel'), seen.get('attributes'), seen.get('talents')
    if seen.get('professions'): out['professions'] = sorted(seen['professions'], key=lambda p: -p[1])
    levels = seen.get('itemLevels') or {}
    for slot, piece in (out['gear'] or {}).items():
        level = levels.get(str(items[slot].get('id')))
        if level and not any(line['t'].startswith('Item Level') for line in piece.get('tip') or []):
            piece['tip'] = [{'t': f'Item Level {level}', 'tone': 'gold'}] + (piece.get('tip') or [])
    out['armory'] = seen
bare = [g['name'] for g in (out['gear'] or {}).values() if not g.get('tip')]
if bare: print(f"Tooltips: {len(bare)} worn item(s) have none yet ({', '.join(bare[:4])}{'…' if len(bare) > 4 else ''}). The addon saves them as you play: log in, then log out, and run this again.")
target = ROOT / 'src' / 'data' / 'character.json'
target.write_text(json.dumps(out, indent=1, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
print(f"{target.relative_to(ROOT)}: {out['name']}, level {out['level']} {out['class']}, {out['stats']['hours']} hours, last seen in {out['lastZone']} on {out['lastSeen']}")
