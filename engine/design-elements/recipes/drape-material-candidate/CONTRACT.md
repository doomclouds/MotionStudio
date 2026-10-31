# Contract — bounded static drape

## Pure model

`compileDrape({width,height,seed,low,high,vignette?})`:
- width integer160..1000, height integer160..1200; seed uint32 (0..4294967295).
- low/high primitive `#RRGGBB` strings, canonicalized lowercase; no color-name/alpha/coercion parser. They are aesthetic endpoints, not measured reflectance.
- vignette finite0..0.6, default0.3 only when absent/undefined. Null rejects.
- Input is an ordinary or null-prototype record of enumerable own data fields; required fields cannot be inherited/missing. Unknown/string/symbol/accessor/hidden fields reject without invoking ordinary getters. Fields are detached into a null-prototype snapshot. Custom prototypes reject. Proxies, hostile intrinsics or concurrent input modification are outside this trusted-code contract.

Returns an owned, recursively frozen model containing dimensions, normalized colors, seed, vignette, seven parameters, `columns=ceil(width/2)` and `verticalStops=5`. Input mutation afterward has no effect. Recompiling requires the original input fields, not a copied compiled model. Only this module instance's compiled models are accepted by sampling/rendering.

Parameters use Mulberry32: base fold frequency6..12, phase, sharpness, tilt, ripple frequency/phase and bias. The upstream convention deliberately sets phase in0..2π and then multiplies it by2π again inside the main sinusoid; this is retained for provenance, not “corrected” into a different historical formula. Frequency is not a promise of exactly that many visible peaks after ripple and clipping.

`sampleDrape(model,u,v)` takes primitive finite u/v0..1, returns a new frozen `{brightness,rgb}`. Brightness is clamped0..1; RGB are rounded byte mixtures. It evaluates the analytic field **before gradient interpolation and vignette**, not the final rendered pixel. RGB mixing is ordinary channel-space, not linear-light or physical color management. No PNG/Canvas/file/global state is used by these pure functions.

## Canvas adapter

`createDrapeKit({createCanvas})` requires an exact own-data provider record containing a trusted function returning fresh requested-size Canvas2D surfaces with default state. Do not pass a caller's existing canvas. The provider function is called without relying on its `this`; use a closure or bound function. The kit validates dimensions/context methods and rejects a canvas object it has already accepted. It cannot prove a first returned surface is newly created, neutral or not externally retained. Provider errors/side effects may happen after allocation. This is not a sandbox or memory allocator security boundary.

`kit.tile(model,{ratio?})`: only owned models; ratio integer1/2, default1 absent/undefined, null rejects. Options use the same own-data rules. Model/options validation precedes output Canvas allocation. There is no measure/font Canvas. Physical dimensions are width×ratio and height×ratio, up to **4,800,000 pixels /19,200,000 raw RGBA bytes per tile**, excluding renderer overhead/encoding/copies. No aggregate or concurrency memory/time guarantee.

The internal renderer draws disjoint logical columns of2px, with a bounded1px final column for odd width. Each column has5 vertical stops at0,.25,.5,.75,1, then a radial black vignette. Unlike upstream browser code's overlapping3px fills, this study has no deliberate overshoot. Result is opaque and axis-aligned. ratio2 raises raster resolution but does not add horizontal field samples. No image, font, clipping, shadow or text is loaded into the layer.

Returns frozen `{width,height,ratio,model}` handle; backing canvas is private per kit. `kit.png(handle)` returns a fresh provider PNG buffer, requiring `toBuffer`; Native0.1.100 was tested. No general encoder behavior for arbitrary providers is asserted.

`kit.place(ctx,handle,x=0,y=0)` takes same-kit handle and finite primitive x/y in±16384. It issues **one direct five-argument drawImage**, drawing at logical dimensions. It does not save/restore or modify the caller's current path, transform, alpha, style or text state. Existing clip, transform, blend, smoothing, filter and shadow affect appearance; caller owns transformed containment and contrast. A trusted context could retain the canvas argument, so handle hiding is encapsulation, not adversarial isolation. Arbitrary fractional translations/clip/antialiasing, browsers or alternate Native builds are not promised pixel-equivalent. For predictable sharp column boundaries prefer integer logical placement/scale.

## Files, examples, lifecycle

`loadNative` checks installed package name/version0.1.100, not binary integrity. Its external dependency keeps its own notices. No font/resource registry or runtime credential is needed. Examples run with system fonts disabled; geometric label patterns are authored rectangles, not font software. Label helper and CLI IO are internal fixed-example utilities, not general public services.

CLI output is a new normalized absolute directory outside package and recognized MotionStudio repo. A repository is recognized by `.git` plus `engine/motion-elements` and `engine/design-elements`; an unrelated ancestor `.git` is not blocked. Live/dangling target symlinks and any symlink/nonregular parent are rejected; parent must exist. Concurrent filesystem changes/hostile ancestors are not sandboxed. Buffers are prepared before directory creation; exclusive per-file writes do not promise rollback after disk failure.

No time parameter, animation, cloth dynamics, 3D, media playback, browser/interaction tests, arbitrary typography layout, accessibility certification or original-product affiliation. Changing seed selects a different static field; it is not a validated continuous motion mechanism.
