# Screen-space ink path candidate

Small, unregistered source candidate adapted from LemoLab's Rubber Hose helpers: apply an explicit 2D affine transform, resample a polyline at seven screen-unit arc-length intervals, then displace its samples along a local normal with deterministic value noise. The returned coordinates can feed a caller's actual Path2D. This is not a renderer, timeline, character system, registered family or accepted artwork. Fixed source attribution and both MIT notices are in [CREDITS.md](CREDITS.md).

## Use

```js
import {sampleScreenInkPath} from './screen-ink-path.mjs';
const closed = true;
const points = sampleScreenInkPath({
  points: [[0, 0], [35, 0], [35, 14], [14, 14], [14, 35], [0, 35]],
  matrix: [2, 0, 0, 2, 40, 30],
  closed,
  amplitude: 1.2,
  seed: 23.7,
});
// Caller-side drawing, not part of this module:
const path = new Path2D();
path.moveTo(...points[0]);
for (const point of points.slice(1)) path.lineTo(...point);
if (closed) path.closePath();
ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.lineWidth = 3;
ctx.stroke(path);
```

The caller owns Canvas, device-pixel scaling, stroke width/join/cap, fill, clipping and draw order. Render returned coordinates in the same screen-coordinate system used for `matrix`; applying that object transform again would transform them twice. “Screen units” are the caller's chosen drawing units, not a queried CSS-pixel or physical-pixel size. Boil amplitude is measured in those units, after transforming geometry. No Canvas globals are referenced by the module.

There is one export, `sampleScreenInkPath(options)`. It returns a new mutable outer array of new mutable `[x,y]` arrays, including when boil is disabled or the path degenerates. It never mutates or retains input arrays. The same input and seed give the same values in the same runtime, regardless of previous or out-of-order calls. No `this`, clock, global shape counter, random generator, frame increment, mutable cache or playback history is involved.

## Input contract

Options are an ordinary or null-prototype record with these own enumerable data fields. Only `points` is required. Defaults apply to **absent** fields, not explicit `null` or `undefined`.

| Field | Domain | Default |
|---|---|---|
| `points` | Dense ordinary array of 1..65,536 dense `[x,y]` arrays; coordinates are finite numbers in −1e9..1e9 | Required |
| `matrix` | Dense ordinary `[a,b,c,d,e,f]`; all six finite numbers in −1e6..1e6 | `[1,0,0,1,0,0]` |
| `closed` | Boolean | `true` |
| `amplitude` | Finite number in 0..1e6 screen units | `1.2` |
| `seed` | Finite number in −1e6..1e6 | `0` |

The transform is `sx=a*x+c*y+e`, `sy=b*x+d*y+f`. Reflection, shear, anisotropic scale and singular matrices are permitted. The seven-unit spacing is measured **after** this transform. Reflecting input geometry changes oriented normals as the original algorithm does; nonzero boil is not a reflection-invariant texture. A negative amplitude is rejected, rather than borrowing the upstream helper's nonpositive-amplitude bypass.

Extra string/symbol keys, inherited record fields, sparse arrays, added array fields, typed arrays, array subclasses, wrong tuple sizes, class-instance records, accessor/non-enumerable fields and coercible nonnumbers are rejected. Getter values are not executed during validation. Records and arrays must come from the current realm. Proxies can execute reflection traps; proxies, modified built-ins and hostile object graphs are not a supported security boundary.

Structural/type violations throw `TypeError`; invalid numeric values, array lengths and sample-cap violations throw `RangeError`. There is no clamping, coercion, silent dropping, auto-repair, partial return or fallback drawing.

## Preserved source behavior

