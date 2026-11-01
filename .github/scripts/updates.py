# Updates on the home page, written from the changelog so a change is described once.
# A changelog entry meant to lead its section on the home page carries a short line on its <li>:
#   <li data-short="Saves PNG, with transparency"><span class="log-name">...
# This script takes, for each section (in SECTIONS order), the newest entry with a data-short and
# its date, and rewrites the <ul class="upd"> block between the two marker comments in index.html.
#   python .github/scripts/updates.py            rewrite the block (run after editing the changelog)
#   python .github/scripts/updates.py --check    only say whether it's current (check.py does this)
# Each line should fit on one row at 1024px and up: about 40 characters, a warning past that.
import html, pathlib, re, sys

SITE = pathlib.Path(__file__).resolve().parents[2] / 'site'   # .github\scripts\updates.py -> site\
CHANGELOG = 'changelog/index.html'
HOME = 'index.html'
START = '<!-- updates:start'   # the whole comment: <!-- updates:start (written by ...) -->
END = '<!-- updates:end -->'
MAX_CHARS = 40
# Home page sections in order: the changelog tag (the log-name text) and the link, or None for no link
SECTIONS = [('CMS Picker', '/cms-picker/'), ('Clean Paste', '/formatter/'), ('Image Resizer', '/image-resizer/'),
            ('Mostly Warcraft', '/play/'), ('Site', None)]
MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


def read(rel):   # newline='' keeps the file's own line endings (open(), not read_text: that argument needs Python 3.13)
    with open(SITE / rel, encoding='utf-8', newline='') as f: return f.read()


def entries():
    """Every changelog <li> with a data-short, as (tag, date, short), newest first."""
    out, date = [], None
    for line in read(CHANGELOG).splitlines():
        h = re.search(r'<h2>\s*<time datetime="(\d{4}-\d\d-\d\d)"', line)
        if h: date = h.group(1)
        li = re.search(r'<li\b([^>]*)>', line)
        if not li: continue
        short = re.search(r'\bdata-short="([^"]*)"', li.group(1))
        if not short: continue
        tag = re.search(r'<span class="log-name">(?:<a [^>]*>)?([^<]+)', line)
        out.append((tag.group(1).strip() if tag else '?', date, short.group(1)))
    return sorted(out, key=lambda e: e[1] or '', reverse=True)   # a stable sort: file order breaks ties


def latest():
    """For each section, its newest entry (or None), in SECTIONS order."""
    found = entries()
    return [(name, href, next((e for e in found if e[0] == name), None)) for name, href in SECTIONS]


def render(nl, indent):
    lines = [indent + '<ul class="upd">']
    for name, href, e in latest():
        if e is None: continue
        label = f'<a href="{href}">{name}</a>' if href else name
        y, m, d = e[1].split('-')
        sec = name.lower().replace(' ', '-')   # styles each line's mark in its app's colour
        lines.append(f'{indent}  <li data-sec="{sec}"><span class="upd-name">{label}</span><span>{e[2]}</span>'
                     f'<time datetime="{e[1]}">{MONTHS[int(m) - 1]} {int(d)}</time></li>')
    lines.append(indent + '</ul>')
    return nl.join(lines)


def block():
    """(text before the block, the current block, text after it, newline, indent) of index.html, or None."""
    t = read(HOME)
    a, b = t.find(START), t.find(END)
    if a < 0 or b < 0 or b < a: return None
    a = t.find('>', a) + 1   # the end of the start marker's comment
    nl = '\r\n' if '\r\n' in t else '\n'
    indent = re.search(r'[ \t]*$', t[:b]).group(0)
    return t[:a], t[a:b], t[b:], nl, indent


def problems():
    out = []
    tags = {e[0] for e in entries()}
    for name, _ in SECTIONS:
        if name not in tags: out.append(f'{CHANGELOG}: no entry tagged {name} has a data-short line, so Updates has nothing for that section')
    for tag in sorted(tags - {n for n, _ in SECTIONS}):
        out.append(f'{CHANGELOG}: a data-short on an entry tagged "{tag}", which is not a home page section (add it to SECTIONS in updates.py)')
    for name, date, short in entries():
        if not date: out.append(f'{CHANGELOG}: the {name} entry "{short}" is above the first date heading')
    b = block()
    if b is None: out.append(f'{HOME}: the Updates markers ({START} … --> and {END}) are missing')
    elif b[1].strip() != render(b[3], b[4]).strip() and not out:
        out.append(f'{HOME}: Updates is out of date with the changelog; run python .github/scripts/updates.py')
    return out


def warnings():
    out = []
    for name, _, e in latest():
        if e and len(html.unescape(e[2])) > MAX_CHARS:
            out.append(f'{CHANGELOG}: the {name} line "{e[2]}" is {len(html.unescape(e[2]))} characters; keep Updates lines to about {MAX_CHARS} so each fits one row at 1024px')
    return out


def write():
    b = block()
    if b is None: raise SystemExit(f'{HOME}: the Updates markers are missing')
    before, cur, after, nl, indent = b
    new = nl + render(nl, indent) + nl + indent
    if cur == new: return False
    with open(SITE / HOME, 'w', encoding='utf-8', newline='') as f: f.write(before + new + after)
    return True


if __name__ == '__main__':
    check = '--check' in sys.argv
    errs = problems()
    for w in warnings(): print('Warning: ' + w)
    if check:
        for e in errs: print('  - ' + e)
        print('Updates is current.' if not errs else f'{len(errs)} thing(s) to fix.')
        sys.exit(1 if errs else 0)
    # Writing: only a missing section or a stray tag stops it; being out of date is the point
    hard = [e for e in errs if 'out of date' not in e]
    for e in hard: print('  - ' + e)
    if hard: sys.exit(1)
    print('Updates rewritten.' if write() else 'Updates was already current.')
