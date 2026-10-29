# Private candidate contract — not public registration

# Absolute-tick sprite atlas — local candidate

No runtime dependencies. One mechanism with three playback modes, not three foundation IDs. Implementation is original code; pre-implementation official concepts and license checks are recorded in SOURCES.md.

## API

```js
const plan = compileSpriteAtlas({
  atlas: {width: 3072, height: 1536},
  frames: [
    {id: 'bud', rect: {x: 0, y: 0, width: 512, height: 512}, durationTicks: 36},
    {id: 'opening', rect: {x: 512, y: 0, width: 512, height: 512}, durationTicks: 12},
  ],
  mode: 'once',
  startTick: 60,
});
const state = sampleSpriteAtlas(plan, 96); // second frame at its included start
```

All ticks are nonnegative safe integers. The caller defines the tick unit (e.g. one tick per60fps frame), consistently for starts, durations and queries. Negative/noninteger ticks are rejected. No float seconds conversion or delta accumulation is performed by this mechanism.

- `once`: before `startTick`, hold the first frame (`phase:'before'`). Intervals are half-open. At total-duration boundary and later, hold the last frame (`phase:'after'`, frameTick equal to its duration). `cycleIndex` remains0.
- `loop`: repeat0…N−1; total boundary chooses0. Only pre-start queries are inactive.
- `pingpong`: repeat0…N−1,N−2…1. First/last frames appear once per cycle, preserving each selected frame's own duration. N=1 remains0; N=2 alternates0,1. Modes do not create new data or interpolate/crossfade cells.

The frozen result includes frameIndex/frameId/rect, frameTick/durationTicks, phase, elapsedTick, cycleTick/cycleIndex and sequenceIndex. `rect` is the immutable source pixel rectangle; it is not a destination rectangle, pivot or verified image handle. Source frames are copied and frozen, and plans are module-instance branded. Reverse/random/repeated query ordering is safe; cloning the JSON does not create a compiled plan.

## Bounds and validation

Atlas dimensions1–8192 each, total declared pixel area at most16,777,216.1–1024 source frames; integer rectangle coordinates and positive dimensions fully contained in the declared atlas. Frame durations1–1,000,000,000 ticks, expanded sequence at most2,000,000,000,000 ticks. Absolute start/query tick up to Number.MAX_SAFE_INTEGER. IDs are unique ASCII strings matching `[A-Za-z][A-Za-z0-9_-]{0,63}`. Rectangles may overlap: the mechanism does not infer gutters or automatic packing.

All accepted records/arrays are ordinary same-realm shapes with exact allowed own fields. Own descriptors are captured, accessors/sparse/extended arrays are rejected without evaluating getters. Input mutation cannot change compiled plans. This is not a claim to sandbox adversarial Proxy traps or arbitrary host objects.

## Pixel identity, alpha and safe caller adapter

The sampler validates declared geometry only. The film must decode the actual atlas PNG, verify its real width/height and SHA, and confirm authored transparent padding. It cannot claim pixel identity from API metadata.

Recommended isolated-cell adapter, evaluated once per source frame, not per output frame:

```js
// atlasCanvas contains the decoded actual PNG; verify dimensions before this.
const rect = plan.frames[index].rect;
const rgba = atlasCanvas.getContext('2d').getImageData(
  rect.x, rect.y, rect.width, rect.height,
);
const isolated = createCanvas(rect.width, rect.height);
isolated.getContext('2d').putImageData(rgba, 0, 0);
// Cache isolated. Playback draws only the selected isolated canvas.
ctx.drawImage(isolated, destinationX, destinationY, width, height);
```

Exact RGBA copy creates an independent surface, so filtering cannot read pixels from a neighboring atlas frame. Alpha remains premultiplied by the Canvas renderer when composited; the adapter does not reinterpret color space or claim cross-platform pixel parity. Transparent padding supports clean art edges, but nearest-cell isolation rather than padding alone provides the neighbor separation. The Native Canvas test uses a red alpha edge beside opaque green and verifies crop bytes, half-alpha, scaled isolated output and no green contamination. That test validates this caller recipe on the installed native backend, not every browser or a nonexistent image-loading API in the core.

## Scope

FIRST BLOOM owns prepainted distinct flower cells and consumes only selected pixel cells at playback. The sampler cannot prove artistic distinction between cells, quality of the animation, sound timing, or actual listening. Those are film evidence. No catalog/index/public publication performed here.
