#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build dist/assets/ — the board's images, textures and fonts, at web sizes.

DEV-ONLY, and the one script in this repo with a dependency (Pillow, for AVIF/WebP). Its
output is committed under assets/, and build.sh only copies that into dist/. CI therefore
stays dependency-free Python, exactly as before.

    pip install "pillow>=11"
    python tools/build_assets.py

WHY TWO SIZES. Every image is drawn at a known size: data/board.json gives each part its
width in board units, and a board unit is one CSS pixel at zoom 1. The board opens at
fit-zoom (~0.26) and the UI caps zoom at 2. So the widest an image is ever painted is
2 x its board-unit width, and at fit-zoom it is a quarter of it. Shipping the 1100-4000px
originals for that is between 3x and 9x waste. We write:

    board/  ~0.75x board units  — what the board view actually needs
    read/   ~2x   board units  — zoomed in, and the dossier

and never upscale past the source. The page loads `board/` for everything and swaps in
`read/` for the one element the reader opens.

ALPHA. Only nine of the seventeen RGBA PNGs have any transparency worth keeping (the cut-out
documents, whose silhouette the paper-fold shading is masked to). The rest carry an alpha
channel for nothing — E18 alone is 2.3MB of fully opaque RGBA — so they are written opaque.
"""
import json, os, sys, shutil, collections

try:
    from PIL import Image
except ImportError:
    sys.exit("needs Pillow:  pip install \"pillow>=11\"")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else r"G:\remotion\public\silver-pines\board"
FONTS_SRC = sys.argv[2] if len(sys.argv) > 2 else r"G:\remotion\node_modules\@fontsource"
OUT = os.path.join(ROOT, "assets")

BOARD_SCALE, READ_SCALE = 0.75, 2.0
ZOOM_CAP = 2.0                      # keep in step with MAX_ZOOM in src/board.js
ALPHA_FLOOR = 0.005                 # below this share of transparent pixels, flatten it

# PT Mono carries the typewriter text, Caveat the handwriting, Oswald the stamps.
FONTS = [("pt-mono", [400]), ("caveat", [400, 700]), ("oswald", [500, 700])]


def widths_from_board():
    """image file -> the widest it is ever drawn, in board units."""
    b = json.load(open(os.path.join(ROOT, "data", "board.json"), encoding="utf-8"))
    w = collections.defaultdict(float)
    for e in b["elements"]:
        for p in e["parts"]:
            if not p.get("file"):
                continue
            # a polaroid paints its photo into an inset window, not the whole card
            drawn = p["img"][2] if (p["carrier"] == "polaroid" and p.get("img")) else p["w"]
            w[p["file"]] = max(w[p["file"]], float(drawn))
        if e.get("back"):
            bk = e["back"]
            pr = bk["photoRect"]
            w[bk["photo"]] = max(w[bk["photo"]], (pr[2] - pr[0]) * e["parts"][0]["w"])
            w[bk["file"]] = max(w[bk["file"]], float(e["parts"][0]["w"]))
    return w


def alpha_share(im):
    if im.mode not in ("RGBA", "LA"):
        return 0.0
    a = im.getchannel("A")
    lo = sum(n for v, n in zip(range(256), a.histogram()) if v < 250)
    return lo / float(im.width * im.height)


def save(im, base, keep_alpha):
    """AVIF first, WebP beside it. Returns (avif bytes, webp bytes)."""
    if keep_alpha:
        im = im.convert("RGBA")
    else:
        im = im.convert("RGB")
    im.save(base + ".avif", "AVIF", quality=58, speed=4)
    im.save(base + ".webp", "WEBP", quality=84, method=6)
    return os.path.getsize(base + ".avif"), os.path.getsize(base + ".webp")


def build_images():
    want = widths_from_board()
    for sub in ("board", "read"):
        os.makedirs(os.path.join(OUT, sub), exist_ok=True)
    tot = collections.Counter()
    rows = []
    for name in sorted(want):
        path = os.path.join(SRC, name)
        if not os.path.exists(path):
            print("  ! missing", name, file=sys.stderr)
            continue
        im = Image.open(path)
        im.load()
        share = alpha_share(im)
        keep = share >= ALPHA_FLOOR
        stem = os.path.splitext(name)[0]
        bu = want[name]
        tot["src"] += os.path.getsize(path)
        for sub, scale in (("board", BOARD_SCALE), ("read", READ_SCALE)):
            target = min(int(round(bu * scale)), im.width)   # never upscale
            c = im.copy()
            if target < im.width:
                c = c.resize((target, max(1, round(im.height * target / im.width))), Image.LANCZOS)
            a, w = save(c, os.path.join(OUT, sub, stem), keep)
            tot[sub] += a
            tot[sub + "_webp"] += w
        rows.append((name, im.size, round(bu), share, keep))
    print("images: %d" % len(rows))
    print("  source           %8.1f KiB" % (tot["src"] / 1024))
    print("  assets/board     %8.1f KiB avif   (%.1f KiB webp)" % (tot["board"] / 1024, tot["board_webp"] / 1024))
    print("  assets/read      %8.1f KiB avif   (%.1f KiB webp)" % (tot["read"] / 1024, tot["read_webp"] / 1024))
    print("  kept alpha on %d of %d" % (sum(1 for r in rows if r[4]), len(rows)))
    return rows


def build_textures():
    """cork tiles at 1100 board units; paper and grunge are small overlays. The originals
    are 3072 and 1024 px and seamless by construction, so downscaling keeps them seamless."""
    os.makedirs(os.path.join(OUT, "tex"), exist_ok=True)
    tot = 0
    # grunge.png is NOT shipped. parts.tsx masks the stamp ink with it, but the mask is a
    # no-op in the film — a grayscale PNG with no alpha reads as a fully opaque mask, and the
    # rendered stamps have uniform ink with zero dropouts. We match the film, not the code.
    for name, px, alpha in (("cork.jpg", 1100, False), ("paper.png", 512, False)):
        p = os.path.join(SRC, "tex", name)
        if not os.path.exists(p):
            print("  ! missing tex/" + name, file=sys.stderr)
            continue
        im = Image.open(p)
        im.load()
        if im.width > px:
            im = im.resize((px, round(im.height * px / im.width)), Image.LANCZOS)
        a, w = save(im, os.path.join(OUT, "tex", os.path.splitext(name)[0]), alpha)
        tot += a
        print("  tex/%-12s %5dpx  %6.1f KiB avif  (%.1f KiB webp)" % (name, im.width, a / 1024, w / 1024))
    tot += build_grain()
    return tot


def build_grain():
    """Film grain as one seamless tile.

    The film regenerates a full-frame feTurbulence field every frame (a 2MP noise field
    per frame, which on a page that repaints while you pan is a hard frame-rate floor).
    A tiled bitmap nudged around by a few pixels is indistinguishable at 8.5% overlay
    opacity and costs nothing. Seeded, so rebuilds are byte-identical.
    """
    import random
    px = 180
    rnd = random.Random(1993)
    im = Image.new("L", (px, px))
    im.putdata([rnd.gauss(128, 46) for _ in range(px * px)])
    # a touch of blur so it reads as grain rather than per-pixel static
    from PIL import ImageFilter
    im = im.filter(ImageFilter.GaussianBlur(0.45))
    p = os.path.join(OUT, "tex", "grain")
    a, w = save(im.convert("RGB"), p, False)
    print("  tex/%-12s %5dpx  %6.1f KiB avif  (%.1f KiB webp)" % ("grain", px, a / 1024, w / 1024))
    return a


def build_fonts():
    """Real woff2 with latin + cyrillic subsets, instead of 390KB of base64 in the film
    project. Both subsets are needed: the board is bilingual on every card."""
    dst = os.path.join(OUT, "fonts")
    os.makedirs(dst, exist_ok=True)
    tot, n = 0, 0
    for fam, weights in FONTS:
        for wt in weights:
            for subset in ("latin", "cyrillic"):
                f = "%s-%s-%d-normal.woff2" % (fam, subset, wt)
                src = os.path.join(FONTS_SRC, fam, "files", f)
                if not os.path.exists(src):
                    print("  ! missing", f, file=sys.stderr)
                    continue
                shutil.copy2(src, os.path.join(dst, f))
                tot += os.path.getsize(src)
                n += 1
    print("fonts: %d files, %.1f KiB" % (n, tot / 1024))
    return tot


if __name__ == "__main__":
    print("source:", SRC)
    rows = build_images()
    print("textures:")
    tex = build_textures()
    fonts = build_fonts()
    board = sum(os.path.getsize(os.path.join(OUT, "board", f)) for f in os.listdir(os.path.join(OUT, "board")) if f.endswith(".avif"))
    print()
    print("first paint (board avif + textures + fonts): %.1f KiB" % ((board + tex + fonts) / 1024))
    print("zoom cap %.1fx — keep MAX_ZOOM in src/board.js in step" % ZOOM_CAP)
