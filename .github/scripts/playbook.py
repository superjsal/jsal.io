# Platform Playbook and CMS Picker data tools. Supabase is the source of truth:
#   app_data 'defaults' = the Playbook's base content (items, platforms, answers, how-to, watch-outs, page types, guides)
#   edits               = admin corrections made on the live page, layered over the base
#   picker              = the CMS Picker's own rows and each platform's public profile (admins only)
# This file lives in the site repo (site/.github/scripts, not published) so the nightly GitHub Action
# can run publish. Run it from anywhere: python site\.github\scripts\playbook.py <command>
#
#   backup       → saves every table to private/backups/playbook-<date-time>.json
#   pull         → saves the Playbook base content to private/playbook/defaults.json for editing
#   push         → uploads private/playbook/defaults.json as the base content (backs up first)
#   publish      → writes site/cms-picker/data.json, the answers-only public export (Playbook rows +
#                  the picker table; which rows and platforms, their labels and order from cms-picker.json
#                  next to this file), then the plain-HTML copy in the page. Nightly by GitHub Action.
#   publish --from-backup <file>   → the same, from a backup file (no key needed)
#   prerender    → re-writes the plain-HTML copy of data.json into site/cms-picker/index.html (no key needed)
#   picker-seed  → one time: copies the profiles and answers still in cms-picker.json into the picker table
#   add --extra <file> to layer draft platforms over it for development (never commit that output)
#
# Small fixes don't need this: sign in on jsal.io/ic as an admin and use Edit (the CMS Picker's own
# rows and profile are in an admin-only section on each platform). Use pull/push for structural
# Playbook changes the page can't make (a new platform, item, page type or guide).
#
# Needs a secret key, which bypasses the access rules: Supabase → Project Settings → API Keys → a
# "secret" key (sb_secret_…), or the legacy service_role key. Set it in your own terminal only,
# never in a file or in chat:
#   PowerShell:  $env:SUPABASE_SERVICE_ROLE_KEY = "<secret key>"
import datetime, html, json, os, pathlib, re, sys, urllib.error, urllib.request

HERE = pathlib.Path(__file__).resolve().parent             # site/.github/scripts
SITE = HERE.parents[1]                                      # the site repo (what jsal.io serves)
PRIV = SITE.parent / 'private'                              # never committed; only on John's computer
PAGE = SITE / 'ic' / 'index.html'
CONFIG = HERE / 'cms-picker.json'
PUBLIC = SITE / 'cms-picker' / 'data.json'
DEFAULTS = PRIV / 'playbook' / 'defaults.json'
TABLES = ['app_data', 'edits', 'members', 'access_requests', 'requests', 'votes', 'comments', 'platform_notes', 'picker']

URL = re.search(r"const SUPABASE_URL = '([^']+)'", PAGE.read_text(encoding='utf-8')).group(1)
KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '').strip()


def api(method, path, body=None, prefer=None):
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
    """Rows of a table, or None when it doesn't exist yet (e.g. picker before picker.sql has run)."""
    try:
        return api('GET', f'{name}?{query}')
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def backup():
    data = {t: rows for t in TABLES if (rows := table(t)) is not None}
    stamp = datetime.datetime.now().strftime('%Y-%m-%d-%H%M')
    out = PRIV / 'backups' / f'playbook-{stamp}.json'
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


def push():
    if not DEFAULTS.exists():
        sys.exit(f'Nothing to push: run "python playbook.py pull" first, then edit {DEFAULTS}.')
    new = json.loads(DEFAULTS.read_text(encoding='utf-8'))
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


