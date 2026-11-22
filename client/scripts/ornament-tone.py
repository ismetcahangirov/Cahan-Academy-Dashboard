"""Post-process generated ornament art so it obeys the colour law by construction.

The colour law (docs/DESIGN.md): the UI may only show #FFFFFF, #000000 and #5C000E,
optionally with opacity. Ornament art may additionally use solid *tones* of #5C000E,
i.e. points on the polyline  white -> #5C000E -> black.

Every pixel this script writes is a tone on that polyline (RGB) with an alpha channel.
Alpha compositing only stays on the polyline when the art colour and the backdrop sit on
the SAME segment, so the recipes follow one rule:
  * light-theme art (backdrop = white..#5C000E tints): colour is #5C000E, alpha = coverage;
  * dark-theme art (backdrop = #5C000E..black): partially transparent pixels are #5C000E,
    rose tints (lighter than #5C000E) appear only on fully opaque pixels.
Shaded objects (ribbon, seal) are opaque inside; only their anti-aliased rim is partial.

Usage:
  python scripts/ornament-tone.py --src <dir with raw PNGs> [--only name,name]

Raw PNGs come from Codex `$imagegen` (prompts in docs/design/ornament-prompts.md),
each in <src>/<name>/<name>.png or <src>/<name>.png. Outputs go to
client/public/ornaments/<name>.webp (light theme) and <name>-dark.webp (dark theme).

Requires: pip install pillow numpy
"""
import argparse
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "public", "ornaments"))

WHITE = np.array([255.0, 255.0, 255.0])
WINE = np.array([92.0, 0.0, 14.0])  # #5C000E
BLACK = np.array([0.0, 0.0, 0.0])


def tone(s):
    """Polyline position s -> RGB. s=0 white, s=1 #5C000E, s=2 black (array or scalar)."""
    s = np.clip(np.asarray(s, dtype=np.float64), 0.0, 2.0)[..., None]
    a = np.clip(s, 0, 1)  # white -> wine
    b = np.clip(s - 1, 0, 1)  # wine -> black
    upper = WHITE + (WINE - WHITE) * a
    return np.where(s <= 1, upper, WINE + (BLACK - WINE) * b)


def luminance(rgb):
    return (0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]) / 255.0


def load(src, name):
    for p in (os.path.join(src, name, name + ".png"), os.path.join(src, name + ".png")):
        if os.path.exists(p):
            return np.asarray(Image.open(p).convert("RGB"), dtype=np.float64)
    raise FileNotFoundError(name)


def ink_alpha(rgb, lo=0.06, hi=0.85, gamma=1.0):
    """Line art on white paper: ink amount -> alpha."""
    ink = 1.0 - luminance(rgb)
    a = np.clip((ink - lo) / (hi - lo), 0, 1)
    return a ** gamma


