"""Prove that every self-hosted font covers Azerbaijani and Cyrillic.

Usage:
  python scripts/font-coverage.py                 # checks the fonts the app ships (FONTS below)
  python scripts/font-coverage.py path/to/x.css   # checks any @fontsource-style CSS file(s)

For each @font-face block in a CSS file it reads `src` (woff2) and `unicode-range`,
then, for every test character, confirms there is a face whose unicode-range
includes the character AND whose font file really has a glyph for it (fontTools cmap).
A character that is in no face would fall back to another family and look broken.
Exit code is 1 when any character is missing.
"""
import os
import re
import sys

from fontTools.ttLib import TTFont  # pip install fonttools brotli

HERE = os.path.dirname(os.path.abspath(__file__))
NM = os.path.join(HERE, "..", "node_modules", "@fontsource")

# Must match the imports in src/fonts.js
FONTS = [
    "great-vibes/400.css",
    "eb-garamond/400.css",
    "eb-garamond/400-italic.css",
    "eb-garamond/500.css",
    "eb-garamond/600.css",
    "eb-garamond/700.css",
    "cormorant-sc/500.css",
    "cormorant-sc/600.css",
    "cormorant-sc/700.css",
]

AZ = "əƏğĞıİşŞçÇöÖüÜ"
RU = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя"
EXTRA = "№«»—–…"
TEST = AZ + RU + EXTRA


def parse_ranges(spec):
    out = []
    for part in spec.split(","):
        part = part.strip().upper().replace("U+", "")
        if not part:
            continue
        if "-" in part:
            a, b = part.split("-")
            out.append((int(a, 16), int(b, 16)))
        elif "?" in part:
            out.append((int(part.replace("?", "0"), 16), int(part.replace("?", "F"), 16)))
        else:
            out.append((int(part, 16), int(part, 16)))
    return out


def faces(css_path):
    css = open(css_path, encoding="utf-8").read()
    base = os.path.dirname(css_path)
    for block in re.findall(r"@font-face\s*{(.*?)}", css, re.S):
        fam = re.search(r"font-family:\s*'([^']+)'", block).group(1)
        style = re.search(r"font-style:\s*(\w+)", block).group(1)
        weight = re.search(r"font-weight:\s*(\d+)", block).group(1)
        src = re.search(r"url\(([^)]+\.woff2)\)", block).group(1)
        rng = re.search(r"unicode-range:\s*([^;]+);", block)
        ranges = parse_ranges(rng.group(1)) if rng else [(0, 0x10FFFF)]
        cmap = TTFont(os.path.normpath(os.path.join(base, src))).getBestCmap()
        yield fam, f"{weight} {style}", ranges, cmap


def check(css_path):
    by_key = {}
    for fam, variant, ranges, cmap in faces(css_path):
        by_key.setdefault((fam, variant), []).append((ranges, cmap))
    ok = True
    for (fam, variant), items in by_key.items():
        missing = []
        for ch in TEST:
            cp = ord(ch)
            served = any(
                any(a <= cp <= b for a, b in ranges) and cp in cmap for ranges, cmap in items
            )
            if not served:
                missing.append(ch)
        status = "OK  " if not missing else "FAIL"
        detail = "all %d test chars" % len(TEST) if not missing else "missing: " + "".join(missing)
        print(f"{status} {fam:20s} {variant:11s} az={'yes' if not set(AZ) & set(missing) else 'NO '} "
              f"cyrillic={'yes' if not set(RU) & set(missing) else 'NO '}  {detail}")
        ok = ok and not missing
    return ok


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    targets = sys.argv[1:] or [os.path.join(NM, f) for f in FONTS]
    print("Test characters:", AZ, "+ Cyrillic А–я, Ёё +", EXTRA)
    all_ok = True
    for t in targets:
        all_ok = check(t) and all_ok
    print("RESULT:", "PASS" if all_ok else "FAIL")
    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
