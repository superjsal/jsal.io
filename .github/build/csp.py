# The content security policy in site\_headers: which scripts, styles, images and connections a page may use.
# Inline scripts are allowed by their SHA-256 hash, so the policy is written from the pages themselves: run this
# after changing any inline <script> (bump-version.ps1 runs it too), and check.py fails when the hashes are stale.
#   python -I .github\build\csp.py
# The block it owns in _headers sits between the "csp:start" and "csp:end" comments; nothing else there is touched.
import base64, hashlib, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
SITE = ROOT / 'site'
HEADERS = SITE / '_headers'
# The platform pages are written from this template by the nightly publish, so its scripts count before it runs
TEMPLATE = ROOT / '.github' / 'scripts' / 'platform-page.html'

SUPABASE = 'kvdzluvhwxkrbatgskio.supabase.co'   # the team Playbook's database (/ic/)
# Google Analytics: gtag.js, and where it sends hits (it tries www.google.com/g/collect before google-analytics.com)
GA = 'https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google.com'


def sha(text):
    return "'sha256-" + base64.b64encode(hashlib.sha256(text.encode('utf-8')).digest()).decode() + "'"


def inline_hashes():
    """The hash of every inline script that runs (JSON-LD is data, so it needs none), across all pages, and of the
    speculation rules nav.js adds (each a fixed string assigned to a speculationrules script's textContent)."""
    seen = set()
    for p in sorted(SITE.rglob('*.html')) + [TEMPLATE]:
        for m in re.finditer(r'<script(?P<a>[^>]*)>(?P<b>.*?)</script>', p.read_text(encoding='utf-8'), re.S):
            if 'src=' in m.group('a') or 'application/ld+json' in m.group('a'):
                continue
            seen.add(sha(m.group('b')))
    for rule in re.findall(r"rules\.textContent = '(\{\"prerender\".*?\})';", (SITE / 'nav.js').read_text(encoding='utf-8')):
        seen.add(sha(rule))
    return sorted(seen)


def policy(unsafe_eval=False):
    script = ["'self'", *inline_hashes(), 'https://www.googletagmanager.com', 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/']
    if unsafe_eval:
        script.append("'unsafe-eval'")
    parts = [
        "default-src 'self'",
        'script-src ' + ' '.join(script),
        "style-src 'self' 'unsafe-inline'",
        f"img-src 'self' data: blob: {GA} https://{SUPABASE} https://cdn.discordapp.com",
        "font-src 'self'",
        f"connect-src 'self' {GA} https://{SUPABASE} wss://{SUPABASE}",
        "worker-src 'self' blob:",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
    ]
    return '; '.join(parts)


def block():
    return '\n'.join([
        '# csp:start (rewritten from the pages\' inline scripts by the checks; edit the policy there, not here)',
        '/*',
        '  Content-Security-Policy: ' + policy(),
        '# The Image Resizer\'s HEIC converter builds code as it runs, which only that page allows',
        '/image-resizer/*',
        '  ! Content-Security-Policy',
        '  Content-Security-Policy: ' + policy(unsafe_eval=True),
        '# csp:end',
    ])


def current():
    text = HEADERS.read_text(encoding='utf-8')
    m = re.search(r'# csp:start.*?# csp:end', text, re.S)
    return text, m


def stale():
    """A message when the block in _headers isn't what the pages need, else None."""
    text, m = current()
    if not m:
        return 'site/_headers has no csp:start/csp:end block; run .github\\build\\csp.py'
    if m.group(0) != block():
        return 'site/_headers: the content security policy is out of date (an inline script changed); run bump-version.ps1 or .github\\build\\csp.py'
    return None


def update():
    text, m = current()
    new = text[:m.start()] + block() + text[m.end():] if m else text.rstrip('\n') + '\n\n' + block() + '\n'
    if new != text:
        HEADERS.write_text(new, encoding='utf-8', newline='\n')
        return True
    return False


if __name__ == '__main__':
    changed = update()
    line = max(len(l) for l in block().split('\n'))
    print(('Content security policy updated' if changed else 'Content security policy is up to date')
          + f' ({len(inline_hashes())} inline scripts; longest line {line} of 2,000 characters).')
    if line > 2000:
        print('Too long for _headers: Cloudflare ignores lines over 2,000 characters.')
        sys.exit(1)
