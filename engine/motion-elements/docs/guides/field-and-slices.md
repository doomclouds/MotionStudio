# 解析方向场与分带错位

[返回入口](../../README.md) · [目录与公共 API](../registered-foundations.md)

本页保存对应机制的详细合同、合成示例和已有证据限定。历史批次数量不是当前目录数，已有测试描述不代表本次重新运行或艺术通过。代码片段中相对导入以本页所在目录为基准；shell 命令按各段注明的工作目录运行。

## Experimental: analytic orientation field and masked slice displacement

Two mechanisms, not parameter-count variants. Audit distinction: `fragment.fixed-tiles`
scatters a raster snapshot; `reveal.local-geometry` clips one geometric window;
`motion.shake` perturbs one transform. None provides independent analytic grid
orientations or fixed bilateral horizontal strip displacement.

### `field.attractor-orientation`

```js
const plan = compileAttractorField({
  bounds:{x:0,y:0,width:360,height:160}, columns:18, rows:8
});
const state = sampleAttractorField(plan, {
  attractor:{x:150,y:70}, radial:1, tangential:0.4
});
```

Cell centers and `cellId=row:r/col:c` stay fixed. Positive radial points **toward**
the attractor; positive tangential rotates that direction +90° in local x/y
(Canvas y-down appears clockwise). Normalize the weighted radial and tangential
unit vectors, using scaled coefficients to handle subnormal finite inputs. Each
cell returns `position,distance,direction,angle,defined` plus its ID. Exactly at
the attractor, or with both weights zero, return `{x:0,y:0}`, angle 0 and
`defined:false`; no previous orientation is remembered. The singularity is not
continuous. Samples do not integrate particles, infer video optical flow, simulate
fluids, or report velocity. Distance is local length, not screen-space speed.

Bounds x/y within ±1e6, width/height 1e-6..1e6; each grid dimension 1..128,
at most 4096 cells. Attractor coordinates use the existing ±1e9 point contract;
weights are -1..1. Caller owns time/reduced-motion policy and applies the parent
transform **once**, while drawing local state. No seed is needed: the field is
analytic. Plans are module-branded, copied/frozen; serialized plans must recompile.

### `transition.masked-slice-displacement`

```js
const plan = compileSliceDisplacement({
  width:380,height:170,bands:11,maxOffset:55,seed:'study',instanceId:'panel',
  range:{start:rational(1),end:rational(5)},jitterCycles:3
});
const state = sampleSliceDisplacement(plan, rational(2), {reducedMotion:false});
withSliceDisplacement(ctx, state, drawLocalContent, {Path2D:canvasApi.Path2D});
```

This is a one-content distortion transition, **not** an outgoing/incoming scene
switcher. The caller authors overlap or replacement. Fixed horizontal band IDs
`band:i` partition [0,height] using integer floor boundaries. Odd bands move right,
even bands left. For normalized authored time u, envelope E=sin(πu)²; displacement
is sign × maxOffset × E × [0.75+0.25sin(2π·jitterCycles·u+seededPhase)]. There is no
frame-count random stream, hidden clock or discontinuous frame-index jitter.
`jitterCycles=0` gives a seeded constant amplitude multiplier. |offset|≤maxOffset;
endpoint offsets explicitly equal +0. Before/start and end/after return exact home.
Reduced motion returns home at every time, preserving phase/progress and range.

Width/height integer 1..8192, area ≤16,777,216, bands 2..min(height,256), maxOffset
0..8192, jitterCycles integer 0..32. Seed/instanceId use `seededUnit` limits;
range uses existing rational time validation. High cycle counts in short ranges
can alias: caller must choose duration/frame rate appropriately. Every input
rejects unknown own fields (including symbol and nonenumerable keys), null and nonfinite values. Plan/state are branded and
frozen; catalog contains only data and never executes source strings or callbacks.

Adapter requires explicit native/browser Path2D, clips strips **before** applying
their local horizontal translations, and never reapplies the parent matrix.
At exact identity it calls content once with no added clip: raster equals direct
whole-content rendering with the same incoming context. Content should be authored
within [0,width]×[0,height]; motion clips to that viewport whereas identity does not
clip out-of-bounds content. Transparent holes remain transparent. During motion,
rotated/subpixel parents may show antialiased strip seams; no arbitrary-affine
seam-free guarantee. Every draw is save/try/finally/restore: native transform,
alpha, clip and drawing styles are restored, including on exceptions. This backend's
style getters may retain stale assigned strings after restore; tests check actual
raster restoration. Adapter paths are separate Path2D objects. Callback-owned
current-path mutations, external side effects, unbalanced save/restore, reset() or
canvas resize are outside the restoration guarantee. Callbacks must be synchronous,
reentrant and balanced; they run once per band during motion and must render the
same authored content without advancing mutable animation state. AsyncFunction and
returned thenables are rejected, not sandboxed or rolled back.

`examples/field-slices-scene.mjs` has two semantic examples each: compass needles
and circulating ribbon marks; a signal chart and a complete text card. It exports
`config` and native `createGalleryScene`; render it with
`node scripts/render-gallery.mjs --out /tmp/field-slices-demo --demo field-slices`
(from `engine/motion-elements`). The example is 960×640, 180 frames / 6 seconds. Field
reduced mode freezes the authored attractor; slice reduced mode is identity.
`test/field-slices.test.mjs` covers validation, stable IDs, singularities, subnormal
weights, seek/seed determinism, bounds, native endpoint/reduced raster equality and
context restoration. Experimental technical evidence only: no artistic approval,
hearing approval, cross-backend identity, or independently validated production
transfer is claimed. No reference/media/calibration data is included.