def publish(backup_file=None, extra_file=None):
    """Answers only: tag, short mark and scope per platform and item, plus each platform's profile.
    Which rows and platforms are public, their labels and order come from cms-picker.json; Playbook rows
    from Playbook, the CMS Picker's own rows and the profiles from the picker table.
    No notes, how-to, watch-outs, guides, page types, requests, comments or team data reach the public file."""
    if backup_file:
        data = json.loads(pathlib.Path(backup_file).read_text(encoding='utf-8'))
        rows, edits, picker = data['app_data'], data['edits'], data.get('picker')
    else:
        rows, edits, picker = api('GET', 'app_data?id=eq.defaults&select=id,data'), api('GET', 'edits?select=*'), table('picker')
    base = next((r['data'] for r in rows if r['id'] == 'defaults'), None)
    if not base:
        sys.exit('No base content found (app_data id "defaults").')
    cfg = json.loads(CONFIG.read_text(encoding='utf-8'))
    plats = {p['id']: p for p in base['P']}
    content = dict(base['CONTENT'])
    if extra_file:                                  # development only: draft platforms not in Supabase yet
        for p in json.loads(pathlib.Path(extra_file).read_text(encoding='utf-8'))['platforms']:
            plats.setdefault(p['id'], p)
            content.setdefault(p['id'], p['content'])
        print('NOTE: built with --extra (draft platforms). Do not commit this data.json.')
    ed = {f"{e['platform']}~{e['sec']}~{e['item']}": e for e in edits}

    def cell(pid, sec, item):                       # an admin edit wins over the built-in answer
        e = ed.get(f'{pid}~{sec}~{item}')
        if e:
            c = [e['verdict'], e['mark'], e['scope'], e.get('note', '')]
        else:
            c = (plats[pid]['cells'] if sec == 'tech' else content[pid])[item]
        out = {'verdict': c[0], 'mark': plain(c[1]), 'scope': c[2]}
        # "Not possible" with an indirect route in Playbook's note (e.g. the sitemap: "Indirect: noindex
        # or delete the page") is shown publicly as "Indirectly" plus that route, not as a flat no.
        note = plain(c[3] if len(c) > 3 else '')
        if c[0] == 'no' and 'Indirect:' in note:
            how = note.split('Indirect:', 1)[1].strip().rstrip('.')
            out = {'verdict': 'indirect', 'mark': how[:1].upper() + how[1:], 'scope': c[2]}
        return out

    # The CMS Picker's own rows and the profiles: the picker table, or cms-picker.json until it's seeded
    if picker:
        profiles = {r['platform']: r['profile'] for r in picker}
        own = {r['platform']: r['answers'] for r in picker}
    else:
        print('NOTE: picker table missing or empty, using the profiles and answers in cms-picker.json (run picker-seed).')
        profiles = cfg.get('profiles', {})
        own = {pid: {k: v for sec in cfg['sections'] for k, v in sec.get('answers', {}).get(pid, {}).items()} for pid in cfg['platforms']}
        if not profiles:   # seeded, but the table came back empty: never publish a blank CMS Picker
            sys.exit('Stopped: the picker table is empty and cms-picker.json has no profiles. Nothing was published.')
    missing = []

    public = [pid for pid in cfg['platforms'] if pid in plats]
    skipped = [pid for pid in cfg['platforms'] if pid not in plats]
    result = {
        'verdicts': {**base['VERDICT'], 'indirect': 'Indirectly'},
        'asOf': cfg.get('asOf'),                     # when the answers were last checked (the hero's "Updated")
        'groups': [],
        'items': [],
        'platforms': [{'id': pid, 'name': cfg.get('names', {}).get(pid, plats[pid]['name']), 'profile': profiles.get(pid)} for pid in public],
        'answers': {pid: {} for pid in public},
    }
    # Table sections and rows in order. A row with "playbook" (its Playbook section, "content" or
    # "tech") takes its answers from Playbook; any other row is public-only, with its answers in
    # the picker table (answers per platform: { row id: [verdict, mark, scope] }).
    for sec in cfg['sections']:
        result['groups'].append({k: sec[k] for k in ('id', 'title') if k in sec})
        for i in sec['items']:
            result['items'].append({'id': i['id'], 'label': i['label'], 'group': sec['id']})
            for pid in public:
                if 'playbook' in i:
                    result['answers'][pid][i['id']] = cell(pid, i['playbook'], i['id'])
                else:
                    a = own.get(pid, {}).get(i['id'])
                    if not a:
                        missing.append(f'{pid}/{i["id"]}')
                        a = ['check', '', 'C']
                    v, m, s = a
                    result['answers'][pid][i['id']] = {'verdict': v, 'mark': m, 'scope': s}
    if missing:
        print('  no answer yet (shown as "Check"): ' + ', '.join(missing))
    out = json.dumps(result, ensure_ascii=False, separators=(',', ':'))
    if PUBLIC.exists() and PUBLIC.read_text(encoding='utf-8') == out:
        print(f'published: no changes ({len(public)} platforms, {len(result["items"])} items)')
    else:
        PUBLIC.parent.mkdir(parents=True, exist_ok=True)
        PUBLIC.write_text(out, encoding='utf-8')
        print(f'published: {PUBLIC} ({len(public)} platforms, {len(result["items"])} items, {len(edits)} admin edits applied)')
    if skipped:
        print('  not in the Playbook data yet, left out: ' + ', '.join(skipped))
    prerender()


