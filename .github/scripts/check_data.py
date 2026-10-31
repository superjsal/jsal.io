# Checks the public CMS Picker data (cms-picker/data.json) against cms-picker.schema.json, then reports
# how well sourced it is. Run by playbook.py before it publishes, by .github\build\check.py before every push (and on GitHub),
# and on GitHub after every push.
#
#   python check_data.py            the summary; exits 1 only if the data doesn't fit the schema
#   python check_data.py --list     also lists every answer with no source, an old source, or that isn't verified
#
# Reported (not a failure): answers with no source, sources last checked over 90 days ago, and per
# platform, answers marked "not verified" (scope C) or "Unclear" (verdict check), and any of the quiz's "Not
# ideal if" rules whose line is no longer on its card.
import datetime, json, os, pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
SCHEMA = json.loads((HERE / 'cms-picker.schema.json').read_text(encoding='utf-8'))
DATA = HERE.parents[1] / 'cms-picker' / 'data.json'
STALE_DAYS = 90

TYPES = {'object': dict, 'array': list, 'string': str, 'boolean': bool}
def validate(value, schema, path='data'):
    """The JSON Schema keywords cms-picker.schema.json uses, so nothing extra needs installing."""
    errs = []
    t = schema.get('type')
    if t == 'integer':
        if not (isinstance(value, int) and not isinstance(value, bool)): return [f'{path}: should be a whole number']
    elif t == 'number':
        if not (isinstance(value, (int, float)) and not isinstance(value, bool)): return [f'{path}: should be a number']
    elif t and not isinstance(value, TYPES[t]):
        return [f'{path}: should be {"an" if t[0] in "aeiou" else "a"} {t}']
    if 'enum' in schema and value not in schema['enum']:
        errs.append(f'{path}: {value!r} is not one of {schema["enum"]}')
    if isinstance(value, str):
        if len(value) < schema.get('minLength', 0): errs.append(f'{path}: is empty')
        if 'pattern' in schema and not re.search(schema['pattern'], value): errs.append(f'{path}: {value!r} doesn\'t match {schema["pattern"]}')
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if 'minimum' in schema and value < schema['minimum']: errs.append(f'{path}: below {schema["minimum"]}')
        if 'maximum' in schema and value > schema['maximum']: errs.append(f'{path}: above {schema["maximum"]}')
    if isinstance(value, dict):
        props = schema.get('properties', {})
        for k in schema.get('required', []):
            if k not in value: errs.append(f'{path}: missing "{k}"')
        extra = schema.get('additionalProperties', True)
        for k, v in value.items():
            if k in props: errs += validate(v, props[k], f'{path}.{k}')
            elif extra is False: errs.append(f'{path}: unexpected "{k}"')
            elif isinstance(extra, dict): errs += validate(v, extra, f'{path}.{k}')
    if isinstance(value, list) and 'items' in schema:
        for i, v in enumerate(value): errs += validate(v, schema['items'], f'{path}[{i}]')
    return errs

def problems(d):
    """Schema errors, plus a few links the schema can't express (every row and platform answered)."""
    errs = validate(d, SCHEMA)
    if errs: return errs
    rows = [i['id'] for i in d['items']]
    groups = {g['id'] for g in d['groups']}
    errs += [f'data.items: row "{i["id"]}" is in unknown group "{i["group"]}"' for i in d['items'] if i['group'] not in groups]
    for p in d['platforms']:
        a = d['answers'].get(p['id'])
        if a is None: errs.append(f'data.answers: no answers for {p["id"]}'); continue
        errs += [f'data.answers.{p["id"]}: no answer for "{r}"' for r in rows if r not in a]
    return errs

def not_ideal_unmatched(d):
    """The quiz's "Not ideal if" rules whose line is no longer on that platform's card (platforms on the CMS Picker only)."""
    quiz = json.loads((DATA.parent / 'quiz.json').read_text(encoding='utf-8'))
    cards = {p['id']: p for p in d['platforms']}
    return [f'{cards[pid]["name"]}: "{n["if"]}…"' for pid, rules in quiz.get('notIdeal', {}).items() if pid in cards
            for n in rules if not any(l.startswith(n['if']) for l in cards[pid]['profile'].get('lessSuited', []))]