- Spacing is fixed at **7**, noise scale at **38**. There are deliberately no extra tunable frequencies or alternate resamplers. The first screen point starts the arc-length carry; open paths append the exact transformed final endpoint before boil. Segments and sample positions are evaluated in source order with the original arithmetic order.
- Zero-length edges are accepted and preserve the carry. A wholly collapsed closed path returns one point; a wholly collapsed open path returns two equal-valued but independent points. One-point inputs follow the same rule. Boil is bypassed for fewer than three resampled points or zero amplitude.
- Closed paths include the last-to-first edge and do not append another first point. A repeated first point in the input is tolerated as a zero-length closing edge, not required. Call `closePath()` yourself. The closing residual can be shorter than seven units.
- Source corners are not automatically retained: samples are evenly spaced along the input polyline, but connecting them can cut across an unsampled corner. Sample-to-sample chord length is not always seven. Tiny details and corners can disappear. This is not a corner-preserving path subdivision or Bézier flattener.
- The local normal is the normalized perpendicular of the preceding-to-following sample secant. Open endpoints use a one-sided secant. A zero secant has zero normal/displacement. **Open endpoints are not pinned** when boil runs; disable boil or handle attachment constraints in the caller if exact endpoint attachment is required.
- With `x=i*7/38`, primary value noise is `vnoise(x+seed)*2-1`. For closed paths it is linearly blended toward `vnoise(x-n*7/38+seed)*2-1` by `i/n`. Secondary noise is `vnoise(x*2.3+seed*1.7+50)*2-1`; this second frequency is not made periodic or blended at the seam. Their weights remain 0.8 and 0.35. These are the upstream seam blend and index-based estimated circumference `n*7`, not a newly periodic noise function or exact arc-length domain. No welded derivative, equal endpoint noise, perfect seam smoothness or topology preservation is promised.
- Noise uses the upstream sine hash and smoothstep value interpolation. Each displacement magnitude is at most `1.15*amplitude` in exact arithmetic; large amplitude can create self-intersections and invert local features. Floating-point cancellation and extreme coordinate/scale ratios can lose small detail. Bounds keep arithmetic finite, not perceptually useful or uniformly accurate. Sine implementations can differ across runtimes, so cross-platform bitwise or pixel equivalence is not promised.

To animate boil, choose stable shape identity and an absolute-frame state in the caller, then pass their deterministic numeric seed. Keeping a seed fixed holds one drawing. Changing it creates another drawing; the module does not interpolate, choose a rate, impose three states or reset shape identity. A film's shape-index policy is not part of this reusable contract.

## Resource limits

Input is capped at **65,536 points**, and output at **262,144 samples**, including the first point and an open endpoint. These are fixed safety limits, not configuration fields or promises of interactive performance. Requests that exceed a cap throw instead of truncating or enlarging spacing. A single edge longer than `262144*7` is rejected before sample allocation; other over-cap paths stop before appending sample 262,145. Geometry allocations stay bounded by the input/output caps. Resampling work is linear in validated points plus emitted/attempted samples, not exponential in scale. Validation reflection scales with the supplied own-key count: an array or record with many extra keys allocates its key list before rejection. This is not a hostile-input memory bound; caller serialization and already-allocated input memory are also outside the geometry bound.

Very large transforms can exceed the sample cap even with a short local path. Reduce geometric screen length or partition intentionally in the caller; partitioning restarts carry and noise index and therefore is **not** equivalent to sampling a single whole path. No hidden partitioning is performed.

## Fit and existing responsibilities

Use for intentionally uneven screen-space cartoon or diagram outlines from already-authored polylines. Do not use when exact corner retention, endpoint attachment, smooth periodic noise, deterministic cross-platform pixels, geometric offset correctness or proof against self-intersection is required. It supplies no splines, silhouette construction, joints, shade model, palette, character geometry, camera, film, assets or fonts.

The existing Motion `geometry.polyline-trail` samples a moving spatial interval on a compiled local polyline and rejects zero-length segments. `geometry.sampled-band` builds a vertical envelope around ordered x samples. Neither combines screen-first equal-spacing with normal noise and this seam policy. Design's `spot-ink-print-candidate` is a raster density-plate/print compositor, not a vector-path resampler. The existing transform and noise concepts are not counted as new foundations here. No engine, registry, catalog or public-source policy is changed by this standalone candidate. Parent navigation links only expose this bounded source package.

## Checks and evidence boundary

No runtime dependencies, filesystem access, browser, network, assets or installation are required. Run with an existing Node supporting ECMAScript modules and its built-in test runner:

```sh
node --test screen-ink-path.test.mjs
```

The tests cover fixed upstream numerical fixtures, open/closed sampling, zero-length edges, closure, endpoint displacement, reflection/scale/shear, zero normals, caps, strict rejection without getters, finite bounds, input/output isolation and out-of-order seeds. Two unrelated synthetic geometries, a stepped tile outline and an open waveform, check finite bounded normal displacements. These are numerical checks, not visual review, real-film execution, playback, performance certification, sound, user acceptance or general production readiness. The fixture decimals are compared with a small tolerance because sine implementations can vary. Actual production inputs, renders, private source locations and comparison reports are deliberately excluded.
