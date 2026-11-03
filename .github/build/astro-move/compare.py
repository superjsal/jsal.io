# The per-page test of the Astro move (.github/docs/astro-move.md): a page as staging has it in site/ against its
# build in dist/. The <head> is compared as a set of tags (order may differ), the body as text with whitespace
# collapsed. Build first (npm run build). Delete this folder when the move ships.
#   python -I .github\build\astro-move\compare.py privacy/index.html [more pages]
# Differences it allows, each the same page to the browser:
#  - head order and whitespace; <meta ... /> against <meta ...>; initial-scale=1.0 against 1
#  - an SVG shape's <path .../> written as <path ...></path> (how Astro writes them)
#  - /nav.js in the head instead of at the end of the body (deferred, it runs at the same moment)
#  - the home page's updates:start/updates:end and the CMS Picker's prerender: marker comments, gone now the build
#    writes what sat between them
#  - a comment above <html> moved into the head; the ?v= numbers themselves (check.py holds each to its file's hash,
#    and the layout adds one where a page had none)
#  - tags the layout adds on purpose (ADDED): every share card states its image's size (all are 1200 by 628), every
#    page has the home-screen icon, and the layout's note on the shell.css link
#  - the tools' notes on lines the layout now writes for them (DROPPED), charset in capitals, and the line breaks
#    inside an inline script (the tools wrote the theme script over five lines, the layout on one)
DROPPED = {'<!-- Apply the saved light/dark choice (shared by all jsal.io apps) before first paint -->',
           '<!-- Each ?v= is that file\'s content hash, so browsers fetch fresh files after an update -->',
           '<!-- jsal.io app switcher (shared by all the apps); first, so the logo menu works before the app\'s modules have loaded -->',
           '<!-- jsal.io app switcher (shared by all the apps); first, so the logo menu works before the app\'s own scripts have run -->',
           # the platform pages' template: how the publish knew its own pages, and its notes on the layout's lines
           '<!-- generated from a template by the publish: edits to this page are overwritten -->',
           '<meta name="generator" content="jsal.io publish">',
           '<!-- The shared styles (each ?v= is its file\'s content hash) -->',
           '<!-- jsal.io app switcher (shared by all the apps) -->'}
import pathlib, re, subprocess, sys
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parents[3]
SVG = r'path|circle|rect|line|polyline|polygon|ellipse|use|stop'
ADDED = {'<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="628">',
         '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
         '<!-- Colours and top bar: shared styles in /shell.css -->'}


def norm(s):
    s = re.sub(rf'<({SVG})\b([^<>]*?)\s*/>', r'<\1\2></\1>', s)
    s = re.sub(r'\s*/>', '>', s)
    s = s.replace('initial-scale=1.0', 'initial-scale=1').replace('charset="UTF-8"', 'charset="utf-8"')
    s = re.sub(r'(<script\b[^>]*>)\s+|\s+(</script>)', r'\1\2', s)
    s = re.sub(r'\?v=[\w.-]+(?=")', '', s)
    return re.sub(r'\s+', ' ', s).strip()


def split(t):
    head = t[:t.index('<head>')] + t[t.index('<head>') + 6:t.index('</head>')]
    head = re.sub(r'<!doctype html>|<html[^>]*>', '', head, flags=re.I)
    body = t[t.index('</head>') + 7:]
    tags = re.findall(r'<!--.*?-->|<script\b.*?</script>|<style\b.*?</style>|<[^>]+>', head, re.S)
    for n in re.findall(r'<script src="/nav\.js[^"]*" defer></script>', body):
        body = body.replace(n, '')
        tags.append(n)
    return Counter(norm(x) for x in tags), norm(body)


def compare(rel):
    old = subprocess.run(['git', 'show', f'origin/staging:site/{rel}'], cwd=ROOT, capture_output=True, encoding='utf-8', check=True).stdout
    new = (ROOT / 'dist' / rel).read_text(encoding='utf-8')
    # The markers a script once wrote the home page's Updates and the CMS Picker's plain-HTML copy between; the
    # build makes both itself now
    old = re.sub(r'<!-- updates:(?:start.*?|end) -->|<!-- /?prerender:[\w-]+ -->', '', old, flags=re.S)
    (oh, ob), (nh, nb) = split(old), split(new)
    out = [f'only in staging\'s head: {t[:200]}' for t in (oh - nh) if t not in DROPPED] +[f'only in the build\'s head: {t[:200]}' for t in (nh - oh) if t not in ADDED]
    if ob != nb:
        i = next((i for i, (a, b) in enumerate(zip(ob, nb)) if a != b), min(len(ob), len(nb)))
        out.append(f'body differs at character {i}:\n    staging: {ob[max(0, i - 80):i + 160]}\n    build:   {nb[max(0, i - 80):i + 160]}')
    return out


bad = 0
for rel in sys.argv[1:]:
    diffs = compare(rel)
    bad += len(diffs)
    print(f'{rel}: ' + ('same' if not diffs else f'{len(diffs)} difference(s)'))
    for d in diffs: print('  ' + d)
sys.exit(1 if bad else 0)
