# Ornament generation prompts

Raster ornaments were generated with Codex CLI `$imagegen` (no API key) and then toned to the colour law by
`client/scripts/ornament-tone.py`. The raw PNGs are not committed (1–3 MB each); regenerate them with the
command below, then re-run the toning script. Hand-built SVG covers everything line-based (dividers, corners,
waves, frames, edelweiss, brand). No hearts or wedding imagery (brief §2).

```bash
# one asset (repeat per row; run several in parallel background shells, ~1–2 min each)
mkdir -p gen/<name>
env -u OPENAI_API_KEY codex exec --skip-git-repo-check --sandbox workspace-write -C "gen/<name>" \
  '$imagegen <prompt>. Save the final PNG into the current working directory as <name>.png. Do not use any API key.' < /dev/null

# tone everything into client/public/ornaments/*.webp (+ -dark variants)
cd client && python scripts/ornament-tone.py --src ../gen
```

Background rules: line art is drawn black on white (ink coverage becomes alpha); shaded objects (ribbons, seal)
are grey on a #00FF00 chroma key (greenness becomes alpha, grey value becomes the tone). Prompts therefore ask
for "black ink on pure white" or "monochrome grayscale on solid pure green". The green never reaches the app:
the toning script maps every pixel onto the white → #5C000E → black line and writes lossless WebP.

| Name | Output (client/public/ornaments) → component | Prompt |
|---|---|---|
| `lace-corner` | `lace-corner`, `-dark` → LaceCorner | An ornate Victorian bobbin lace corner piece: a quarter-circle of fine floral filigree lace with scalloped outer edge, delicate thread mesh, small rosettes and leaf scrolls, filling the top-left corner of the frame and fading to nothing toward the centre. Black lace only, on a pure flat white background, high contrast, crisp fine detail, square image, no text, no hearts, no people |
| `lace-edge` | `lace-edge`, `lace-edge-v` (+ `-dark`) → LaceEdge | A long horizontal strip of scalloped Chantilly lace trim seen flat from above: a straight upper band of fine floral filigree and a row of evenly repeating rounded scallops along the lower edge, with small rosettes inside each scallop. Black lace only on a pure flat white background, high contrast, crisp thread detail, very wide 3:1 landscape composition, the pattern runs edge to edge, no text, no hearts |
| `draped-ribbon` | `draped-ribbon` (+ `-dark`) → DrapedRibbon | A long elegant satin ribbon tied in a graceful bow, the two long tails draped and flowing diagonally across the frame with soft twisting folds and a subtle silk sheen. Monochrome grayscale only (no colour in the ribbon), isolated on a solid flat pure green #00FF00 chroma-key background, studio lighting, no shadow on the background, landscape 3:2, no text |
| `bookmark-ribbon` | `bookmark-ribbon` (+ `-dark`) → BookmarkRibbon, sidebar active marker | A single narrow satin bookmark ribbon hanging straight down vertically from the top edge of the frame, with gentle soft folds and a silk sheen, ending at the bottom in a neat V-shaped swallowtail cut. Monochrome grayscale only, isolated on a solid flat pure green #00FF00 chroma-key background, no shadow, tall portrait 1:3 composition, no text |
| `parchment` | `parchment` (+ `-dark`) → `.paper`, `.card-paper` texture | A seamless top-down texture of old handmade parchment paper with soft crumpled creases and fine fibres, evenly lit, very low contrast, light neutral grey tones only, no stains, no writing, no border, fills the whole square frame |
| `wax-seal` | `wax-seal` (+ `-dark`) → WaxSeal (the mark is vector on top) | A single round wax seal seen from directly above, thick wax with irregular dripped and pooled organic edges and a smooth slightly domed blank flat centre with a raised thin ring border (the centre is empty, no emblem, no letters). Monochrome grayscale only, isolated on a solid flat pure green #00FF00 chroma-key background, soft studio light, square, no text |
| `sketch-books` | `sketch-books` (+ `-dark`) → SketchIllustration / EmptyState | A hand-drawn vintage pen and ink sketch of a tall stack of old leather-bound books with a small hourglass on top, fine cross-hatching, engraving style line art, black ink on pure white paper, no colour, no background scenery, centred and isolated, square, no text |
| `sketch-inkwell` | `sketch-inkwell` (+ `-dark`) → SketchIllustration / EmptyState | A hand-drawn vintage pen and ink sketch of a glass inkwell with a long feather quill pen standing in it and a folded letter beside it, fine cross-hatching, engraving style line art, black ink on pure white paper, no colour, centred and isolated, square, no text |
| `sketch-globe` | `sketch-globe` (+ `-dark`) → SketchIllustration / EmptyState | A hand-drawn vintage pen and ink sketch of an antique desk globe on a carved wooden stand with a meridian ring, fine cross-hatching, engraving style line art, black ink on pure white paper, no colour, centred and isolated, square, no text |
| `sketch-lamp` | `sketch-lamp` (+ `-dark`) → SketchIllustration / EmptyState | A hand-drawn vintage pen and ink sketch of a classic brass banker's desk lamp beside a closed notebook and a pencil, fine cross-hatching, engraving style line art, black ink on pure white paper, no colour, centred and isolated, square, no text |
| `sketch-cap` | `sketch-cap` (+ `-dark`) → SketchIllustration / EmptyState | A hand-drawn vintage pen and ink sketch of a graduation mortarboard cap with a tassel resting on a rolled diploma tied with a ribbon, fine cross-hatching, engraving style line art, black ink on pure white paper, no colour, centred and isolated, square, no text |
| `sketch-notebook` | `sketch-notebook` (+ `-dark`) → SketchIllustration / EmptyState | A hand-drawn vintage pen and ink sketch of an open notebook with blank ruled pages, a fountain pen lying across it and a pair of reading glasses, fine cross-hatching, engraving style line art, black ink on pure white paper, no colour, centred and isolated, square, no text |
