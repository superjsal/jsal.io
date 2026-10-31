# Pre-push checks for the site (the repo root, two folders up). Run via check.ps1 (or: python -I check.py);
# the "Site checks" GitHub Action runs it on every push too. Exits 1 if anything needs fixing.
#  - the top bar is identical on every page (so it never moves between pages)
#  - every page uses the same ?v= cache number, and has an up-to-date copy of shell.css
#  - internal links, scripts, styles and images point at files that exist
#  - structured data (JSON-LD) parses
#  - no unused CSS classes, keyframes or variables
#  - branding: no standalone "JSAL"; the WoW art keeps its credit
#  - every sitemap address exists
import json, pathlib, re, sys

SITE = pathlib.Path(__file__).resolve().parents[2]   # site\.github\build\check.py -> site\
BUILD = SITE / '.github' / 'build'                      # this folder: scripts, node_modules and the share-image templates, not site content
PAGES = ['index.html', '404.html', 'formatter/index.html', 'image-resizer/index.html', 'cms-picker/index.html', 'ic/index.html', 'privacy/index.html', 'play/index.html', 'changelog/index.html']
# CMS Picker platform pages, written by playbook.py publish (cms-picker/<platform>/index.html)
PLATFORM_PAGES = sorted(str(p.relative_to(SITE)).replace('\\', '/') for p in SITE.glob('cms-picker/*/index.html'))
PAGES += PLATFORM_PAGES
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

# Cache numbers
# Only the site's CSS and JS; CMS Picker logos carry their own content hash (?v= from playbook.py publish)
vers = {p: set(re.findall(r'\.(?:css|js)\?v=([\w.-]+)', t)) - {'1.6.6'} for p, t in html.items()}   # 1.6.6 = the HEIC library's own version
home_v = re.search(r'nav\.js\?v=([\w-]+)', html['index.html']).group(1)
for p, v in vers.items():
    if v - {home_v}: fail(f'{p}: cache number {", ".join(sorted(v - {home_v}))} (home page uses {home_v}); run bump-version.ps1')

# shell.css is copied into every page by bump-version.ps1 (so it doesn't block the first paint);
# each copy must match it, ignoring comments and whitespace.
def squash(c): return re.sub(r'\s+', '', re.sub(r'/\*.*?\*/', '', c, flags=re.S))
shell = squash(read('shell.css'))
for p, t in html.items():
    if re.search(r'<link[^>]*href="/shell\.css', t): fail(f'{p}: links /shell.css instead of having it copied in; run bump-version.ps1')
    copies = re.findall(r'<style data-jsal-shell>(.*?)</style>', t, re.S)
    if len(copies) != 1: fail(f'{p}: needs one <style data-jsal-shell> copy of shell.css; run bump-version.ps1')
    elif squash(copies[0]) != shell: fail(f'{p}: its copy of shell.css is out of date; run bump-version.ps1')

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

# Page transitions: only shell.css names them. Two elements with one name make the browser drop the transition
# silently (it happened once, through a class that shell.css named)
for f in files(['**/*.html', '**/*.css', '**/*.js']):
    if f.name == 'shell.css' or 'vendor' in f.parts: continue
    own = re.sub(r'<style data-jsal-shell>.*?</style>', '', f.read_text(encoding='utf-8'), flags=re.S)
    if re.search(r'view-transition-name|viewTransitionName', own):
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
    css = '\n'.join(re.findall(r'<style(?![^>]*data-jsal-shell)[^>]*>(.*?)</style>', t, re.S))   # shell.css is checked on its own
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

# The apps' modules import each other with the page's cache number (bump-version.ps1 keeps them in step)
for f in files(['*/js/*.js']):
    for line_no, line in enumerate(f.read_text(encoding='utf-8').splitlines(), 1):
        for spec in re.findall(r'from\s+"(\./[^"]+)"', line):
            if f'?v={home_v}' not in spec:
                fail(f'{f.relative_to(SITE)}:{line_no}: import "{spec}" should end in ?v={home_v}; run bump-version.ps1')