def picker_seed():
    """One time: move the profiles and the CMS Picker's own answers from cms-picker.json into the
    picker table, then remove them from the file so there's only one copy."""
    cfg = json.loads(CONFIG.read_text(encoding='utf-8'))
    if 'profiles' not in cfg:
        sys.exit('Already seeded: cms-picker.json has no profiles left. Edit them on jsal.io/ic as an admin.')
    if table('picker', 'select=platform') is None:
        sys.exit('The picker table doesn\'t exist yet: run private/picker.sql in Supabase → SQL Editor first.')
    rows = [{'platform': pid, 'profile': cfg['profiles'].get(pid, {}),
             'answers': {k: v for sec in cfg['sections'] for k, v in sec.get('answers', {}).get(pid, {}).items()}}
            for pid in cfg['platforms']]
    backup()
    api('POST', 'picker', rows, prefer='resolution=merge-duplicates,return=minimal')
    cfg.pop('profiles')
    for sec in cfg['sections']:
        sec.pop('answers', None)
    CONFIG.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'seeded: {len(rows)} platforms into the picker table; removed them from {CONFIG.name}.')


# ── Pre-render: a plain-HTML copy of the CMS Picker's content, written into its index.html ──
# app.js draws the cards, table and hero preview from data.json. Crawlers that don't run JavaScript
# (most AI search bots) would see only "Loading…", so publish also writes the same content as HTML
# between <!-- prerender:NAME --> markers. app.js replaces it on load; visitors see no difference.
# Keep the markup in step with renderCards(), render() and the hero code in site/cms-picker/app.js.
SHORT = {'yes': 'Built in', 'auto': 'Automatic', 'plugin': 'Plugin/app', 'code': 'Code', 'hosting': 'Hosting/DNS',
         'check': 'Check', 'indirect': 'Indirectly', 'no': 'Not possible'}
SCOPE = {'V': 'varies', 'C': 'not verified'}   # only the exceptions are marked
LOGOS = {'wordpress', 'shopify', 'wix', 'squarespace', 'webflow', 'framer', 'hubspot', 'bigcommerce', 'drupal', 'ghost'}
BADGE = {'magento': 'M', 'duda': 'D', 'headless': '{ }'}
DEFAULT_COMPARE = ['wordpress', 'shopify', 'wix', 'squarespace']
PEEK_PLATS = ['wordpress', 'shopify', 'wix']
PEEK_ROWS = [('blog', 'Run a blog'), ('store', 'Sell online'), ('gsc404', '301 redirects'), ('templates', 'Edit templates')]
PEEK_SHORT = {**SHORT, 'plugin': 'Plugin', 'no': 'No'}
GENERIC = re.compile(r'^(yes|no|check|automatic|built in)$|^yes, with (an? )?(seo |redirect )?(plugin|module|extension|app|custom code)$', re.I)


