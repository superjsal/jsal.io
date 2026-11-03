# Platform Playbook and CMS Picker data tools. Supabase is the source of truth:
#   app_data 'defaults' = the Playbook's base content (items, platforms, answers, how-to, watch-outs, page types, guides)
#   edits               = admin corrections made on the live page, layered over the base
#   picker              = the CMS Picker's own rows and each platform's public profile (admins only)
# This file lives in the site repo (.github/scripts, not published) so the nightly GitHub Action
# can run publish. Run it from anywhere: python .github\scripts\playbook.py <command>
#
#   backup       → saves every table to private/backups/playbook-<date-time>.json
#   pull         → saves the Playbook base content to private/playbook/defaults.json for editing
#   push         → uploads private/playbook/defaults.json as the base content (backs up first)
#   publish      → writes site/cms-picker/data.json, the answers-only public export (every answer, profile
#                  and source from the picker table; platform names from the Playbook; which rows, their
#                  labels and the platform order from cms-picker.json next to this file), any logos admins
#                  uploaded, then each page's date (the build makes the pages from data.json). Nightly by GitHub Action.
#   publish --from-backup <file>   → the same, from a backup file (no key needed)
#   dates        → moves on the date of each CMS Picker page whose data changed (no key needed)
#   export       → reads the Playbook as jsal.io/ic shows it (base content + edits + watch-outs) into
#                  private/playbook/export/: playbook.json and one <Platform>.md each. Writes nothing to Supabase or site/.
#   export --from-backup <file>    → the same, from a backup file (no key needed)
#
# Small fixes don't need this: sign in on jsal.io/ic as an admin and use Edit (the CMS Picker's answers,
# profiles, logos and "on the CMS Picker" switches are on the admin-only CMS Picker tab;
# platforms are added and hidden on the Team page). Use pull/push for structural Playbook changes the
# page can't make (a new item, page type or guide).
#
# Needs a secret key, which bypasses the access rules: Supabase → Project Settings → API Keys → a
# "secret" key (sb_secret_…), or the legacy service_role key. Set it in your own terminal only,
# never in a file or in chat:
#   PowerShell:  $env:SUPABASE_SERVICE_ROLE_KEY = "<secret key>"
import base64, datetime, hashlib, html, json, os, pathlib, re, subprocess, sys, urllib.error, urllib.parse, urllib.request
import xml.etree.ElementTree as ET

HERE = pathlib.Path(__file__).resolve().parent             # .github/scripts
SITE = HERE.parents[1] / 'site'                             # what jsal.io serves
PRIV = SITE.parent / 'private'                              # never committed; only on John's computer
PAGE = SITE / 'ic' / 'app.js'                            # the Playbook's script carries the project URL (public by design)
CONFIG = HERE / 'cms-picker.json'
PUBLIC = SITE / 'cms-picker' / 'data.json'
LOGO_DIR = SITE / 'cms-picker' / 'logos'                     # hand-made logos: <id>.svg
UPLOADED = LOGO_DIR / 'uploaded'                            # logos admins upload in the Playbook (written by publish)
DEFAULTS = PRIV / 'playbook' / 'defaults.json'
TABLES = ['app_data', 'edits', 'members', 'access_requests', 'requests', 'votes', 'comments', 'platform_notes', 'picker']

URL = re.search(r"const SUPABASE_URL = '([^']+)'", PAGE.read_text(encoding='utf-8')).group(1)
KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '').strip()


def api(method, path, body=None, prefer=None):
    # Every write to the built-in content goes through here, so a one-off script can't skip the stray-HTML check
    # that push runs (the content audit's apply once wrote three tags the page then swallowed)
    if method != 'GET' and path.split('?')[0] == 'app_data' and body is not None:
        errs = bad_html(body)
        if errs:
            sys.exit('Refusing to write app_data: stray HTML in the prose (the page would swallow it as tags):\n  ' + '\n  '.join(errs))
    req = urllib.request.Request(f'{URL}/rest/v1/{path}', method=method,
                                 data=None if body is None else json.dumps(body, ensure_ascii=False).encode('utf-8'))
    req.add_header('apikey', KEY)
    if not KEY.startswith('sb_'):                      # legacy service_role key (a JWT) also goes here;
        req.add_header('Authorization', f'Bearer {KEY}')   # new sb_secret_ keys only go in apikey
    req.add_header('Content-Type', 'application/json')
    if prefer:
        req.add_header('Prefer', prefer)
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read().decode('utf-8')
        return json.loads(raw) if raw else None


