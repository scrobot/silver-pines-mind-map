#!/usr/bin/env python3
"""Build an Obsidian canvas (JSON Canvas 1.0) from the Silver Pines board data.

Usage: build_canvas.py data.json out.canvas

Layout: clues (two columns) on the left, hypotheses in the middle, the main
question, endings and open questions to the right of them, then people and
places, then references and motifs; the event timeline runs along the bottom.
Only the edges that carry the argument are drawn (for/against, hypothesis ->
question, event order, ending -> hypothesis, open question -> what it asks
about). Everything else is listed inside the card as text.
"""
import json, math, sys, hashlib

src, out = sys.argv[1], sys.argv[2]
D = json.load(open(src, encoding='utf-8'))
N = {n['id']: n for n in D['nodes']}
E = D['edges']

COLOR = {'q': '1', 'hyp': '1', 'clue': '3', 'char': None, 'place': '4', 'event': '5',
         'ending': '1', 'ref': '6', 'motif': '4', 'open': '2'}
KIND_RU = {'about': 'связано', 'echoes': 'отсылка', 'motif': 'мотив'}
TYPE_RU = {'q': 'вопрос', 'hyp': 'гипотеза', 'clue': 'улика', 'char': 'персонаж', 'place': 'место',
           'event': 'событие', 'ending': 'концовка', 'ref': 'отсылка', 'motif': 'мотив', 'open': 'открытый вопрос'}
CHAR_PER_LINE = {300: 31, 340: 35, 380: 40, 420: 44}


def nid(s):
    return hashlib.md5(s.encode()).hexdigest()[:16]


def lines_for(text, width):
    cpl = CHAR_PER_LINE.get(width, int(width / 9.6))
    total = 0
    for para in text.split('\n'):
        total += max(1, math.ceil(len(para) / cpl))
    return total


def neighbours(i):
    """Related cards that are not drawn as edges, grouped for the card footer."""
    rel = {}
    for e in E:
        if e['kind'] in ('about', 'echoes', 'motif'):
            other = e['target'] if e['source'] == i else e['source'] if e['target'] == i else None
            if other and other in N:
                rel.setdefault(N[other]['type'], []).append(N[other]['label'])
    return rel


def card_text(n):
    t = n['type']
    head = f"**{n['label']}**"
    if t == 'hyp':
        head += '  ' + '●' * n.get('strength', 1) + '○' * (3 - n.get('strength', 1))
    parts = [f"<small>{TYPE_RU[t].upper()}</small>", head, n.get('text', '')]
    if t == 'hyp' and n.get('holders'):
        parts.append('Держатся: ' + ', '.join(n['holders']))
    if t == 'ref' and n.get('tag'):
        parts.append(f"`{n['tag']}`")
    if t == 'ending':
        before = [N[e['source']]['label'] for e in E if e['kind'] == 'leads' and e['target'] == n['id']]
        if before:
            parts.append('Ведёт сюда: ' + ', '.join(before))
    rel = neighbours(n['id'])
    order = ['char', 'place', 'event', 'clue', 'ref', 'motif', 'ending', 'hyp']
    rel_lines = []
    for k in order:
        if k in rel:
            names = sorted(set(rel[k]))
            rel_lines.append(f"{TYPE_RU[k].capitalize()}: " + ', '.join(names))
    if rel_lines:
        parts.append('<small>' + '<br>'.join(rel_lines) + '</small>')
    if n.get('src'):
        parts.append(' · '.join(f"[{s['t']}]({s['u']})" for s in n['src']))
    return '\n\n'.join(p for p in parts if p)


def height_for(n, width):
    txt = card_text(n)
    # links render shorter than their markdown; strip URLs before measuring
    import re
    plain = re.sub(r'\]\([^)]*\)', ']', txt)
    plain = re.sub(r'<[^>]+>', '', plain)
    ln = lines_for(plain, width)
    return int(24 * ln + 48)


nodes, edges = [], []
placed = {}


