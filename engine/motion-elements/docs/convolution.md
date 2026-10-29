# Neighborhood convolution — experimental

Softens noisy raster details or creates a controlled unsharp accent. It cannot
recover detail absent from the input.

```js
import {compileConvolution, convolveRGBA} from '../lib/foundations/raster/convolution.mjs';
const plan = compileConvolution({
  kernel: [[1,2,1],[2,4,2],[1,2,1]],
  boundary: 'clamp', effect: 'blur', amount: 1, alphaMode: 'preserve'
});
const result = convolveRGBA(plan, {width, height, data});
// Same neighborhood mechanism, not another foundation:
const sharpen = compileConvolution({
  kernel:[[1,2,1],[2,4,2],[1,2,1]], boundary:'clamp',
  effect:'unsharp', amount:.4, alphaMode:'preserve'
});
```

**Mathematical contract.** Dense odd-height/odd-width kernels, each 1..25, finite
weights 0..1e6 with positive sum. Weights are copied and normalized by their sum.
The source sample is `(x + centerX - kernelX, y + centerY - kernelY)`: this is
actual convolution (flipped offsets), **not correlation**. An asymmetric-kernel
regression distinguishes them. There is no signed arbitrary-kernel/Laplacian mode.
`blur` amount is 0..1; `unsharp` amount 0..2. Unsharp is source + amount ×
(source − normalized neighborhood color), clamped to RGBA8. It is an ordinary
unsharp-mask operator, not deconvolution, superresolution or missing-detail recovery.

RGB filtering and bilinear operations are performed in **sRGB-encoded numeric
values**, not linear-light color. This choice is explicitly non-photometric.
For each neighbor, color is multiplied by its alpha and normalized kernel weight;
neighborhood color is divided by the resulting weighted alpha coverage, when
nonzero. Hidden color in fully transparent input pixels cannot bleed into the
neighborhood. RGB is canonicalized to zero whenever the output alpha quantizes
to zero, including amount=0; invisible RGB bytes are not preserved.

`alphaMode:'preserve'` retains original alpha exactly and operates on color only.
It does **not** diffuse a silhouette. `effect:'unsharp'` requires this mode.
`alphaMode:'filter'` is available only for blur: filtered premultiplied color and
alpha are interpolated with original premultiplied color/alpha by amount, then
unpremultiplied. It can spread/attenuate alpha. `boundary:'clamp'` extends edge
pixels; `boundary:'transparent'` supplies zero RGBA outside. Transparent boundary
with preserved alpha does not darken the supported neighborhood by an implicit
opaque-black border. These policies are explicit alternatives, not synonyms.

No temporal state, hidden cache, automatic blur-radius selection or in-place
mutation. Applications may cache the result of a static image/filter call or
compose several calls; composing blur passes is not a new mechanism. Amount and
kernel changes need explicit new plans. This synchronous function must not be
raced with external writes to the input buffer.

## Bounded work

Images require integer dimensions 1..4096 and area at most 4,194,304 pixels.
Additionally, `imageArea * kernelWidth * kernelHeight <= 64,000,000` is required
**on every raster call**, including amount zero, sparse/zero-valued weights,
and fully transparent images. Excess work rejects before allocating the output.
The budget counts declared cells, not nonzero weights. A 25×25 kernel therefore
permits area at most 102,400. This bounds work, not milliseconds; no real-time or
constant-memory performance claim is made. Keep static-image results in caller
caches if appropriate, and release large results when no longer needed.

## Official research and licensing

Reviewed for this public hardening on 2026-10-29, not claimed as the original
film-production research history. The implementation is original; no upstream
code or media is copied and no runtime dependency is added.

- [OpenCV 4.11 filter2D documentation](https://docs.opencv.org/4.11.0/d4/d86/group__imgproc__filter.html): its operation is correlation; kernel reversal distinguishes convolution. OpenCV 4.11 [LICENSE](https://github.com/opencv/opencv/blob/4.11.0/LICENSE) is Apache-2.0. This is not an OpenCV wrapper or a claim of OpenCV bit parity.
- User-reference library Three.js, fixed revision `0af9729d0c143a86a1d725d6e2c3ad83301f3f34` (r180): [ConvolutionShader](https://github.com/mrdoob/three.js/blob/0af9729d0c143a86a1d725d6e2c3ad83301f3f34/examples/jsm/shaders/ConvolutionShader.js) and [MIT LICENSE](https://github.com/mrdoob/three.js/blob/0af9729d0c143a86a1d725d6e2c3ad83301f3f34/LICENSE) were actually read. Its GPU shader traverses a one-dimensional texture-increment kernel; it does not supply this CPU positive-2D-kernel, explicit-alpha, flipped-offset contract. Its source notes an o3d sample origin; none was copied.

Existing matte applies coverage, channel transforms operate locally, and
map displacement samples authored offsets. This neighborhood aggregation is a
different operation. Blur/unsharp and alpha/boundary options remain one mechanism.

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

A concrete IEEE boundary regression: normalized kernel `[[1,97,0]]`, transparent boundary/filter-alpha/blur amount1, input pixels `[0,0,0,0]` and `[255,50,20,49]`. The first exact-real weighted alpha is49/98=0.5, but the implemented normalized-weight multiplication gives0.49999999999999994; alpha rounds to0 and RGB becomes0. This explains why RGB error need not be1LSB without changing the stated IEEE algorithm.
