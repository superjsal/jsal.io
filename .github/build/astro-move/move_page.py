# Moves a page from site/ to src/pages/ on the shared layout, for the Astro move (.github/docs/astro-move.md).
#   python -I .github\build\astro-move\move_page.py <old path in site/> <new path in src/pages/> "<Page props>"
#   e.g. move_page.py 404.html 404.astro '  title="Page not found | jsal.io"
#     robots="noindex"'
# The page's own <style> blocks, any comment above <html> and its own note on the shell.css link go in the head
# slot; its top bar becomes <TopBar> with whatever the bar held besides the theme button; body scripts become
# is:inline; /nav.js is dropped (the layout loads it); comments directly in the body go out as raw HTML (Astro drops
# a comment that sits directly in a component's slot); braces in body text are escaped, and an attribute holding
# braces becomes a string expression. JSON-LD goes in the head slot too, with a tool's stylesheet, import map
# (importmap() in src/lib/v.mjs), scripts, preconnects and script preloads; every ?v= becomes v(), so it can't go
# stale. A tool's title and the bar's own class go to <TopBar>; a bar with no actions box (the Playbook's) keeps its
# layout with the shared logo and theme button (src/lib/topbar.mjs). The home page's Updates markers become <Updates />.
# Then build, and run compare.py and pagediff.mjs.
import json, pathlib, re, subprocess, sys

old_rel, new_rel, props = sys.argv[1:4]
src = pathlib.Path('site') / old_rel
t = src.read_text(encoding='utf-8')
head = t[t.index('<head>'):t.index('</head>')]
before = t[:t.index('<head>')]

# The page's folder, which its relative references ("styles.css", "js/main.js") are read from
DIR = '/' + old_rel.rsplit('/', 1)[0] + '/' if '/' in old_rel else '/'
VREF = r'="([^"{}]+)\?v=[0-9a-f]{8}"'
uses_v, uses_map = False, False
def versioned(tag):
    """A tag's ?v= references, worked out as the page builds."""
    global uses_v
    def call(m):
        ref = m.group(2)
        return f'{m.group(1)}={{v("{ref}")}}' if ref.startswith('/') else f'{m.group(1)}={{v("{ref}", "{DIR}")}}'
    out = re.sub(r'(\s[\w:-]+)' + VREF, call, tag)
    uses_v |= out != tag
    return out

slot = []
for c in re.findall(r'<!--.*?-->', before, re.S):
    slot.append(c)
# A comment straight above the page's own <style>, other than the layout's notes on its shell.css link, stays with it
for m in re.finditer(r'(?:(<!--(?:(?!-->).)*-->)\n)?\s*<link rel="stylesheet" href="/shell\.css[^"]*">\n', head, re.S):
    if m.group(1) and 'Colours and top bar' not in m.group(1) and 'Each ?v=' not in m.group(1):
        slot.append(m.group(1))
# Structured data, then the page's own styles, stylesheets, import map and scripts, in their order after shell.css
for s in re.findall(r'<script type="application/ld\+json">\n.*?</script>', head, re.S):
    slot.append(s.strip().replace('<script ', '<script is:inline slot="head" ', 1))
# Connections and scripts a page warms up early (the team Playbook's database and its client library)
for s in re.findall(r'<link rel="preconnect"[^>]*>|<link rel="preload" as="script"[^>]*>', head):
    slot.append(re.sub(r'\s*/>$', '>', s).replace('<link ', '<link slot="head" ', 1))
after =head[re.search(r'<link rel="stylesheet" href="/shell\.css[^"]*">', head).end():]
for m in re.finditer(r'<style>\n.*?</style>|<link rel="stylesheet"[^>]*>|<script type="importmap">.*?</script>|<script [^>]*src="[^"]*"[^>]*></script>', after, re.S):
    s = m.group(0)
    if s.startswith('<style>'):
        slot.append(s.replace('<style>', '<style is:inline slot="head">', 1))
    elif s.startswith('<link'):
        slot.append(versioned(re.sub(r'\s*/>$', '>', s)).replace('<link ', '<link slot="head" ', 1))
    elif 'importmap' in s:
        refs = re.findall(r'"\./[^"]+":\s*"([^"]+)"', s)
        refs = [re.sub(r'\?v=[0-9a-f]{8}$', '', r) for r in refs]
        uses_map = True
        slot.append(f'<script is:inline slot="head" type="importmap" set:html={{importmap("{DIR}", {refs!r})}}></script>'.replace("'", '"'))
    elif '/nav.js' not in s:
        slot.append(versioned(s).replace('<script ', '<script is:inline slot="head" ', 1))

