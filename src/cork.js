/* ============================================================================
   The cork board.

   Reads data/board.json — the physical layout lifted out of the film project:
   96 pieces of paper on a 7000x3800 cork board, where each one hangs, how it is
   pinned, and the 19 threads strung between the pins.

   The film is a function of one number. Its engine takes a single scalar `story`
   (0..16264 frames) and every piece of paper, thread and marker stroke is derived
   from it; the camera is the only other input. That is what makes this port
   possible: the board here is the same thing with `story` pinned to the end — the
   finished board — and the camera handed to the reader instead of to a timeline.
   The guided walk-through winds `story` back up again, one beat at a time.

   Exposes window.Cork for board.js: open/clear/find/guide/fit.
   ========================================================================= */
(function () {
'use strict';

var el = document.getElementById('board-data');
if (!el) return;
var B = JSON.parse(el.textContent);

var view = document.getElementById('cork-view');
if (!view) return;
var stage = document.getElementById('cork-stage');
var felt = document.getElementById('cork-felt');
var threadSvg = document.getElementById('cork-threads');
var lamp = document.getElementById('cork-lamp');
var glow = document.getElementById('cork-glow');

var MAX_ZOOM = 2.0;          // keep in step with ZOOM_CAP in tools/build_assets.py
var CORK_TILE = 1100;        // the cork bitmap tiles every 1100 board units

/* ---- maths, ported from the film's engine so the look is bit-identical ---- */
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function clamp01(v) { return clamp(v, 0, 1); }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

/* FNV-1a. The only source of randomness in the whole project, so every torn edge,
   tilt and pin angle is reproducible here exactly as it was in the film. */
function hash(s) {
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

/* A deckle edge: walk the rectangle's perimeter, jitter every step. `torn` bites
   bigger chunks out, for newsprint and notepad sheets. */
function jagged(w, h, seed, amp, step, torn) {
  amp = amp == null ? 1.1 : amp; step = step || 26;
  var pts = [], i;
  var j = function (k) { return (hash(seed + k) - 0.5) * 2 * amp; };
  var n = function (len) { return Math.max(2, Math.round(len / step)); };
  var ta = function (k) { return torn ? (hash(seed + 't' + k) - 0.3) * amp * 3 : 0; };
  var nx = n(w), ny = n(h);
  for (i = 0; i <= nx; i++) pts.push((i / nx * w + j('a' + i)).toFixed(1) + 'px ' + (j('b' + i) + Math.abs(ta('t' + i))).toFixed(1) + 'px');
  for (i = 1; i <= ny; i++) pts.push((w + j('c' + i) - Math.abs(ta('r' + i))).toFixed(1) + 'px ' + (i / ny * h + j('d' + i)).toFixed(1) + 'px');
  for (i = nx - 1; i >= 0; i--) pts.push((i / nx * w + j('e' + i)).toFixed(1) + 'px ' + (h + j('f' + i) - Math.abs(ta('b' + i))).toFixed(1) + 'px');
  for (i = ny - 1; i >= 1; i--) pts.push((j('g' + i) + Math.abs(ta('l' + i))).toFixed(1) + 'px ' + (i / ny * h + j('h' + i)).toFixed(1) + 'px');
  return 'polygon(' + pts.join(',') + ')';
}

/* ---- type ---------------------------------------------------------------
   The film sets every caption in two languages: the page's language full size,
   the other beneath it at 60% and 70% opacity. Both are fitted to the paper by
   shrinking until they fit, so no caption ever overruns its card.

   The film measures with @remotion/layout-utils; a canvas does the same job
   synchronously and for free. Results are cached — the same caption is measured
   once no matter how often the board re-renders. */
var ctx2d = document.createElement('canvas').getContext('2d');
var mcache = Object.create(null);
function measure(text, font) {
  var k = font + '\u0000' + text, v = mcache[k];
  if (v === undefined) { ctx2d.font = font; v = ctx2d.measureText(text).width; mcache[k] = v; }
  return v;
}
function fontOf(family, weight, size) {
  var f = family === 'f-hand' ? 'Caveat' : family === 'f-stamp' ? 'Oswald' : 'PT Mono';
  return weight + ' ' + size + 'px "' + f + '"';
}
function wrapTo(text, family, weight, size, maxW) {
  var words = String(text).split(' '), lines = [], cur = '', i, t;
  var font = fontOf(family, weight, size);
  for (i = 0; i < words.length; i++) {
    t = cur ? cur + ' ' + words[i] : words[i];
    if (!cur || measure(t, font) <= maxW) cur = t;
    else { lines.push(cur); cur = words[i]; }
  }
  if (cur) lines.push(cur);
  return lines;
}
/* largest size <= max where the text fits in maxLines of width w */
function fit(text, family, weight, w, max, maxLines) {
  var ok = function (s) {
    var l = wrapTo(text, family, weight, s, w);
    if (l.length > maxLines) return null;
    var font = fontOf(family, weight, s);
    for (var i = 0; i < l.length; i++) if (measure(l[i], font) > w) return null;
    return l;
  };
  var top = ok(max);
  if (top) return { size: max, lines: top };
  var lo = max * 0.3, hi = max, best = { size: lo, lines: wrapTo(text, family, weight, lo, w) };
  for (var i = 0; i < 12; i++) {
    var mid = (lo + hi) / 2, l = ok(mid);
    if (l) { best = { size: mid, lines: l }; lo = mid; } else hi = mid;
  }
  return best;
}

var LANG = 'ru';
var RU_SCALE = 0.6;

function biNode(text, o) {
  var d = document.createElement('div');
  d.className = 'bi ' + o.family + (o.center ? ' center' : '');
  d.style.cssText = 'left:' + o.x + 'px;top:' + o.y + 'px;width:' + o.w + 'px;height:' + o.h + 'px';
  if (o.color) d.style.color = o.color;
  if (o.tilt) d.style.transform = 'rotate(' + o.tilt + 'deg)';
  d.__bi = { text: text, o: o };
  layoutBi(d);
  return d;
}
/* Re-run on every language switch: the primary line is whichever language the
   page is in, so the board reads in the reader's language, not the film's. */
function layoutBi(d) {
  var text = d.__bi.text, o = d.__bi.o;
  var pri = text[LANG] || text.en || text.ru || '';
  var sec = text[LANG === 'ru' ? 'en' : 'ru'];
  if (sec === pri) sec = null;
  var up = o.upper ? function (s) { return s.toUpperCase(); } : function (s) { return s; };
  var lh = o.lineHeight || 1.08, maxLines = o.maxLines || 2;
  var wt = o.weight || '400', wtSec = o.weightSec || wt;
  var A = fit(up(pri), o.family, wt, o.w, o.max, maxLines);
  var Bb = sec ? fit(up(sec), o.family, wtSec, o.w, A.size * RU_SCALE, maxLines) : null;
  var need = A.size * lh * A.lines.length + (Bb ? A.size * 0.14 + Bb.size * lh * Bb.lines.length : 0);
  if (need > o.h) {
    var k = o.h / need;
    A = fit(up(pri), o.family, wt, o.w, A.size * k, maxLines);
    if (sec) Bb = fit(up(sec), o.family, wtSec, o.w, Math.min(A.size * RU_SCALE, Bb.size * k), maxLines);
  }
  var html = '<div class="pri" style="font-size:' + A.size.toFixed(1) + 'px;font-weight:' + wt + ';line-height:' + lh + '">'
    + A.lines.map(esc).join('<br>') + '</div>';
  if (Bb) html += '<div class="sec" style="font-size:' + Bb.size.toFixed(1) + 'px;font-weight:' + wtSec
    + ';line-height:' + lh + ';margin-top:' + (A.size * 0.14).toFixed(1) + 'px">' + Bb.lines.map(esc).join('<br>') + '</div>';
  d.innerHTML = html;
}
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

/* ---- images -------------------------------------------------------------
   Two sizes are built: assets/board for the board, assets/read for when a card
   is opened. <picture> lets the browser take AVIF and fall back to WebP. */
function imgFor(file, cls) {
  var stem = file.replace(/\.(png|jpg|jpeg)$/i, '');
  var p = document.createElement('picture');
  var s = document.createElement('source');
  s.type = 'image/avif'; s.srcset = 'assets/board/' + stem + '.avif';
  var i = document.createElement('img');
  i.src = 'assets/board/' + stem + '.webp';
  i.alt = ''; i.loading = 'lazy'; i.decoding = 'async'; i.draggable = false;
  i.dataset.stem = stem;
  if (cls) i.className = cls;
  p.appendChild(s); p.appendChild(i);
  return p;
}

/* ---- carriers -----------------------------------------------------------
   Thirteen kinds of paper, each built the same way: a stock with its own colour
   and deckle edge, whatever is printed or written on it, then the fold shading. */
function bend(seed, strength) {
  var a = 120 + hash(seed) * 40;
  var s = strength == null ? 1 : strength;
  var d = document.createElement('div');
  d.className = 'bend';
  d.style.background = 'linear-gradient(' + a.toFixed(1) + 'deg, rgba(255,248,232,' + (0.1 * s).toFixed(3)
    + ') 0%, rgba(255,248,232,0) 38%, rgba(0,0,0,0) 62%, rgba(40,24,10,' + (0.14 * s).toFixed(3) + ') 100%)';
  return d;
}
function sheetDiv(p, id, suffix, amp, step, torn) {
  var s = document.createElement('div');
  s.className = 'sheet';
  s.style.clipPath = jagged(p.w, p.h, id + suffix, amp, step, torn);
  return s;
}
function ruled(top, bottom, period, colour) {
  var d = document.createElement('div');
  d.className = 'note-lines';
  d.style.cssText = 'top:' + top + 'px;bottom:' + bottom + 'px;background:repeating-linear-gradient(180deg,'
    + 'rgba(0,0,0,0) 0px,rgba(0,0,0,0) ' + (period - 1.4).toFixed(2) + 'px,'
    + colour + ' ' + (period - 1.4).toFixed(2) + 'px,' + colour + ' ' + period.toFixed(2) + 'px)';
  return d;
}

function buildPart(p, id, host) {
  var c = p.carrier, box = document.createElement('div');
  box.className = 'paper-part c-' + c;
  box.style.cssText = 'left:' + (p.dx - p.w / 2) + 'px;top:' + (p.dy - p.h / 2) + 'px;width:' + p.w + 'px;height:' + p.h + 'px'
    + (p.rot ? ';transform:rotate(' + p.rot + 'deg)' : '');

  if (c === 'polaroid') {
    box.appendChild(sheetDiv(p, id, 'pol', 0.7, 40));
    var g = document.createElement('div');
    g.className = 'grime';
    g.style.background = 'radial-gradient(ellipse 34% 18% at ' + (8 + hash(id) * 10).toFixed(1) + '% 97%, rgba(95,70,40,.4) 0%, rgba(95,70,40,0) 70%),'
      + 'radial-gradient(ellipse 20% 12% at ' + (86 + hash(id + 'x') * 10).toFixed(1) + '% 4%, rgba(90,68,42,.32) 0%, rgba(90,68,42,0) 70%),'
      + 'linear-gradient(180deg, rgba(60,50,40,0) 86%, rgba(60,50,40,.08) 100%)';
    box.appendChild(g);
    var im = p.img || [12, 13, p.w - 24, p.w - 24];
    var win = document.createElement('div');
    win.className = 'photo-win';
    win.style.cssText = 'left:' + im[0] + 'px;top:' + im[1] + 'px;width:' + im[2] + 'px;height:' + im[3] + 'px';
    if (p.file) {
      var pic = imgFor(p.file);
      var fx = (p.focus && p.focus[0] != null ? p.focus[0] : 0.5) * 100;
      var fy = (p.focus && p.focus[1] != null ? p.focus[1] : 0.5) * 100;
      pic.querySelector('img').style.objectPosition = fx + '% ' + fy + '%';
      win.appendChild(pic);
    }
    win.insertAdjacentHTML('beforeend', '<div class="vig"></div><div class="gloss"></div>');
    box.appendChild(win);
    if (p.text) {
      var capTop = im[1] + im[3], capH = p.h - capTop;
      box.appendChild(biNode(p.text, { x: im[0] + 4, y: capTop + 3, w: im[2] - 8, h: capH - 6, family: 'f-hand',
        max: Math.min(28, capH * 0.5), weight: '700', weightSec: '400', center: true, tilt: -1.2, lineHeight: 0.98 }));
    }
    box.appendChild(bend(id, 0.8));
  } else if (c === 'document' || c === 'photoobj') {
    if (p.file) {
      box.appendChild(imgFor(p.file));
      /* the fold shading is masked to the document's own cut-out silhouette */
      var bd = bend(id + p.file, 1.1), stem = p.file.replace(/\.(png|jpg|jpeg)$/i, '');
      bd.style.webkitMaskImage = bd.style.maskImage = 'url(assets/board/' + stem + '.webp)';
      bd.style.webkitMaskSize = bd.style.maskSize = '100% 100%';
      box.appendChild(bd);
    }
  } else if (c === 'clipping') {
    box.style.clipPath = jagged(p.w, p.h, id + 'clip', 3.2, 9, true);
    if (p.file) box.appendChild(imgFor(p.file));
    box.insertAdjacentHTML('beforeend', '<div class="tint"></div>');
    box.appendChild(bend(id));
  } else if (c === 'caption') {
    box.appendChild(sheetDiv(p, id, 'cap', 0.9, 30));
    if (p.text) box.appendChild(biNode(p.text, { x: 12, y: 8, w: p.w - 24, h: p.h - 16, family: 'f-mono', max: 19 }));
    box.appendChild(bend(id + 'c'));
  } else if (c === 'card') {
    box.appendChild(sheetDiv(p, id, 'card', 1, 34));
    var head = Math.round(p.h * 0.2);
    var r = document.createElement('div'); r.className = 'card-rule'; r.style.top = head + 'px';
    box.appendChild(r);
    box.appendChild(ruled(head + 4, 0, p.h * 0.125, 'rgba(74,68,62,.16)'));
    if (p.text) box.appendChild(biNode(p.text, { x: 18, y: head + 8, w: p.w - 36, h: p.h - head - 18, family: 'f-mono', max: Math.min(30, p.h * 0.17) }));
    box.appendChild(bend(id));
  } else if (c === 'note') {
    box.appendChild(sheetDiv(p, id, 'note', 1.4, 18, true));
    var nl = ruled(0, 0, 28.4, 'rgba(74,68,62,.17)'); nl.style.backgroundPosition = '0 22px';
    box.appendChild(nl);
    box.insertAdjacentHTML('beforeend', '<div class="note-margin"></div>');
    if (p.text) box.appendChild(biNode(p.text, { x: 40, y: 14, w: p.w - 54, h: p.h - 26, family: 'f-hand', max: 44,
      weight: '700', weightSec: '400', color: p.ink === 'red' ? 'var(--p-marker)' : '#35302B', tilt: -1.5, lineHeight: 0.98 }));
    box.appendChild(bend(id));
  } else if (c === 'strip') {
    box.appendChild(sheetDiv(p, id, 'strip', 1.6, 14, true));
    if (p.text) box.appendChild(biNode(p.text, { x: 12, y: 5, w: p.w - 24, h: p.h - 10, family: 'f-mono', max: 22, maxLines: 1, center: true }));
    box.appendChild(bend(id, 0.7));
  } else if (c === 'stamp') {
    box.appendChild(sheetDiv(p, id, 'st', 1.1, 30));
    if (p.text) {
      var ink = document.createElement('div');
      ink.className = 'stamp-ink';
      var sw = p.w * 0.88, sh = p.h * 0.8;
      ink.style.cssText = 'left:' + (p.w * 0.06) + 'px;top:' + (p.h * 0.1) + 'px;width:' + sw + 'px;height:' + sh
        + 'px;transform:rotate(-4deg);border-width:' + Math.max(4, p.h * 0.045).toFixed(1)
        + 'px;outline:' + Math.max(1.5, p.h * 0.012).toFixed(1) + 'px solid var(--p-red);outline-offset:'
        + (-Math.max(8, p.h * 0.08)).toFixed(1) + 'px';
      ink.appendChild(biNode(p.text, { x: 0, y: 0, w: p.w * 0.74, h: p.h * 0.62, family: 'f-stamp',
        max: p.h * 0.34, weight: '700', weightSec: '500', center: true, upper: true, lineHeight: 1 }));
      box.appendChild(ink);
    }
    box.appendChild(bend(id));
  } else if (c === 'tag') {
    box.appendChild(sheetDiv(p, id, 'tag', 0, 999));
    var eye = document.createElement('div'); eye.className = 'tag-eye';
    eye.style.cssText = 'left:' + (p.h * 0.18) + 'px;top:' + (p.h * 0.4) + 'px;width:' + (p.h * 0.2) + 'px;height:' + (p.h * 0.2) + 'px';
    box.appendChild(eye);
    if (p.text) box.appendChild(biNode(p.text, { x: p.w * 0.2, y: 4, w: p.w * 0.76, h: p.h - 8, family: 'f-hand',
      max: p.h * 0.42, weight: '700', weightSec: '400', center: true, lineHeight: 0.95 }));
    box.appendChild(bend(id, 0.7));
  } else if (c === 'blank') {
    box.appendChild(sheetDiv(p, id, 'bl', 0.9, 30));
    box.insertAdjacentHTML('beforeend', '<div class="blank-border"></div>');
    if (p.kind === 'report') {
      var rl = ruled(96, 40, 16.2, 'rgba(74,68,62,.14)');
      rl.style.left = '30px'; rl.style.right = '30px';
      box.appendChild(rl);
    } else if (p.text) {
      box.appendChild(biNode(p.text, { x: 24, y: p.h * 0.38, w: p.w - 48, h: p.h * 0.24, family: 'f-mono', max: 19, center: true }));
    }
    box.appendChild(bend(id));
  } else if (c === 'sketch') {
    box.appendChild(sheetDiv(p, id, 'sk', 1.4, 18, true));
    box.appendChild(ruled(0, 0, 26.2, 'rgba(74,68,62,.12)'));
    box.insertAdjacentHTML('beforeend', SKETCH_SVG(p.w, p.h));
    box.appendChild(bend(id));
  } else if (c === 'sheet') {
    box.appendChild(sheetDiv(p, id, 'sh', 1.6, 30));
    if (p.text) box.appendChild(biNode(p.text, { x: p.w * 0.06, y: p.h * 0.1, w: p.w * 0.88, h: p.h * 0.8, family: 'f-hand',
      max: p.h * 0.3, weight: '700', weightSec: '400', color: 'var(--p-marker)', center: true, tilt: -2, lineHeight: 0.95 }));
    box.appendChild(bend(id));
  }
  host.appendChild(box);
}

/* the one hand-drawn thing on the board: a pencil sketch of the armchair */
function SKETCH_SVG(w, h) {
  return '<svg viewBox="0 0 230 250" width="' + w + '" height="' + h + '" style="position:absolute;inset:0">'
    + '<g fill="none" stroke="#3A3530" stroke-linecap="round" stroke-linejoin="round" opacity=".82">'
    + '<path d="M70 46 C 72 30, 158 28, 162 46 L 166 128 L 66 128 Z" stroke-width="2.2"/>'
    + '<path d="M73 50 C 76 36, 155 34, 158 50" stroke-width="1"/>'
    + '<path d="M50 104 C 46 92, 70 90, 70 104 L 72 160 L 52 162 Z" stroke-width="2"/>'
    + '<path d="M160 104 C 160 90, 186 92, 182 104 L 180 162 L 160 160 Z" stroke-width="2"/>'
    + '<path d="M66 128 C 90 120, 140 120, 166 128 L 170 162 L 62 162 Z" stroke-width="2"/>'
    + '<path d="M68 134 C 96 128, 136 128, 164 134" stroke-width="1"/>'
    + '<path d="M60 162 L 58 196 M 172 162 L 176 196 M 92 162 L 92 186 M 140 162 L 141 186" stroke-width="2"/>'
    + '<path d="M76 140 L 86 156 M 88 140 L 98 156 M 100 140 L 110 156 M 112 140 L 122 156 M 124 140 L 134 156 M 136 140 L 146 156" stroke-width=".8" opacity=".6"/>'
    + '<path d="M62 198 C 100 204, 140 204, 180 198" stroke-width=".9" opacity=".5"/></g></svg>';
}

/* ---- build the board once ----------------------------------------------- */
var EL = {}, NODES = {}, nodeEls = {};
var frag = document.createDocumentFragment();

B.elements.forEach(function (e, idx) {
  EL[e.id] = e;
  if (e.node) { (nodeEls[e.node] = nodeEls[e.node] || []).push(e.id); NODES[e.id] = e.node; }
  var d = document.createElement('div');
  d.className = 'el';
  d.dataset.el = e.id;
  if (e.node) d.dataset.node = e.node;
  var bx = e.box;
  d.style.cssText = 'left:' + (e.x + bx[0]) + 'px;top:' + (e.y + bx[1]) + 'px;width:' + (bx[2] - bx[0]) + 'px;height:' + (bx[3] - bx[1]) + 'px;'
    + '--ox:' + (-bx[0]) + 'px;--oy:' + (-bx[1]) + 'px;transform:rotate(' + e.rot + 'deg);z-index:' + (10 + idx);
  var inner = document.createElement('div');
  inner.style.cssText = 'position:absolute;inset:0';
  inner.style.setProperty('--bx', bx[0] + 'px');
  e.parts.forEach(function (p) {
    var holder = document.createElement('div');
    holder.style.cssText = 'position:absolute;left:' + (-bx[0]) + 'px;top:' + (-bx[1]) + 'px;width:0;height:0';
    buildPart(p, e.id, holder);
    inner.appendChild(holder);
  });
  d.appendChild(inner);
  /* the marker ring the search draws round a card it has found */
  d.insertAdjacentHTML('beforeend', '<svg class="marker-ring" viewBox="0 0 100 100" preserveAspectRatio="none">'
    + '<ellipse cx="50" cy="50" rx="48" ry="46" vector-effect="non-scaling-stroke"/></svg>');
  /* reachable by keyboard; the label is read out by screen readers */
  d.tabIndex = -1;
  d.setAttribute('role', 'button');
  frag.appendChild(d);
});

/* pins: the stray ones first, then one per pinned element */
B.strayPins.forEach(function (p, i) { frag.appendChild(pinNode(p[0], p[1], 'graphite', 's' + i)); });
B.elements.forEach(function (e) {
  if (!e.pin || !e.pinXY) return;
  frag.appendChild(pinNode(e.pinXY[0], e.pinXY[1], e.pin, e.id));
});
function pinNode(x, y, colour, seed) {
  var d = document.createElement('div');
  d.className = 'pin ' + colour;
  d.dataset.pin = seed;
  d.style.cssText = 'left:' + x + 'px;top:' + y + 'px;z-index:' + 500;
  d.innerHTML = '<s></s><i style="transform:rotate(' + (hash(seed) * 40).toFixed(1) + 'deg)"><b></b></i>';
  return d;
}
stage.appendChild(frag);

/* ---- threads ------------------------------------------------------------
   Each thread is a run of pins with string between them. The sag is the film's
   resting value: a fraction of the span, a little deeper for the red ones. */
var THREADS = [];
Object.keys(B.threads).forEach(function (id) {
  var t = B.threads[id], segs = [];
  for (var i = 0; i < t.nodes.length - 1; i++) {
    var a = EL[t.nodes[i]], b = EL[t.nodes[i + 1]];
    if (!a || !b || !a.pinXY || !b.pinXY) continue;
    var ax = a.pinXY[0], ay = a.pinXY[1], bx = b.pinXY[0], by = b.pinXY[1];
    var len = Math.hypot(bx - ax, by - ay);
    var sag = len * (t.color === 'red' ? 0.024 : 0.018);
    segs.push({ d: 'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + ' Q' + ((ax + bx) / 2).toFixed(1) + ' '
      + ((ay + by) / 2 + 2 * sag).toFixed(1) + ' ' + bx.toFixed(1) + ' ' + by.toFixed(1) });
  }
  if (segs.length) THREADS.push({ id: id, color: t.color, label: t.label, segs: segs, nodes: t.nodes });
});

var threadG = {};
(function buildThreads() {
  var defs = '<defs><filter id="th-blur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>';
  var html = defs;
  THREADS.forEach(function (t) {
    var red = t.color === 'red';
    html += '<g class="th" data-th="' + t.id + '">';
    t.segs.forEach(function (s) {
      /* literal colours, not var(): a CSS custom property does not resolve inside an
         SVG presentation attribute, only inside a CSS declaration */
      html += '<path class="sh" d="' + s.d + '" transform="translate(8 13)" fill="none" stroke="rgba(10,6,3,.42)" filter="url(#th-blur)"/>'
        + '<path class="co" d="' + s.d + '" fill="none" stroke="' + (red ? '#A8170F' : '#38332E') + '" stroke-linecap="round"/>'
        + '<path class="tw" d="' + s.d + '" fill="none" stroke="' + (red ? '#6f0b06' : '#1c1916') + '" stroke-dasharray="' + (red ? '2.2 3.1' : '1.6 3.4') + '" stroke-linecap="round" opacity=".35"/>'
        + '<path class="hi" d="' + s.d + '" transform="translate(-.7 -.9)" fill="none" stroke="' + (red ? '#ff6f5c' : '#8d867e') + '" stroke-linecap="round" opacity=".55"/>';
    });
    html += '</g>';
  });
  threadSvg.innerHTML = html;
  THREADS.forEach(function (t) { threadG[t.id] = threadSvg.querySelector('[data-th="' + t.id + '"]'); });
})();

/* which threads touch a given element — used to light up its string on hover */
var threadsOf = {};
THREADS.forEach(function (t) { t.nodes.forEach(function (n) { (threadsOf[n] = threadsOf[n] || []).push(t.id); }); });

/* ---- camera -------------------------------------------------------------- */
var cam = { x: 3480, y: 1960, z: 0.26 };
var W = B.size.w, H = B.size.h;
function fitZoom() {
  var r = view.getBoundingClientRect();
  return Math.min(r.width / (W + 350), r.height / (H + 380));
}
function clampCam() {
  var r = view.getBoundingClientRect();
  var hw = r.width / cam.z / 2, hh = r.height / cam.z / 2;
  var c = B.cork;
  cam.x = (c[2] - c[0]) * cam.z < r.width ? (c[0] + c[2]) / 2 : clamp(cam.x, c[0] + hw, c[2] - hw);
  cam.y = (c[3] - c[1]) * cam.z < r.height ? (c[1] + c[3]) / 2 : clamp(cam.y, c[1] + hh, c[3] - hh);
}

var queued = false;
function invalidate() { if (!queued) { queued = true; requestAnimationFrame(render); } }

function render() {
  queued = false;
  var r = view.getBoundingClientRect(), vw = r.width, vh = r.height;
  clampCam();
  var z = cam.z;

  stage.style.transform = 'translate(' + (vw / 2).toFixed(2) + 'px,' + (vh / 2).toFixed(2) + 'px) scale(' + z.toFixed(5)
    + ') translate(' + (-cam.x).toFixed(2) + 'px,' + (-cam.y).toFixed(2) + 'px)';

  /* cork: a screen-sized layer whose tiling is phase-locked to the board, so it
     never becomes a 50-megapixel raster */
  var T = CORK_TILE * z;
  var ox = vw / 2 - cam.x * z, oy = vh / 2 - cam.y * z;
  felt.style.backgroundSize = T.toFixed(2) + 'px ' + T.toFixed(2) + 'px';
  felt.style.backgroundPosition = (((ox % T) + T) % T).toFixed(2) + 'px ' + (((oy % T) + T) % T).toFixed(2) + 'px';
  /* dark beyond the cork's edge */
  var c = B.cork;
  var ex0 = vw / 2 + (c[0] - cam.x) * z, ey0 = vh / 2 + (c[1] - cam.y) * z;
  var ex1 = vw / 2 + (c[2] - cam.x) * z, ey1 = vh / 2 + (c[3] - cam.y) * z;
  felt.style.clipPath = 'polygon(' + [[ex0, ey0], [ex1, ey0], [ex1, ey1], [ex0, ey1]]
    .map(function (p) { return p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px'; }).join(',') + ')';

  /* threads: viewport-sized SVG with a moving viewBox, same reason as the cork */
  var pad = 1.25, hw = vw / z / 2 * pad, hh = vh / z / 2 * pad;
  var x0 = cam.x - hw, y0 = cam.y - hh, sw = hw * 2, sh = hh * 2;
  threadSvg.style.left = x0 + 'px'; threadSvg.style.top = y0 + 'px';
  threadSvg.setAttribute('width', sw); threadSvg.setAttribute('height', sh);
  threadSvg.setAttribute('viewBox', x0 + ' ' + y0 + ' ' + sw + ' ' + sh);
  /* a thread must stay visible when zoomed out, so its stroke has a floor in
     screen pixels — straight from the film */
  var redW = Math.max(4.4, 2.0 / z), grW = Math.max(2.3, 1.4 / z);
  THREADS.forEach(function (t) {
    var w = t.color === 'red' ? redW : grW, g = threadG[t.id];
    g.querySelectorAll('.sh').forEach(function (p) { p.setAttribute('stroke-width', w * 1.3); });
    g.querySelectorAll('.co,.tw').forEach(function (p) { p.setAttribute('stroke-width', w); });
    g.querySelectorAll('.hi').forEach(function (p) { p.setAttribute('stroke-width', w * 0.28); });
  });

  /* The lamp. One full-frame radial multiply whose ellipse is placed over the board's
     lamp position, exactly as the film does it — a separate "everything else is dark"
     layer would multiply twice where the two overlap and crush the whole picture.
     `ex` is the film's exposure curve: the far corners of the board lift just enough
     to stay readable without flattening the pool of light. */
  var lx = vw / 2 + (B.lamp.x - cam.x) * z, ly = vh / 2 + (B.lamp.y - cam.y) * z;
  var lr = B.lamp.r * z;
  var ld = Math.hypot((cam.x - B.lamp.x) / (B.lamp.r * 1.18), (cam.y - B.lamp.y) / (B.lamp.r * 0.86));
  var L = ld < 0.32 ? lerp(0.96, 0.85, ld / 0.32)
    : ld < 0.62 ? lerp(0.85, 0.57, (ld - 0.32) / 0.3)
    : ld < 0.88 ? lerp(0.57, 0.22, (ld - 0.62) / 0.26) : 0.15;
  var ex = clamp(0.84 / L, 1, 1.38);
  var st = function (r, g, b) {
    return 'rgb(' + Math.min(255, Math.round(r * ex)) + ',' + Math.min(255, Math.round(g * ex)) + ',' + Math.min(255, Math.round(b * ex)) + ')';
  };
  lamp.style.background = 'radial-gradient(ellipse ' + (lr * 1.18).toFixed(0) + 'px ' + (lr * 0.86).toFixed(0) + 'px at '
    + lx.toFixed(0) + 'px ' + ly.toFixed(0) + 'px, ' + st(255, 246, 230) + ' 0%, ' + st(236, 214, 186) + ' 32%, '
    + st(170, 138, 108) + ' 62%, ' + st(72, 52, 38) + ' 88%, ' + st(34, 24, 17) + ' 100%)';
  glow.style.background = 'radial-gradient(ellipse ' + (lr * 0.5).toFixed(0) + 'px ' + (lr * 0.38).toFixed(0) + 'px at '
    + (lx - lr * 0.18).toFixed(0) + 'px ' + (ly - lr * 0.16).toFixed(0) + 'px, rgba(255,186,110,.10) 0%, rgba(255,186,110,0) 100%)';

  cull(vw, vh, z);
}

/* Only paint what is on screen. Note this walks a fixed list of cards and pins, NOT
   stage.children — the thread SVG also lives in the stage and must never be culled. */
var cullable = [];
function collectCullable() {
  cullable = [];
  stage.querySelectorAll('.el,.pin').forEach(function (n) {
    var id = n.dataset.el || n.dataset.pin, e = EL[id];
    cullable.push({ n: n, x: e ? e.x : parseFloat(n.style.left), y: e ? e.y : parseFloat(n.style.top), on: true });
  });
}
function cull(vw, vh, z) {
  var mx = vw / z / 2 + 260, my = vh / z / 2 + 260;
  for (var i = 0; i < cullable.length; i++) {
    var c = cullable[i];
    var on = Math.abs(c.x - cam.x) < mx && Math.abs(c.y - cam.y) < my;
    if (c.on !== on) { c.n.style.visibility = on ? '' : 'hidden'; c.on = on; }
  }
}

/* ---- moving: drop the expensive shading while the board is in motion ----- */
var moveTimer = null;
function moving() {
  document.body.classList.add('cork-moving');
  clearTimeout(moveTimer);
  moveTimer = setTimeout(function () { document.body.classList.remove('cork-moving'); }, 180);
}

/* ---- pan, zoom, pinch ---------------------------------------------------- */
var drag = null;
var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

view.addEventListener('pointerdown', function (e) {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  /* On a touch screen one finger belongs to the page, so it can be scrolled past the
     board; two fingers pan and pinch. A tap still opens a clue, because a tap never
     moves far enough to count as a drag. */
  var tapOnly = coarse && e.pointerType === 'touch';
  /* Remember which card was under the pointer NOW. Capturing the pointer retargets
     every later pointer event to #cork-view, so by pointerup e.target is the board,
     never the card that was pressed. */
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: 0,
           tapOnly: tapOnly, el: e.target.closest ? e.target.closest('.el') : null };
  if (!tapOnly) view.setPointerCapture(e.pointerId);
  view.classList.add('dragging');
});
view.addEventListener('pointermove', function (e) {
  if (!drag || drag.id !== e.pointerId) return;
  var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
  if (drag.tapOnly) return;      /* a single finger: leave the gesture to the page */
  cam.x = drag.cx - dx / cam.z; cam.y = drag.cy - dy / cam.z;
  moving(); invalidate();
});
function endDrag(e) {
  if (!drag || drag.id !== e.pointerId) return;
  var wasClick = drag.moved < 5, card = drag.el;
  drag = null;
  view.classList.remove('dragging');
  if (wasClick) {
    if (card) { open(card.dataset.el); card.focus({ preventScroll: true }); }
    else clearFocus();
  }
}
view.addEventListener('pointerup', endDrag);
view.addEventListener('pointercancel', endDrag);

/* The board sits inside a scrolling document, so it must not trap the wheel. It takes
   the wheel only once the reader has actually engaged with it — a click, or keyboard
   focus — and always with ctrl/cmd held. Until then the wheel scrolls the page past it,
   and the +/- buttons zoom regardless. */
var engaged = false;
view.addEventListener('pointerdown', function () { engaged = true; });
view.addEventListener('focusin', function () { engaged = true; });
view.addEventListener('mouseleave', function () { engaged = false; });

view.addEventListener('wheel', function (e) {
  if (!engaged && !e.ctrlKey && !e.metaKey) return;   /* let the page scroll */
  e.preventDefault();
  var r = view.getBoundingClientRect();
  var mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
  var bx = cam.x + mx / cam.z, by = cam.y + my / cam.z;      /* board point under the cursor */
  var k = Math.exp(-e.deltaY * 0.0014);
  cam.z = clamp(cam.z * k, fitZoom() * 0.85, MAX_ZOOM);
  cam.x = bx - mx / cam.z; cam.y = by - my / cam.z;           /* keep it under the cursor */
  moving(); invalidate();
}, { passive: false });

/* two-finger pinch */
var pts = {};
view.addEventListener('pointerdown', function (e) { pts[e.pointerId] = e; });
view.addEventListener('pointermove', function (e) {
  if (!(e.pointerId in pts)) return;
  pts[e.pointerId] = e;
  var ids = Object.keys(pts);
  if (ids.length !== 2) return;
  drag = null;
  var a = pts[ids[0]], b = pts[ids[1]];
  var d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  var mx = (a.clientX + b.clientX) / 2, my = (a.clientY + b.clientY) / 2;
  if (pinchD) {
    cam.z = clamp(cam.z * (d / pinchD), fitZoom() * 0.85, MAX_ZOOM);
    /* and the midpoint drags the board, so two fingers pan as well as pinch */
    cam.x -= (mx - pinchM[0]) / cam.z;
    cam.y -= (my - pinchM[1]) / cam.z;
    moving(); invalidate();
  }
  pinchD = d; pinchM = [mx, my];
});
var pinchD = 0, pinchM = [0, 0];
function dropPt(e) { delete pts[e.pointerId]; if (Object.keys(pts).length < 2) pinchD = 0; }
view.addEventListener('pointerup', dropPt);
view.addEventListener('pointercancel', dropPt);

/* ---- keyboard ------------------------------------------------------------ */
view.tabIndex = 0;
view.addEventListener('keydown', function (e) {
  var step = 90 / cam.z, k = e.key;
  if (k === 'ArrowLeft') cam.x -= step;
  else if (k === 'ArrowRight') cam.x += step;
  else if (k === 'ArrowUp') cam.y -= step;
  else if (k === 'ArrowDown') cam.y += step;
  else if (k === '+' || k === '=') cam.z = clamp(cam.z * 1.25, fitZoom() * 0.85, MAX_ZOOM);
  else if (k === '-' || k === '_') cam.z = clamp(cam.z / 1.25, fitZoom() * 0.85, MAX_ZOOM);
  else if (k === 'Escape') { clearFocus(); return; }
  else if (k === 'Home') { fitAll(); return; }
  else return;
  e.preventDefault(); moving(); invalidate();
});

/* ---- hover --------------------------------------------------------------- */
var hot = null;
view.addEventListener('pointerover', function (e) {
  var t = e.target.closest ? e.target.closest('.el') : null;
  if (t === hot) return;
  if (hot) hot.classList.remove('hot');
  hot = t;
  if (hot) { hot.classList.add('hot'); if (!focused) lightThreads(hot.dataset.el, true); }
  else if (!focused) lightThreads(null, true);
});
/* the pointer can leave the board without ever crossing bare cork */
view.addEventListener('pointerleave', function () {
  if (hot) { hot.classList.remove('hot'); hot = null; }
  if (!focused) lightThreads(null, true);
});
function lightThreads(id, hoverOnly) {
  var ids = id ? (threadsOf[id] || []) : [];
  THREADS.forEach(function (t) { threadG[t.id].classList.toggle('lit', ids.indexOf(t.id) >= 0); });
  if (hoverOnly) view.classList.toggle('focused', !!id && ids.length > 0);
}

/* ---- opening a card ------------------------------------------------------ */
var focused = null;
function open(id) {
  var e = EL[id];
  if (!e) return;
  focused = id;
  view.classList.add('focused');
  stage.querySelectorAll('.el.open').forEach(function (n) { n.classList.remove('open'); });
  var node = stage.querySelector('[data-el="' + id + '"]');
  if (node) node.classList.add('open');
  /* light this card's threads and every card they reach */
  var ids = threadsOf[id] || [], lit = {};
  ids.forEach(function (t) {
    threadG[t].classList.add('lit');
    (B.threads[t].nodes || []).forEach(function (n) { lit[n] = 1; });
  });
  THREADS.forEach(function (t) { if (ids.indexOf(t.id) < 0) threadG[t.id].classList.remove('lit'); });
  stage.querySelectorAll('.el').forEach(function (n) { n.classList.toggle('lit', !!lit[n.dataset.el]); });
  ease(e.x, e.y, Math.max(cam.z, 0.62));
  swapToRead(id);
  if (window.Board && window.Board.showElement) window.Board.showElement(id, e.node || null);
}
function clearFocus() {
  focused = null;
  view.classList.remove('focused');
  stage.querySelectorAll('.el.open,.el.lit').forEach(function (n) { n.classList.remove('open', 'lit'); });
  THREADS.forEach(function (t) { threadG[t.id].classList.remove('lit'); });
  if (window.Board && window.Board.clearElement) window.Board.clearElement();
}

/* the open card gets the bigger image; everything else stays at board size */
var readSwapped = [];
function swapToRead(id) {
  readSwapped.forEach(function (im) { im.src = 'assets/board/' + im.dataset.stem + '.webp'; });
  readSwapped = [];
  var node = stage.querySelector('[data-el="' + id + '"]');
  if (!node) return;
  node.querySelectorAll('img[data-stem]').forEach(function (im) {
    var pic = im.parentNode.querySelector('source');
    if (pic) pic.srcset = 'assets/read/' + im.dataset.stem + '.avif';
    im.src = 'assets/read/' + im.dataset.stem + '.webp';
    readSwapped.push(im);
  });
}

/* ---- camera moves -------------------------------------------------------- */
var anim = null;
function ease(x, y, z, done) {
  if (anim) cancelAnimationFrame(anim);
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cam.x = x; cam.y = y; cam.z = z; invalidate(); if (done) done(); return;
  }
  var t0 = performance.now(), from = { x: cam.x, y: cam.y, z: cam.z }, dur = 520;
  (function step(now) {
    var k = easeInOut(clamp01((now - t0) / dur));
    cam.x = lerp(from.x, x, k); cam.y = lerp(from.y, y, k); cam.z = lerp(from.z, z, k);
    render();
    if (k < 1) anim = requestAnimationFrame(step);
    else { anim = null; if (done) done(); }
  })(t0);
  moving();
}
function fitAll() { clearFocus(); ease((B.cork[0] + B.cork[2]) / 2, (B.cork[1] + B.cork[3]) / 2, fitZoom()); }

/* ---- search -------------------------------------------------------------- */
function find(ids) {
  var set = {};
  (ids || []).forEach(function (n) { (nodeEls[n] || []).forEach(function (e) { set[e] = 1; }); });
  var any = false, first = null;
  stage.querySelectorAll('.el').forEach(function (n) {
    var on = !!set[n.dataset.el];
    n.classList.toggle('found', on);
    if (on && !first) first = EL[n.dataset.el];
    any = any || on;
  });
  if (first) ease(first.x, first.y, Math.max(cam.z, 0.5));
  return any;
}

/* ---- the guided walk-through --------------------------------------------
   The film builds the case up over 33 beats. data/board.json keeps the shape of
   that: which card is pinned next, which thread strung next. Stepping through it
   replays how the case was assembled, without the narration. */
var guide = { on: false, i: 0, steps: B.reveal || [] };
function guideSet(i) {
  guide.i = clamp(i, 0, guide.steps.length);
  var showEl = {}, showTh = {};
  for (var k = 0; k < guide.i; k++) {
    var s = guide.steps[k];
    if (s.add) showEl[s.add] = 1;
    if (s.thread) showTh[s.thread] = 1;
  }
  stage.querySelectorAll('.el').forEach(function (n) { n.classList.toggle('unrevealed', !showEl[n.dataset.el]); });
  stage.querySelectorAll('.pin').forEach(function (n) {
    var p = n.dataset.pin;
    n.classList.toggle('unrevealed', EL[p] ? !showEl[p] : false);
  });
  THREADS.forEach(function (t) { threadG[t.id].style.display = showTh[t.id] ? '' : 'none'; });
  var cur = guide.steps[guide.i - 1];
  if (cur && cur.add && EL[cur.add]) ease(EL[cur.add].x, EL[cur.add].y, Math.max(cam.z, 0.55));
  if (window.Board && window.Board.guideProgress) window.Board.guideProgress(guide.i, guide.steps.length, cur ? cur.beat : null);
}
function guideOn(on) {
  guide.on = on;
  view.classList.toggle('guided', on);
  if (on) { clearFocus(); guideSet(1); }
  else {
    stage.querySelectorAll('.unrevealed').forEach(function (n) { n.classList.remove('unrevealed'); });
    THREADS.forEach(function (t) { threadG[t.id].style.display = ''; });
    fitAll();
  }
}

/* ---- go ------------------------------------------------------------------ */
collectCullable();
var ro = new ResizeObserver(function () { invalidate(); });
ro.observe(view);
cam.z = fitZoom();
cam.x = (B.cork[0] + B.cork[2]) / 2; cam.y = (B.cork[1] + B.cork[3]) / 2;
render();

window.Cork = {
  open: open,
  clear: clearFocus,
  find: find,
  fit: fitAll,
  zoom: function (k) {
    cam.z = clamp(cam.z * k, fitZoom() * 0.85, MAX_ZOOM);
    moving(); invalidate();
  },
  guide: guideOn,
  guideStep: function (d) { guideSet(guide.i + d); },
  guideAt: function () { return guide.i; },
  guideLen: function () { return guide.steps.length; },
  isGuiding: function () { return guide.on; },
  setLang: function (l) {
    LANG = l;
    stage.querySelectorAll('.bi').forEach(layoutBi);
  },
  elementsForNode: function (n) { return nodeEls[n] || []; },
  nodeForElement: function (e) { return NODES[e] || null; },
  count: B.elements.length
};
})();
