# Single occlusion raster candidate

Unregistered, direct-import candidate in `lib/support/single-occlusion.mjs`. Not a new catalog foundation, public barrel export, accepted visual recipe or browser guarantee.

## Why this is not another matte

Existing `sampleRasterMatte` scales a source alpha and preserves its RGB. Displacement resamples pixels; temporal exposure weights frames and explicitly does not source-over. Native Canvas already provides painter-order source-over, which remains the simpler choice for a one-off opaque scene. This candidate adds bounded, immutable final pixel composition when a caller needs a raster result: one background, one uncut subject, one coverage mask and a spatially uniform front RGBA color. It reuses existing snapshot storage, copy semantics and raster limits; it does not replace those APIs or implement a general compositor.

## Contract

`sampleSingleOcclusion({background, subject, mask, front:{r,g,b,a}})` returns an existing raster snapshot. All three inputs must be genuine snapshots created by `createRasterSnapshot`, have identical dimensions, and obey its existing resource limits. Front channels are integer bytes. Unknown fields, accessor fields, missing fields, invalid channels, raw/unbranded images and mismatched dimensions fail. Inputs and output inspection buffers do not alias. Mask RGB is ignored; mask alpha is geometric coverage. Effective front alpha equals mask alpha × front alpha. No implicit luma mask, arbitrary front image, blend mode, layer list, transforms, color management or shape generator.

Arithmetic uses straight RGBA8 inputs, accumulates premultiplied contributions in encoded byte RGB and returns straight RGBA8. It is not linear-light or physically accurate compositing. Zero rounded output alpha canonicalizes RGB to zero. Subject remains UNMASKED at input. Background need not be opaque. For coverage f, subject alpha s, background alpha b, weights are f, s(1−f), b(1−s)(1−f); output alpha is their sum.

Opaque front: inverse-matting by (1−m), then painting front coverage m attenuates subject twice at antialiased edges, with subject factor (1−m)². Transparent front is a different failure as well: geometric removal treats partially transparent material as completely opaque under full mask coverage. Even at m=1 it incorrectly erases the subject which should remain visible through the front. Do not describe all transparent-front negative failures as antialiasing alone.

## Validation and limits

Synthetic tests use an independent, sequential floating-point Porter-Duff oracle plus native Canvas painter ordering. Multiple sizes, mask shapes/coverage, subject alphas, front alphas and backgrounds are exercised. Compare final RGBA and final RGB flattened over both black and white, including fractional edges. Byte-rounding tolerance against Native Canvas is up to 3/255 displayed RGB and 1/255 alpha; straight RGB may diverge more at low alpha, so do not treat a transparent pixel's raw RGB as its displayed color. This is current Native Canvas evidence, not cross-browser/platform equivalence. Deterministic pure arithmetic is checked separately. Native tests require the already-supported `MOTIONSTUDIO_CANVAS_MODULE` configuration when Canvas is not installed locally.

No restricted source silhouettes, fonts, artwork, generated previews or private evidence belong in this candidate. Static technical coverage is not motion timing, listening review, visual acceptance or a general-purpose multi-layer engine.