def table(name, query='select=*'):
    """Rows of a table, or None when it doesn't exist yet (e.g. picker before schema.sql has made it)."""
    try:
        return api('GET', f'{name}?{query}')
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def backup():
    data = {t: rows for t in TABLES if (rows := table(t)) is not None}
    stamp = datetime.datetime.now().strftime('%Y-%m-%d-%H%M')
    # PLAYBOOK_BACKUP_DIR: where the weekly Action puts its copy (there's no private\ on a runner)
    out = pathlib.Path(os.environ.get('PLAYBOOK_BACKUP_DIR') or PRIV / 'backups') / f'playbook-{stamp}.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'backup: {out}')
    print('  ' + ', '.join(f'{t} {len(rows)}' for t, rows in data.items()))
    return out


def pull():
    rows = api('GET', 'app_data?id=eq.defaults&select=data,updated_at')
    if not rows:
        sys.exit('No base content found (app_data id "defaults").')
    DEFAULTS.parent.mkdir(parents=True, exist_ok=True)
    DEFAULTS.write_text(json.dumps(rows[0]['data'], ensure_ascii=False, indent=1), encoding='utf-8')
    edits = api('GET', 'edits?select=platform')
    print(f'pulled: {DEFAULTS} (last updated {rows[0]["updated_at"]})')
    print(f'  {len(edits)} live edits sit on top of this and are kept when you push.')


# The Playbook shows its built-in text as HTML, so a stray "<" in prose becomes a tag the page swallows (a how-to once
# lost "<theme>", a note "<table>"). Prose may carry only these tags, balanced; a guide block's code sample ("code") is
# shown as text and may hold anything. push refuses the file until it's clean; "check" lints it without pushing.
PROSE_TAGS = {'b', 'i', 'em', 'strong', 'code', 'a', 'br', 'p', 'ul', 'ol', 'li', 'span', 'kbd', 'small'}
def bad_html(data):
    out = []
    def walk(x, path, in_code):
        if isinstance(x, dict):
            for k, v in x.items(): walk(v, f'{path}.{k}', in_code or k == 'code')
        elif isinstance(x, list):
            for i, v in enumerate(x): walk(v, f'{path}[{i}]', in_code)
        elif isinstance(x, str) and not in_code and '<' in x:
            tags = re.findall(r'<(/?)([a-zA-Z][a-zA-Z0-9-]*)', x)
            odd = sorted({t for _, t in tags if t.lower() not in PROSE_TAGS})
            if odd: out.append(f'{path}: <{">, <".join(odd)}> in prose (write &lt; for a literal "<")')
            if re.search(r'<(?![/a-zA-Z!])', x): out.append(f'{path}: a bare "<" (write &lt;)')
            depth = {}
            for close, t in tags:
                t = t.lower()
                if t in PROSE_TAGS and t != 'br': depth[t] = depth.get(t, 0) + (-1 if close else 1)
            open_ = [f'<{t}>' for t, v in depth.items() if v]
            if open_: out.append(f'{path}: unbalanced {", ".join(open_)}')
    walk(data, '', False)
    return out


def check():
    if not DEFAULTS.exists():
        sys.exit(f'Nothing to check: run "python playbook.py pull" first.')
    errs = bad_html(json.loads(DEFAULTS.read_text(encoding='utf-8')))
    print('\n'.join(errs) if errs else f'{DEFAULTS}: no stray HTML in the prose')
    sys.exit(1 if errs else 0)


def push():
    if not DEFAULTS.exists():
        sys.exit(f'Nothing to push: run "python playbook.py pull" first, then edit {DEFAULTS}.')
    new = json.loads(DEFAULTS.read_text(encoding='utf-8'))
    errs = bad_html(new)
    if errs:
        sys.exit('Refusing to push: stray HTML in the prose (the page would swallow it as tags):\n  ' + '\n  '.join(errs))
    current = api('GET', 'app_data?id=eq.defaults&select=data')
    if current:
        missing = set(current[0]['data']) - set(new)
        if missing:
            sys.exit(f'Refusing to push: these sections are missing from defaults.json: {", ".join(sorted(missing))}')
    backup()
    api('POST', 'app_data', {'id': 'defaults', 'data': new, 'updated_at': datetime.datetime.now(datetime.timezone.utc).isoformat()},
        prefer='resolution=merge-duplicates,return=minimal')
    print('pushed: base content updated. Reload jsal.io/ic to see it.')

def plain(t):
    return html.unescape(re.sub(r'<[^>]+>', '', str(t or ''))).strip()


# The "What it costs to start" rows' tags: a band from the platform's own pricing page, never a price
COST_TAGS = {'free': 'Free to start', 'low': 'Under $25/mo', 'mid': '$25–$100/mo', 'high': 'Over $100/mo',
             'software': 'Free software + hosting', 'na': 'Not offered'}


