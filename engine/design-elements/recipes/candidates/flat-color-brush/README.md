# Original flat-color brush · source candidate

Original tool illustration and code, Copyright (c) 2026 Palink, under the complete [MIT license](LICENSE). Not derived from third-party pen artwork. This source-only candidate adds no registered family, formal recipe, portfolio work or media exception. The existing three pen renderers remain unchanged. Technical validation is not artistic acceptance.

## API and contact geometry

[index.mjs](index.mjs) exports `drawFlatColorBrush(ctx, options)` and Canvas-free `flatBrushGeometry(options)`. Both return the same immutable geometry; drawing owns **only the tool**, never ink, timing, hatch planning, camera, story, physical paint or coverage guarantees. No dependencies, I/O, time, randomness or caches in the core.

Required `x,y` are the nominal ferrule origin, finite numbers in ±1e6. Optional fields (defaults apply only when absent):

- `angle`: −2π..2π radians, default 0, normal Canvas rotation. Axis u=(cos(angle),sin(angle)); edge axis v=(-sin(angle),cos(angle)).
- `length`: 60..260, default 140, the complete longitudinal extent from −0.18*length to +0.82*length, not origin-to-tail distance.
- `width`: 6..48, default 18, actual bristle-edge length independent of length.
- `color`: exact six-digit #RRGGBB, default #357d86.
- `lift`: 0..1, default 0. Visible tool shifts in caller-local negative Y by 0.14*length*lift. Any positive lift means no contact.

Only plain or null-prototype records with known enumerable own data fields are accepted. Explicit undefined/null, getters, Symbols, hidden/unknown fields, special prototypes, nonfinite/out-of-range numbers and coercion are rejected before Canvas work. Hostile Proxy/Canvas objects are outside the trust boundary.

Returned record and nested geometry are frozen: `nominalOrigin`, `visibleOrigin`, `visibleEdge:{a,b}`, `edgeBounds`, `toolBounds`, `contact`, `contactEdge`, `basis:{axis,edge}`, `width`, `length`, `lift`, `toolOnly:true`. All coordinates precede the caller's parent Canvas transform.

With visible origin O, edge endpoints are exactly O−0.18*length*u ± width/2*v, actual colored bristle vertices. At lift=0, visible and nominal origins coincide, `contact=true`, and `contactEdge===visibleEdge`. At lift>0, nominal origin remains fixed while visible edge/bounds move; `contact=false` and `contactEdge=null`. A finite-width zero-depth segment is not a deposition model.

For a desired down contact center C, use nominalOrigin=C+0.18*length*u. For horizontal rows, angle=0 gives a vertical contact edge. Sweep horizontally in either direction without flipping the tool by π. A straight butt-ended ribbon is the quadrilateral joining starting/ending edge endpoints: no implicit round cap. Curves, turns, joins and general angled sweep areas require separate caller geometry; moving parallel to the edge is degenerate. Never add ink during a lift.

## Canvas and bounds

Requires an existing Canvas 2D context with save/restore, translate/rotate, path polygon and fill operations. Inherits parent transform, alpha, composite and clip; suppresses ambient shadows internally. All saves restore in finally, including exceptions. The current path is replaced and already drawn pixels cannot be rolled back after backend failure.

No filter is read, changed or supplied. Callers requiring literal bounds must provide an unfiltered context. `toolBounds` is the exact caller-local AABB of vector silhouette vertices, not a device pixel box. Tests bound every occupied unit pixel cell within this AABB expanded by one device pixel per side, **only for identity transform, unfiltered Native rendering**. This AA allowance does not enlarge contact geometry. Transform/scaling/filter behavior and arbitrary clip antialias identity are not guaranteed across backends. Native getters may cache styles: restoration tests inspect subsequent painted pixels rather than rewriting stale getters.

## Two synthetic consumers

[examples/consumers.mjs](examples/consumers.mjs) independently demonstrates a straight color-sample ribbon and a concave L-shaped paper patch built from five clipped alternating horizontal rows. Each uses caller-owned quadrilaterals and the actual edge; patch returns are lifted and add no ink. There is explicitly no final whole-shape fill/replacement. These bounded font-free examples are not a hatch/painting engine or a general shape-coverage algorithm. `showTool=false` isolates the caller's paint for tests; default true draws the tool. Fraction is finite 0..1. At completion the patch tool is lifted.

[test/geometry.test.mjs](test/geometry.test.mjs) runs without Native. [test/native.test.mjs](test/native.test.mjs) uses the existing portable Native loader with an optional preinstalled dependency. Missing Native skips raster tests; this is not a pass for those checks. An explicitly supplied but invalid module path fails rather than skipping.

```sh
node --test engine/design-elements/recipes/candidates/flat-color-brush/test/geometry.test.mjs
export MOTIONSTUDIO_CANVAS_MODULE=/absolute/path/to/installed/@napi-rs/canvas/index.js
node --test engine/design-elements/recipes/candidates/flat-color-brush/test/*.test.mjs
```

In a portable package substitute `runtime` for `engine`. Node 24 is the repository baseline; no dependency installation or network is performed. Tests generate no files. No generated images, fonts, films, private reports or production context are distributed. Width6/length260 is needle-like and width48/length60 squat; valid bounds do not mean good art. Physical bristle flex, wetness, continuous motion, full-film review, actual listening, browser/cross-backend behavior and user aesthetic acceptance are not established.
