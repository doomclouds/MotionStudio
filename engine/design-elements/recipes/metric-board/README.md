# Metric board — de-branded static recipe

This is a newly composed 960×540 studio/workshop example, not the original merchant phone reproduction. No source screenshot, device frame, product icon, customer names or brandmark is shipped. The original full-phone study remains private and is not made public by this package.

## Run
Existing Node and `@napi-rs/canvas` 0.1.100 are required. Run `python prepare-font.py --out /path/outside-repository/fonts` to retrieve the hash-locked original, or supply the exact original OFL font described in `font-lock.json`; no subset or derived font is needed. Set `METRIC_FONT` to its local filename. The process checks its SHA before registration. Missing/wrong fonts fail rather than silently falling back.

```
METRIC_FONT=/path/to/IBMPlexMono-Regular.ttf node test.cjs
METRIC_FONT=/path/to/IBMPlexMono-Regular.ttf python test-output-gates.py
METRIC_FONT=/path/to/IBMPlexMono-Regular.ttf METRIC_OUTPUT=/path/outside-repository node render.cjs
```

Output `board.png` and `workshop.png` use the same `drawMetric` export. `scene.mjs` offers the native static interface; direct interface tests do not claim full engine prepareNative integration. A runtime already available locally was used; this package does not claim a network-independent dependency install.

## Contract
`drawMetric(ctx, {label,value,kind}, {x,y,w,h})` accepts count (nonnegative safe integer) or percent (finite 0–100), 1–14 label characters, finite coordinates within ±16384, width120–500, height90–300. Text overflow rejects. Canvas font `MetricMono` must be registered by the caller (the example does this with exact SHA). Cards render offscreen before compositing, preserving the caller path/font; caller transforms/alpha/compositing affect final placement normally. No arbitrary typography or responsive layout contract is implied.

Percent display uses one-decimal rounding: 0.01 → 0.0%, 99.99 → 100.0%; never treat this as exact input recovery. Demo 57/80 ×100 =71.25%, displayed71.3%; 186/240 ×100 =77.5%. Ratios are supplied explicitly, not inferred by the component. Counts and percentages must never be added together.

## Rights and publication boundary
See RIGHTS.md. Authored implementation follows the repository MIT license; IBM font license remains OFL. This is not a new license grant over the private reference screenshot. No automatic commit or push is performed.
