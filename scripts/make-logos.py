"""Turn the two BluSlate logo images into transparent, tightly cropped assets.

Uses GIMP-style colour-to-alpha against the flat background colour, so
anti-aliased edges and the translucent back tile survive on any background.
"""
import sys
from PIL import Image, ImageDraw, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
NOISE = 6


def color_to_alpha(im, bg):
    im = im.convert("RGB")
    out = []
    for px in im.getdata():
        a = 0.0
        for c, b in zip(px, bg):
            d = abs(c - b) - NOISE  # ignore compression noise in the flat background
            if d <= 0:
                v = 0
            elif c > b:
                v = d / max(255 - b - NOISE, 1)
            else:
                v = d / max(b - NOISE, 1)
            a = max(a, v)
        if a < 0.03:
            out.append((0, 0, 0, 0))
            continue
        rgb = tuple(max(0, min(255, round((c - b) / a + b))) for c, b in zip(px, bg))
        out.append(rgb + (round(a * 255),))
    res = Image.new("RGBA", im.size)
    res.putdata(out)
    return res


def keep_interior(original, cut):
    """Only clear background that is connected to the image border.

    White details inside the logo (the rocket on the light version) match the
    background colour, so colour-to-alpha alone would punch holes in them.
    """
    alpha = cut.split()[3]
    mask = alpha.point(lambda v: 255 if v < 20 else 0)
    w, h = mask.size
    for corner in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if mask.getpixel(corner) == 255:
            ImageDraw.floodfill(mask, corner, 128)
    exterior = mask.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MaxFilter(7))
    solid = original.convert("RGBA")
    out = cut.copy()
    out.paste(solid, (0, 0), exterior.point(lambda v: 255 - v))
    return out


def bbox(im, thresh=20):
    alpha = im.split()[3].point(lambda v: 255 if v > thresh else 0)
    return alpha.getbbox()


def column_gap(im, start, thresh=20):
    """First fully transparent column run after `start` (the gap between tile and text)."""
    alpha = im.split()[3]
    w, h = im.size
    px = alpha.load()
    for x in range(start, w):
        if all(px[x, y] <= thresh for y in range(h)):
            return x
    return w


def pad(im, frac=0.04):
    w, h = im.size
    p = round(max(w, h) * frac)
    c = Image.new("RGBA", (w + 2 * p, h + 2 * p), (0, 0, 0, 0))
    c.paste(im, (p, p))
    return c


def square(im, size):
    w, h = im.size
    s = max(w, h)
    c = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    c.paste(im, ((s - w) // 2, (s - h) // 2))
    return c.resize((size, size), Image.LANCZOS)


for name, bg in [("logo-light-bg", (255, 255, 255)), ("logo-dark-bg", (1, 8, 38))]:
    src = Image.open(f"{SRC}/{name}.png").convert("RGB")
    im = keep_interior(src, color_to_alpha(src, bg))
    im = im.crop(bbox(im))
    variant = "light" if name == "logo-light-bg" else "dark"
    # Full logo, scaled to a sensible header source size (height 160px).
    full = pad(im, 0.01)
    full = full.resize((round(full.width * 160 / full.height), 160), Image.LANCZOS)
    full.save(f"{OUT}/logo-{variant}.png", optimize=True)
    # Rocket mark only: left part up to the gap before the wordmark.
    gap = column_gap(im, im.width // 10)
    mark = im.crop((0, 0, gap, im.height))
    mark = mark.crop(bbox(mark))
    mark.save(f"{OUT}/mark-{variant}-src.png")
    if variant == "light":
        square(pad(mark, 0.02), 512).save(f"{OUT}/icon.png", optimize=True)
        sq = square(pad(mark, 0.02), 180)
        apple = Image.new("RGBA", sq.size, (255, 255, 255, 255))
        apple.alpha_composite(sq)
        apple.convert("RGB").save(f"{OUT}/apple-icon.png", optimize=True)
        square(pad(mark, 0.02), 48).save(f"{OUT}/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
        square(mark, 128).save(f"{OUT}/mark.png", optimize=True)
    print(variant, "full", full.size, "mark", mark.size, "gap", gap)