def annotate(d):
    """On GitHub Actions (the nightly publish, the push check), the same warning as a run annotation, so it shows on
    the run's summary page rather than only deep in its log. The rule itself keeps applying either way: it matches
    the quiz answers in "when", and the card text only labels it."""
    if os.environ.get('GITHUB_ACTIONS'):
        for g in not_ideal_unmatched(d):
            print(f'::warning title=CMS Picker "Not ideal if" rule::{g} is no longer on the card; update cms-picker/quiz.json')

def report(d, listing=False, today=None):
    today = today or datetime.date.today()
    names = {p['id']: p['name'] for p in d['platforms']}
    rows = {i['id']: i['label'] for i in d['items']}
    missing, stale, total = [], [], 0
    out = []
    per = []
    for pid, answers in d['answers'].items():
        unverified = [r for r, a in answers.items() if a['scope'] == 'C']
        unclear = [r for r, a in answers.items() if a['verdict'] == 'check']
        per.append((names.get(pid, pid), len(unverified), len(unclear), unverified, unclear))
        for r, a in answers.items():
            total += 1
            if not a.get('sourceUrl'): missing.append((pid, r))
            elif not a.get('lastVerified') or (today - datetime.date.fromisoformat(a['lastVerified'])).days > STALE_DAYS: stale.append((pid, r, a.get('lastVerified') or 'no date'))
    out.append(f'CMS Picker data: {total} answers, {total - len(missing)} with a source, {len(missing)} without, {len(stale)} checked over {STALE_DAYS} days ago.')
    flagged = [x for x in per if x[1] or x[2]]
    out.append('  not verified / unclear: ' + (', '.join(f'{n} {a}/{b}' for n, a, b, _, _ in flagged) if flagged else 'none'))
    # The quiz's "Not ideal if" rules (cms-picker/quiz.json) match the start of a line on the card. A card edited in
    # the Playbook can stop a rule matching, so say so on every publish and check (the persona test fails on a push)
    gone = not_ideal_unmatched(d)
    if gone: out.append('  WARNING "Not ideal if" rules whose card line has changed (update cms-picker/quiz.json): ' + '; '.join(gone))
    if listing:
        if missing:
            out.append('\nNo source yet:')
            for pid in dict.fromkeys(p for p, _ in missing):
                out.append(f'  {names.get(pid, pid)}: ' + ', '.join(rows.get(r, r) for p, r in missing if p == pid))
        if stale:
            out.append(f'\nLast checked over {STALE_DAYS} days ago:')
            out += [f'  {names.get(p, p)}: {rows.get(r, r)} ({when})' for p, r, when in stale]
        for n, _, _, unv, unc in flagged:
            if unv: out.append(f'  {n}, not verified: ' + ', '.join(rows.get(r, r) for r in unv))
            if unc: out.append(f'  {n}, unclear: ' + ', '.join(rows.get(r, r) for r in unc))
    return '\n'.join(out)

if __name__ == '__main__':
    d = json.loads(DATA.read_text(encoding='utf-8'))
    errs = problems(d)
    if errs:
        print(f'cms-picker/data.json doesn\'t fit cms-picker.schema.json ({len(errs)}):')
        for e in errs[:40]: print('  - ' + e)
        sys.exit(1)
    # The quiz's own values ship with the page code (cms-picker/quiz.json), so check them here too
    quiz = json.loads((DATA.parent / 'quiz.json').read_text(encoding='utf-8'))
    errs = validate({k: v for k, v in quiz.items() if not k.startswith('_')}, SCHEMA['properties']['quiz'], 'quiz')
    if errs:
        print(f'cms-picker/quiz.json doesn\'t fit cms-picker.schema.json ({len(errs)}):')
        for e in errs[:40]: print('  - ' + e)
        sys.exit(1)
    print(report(d, listing='--list' in sys.argv))
    annotate(d)
