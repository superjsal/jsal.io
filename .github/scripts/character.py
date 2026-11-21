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
import base64, glob, json, os, re, sys, urllib.error, urllib.request
from datetime import datetime
from pathlib import Path

NAME = sys.argv[1] if len(sys.argv) > 1 else 'Vizdenia'
CLASS = sys.argv[2] if len(sys.argv) > 2 else 'Hunter'   # the journal doesn't record the class
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
worn = db.get('equipped') or {}


def icons_for(ids):
    """{item id: icon file name} for the items whose icon is known, fetching the unknown ones when the keys are set."""
    cache_path = ROOT / 'src' / 'data' / 'item-icons.json'
    known = json.loads(cache_path.read_text(encoding='utf-8')) if cache_path.exists() else {}
    missing = [i for i in ids if str(i) not in known]
    client, secret = os.environ.get('BLIZZARD_CLIENT_ID'), os.environ.get('BLIZZARD_CLIENT_SECRET')
    if missing and client and secret:
        said = []   # what Blizzard answered for the first item with no icon, printed once, to see why

        def ask(url, headers, data=None):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers=headers, data=data), timeout=20) as r:
                    return r.read()
            except urllib.error.HTTPError as e:
                if 'media/item' in url and not said: said.append(f'HTTP {e.code}')
                return None
            except (urllib.error.URLError, TimeoutError):
                return None
        basic = base64.b64encode(f'{client}:{secret}'.encode()).decode()
        token = json.loads(ask('https://oauth.battle.net/token', {'Authorization': f'Basic {basic}'}, b'grant_type=client_credentials') or b'{}').get('access_token')
        if not token:
            print('Icons: sign-in to Blizzard failed, so no new icons this run.')
        for item in missing if token else []:
            media = json.loads(ask(f'https://us.api.blizzard.com/data/wow/media/item/{item}?namespace=static-forever-us', {'Authorization': f'Bearer {token}'}) or b'{}')
            url = next((a.get('value') for a in media.get('assets', []) if a.get('key') == 'icon'), None)
            # only Blizzard's own icon server, at the size the page shows
            if not url or not re.fullmatch(r'https://render\.worldofwarcraft\.com/[a-z]+/icons/56/[a-z0-9_\-]+\.jpg', url):
                if not said: said.append('answered with ' + (json.dumps(media)[:400] if media else 'nothing'))
                if len(said) == 1:
                    # the item itself, to see where its picture is meant to be
                    about = json.loads(ask(f'https://us.api.blizzard.com/data/wow/item/{item}?namespace=static-forever-us&locale=en_US', {'Authorization': f'Bearer {token}'}) or b'{}')
                    said.append(f"item {item}: media asked: {said[0]}; the item says: name {about.get('name')!r}, media {json.dumps(about.get('media'))[:300]}, keys {sorted(about)[:14]}")
                    print('Icons, for diagnosis: ' + said[1])
                print(f'Icons: none found for item {item}.')
                continue
            name = url.rsplit('/', 1)[1]
            target = ROOT / 'site' / 'img' / 'wow' / name
            if not target.exists():
                picture = ask(url, {})
                if not picture: continue
                target.write_bytes(picture)
                print(f'Icons: saved {name}.')
            known[str(item)] = name
        cache_path.write_text(json.dumps(dict(sorted(known.items(), key=lambda kv: int(kv[0]))), indent=1) + '\n', encoding='utf-8', newline='\n')
    elif missing:
        print(f'Icons: {len(missing)} worn item(s) have no icon yet. Set BLIZZARD_CLIENT_ID and BLIZZARD_CLIENT_SECRET in this terminal and run again to fetch them.')
    return {i: known[str(i)] for i in ids if str(i) in known and (ROOT / 'site' / 'img' / 'wow' / known[str(i)]).exists()}


items = {i['slot']: i for i in (worn.get('items') or {}).values() if i.get('name')}
icons = icons_for([i['id'] for i in items.values() if i.get('id')])

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
    'gear': {slot: {'name': items[slot]['name'], 'quality': QUALITY.get(items[slot].get('quality'), 'common'), 'icon': icons.get(items[slot].get('id'))} for slot in SLOTS if slot in items} or None,
    # a picture of the character, when John has put one at site/img/play/<name>.webp
    'portrait': f'/img/play/{NAME.lower()}.webp' if (ROOT / 'site' / 'img' / 'play' / f'{NAME.lower()}.webp').exists() else None,
    'gearDate': day(worn['at']) if items and worn.get('at') else None,
}
target = ROOT / 'src' / 'data' / 'character.json'
target.write_text(json.dumps(out, indent=1, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
print(f"{target.relative_to(ROOT)}: {out['name']}, level {out['level']} {out['class']}, {out['stats']['hours']} hours, last seen in {out['lastZone']} on {out['lastSeen']}")
