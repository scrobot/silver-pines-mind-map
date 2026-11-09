#!/usr/bin/env python3
"""Build dist/: the page plus its assets.

src/template.html + src/board.css + src/cork.js + src/board.js + data/data.json (with the
English overlay data/i18n_en.json merged in) + data/board.json are combined into one
dist/index.html, and assets/ is copied beside it.

The page itself is still a single self-contained file; only the board's images, textures
and fonts live outside it, because 68 photographs cannot be inlined. assets/ is built by
tools/build_assets.py and committed, so this script — and therefore CI — needs nothing
but the standard library.
"""
import json, os, sys, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rd = lambda *p: open(os.path.join(ROOT, *p), encoding='utf-8').read()
tpl, js = rd('src', 'template.html'), rd('src', 'board.js')
css, cork = rd('src', 'board.css'), rd('src', 'cork.js')
board = rd('data', 'board.json')
D = json.loads(rd('data', 'data.json'))

ov_path = os.path.join(ROOT, 'data', 'i18n_en.json')
missing = []
if os.path.exists(ov_path):
    ov = json.load(open(ov_path, encoding='utf-8'))
    on, oe, osrc = ov.get('nodes', {}), ov.get('edges', {}), ov.get('src', {})
    for n in D['nodes']:
        t = on.get(n['id'])
        if not t:
            missing.append('node ' + n['id']); continue
        en = {'label': t.get('label') or n['label'], 'text': t.get('text', '')}
        for k in ('aka', 'tag'):
            if t.get(k): en[k] = t[k]
        titles = []
        for s in n.get('src', []):
            if s['t'] not in osrc: missing.append('src ' + s['t'])
            titles.append(osrc.get(s['t'], s['t']))
        en['src'] = titles
        n['en'] = en
    for e in D['edges']:
        if e.get('note'):
            k = f"{e['source']}|{e['target']}|{e['kind']}"
            if k in oe: e['note_en'] = oe[k]
            else: missing.append('edge ' + k)
    D.setdefault('meta', {})['holders_en'] = ov.get('holders', {})
else:
    print('no data/i18n_en.json: building Russian only', file=sys.stderr)

data = json.dumps(D, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
noscript = lambda s: s.replace('</script', '<\\/script')
for slot in ('__DATA__', '__BOARD_DATA__', '__BOARD_CSS__', '__CORK_JS__', '__BOARD_JS__'):
    assert tpl.count(slot) == 1, 'template slot %s appears %d times' % (slot, tpl.count(slot))
out = (tpl.replace('__BOARD_CSS__', css)
          .replace('__DATA__', data)
          .replace('__BOARD_DATA__', noscript(board))
          .replace('__CORK_JS__', noscript(cork))
          .replace('__BOARD_JS__', noscript(js)))

dist = os.path.join(ROOT, 'dist')
os.makedirs(dist, exist_ok=True)
open(os.path.join(dist, 'index.html'), 'w', encoding='utf-8').write(out)

# the board's images, textures and fonts sit beside the page
src_assets, dst_assets = os.path.join(ROOT, 'assets'), os.path.join(dist, 'assets')
if os.path.isdir(src_assets):
    if os.path.isdir(dst_assets):
        shutil.rmtree(dst_assets)
    shutil.copytree(src_assets, dst_assets)
    n = sum(len(f) for _, _, f in os.walk(dst_assets))
    size = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(dst_assets) for f in fs)
    print('dist/assets  %d files, %.1f MiB' % (n, size / 1048576))
else:
    print('! no assets/ — run tools/build_assets.py', file=sys.stderr)

print('dist/index.html', len(out.encode('utf-8')), 'bytes', '| missing EN:', len(missing))
for m in missing[:20]: print('  missing', m)
