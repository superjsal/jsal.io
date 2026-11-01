# Pre-push checks for the site (the repo root, two folders up). Run via check.ps1 (or: python -I check.py);
# the "Site checks" GitHub Action runs it on every push too. Exits 1 if anything needs fixing.
#  - the top bar is identical on every page (so it never moves between pages)
#  - every ?v= cache number is its file's current content hash (versions.py), and every page links /shell.css
#  - internal links, scripts, styles and images point at files that exist
#  - structured data (JSON-LD) parses
#  - no unused CSS classes, keyframes or variables
#  - branding: no standalone "JSAL"; the WoW art keeps its credit
#  - every sitemap address exists
#  - Updates on the home page is what .github/scripts/updates.py would write from the changelog
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]   # .github\build\check.py -> the project folder
SITE = ROOT / 'site'                                   # what jsal.io serves
BUILD = ROOT / '.github' / 'build'                      # this folder: scripts, node_modules and the share-image templates, not site content
# Every page in site\: each folder's index.html and the 404 page, found the same way as browser-check.mjs, so a new page
# is checked without a list to keep
PAGES = sorted(str(p.relative_to(SITE)).replace('\\', '/') for p in SITE.rglob('index.html')) + ['404.html']
# CMS Picker platform pages, written by playbook.py publish (cms-picker/<platform>/index.html)
PLATFORM_PAGES = sorted(str(p.relative_to(SITE)).replace('\\', '/') for p in SITE.glob('cms-picker/*/index.html'))
# App code that goes with each page (for the unused-CSS check)
APP_FILES = {
    'formatter/index.html': ['formatter/styles.css', 'formatter/js/*.js'],
    'image-resizer/index.html': ['image-resizer/styles.css', 'image-resizer/js/*.js'],
    'cms-picker/index.html': ['cms-picker/styles.css', 'cms-picker/app.js'],
    'ic/index.html': ['ic/styles.css', 'ic/app.js'],
}
# Class names built from data at runtime, so they never appear literally in the markup
DYNAMIC_CLASSES = {'plugin', 'hosting', 'auto', 'code', 'check', 'no', 'yes', 'U', 'V', 'C'}

problems = []
def fail(msg): problems.append(msg)
def read(rel): return (SITE / rel).read_text(encoding='utf-8')
def files(patterns): return [p for pat in patterns for p in sorted(SITE.glob(pat)) if BUILD not in p.parents]

html = {p: read(p) for p in PAGES}

# Top bar: logo (with caret) and theme button markup must match the home page exactly
def topbar(t):
    brand = re.search(r'data-jsal-nav>(.*?)</a>', t, re.S)
    theme = re.search(r'<button[^>]*data-jsal-theme[^>]*>(.*?)</button>', t, re.S)
    return (brand and brand.group(1).strip(), theme and theme.group(1).strip())
ref = topbar(html['index.html'])
for p, t in html.items():
    b, th = topbar(t)
    if b != ref[0]: fail(f'{p}: logo markup differs from the home page')
    if th != ref[1]: fail(f'{p}: theme button markup differs from the home page')

# Cache numbers: every reference to one of the site's CSS or JS files, the favicon or quiz.json carries that
# file's current content hash, on every page, in the apps' module imports and in the publish template
# (versions.py next to this script is the one place that knows what counts as a reference)
sys.path.insert(0, str(BUILD))
sys.dont_write_bytecode = True   # no __pycache__ folder inside the site repo
import versions
for f, shown, v, h in versions.stale():
    fail(f'{f.relative_to(ROOT)}: {shown}?v={v} is out of date (the file hashes to {h}); run bump-version.ps1')

# Every page links the shared stylesheet with one identical line, in <head> before its own styles
# (so shell.css loses to a page's own rules, as the inline copies used to)
SHELL = f'<link rel="stylesheet" href="/shell.css?v={versions.hash_of(SITE / "shell.css")}">'
for p, t in html.items():
    head = t[:t.find('</head>')]
    i = head.find(SHELL)
    if i < 0 or head.count('/shell.css?') != 1: fail(f'{p}: needs exactly this line in <head>: {SHELL}')
    elif re.search(r'<style[\s>]|<link[^>]*stylesheet', head[:i]): fail(f'{p}: the shell.css link must come before the page\'s own styles')

