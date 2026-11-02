# Complementary seam contract

## Core / input domain
`index.mjs` exports only `createSeamModel`, `ownerAt`, `partitionPixels`, `createSeamEngine`. Own-data plain records (Object.prototype or null prototype), no unknown keys, symbols, accessors or missing required fields. Exact ordinary dense arrays with canonical own indices; no holes/extra keys. Snapshot appends create own data indices and do not consume inherited numeric getters/setters. Ordinary built-in intrinsics, prototypes and a truthful Native API are trusted; this is not a Proxy, hostile-global or concurrent mutation sandbox.

Model: width and height integers 16..1600; product ≤1,000,000. Primitive axis string `horizontal` or `vertical`. `points` has 2..65 exact `{u,v}` integer records. `u` strictly increases from 0 to the full longitudinal extent; `v` is 1..crossExtent-1. Horizontal means u=x/v=y, vertical means u=y/v=x. Corners/steps are piecewise linear, not a random tear. The monotone seam separates exactly two connected geometric regions. No branches, holes, arbitrary polygons, multi-piece segmentation or intersection solver.

Models are deeply frozen issued handles. Copies/forgeries are rejected. Pixel owners are stored privately. Source bytes are **not** stored in the model. `ownerAt` accepts only integer canvas addresses and returns `before` or `after`. Before means above a horizontal seam or left of a vertical seam.

## Exact semantics / intentional distinction
At each pixel center `(u+0.5,v+0.5)`, choose before iff the center is strictly below the seam value in scalar cross-coordinate; equality goes to after. Cross multiplication uses exact bounded integers (no geometric epsilon). Every pixel has exactly one owner, irrespective of its alpha. `beforePixels + afterPixels == width*height`.

`beforeArea2` is the exact sum of `(v0+v1)*(u1-u0)`; `afterArea2` is its complement to twice plane area. These are **doubled ideal geometric areas**, not pixel counts, alpha coverage, material yield or a statistical quantity. Pixel-center ownership can disagree with ideal area; neither is substituted for the other.

`partitionPixels(model,pixels)` requires an ordinary Uint8ClampedArray backed by a nonshared ordinary ArrayBuffer, exactly 4*width*height elements. An offset view is allowed; typed-array getters are read intrinsically. Each source sample's four raw bytes are copied into its sole owned output. All four bytes of its other output are zero. Raw RGB under zero alpha is retained in the owning pure array. The returned record is frozen; the two new arrays are intentionally mutable, independent of the caller and future calls. Source contents are read at invocation, not snapshotted by model creation. No source sampling/resizing/cropping/filtering is done here.

The new examples explicitly call the existing exact `sampled-window` method *before* partitioning. Sampling and seam ownership are separate stages. Core has no font, image file, disk, network, random seed, timer, animation, SVG/DOM or upstream runtime.

## Native tile / host contract
`createSeamEngine({createCanvas,ImageData})` trusts a new correctly sized transparent Canvas factory and Native ImageData constructor. `tiles` validates the issued model and exact plane before any result Canvas allocation, partitions pixels, then makes two plane-sized transparent backings with putImageData. No smoothing, border, shadow, transform, title or per-part trim is built in. Returned wrappers are frozen but Canvas objects mutable; callers can alter later placement. Total RSS/time are not guaranteed; at maximum model the owner map is 1MB and returned pure bytes total 8MB, plus input/backend overhead.

`tile.place(ctx,x=0,y=0)` requires finite numeric coordinates of absolute value ≤1e6 and makes one drawImage. It preserves the caller's current state/path by not changing them, and intentionally inherits transform/clip/alpha/composite/shadow/smoothing. Caller owns viewport, transforms, overlap and separation. Independently moved parts need not be disjoint on screen. This is not a general collision-free layout or transform-fitting promise.

Pure arrays are the exact byte oracle. Native premultiplication, zero-alpha hidden RGB, interpolation and PNG decode can change bytes; do not use Canvas source-over to reconstruct arbitrary transparent raw pixels. Aligned opaque pieces are tested for exact reconstruction. No arbitrary translation/rotation/backing/PNG decode equivalence, universal AA bound or smooth physical edge promise. Integer raster seam is deliberately hard-edged before host resampling.

## Examples and command-line scope
Fixed example labels use an exact full Instrument Sans OFL master; actual TextMetrics bounds are checked against the whole example canvas, not an automatic typography/collision/wrapping API. Core remains font-free. Existing sampler inputs and example font must match fixed bytes. Source code/intrinsics, module loader and lock-check implementation are trusted; the native module path is a trusted installed dependency, not a general package authenticity verifier.

Render/package/prepare outputs must be absent absolute normalized paths outside this package with existing regular parent and no live/dangling symlink ancestors. Package inputs are the exact static regular-file whitelist, fully preflighted before output. Unknown nested content is ignored, not discovered. No recursive assets/fonts collection. These gates are not filesystem race/TOCTOU isolation or arbitrary process security.

All visuals and numbers are original synthetic static teaching content. No real puzzle reachability, geological observation, paper mechanics, brand affiliation or mature user-tested design system is implied. 0 formal families, 0 registrations; review and authorization required before any integration.
