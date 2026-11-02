# Bounded field contract

## `planField(spec)`

Pure, synchronous validation and geometry. Accept an own-data plain record (Object prototype or null prototype). Arrays, inherited configuration, accessors, hidden fields, symbol keys and unknown fields are rejected. Omit optional fields to use defaults: explicit `undefined`, `null`, strings in numeric fields and nonfinite numbers are rejected. Frozen inputs are supported and unchanged. Proxies and hostile monkey-patched built-ins are outside the contract; this is not a security sandbox.

| Field | Inclusive accepted range / value | Default |
|---|---|---|
| width | integer 96–1600 logical px | required |
| height | integer 96–1000 logical px | required |
| count | integer 0–20,000 | 3000 |
| seed | integer 0–4,294,967,295 | 1 |
| centerX / centerY | 0–width / 0–height | half dimension |
| radius | 8–800, additionally constrained by envelope below | .46 × min(width,height) |
| aperture | 0–.95, fraction of outer radius | .15 |
| rotation | −2π–2π radians | 0 |
| pointSize | .25–4 logical px | .8 |
| color | exact six-digit `#rrggbb`, case insensitive | #8f7adc |
| opacity | 0–1, per square | .85 |
| exposure | `single` or `lifted` | single |

Scalar limits alone do not imply geometric validity. The conservative disk **plus each top-left anchored square** must fit: `center − radius >= 0`, `center + radius + pointSize <= dimension` on both axes. The same envelope check applies even for zero count/opacity. The 4 px transparent guard is not extra layout room. Radius 800 is an individual ceiling; the maximum height makes it unreachable when the complete disk must fit. No silent crop, clamp, resize or reduction in point count occurs.

Output is a frozen record with normalized settings, `padding:4`, distribution description, and a frozen array of `count` frozen `{x,y}` points. Sampling uses an explicit unsigned 32-bit Mulberry32-style generator, evenly spaced angles `i/count * 2π + rotation`, and **uniform radius**, not uniform disk area. Normalized coordinates are rounded to Float32 before conversion to layout coordinates, as in the source's initial positions. The center is intentionally denser. `count=0` is an empty sample and does not divide by zero. No seed or state is shared across calls.

## `particleFieldTile(env,spec)`

`env` is the same own-data record type, allowing only an own `createCanvas(width,height)` function and optional integer `pixelRatio` 1 or 2 (default 1). All model/environment checks precede any canvas allocation. It creates one offscreen canvas, `(width+8)*ratio × (height+8)*ratio`; squares are drawn source-over on transparent pixels. There is no background fill or source screenshot. Repeated calls return distinct private canvases and handles.

The Canvas provider is trusted: it must return a new, transparent, default-state Canvas 2D object of the exact requested size. Wrong dimensions, a reused canvas from this module, or missing required drawing methods are rejected. The module cannot undo side effects inside a malicious factory or guarantee integrity if that factory retains and edits its canvas. Do not return a caller's existing canvas. Allocation/provider failures can throw; they do not draw into the intended destination because that is supplied only later to `place`.

The frozen handle exposes only `plan`, `pixelRatio`, `pixelWidth` and `pixelHeight`. Its mutable raster is held privately in a WeakMap, not in a public `canvas` property. Copies/fabrications are invalid. Size changes through a retained factory reference are rejected before placement; arbitrary factory-side pixel edits cannot be detected and are outside the trusted-provider contract.

### Alpha semantics

* `single`: normal source-over painting. Opacity is **per square**, not a ceiling on the assembled field: overlapping squares can have larger pixel alpha. Subpixel coverage also changes alpha. RGB is unassociated when read through Canvas, subject to its byte rounding.
* `lifted`: after normal source-over rasterization, map each alpha byte `A` to `round(255*a/(.28+.72*a))`, where `a=A/255`. This is one static contrast/exposure operation, not time integration, glow, motion blur, physical radiance or a live accumulation buffer. Zero remains zero; 255 remains 255. Unchanged nominal RGB may experience Canvas premultiplication rounding.
* Zero count or zero opacity gives an entirely transparent tile in either mode. The four logical-pixel guard is transparent under the trusted Canvas provider before placement; caller blur/shadow/resampling may expand the visible footprint afterwards.

### Resource ceiling

At 1600 × 1000 and ratio 2 the tile is 3216 × 2016 = 6,483,456 pixels, or **25,933,824 RGBA bytes**. Lifted mode additionally requests one same-size image buffer, before provider-internal overhead. Count is capped at 20,000. There is no unbounded loop, network, font lookup, bitmap load or retained frame sequence in the module. Multiple retained handles and provider caches add memory; this is not a global memory or execution-time guarantee.

## `place(ctx,tile,x,y)`

Accept a tile minted by this module instance, finite numeric x/y in −100,000–100,000 and a Canvas 2D context with `drawImage`. Reject invalid handles/coordinates, unavailable drawImage or a resized provider raster **before painting**. Performs exactly `drawImage(privateCanvas,x-4,y-4,width+8,height+8)` and returns `undefined`. It does not change context transforms, style properties, current paths, clipping, font registry or save-stack depth. A drawImage failure itself can propagate from the caller's provider.

The caller chooses whether the field is in front of or behind its content. Existing transforms, clipping, global alpha, composite mode, shadow, filter and image-smoothing settings remain effective. Position may deliberately be off-canvas; this API does not require a target size or invent global overflow validation. Normal target clipping is intentional, not an implicit promise that every composition is fully visible. Destination pixels naturally change on valid placement. Model validation failure never allocates a tile; placement validation failure never draws to the destination.

## What this contract does not cover

No data encoding, random-number quality certification, real sensor sample, Worker/SAB/GPU/FPS claim, responsive layout, browser parity, input interaction, animation, source-scene recreation or public-family registration. The two schematic fixtures demonstrate integration only; they are not parameterized layout components or an owner aesthetic acceptance.