# Internal references
def exists(base, ref):
    ref = ref.split('#')[0].split('?')[0]
    if not ref: return True
    target = (SITE / ref.lstrip('/')) if ref.startswith('/') else ((SITE / base).parent / ref)
    return target.is_file() or (target / 'index.html').is_file()
for p, t in html.items():
    body = re.sub(r'<script type="importmap">.*?</script>', '', t, flags=re.S)
    for attr, ref in re.findall(r'\b(href|src)="([^"]+)"', body):
        if re.match(r'(https?:|mailto:|data:|#|javascript:|\$)', ref) or '${' in ref: continue   # $1-style replacement patterns in scripts
        if not exists(p, ref): fail(f'{p}: {attr}="{ref}" points at a missing file')
    for ref in re.findall(r'content="https://jsal\.io(/[^"]*)"', t):
        if not exists(p, ref): fail(f'{p}: {ref} (meta tag) points at a missing file')
    for m in re.findall(r'<script type="application/ld\+json">(.*?)</script>', t, re.S):
        try: json.loads(m)
        except ValueError as e: fail(f'{p}: structured data does not parse ({e})')

# GA4: a page with the tag sets the Consent Mode defaults before configuring it (analytics off in the EU,
# EEA, UK and Switzerland until the visitor allows it in the /nav.js card)
for p, t in html.items():
    if 'G-ND4L6CSD8S' in t:
        c, g = t.find("gtag('consent', 'default'"), t.find("gtag('config'")
        if c < 0 or c > g: fail(f"{p}: the GA4 tag needs the Consent Mode defaults before gtag('config'), as on index.html")

# Every page's <head> holds clicks that land before /nav.js runs (the logo, or a page mid-transition) for
# nav.js to replay; without it a fast click after picking an app was lost, or followed the logo's plain link home
EARLY = '<script data-jsal-early>'
home_t = html['index.html']
early_ref = home_t[home_t.find(EARLY):home_t.find('</script>', home_t.find(EARLY)) + 9]
for p, t in html.items():
    i = t.find(early_ref)
    if i < 0 or i > t.find('</head>'): fail(f'{p}: needs the data-jsal-early script in <head>, the same as on index.html')
# /nav.js comes before the page's own deferred and module scripts (they run in page order once it's parsed), or the
# logo menu waits for an app's modules to load (a round trip or two on a first visit)
for p, t in html.items():
    later = [m.group(0) for m in re.finditer(r'<script\b[^>]*\bsrc="[^"]*"[^>]*>', t) if re.search(r'\bdefer\b|type="module"', m.group(0))]
    if later and '/nav.js' not in later[0]: fail(f"{p}: load /nav.js before the page's own deferred and module scripts")

# Page transitions: only shell.css names them. Two elements with one name make the browser drop the transition
# silently (it happened once, through a class that shell.css named)
for f in files(['**/*.html', '**/*.css', '**/*.js']):
    if f.name == 'shell.css' or 'vendor' in f.parts: continue
    if re.search(r'view-transition-name|viewTransitionName', f.read_text(encoding='utf-8')):
        fail(f'{f.relative_to(SITE)}: sets a view-transition name; only shell.css names page transitions')

# Unused CSS
def strip(c): return re.sub(r'/\*.*?\*/', '', c, flags=re.S)
everything = '\n'.join(p.read_text(encoding='utf-8') for p in files(['**/*.html', '**/*.css', '**/*.js']) if 'vendor' not in p.parts)
def css_check(name, css, usage):
    css = strip(css)
    classes = set(re.findall(r'\.(-?[a-zA-Z_][\w-]*)', re.sub(r'url\([^)]*\)|\d+\.\d+', '', css)))
    for c in sorted(classes - DYNAMIC_CLASSES):
        if not re.search(r'(?<![\w-])' + re.escape(c) + r'(?![\w-])', usage): fail(f'{name}: CSS class .{c} is never used')
    for k in sorted(set(re.findall(r'@keyframes\s+([\w-]+)', css))):
        if len(re.findall(r'(?<![\w-])' + re.escape(k) + r'(?![\w-])', css + usage)) < 2: fail(f'{name}: @keyframes {k} is never used')
    for v in sorted(set(re.findall(r'(--[\w-]+)\s*:', css))):
        if f'var({v}' not in everything and f'"{v}"' not in everything: fail(f'{name}: CSS variable {v} is never read')
