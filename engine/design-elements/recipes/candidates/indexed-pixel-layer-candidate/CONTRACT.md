# Finite indexed-color contract

## `renderIndexedPixels(spec)`
Pure synchronous rendering, no imports, filesystem, clock, network, fonts or bitmap reads. Returns a frozen record `{width,height,data,layout}`. `data` is a fresh **mutable** Uint8ClampedArray of unassociated RGBA bytes; each call is independent. Layout and its HSV/palette children are frozen detached snapshots. Caller mutation of output pixels is allowed; it never changes inputs or other outputs.

Spec is an ordinary own-data record with only:
- **width** integer 1…1600; **height** integer 1…1100. At most 1,760,000 pixels / 7,040,000 raw RGBA bytes per result, plus model snapshots and provider/encoding overhead. No global/concurrent memory or latency guarantee.
- **model** ordinary record: columns/rows integers 1…256; palette ordinary dense Array of 1…256 exact `#RRGGBB` strings; indices ordinary dense row-major Array of exactly columns×rows integers −1…palette.length−1. −1 means transparent; all other indices select colors, not quantities. Output width/height must respectively be at least columns/rows. No downsampling.
- Optional **hsv** complete ordinary record `{hue,saturation,value}`: finite hue −180…180 degrees, saturation/value −100…100 **percentage-point offsets**. Default all zero. Explicit null or partial records reject.
- Optional **checker** boolean, default false. For transparent cells only, true paints an 8×8 output-pixel checker in #777777 / #555555, alpha 255. The checker is a display aid and is not transformed by HSV. It does not alter the input model.

Defaults apply only when absent or undefined. Null, coercible objects, numeric strings, nonfinite/fractional indices, unknown/symbol fields, accessors, hidden fields, null/custom prototypes and sparse/subclass/augmented arrays reject before raw RGBA or Canvas allocation. Validation snapshots own data; no toJSON/toString or caller array methods are invoked. Proxy traps, hostile changes to built-in prototypes, concurrent input mutation and malicious runtime providers are outside this contract; this is not a security sandbox.

## Pixel mapping and color math
Cell edges are `floor(i * outputDimension / cellCount)`. These integer half-open intervals cover the whole output once, including noninteger upscale factors; neighboring cells may differ by 1 px. No antialiasing, interpolation, image quantization, dithering or palette inference occurs. A transparent cell has all four channels zero unless checker=true.

RGB bytes are interpreted as ordinary normalized RGB values for conventional HSV conversion, not a perceptual/linear-light color system. Hue wraps; S/V offsets clamp to 0…1; RGB reconstruction rounds to nearest byte with JavaScript Math.round. Achromatic colors use hue zero, so adding saturation can color a gray red. Zero shifts preserve input RGB bytes exactly. This is not a verified port of Pixelorama's historical algorithm and does not promise cross-engine/historical last-bit equivalence for floating-point HSV variants.

Maximum model storage is 65,536 indices and 256 colors. Work is bounded by validation O(model cells + palette) and raster O(output pixels). Retaining many outputs multiplies memory; release buffers/layers when no longer needed.

## `createPixelLayer(spec, provider)`
Same model validation, then provider must be an ordinary own-data record containing only `createCanvas(width,height)`, a trusted function. Supply a closure/bound function; no receiver-dependent `this` behavior is promised. The factory must return a new Canvas of the exact requested dimensions with Canvas 2D createImageData/putImageData. Wrong dimensions, missing pixel methods, wrong ImageData storage, and a previously accepted canvas reused by this module instance reject. Provider errors may propagate after allocation.

The adapter temporarily holds the raw RGBA buffer plus an equally sized ImageData buffer (up to 14,080,000 bytes together), in addition to the provider canvas and encoding overhead. This is not a total-process cap. RGBA is copied through putImageData; no font/style/path drawing is used. Returns a frozen `{canvas,width,height,layout}` wrapper; the raster itself remains mutable. A malicious factory could return a preexisting caller canvas on its first call or retain/edit its result: freshness and provider side effects remain a stated trust boundary, not a security guarantee. Always create a fresh offscreen canvas.

No destination context is accepted. Compose with ordinary `ctx.drawImage(layer.canvas,x,y)`. Existing caller clip, transform, alpha, blend, filter, shadow and smoothing apply normally and remain unchanged. Preserve crisp scaling with integer positions and, when resizing a layer, caller-controlled imageSmoothingEnabled=false. This library does not validate arbitrary host composition overflow or claim not to alter destination pixels after a valid drawImage.

## Example runner and scope
Example backend checks the name/version of Canvas 0.1.100, not binary authenticity. Node 22+ required by this candidate; tested platform evidence remains outside the source payload. Font-free means no visual resource setup, not no platform Native dependency for PNG examples.

CLI requires a new absolute output directory outside package and recognized MotionStudio repository. Existing targets, dangling targets and symlink ancestors reject; files use exclusive creation. A merely unrelated ancestor `.git` is not mistaken for this repository. Ancestors/concurrent filesystem writers are trusted and multi-file output is not transactional. The core/adapter writes no files.

No browser, actual Pixelorama app, animation, live interaction, responsive UI, numeric value scale, original image model or public-family promotion is included. Two fixtures are integration demonstrations within one candidate, not two newly approved works.
