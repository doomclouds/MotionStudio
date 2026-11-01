# Bounded static API

## Input and identity
Plain records have exactly the listed **own data** fields. Unknown string/symbol keys, inherited required fields, own accessors, null, missing/undefined and coercing/boxed values reject. No options have implicit defaults. Ordinary arrays have only length plus dense canonical own data indices; holes, `01`, extra keys/symbols/accessors reject. Input is copied/frozen; later caller mutation cannot change the model. Standard JS intrinsics are trusted; Proxies and deliberately replaced builtins are not an isolation promise. Numeric Object/Array/String prototype properties must not influence core model/plan construction.

Models are immutable issued handles. JSON-cloned/forged models reject; reconstruct using the public constructors. Plans are issued by a particular kit and cannot be used by another; tiles likewise. Geometry invalidity is checked before result Canvas allocation. The kit itself allocates no measuring canvas, reads no files and registers no fonts.

## Run matrices
`createRunMatrix({rows})`: 1..32 primitive binary strings, identical width 1..64, at least one 1. It returns owned rows, width/height, maximal 1-run segments and counts. `bits` counts 1 cells; `singles` counts runs of span1, `bars` counts longer runs. These are logical authored geometry, not physical rendered pixels, OCR, content semantics or quantitative evidence.

`runPlan(model,{cell,rowGap,thickness,padding,color,pixelRatio})`:
- cell integer8..80, rowGap integer0..40, thickness integer1..floor(.75cell), padding integer4..64.
- color primitive opaque #RRGGBB; pixelRatio integer1..3.
- logical width = columns*cell+2padding; height = rowCount*(cell+rowGap)-rowGap+2padding.
- run x=padding+(column+.125)*cell; y=padding+row*(cell+rowGap)+(cell-thickness)/2; width=(span-.25)*cell, height=thickness, radius=thickness/2.
Single-cell runs are short capsules, not necessarily circles. Empty cells have no paint. Runs are never joined across row boundaries. No dictionary, wrap, ligature, vertical text, arbitrary curve or automatic legibility promise.

## Nested squares
`createNestedTile({layers})`: 1..8 records `{inset,color}`. inset integer basis points0..4800; first0, strictly increasing thereafter; color primitive opaque #RRGGBB. Square area numerator=(10000-2inset)^2, denominator100000000. Each visible band numerator subtracts the next inner square; last retains its full area. Areas telescope exactly to the outer square. Same colors may make a logical band invisible; no perceptual distinctness promise.

`nestedPlan(model,{size,padding,pixelRatio})`: size integer8..1000, padding integer4..64, pixelRatio integer1..3. Each layer is drawn over earlier squares; x=y=padding+size*inset/10000, side=size-2*size*inset/10000. Overall logical tile side=size+2padding. Native antialiasing of fractional edges does not equal exact vector area; area captions are **ideal geometry, not raster coverage or material purchase quantities**. Inner layers can be subpixel at small sizes and need not remain visibly distinguishable. No seed, motifs, reserved cells, texture, corner radius or adaptive field generator.

## Shared bounds / composition
Logical width,height≤2400; physical width,height≤4096; physical area≤6,000,000 pixels including integer pixelRatio. These bound one result, not cumulative RSS, caller context or unlimited retained canvases. `tile(plan)` needs a trusted fresh transparent Canvas factory. Returned wrapper frozen, backing pixels mutable. `place(ctx,tile,x,y)` accepts finite primitive coordinates |value|≤1e6, uses direct drawImage to logical tile dimensions, deliberately inherits host transform/clip/alpha/composite/shadow and does not mutate state or current path. It does not guarantee fit on the host, no collisions or lossless PNG decode equivalence. Layout and semantic color choices belong to caller.

No universal translation/raster-equivalence, accessibility, trademark uniqueness, motion or user-aesthetic approval. Tests are finite observations; author/model exhaustive cases cover only their declared subdomain.

## Example and CLI boundary
Example compositions are trusted fixed arrangements, not more public APIs. Their supporting caption text is measured with the exact complete Instrument Sans default master and fit-checked before output; not a generic text engine or arbitrary font injection contract. Core remains font-free. Example loader verifies exact194336B/SHA font **before requiring Native**, checks version0.1.100 and register true; missing, corrupt and linked inputs reject. Core can independently use any trusted compatible backend, without a filesystem dependency.

Render/package/font-fetch outputs must be normalized absolute absent external paths, real existing parent, no dot/symlink component. Render prepares both compositions before mkdir. Package preflights its exact text whitelist and all ancestors as regular nonsymlink inputs before any payload read or write. Unknown files, nested fonts/private artifacts are ignored, never recursively packaged. Outputs are exclusive; OS failures after creation are not rolled back. These gates are not TOCTOU/hardlink/semantic-privacy or malicious-code sandboxes. No original reference, font binary, preview, private audit/storage ID or cache belongs in the text ZIP.