def publish(backup_file=None):
    """Answers only: tag, short mark and scope per platform and item, plus each platform's profile, all
    from the picker table (the CMS Picker keeps its own answers, separate from the Playbook's). The
    Playbook supplies the platform list and names. Which rows and platforms are public, their labels and
    order come from cms-picker.json. No notes, how-to, watch-outs, guides, page types, requests, comments
    or team data reach the public file."""
    if backup_file:
        data = json.loads(pathlib.Path(backup_file).read_text(encoding='utf-8'))
        rows, picker = data['app_data'], data.get('picker')
    else:
        rows, picker = api('GET', 'app_data?id=eq.defaults&select=id,data'), table('picker')
    base = next((r['data'] for r in rows if r['id'] == 'defaults'), None)
    if not base:
        sys.exit('No base content found (app_data id "defaults").')
    cfg = json.loads(CONFIG.read_text(encoding='utf-8'))
    plats = {p['id']: p for p in base['P'] if not p.get('hidden')}
    # The CMS Picker's own rows, profiles and logos, and which platforms are public: the picker table
    if not picker:   # never publish a blank CMS Picker
        sys.exit('Stopped: the picker table is empty or missing. Nothing was published.')
    profiles = {r['platform']: r['profile'] for r in picker}
    own = {r['platform']: r['answers'] for r in picker}
    # Each answer's source and when it was checked (picker.sources; admins add them in the Playbook)
    sources = {r['platform']: r.get('sources') or {} for r in picker}
    missing = []

    # Which platforms are public: the picker table's "public" switch (admins set it in the Playbook).
    # Order: cms-picker.json's list, then any others by name, Headless CMS last. A platform needs a
    # profile with a type to be shown.
    on = {r['platform'] for r in picker if r.get('public')}
    if not on:   # e.g. a backup from before the switch existed: never publish a blank CMS Picker
        sys.exit('Stopped: no platform is switched on for the CMS Picker. Nothing was published.')
    listed = [pid for pid in cfg['platforms'] if pid in on and pid != 'headless']
    rest = sorted((pid for pid in on if pid not in listed and pid != 'headless' and pid in plats), key=lambda pid: plain(plats[pid]['name']).lower())
    wanted = listed + rest + (['headless'] if 'headless' in on else [])
    skipped = [pid for pid in wanted if pid not in plats]
    noprofile = [pid for pid in wanted if pid in plats and not (profiles.get(pid) or {}).get('type')]
    public = [pid for pid in wanted if pid in plats and pid not in noprofile]
    logos = write_logos(public, {r['platform']: r.get('logo') for r in picker})
    result = {
        'schemaVersion': 2,                          # cms-picker.schema.json; 2 = answers can carry their source
        'verdicts': {**base['VERDICT'], 'indirect': 'Indirectly', **COST_TAGS},
        'asOf': cfg.get('asOf'),                     # when the answers were last checked (the hero's "Updated")
        'groups': [],
        'items': [],
        'platforms': [{'id': pid, 'name': plain(plats[pid]['name']), **({'logo': logos[pid]} if pid in logos else {}),
                       'profile': profiles.get(pid)} for pid in public],
        'answers': {pid: {} for pid in public},
    }
    # Table sections and rows in order, with each platform's answers from the picker table
    # (answers per platform: { row id: [verdict, mark, scope] }).
    for sec in cfg['sections']:
        result['groups'].append({k: sec[k] for k in ('id', 'title', 'asOf') if k in sec})
        for i in sec['items']:
            result['items'].append({'id': i['id'], 'label': i['label'], **({'term': i['term']} if i.get('term') else {}), 'group': sec['id']})
            for pid in public:
                a = own.get(pid, {}).get(i['id'])
                if not a:
                    missing.append(f'{pid}/{i["id"]}')
                    a = ['check', '', 'C']
                v, m, s = a
                result['answers'][pid][i['id']] = {'verdict': v, 'mark': m, 'scope': s}
                src = sources.get(pid, {}).get(i['id'])
                if src and src.get('url'):
                    result['answers'][pid][i['id']].update({'sourceUrl': src['url'], 'lastVerified': src.get('checked', '')})
                if src and src.get('where'):   # where to find the setting, e.g. "Pages → page settings → SEO"
                    result['answers'][pid][i['id']]['where'] = src['where']
    # The quiz's own values aren't published here: they're in cms-picker/quiz.json, which ships with the page
    # code (and its ?v= number), so a release never pairs new scoring with old values or the other way round
    if missing:
        # A row no public platform has an answer for means the picker table is missing it altogether
        # (e.g. a new row in cms-picker.json): never publish a column of "Check" over the live answers
        empty = [i['id'] for i in result['items'] if all(f'{pid}/{i["id"]}' in missing for pid in public)]
        if empty:
            sys.exit(f'Stopped: no platform has an answer for {", ".join(empty)} in the picker table. Nothing was published.')
        print('  no answer yet (shown as "Check"): ' + ', '.join(missing))
    # Never publish data the page or the checks can't read
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
    import check_data
    errs = check_data.problems(result)
    if errs:
        sys.exit('Stopped: the CMS Picker data doesn\'t fit cms-picker.schema.json. Nothing was published.\n  - ' + '\n  - '.join(errs[:20]))
    print('  ' + check_data.report(result).replace('\n', '\n  '))
    check_data.annotate(result)
    out = json.dumps(result, ensure_ascii=False, separators=(',', ':'))
    if PUBLIC.exists() and PUBLIC.read_text(encoding='utf-8') == out:
        print(f'published: no changes ({len(public)} platforms, {len(result["items"])} items)')
    else:
        PUBLIC.parent.mkdir(parents=True, exist_ok=True)
        PUBLIC.write_text(out, encoding='utf-8')
        print(f'published: {PUBLIC} ({len(public)} platforms, {len(result["items"])} items)')
    if skipped:
        print('  not in the Playbook data (or hidden), left out: ' + ', '.join(skipped))
    if noprofile:
        print('  on the CMS Picker but no profile type yet, left out: ' + ', '.join(noprofile))
    page_dates()


