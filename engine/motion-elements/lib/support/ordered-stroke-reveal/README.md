# Ordered stroke reveal — unregistered support candidate

Original, direct-import support for **caller-supplied ordered stroke outlines and directed medians**. It does not discover stroke order from font contours, turn ordinary type into handwriting, lay out text, or reproduce a human performance. No catalog entry or public barrel export. Code and synthetic fixtures use the repository MIT license; input glyph data has independent rights.

Read [design.md](design.md) for choice/limits; [index.mjs](index.mjs) is the pure plan/sampler, [adapter.mjs](adapter.mjs) is the Canvas consumer, [hanzi-data.mjs](hanzi-data.mjs) is a narrow optional data importer, [example.mjs](example.mjs) supplies two original non-font compositions. Tests are co-located in [test](test/).

## API and time

```js
import {compileOrderedStrokeReveal, sampleOrderedStrokeReveal} from './index.mjs';
import {drawOrderedStrokeReveal} from './adapter.mjs';
const plan = compileOrderedStrokeReveal({
  startTime: 0, liftDuration: 0.15,
  strokes: [{
    outline: [
      {op:'M', values:[0,0]}, {op:'L', values:[20,0]},
      {op:'L', values:[20,4]}, {op:'L', values:[0,4]}, {op:'Z', values:[]}
    ],
    median: [{x:0,y:2}, {x:20,y:2}], duration:1, revealWidth:6
  }]
});
const state = sampleOrderedStrokeReveal(plan, 0.5);
// Inject the caller's native/browser Path2D constructor; do not fetch anything.
const result = drawOrderedStrokeReveal(ctx, plan, 0.5, {
  x:30, y:20, scale:2, yOrigin:30, color:'#15202b', Path2D
});
```

Time is an absolute finite numeric scalar in a caller-chosen unit, normally seconds. The timeline is sequential: each duration, then liftDuration, then the next stroke. There is no final lift interval. No ambient clock, previous frame, random number, hidden drawing history or cross-glyph line. Clear/redraw the destination each frame, or manage an explicit separate compositing layer; repeated painting onto old pixels is not a seek-safe framebuffer.

`sample` returns a deeply frozen `{time, completedCount, active, lift, phase, penDown, tip, done}`:

- Before start: phase `before`, no active/lift/tip, no ink.
- Stroke: phase `stroke`, active `{index,progress,section}`. `section` comes directly from existing `extractPolylineSection`; tip is an exact copy of its last position, in source glyph coordinates. At the stroke's start progress is zero, penDown is true and tip is the first median point, but the empty section paints **no dot**.
- At each stroke end that stroke becomes complete. During a nonzero gap phase is `lift`, penDown false, tip null. `lift` contains `{from,to,progress,startTime,endTime}` using the previous median's last point and next median's first point. This is an authored motion cue only: it does not interpolate a visible pen, create ink or connect strokes. At gap start progress is zero; gap end belongs to the next stroke. Zero gaps go directly to the next stroke.
- At/after final end: phase `complete`, all outlines filled, active/lift/tip null and done true. Caller chooses any later pen pose or hidden state; sampler supplies no retained final tip.

Fractions are computed from stored IEEE-754 timeline endpoints. They are not exact rational clock arithmetic. Repeated/reversed/skipped times return the same geometry. Serializing a plan removes its module brand: serialize original inputs and recompile.

## Outline and median are different inputs

Each stroke outline is an array of exact `{op,values}` commands: absolute `M`(2), `L`(2), `Q`(4), `C`(6), `Z`(0). Each contour must start with M, include at least one segment and explicitly close with Z before another contour. Multiple closed contours are allowed, using Canvas nonzero fill. Degenerate area, self-intersection or inappropriate winding are not repaired or rejected geometrically. No SVG arc, relative command or shaping engine.

Median is a directed polyline: `compilePolylineSections` validates and owns its points; `extractPolylineSection` retains **all** prefix corners. No duplicated path cutter or uniform resampling is introduced. The outline never determines the median or stroke order. The caller is responsible for correspondence, direction and stroke ordering; the module cannot certify pedagogical correctness or authenticity of supplied data.

