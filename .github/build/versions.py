# Per-file cache numbers. Every link to one of the site's own CSS or JS files, to /favicon.svg and to the
# CMS Picker's quiz.json carries ?v=<hash>: the first 8 hex characters of the SHA-256 of that file's contents
# (line endings as LF, so Windows and GitHub agree). A changed file gets a new hash, and only the references
# to that file are rewritten, wherever they are: every page, the apps' module imports ("./state.js?v=…"),
# the importmaps and the publish template for the platform pages.
#   python -I versions.py           rewrite stale references (bump-version.ps1 runs this)
#   python -I versions.py --check   list stale references and exit 1 if there are any (check.py imports this)
import hashlib, os, pathlib, re, sys

SITE = pathlib.Path(__file__).resolve().parents[2]   # site\.github\build\versions.py -> site\
TEMPLATE = SITE / '.github' / 'scripts' / 'platform-page.html'   # served as cms-picker/<platform>/index.html
SKIP = {'vendor', 'node_modules', '.github', '.git'}

# What counts as a reference: a quoted path ending in .css or .js, or favicon.svg, followed by ?v=…
REF = re.compile(r'(?P<path>[\w./-]+(?:\.css|\.js|favicon\.svg))\?v=(?P<v>[\w.-]+)(?=["\'])')
# Attributes that version a file without linking it (app.js fetches quiz.json with the page's data-quiz-v)
ATTR = {'data-quiz-v': 'quiz.json'}
ATTR_RE = re.compile(r'(?P<attr>' + '|'.join(map(re.escape, ATTR)) + r')="(?P<v>[\w.-]*)"')


def hash_of(path):
    return hashlib.sha256(path.read_bytes().replace(b'\r\n', b'\n')).hexdigest()[:8]


def served_dir(f):
    """The folder a file is served from (the template is served from a platform's folder)."""
    return SITE / 'cms-picker' / 'x' if f == TEMPLATE else f.parent


def target(f, ref):
    """The site file a reference in f points at, or None if it isn't one of ours (vendor files, CDN)."""
    if '://' in ref or ref.startswith('//') or '/vendor/' in ref or ref.startswith('vendor/'): return None
    p = (SITE / ref.lstrip('/')) if ref.startswith('/') else (served_dir(f) / ref)
    try: p = p.resolve()
    except OSError: return None
    return p if p.is_file() and SITE in p.parents else None


def sources():
    """Every file that may carry references: the pages, the site's JS and the publish template."""
    out = []
    for root, dirs, names in os.walk(SITE):
        dirs[:] = sorted(d for d in dirs if d not in SKIP)
        out += [pathlib.Path(root, n) for n in sorted(names) if n.endswith(('.html', '.js'))]
    return out + [TEMPLATE]


def scan(f, text):
    """Yields (span of the hash, path as written, target file) for every reference in a file."""
    for m in REF.finditer(text):
        t = target(f, m.group('path'))
        if t: yield m.span('v'), m.group('path'), t
    for m in ATTR_RE.finditer(text):
        t = target(f, ATTR[m.group('attr')])
        if t: yield m.span('v'), ATTR[m.group('attr')], t


def stale():
    """[(file, path as written, hash written, right hash)] for every reference whose hash is out of date."""
    out, hashes = [], {}
    for f in sources():
        text = f.read_text(encoding='utf-8')
        for (a, b), shown, t in scan(f, text):
            h = hashes.setdefault(t, hash_of(t))
            if text[a:b] != h: out.append((f, shown, text[a:b], h))
    return out


def bump():
    """Rewrites stale references until none are left (a module's hash changes when the hashes of its own
    imports do, so a change deep in an app ripples up to the page in a few passes). Returns the files changed."""
    changed = set()
    for _ in range(10):
        hashes, dirty = {}, False
        for f in sources():
            text = f.read_text(encoding='utf-8')
            edits = [(span, hashes.setdefault(t, hash_of(t))) for span, _, t in scan(f, text)]
            edits = [((a, b), h) for (a, b), h in edits if text[a:b] != h]
            if not edits: continue
            for (a, b), h in sorted(edits, reverse=True): text = text[:a] + h + text[b:]
            f.write_bytes(text.encode('utf-8'))   # write_bytes keeps the file's own line endings
            changed.add(f); dirty = True
        if not dirty: return sorted(changed)
    sys.exit('Stopped: the references never settle (do two modules import each other?)')


if __name__ == '__main__':
    if '--check' in sys.argv:
        bad = stale()
        for f, shown, v, h in bad: print(f'{f.relative_to(SITE)}: {shown}?v={v} should be {h}')
        sys.exit(1 if bad else 0)
    changed = bump()
    for f in changed: print(f'  {f.relative_to(SITE)}')
    print(f'{len(changed)} file(s) updated' if changed else 'Every reference is up to date.')