shared_usage = read('nav.js')
css_check('shell.css', read('shell.css'), everything)
for p, t in html.items():
    css = '\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', t, re.S))   # the page's own styles (shell.css is checked above)
    extra = files(APP_FILES.get(p, []))
    css += '\n'.join(f.read_text(encoding='utf-8') for f in extra if f.suffix == '.css')
    usage = re.sub(r'<style[^>]*>.*?</style>', '', t, flags=re.S) + shared_usage + '\n'.join(f.read_text(encoding='utf-8') for f in extra if f.suffix == '.js')
    css_check(p, css, usage)
# The platform pages share platform.css, and not every page uses every class (Sanity has no menu paths)
if PLATFORM_PAGES:
    css_check('cms-picker/platform.css', read('cms-picker/platform.css'), '\n'.join(html[p] for p in PLATFORM_PAGES))

# Branding and the WoW art credit
for f in files(['**/*.html', '**/*.js', 'llms.txt']):
    if 'vendor' in f.parts: continue
    for line_no, line in enumerate(f.read_text(encoding='utf-8').splitlines(), 1):
        if re.search(r'(?<![\w/.\\-])JSAL(?![\w.-])', line):
            fail(f'{f.relative_to(SITE)}:{line_no}: standalone "JSAL" (brand as jsal.io or John Salvador)')
for p, t in html.items():
    if 'wow-forever' in t and 'Art © Blizzard Entertainment' not in t:
        fail(f'{p}: the WoW Forever art is missing its "Art © Blizzard Entertainment" credit')

# Served comments explain the page to a reader of its source (CLAUDE.md): never tooling, scripts or folders outside
# site/, people, dates of decisions or TODOs. The marker comments the scripts look for are exempt by their prefix.
COMMENT_BAN = re.compile(r'\.ps1\b|\.py\b|\.mjs\b|\.github|build\\|bump-version|playbook\.py|check\.py|updates\.py|\bTODO\b|\bFIXME\b|\bClaude\b|agreed with|\bJohn\b|\b20\d\d-\d\d-\d\d\b')
COMMENT_OK = ('prerender:', '/prerender:', 'updates:', 'style: allow')
def comments(text, suffix):
    if suffix == '.html':
        yield from ((m.start(), m.group(1)) for m in re.finditer(r'<!--(.*?)-->', text, re.S))
        inner = re.findall(r'<(?:style|script)[^>]*>(.*?)</(?:style|script)>', text, re.S)
        for block in inner:
            at = text.find(block)
            yield from ((at + s, c) for s, c in comments(block, '.css' if block.lstrip().startswith(('/*', ':root', 'html', '@')) else '.js'))
        return
    yield from ((m.start(), m.group(1)) for m in re.finditer(r'/\*(.*?)\*/', text, re.S))
    if suffix == '.js':
        yield from ((m.start(), m.group(1)) for m in re.finditer(r'(?:^|(?<=\s))//(.*)$', text, re.M))
for f in files(['**/*.html', '**/*.css', '**/*.js']):
    if 'vendor' in f.parts: continue
    text = f.read_text(encoding='utf-8')
    for at, c in comments(text, f.suffix):
        if c.strip().startswith(COMMENT_OK): continue
        m = COMMENT_BAN.search(c)
        if m: fail(f'{f.relative_to(SITE)}:{text.count(chr(10), 0, at) + 1}: served comment names "{m.group(0)}" (explain the page, not the tooling; see CLAUDE.md)')

