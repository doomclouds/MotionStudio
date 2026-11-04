# Fixed isometric camera candidate

Small unregistered source candidate. One fixed 30° world-to-screen projection, its inverse on a caller-selected horizontal plane, and positive log zoom. No renderer, timeline, film, palette, fonts or assets. MIT notices and fixed provenance are in [CREDITS.md](CREDITS.md). Publication, production acceptance and visual acceptance are separate decisions.

## Use

```js
import {createIsometricCamera, logZoom} from './isometric-camera.mjs';
const camera = createIsometricCamera({
  width: 1280, height: 720, center: {x: 10, y: 20, z: 3},
  zoom: logZoom(10, 80, 0.5),
});
const [sx, sy] = camera.project(12, 24, 7);
const [x, y] = camera.unproject(sx, sy, 7);
```

Create once when camera parameters change, then reuse for all points. A camera is an absolute immutable snapshot, not mutable state or a playback history. Both methods can be detached and called without `this`. Each call returns a fresh mutable two-number array. Mutating arrays cannot affect subsequent results. `camera.snapshot` and its `center` are independent frozen copies, and the returned camera is frozen.

## Coordinate contract

World axes are fixed: +x projects down-right, +y down-left, +z straight up. Screen +y is down. The center world point maps to `(width/2, height/2)`. Zoom is screen units per world unit along z; x/y projected axes have the same length. Width and height are supplied screen units, not a DOM or device-pixel-ratio query.

For `X=x-center.x`, `Y=y-center.y`, `Z=z-center.z`:

- `sx = width/2 + cos(π/6) * (X-Y) * zoom`
- `sy = height/2 + ((X+Y)/2 - Z) * zoom`

`unproject(sx, sy, z=0)` returns `[x,y]` on the supplied world-z plane. It cannot recover an unknown depth or identify a visible surface. Distinct 3D points on the projection ray share the same screen point. For example, increasing world x, y and z each by the same amount leaves the projection unchanged. Passing a different inverse plane intentionally returns a different world point.

## Strict inputs and arithmetic bounds

Factory accepts exactly `{width,height,center,zoom}`; center exactly `{x,y,z}`. All fields are required, own enumerable data fields in ordinary or null-prototype records. Extra string/symbol fields, missing fields, arrays, class instances, inherited fields, non-enumerable fields and accessor fields are rejected. Accessor getters are never invoked by validation. No coercion. A proxy can execute traps during reflection and is outside the supported input/security boundary; this is not a hostile-object sandbox.

- Width and height: finite numbers in `[1e-6, 1e6]`.
- Center and `project` world coordinates, plus inverse plane z: finite numbers in `[-1e9, 1e9]`.
- Zoom and both `logZoom` endpoints: finite numbers in `[1e-6, 1e6]`.
- `unproject` screen coordinates: finite numbers in `[-1e16, 1e16]`, including large offscreen coordinates at zoom 8000.
- `logZoom` progress: finite number in `[0,1]`. No implicit easing, clipping, clamping or extrapolation. Invalid values throw; numeric violations use RangeError, record violations TypeError.

The bounds guarantee finite arithmetic. Every valid projection fits within the inverse screen-input bound. Inverse results are finite but may exceed the allowed *project input* world range for arbitrary offscreen input at tiny zoom. There is deliberately no clipping of that result; calling `project` on an out-of-domain inverse result throws. A same-plane round trip of valid world points is approximate within floating-point precision, not a bit-exact guarantee. Even a same-plane round trip at an exact world bound may round slightly outside that bound (for example 1e9 to 1000000000.0000002), so a subsequent project call can reject it. Extreme scale ratios, cancellation at large centers, and tiny offsets below representable precision lose detail; use scene-local coordinates and appropriate units. Neither method rounds pixels.

`logZoom(a,b,p)` interpolates the logarithms, giving constant multiplicative ratios at equal progress steps. Endpoints are returned exactly, equal endpoints remain exact. To ease motion, supply already-eased progress in the valid range. Overshooting ease functions are a counterexample: their out-of-range outputs must be resolved by the caller rather than silently clamped here.

## Fit and non-goals

Use for fixed-angle isometric diagrams with world-space geometry and very wide zoom ranges. Do not use for perspective, orbiting cameras, changing tilt, near/far planes, occlusion, depth sorting, backface culling, lighting, local object transforms or pixel snapping. Caller owns geometry, framing, visibility and motion design. Projection alone does not make readable or attractive images.

MotionStudio's existing `motion.transform` applies 2D affine transforms, `projective-quad` solves a four-corner homography, and `composition.plane-parallax` projects calibrated screen-parallel layers; none is this fixed world XYZ projection/inverse-plane pair. Existing `motion.keyframe-track` can interpolate log values already. `logZoom` is only a small two-endpoint convenience, not a new animation or timeline engine. Ordinary position lerp was intentionally not extracted. No foundation, family, registry, catalog or public scope policy is changed by this standalone candidate.

## Dependencies and checks

No runtime dependencies, callbacks, DOM, Canvas, network, file I/O or global mutable caches. Standard ECMAScript modules, `Object.hasOwn` and numeric built-ins; tested with Node's built-in test runner. Browser import requires ordinary ESM support. The factory validates structure once; hot point methods validate only primitive numbers and allocate their output pair.

```sh
node --test isometric-camera.test.mjs
```

Synthetic tests cover axis orientation, plane inversion, two unrelated geometries (stepped prism and antenna lattice), exact zoom endpoints/equal ratios, copied snapshots/fresh outputs, nonsequential evaluation, record/getter rejection and numeric bounds. Tests establish numerical contracts only, not visual quality, real-film use, performance targets, playback, sound, user acceptance or general production readiness. Upstream equation comparison and private film evidence are intentionally outside this candidate.