# ── Logos ──
# A logo is drawn in one colour through a CSS mask, so only its shape matters. Admins upload SVG or PNG
# in the Playbook; it's stored in the picker table and written here as cms-picker/logos/uploaded/<id>.*
# (SVG cleaned first: no scripts, event handlers, external links or embedded documents). Without an
# upload, a hand-made logos/<id>.svg is used if there is one; otherwise the page shows a letter badge.
SVG_NS, XLINK_NS = 'http://www.w3.org/2000/svg', 'http://www.w3.org/1999/xlink'
SVG_TAGS = {'svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'defs', 'clipPath', 'mask',
            'linearGradient', 'radialGradient', 'stop', 'title', 'desc', 'use', 'symbol', 'style'}


def clean_svg(text):
    if re.search(r'<!(DOCTYPE|ENTITY)', text, re.I):
        raise ValueError('DOCTYPE or ENTITY')
    root = ET.fromstring(text)
    local = lambda t: t.rsplit('}', 1)[-1]
    if local(root.tag) != 'svg':
        raise ValueError('not an SVG')

    def bad_value(v):
        v = v.lower()
        return 'javascript:' in v or 'expression(' in v or '@import' in v or re.search(r'url\(\s*[\'"]?(?!#)', v)

    def walk(el):
        for k in list(el.attrib):
            n = local(k).lower()
            if n.startswith('on') or (n == 'href' and not el.attrib[k].startswith('#')) or bad_value(el.attrib[k]):
                del el.attrib[k]
        if local(el.tag) == 'style' and el.text and bad_value(el.text):
            el.text = ''
        for child in list(el):
            if not isinstance(child.tag, str) or local(child.tag) not in SVG_TAGS:
                el.remove(child)
            else:
                walk(child)
    walk(root)
    ET.register_namespace('', SVG_NS)
    ET.register_namespace('xlink', XLINK_NS)
    if not root.tag.startswith('{'):
        root.set('xmlns', SVG_NS)
    return ET.tostring(root, encoding='unicode').encode('utf-8')


def write_logos(public, uploads):
    # Writes the uploaded logos and returns {platform: path for data.json} (with a ?v= of the file)
    UPLOADED.mkdir(parents=True, exist_ok=True)
    keep, paths = set(), {}
    for pid in public:
        raw, data, ext = uploads.get(pid), None, None
        if raw:
            try:
                if raw.startswith('data:image/png;base64,'):
                    data, ext = base64.b64decode(raw.split(',', 1)[1], validate=True), 'png'
                    if not data.startswith(b'\x89PNG\r\n\x1a\n'):
                        raise ValueError('not a PNG')
                else:
                    data, ext = clean_svg(raw), 'svg'
            except Exception as err:   # a bad upload falls back to the hand-made logo or the badge
                print(f'  logo for {pid} skipped ({err})')
                data = None
        if data:
            f = UPLOADED / f'{pid}.{ext}'
            if not f.exists() or f.read_bytes() != data:
                f.write_bytes(data)
            keep.add(f.name)
        else:
            f = LOGO_DIR / f'{pid}.svg'
            if not f.exists():
                continue
        paths[pid] = f'{f.relative_to(LOGO_DIR.parent).as_posix()}?v={hashlib.sha1(f.read_bytes()).hexdigest()[:8]}'
    for f in UPLOADED.iterdir():   # uploads that were removed, or platforms taken off the CMS Picker
        if f.name not in keep:
            f.unlink()
    return paths


