# Numeric and raster contract

## One data model
`createVolume({size,values,cursor,thresholds})`: exact same-realm ordinary or null-prototype own enumerable data record. Arrays must be ordinary dense own enumerable data indices, no extra keys/symbols/custom iterator/accessor. No getters or coercion are invoked by validation. Trusted JS intrinsics/global prototypes; this is not a Proxy/replaced-builtins sandbox.

size three integers2..64, product<=65536. values ordinary array exactly product integers0..255, ordered `(z*ny+y)*nx+x`; caller inputs copied to a private Uint8Array. cursor three integers0..axis−1. thresholds one..seven strictly increasing integers1..255; equality belongs to the upper bin. Complete counts include all cells. Sum is exact within this budget, mean is sum/total, not a physical unit or probability inference. No input labels, image, patient data, graph import, reference mesh or medical segmentation.

Opaque same-module handles only. `inspect` returns frozen detached arrays and same cursor cell. `cell` validates coordinates and returns fresh frozen value/bin. `moveCursor` shares private immutable values/statistics and changes only cursor, leaving the old handle unchanged. There is no exposed mutable data buffer.

`slice(model, plane, index?)`: primitive xy/xz/yz; default index cursor z/y/x. Explicit index must be integer on that axis. xy:(u,v)→(u,ny−1−v,index); xz→(u,index,nz−1−v); yz→(index,u,nz−1−v). Cell centers are +.5. Output frozen arrays/counts/sum/selected. For an explicit noncursor index, `cursorOnSlice=false`: selected is still the model cursor, not a claim it lies on that slice. The renderer omits its crosshair. Slice counts and whole-volume counts are distinct, never interchangeable.

## Two restricted visual components
`createKit(api)` accepts a trusted Native Canvas-like factory, not an authenticated resource object; there are no font/assets to authenticate. `sliceTile(model,plane,options,index?)`, `histogramTile(model,options)` use exact options {width,height,ratio,palette,background}. Width120..1200,height120..1000 integer; ratio exactly1/2; <=2400000 backing pixels. Palette exactly number-of-bins RGB triplets of integer0..255, background RGB. Inputs and model/options are fully checked before result or intermediate canvas allocation.

Slices fit without crop inside12px margins; nearest-neighbor discrete values, square cell aspect, letterbox background. Color per channel=round(.8*binColor+.2*value). Background opaque; all cell pixels opaque, even value0. Default-on-slice crosshair white1logicalpx, arm min(5,.45*cellScale); purely cursor indicator, contrast not guaranteed for arbitrary palette. Histogram uses full-volume fractions, 12px inset,6px gaps; exact fractions/geometry in `plan`. Zero-count bars have zero height. No automatically generated text, axis scale, legend or nonvisual equivalent.

`place(ctx,tile,x,y)` accepts only same-kit handle, finite coordinates±16384, single save/drawImage/restore with finally; current path untouched. It inherits host transform/clip/alpha/composite/filter/shadow/smoothing; not appearance isolation. `tile.canvas` intentionally mutable; `plan` frozen. `png(tile)` snapshots the current mutable backing. Numeric metadata will not track caller mutation of Canvas pixels.

Native dependency0.1.100 pinned for tests, DISABLE_SYSTEM_FONTS_LOAD=1 for runtime helper. No font registry operations. Single-tile budget excludes raster intermediate<=4096px, encoding/JS overhead and caller allocations; no aggregate/concurrency memory budget or dispose. Same-environment cold exact is not a universal AA/decoder/fractional-clip/transform guarantee. Trusted factories, filesystem and single writer; no TOCTOU/security sandbox or browser/accessibility certification.
