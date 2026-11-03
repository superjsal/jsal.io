# The changelog's entries from its HTML page to src/content/changelog.json, for the Astro move
# (.github/docs/astro-move.md). Until the move ships, staging keeps adding lines to site/changelog/index.html; after
# merging staging, convert staging's page again (it is the whole list, so this replaces the file):
#   python -I .github\build\astro-move\changelog_json.py            from origin/staging's page
#   python -I .github\build\astro-move\changelog_json.py <file>     from a file
# Each <li> becomes one line: its date (the heading above it), its tag, its data-short and its sentence, with links
# as Markdown. It stops on anything it can't carry over exactly (other markup, a tag link that isn't the tool's own).
import html, json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
HREF = {'CMS Picker': '/cms-picker/', 'Clean Paste': '/formatter/', 'Image Resizer': '/image-resizer/',
        'Redirect Import': '/redirects/', 'Off the clock': '/play/', 'Site': None}   # as SECTIONS in src/lib/changelog.mjs

if len(sys.argv) > 1:
    page = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
else:
    page = subprocess.run(['git', 'show', 'origin/staging:site/changelog/index.html'], cwd=ROOT, capture_output=True,
                          encoding='utf-8', check=True).stdout
main = page[page.index('<main class="log">'):page.index('</main>')]

entries, date = [], None
for m in re.finditer(r'<h2><time datetime="(\d{4}-\d\d-\d\d)">[^<]*</time></h2>|<li\b.*?</li>', main, re.S):
    if m.group(1):
        date = m.group(1)
        continue
    li = re.fullmatch(r'<li(?: data-short="([^"]*)")?><span class="log-name">(.*?)</span><span>(.*?)</span></li>', m.group(0), re.S)
    assert li and date, f'an entry this can\'t read: {m.group(0)[:160]}'
    short, name, text = li.groups()
    tag = re.sub(r'<[^>]+>', '', name)
    link = re.search(r'href="([^"]*)"', name)
    assert tag in HREF and (link.group(1) if link else None) == HREF[tag], f'tag "{tag}" with link {link and link.group(1)}'
    text = re.sub(r'<a href="([^"]*)">([^<]*)</a>', r'[\2](\1)', text)
    assert '<' not in text and '\n' not in text, f'markup left in: {text[:160]}'
    entry = {'date': date, 'tag': tag}
    if short is not None: entry['short'] = html.unescape(short)
    entry['text'] = html.unescape(text)
    entries.append(entry)

out = ROOT / 'src' / 'content' / 'changelog.json'
out.parent.mkdir(exist_ok=True)
out.write_text('[\n' + ',\n'.join('  ' + json.dumps(e, ensure_ascii=False) for e in entries) + '\n]\n', encoding='utf-8', newline='\n')
print(f'{out.relative_to(ROOT)}: {len(entries)} entries, {len({e["date"] for e in entries})} days')