# ── The CMS Picker's pages: their dates ──
# The build makes the CMS Picker page's plain-HTML copy and one page per platform from data.json
# (src/lib/cms-picker.mjs). What it can't know is when each page last changed, so the publish keeps that in
# src/data/cms-picker-dates.json: a page's date moves on only when the data it shows changed, and the build's
# sitemap takes its lastmod from it. The nightly commit of that file is also what tells IndexNow which pages changed.
DATES = SITE.parent / 'src' / 'data' / 'cms-picker-dates.json'


def page_inputs(d):
    """Each page and the data it shows, the CMS Picker page first: a change to any of it is a change to the page."""
    plats = [p for p in d['platforms'] if p.get('profile')]
    out = {'cms-picker': d}
    for p in plats:
        pid = p['id']
        if not re.fullmatch(r'[a-z0-9-]+', pid) or pid == 'cms-picker':
            sys.exit(f'platform pages: "{pid}" is not a safe address')
        out[pid] = {'platform': p, 'answers': d['answers'][pid], 'items': d['items'], 'verdicts': d['verdicts'],
                    'asOf': d.get('asOf'), 'others': [[o['id'], o['name']] for o in plats if o['id'] != pid],
                    'ownShareImage': (SITE / 'og' / f'cms-picker-{pid}.png').exists()}
    return out


def page_dates():
    d = json.loads(PUBLIC.read_text(encoding='utf-8'))
    old = json.loads(DATES.read_text(encoding='utf-8')) if DATES.exists() else {}
    today = datetime.date.today().isoformat()
    new, changed = {}, []
    for page, inputs in page_inputs(d).items():
        h = hashlib.sha256(json.dumps(inputs, ensure_ascii=False, sort_keys=True).encode('utf-8')).hexdigest()[:16]
        was = old.get(page)
        if was and was['hash'] == h:
            new[page] = was
            continue
        new[page] = {'date': today, 'hash': h}
        changed.append(page)
    removed = [p for p in old if p not in new]   # platforms taken off the CMS Picker: the build drops their pages
    if new != old:
        DATES.parent.mkdir(exist_ok=True)
        DATES.write_text(json.dumps(new, indent=2) + '\n', encoding='utf-8')
    print(f'page dates: {len(new)} pages, ' + (f'changed: {", ".join(changed)}' if changed else 'none changed')
          + (f'; removed: {", ".join(removed)}' if removed else ''))


# ── Export: the Playbook as jsal.io/ic shows it, to read without the page ──
# The base content with the admins' edits and each platform's watch-out layered on top, resolved the same way
# site/ic/app.js does (answer(), howFor(), warnFor(), variantCell()). Reads only: nothing goes to Supabase or site/.
# Built-in text is HTML and edits are Markdown, so the export turns the HTML into Markdown and everything reads alike.
EXPORT = PRIV / 'playbook' / 'export'
STRAY_LT = re.compile(r'<(?!/?(?:b|i|em|strong|code|a|br|p|ul|ol|li|span|kbd|small)(?=[\s/>])[^<>]*>)', re.I)
ANSWERS = ['Yes', 'Yes, with limitations', 'No', 'Check']
LIMITED = re.compile(r'^(partly|partial|mostly|some|limited|depends)\b|\b(paid plans?|plan\+|plans? and up|pages only|only on|limited)\b|\d+(\.\d+)*\+|;', re.I)


def html_md(h):
    """Built-in HTML as Markdown, like the page's edit boxes show it; a stray "<" stays as written (proseSafe)."""
    h = STRAY_LT.sub('&lt;', str(h or ''))
    h = re.sub(r'<code>(.*?)</code>', r'`\1`', h, flags=re.S)
    h = re.sub(r'</?(?:b|strong)>', '**', h)
    h = re.sub(r'</?(?:i|em)>', '*', h)
    h = re.sub(r'<a\b[^>]*?href="([^"]*)"[^>]*>(.*?)</a>', r'[\2](\1)', h, flags=re.S)
    h = re.sub(r'<br\s*/?>', '\n', h)
    h = re.sub(r'<li\b[^>]*>', '\n- ', h)
    h = re.sub(r'</(?:p|ul|ol)>', '\n', h)
    return html.unescape(re.sub(r'<[^>]+>', '', h)).strip()