# The apps' modules import each other with the imported file's cache number (checked above); an import
# without one would load a second, uncached copy of the module
for f in files(['*/js/*.js']):
    for line_no, line in enumerate(f.read_text(encoding='utf-8').splitlines(), 1):
        for spec in re.findall(r'from\s+"(\./[^"]+)"', line):
            if '?v=' not in spec:
                fail(f'{f.relative_to(SITE)}:{line_no}: import "{spec}" needs ?v=<hash>; add ?v=0 and run bump-version.ps1')

# Style rules, so the apps keep looking like one site (shared values are in shell.css). A deliberate
# exception carries a "style: allow (reason)" comment on the same line.
#  - colours come from --jsal-* tokens: none written out, except see-through black or white
#    (shadows, overlays on images); defining a custom property (--name: #...) is fine
#  - no page-wide second names for the tokens (:root { --accent: var(--jsal-accent) }); a component's
#    own variable that tiles or states change is fine
#  - a selected state (pressed toggle, current tab) uses the --jsal-selected-* tokens
#  - hover uses no gold (--jsal-accent / --jsal-fill): it's a neutral border or tint (--jsal-hover-line, --jsal-sunk)
#  - button and chip corners from the scale: 4px, 6px, 8px, 999px (or a variable)
#  - every corner from a --jsal-radius-* token (or 0, 50%, inherit)
#  - font weights 400, 500, 600, 700 or 800
#  - font sizes in px from the type scale (TEXT_SIZES)
#  - a stylesheet with animation has a prefers-reduced-motion fallback
def stylesheets():
    """(name, css text, line number of its first line) for shell.css, each app's CSS and each page's own <style>."""
    out = [('shell.css', read('shell.css'), 1)]
    out += [(str(f.relative_to(SITE)), f.read_text(encoding='utf-8'), 1) for f in files(['*/styles.css', 'cms-picker/platform.css'])]
    for p, t in html.items():
        for m in re.finditer(r'<style[^>]*>(.*?)</style>', t, re.S):
            out.append((p, m.group(1), t.count('\n', 0, m.start(1)) + 1))
    return out
NEUTRAL = re.compile(r'rgba?\(\s*(0[ ,]+0[ ,]+0|255[ ,]+255[ ,]+255)\s*(/|,)\s*[\d.]+\s*\)')
COLOUR = re.compile(r'#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?)\(')
RADII = {'0', '50%', '999px', '4px', '6px', '8px', 'inherit'}
TEXT_SIZES = {12, 13, 14, 15, 17, 20, 24, 30, 40, 46}   # the type scale in design-rules.md
for name, css, first in stylesheets():
    lines = css.splitlines()
    plain_css = re.sub(r'/\*.*?\*/', lambda m: re.sub(r'[^\n]', ' ', m.group(0)), css, flags=re.S)   # comments out, line numbers kept
    if re.search(r'@keyframes|animation:', plain_css) and 'prefers-reduced-motion' not in plain_css:
        fail(f'{name}: has animation but no prefers-reduced-motion fallback')
    for rule in re.finditer(r'([^{}]+)\{([^{}]*)\}', plain_css):
        sel = ' '.join(rule.group(1).split())
        if sel.startswith('@font-face'): continue
        for d in re.finditer(r'([\w-]+)\s*:\s*([^;]+)', rule.group(2)):
            prop, val = d.group(1).lower(), d.group(2).strip()
            n = plain_css.count('\n', 0, rule.start(2) + d.start())
            where = f'{name}:{first + n}'
            if prop.startswith('--') and sel == ':root' and name != 'shell.css' and re.fullmatch(r'var\(--jsal-[\w-]+\)', val) and 'style: allow' not in lines[n]:
                fail(f'{where}: {prop} is only another name for {val[4:-1]}; use that directly')
            if 'style: allow' in lines[n] or prop.startswith('--'): continue
            if COLOUR.search(NEUTRAL.sub('', val)):
                fail(f'{where}: written-out colour in "{prop}: {val[:60]}" (use a --jsal-* token)')
            if prop in ('background', 'background-color') and re.search(r'aria-(pressed|selected)="true"|-btn\.active', sel) and '::' not in sel and '--jsal-selected' not in val:
                fail(f'{where}: selected state "{sel[:50]}" should use the --jsal-selected-* tokens')
            if ':hover' in sel and re.search(r'var\(--jsal-(accent|fill)', val) and prop != 'outline':
                fail(f'{where}: gold on hover in "{sel[:50]}" (hover is neutral: --jsal-hover-line or --jsal-sunk; gold means selected, focused or the main action)')
            if prop == 'border-radius' and re.search(r'\bbtn\b|button|\.chip\b', sel):
                odd = [v for v in val.split() if v not in RADII and not v.startswith('var(')]
                if odd: fail(f'{where}: button corner {" ".join(odd)} on "{sel[:50]}" (use 4px, 6px, 8px or 999px)')
            if re.fullmatch(r'border(-[a-z]+)*-radius', prop):
                odd = [v for v in re.sub(r'var\([^)]*\)', '', val).split() if v not in ('0', '50%', 'inherit')]
                if odd: fail(f'{where}: corner {" ".join(odd)} on "{sel[:50]}" (use a --jsal-radius-* token)')
            weights = re.findall(r'^(\d{3})\b', val) if prop == 'font' else ([val] if prop == 'font-weight' else [])
            for w in weights:
                if w.isdigit() and w not in ('400', '500', '600', '700', '800'):
                    fail(f'{where}: font weight {w} (use 400, 500, 600, 700 or 800)')
            if prop in ('font', 'font-size'):
                for s in re.findall(r'\b(\d+\.\d+)px', val):
                    fail(f'{where}: font size {s}px (whole pixels only: 12, 13, 14, 15, 17…)')
                size = re.sub(r'/\s*[\d.]+[a-z%]*', '', val) if prop == 'font' else val   # line heights out
                for s in re.findall(r'(?<![\d.])(\d+)px', size):
                    if int(s) not in TEXT_SIZES:
                        fail(f'{where}: font size {s}px is off the scale ({", ".join(map(str, sorted(TEXT_SIZES)))})')

