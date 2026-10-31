> Integration status: source-case technical card; batch retention/submission is authorized. The two new cross-content compositions are not individually owner-reviewed. See ../README.md for external resources and ../CANDIDATE-GUIDE.md for the narrower promoted wrapper contract.

# Light-leak frame · v1 bounded contract

ID: `recipe.light-leak-cinema.v1`. Case-derived recipe, not a registered public asset family or a general video engine.

## Composition API

```js
const { draw, drawField } = require('./film-frame.cjs');
const { loadFonts, render } = require('./render.cjs');
const { reference, transfer } = require('./fixtures.cjs');
const env = loadFonts(); // canvasApi + actual hash-checked glyph coverage by role
const { png, geometry } = render(transfer, env);
// The same material can occupy a caller-owned Canvas area:
drawField(ctx, {
  ...transfer.field,
  bounds: { x: 40, y: 80, width: 720, height: 300 }
}, env);
```

The drawing module has no filesystem, network, wall-clock, random API, image decoding or original-reference dependency. The adapter separately owns font loading; the caller owns the Canvas API. Only procedural color, paths and native editable text are rendered.

## Whole-frame geometry

- Whole recipe requires width 1920 / height 1080.
- Inner window is exactly width 1600 / height `1600 / 2.39`, centered at x160, y `(1080 − height) / 2`. Do not crop black surroundings.
- Left title anchor x288; two explicit 84px italic title lines with an 88.2px baseline interval. The fixed source specimen uses baselines 602/690.2 after visual calibration; not a universal font algorithm.
- Main content available width 960px (60% of inner frame). No automatic wrap, shrink, ellipsis or new line inference. Italic overhang on the left is intentionally retained.
- Subtitle is explicit 22px italic text, baseline 744. Kicker and header/footer are 10.5px Mono with 2.31px tracking.
- Header/footer contain exactly three authored strings, placed with CSS-like space-between including the trailing tracking advance. Fields with less than 32px gap fail rather than collide.
- These positions are fixed to this reference and chosen font files. New language or font files require remeasurement and visual review.

## Field-only material

`drawField` accepts arbitrary positive bounds up to 4096×2160 and clips all effects to them. This supports a reusable local material, not an assertion that every aspect ratio is well designed.

- Explicit palette roles: baseStart/baseMid/baseEnd, lowGlow, ambient, warm, hot, cream; `#RRGGBB` only.
- Source composition order: diagonal three-stop base, low-contrast elliptical ambient tone, lower vertical haze, warm side leak, hot upper leak, authored scratches, overlay grain, vignette.
- Hot/warm centers are normalized [0,1] coordinates; spread is [.05,1]. Radial ellipse dimensions follow farthest-corner geometry derived from the corresponding CSS fields.
- Scratches: 0–8 explicit x/top/height fractions; top + height must not exceed 1, opacity 0–.4. They are decorative surface marks, not traced film damage.
- Grain: explicit uint32 seed, opacity 0–.3; fixed 240×240 deterministic colored-noise tile and overlay blend. This is a **visual approximation of** upstream SVG feTurbulence, not that algorithm, an actual film scan, or a stochastic temporal simulation.
- Vignette: radial center-to-corner black overlay, no darkening until radius 50%, opacity 0–.8.

## Text and font contract

EB Garamond variable italic input is instanced at 500 for title and 400 for subtitle; IBM Plex Mono regular for metadata. Derived faces are renamed `ODCinemaTitle`, `ODCinemaSubtitle`, `ODCinemaMono` and registered under fixed role aliases. Input/output hashes, embedded names, licenses and coverage are recorded.

Caller-supplied `env.glyphs` must be Sets for title/subtitle/mono derived from actual registered fonts. Unknown glyphs fail. The current Latin subset does not support a broad Chinese/Arabic/CJK copy contract. Never silently fall back and call the result faithful.

## Semantic boundary

The recipe only accepts `contentKind:'fictional-specimen'` and the exact disclosure `Not actual film footage; labels are illustrative.` This is acknowledgement metadata, not factual verification. The original-layout fixture preserves upstream film labels for study; the transfer fixture visibly states fictional/no-footage in its footer. Nothing proves real film stock, a real production, filming coordinates, number of reels, or running time.

## Isolation and scope

Inputs can be deeply frozen. Drawing restores caller styles, transform and clip state; because Native style getters do not fully follow save/restore, styles are explicitly reapplied. Whole-frame painting clears incoming shadow/filter/letter-spacing/alpha/composite effects, and a pixel-hash test proves default output is independent of those caller styles. Caller transforms/clip remain intentional composition controls. As with ordinary Canvas drawing, current paths belong to the caller and are not retained.

Determinism is verified for the exact locked fonts, Canvas 0.1.100 and Node 24.22.1. No cross-platform identity, browser QA, responsive layout, animation, audio, playback or public publication is asserted.