def answer_of(mark, verdict):
    # The answer word the page shows beside the tag (answerOf in app.js)
    m = plain(mark)
    low = m.lower()
    if m in ANSWERS: return m
    if re.match(r'(check|unknown|unclear|not sure)\b', low) or (not m and verdict == 'check'): return 'Check'
    if re.match(r'(likely no|unlikely|probably not)\b', low): return 'Check' if verdict == 'check' else 'No'
    if re.match(r'no\b', low): return 'Yes, with limitations' if verdict in ('code', 'plugin', 'hosting') and re.search(r'[(\w]', low[2:]) else 'No'
    if LIMITED.search(m): return 'Yes, with limitations'
    return {'no': 'No', 'check': 'Check'}.get(verdict, 'Yes')


def merged_playbook(base, edits, notes, source, data_at):
    """Every visible platform's answers, how-to, watch-outs and guides, as the page shows them."""
    V, S, PT, BY = base['VERDICT'], base['SCOPE'], base.get('PTYPES', {}), base.get('BY_TYPE', {})
    HOW, WARN, GUIDES, HG = base.get('HOW', {}), base.get('WARN', {}), base.get('GUIDES', {}), base.get('HOW_GUIDES', {})
    H1 = base.get('H1_FIX', '')
    unchecked = set(base.get('HOW_UNVERIFIED', []))
    edit = {(e['platform'], e['sec'], e['item']): e for e in edits}
    note_of = {n['platform']: n for n in notes}
    bold_fix = lambda h: html_md(h.replace(H1, f'<b>{H1}</b>') if H1 else h)
    ptype = lambda sec: sec[8:] if sec.startswith('content.') else ''

    def typed(pid, sec, iid):
        return (BY.get(pid, {}).get(ptype(sec), {}).get(iid) if ptype(sec) else None) or {}

    def answer(p, sec, iid):   # (cell, the edit its text comes from)
        if ed := edit.get((p['id'], sec, iid)):
            return [ed['verdict'], ed['mark'], ed['scope'], ed.get('note') or ''], ed
        if sec == 'tech': return p['cells'].get(iid), None
        if ptype(sec): return (typed(p['id'], sec, iid)['cell'], None) if typed(p['id'], sec, iid).get('cell') else answer(p, 'content', iid)
        return base['CONTENT'].get(p['id'], {}).get(iid), None

    def how(p, sec, iid):      # (steps, whether an edit wrote them)
        ed = edit.get((p['id'], sec, iid))
        if ed and isinstance(ed.get('how'), str): return [x.strip() for x in ed['how'].split('\n') if x.strip()], True
        if t := typed(p['id'], sec, iid).get('how'): return [html_md(x) for x in t], False
        if ptype(sec): return how(p, 'content', iid)
        return [html_md(x) for x in HOW.get(p['id'], {}).get(iid, [])], False

    def warn(p, sec, iid):
        ed = edit.get((p['id'], sec, iid))
        if ed and isinstance(ed.get('warn'), str): return ed['warn'].strip()
        t = typed(p['id'], sec, iid)
        if isinstance(t.get('warn'), str): return bold_fix(t['warn'])
        if ptype(sec): return warn(p, 'content', iid)
        return bold_fix(WARN.get(p['id'], {}).get(iid, ''))

    def shown(cell, md_text):
        verdict, mark, scope, note = (list(cell) + ['', '', '', ''])[:4]
        out = {'answer': answer_of(mark, verdict), 'verdict': verdict, 'tag': V.get(verdict, verdict), 'scope': S.get(scope, scope),
               'note': (note or '').strip() if md_text else html_md(note)}
        if plain(mark) not in ANSWERS and plain(mark).lower() != out['answer'].lower():
            out['mark'] = plain(mark)   # older free-text answers the page still shows beside the word
        return out

    def entry(p, sec, iid):
        cell, ed = answer(p, sec, iid)
        if not cell: return None
        own = bool(ptype(sec)) and bool(typed(p['id'], sec, iid).get('cell') or edit.get((p['id'], sec, iid)))
        steps, how_edited = how(p, sec, iid)
        e = {**shown(cell, bool(ed)), 'watchOut': warn(p, sec, iid), 'how': steps}
        if steps and not how_edited and p['id'] in unchecked: e['howUnchecked'] = True
        if steps and (g := [x for x in HG.get(p['id'], {}).get(iid, []) if x in GUIDES]): e['guides'] = g
        if ed: e['editedAt'] = ed.get('at')
        # A page-builder choice (WordPress, Magento) replaces the answer, unless this page type has its own
        v = base.get('VARIANTS', {}).get(p['id'])
        if v and sec.startswith('content') and not own:
            b = {name: shown(o[iid], False) for name, o in v['options'].items() if o.get(iid)}
            if b: e['byBuilder'] = {'label': v['label'], 'options': b}
        return e

    def section(p, sec, items):
        return {it['id']: e for it in items if (e := entry(p, sec, it['id']))}

    visible = sorted((p for p in base['P'] if not p.get('hidden')), key=lambda p: (p['id'] == 'headless', p['name'].lower()))
    platforms = []
    for p in visible:
        n = note_of.get(p['id'])
        times = [data_at, n and n.get('at')] + [e.get('at') for e in edits if e['platform'] == p['id']]
        out = {'id': p['id'], 'name': plain(p['name']), 'file': re.sub(r'[<>:"/\\|?*]', '', plain(p['name'])) + '.md',
               'about': html_md(p.get('about')), 'watchOut': {'text': n['warn'].strip(), 'at': n.get('at')} if n and n.get('warn') else None,
               'updated': max((t for t in times if t), default=None), 'tech': section(p, 'tech', base['ITEMS'])}
        if p['id'] in BY:   # the page shows these platforms' Content answers one page type at a time
            out['contentByPageType'] = {t: section(p, f'content.{t}', base['CONTENT_ITEMS']) for t in PT}
        else:
            out['content'] = section(p, 'content', base['CONTENT_ITEMS'])
        platforms.append(out)
    items = lambda lst: [{'id': i['id'], 'label': html_md(i['label']), **({'hint': html_md(i['hint'])} if i.get('hint') else {})} for i in lst]
    md_block = lambda b: {k: (v if k in ('code', 'lang', 'label') else [html_md(x) for x in v] if isinstance(v, list) else html_md(v)) for k, v in b.items()}
    return {
        'exported': datetime.datetime.now().astimezone().isoformat(timespec='seconds'), 'source': source, 'contentUpdated': data_at,
        'text': 'Markdown', 'tags': V, 'scopes': S, 'pageTypes': PT,
        'items': {'tech': items(base['ITEMS']), 'content': items(base['CONTENT_ITEMS'])},
        'guides': {gid: {'group': g.get('group'), 'title': html_md(g.get('title')), 'intro': html_md(g.get('intro')),
                         **({'unverified': True} if g.get('unverified') else {}), 'blocks': [md_block(b) for b in g.get('blocks', [])]}
                   for gid, g in GUIDES.items()},
        'platforms': platforms,
    }


