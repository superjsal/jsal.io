# IndexNow: tells Bing and the other IndexNow search engines (Yandex, Seznam, Naver…) which jsal.io pages
# changed, so they're recrawled within hours rather than weeks. Bing's index also feeds ChatGPT search and
# Copilot. The key file at the site root proves the site is ours; the key is public by design.
#   python .github/scripts/indexnow.py all        every address in sitemap.xml
#   python .github/scripts/indexnow.py changed    pages the last commit changed (the nightly publish runs this)
#   python .github/scripts/indexnow.py <url> ...  just these
# Only addresses listed in sitemap.xml are sent. Run it after the change is live, not before.
import json, pathlib, re, subprocess, sys, urllib.error, urllib.request

SITE = pathlib.Path(__file__).resolve().parents[2]
KEY = '184d9b76996d8751c72b4a5a062f80d7'
HOST = 'jsal.io'


def sitemap():
    return re.findall(r'<loc>(https://jsal\.io/[^<]*)</loc>', (SITE / 'sitemap.xml').read_text(encoding='utf-8'))


def changed():
    """Pages changed by the last commit, as addresses (cms-picker/wix/index.html → https://jsal.io/cms-picker/wix/)."""
    files = subprocess.run(['git', 'diff', '--name-only', 'HEAD~1', 'HEAD'], cwd=SITE, capture_output=True, text=True, check=True).stdout.split()
    return [f'https://{HOST}/' + f[:-len('index.html')] for f in files if f.endswith('index.html')]


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
        sys.exit(__doc__ or 'Usage: python indexnow.py all | changed | <url> ...')
    submit(sitemap() if args == ['all'] else changed() if args == ['changed'] else args)
