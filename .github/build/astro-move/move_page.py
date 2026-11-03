# Moves a page from site/ to src/pages/ on the shared layout, for the Astro move (.github/docs/astro-move.md).
#   python -I .github\build\astro-move\move_page.py <old path in site/> <new path in src/pages/> "<Page props>"
#   e.g. move_page.py 404.html 404.astro '  title="Page not found | jsal.io"
#     robots="noindex"'
# The page's own <style> blocks, any comment above <html> and its own note on the shell.css link go in the head
# slot; its top bar becomes <TopBar> with whatever the bar held besides the theme button; body scripts become
# is:inline; /nav.js is dropped (the layout loads it); comments directly in the body go out as raw HTML (Astro drops
# a comment that sits directly in a component's slot). It stops on braces in the body text, which need escaping.
# Head scripts, import maps, JSON-LD and a tool's title in the bar aren't handled yet: add them when a page needs it.
# Then build, and run compare.py and pagediff.mjs.
import pathlib, re, subprocess, sys

old_rel, new_rel, props = sys.argv[1:4]
src = pathlib.Path('site') / old_rel
t = src.read_text(encoding='utf-8')
head = t[t.index('<head>'):t.index('</head>')]
before = t[:t.index('<head>')]

slot = []
for c in re.findall(r'<!--.*?-->', before, re.S):
    slot.append(c)
# A comment straight above the page's own <style>, other than the layout's shell.css note, stays with it
for m in re.finditer(r'(?:(<!--(?:(?!-->).)*-->)\n)?<link rel="stylesheet" href="/shell\.css[^"]*">\n', head, re.S):
    if m.group(1) and 'Colours and top bar' not in m.group(1):
        slot.append(m.group(1))
for s in re.findall(r'<style>\n.*?</style>', head, re.S):
    slot.append(s.replace('<style>', '<style is:inline slot="head">', 1))
slot = [s if s.startswith('<style') else s for s in slot]

body = t[t.index('<body'):t.rindex('</body>')]
body = body[body.index('>') + 2:]
body = re.sub(r'<script src="/nav\.js\?v=\w+" defer></script>\n', '', body)
body = re.sub(r'<script>', '<script is:inline>', body)

def bar(m):
    inner = m.group(0)
    extra = re.search(r'<div class="jsal-actions">\n(.*?)\s*<button type="button" class="jsal-theme"', inner, re.S).group(1).strip()
    indent = re.match(r'\s*', m.group(0)).group(0)
    return f'{indent}<TopBar>{extra}</TopBar>\n' if extra else f'{indent}<TopBar />\n'
body = re.sub(r'[ \t]*<header class="jsal-top">.*?</header>\n', bar, body, count=1, flags=re.S)
assert '<header class="jsal-top">' not in body

# Astro drops a comment sitting directly in a component's slot (one nested in an element survives), so the body's
# top-level comments go out as raw HTML
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
def wrap_top_comments(html):
    out, depth, i = [], 0, 0
    tok = re.compile(r'<!--.*?-->|<(script|style)\b.*?</\1>|</?([a-zA-Z][\w:-]*)[^>]*?(/?)>', re.S)
    for m in tok.finditer(html):
        out.append(html[i:m.start()]); i = m.end(); s = m.group(0)
        if s.startswith('<!--'):
            out.append(f'<Fragment set:html={{`{s}`}} />' if depth == 0 else s)
            continue
        out.append(s)
        name = (m.group(2) or '').lower()
        if m.group(1) or not name or name in VOID or m.group(3) == '/': continue
        depth += -1 if s.startswith('</') else 1
    out.append(html[i:])
    return ''.join(out)

# Text outside scripts and styles can't carry braces (Astro reads them as code)
plain = re.sub(r'<(script|style)\b.*?</\1>', '', body, flags=re.S)
assert '{' not in plain and '}' not in plain, 'braces in the body: escape them first'
body = wrap_top_comments(body)

depth = '../' * (new_rel.count('/') + 1)
# Comments in the head slot need a wrapper: a bare comment can't take slot="head"
head_slot = '\n'.join(
    f'<Fragment slot="head"><Fragment set:html={{`{c}`}} /></Fragment>' if c.startswith('<!--') else c for c in slot)
page = f'''---
import Page from "{depth}layouts/Page.astro";
import TopBar from "{depth}components/TopBar.astro";
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