def put(i, x, y, w):
    n = N[i]
    h = height_for(n, w)
    node = {'id': nid(i), 'type': 'text', 'text': card_text(n), 'x': int(x), 'y': int(y), 'width': w, 'height': h}
    if COLOR.get(n['type']):
        node['color'] = COLOR[n['type']]
    nodes.append(node)
    placed[i] = node
    return h


def group(label, members, pad=60, color=None):
    xs = [placed[m]['x'] for m in members]
    ys = [placed[m]['y'] for m in members]
    x2 = [placed[m]['x'] + placed[m]['width'] for m in members]
    y2 = [placed[m]['y'] + placed[m]['height'] for m in members]
    g = {'id': nid('group:' + label), 'type': 'group', 'label': label,
         'x': min(xs) - pad, 'y': min(ys) - pad - 30, 'width': max(x2) - min(xs) + 2 * pad,
         'height': max(y2) - min(ys) + 2 * pad + 30}
    if color:
        g['color'] = color
    nodes.insert(0, g)
    return g


# ---------- order clues and hypotheses to keep for/against lines short ----------
hyps = [n['id'] for n in D['nodes'] if n['type'] == 'hyp']
clues = [n['id'] for n in D['nodes'] if n['type'] == 'clue']
arg = [(e['source'], e['target']) for e in E if e['kind'] in ('supports', 'contradicts')
       and N[e['source']]['type'] == 'clue' and N[e['target']]['type'] == 'hyp']
hyps.sort(key=lambda h: (-N[h].get('strength', 1), h))
for _ in range(12):
    hp = {h: k for k, h in enumerate(hyps)}
    def bc(c):
        xs = [hp[h] for (cc, h) in arg if cc == c]
        return sum(xs) / len(xs) if xs else 1e9
    clues.sort(key=lambda c: (bc(c), c))
    cp = {c: k for k, c in enumerate(clues)}
    def bh(h):
        xs = [cp[c] for (c, hh) in arg if hh == h]
        return sum(xs) / len(xs) if xs else 1e9
    hyps.sort(key=lambda h: (bh(h), h))

# ---------- clues: two columns ----------
CW, GAP = 380, 40
y = 0
colx = [0, CW + 60]
for r in range(0, len(clues), 2):
    row = clues[r:r + 2]
    hs = [put(c, colx[k], y, CW) for k, c in enumerate(row)]
    y += max(hs) + GAP
clue_bottom = y

# ---------- hypotheses: next to the clues that argue about them ----------
HX, HW = 2 * CW + 60 + 420, 420
targets = []
for h in hyps:
    ys = [placed[c]['y'] + placed[c]['height'] / 2 for (c, hh) in arg if hh == h]
    targets.append((h, sum(ys) / len(ys) if ys else clue_bottom))
targets.sort(key=lambda t: t[1])
cur = -1e9
for h, ty in targets:
    hh = height_for(N[h], HW)
    yy = max(ty - hh / 2, cur)
    put(h, HX, yy, HW)
    cur = yy + hh + 60
hyp_ids = [h for h, _ in targets]
hy_top = min(placed[h]['y'] for h in hyp_ids)
hy_bot = max(placed[h]['y'] + placed[h]['height'] for h in hyp_ids)

# ---------- question, open questions, endings ----------
QX = HX + HW + 420
qh = height_for(N['Q'], 420)
qy = (hy_top + hy_bot) / 2 - qh / 2
put('Q', QX, qy, 420)
opens = [n['id'] for n in D['nodes'] if n['type'] == 'open']
yo = qy - 200
for o in reversed(opens):
    h = height_for(N[o], 380)
    yo -= h + 40
    put(o, QX + 20, yo, 380)
ends = [n['id'] for n in D['nodes'] if n['type'] == 'ending']
ye = qy + qh + 200
for e_ in ends:
    h = put(e_, QX + 20, ye, 380)
    ye += h + 40