# CMS Picker data fits cms-picker.schema.json (the same check runs before every publish, and on GitHub)
sys.path.insert(0, str(ROOT / '.github' / 'scripts'))
import check_data
picker_data = json.loads(read('cms-picker/data.json'))
for e in check_data.problems(picker_data): fail(f'cms-picker/data.json: {e}')

# Updates on the home page matches the changelog's data-short lines (updates.py writes it; this only compares)
import updates
for e in updates.problems(): fail(e)
for w in updates.warnings(): print('Note: ' + w)

# CMS Picker persona tests: example people still get the agreed Find my fit results (needs Node)
import shutil, subprocess
if shutil.which('node'):
    run = subprocess.run(['node', str(ROOT / '.github' / 'scripts' / 'personas.test.js')], capture_output=True, text=True, encoding='utf-8')
    if run.returncode:
        fail('CMS Picker persona tests:\n      ' + '\n      '.join(l for l in run.stdout.splitlines() if l.startswith('FAIL')) + (run.stderr.strip() and '\n      ' + run.stderr.strip()))
    # Expert cases: how often the quiz agrees with a consultant's picks, a report that never fails (only a crash does)
    run = subprocess.run(['node', str(ROOT / '.github' / 'scripts' / 'expert-cases.js')], capture_output=True, text=True, encoding='utf-8')
    if run.returncode: fail('CMS Picker expert cases didn\'t run: ' + run.stderr.strip())
    else: print('Note: ' + run.stdout.strip().replace('\n', '\n      '))
else:
    print('Note: Node isn\'t installed, so the CMS Picker persona tests were skipped.')

# Sitemap
for loc in re.findall(r'<loc>https://jsal\.io(/[^<]*)</loc>', read('sitemap.xml')):
    if not exists('index.html', loc): fail(f'sitemap.xml: {loc} does not exist')

if problems:
    print(f'{len(problems)} thing(s) to fix:')
    for p in problems: print('  - ' + p)
    sys.exit(1)
print(f'All checks passed ({len(PAGES)} pages, every cache number current).')
print(check_data.report(picker_data) + '  (details: python .github\\scripts\\check_data.py --list)')