def platform_md(pb, p):
    """One platform as a readable Markdown file: Tech, then Content (by page type where it differs), then its guides."""
    day = lambda t: (t or '')[:10]
    L = [f'# {p["name"]}: Platform Playbook', '',
         f'Exported from jsal.io/ic on {pb["exported"][:16].replace("T", " ")} ({pb["source"]}). Answers last changed {day(p["updated"])}.', '']
    if p['about']: L += [p['about'], '']
    if p['watchOut']: L += [f'> **Watch out ({p["name"]}, every section):** {p["watchOut"]["text"]}', '']
    used = []

    def answer_line(e):
        # "Check" beside a "Check manually" tag says the same thing twice, so the page shows the tag alone
        word = '' if e['answer'] == 'Check' and e['verdict'] == 'check' else f'**{e["answer"]}** · '
        return f'{word}{e["tag"]} · {e["scope"]}' + (f' ({e["mark"]})' if e.get('mark') else '')

    def body(e):
        out = [answer_line(e)]
        if e['note']: out += ['', e['note']]
        if e['watchOut']: out += ['', f'**Watch out:** {e["watchOut"]}']
        if e['how']:
            out += ['', 'How to:'] + [f'{n}. {s}' for n, s in enumerate(e['how'], 1)]
            if e.get('howUnchecked'): out += ['', '_These steps haven’t been checked in a live admin yet._']
        used.extend(g for g in e.get('guides', []) if g not in used)
        if e.get('guides'): out +=['', 'Guides: ' + '; '.join(pb['guides'][g]['title'] for g in e['guides']) + ' (below)']
        if e.get('byBuilder'):
            b = e['byBuilder']
            out += ['', f'{b["label"]}, when known (replaces the answer above):']
            out += [f'- {name}: {answer_line(x)}' + (f'. {x["note"]}' if x['note'] else '') for name, x in b['options'].items()]
        if e.get('editedAt'): out += ['', f'_Team edit, {day(e["editedAt"])}._']
        return out

    def item_head(it):
        return [f'### {it["label"]}'] + ([f'_{it["hint"]}_'] if it.get('hint') else []) + ['']

    L += ['## Tech', '']
    for it in pb['items']['tech']:
        if e := p['tech'].get(it['id']): L += item_head(it) + body(e) + ['']
    L += ['## Content', '']
    if 'contentByPageType' in p:
        names = pb['pageTypes']
        L += [f'Answers can differ by page type ({", ".join(names.values())}); where they all agree, they’re shown once.', '']
        for it in pb['items']['content']:
            groups = {}   # identical answers across page types are shown once
            for t, sec in p['contentByPageType'].items():
                if e := sec.get(it['id']): groups.setdefault(json.dumps(e, sort_keys=True), (e, []))[1].append(names.get(t, t))
            if not groups: continue
            L += item_head(it)
            if len(groups) == 1:
                L += body(next(iter(groups.values()))[0]) + ['']
            else:
                for e, types in groups.values(): L += [f'#### {", ".join(types)}', ''] + body(e) + ['']
    else:
        for it in pb['items']['content']:
            if e := p['content'].get(it['id']): L += item_head(it) + body(e) + ['']
    if used:
        L += ['## Guides', '']
        for gid in used:
            g = pb['guides'][gid]
            L += [f'### {g["title"]}', f'_{g["group"]}_', '', g['intro'], '']
            if g.get('unverified'): L += ['_These steps haven’t been checked in a live admin yet._', '']
            for b in g['blocks']:
                if 'h' in b: L += [f'#### {b["h"]}', '']
                elif 'p' in b: L += [b['p'], '']
                elif 'note' in b: L += [f'> {b["note"]}', '']
                elif 'ol' in b: L += [f'{n}. {x}' for n, x in enumerate(b['ol'], 1)] + ['']
                elif 'ul' in b: L += [f'- {x}' for x in b['ul']] + ['']
                elif 'code' in b: L += ([f'{b["label"]}:'] if b.get('label') else []) + [f'```{b.get("lang", "")}', b['code'].rstrip(), '```', '']
    return '\n'.join(L).rstrip() + '\n'


