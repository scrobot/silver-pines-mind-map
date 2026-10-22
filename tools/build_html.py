#!/usr/bin/env python3
"""Build dist/index.html: data/data.json (+ English overlay data/i18n_en.json) and src/board.js
are inlined into src/template.html, so the page is a single self-contained file."""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rd = lambda *p: open(os.path.join(ROOT, *p), encoding='utf-8').read()
tpl, js = rd('src', 'template.html'), rd('src', 'board.js')
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
assert tpl.count('__DATA__') == 1 and tpl.count('__BOARD_JS__') == 1
out = tpl.replace('__DATA__', data).replace('__BOARD_JS__', js.replace('</script', '<\\/script'))
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
open(os.path.join(ROOT, 'dist', 'index.html'), 'w', encoding='utf-8').write(out)
print('dist/index.html', len(out.encode('utf-8')), 'bytes', '| missing EN:', len(missing))
for m in missing[:20]: print('  missing', m)
