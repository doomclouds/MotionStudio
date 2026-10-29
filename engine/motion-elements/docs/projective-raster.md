# Four-corner raster projection — experimental

Places an image onto an authored flat quadrilateral, with attachments sharing
the same projection. It is not a true 3D scene or a photo reconstruction system.

```js
import {compileProjectiveRaster, warpProjectiveRGBA, mapProjectivePoint}
  from '../lib/foundations/raster/projective-raster.mjs';
const plan = compileProjectiveRaster({
  sourceWidth: 64, sourceHeight: 48, outputWidth: 96, outputHeight: 80,
  quad: [{x:8,y:4},{x:88,y:12},{x:80,y:72},{x:4,y:64}]
});
const output = warpProjectiveRGBA(plan, image);
const attachment = mapProjectivePoint(plan, {x:32,y:24});
// projectRasterPoint is the same function object as mapProjectivePoint.
```

Four explicit points correspond, in order, to source rectangle **boundaries**
`(0,0), (width,0), (width,height), (0,height)`. Both winding signs are accepted;
reversed winding intentionally reflects the image. They must be strictly convex,
non-crossing and nondegenerate. The implementation solves a unit-square homography
in centered/normalized output coordinates, then inverse-maps destination pixel
centers `(x+.5,y+.5)` to source normalized `(u,v)`. This is one projective map,
**not** two affine triangles, mesh subdivision or a true 3D renderer.

Source interpolation coordinates are `(u*width-.5, v*height-.5)`. Inside the
mapped rectangle they clamp to the outermost source pixel centers, so edges do
not unintentionally lose half their alpha. Outside the source domain the output
is transparent. Numeric domain comparison permits 1e-12 normalized-UV tolerance
at boundaries. Coverage is **hard pixel-center coverage**, not fractional
antialiasing. Color interpolation is premultiplied bilinear in sRGB-encoded
values, with RGBA8 rounding and zero RGB when rounded alpha is zero. There is no
linear-light conversion, supersampling, mipmapping, anisotropic filter or
minification/edge-alias-free guarantee. For strongly shrunk or near-edge-on cards,
the caller must design resolution, prefiltering and viewing review appropriately.

The plan exposes frozen normalized `matrix`, `inverse`, `center` and `scale` for
inspection; these matrices are **not directly in output pixel coordinates**.
Use `mapProjectivePoint(plan,{x,y})` / `projectRasterPoint` to attach project
geometry to the same plane. Helper points must be inside the source rectangle.
It is the same mechanism and adds no count. No automatic corner motion,
front/back swapping, lighting, shadow, depth sorting or occlusion is supplied.

**Bounds and rejection.** Image dimensions are integers 1..4096 and each source/
output area ≤4,194,304 pixels. Quad coordinates are finite within ±16,384. Maximum
quad axis extent must be ≥1e-4. In normalized coordinates every consecutive edge
cross magnitude must be ≥1e-8 and share a sign. The projective solve denominator
and normalized matrix determinant must be ≥1e-12 in magnitude; the affine case
uses a 1e-14 discrepancy tolerance. Source-corner homogeneous denominators must
be positive and their min/max ratio exceed 1e-8. Rejected poses throw: no silent
collapse, fallback triangle, corner reordering or last-valid-frame memory.
Thresholds are finite numeric safety guards, not a universal condition-number
bound or proof of exact geometry on every accepted input.

The returned RGBA covers the whole specified output canvas; drawing/compositing
it, including local Canvas placement, is the caller's responsibility. It is not
a Canvas context adapter and cannot alter caller styles, clips or current paths.
A quad wholly offscreen returns a transparent buffer. No hidden state depends on
call order, wall-clock time or frame number.

## Official research and licensing

Reviewed for public hardening on 2026-10-29, not backdated to original film
production. Original CPU implementation; no copied source/assets or new dependency.

