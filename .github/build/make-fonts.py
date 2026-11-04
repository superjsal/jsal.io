# Writes the site's fonts: the full Latin files in .github/build/fonts/ (Google's variable fonts, SIL Open Font
# Licence) trimmed to the weights and OpenType features the pages use, as site/fonts/<name>-<hash>.woff2. A new
# hash is a new name, so browsers that keep fonts for a year get the change; shell.css and Page.astro are pointed
# at the new names and the old files removed.
#   python -I .github/build/make-fonts.py
# Run it after swapping in a newer font, or when the site starts using a weight or feature the trim drops.
import hashlib, io, re
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / '.github' / 'build' / 'fonts'
OUT = ROOT / 'site' / 'fonts'
SHELL = ROOT / 'site' / 'shell.css'
REFS = [SHELL, ROOT / 'src' / 'layouts' / 'Page.astro']

# Weight ranges kept (check.py allows 400 to 800); None keeps the file's own range.
WEIGHTS = {
    'inter': (400, 800),
    'lora': None,
    'lora-italic': None,
    'jetbrains-mono': None,
}
# Browsers' default features (kern, liga, calt, ccmp, locl, mark…) plus tnum, which font-variant-numeric:
# tabular-nums asks for. Nothing on the site sets font-feature-settings.
EXTRA_FEATURES = ['tnum']


def unicode_range(css, name):
    # The characters each file holds are the unicode-range its @font-face declares, so the two can't disagree
    m = re.search(r'/fonts/' + re.escape(name) + r'(?:-[0-9a-f]{8})?\.woff2.*?unicode-range:\s*([^;]+);', css)
    if not m:
        raise SystemExit(f'shell.css has no @font-face with a unicode-range for {name}')
    return m.group(1).replace(' ', '')


def trim(name, css):
    # Never stamp the time of a save: the same input gives the same bytes, so the same name
    font = TTFont(SRC / f'{name}.woff2', recalcTimestamp=False)
    if WEIGHTS[name] and 'fvar' in font:
        font = instancer.instantiateVariableFont(font, {'wght': WEIGHTS[name]})
    # Through a plain TTF first: the subsetter needs every table fully loaded, which a woff2 read lazily isn't
    buf = io.BytesIO(); font.flavor = None; font.save(buf); buf.seek(0)
    font = TTFont(buf, recalcTimestamp=False)
    opts = subset.Options()
    opts.layout_features = list(opts.layout_features) + EXTRA_FEATURES
    opts.name_IDs = ['*']; opts.name_languages = ['*']   # keep the copyright and licence names
    opts.notdef_outline = True
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=subset.parse_unicodes(unicode_range(css, name)))
    sub.subset(font)
    font.flavor = 'woff2'
    buf = io.BytesIO(); font.save(buf)
    return buf.getvalue()


css = SHELL.read_text(encoding='utf-8')
OUT.mkdir(exist_ok=True)
for name in WEIGHTS:
    data = trim(name, css)
    file = f'{name}-{hashlib.sha256(data).hexdigest()[:8]}.woff2'
    for old in OUT.glob(f'{name}-*.woff2'):
        if re.fullmatch(re.escape(name) + r'-[0-9a-f]{8}\.woff2', old.name) and old.name != file:
            old.unlink()
    (OUT / file).write_bytes(data)
    for ref in REFS:
        text = ref.read_bytes().decode('utf-8')   # bytes, so the file's line endings stay as they are
        new = re.sub(r'/fonts/' + re.escape(name) + r'(?:-[0-9a-f]{8})?\.woff2', f'/fonts/{file}', text)
        if new != text:
            ref.write_bytes(new.encode('utf-8'))
    src = (SRC / f'{name}.woff2').stat().st_size
    print(f'{file:32} {len(data) / 1024:5.1f} KB  (full file {src / 1024:.1f} KB)')
