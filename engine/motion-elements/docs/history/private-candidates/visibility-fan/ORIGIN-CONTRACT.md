# visibility-fan — private foundation candidate, unregistered

`visibilityFan({bounds:{x,y,width,height},source:{x,y},segments:[{a:{x,y},b:{x,y}}]})`

All coordinates are explicit safe integer lattice units, each in [-1e9,+1e9]. Width/height are 1..1e9 and viewport maximum coordinates must remain within the coordinate range. There is **no silent rounding**. Caller may encode 1 pixel as 64 lattice units, but must record that quantization. Source and all supplied segment endpoints must be strictly inside the rectangular viewport. Up to 64 nonzero segments; no proper crossing, overlapping segment or T junction. Exact shared endpoints are permitted, including collinear continuation. Source must not lie on any segment. A closed obstacle loop is supported as its edges, but checking that a source is outside the filled obstacle is the caller's semantic responsibility: the primitive knows opaque segments, not filled solids.

Output is a frozen source and ordered triangle fan sectors (`source,a,b`) whose union is the **regularized** visibility area. Zero-width visible needles and the effects of purely radial zero-width occluders are not represented. No soft shadow, light falloff, perspective, reflection, continuous-time guarantee or illumination physics. `segmentId` identifies the nearest input edge; 64..67 identify implicit viewport edges.

## Algorithm and numeric contract

BigInt exact orientation and intersection tests validate topology; direction order uses half-plane and cross products, not atan2. Exactly equal angular events merge. Between adjacent event directions, a positive vector sum gives an interior ray. Every edge is tested, and the nearest nonnegative rational distance is chosen by exact cross multiplication. Nonintersecting edges cannot exchange order inside a sector. Each chosen edge is intersected with both **unperturbed** boundary directions. No ±angle epsilon, snapped-event tolerance or floating-point topology predicate.

Only final exact rational coordinates are converted to binary64. At the bounded input scale, the conservative absolute coordinate conversion budget is **1e-6 lattice units**, not zero. Source integer coordinates are exactly representable. Each output triangle must have a positive floating determinant above `4e-6*sum(abs(relative components)) + 16*EPSILON*(abs(product1)+abs(product2)) + 16e-12`; otherwise the query explicitly throws `RangeError: output fan too thin for certified binary64 coordinates`. This is a conservative rejection for output resolution, not geometric merging. Exact predicates do NOT imply exact rendered pixels. Antialiasing seams and compositing are renderer responsibilities, checked separately.

Supporting-line collinearity is legal if the source is off the actual segment. Distinct almost-collinear directions stay distinct internally; unresolved output wedges reject. Exact radial events are handled as regularized boundaries. All queries are stateless and deterministic. Each complete query returns or throws; there is no partial result/cached continuation.

## Resource and data contract

At most 68 edges and 136 unique endpoint directions, hence at most 9,248 interior ray tests; O(n²) exact bounded-integer operations and O(n) output. Integer bit widths are bounded by the coordinate cap. No user callbacks, iterators, random source, allocation controlled by arbitrary dimensions, or runtime dependencies. Ordinary/null-prototype record data descriptors only; exact required keys, no extra/symbol fields. Arrays must be dense ordinary arrays of data slots. Accessors rejected without invocation. JavaScript Proxy traps are not sandboxed by this API.

## Film gating

Before a film: validate actual quantized source positions and input geometry through every frame plus dense path samples; record 1/64 px source quantization and near-neighbor output changes. Endpoint/light-solid semantic checks remain in caller QA. Independent arbitrary interior-ray nearest-intersection oracle must not reuse the production angular partition. Source and frozen films/packages elsewhere remain untouched.