def prerender():
    e = lambda t: html.escape(str(t), quote=True)
    d = json.loads(PUBLIC.read_text(encoding='utf-8'))
    plats = d['platforms']

    def logo(p):
        if p['id'] in LOGOS:
            return f'<span class="logo" style="--logo: url(&quot;logos/{p["id"]}.svg&quot;)" aria-hidden="true"></span>'
        return f'<span class="logo badge" aria-hidden="true">{e(BADGE.get(p["id"], p["name"][0]))}</span>'

    cards = []
    for p in plats:
        pr = p.get('profile')
        if not pr:
            continue
        c = [f'<article class="card"><div class="ctop">{logo(p)}<h3>{e(p["name"])}</h3></div>',
             f'<p class="ptype">{e(pr["type"])}</p>']
        if pr.get('summary'):
            c.append(f'<p class="summary">{e(pr["summary"])}</p>')
        if pr.get('tags'):
            c.append('<div class="ktags" role="group" aria-label="Known for">' + ''.join(f'<span class="ktag">{e(t)}</span>' for t in pr['tags']) + '</div>')
        if pr.get('aiTags'):
            c.append('<div class="aitags"><span class="ailabel">AI</span>' + ''.join(f'<span class="aitag">{e(t)}</span>' for t in pr['aiTags']) + '</div>')
        facts = (('Hosting and updates', pr.get('hosting'), 'r-host'), ('If you leave', pr.get('export'), 'r-exit'), ('Not ideal if', pr.get('lessSuited'), 'r-skip'))
        run = ''.join(f'<div class="{cls}"><dt>{t}</dt><dd>' + ''.join(f'<span>{e(x)}</span>' for x in ([v] if isinstance(v, str) else v)) + '</dd></div>'
                      for t, v, cls in facts if v)
        if run:
            c.append(f'<dl class="run">{run}</dl>')
        on = p['id'] in DEFAULT_COMPARE
        c.append(f'<div class="cfoot"><button class="chip cmp" type="button" aria-pressed="{str(on).lower()}">'
                 f'{"✓ Comparing" if on else "+ Add to compare"}</button></div></article>')
        cards.append(''.join(c))

    # The table: every platform (the live page starts with four), with notes, so nothing is left out
    rows = ['<div class="row head"><div class="item">Can you…</div>' + ''.join(
        f'<div class="hcell"><span class="pname">{e(p["name"])}</span>'
        + (f'<span class="htype">{e(p["profile"]["type"])}</span>' if p.get('profile') else '') + '</div>' for p in plats) + '</div>']
    groups = {g['id']: g for g in d.get('groups', [])}
    last = None
    for it in d['items']:
        if it['group'] != last and it['group'] in groups:
            g = groups[it['group']]
            rows.append(f'<div class="row group"><span>{e(g["title"])}</span></div>')
        last = it['group']
        cells = []
        for p in plats:
            a = d['answers'][p['id']][it['id']]
            word = SCOPE.get(a['scope'])
            line = f'<span class="tag {e(a["verdict"])}">{e(SHORT.get(a["verdict"], a["verdict"]))}</span>'
            if word:
                line += f'<span class="sc">{word}</span>'
            mark = f'<span class="mark">{e(a["mark"])}</span>' if a.get('mark') and not GENERIC.match(a['mark'].strip()) else ''
            cells.append(f'<div class="cell"><span class="plat">{e(p["name"])}</span><span class="line">{line}</span>{mark}</div>')
        rows.append(f'<div class="row"><div class="item">{e(it["label"])}</div>{"".join(cells)}</div>')

    names = {p['id']: p['name'] for p in plats}
    pp = [i for i in PEEK_PLATS if i in d['answers']]
    pr_rows = [(i, l) for i, l in PEEK_ROWS if any(x['id'] == i for x in d['items'])]
    peek = ['<div role="row"><span role="columnheader"></span>' + ''.join(f'<span role="columnheader">{e(names[i])}</span>' for i in pp) + '</div>']
    for iid, label in pr_rows:
        peek.append(f'<div role="row"><span role="rowheader">{label}</span>' + ''.join(
            f'<span role="cell"><span class="tag {d["answers"][i][iid]["verdict"]}">{e(PEEK_SHORT.get(d["answers"][i][iid]["verdict"], ""))}</span></span>' for i in pp) + '</div>')

    page_p = SITE / 'cms-picker' / 'index.html'
    s = before = page_p.read_text(encoding='utf-8')
    as_of = d.get('asOf')
    # Its own .grid sized for every platform (the outer one is sized by app.js for the ones it shows)
    grid = f'<div class="grid" style="--n: {len(plats)}">' + '\n'.join(rows) + '</div>'
    parts = {'cards': '\n'.join(cards), 'grid': grid, 'peek': ''.join(peek),
             'count': str(len(plats)), 'asof': e(as_of or ''),
             'peek-cap': f'{len(pr_rows)} of {len(d["items"])} rows, from the full table below'}
    for name, body in parts.items():
        start, end = f'<!-- prerender:{name} -->', f'<!-- /prerender:{name} -->'
        n = s.count(start)
        if not n:
            sys.exit(f'prerender: marker {start} not found in {page_p}')
        out, i = [], 0
        while (a := s.find(start, i)) != -1:      # every copy (the platform count appears twice)
            b = s.index(end, a)
            out.append(s[i:a + len(start)] + body)
            i = b
        s = ''.join(out) + s[i:]
    if s == before:
        print('prerendered: no changes')
        return
    # The content changed today: say so in the page's structured data and in the sitemap
    today = datetime.date.today().isoformat()
    s = re.sub(r'"dateModified": "[\d-]+"', f'"dateModified": "{today}"', s)
    page_p.write_text(s, encoding='utf-8')
    sm = SITE / 'sitemap.xml'
    sm.write_text(re.sub(r'(<loc>https://jsal\.io/cms-picker/</loc><lastmod>)[\d-]+', rf'\g<1>{today}', sm.read_text(encoding='utf-8')), encoding='utf-8')
    print(f'prerendered: {page_p} ({len(cards)} cards, {len(d["items"])} rows × {len(plats)} platforms)')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'prerender':
        prerender()
        sys.exit()
    if cmd not in ('backup', 'pull', 'push', 'publish', 'picker-seed'):
        sys.exit('Usage: python playbook.py backup | pull | push | publish [--from-backup <file>] [--extra <file>] | prerender | picker-seed')
    flag = lambda name: sys.argv[sys.argv.index(name) + 1] if name in sys.argv[2:-1] else None
    if cmd == 'publish' and flag('--from-backup'):
        publish(flag('--from-backup'), flag('--extra'))
        sys.exit()
    if not KEY:
        sys.exit('Set the service_role key first (in this terminal only):\n'
                 '  $env:SUPABASE_SERVICE_ROLE_KEY = "<key from Supabase → Project Settings → API>"')
    publish(None, flag('--extra')) if cmd == 'publish' else {'backup': backup, 'pull': pull, 'push': push, 'picker-seed': picker_seed}[cmd]()
