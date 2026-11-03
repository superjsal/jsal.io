# IndexNow: tells Bing and the other IndexNow search engines (Yandex, Seznam, Naver…) which jsal.io pages
# changed, so they're recrawled within hours rather than weeks. Bing's index also feeds ChatGPT search and
# Copilot. The key file at the site root proves the site is ours; the key is public by design.
#   python .github/scripts/indexnow.py all        every address in sitemap.xml
#   python .github/scripts/indexnow.py changed    pages the last commit changed (the nightly publish runs this)
#   python .github/scripts/indexnow.py built <old dist> <new dist> [--list]   pages whose built HTML differs (a push
#                                                 to main); --list only prints them
#   python .github/scripts/indexnow.py <url> ...  just these
# Only addresses listed in sitemap.xml are sent. Run it after the change is live, not before.
import json, pathlib, re, subprocess, sys, urllib.error, urllib.request

SITE = pathlib.Path(__file__).resolve().parents[2] / 'site'
KEY = '184d9b76996d8751c72b4a5a062f80d7'
HOST = 'jsal.io'


def sitemap():
    return re.findall(r'<loc>(https://jsal\.io/[^<]*)</loc>', (SITE / 'sitemap.xml').read_text(encoding='utf-8'))


DATES = 'src/data/cms-picker-dates.json'   # each CMS Picker page's date, moved on by the publish when its data changes


def changed():
    """Pages changed by the last commit, as addresses (site/privacy/index.html → https://jsal.io/privacy/); for the
    CMS Picker's pages, which the build makes from data, those whose date the commit moved on."""
    git = lambda *a: subprocess.run(['git', *a], cwd=SITE, capture_output=True, text=True).stdout
    files = git('diff', '--name-only', 'HEAD~1', 'HEAD').split()
    urls = [f'https://{HOST}/' + f[len('site/'):-len('index.html')] for f in files if f.startswith('site/') and f.endswith('index.html')]
    if DATES in files:
        was, now = (json.loads(git('show', f'{rev}:{DATES}') or '{}') for rev in ('HEAD~1', 'HEAD'))
        urls += [f'https://{HOST}/cms-picker/' + ('' if page == 'cms-picker' else f'{page}/')
                 for page, v in now.items() if was.get(page, {}).get('date') != v['date']]
    return urls


def built(old, new):
    """Pages whose built HTML differs between two builds of the site (new pages too), as addresses. Comparing what the
    build wrote catches every way a page changes: its own source, the layout, the data or the changelog."""
    old, new = pathlib.Path(old), pathlib.Path(new)
    urls = []
    for f in sorted(new.rglob('index.html')):
        rel = f.relative_to(new)
        o = old / rel
        if not o.exists() or o.read_bytes() != f.read_bytes():
            urls.append(f'https://{HOST}/' + ('' if rel.parent == pathlib.Path('.') else rel.parent.as_posix() + '/'))
    return urls


def submit(urls):
    known = set(sitemap())
    urls = [u for u in dict.fromkeys(urls) if u in known]
    if not urls:
        print('IndexNow: nothing to send')
        return
    body = json.dumps({'host': HOST, 'key': KEY, 'keyLocation': f'https://{HOST}/{KEY}.txt', 'urlList': urls}).encode()
    req = urllib.request.Request('https://api.indexnow.org/indexnow', data=body, headers={'Content-Type': 'application/json; charset=utf-8'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f'IndexNow: {r.status} for {len(urls)} address(es)')   # 200 or 202 = accepted
    except urllib.error.HTTPError as e:
        print(f'IndexNow: {e.code} {e.reason} ({len(urls)} address(es)); 403 = key file not found yet, 422 = an address not on {HOST}')
    for u in urls:
        print('  ' + u)


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__ or 'Usage: python indexnow.py all | changed | built <old dist> <new dist> | <url> ...')
    if args[0] == 'built' and len(args) in (3, 4):
        urls = built(args[1], args[2])
        if args[3:] == ['--list']:   # only print them (the push workflow sends them once the build is live)
            print(' '.join(urls))
        else:
            print('Changed pages: ' + (' '.join(urls) or 'none'))
            submit(urls)
    else:
        submit(sitemap() if args == ['all'] else changed() if args == ['changed'] else args)