- [MIT Foundations of Computer Vision, Homographies](https://visionbook.mit.edu/homography.html) explains planar projective relations and solving point correspondences. **MIT here is the institution, not a software license**: the [book copyright](https://visionbook.mit.edu/copyright.html) is CC-BY-NC-ND. No book text, figures or code are reproduced.
- User-reference library Three.js at fixed revision `0af9729d0c143a86a1d725d6e2c3ad83301f3f34`: [Vector3.applyMatrix4](https://github.com/mrdoob/three.js/blob/0af9729d0c143a86a1d725d6e2c3ad83301f3f34/src/math/Vector3.js) and [MIT LICENSE](https://github.com/mrdoob/three.js/blob/0af9729d0c143a86a1d725d6e2c3ad83301f3f34/LICENSE) were actually read to compare homogeneous division. That 4×4 3D point method is not this unit-square 3×3 solve or inverse image sampler; no Three runtime is used.

Unlike planar hinge/parallax geometry, this maps actual raster content from four
corners. Unlike displacement-map, it derives a single projective mapping rather
than consuming a per-pixel offset image. The forward attachment helper is part of
the same mechanism, not an additional foundation or a new scene recipe.

## Data, ownership, and safe use

All spec/image/point records must have the current realm's `Object.prototype` and
exactly the documented own data fields (non-enumerable known data fields are OK).
Missing fields, unknown own strings/symbols, accessors, null-prototype records and
class/cross-realm records reject. Kernel/quad arrays must be current-realm ordinary,
dense arrays with only own data indices and the ordinary length property. Array
subclasses, extra properties, symbols, holes and accessors reject before invoking
ordinary field getters. Proxies and modified JavaScript intrinsics are unsupported;
this is data validation, not a hostile-object sandbox.

RGBA input is an exact-length current-realm native `Uint8Array` or
`Uint8ClampedArray` view; subclasses, Node Buffer and foreign-realm views reject.
Subarray offsets are supported. Native metadata accessors determine the backing
buffer, length and offset: custom properties (including shadowed metadata/getters)
on that byte view are ignored, not traversed or executed. Detached invalid views
reject. A fresh ordinary byte view aliases the input for the synchronous calculation;
there is no full-image input snapshot. The caller must not mutate, detach or resize
the backing storage during a call, especially through a worker/SharedArrayBuffer.
Shared storage is accepted only under this caller synchronization obligation.

Plans copy/freeze authored numeric arrays and are branded to their module instance.
JSON copies or plans from another module instance reject: recompile the spec.
Raster outputs are caller-owned **new mutable** `{width,height,data}` records and
`Uint8ClampedArray` buffers, not immutable snapshots. No input pixels are changed or
retained, no time or randomness is read, and there is no Canvas/global-style mutation.
Use caller-owned Canvas ImageData to consume results. No implicit animation,
reduced-motion policy, cache, media loading, font work, or renderer is supplied.

All arithmetic is JS IEEE-754, followed by `Math.round` and RGBA8 clamping. The
numeric contract is not exact-rational math or GPU equivalence. At half-byte
thresholds, tiny float differences may change a rounded alpha by one; when alpha
rounds to zero, RGB is canonicalized to zero, so straight RGB can differ by 255
from an exact-real nonzero-alpha result. There is no blanket all-channel 1-LSB
error guarantee. Temporal/edge aliasing and color judgment require actual viewing.

## Reproduction and validation status

From `engine/motion-elements` run:

```sh
node --test test/convolution.test.mjs test/projective-raster.test.mjs test/postcard-raster-fresh.test.mjs
node --test test/*.test.mjs
```

The public tests use synthetic images and geometry only. They cover validation,
independent numerical references, alpha/edge semantics, ownership and module brands,
resource guards, repeated/reversed calls and fresh-Node Native Canvas consumption.
Actual9-second/540-frame sound-candidate evidence is bound separately. Two convolution calls generate cached outputs, each submitted221 times; blur can be covered and sharp initially has zero/quantized-zero alpha. The same film compiles808 projective plans and draws all991 warped results (540card,268postage,183ink), with1132 attached-point calls. Helpers/parameter modes are not extra mechanisms.

This public source hardens only validation and resource limits; original pixel loops/order are unchanged. A separate copy of the original116-source film substitutes only these two modules: all540 Native usage records,994 actual pixel-put records and2294 actual image-draw source/alpha/matrix records match. These include one project noise texture and other drawing, not994/2294 new-mechanism calls.22 original raw PNGs and22 fresh Node rebuilds match. Original media/source/manifests stay unchanged; this is not a new full encode or all-frame pixel comparison. Source/usage/media identities remain private.

Actual film filter inputs are opaque with preserve-alpha/clamp; other alpha/boundary branches have synthetic tests, not this film coverage. Keep normal-speed NOT_DONE, listening NOT_LISTENED, user artistic PENDING_USER and generic transfer NOT_RUN. Original-film limited decoded-frame inspection does not upgrade these gates.