# Style rules, so the apps keep looking like one site (shared values are in shell.css). A deliberate
# exception carries a "style: allow (reason)" comment on the same line.
#  - colours come from --jsal-* tokens: none written out, except see-through black or white
#    (shadows, overlays on images); defining a custom property (--name: #...) is fine
#  - no page-wide second names for the tokens (:root { --accent: var(--jsal-accent) }); a component's
#    own variable that tiles or states change is fine
#  - a selected state (pressed toggle, current tab) uses the --jsal-selected-* tokens
#  - hover uses no gold (--jsal-accent / --jsal-fill): it's a neutral border or tint (--jsal-hover-line, --jsal-sunk)
#  - button and chip corners from the scale: 4px, 6px, 8px, 999px (or a variable)
#  - font weights 400, 500, 600, 700 or 800
#  - a stylesheet with animation has a prefers-reduced-motion fallback
def stylesheets():
    """(name, css text, line number of its first line) for shell.css, each app's CSS and each page's own <style>."""
    out = [('shell.css', read('shell.css'), 1)]
    out += [(str(f.relative_to(SITE)), f.read_text(encoding='utf-8'), 1) for f in files(['*/styles.css', 'cms-picker/platform.css'])]
    for p, t in html.items():
        for m in re.finditer(r'<style(?![^>]*data-jsal-shell)[^>]*>(.*?)</style>', t, re.S):
            out.append((p, m.group(1), t.count('\n', 0, m.start(1)) + 1))
    return out
NEUTRAL = re.compile(r'rgba?\(\s*(0[ ,]+0[ ,]+0|255[ ,]+255[ ,]+255)\s*(/|,)\s*[\d.]+\s*\)')
COLOUR = re.compile(r'#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?)\(')
RADII = {'0', '50%', '999px', '4px', '6px', '8px', 'inherit'}
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
            weights = re.findall(r'^(\d{3})\b', val) if prop == 'font' else ([val] if prop == 'font-weight' else [])
            for w in weights:
                if w.isdigit() and w not in ('400', '500', '600', '700', '800'):
                    fail(f'{where}: font weight {w} (use 400, 500, 600, 700 or 800)')
            if prop in ('font', 'font-size'):
                for s in re.findall(r'\b(\d+\.\d+)px', val):
                    fail(f'{where}: font size {s}px (whole pixels only: 11, 12, 13, 14, 15, 16, 17…)')

# CMS Picker data fits cms-picker.schema.json (the same check runs before every publish, and on GitHub)
sys.path.insert(0, str(SITE / '.github' / 'scripts'))
sys.dont_write_bytecode = True   # no __pycache__ folder inside the site repo
import check_data
picker_data = json.loads(read('cms-picker/data.json'))
for e in check_data.problems(picker_data): fail(f'cms-picker/data.json: {e}')

# CMS Picker persona tests: example people still get the agreed Find my fit results (needs Node)
import shutil, subprocess
if shutil.which('node'):
    run = subprocess.run(['node', str(SITE / '.github' / 'scripts' / 'personas.test.js')], capture_output=True, text=True, encoding='utf-8')
    if run.returncode:
        fail('CMS Picker persona tests:\n      ' + '\n      '.join(l for l in run.stdout.splitlines() if l.startswith('FAIL')) + (run.stderr.strip() and '\n      ' + run.stderr.strip()))
else:
    print('Note: Node isn\'t installed, so the CMS Picker persona tests were skipped.')

# Sitemap
for loc in re.findall(r'<loc>https://jsal\.io(/[^<]*)</loc>', read('sitemap.xml')):
    if not exists('index.html', loc): fail(f'sitemap.xml: {loc} does not exist')

if problems:
    print(f'{len(problems)} thing(s) to fix:')
    for p in problems: print('  - ' + p)
    sys.exit(1)
print(f'All checks passed ({len(PAGES)} pages, cache number {home_v}).')
print(check_data.report(picker_data) + '  (details: python site\\.github\\scripts\\check_data.py --list)')