def chroma(rgb):
    """Grey object on #00FF00: returns (grey 0..1, alpha 0..1) with green spill removed."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    excess = np.clip(g - np.maximum(r, b), 0, 255)
    alpha = np.clip(1.0 - (excess - 12) / 200.0, 0, 1)
    grey = np.maximum(r, b) / 255.0  # spill-free estimate of the object's own value
    grey = np.where(alpha > 0.02, np.clip(grey / np.maximum(alpha, 0.02), 0, 1), 0)
    return grey, alpha


def crop_to_alpha(rgba, pad=8, thresh=0.04):
    a = rgba[..., 3]
    ys, xs = np.where(a > thresh * 255)
    if len(xs) == 0:
        return rgba
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, rgba.shape[0])
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, rgba.shape[1])
    return rgba[y0:y1, x0:x1]


def to_image(rgb, alpha):
    rgba = np.dstack([np.clip(rgb, 0, 255), np.clip(alpha * 255.0, 0, 255)]).astype(np.uint8)
    return rgba


def save(rgba, name, max_side=None, size=None, quality=82):
    im = Image.fromarray(rgba, "RGBA")
    if size:
        im = im.resize(size, Image.LANCZOS)
    elif max_side and max(im.size) > max_side:
        k = max_side / max(im.size)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    # Resampling can only produce convex mixes of polyline points of *adjacent* pixels; re-snap
    # every pixel to the polyline so the law holds exactly.
    arr = np.asarray(im).astype(np.float64)
    arr[..., :3] = snap_to_polyline(arr[..., :3])
    arr[..., 3] = np.round(arr[..., 3] / 6) * 6  # coarser alpha steps compress far better, invisible
    arr[..., 3] = np.clip(arr[..., 3], 0, 255)
    im = Image.fromarray(arr.astype(np.uint8), "RGBA")
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name + ".webp")
    im.save(path, "WEBP", lossless=True, quality=100, method=6, exact=True)
    kb = os.path.getsize(path) / 1024
    print(f"  {name}.webp  {im.width}x{im.height}  {kb:.0f} KB")
    return path


TONE_STEPS = 64  # tone levels per segment


def snap_to_polyline(rgb):
    """Project each RGB onto the nearest point of the white->wine->black polyline."""
    best = None
    best_d = None
    for p0, p1 in ((WHITE, WINE), (WINE, BLACK)):
        d = p1 - p0
        t = np.clip(((rgb - p0) @ d) / (d @ d), 0, 1)
        t = (np.round(t * TONE_STEPS) / TONE_STEPS)[..., None]  # quantised: smaller lossless files, still on-law
        proj = p0 + t * d
        dist = ((rgb - proj) ** 2).sum(-1)
        if best is None:
            best, best_d = proj, dist
        else:
            m = (dist < best_d)[..., None]
            best = np.where(m, proj, best)
            best_d = np.minimum(dist, best_d)
    return np.round(best)


def seamless_x(arr, period=None):
    """Make a strip tile horizontally: crop to a whole period and cross-fade the seam."""
    h, w = arr.shape[:2]
    if period:
        arr = arr[:, : period * (w // period)]
        w = arr.shape[1]
    band = max(8, w // 10)
    left = arr[:, :band].copy()
    right = arr[:, w - band :].copy()
    ramp = np.linspace(0, 1, band)[None, :, None]
    # replace the right edge so it flows into the left edge
    arr = arr.copy()
    arr[:, w - band :] = right * (1 - ramp) + left * ramp
    return arr[:, : w - band // 2] if False else arr


def seamless_xy(arr):
    """Offset-and-blend: classic seamless tile for low-contrast textures."""
    h, w = arr.shape[:2]
    rolled = np.roll(np.roll(arr, h // 2, axis=0), w // 2, axis=1)
    yy = np.abs(np.linspace(-1, 1, h))[:, None]
    xx = np.abs(np.linspace(-1, 1, w))[None, :]
    edge = np.clip(np.maximum(yy, xx) * 1.6 - 0.6, 0, 1)[..., None]
    return arr * (1 - edge) + rolled * edge


def find_period(alpha, lo, hi):
    prof = alpha.mean(axis=0)
    prof = prof - prof.mean()
    best, best_p = -1e9, None
    for p in range(lo, hi):
        c = (prof[:-p] * prof[p:]).mean()
        if c > best:
            best, best_p = c, p
    return best_p


# ---------------------------------------------------------------- asset recipes
# s values: 0 = white, 1 = #5C000E, 2 = black
LIGHT_INK = 1.0  # #5C000E itself: alpha over white/tints stays on the white->wine segment
DARK_PEAK = 0.42  # rose tint for the densest threads on dark backdrops (opaque pixels only)


def dark_art(a, knee=0.55, peak=DARK_PEAK, gain=1.0):
    """Coverage -> (rgb, alpha) for dark backdrops, keeping every composite on the polyline.

    coverage < knee : colour #5C000E, alpha = coverage/knee  (wine over wine/black: on segment)
    coverage >= knee: opaque, tone slides from #5C000E (s=1) up to the rose `peak`.
    """
    a = np.clip(a * gain, 0, 1)
    hi = np.clip((a - knee) / (1 - knee), 0, 1)
    s = np.where(a >= knee, 1.0 - (1.0 - peak) * hi, 1.0)
    alpha = np.where(a >= knee, 1.0, a / knee)
    return tone(s), alpha


def ink_asset(src, name, max_side, lo=0.06, hi=0.85, gamma=1.0, dark_alpha=1.0, quality=82):
    rgb = load(src, name)
    a = ink_alpha(rgb, lo, hi, gamma)
    rgba = to_image(np.broadcast_to(tone(LIGHT_INK), rgb.shape), a)
    rgba = crop_to_alpha(rgba)
    save(rgba, name, max_side, quality=quality)
    cov = rgba[..., 3].astype(np.float64) / 255.0
    rgb_d, a_d = dark_art(cov * dark_alpha)
    save(to_image(rgb_d, a_d), name + "-dark", max_side, quality=quality)


def lace_edge(src, name, height):
    rgb = load(src, name)
    a = ink_alpha(rgb, 0.06, 0.8)
    rgba = to_image(np.broadcast_to(tone(LIGHT_INK), rgb.shape), a)
    # vertical crop to content, then horizontal period
    ys = np.where(rgba[..., 3].mean(axis=1) > 6)[0]
    rgba = rgba[max(ys.min() - 4, 0) : ys.max() + 4]
    w = rgba.shape[1]
    period = find_period(rgba[..., 3].astype(np.float64), w // 8, w // 3)
    start = w // 2 - period  # take one period from the middle (fewest edge artefacts)
    tile = rgba[:, start : start + period].astype(np.float64)
    tile = seamless_x(tile)
    k = height / tile.shape[0]
    size = (max(1, round(tile.shape[1] * k)), height)
    tile = tile.astype(np.uint8)
    save(tile, name, size=size)
    cov = tile[..., 3].astype(np.float64) / 255.0
    rgb_d, a_d = dark_art(cov)
    save(to_image(rgb_d, a_d), name + "-dark", size=size)
    # vertical variant: band on the left, scallops pointing right (sidebar inner edge)
    small = np.asarray(Image.fromarray(tile, "RGBA").resize(size, Image.LANCZOS))
    save(np.ascontiguousarray(np.rot90(small, 1)), name + "-v")
    small_d = np.asarray(Image.fromarray(to_image(rgb_d, a_d), "RGBA").resize(size, Image.LANCZOS))
    save(np.ascontiguousarray(np.rot90(small_d, 1)), name + "-v-dark")
    print(f"  (period {period}px of {w}px source)")


def chroma_asset(src, name, max_side, light=(1.75, 0.55), dark=(1.6, 0.45), crop=True):
    rgb = load(src, name)
    grey, a = chroma(rgb)
    inside = grey[a > 0.5]
    g0, g1 = np.percentile(inside, 2), np.percentile(inside, 99.5)
    gn = np.clip((grey - g0) / max(g1 - g0, 1e-3), 0, 1)
    for suffix, (s_dark, s_light) in (("", light), ("-dark", dark)):
        s = s_dark + (s_light - s_dark) * gn
        rgba = to_image(tone(s), a)
        if crop:
            rgba = crop_to_alpha(rgba, pad=2)
        save(rgba, name + suffix, max_side)


def parchment(src, name, size=512):
    rgb = load(src, name)
    L = luminance(rgb)
    h, w = L.shape
    side = min(h, w)
    L = L[:side, :side]
    L = np.asarray(Image.fromarray((L * 255).astype(np.uint8)).resize((size, size), Image.LANCZOS)) / 255.0
    L = seamless_xy(L[..., None])[..., 0]
    dev = L - np.median(L)
    dev = dev / (np.percentile(np.abs(dev), 99) + 1e-6)
    # Both themes: #5C000E at low alpha (stays on the segment of either backdrop).
    # Light: creases darken the paper. Dark: ridges catch "light" as a faint wine glow.
    a_light = np.clip(0.015 + np.clip(-dev, 0, 1) * 0.075, 0, 0.1)
    a_dark = np.clip(0.04 + np.clip(dev, 0, 1) * 0.22, 0, 0.28)
    wine = np.broadcast_to(tone(1.0), (size, size, 3))
    save(to_image(wine, a_light), name, quality=70)
    save(to_image(wine, a_dark), name + "-dark", quality=70)


RECIPES = {
    "lace-corner": lambda s: ink_asset(s, "lace-corner", 360, lo=0.08, hi=0.8),
    "edel-corner": lambda s: ink_asset(s, "edel-corner", 320, lo=0.08, hi=0.85),
    "lace-edge": lambda s: lace_edge(s, "lace-edge", 120),
    "sketch-books": lambda s: ink_asset(s, "sketch-books", 320, lo=0.1, hi=0.9),
    "sketch-inkwell": lambda s: ink_asset(s, "sketch-inkwell", 360, lo=0.1, hi=0.9),
    "sketch-globe": lambda s: ink_asset(s, "sketch-globe", 360, lo=0.1, hi=0.9),
    "sketch-lamp": lambda s: ink_asset(s, "sketch-lamp", 360, lo=0.1, hi=0.9),
    "sketch-cap": lambda s: ink_asset(s, "sketch-cap", 320, lo=0.1, hi=0.9),
    "sketch-notebook": lambda s: ink_asset(s, "sketch-notebook", 360, lo=0.1, hi=0.9),
    "draped-ribbon": lambda s: chroma_asset(s, "draped-ribbon", 720),
    "bookmark-ribbon": lambda s: chroma_asset(s, "bookmark-ribbon", 360, light=(1.55, 0.7), dark=(1.45, 0.55)),
    "wax-seal": lambda s: chroma_asset(s, "wax-seal", 320, light=(1.42, 0.45), dark=(1.36, 0.4)),
    "parchment": lambda s: parchment(s, "parchment"),
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--only", default="")
    args = ap.parse_args()
    names = [n for n in args.only.split(",") if n] or list(RECIPES)
    for n in names:
        print(n)
        try:
            RECIPES[n](args.src)
        except FileNotFoundError:
            print("  (raw PNG missing, skipped)")


if __name__ == "__main__":
    main()
