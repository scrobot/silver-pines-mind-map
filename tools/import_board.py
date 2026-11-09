#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Import the cork-board layout from the Remotion project into data/board.json.

The Remotion project (the one that rendered the film) owns the physical layout: where every
piece of paper hangs on a 7000x3800 cork board, how it is pinned, which threads run between
the pins, and in what order the case was built up. This tool lifts that layout out and writes
a web-safe copy the page can read.

DEV-ONLY. data/board.json is committed, and build.sh never runs this — CI has no access to
the Remotion project and stays dependency-free. Re-run it by hand when the layout changes:

    python tools/import_board.py [path-to-remotion-board.json] [path-to-elmap.json]

WHAT IS DELIBERATELY DROPPED. The source file carries production metadata that must not be
published: every beat's `voice` (the narration script, much of it first person, one line
plugging a channel), every beat's `v5` (timecodes into a private edit), and per-element
`note` fields holding capture references like "(с1 0:16:52)". None of it is read by the
renderer and none of it belongs on a public page, so this tool copies fields by allow-list
rather than by exclusion — a new provenance field added upstream cannot leak through.
"""
import json, os, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else r"G:\remotion\src\silver-pines\board\board.json"
MAP = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "data", "board_nodes.json")
OUT = os.path.join(ROOT, "data", "board.json")

B = json.load(open(SRC, encoding="utf-8"))

# element id -> mind-map node id, so clicking a piece of paper can open its dossier.
# Many elements share a node (four cards argue the same hypothesis), so the ELEMENT id is the
# key everywhere and the node id is just a pointer.
NODE = {}
if os.path.exists(MAP):
    raw = json.load(open(MAP, encoding="utf-8"))
    rows = raw if isinstance(raw, list) else raw.get("matches", [])
    for r in rows:
        nid = (r.get("nodeId") or "").strip()
        if nid and r.get("confidence") in ("exact", "strong"):
            NODE[r["elementId"]] = nid
else:
    print("! no %s — elements will have no dossier link" % MAP, file=sys.stderr)

PART_KEYS = ("carrier", "w", "h", "dx", "dy", "rot", "file", "fmt", "img", "focus", "kind", "ink", "paper")


def text_of(p):
    """Keep only the two display languages. `canon` marks captions written for the film
    rather than quoted from the game; the page does not show it."""
    t = p.get("text")
    if not t:
        return None
    out = {}
    for k in ("en", "ru"):
        if t.get(k):
            out[k] = t[k]
    return out or None


def part(p):
    d = {k: p[k] for k in PART_KEYS if p.get(k) is not None}
    t = text_of(p)
    if t:
        d["text"] = t
    return d


def element(e):
    d = {
        "id": e["id"],
        "x": e["x"],
        "y": e["y"],
        "rot": e["rot"],
        "box": e["box"],
        "pin": e.get("pin"),
        "parts": [part(p) for p in e["parts"]],
    }
    for k in ("pinLocal", "pinXY"):
        if e.get(k):
            d[k] = e[k]
    if e.get("back"):
        b = e["back"]
        d["back"] = {
            "file": b["file"], "photo": b["photo"],
            "photoRect": b["photoRect"], "photoFocus": b["photoFocus"],
            "stamp": {k: v for k, v in b["stamp"].items() if k in ("en", "ru")},
        }
    if e["id"] in NODE:
        d["node"] = NODE[e["id"]]
    return d


# ---- reveal order -------------------------------------------------------------
# The film builds the case up over 33 beats; that order is authored and worth keeping as a
# guided walk-through. We keep only the SHAPE of it: which elements get pinned and which
# threads get strung, in order. The narration and the edit timecodes stay behind.
story, events = 0, []
for b in B["beats"]:
    for ev in b.get("events", []):
        events.append((story + round(ev.get("t", 0) * B["fps"]), b["id"], ev))
    story += b["frames"]
events.sort(key=lambda x: x[0])

steps, seen_el, seen_th = [], set(), set()
for frame, beat, ev in events:
    kind = ev.get("type")
    els = [e for e in ([ev["el"]] if ev.get("el") else []) + list(ev.get("els") or []) if e]
    if kind in ("pin", "stamp"):
        for e in els:
            if e not in seen_el:
                seen_el.add(e)
                steps.append({"at": frame, "beat": beat, "add": e})
    elif kind in ("thread", "threadStart") and ev.get("thread"):
        t = ev["thread"]
        if t not in seen_th:
            seen_th.add(t)
            steps.append({"at": frame, "beat": beat, "thread": t})

missing = [e["id"] for e in B["elements"] if e["id"] not in seen_el]
if missing:
    print("! %d elements never revealed, appended at end: %s" % (len(missing), ", ".join(missing)), file=sys.stderr)
    for e in missing:
        steps.append({"at": story, "beat": B["beats"][-1]["id"], "add": e})

out = {
    "size": B["size"],
    "cork": B["cork"],
    "zones": B["zones"],
    "lamp": B["lamp"],
    "strayPins": B["strayPins"],
    "elements": [element(e) for e in B["elements"]],
    "threads": {
        k: {"color": t["color"],
            "label": {kk: vv for kk, vv in (t.get("label") or {}).items() if kk in ("en", "ru")} or None,
            "nodes": t["nodes"]}
        for k, t in B["threads"].items()
    },
    "reveal": steps,
    "revealEnd": story,
}

json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

carriers = collections.Counter(p["carrier"] for e in out["elements"] for p in e["parts"])
files = {p["file"] for e in out["elements"] for p in e["parts"] if p.get("file")}
files |= {e["back"]["photo"] for e in out["elements"] if e.get("back")}
print("data/board.json  %d elements, %d threads, %d reveal steps, %d bytes"
      % (len(out["elements"]), len(out["threads"]), len(steps), os.path.getsize(OUT)))
print("  carriers:", dict(carriers))
print("  images:", len(files), "| elements linked to a dossier:", sum(1 for e in out["elements"] if e.get("node")))

# Prove the drops actually happened. ("note" is also a carrier type — a notepad sheet — so
# check the field, not the substring.)
blob = json.dumps(out, ensure_ascii=False)
leaks = [b for b in ("voice", "v5", "с1 ", "с2 ", "с3 ", "youtu", "стрим") if b in blob]
if any("note" in e for e in out["elements"]):
    leaks.append("element.note")
if leaks:
    print("  !! provenance survived:", ", ".join(repr(x) for x in leaks))
else:
    print("  clean: no narration, edit timecodes or capture notes")
