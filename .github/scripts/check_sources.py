# Are the CMS Picker's source links still alive? Every answer links the platform's own help page (data.json
# sourceUrl), and quiz.json links domain guides and import guides. Help centres move pages often, so once a
# month (the "Source links" Action) and by hand this asks each unique address for its page and reports:
#   dead     404, 410 or a 5xx twice in a row, or no connection: fix the source on the Playbook's CMS Picker tab
#   blocked  401, 403, 429 or 999: the site refuses scripts; open it in a browser to check by hand
#   moved    a redirect to a different page (the link still works; the new address is shown so it can be updated)
#   python check_sources.py            check and report; exits 1 if anything is dead
#   python check_sources.py --quick    the first 20 only (a smoke test of the script itself)
# No packages needed. Addresses from the same host go one after another with a short pause, as a browser would.
import json, pathlib, sys, time, urllib.error, urllib.request
from collections import defaultdict
from urllib.parse import urlsplit, urlunsplit

HERE = pathlib.Path(__file__).resolve().parent
SITE = HERE.parents[1] / 'site' / 'cms-picker'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 jsal.io-source-check'
TIMEOUT = 25
BLOCKED = {401, 403, 429, 999}


def collect():
    """Every unique address the published data and the quiz point at, with what uses it."""
    used = defaultdict(set)
    data = json.loads((SITE / 'data.json').read_text(encoding='utf-8'))
    for pid, rows in data['answers'].items():
        for rid, a in rows.items():
            if isinstance(a, dict) and a.get('sourceUrl'): used[a['sourceUrl']].add(f'{pid} {rid}')
    quiz = json.loads((SITE / 'quiz.json').read_text(encoding='utf-8'))
    for pid, url in (quiz.get('domainDocs') or {}).items(): used[url].add(f'{pid} domainDocs')
    for dest, origins in (quiz.get('imports') or {}).items():
        for org, v in origins.items():
            if isinstance(v, dict) and v.get('url'): used[v['url']].add(f'{dest} imports {org}')
    return used


def strip_fragment(u):
    p = urlsplit(u); return urlunsplit((p.scheme, p.netloc, p.path, p.query, ''))


def fetch(url):
    """(status, final url) with a GET like a browser's; a HEAD first would be refused by several help centres."""
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'text/html,*/*;q=0.8', 'Accept-Language': 'en'})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            r.read(2048)
            return r.status, r.geturl()
    except urllib.error.HTTPError as e:
        return e.code, e.geturl() or url
    except Exception as e:   # DNS, TLS, timeout, reset
        return 0, f'{type(e).__name__}: {e}'


def same_page(a, b):
    pa, pb = urlsplit(strip_fragment(a)), urlsplit(strip_fragment(b))
    return (pa.netloc.replace('www.', ''), pa.path.rstrip('/')) == (pb.netloc.replace('www.', ''), pb.path.rstrip('/'))


def main():
    quick = '--quick' in sys.argv
    used = collect()
    urls = sorted(used)
    if quick: urls = urls[:20]
    by_host = defaultdict(list)
    for u in urls: by_host[urlsplit(u).netloc].append(u)
    dead, blocked, moved = [], [], []
    for host, group in sorted(by_host.items()):
        for u in group:
            status, final = fetch(strip_fragment(u))
            if status == 0 or status in (404, 410) or status >= 500:
                time.sleep(2)
                status, final = fetch(strip_fragment(u))   # once more: help centres hiccup
            if status == 0 or status in (404, 410) or status >= 500: dead.append((u, status, final))
            elif status in BLOCKED: blocked.append((u, status))
            elif not same_page(u, final): moved.append((u, final))
            time.sleep(0.5)
    print(f'{len(urls)} source links checked: {len(dead)} dead, {len(blocked)} blocked (check by hand), {len(moved)} moved.')
    for u, st, final in dead: print(f'  DEAD {st or "no connection"}  {u}\n       used by: {", ".join(sorted(used[u]))}' + (f'\n       {final}' if not st else ''))
    for u, st in blocked: print(f'  blocked {st}  {u}')
    for u, final in moved: print(f'  moved  {u}\n       now: {final}')
    return 1 if dead else 0


if __name__ == '__main__':
    sys.exit(main())