# ---------- people and places ----------
PX = QX + 420 + 360
chars = [n['id'] for n in D['nodes'] if n['type'] == 'char']
places = [n['id'] for n in D['nodes'] if n['type'] == 'place']
y = hy_top
for r in range(0, len(chars), 2):
    hs = [put(c, PX + k * (380 + 40), y, 380) for k, c in enumerate(chars[r:r + 2])]
    y += max(hs) + GAP
y += 200
pl_top = y
for r in range(0, len(places), 2):
    hs = [put(c, PX + k * (380 + 40), y, 380) for k, c in enumerate(places[r:r + 2])]
    y += max(hs) + GAP

# ---------- references and motifs ----------
RX = PX + 2 * 420 + 300
refs = [n['id'] for n in D['nodes'] if n['type'] == 'ref']
motifs = [n['id'] for n in D['nodes'] if n['type'] == 'motif']
y = hy_top
for r in range(0, len(refs), 2):
    hs = [put(c, RX + k * (380 + 40), y, 380) for k, c in enumerate(refs[r:r + 2])]
    y += max(hs) + GAP
y += 200
for r in range(0, len(motifs), 2):
    hs = [put(c, RX + k * (380 + 40), y, 380) for k, c in enumerate(motifs[r:r + 2])]
    y += max(hs) + GAP

# ---------- event timeline along the bottom ----------
bottom = max(nd['y'] + nd['height'] for nd in nodes if nd['type'] == 'text') + 400
evs = sorted([n for n in D['nodes'] if n['type'] == 'event'],
             key=lambda n: (0 if n.get('era') == 'before' else 1, n.get('order', 0)))
x = 0
for k, n in enumerate(evs):
    if k and n.get('era') != evs[k - 1].get('era'):
        x += 260
    put(n['id'], x, bottom, 340)
    x += 340 + 60

group('Улики', clues, color='3')
group('Гипотезы', hyp_ids, color='1')
group('Люди', chars)
group('Места', places, color='4')
group('Отсылки', refs, color='6')
group('Мотивы', motifs, color='4')
group('До игры', [n['id'] for n in evs if n.get('era') == 'before'], color='5')
group('Во время игры', [n['id'] for n in evs if n.get('era') != 'before'], color='5')
group('Открытые вопросы', opens, color='2')
group('Концовки', ends, color='1')


# ---------- edges ----------
def side(a, b):
    A, B = placed[a], placed[b]
    ax, ay = A['x'] + A['width'] / 2, A['y'] + A['height'] / 2
    bx, by = B['x'] + B['width'] / 2, B['y'] + B['height'] / 2
    if abs(bx - ax) >= abs(by - ay):
        return ('right', 'left') if bx > ax else ('left', 'right')
    return ('bottom', 'top') if by > ay else ('top', 'bottom')


DRAW = {('supports', 'clue', 'hyp'): ('4', None), ('contradicts', 'clue', 'hyp'): ('1', 'против'),
        ('answers', 'hyp', 'q'): (None, None), ('leads', 'event', 'event'): ('5', None),
        ('supports', 'ending', 'hyp'): ('4', None),
        ('asks', 'open', 'hyp'): ('2', None), ('asks', 'open', 'q'): ('2', None),
        ('asks', 'open', 'char'): ('2', None), ('asks', 'open', 'ending'): ('2', None),
        ('asks', 'open', 'clue'): ('2', None)}
for e in E:
    key = (e['kind'], N[e['source']]['type'], N[e['target']]['type'])
    if key not in DRAW:
        continue
    color, label = DRAW[key]
    fs, ts = side(e['source'], e['target'])
    ed = {'id': nid('e:' + e['source'] + '>' + e['target'] + ':' + e['kind']), 'fromNode': nid(e['source']),
          'fromSide': fs, 'toNode': nid(e['target']), 'toSide': ts, 'toEnd': 'arrow'}
    if color:
        ed['color'] = color
    lab = label or ''
    if e.get('note'):
        lab = (lab + ': ' if lab else '') + e['note']
    if lab:
        ed['label'] = lab
    edges.append(ed)

json.dump({'nodes': nodes, 'edges': edges}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent='\t')
print(len(nodes), 'nodes', len(edges), 'edges')
