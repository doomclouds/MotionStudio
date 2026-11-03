# Fixed-layout DAG contract

## Supported input

`bounds` has finite x/y ≥0, positive width/height and must fit the Canvas dimensions. 1–64 nodes and 0–256 edges are allowed. Each node has a nonempty string `id`, a string `label`, finite normalized x/y/w/h, positive w/h, and its rectangle fits [0,1]. Rectangles must not overlap; touching is allowed. IDs are unique and may contain `>`. Edge identity uses an unambiguous serialized pair, not delimiter concatenation.

Every directed edge names existing nodes. Identical duplicate edges, self-loops and cycles reject. An empty edge array is allowed. A DAG is a topology condition only, not a timing, completion or execution claim.

Theme has six-digit hex `ink`, `surface`, `edge`, an already registered plain family name (letter followed by up to63 letters/digits/spaces), and finite fontSize8–64. Labels must fit advance width minus20px, and node height must be at least fontSize+12. This is advance-width and font-size clearance, not full shaped glyph-ink certification; the caller must visually inspect its supported text/font. `focus` is an optional stylistic emphasis, not workflow state.

## Painting and ownership

Caller chooses every node position. Edges are straight bottom-center→top-center lines with fixed9px arrowheads. No auto-placement, port selection, obstacle detection, edge-edge crossing detection, route solving, cyclic layout, text wrapping, shrinking or reordering occurs. Even valid input can produce an occluded or unhelpful diagram; review the result and revise coordinates. A valid DAG may have upward edges, but this painter does not repair their geometry.

All geometry, topology and label-fit prechecks finish before pixel mutation. Measurement restores saved style state on failure. On successful paint, save/restore brackets the drawing. With tested Native Canvas 0.1.100, subsequent fill/stroke pixels, line width and font measurements use the prior drawing state. However, `fillStyle` and `strokeStyle` JavaScript getters can still report the last inner colors after restore: **color-property readback equality is not promised**, and callers must not infer actual restored paint from those getters. The current path is replaced. The method only supports a fresh context with identity transform and default alpha/compositing/clip/shadow; caller-set solid fill/stroke colors, line width and font are covered by the focused regression. It is not a general host-path preserving compositor. The native context, loaded font registry, JavaScript intrinsics and ordinary caller-authored data are trusted. This is not a hostile Proxy/accessor sandbox, no-mutation defense against concurrency, or guarantee against backend exceptions during painting.

Returns bounds, resolved node rectangles and explicit edges plus a static-scope description. Inputs are not modified. It does not read files, fetch assets, use clocks/randomness, or call external services. Fonts, runtime and any screen chrome belong to the caller.

## What was deliberately not extracted

Only the center graph is reusable. Surrounding source cards, manually drawn input buses, metric/status cards, phone previews and slide typography remain case composition. A host that adds such elements must validate/review its own connections; successful center-graph tests cannot certify the entire screen. No source style, branded layout or measured product claim is bundled.