The Canvas adapter creates Path2D objects (never mutates the context's current path). Completed strokes fill their entire outline. For an active nonempty section it clips to that stroke's outline, then strokes its median prefix with the supplied revealWidth, round cap and round join. No partial ink may leave that outline, subject to raster antialiasing. Each stroke has its own clip; no inter-stroke connecting segment is built.

**The tip tracks the median centerline endpoint, not the outer painted edge.** A round cap can reveal approximately half a revealWidth ahead, and a bend/crossing can reveal later parts of the same outline early. A median may also lie outside its outline. This is a bounded mask strategy, not physical deposition or an exact moving-front solution.

At progress zero there is no ink. At completion the exact full outline is filled regardless of width/median coverage. A too-narrow or poorly aligned guide can therefore have a visible final correction. Even a well-covered guide can differ at clip antialiasing edges. There is **no continuity/no-pop guarantee** at completion. Inspect near-end versus end for each chosen data/width/scale. Do not hide this by describing contour fill as actual recorded pen motion.

## Placement and Canvas contract

Uniform positive scale only. Source coordinates are Y-up; placement is explicit:

`localX = x + scale * glyphX`; `localY = y + scale * (yOrigin - glyphY)`.

For the referenced Hanzi dataset yOrigin is normally 900; its 1024-unit coordinate square runs from y=900 to y=-124. It is not a 900-high square. Do not stretch one axis independently. `draw` returns `{state,tip}` with tip mapped into caller-local coordinates, **before any pre-existing context transform**, or null when the pen is up. It does not draw a marker. Caller uses the same placement to map lift.from/to and owns text baselines, line breaking, missing-glyph policy and pen appearance.

The adapter balances save/restore on painting errors; pixels already painted before an error cannot be rolled back. It inherits caller transform, clip, globalAlpha, compositing and filter. It temporarily sets ink color, width, round cap/join, clears dash and shadows. All style/transform/clip state uses Canvas save/restore. Tested Native Canvas 0.1.100 fillStyle/strokeStyle getters can remain stale after restore, despite actual subsequent paint being correctly restored. Color getter equality is not promised: do not infer paint state from these getters or write stale values back. Tests verify actual subsequent fill/stroke pixels instead. Arbitrary Canvas implementations are not guaranteed equivalent; tested Native errors restore both nested scopes. Existing current paths remain intact.

## Finite domain and failure

Exact plain/null-prototype data records only; unexpected/symbol/hidden keys, accessors, sparse or derived arrays reject without invoking getters. This is not a hostile Proxy or modified-builtins security sandbox. No coercion, clamping, silent missing-glyph substitution or malformed-data fallback.

- 1..256 strokes; outline 3..8192 commands each; median 2..4096 points each. Whole-plan maxima are 65536 commands and 65536 median points.
- Coordinates in ±1e6. Polyline segment length at least 1e-9, positive representable cumulative increments, total length ≤1e9, as specified by [polyline-sections](../../../docs/support/polyline-sections.md).
- Time/startTime in ±1e9; duration 1e-6..1e6; liftDuration 0..1e6; every stored interval must advance representably and final end ≤1e9. revealWidth 1e-6..1e6 in glyph units.
- Placement x/y/yOrigin ±1e6; scale 1e-6..1e3; color is exactly hexadecimal #RRGGBB or #RRGGBBAA; Path2D is an explicit constructor.
- Input data are copied; plan and sampler result are deeply frozen. Only plans from this module instance are accepted.
- Compilation and storage are linear in input geometry. Sampling scans ≤256 strokes and uses the existing prefix extractor. Canvas builds completed outlines on each call; no unbounded cache. Large glyph sets should be externally culled, not all painted every frame.

## Optional Hanzi data importer and rights

```js
import {compileHanziStrokeReveal} from './hanzi-data.mjs';
// data was explicitly loaded by the caller from a permitted local source.
const plan = compileHanziStrokeReveal({
  strokes: data.strokes, medians: data.medians,
  startTime: 0, strokeDuration: 0.6, liftDuration: 0.12, revealWidth: 160
});
```

This exact projection intentionally excludes dataset metadata (such as radStrokes). There must be one median per outline, each with at least two `[x,y]` pairs. Absent/mismatched glyph data fail. The bounded original parser accepts only explicit absolute M/L/Q/C/Z plus decimal/exponent numbers with optional whitespace; it deliberately rejects commas, implicit repeated commands, relative commands and the rest of SVG. Each string is ≤262144 characters and ≤57344 tokens. It is not a general font or SVG importer. Timing is uniform per stroke in this convenience wrapper, not historical writing speed; use the core API for authored per-stroke durations.

Reference format: [Hanzi Writer data](https://github.com/chanind/hanzi-writer-data/tree/68d10a4b21150cae5e1ebbd223eed289cf32d90c), derived from [Make Me a Hanzi](https://github.com/skishore/makemeahanzi). **Hanzi Writer engine MIT does not make its glyph data MIT.** Dataset font-derived outlines/medians are subject to the [Arphic Public License](https://github.com/chanind/hanzi-writer-data/blob/68d10a4b21150cae5e1ebbd223eed289cf32d90c/ARPHICPL.TXT). Obtain authorized data separately and preserve the complete unchanged license when distributing it. Modified font/data files require prominent modification/date notices and the applicable APL distribution terms. The repository's original consumer code is separate; bundling data would require its own rights review, not a root-MIT assumption. This package includes no dataset, download script, font, third-party engine implementation or generated preview. Caller acquisition/restoration must pin exact upstream bytes and keep license/provenance with external inputs.

## Checks and acceptance boundaries

From repository root: `node --test engine/motion-elements/lib/support/ordered-stroke-reveal/test/*.test.mjs`.

Native tests use an already installed `@napi-rs/canvas`; alternatively set `MOTION_CANVAS_MODULE` to its absolute index.js. They explicitly skip if unavailable, not claim a raster pass. No install or network action. Public tests use only original non-font bars/ribbons and cover blank/terminal pixels, Y direction, same-source tip, gap isolation, context state, exceptions, deterministic replay, strict schema and malformed importer data. [example.mjs](example.mjs) prints pure samples without a renderer.

Private authorized glyph consumption and raster observations remain outside source control. Synthetic checks and source colocation do not establish glyph aesthetics, seamless terminal animation, full-film playback, browser equivalence, realistic handwriting, sound/synchronization or user acceptance. New content/width/scale needs new checks.