def export(backup_file=None):
    if backup_file:
        data = json.loads(pathlib.Path(backup_file).read_text(encoding='utf-8'))
        rows, edits, notes = data['app_data'], data.get('edits') or [], data.get('platform_notes') or []
        source = f'backup {pathlib.Path(backup_file).name}'
    else:
        rows = api('GET', 'app_data?id=eq.defaults&select=id,data,updated_at')
        edits, notes = table('edits') or [], table('platform_notes') or []
        source = 'live data'
    row = next((r for r in rows if r['id'] == 'defaults'), None)
    if not row:
        sys.exit('No base content found (app_data id "defaults").')
    # The export holds team content: only ever into private/, and only while git ignores it
    if SITE in EXPORT.parents or subprocess.run(['git', 'check-ignore', '-q', str(EXPORT / 'playbook.json')],
                                                cwd=SITE.parent, capture_output=True).returncode != 0:
        sys.exit(f'Stopped: {EXPORT} isn’t ignored by git. Nothing was written.')
    pb = merged_playbook(row['data'], edits, notes, source, row['data'].get('AT') or row.get('updated_at'))
    EXPORT.mkdir(parents=True, exist_ok=True)
    for f in EXPORT.glob('*.md'):   # platforms renamed or hidden since the last export
        f.unlink()
    (EXPORT / 'playbook.json').write_text(json.dumps(pb, ensure_ascii=False, indent=1), encoding='utf-8')
    for p in pb['platforms']:
        (EXPORT / p['file']).write_text(platform_md(pb, p), encoding='utf-8')
    print(f'exported: {EXPORT} ({len(pb["platforms"])} platforms, {len(edits)} edits, {len(notes)} watch-outs; from {source})')
    print('  ' + ', '.join(p['file'] for p in pb['platforms']))


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd in ('dates', 'check'):
        page_dates() if cmd == 'dates' else check()
        sys.exit()
    if cmd not in ('backup', 'pull', 'push', 'publish', 'export'):
        sys.exit('Usage: python playbook.py backup | pull | push | publish | export [--from-backup <file>] | dates | check')
    flag = lambda name: sys.argv[sys.argv.index(name) + 1] if name in sys.argv[2:-1] else None
    if cmd in ('publish', 'export') and flag('--from-backup'):
        (publish if cmd == 'publish' else export)(flag('--from-backup'))
        sys.exit()
    if not KEY:
        sys.exit('Set the service_role key first (in this terminal only):\n'
                 '  $env:SUPABASE_SERVICE_ROLE_KEY = "<key from Supabase → Project Settings → API>"')
    {'backup': backup, 'pull': pull, 'push': push, 'publish': publish, 'export': export}[cmd]()
