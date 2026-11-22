# Cahan Display

A high-contrast upright display serif made for the Cahan Academy websites.
Designed from the owner's specimen (`ref/specimen-roman.png`, an upright transitional/didone book serif)
with the AI-generated italic poster (`ref/reference.jpg`) as mood reference only. No existing font was
searched for, identified or copied; the letterforms are our own drawings.

## Files

| Weight | CSS | OTF (CFF) | WOFF2 |
|---|---|---|---|
| Light | `font-weight: 300` | `CahanDisplay-Light.otf` | `CahanDisplay-Light.woff2` |
| Regular | `font-weight: 400` | `CahanDisplay-Regular.otf` | `CahanDisplay-Regular.woff2` |
| Bold | `font-weight: 700` | `CahanDisplay-Bold.otf` | `CahanDisplay-Bold.woff2` |

All three are `font-style: normal` (italicAngle 0). `specimen.html` next to the fonts shows every weight.

```css
@font-face { font-family: "Cahan Display"; src: url(/fonts/CahanDisplay-Light.woff2) format("woff2");   font-weight: 300; font-style: normal; font-display: swap; }
@font-face { font-family: "Cahan Display"; src: url(/fonts/CahanDisplay-Regular.woff2) format("woff2"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Cahan Display"; src: url(/fonts/CahanDisplay-Bold.woff2) format("woff2");    font-weight: 700; font-style: normal; font-display: swap; }
```

## Character set (179 characters + space and no-break space)

- Latin A–Z a–z, plus á é í ó ú
- Azerbaijani Ə ə Ğ ğ İ ı Ö ö Ş ş Ç ç Ü ü (İ is I + the i dot; ı is i without dot; ə is e turned 180°)
- Russian Cyrillic А–Я а–я Ё ё (upright roman forms)
- Figures 0–9 (lining, equal width)
- `. , : ; ! ? ' " “ ” « » ‘ ’ ( ) [ ] - – — … / & @ # % + = * № ₼`

Coverage is proved by `build/coverage.py`, which reads AZ / RU / EXTRA from the site's
`client/scripts/font-coverage.py` and also checks `Xoş gəlmisiniz`, `İdarə paneli`, `Добро пожаловать`.

## Metrics

UPM 1000 · cap height 680 · x-height 455 · ascender 705 · descender −270 (glyph extremes +889 / −223).
hhea and OS/2 typo ascent/descent are both 950 / −300 with line gap 0 and USE_TYPO_METRICS set,
so every engine (and `next/font` fallback generation, which reads hhea) gets the same line box
(`line-height: normal` = 1.25). Kerning: GPOS `kern` pair table (about 2,500 pairs per weight).

## How it was built

1. **Glyph sheets**: Codex CLI image generation (`build/gen.sh`, prompts in `PROMPTS.md`) drew the
   characters large, black on white, 8–13 per sheet, two variants per sheet. Latin sheets used the
   owner's specimen as the reference; Azerbaijani, Cyrillic and extra punctuation used our own generated
   Latin (`ref/style-latin.png`) as a style-only reference.
2. **Segmentation** (`build/segment.py`): threshold, connected components, rows, characters (dots and
   accents grouped with their letter), baseline per row, scale to cap height 680 / x-height 455, stem width
   per sheet. Every source glyph is kept as its own PNG in `work/glyphs/<sheet>_<variant>/`.
3. **Source choice** (`build/recipe.py`): first sheet/variant that has the character unless `PICK`
   overrides it. To swap a glyph to a new drawing, add a sheet, run `segment.py`, set `PICK`.
4. **Weights** (`build/tracer.py`): from the one Regular raster per glyph, horizontal ink runs are trimmed
   (Light, −22 units per side) or grown (Bold, +26 per side) with run-length-dependent strength, so stems
   change and hairlines stay thin, didone-style. Per-sheet stem differences are corrected first
   (target stems: capitals 128, lowercase 106, figures 100 units).
5. **Tracing**: the bitmap (2 px per font unit) is smoothed with a 3 px Gaussian to remove staircase
   noise, then traced with potrace (pure-Python `potracer`, opttolerance 0.6); overlaps removed and
   contour directions fixed with skia-pathops.
6. **Composites** (`build/build.py`): İ ı ə Ö Ü ö ü Ё ё ğ (breve) á é í ó ú … ‘ “ ” ' " are assembled from
   drawn parts so marks are identical everywhere.
7. **Spacing and kerning**: side bearings from the glyph profile (area-based, like HT Letterspacer),
   calibrated so a line of the specimen alphabet has the same length as the owner's specimen; kerning pairs
   computed optically from the same profiles, with a collision guard.
8. **Font**: fontTools FontBuilder, CFF outlines, OTF + WOFF2.

Rebuild everything from the saved sheets: `bash build/rebuild.sh` (uses `.venv`).

## License

SIL Open Font License 1.1, © 2026 Cahan Academy (see `OFL.txt`).
