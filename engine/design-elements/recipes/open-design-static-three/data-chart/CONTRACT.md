> Integration status: source-case technical card; batch retention/submission is authorized. The two new cross-content compositions are not individually owner-reviewed. See ../README.md for external resources and ../CANDIDATE-GUIDE.md for the narrower promoted wrapper contract.

# Editorial chart frame · v1 bounded contract

Identifier: `recipe.editorial-chart-frame.v1`. This is a case-derived composition recipe, **not a registered public design family**.

## Interfaces

```js
const { draw, drawChart, chartGeometry, validate } = require('./paint.cjs');
const { loadFonts, render } = require('./render.cjs');
const { reference, transfer } = require('./fixtures.cjs');
const env = loadFonts(); // hash-checks, registers fixed aliases, returns glyph coverage
const { png, geometry } = render(transfer, env);
// Compose only the chart inside a caller-owned Canvas:
drawChart(ctx, {
  ...transfer.chart,
  bounds: { x: 10, y: 10, width: 660, height: 276 }
}, transfer.theme, env);
```

`paint.cjs` does not load files, fonts, images, network resources, time, randomness or a browser. Its caller supplies the Canvas context and `env.glyphs` Set derived from the actual registered, hash-checked fonts. Without coverage, or with missing glyphs, drawing fails. The rendering adapter owns font I/O; it is separate from the composition.

## Typography and content

- Whole frame is exactly **1920×1080**, not a responsive layout system.
- Authored headline is exactly **four lines**, each an ordered list of `{text, role:'serif'|'italic', accent:boolean}`. It never infers line breaks or causal wording.
- Headline size 68px, baseline interval 71.4px, content starts x320, fixed available width 1280px. Unicode CJK runs are explicitly assigned the pinned CJK face and calibrated +5.5px relative baseline. That is a disclosed reproduction parameter, not a universal font rule.
- Long title/footnote/annotation strings fail instead of shrinking, ellipsizing, dropping text or cropping silently.
- Header/kicker and three footer fields are explicit strings. Footer must preserve synthetic attribution. `Source Serif Pro` regular/italic, `IBM Plex Sans`, `IBM Plex Mono`, and `ODChartCJK500` are the pinned aliases; original Chinese browser fallback remains unknown.
- Caller must re-run geometry and visual checks if changing font files or text. A successful glyph lookup does not prove semantic correctness or good editorial writing.

## Data modes — never interchangeable

### `reference-geometry`

Authored x/y coordinates preserve an illustration. Requires `dataKind:'synthetic'`, a synthetic disclosure, and `acknowledgeAxisMismatch:true`. Point geometry and axis labels are **not** claimed to represent data values. The fixed source points are nine nodes from `(60,410)` through `(1020,90)`.

Source inconsistency, quantified only for audit: top tick y60 says 640M, yet the 640M-marked point is y90, 30 SVG units (34.91 output pixels) lower. With a hypothetical endpoint-linear 0–640 scale, source point y270 maps to ≈266.7M, not its 310M text; y195 maps to 400M, not 468M; y90 maps to ≈586.7M, not 640M. Interior grid labels 210/420 are also not exact equal thirds of 640. This does **not** establish any true market values.

### `linear-values`

Synthetic-only numerical fixture, explicit domain `[0,positiveMaximum]`. Every point y is calculated as `420 - value / maximum * 360`; point x is evenly spaced from 60 to 1020. Values outside the domain, nonfinite values, or nonzero baselines fail. Tick positions use the same mapping. Tick and annotation text are authored and remain caller responsibilities; the provided fixture is checked visually against its numeric values.

## Chart boundaries

- Positive bounds with exact 1100:460 aspect ratio; independently composable at uniform scale.
- 2–12 ordered points, 2–6 ticks, explicit accentStart index.
- Reference coordinates must lie within x60–1040/y60–420 and increase in x.
- Annotation indices must exist; offsets are explicit finite numbers. Annotations are not automatically collision-routed. Reposition and visually review them after changing data (the transfer fixture does this).
- Area is a baseline fill; it is **not** a confidence interval, uncertainty band, or statistical estimator.
- Zero-based linear scale and uniformly spaced category x positions only. No time-series irregular-spacing engine, log axis, forecast model, live data, or inferential statistics.

## Isolation and verification

Inputs are not mutated; deeply frozen fixtures are tested. Canvas transform, style state and line dashes are restored after success and exceptions. The native library's save/restore style getters required explicit reapplication; tests cover that real issue. Current path ownership follows normal Canvas drawing behavior; callers should start their own paths.

`test.cjs` covers 27 named cases, including repeated byte-identical output in this exact renderer/font environment. It is not cross-platform pixel identity, browser testing, accessibility certification or user aesthetic approval. Figures, recipes and assertions do not multiply the count of accepted source works.