body = t[t.index('<body'):t.rindex('</body>')]
body = body[body.index('>') + 2:]
body = re.sub(r'<script src="/nav\.js\?v=\w+" defer></script>\n', '', body)
# The home page's Updates list, which a script used to write between two markers, is built from the changelog
imports = ['import Page from "{depth}layouts/Page.astro";', 'import TopBar from "{depth}components/TopBar.astro";']
if '<!-- updates:start' in body:
    body = re.sub(r'<!-- updates:start.*?<!-- updates:end -->', '<Updates />', body, flags=re.S)
    imports.append('import Updates from "{depth}components/Updates.astro";')

# The bar: a tool's own class on it ("app-header"), its title (TopBar's title slot) and its links. A bar laid out
# without TopBar's actions box (the team Playbook's) stays as it is, with the shared logo and theme button.
own_bar = False
def bar(m):
    global own_bar
    inner = m.group(0)
    if '<div class="jsal-actions">' not in inner:
        own_bar = True
        inner = re.sub(r'<a class="[\w ]*jsal-brand".*?</a>', '<Fragment set:html={BRAND} />', inner, count=1, flags=re.S)
        return re.sub(r'<button type="button" class="jsal-theme".*?</button>', '<Fragment set:html={THEME} />', inner, count=1, flags=re.S)
    extra =re.search(r'<div class="jsal-actions">\n(.*?)\s*<button type="button" class="jsal-theme"', inner, re.S).group(1).strip()
    title = re.search(r'<h1 class="jsal-title">.*?</h1>', inner, re.S)
    if title:
        extra = title.group(0).replace('<h1 ', '<h1 slot="title" ', 1) + ('\n' + extra if extra else '')
    cls = f' class="{m.group(1).strip()}"' if m.group(1) else ''
    indent = re.match(r'\s*', m.group(0)).group(0)
    return f'{indent}<TopBar{cls}>{extra}</TopBar>\n' if extra else f'{indent}<TopBar{cls} />\n'
body = re.sub(r'[ \t]*<header class="([\w -]*?)\s*jsal-top">.*?</header>\n', bar, body, count=1, flags=re.S)
assert own_bar or 'jsal-top">' not in body
if own_bar:
    imports[1] = 'import {{ BRAND, THEME }} from "{depth}lib/topbar.mjs";'

# Astro drops a comment sitting directly in a component's slot (one nested in an element survives), so the body's
# top-level comments go out as raw HTML. Braces in text are escaped ({"{"}), as Astro reads them as code, and each
# tag's ?v= references are worked out as the page builds.
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
def astro_body(html):
    out, depth, i = [], 0, 0
    tok = re.compile(r'<!--.*?-->|<(script|style)\b.*?</\1>|</?([a-zA-Z][\w:-]*)[^>]*?(/?)>', re.S)
    text = lambda s: re.sub(r'[{}]', lambda b: '{"%s"}' % b.group(0), s)
    for m in tok.finditer(html):
        out.append(text(html[i:m.start()])); i = m.end(); s = m.group(0)
        if s.startswith('<!--'):
            out.append(f'<Fragment set:html={{`{s}`}} />' if depth == 0 else s)
            continue
        name = (m.group(2) or '').lower()
        if m.group(1):
            # A script goes out as written (is:inline), its src's ?v= worked out as the page builds
            if m.group(1) == 'script':
                open_tag = s[:s.index('>') + 1]
                tag = versioned(open_tag)
                if 'is:inline' not in tag: tag = tag.replace('<script', '<script is:inline', 1)
                s = tag + s[len(open_tag):]
            out.append(s); continue
        if '<Fragment set:html={' in s: out.append(s); continue
        # An attribute value with braces in it (a form field's pattern) goes out as a string expression
        s = re.sub(r'(\s[\w:-]+)="([^"]*[{}][^"]*)"', lambda a: f'{a.group(1)}={{{json.dumps(a.group(2))}}}', s)
        assert not re.search(r'="[^"]*[{}]', s), f'braces in a tag: {s[:120]}'
        out.append(versioned(s))
        if not name or name in VOID or m.group(3) == '/': continue
        depth += -1 if s.startswith('</') else 1
    out.append(text(html[i:]))
    return ''.join(out)

body = astro_body(body)
if uses_v or uses_map:
    imports.append('import {{ ' + ', '.join(['v'] + (['importmap'] if uses_map else [])) + ' }} from "{depth}lib/v.mjs";')

depth = '../' * (new_rel.count('/') + 1)
# Comments in the head slot need a wrapper: a bare comment can't take slot="head"
head_slot = '\n'.join(
    f'<Fragment slot="head"><Fragment set:html={{`{c}`}} /></Fragment>' if c.startswith('<!--') else c for c in slot)
nl = '\n'
page = f'''---
{nl.join(i.format(depth=depth) for i in imports)}
---
<Page
{props}
>
{head_slot}
{body}</Page>
'''
out = pathlib.Path('src/pages') / new_rel
out.parent.mkdir(parents=True, exist_ok=True)
out.write_bytes(page.encode('utf-8'))
subprocess.run(['git', 'rm', '-q', str(src)], check=True)
print('moved', src, '->', out)
