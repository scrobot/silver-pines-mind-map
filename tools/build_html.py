#!/usr/bin/env python3
"""Inject data/data.json into src/template.html -> dist/index.html."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tpl = open(os.path.join(ROOT, 'src', 'template.html'), encoding='utf-8').read()
data = open(os.path.join(ROOT, 'data', 'data.json'), encoding='utf-8').read()
json.loads(data)
data = json.dumps(json.loads(data), ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
assert tpl.count('__DATA__') == 1
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
out = tpl.replace('__DATA__', data)
open(os.path.join(ROOT, 'dist', 'index.html'), 'w', encoding='utf-8').write(out)
print('dist/index.html', len(out.encode('utf-8')), 'bytes')
