# Pure scalar halftone recipe

## Interface

`renderScalarPixels(props)` returns `{width,height,data}`, with fresh Uint8ClampedArray RGBA, alpha255 throughout. `createScalarTile(props,api)` wraps exactly those pixels in a new opaque native Canvas. No caller context is accepted/read/mutated. Compose with ordinary `drawImage`; caller transform/clip/alpha/shadow/blending apply then, intentionally.

Props must be an ordinary own-data object with exactly these allowed fields:
- required integer width,height32–1024, at most1,048,576pixels (4MiB rawRGBA). Native buffers/PNG encoding/intermediates can add memory; this is not a total-process memory bound. Synchronous O(width×height) CPU work; caller owns aggregate/concurrency budgets.
- required field `{cols,rows,values}`: integer cols,rows2–33; dense row-major ordinary Array of exactly cols×rows finite numbers0–1. Values represent samples over the normalized unit square. Catmull-Rom bicubic interpolation clamps overshoot to0–1 and clamps neighbor indices at edges.
- optional pitch4–64 outputpixels, angle−π…π radians, grain0–0.04; defaults10,.3,0 **only when omitted/undefined**. Null, strings, Infinity, NaN and coercion are refused.
- optional palette exact record `{ink,accent,paper}`, each a dense3-number RGB Array0–1; omitted uses the documented implementation default in code. Explicit null rejects. The mathematical palette mapping/vignette/gamma are stylistic, not a scientific color scale or perceptually monotonic quantitative chart.

Unknown keys, symbols, getters, sparse/subclass arrays, inherited indices, custom iterator properties and nonfinite fields reject before rawpixel/finalcanvas allocation. Inputs are snapshotted from own descriptors; no callbacks, toJSON, user map/iterator or sample functions are invoked. The same field object is never mutated or retained. Null-prototype records are deliberately outside this narrower interface. Proxies, hostile native APIs, prototype mutation and concurrent hostile host behavior are outside the trust boundary.

No `flow`, clock, cursor/focus, phase, image sampling, SVG, WebGL, GLSL, GSAP, network, filesystem reads, fonts or reference mesh in the rendering module. Field values are caller data; validation does not certify rights or scientific meaning. `math-internal.cjs` is not a separately supported public API.

## Native / examples

Core has no dependencies. Adapter api is trusted and must supply createCanvas/ImageData. Example runner verifies package name/version0.1.100; not binary cryptographic attestation. Native fault may throw after allocation. All successful factory outputs are new surfaces. No claim of GPU/browser or cross-platform last-bit equivalence for Math.sin/native PNG encoding.

Examples need an absolute **new** directory outside the package; an existing target or final symlink rejects. Ancestors and filesystem writers are trusted; output is not transactional. No files are written by core/tile factory. Two distinct synthetic compositions are demonstrations within one recipe, not two extra works.
