# Writes src/data/character.json, what Off the clock (/play/) shows about John's character, from the journal the
# jsal.ui addon keeps in the game's SavedVariables. The game writes that file when the character logs out or the UI
# reloads, so run this afterwards:
#   python -I .github/scripts/character.py [character name] [class]
# Only what is listed in `out` below leaves the PC: totals, the time at each level, the latest journal entries of a
# few kinds, the top places, professions, the hunter's pet, the most-used spells and what is worn (each slot's
# item name and quality, once the addon has saved it: jsalUICharDB.equipped). Never guildmates' names (the
# journal's "guild" entries are left out), chat, gold or the account's name. Nothing else in the file is read into
# the site, and the path it was found at is never written down.
import glob, json, re, sys
from datetime import datetime
from pathlib import Path

NAME = sys.argv[1] if len(sys.argv) > 1 else 'Vizdenia'
CLASS = sys.argv[2] if len(sys.argv) > 2 else 'Hunter'   # the journal doesn't record the class
ROOT = Path(__file__).resolve().parents[2]
SAVED = r'C:\Program Files (x86)\World of Warcraft\_forever_\WTF\Account\*\*\*\SavedVariables\jsalUI.lua'
# The journal's kinds of entry that are about the character alone
KINDS = {'level', 'death', 'boss', 'kill', 'loot', 'prof', 'pet'}
# What the addon calls each slot, and what the page calls it; a shirt and a tabard aren't gear
SLOTS = {'head': 'Head', 'neck': 'Neck', 'shoulder': 'Shoulders', 'back': 'Back', 'chest': 'Chest', 'wrist': 'Wrists', 'hands': 'Hands', 'waist': 'Waist',
         'legs': 'Legs', 'feet': 'Feet', 'finger1': 'Ring', 'finger2': 'Ring', 'trinket1': 'Trinket', 'trinket2': 'Trinket', 'mainhand': 'Main hand',
         'offhand': 'Off hand', 'ranged': 'Ranged'}
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
items = {i['slot']: i for i in (worn.get('items') or {}).values() if i.get('name')}

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
    # in the page's order (SLOTS), each slot that holds something; absent until the addon has saved it
    'gear': [{'slot': label, 'name': items[slot]['name'], 'quality': QUALITY.get(items[slot].get('quality'), 'common')} for slot, label in SLOTS.items() if slot in items] or None,
    'gearDate': day(worn['at']) if items and worn.get('at') else None,
}
target = ROOT / 'src' / 'data' / 'character.json'
target.write_text(json.dumps(out, indent=1, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
print(f"{target.relative_to(ROOT)}: {out['name']}, level {out['level']} {out['class']}, {out['stats']['hours']} hours, last seen in {out['lastZone']} on {out['lastSeen']}")
