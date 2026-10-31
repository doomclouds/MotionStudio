# Swiss Grid — fixed-frame contract

## Scope
Complete 1920 × 1080 official poster, not a screenshot crop. Static Native canvas;
not animation, a browser screenshot, responsive UI, or a video frame extraction.
Reference PNG is a comparison input only. Rendering accepts no image path or URL.

## Run
Requires Node.js and `@napi-rs/canvas` 0.1.100. From this folder:
the external installation and font steps in README.md, then `npm test`, `npm run render`. No font binaries are bundled.
Optional font regeneration uses Python + fontTools; comparison scripts use Pillow.

## Public code bricks
```js
const { createCanvas } = require('./resources.cjs').canvas();
const { compose, defaultScene, drawSwissIntro, drawStatisticOverlay } = require('./render.cjs');
const c = createCanvas(1200,800), g = c.getContext('2d');
const scene = defaultScene(); // fresh clone, never mutates scene.json
scene.title = 'STUDIO NOTES';
scene.stat = { value: '62%', label: 'PROJECT MILESTONE' };
compose(g,scene,{x:60,y:100,scale:0.5});
```
`compose` validates data, builds the complete frame on a fresh procedural canvas, preserves current path, restores context state,
and returns measured text widths/card geometry. Host transform/clip remain honored; host text/alpha/effects do not alter the internal scene. `drawSwissIntro` (background,
rule, headline/subtitle) and `drawStatisticOverlay` (separate opacity group) can
also be composed individually. Lower-level `trackedText` and
`drawStatisticValue` create text and a numeric/percent primitive. Callers of
individual bricks must provide their own clipping/validation.

## Editable text, no silent auto-fit
Only uppercase A–Z, digits, spaces, `% . , + - /` are supported; no CJK, lowercase,
markup, multiline, automatic shrink or wrapping. Use a separate redesigned
layout for longer or multilingual copy.

| Slot | Max characters | Measured Native width ceiling |
|---|---:|---:|
| title | 12 | 1540 px |
| subtitle | 23 | 1500 px |
| stat.value | 1–3 digits, optional `%` | 520 px |
| stat.label | 27 | 526.667 px |

Both character and measured width tests apply. Numeric sample data is illustrative.
Palette requires `#RRGGBB` for background/navy/card/gold. Do not infer data meanings
from the sample figure or reuse the HYPERFRAMES brand as an endorsement.

## Frozen geometry and optical adaptations
- Background `#f5f5f5`; navy `#0a1e3d`; card `#f2f2f2`; gold `#d4a017`.
- Rule `(160,360,1200,12)`; title anchor `(190,560)`; subtitle `(190,654.2)`.
- Card `(249.074,263.333,626.667,346.667)`, 10 px left stripe,
  20 px down/right hard shadow, content left inset 50 px, group opacity 26/27.
- The approximately 96.3% overlay deliberately leaves a very faint title visible;
  do not make it fully opaque or relocate it to a tidy, non-overlapping layout.
- Liberation Sans Bold: title 180 px, −7.2 px tracking, vertical scale 1.05,
  4 px optical stroke; digits 140 px, scales 0.99 × 1.05.
- Archivo 200 subtitle 64 px, 2.6 px tracking, vertical scale 1.05; Archivo 300
  label 24 px, 2 px tracking. Percent rings are native geometry.

These are explicit substitution calibrations, not original font metrics.
The original font binary was not available; residual glyph differences remain.

## Evidence boundary
Full comparison and independent review stay in the private archive. Source identities are in source-lock.json.
Browser QA was not run: official browser file protocol was previously denied;
no protocol switch or bypass was attempted. QA conclusions cover Native static
output only. The source overlay excludes reference PNG, comparisons, generated fonts and the report.

Comparison/report generation additionally requires the separate private reference
and comparison evidence. Those inputs are deliberately not distributed in the
reusable ZIP; offline `render` and `test` remain self-contained after dependency
installation. The full report is held privately. Optional font regeneration scripts and reference-comparison scripts are not included here; exact external font snapshots are required.
