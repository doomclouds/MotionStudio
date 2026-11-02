# Byte field and linked views contract

This is one bounded static diagnostic composition, not a new field/histogram family, live monitor, GPU shader, renderer of an upstream application, or arbitrary image inspector.

## Pure model

`buildScalarField({width,height,mode?,phase?})` from `model.mjs` has no filesystem, Canvas, font, network, image or clock dependency. Width integer32..1600, height integer32..1000; maximum1,600,000 scalar samples. Mode is primitive `split-ramp` or `wave`, default split-ramp. Phase is finite0..2π, default0; split-ramp only permits0.

At u=x/(width−1),v=y/(height−1), the original formulas are:
- split-ramp: `.12+1.1*u` for u<.5, otherwise1;
- wave: `.5+.3*sin(2π*(2u+v)+phase)+.17*cos(2π*(u−2v)−phase)`.

Every raw value is clamped0..1 and rounded to byte0..255. The private Uint8Array drives all statistics:32bins indexed by byte>>3, count, integer sum, min/max, mean, zero count and255 count. This is 8-bit grayscale in the displayed byte domain, not calibrated luminance, scientific measurements, image analysis or a physical wave model. `phase` is an explicit static input, not elapsed playback time or a seamless-loop guarantee across floating-point evaluations.

`sampleField(model,x,y)` requires this module's real model and integer coordinates in bounds. It returns frozen x/y/value/normalized=value÷255. `copyFieldRGBA(model)` returns a fresh mutable Uint8ClampedArray, R=G=B=the byte,A=255; changes to the copy do not affect any model. Metadata is detached and deep frozen, private bytes stay in a WeakMap. Copies/forgeries/another module instance cannot substitute for a model. No public arbitrary-byte import exists.

Records accept ordinary or null prototypes and only documented own data keys. Known non-enumerable data is snapshotted, not lost. Symbols, extra keys, accessors, coercible values and malformed primitives reject. Omission/undefined selects documented defaults; null does not. Reflection on hostile Proxies, modified intrinsics and concurrent mutation are outside the contract. Invalid model parameters reject before allocating its byte buffer.

## Runtime and typography

`loadNative()` reads this package's installed `@napi-rs/canvas` version and requires exactly0.1.100. This is not native-binary attestation. `loadEnvironment(api,{fontPath})` accepts a trusted Native API, a normalized absolute external regular font path (no lexical dot/parent segments) and no other options. Resource file and ancestor symlinks reject, as do font paths inside this package or a recognized MotionStudio repository. Unrelated ancestor `.git` is not itself a MotionStudio repository.

The complete `font-lock.json` SHA is pinned in trusted runtime code. Only exact unmodified LiberationSans-Regular2.1.5 bytes are accepted; no fallback/network fetch/automatic substitute. One alias ByteDiagnosticSans400 registers from the verified buffer. False registration or absent family fails. The returned frozen env is branded to the exact supplied API. Trusted dependency/global font registry and race-free filesystem remain assumptions; registration is process-global and not transactional. Missing resources/lock fail before registration; changing trusted source is not a threat model.

Fonts are external **provide-exact**, not bundled. Full OFL and distribution notice are supplied. Exact public download recovery was not verified. Changing font/version is a new typography verification task. CLI and tests set DISABLE_SYSTEM_FONTS_LOAD=1 before loading Native; a caller who supplies a preloaded API owns that environment.

## Views

`createDiagnosticKit(api,env)` requires the same verified pair and creates one private1×1 measurement surface. Syntax/layout errors reject before allocating an output raster, not before that setup probe. The factory must provide fresh default-state correctly sized Native canvases.

- `createFieldLayer(model)`: full model-sized opaque grayscale raster; no resizing or overlays.
- `planHistogram(model,{width,height,accent?,background?})` / `createHistogram`: width integer200..1400,height120..700. Both colors are exact #RRGGBB; any hue, including green, is legal. Defaults blue/charcoal.32bars, x-domain0..255; bar height is count/maxBinCount, NOT density or percentage. One largest-count label and endpoints; not an arbitrary axes/label/scale engine. Text color stays light: caller must select a suitably dark background; arbitrary palette contrast is not guaranteed.
- `planSampleNote(model,{x,y,width,title?})` / `createSampleNote`: valid sample coordinates,width integer260..640,height108. Title1..40 nonblank printableASCII chars; default Bounded CPU sample. Title and derived coordinates/byte/mode/no-GPU statement have fixed15px typography. Actual Native ink bounds plus1px raster guard must fit. Character limits are not a guarantee that all strings fit at all widths. No wrapping, shrinking, ellipsis, Unicode shaping or arbitrary typography.

Plans are frozen. Returned tile wrappers are frozen, but **tile.canvas is intentionally mutable caller-owned output**. Altering a tile can make it disagree with the model; the guarantee concerns fresh constructor output. Each call produces a new output, no retained shared raster/cache. `tile.place(ctx,x,y)` accepts finite primitive positions±1e6, saves/draws/restores even if drawing throws, with no path operations. Caller transform/clip/alpha/filter/shadow/blend are inherited and preserved, not neutralized. Caller owns placement containment, reading contrast, scaling and overlap.

Worst model byte storage1.6MB and each RGBA copy6.4MB coexist with snapshot/native/ImageData/encoding overhead. Histogram max980,000 pixels; note max69,120pixels. These are per-call sizes, not RSS, concurrency or frame-rate guarantees. Keeping many model/tiles increases memory until callers release them.

## Examples and output

`renderExamples` composes two trusted fixed lessons:1200×760 side-by-side ramp and1440×900 panoramic wave with bottom diagnostics. New synthetic inputs, counts and sample locations differ. The visible crosshair is a separate host overlay at the sampled pixel center; histogram/statistics describe the underlying grayscale bytes, not the crosshair or page typography. Example captions use the same model; neither is a separately commissioned/owner-approved work.

`render.mjs /absolute/new-output` requires a new directory outside the package and recognized MotionStudio repo, under already existing nonsymlink parents. Existing/live/dangling targets reject; output leaves are exclusive writes. Existing unrelated `.git` directories are allowed. All scene rendering completes before creating the output directory. Physical I/O failure may leave partial products; no concurrent-writer sandbox or multi-file transaction is promised.

No automatic publish/registration; no screenshots, upstream full sources, private IDs, fonts or image assets in the source package. The new candidate and any later motion use require their own review. Only finite static and random-access model tests are currently claimed, not browser, animations, audio, long-loop performance or universal cross-platform raster identity.
