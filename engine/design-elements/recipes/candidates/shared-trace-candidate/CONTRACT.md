# Exact bounded contract

## Data

`compileDataset({name,times,series,cursor})` accepts exact ordinary/null-prototype own enumerable data records, ordinary dense arrays with only canonical own indices, primitive finite numbers and primitive strings. Holes, extra keys/symbols, accessors, boxed values, noncanonical indexes and custom array prototypes reject. No getter/coercion invocation is intended for ordinary inputs. Owned snapshots use defineProperty append; inherited Object/Array numeric setters do not replace entries. Proxies, replaced intrinsics and concurrent mutation are outside the boundary.

- name: nonblank printable ASCII, 1–36 characters, metadata only.
- times: 2–2401 finite numbers in 0…1,000,000. Adjacent gap ≥0.000001 and total span ≥0.001. Strictly increasing, no resampling.
- series: 1–8 records `{id,label,unit,color,values}`. Unique id 1–32 lowercase `[a-z][a-z0-9/-]*`; label 1–24 and unit 1–6 using uppercase A–Z, digits, space and `. : / % + _ -`. color explicit six-digit `#RRGGBB`, no defaults. Values exactly times.length, each finite ±1,000,000.
- cursor: inclusive time domain. Find first sample ≥cursor, interpolate linearly from its preceding sample. First/last endpoints use first/final pair. No extrapolation, cubic spline, inference or true audio/telemetry processing. IEEE-754 arithmetic, not exact rational runtime.

All descendants are copied and frozen. Only the same-module branded model is accepted by `atCursor`, `changeCursor`, plot and readout. JSON copies are metadata, not supported input models. `synthetic:true` is the API's declared use, not independent proof of a caller's data provenance. Both supplied examples are authored arrays.

## Tiles

`plotTile(model,{width,height,series,yDomain,xTicks,yTicks})`: integer width320–1600, height240–800; 1–2 unique known series IDs **with identical unit string**; finite domain endpoints ±1,000,000, span≥0.000001 containing all selected samples; xTicks3–9/yTicks3–8 integers. Data rectangle `[88,52,width−124,height−108]`. Samples, interpolated cursor, markers and tick coordinates share the same linear transforms. All samples are included, even if more samples than SVG horizontal pixels; not decimation or a sampling theorem.

Tick strings have 3 decimals; duplicate rounded labels reject. X labels need ≥4 logical px separation. Legends must fit fixed sequential positions. Labels are exact5×7 rectangle patterns, 6-cell advances; all actual rectangles fit2px inset. Legal numeric options can still fail visible fit, with no clipping, shrink, wrap or ellipsis. Two plot traces sharing a unit string does not prove scientific comparability; caller is responsible for meaning.

`readoutTile(model,{width,series})`: integer width280–1000; 1–8 unique known IDs. Height is76+62×count. Label/unit, five-decimal value, cursor and source bracket come from the same snapshot. Rounded negative zero is normalized, not a change to the underlying value. Different underlying values can legitimately share a rounded readout; exact values remain in metadata.

`inspectTile(tile)` returns detached mutable JSON. `tileSVG(tile)` accepts only the same-module branded immutable tile. It returns a transparent SVG with explicit line joins/caps, block rectangles and escaped title. Markers have3px radius +.75px stroke, held well inside the overall canvas, though they intentionally extend around the data-rectangle boundary at extrema. No Canvas context/state is touched.

`composeSVG({width,height,background,tiles})`: dimensions integer320–2400×240–2400, at most4,000,000 logical pixels. Explicit six-digit RGB opaque background, 1–16 exact placement records `{tile,x,y}`; x/y nonnegative integers, entire tile must fit. Slots may overlap intentionally in supplied order; no automatic collision layout. Translation only, no scale, clipping, alpha or arbitrary SVG fragment injection. Transparent standalone tiles can be embedded by a caller separately; caller rendering is not sandboxed.

## Boundaries

The helpers use trusted standard JavaScript intrinsics and finite module memory, not a resource-isolation/security sandbox. Package internals are not alternate supported untrusted APIs. No image/font, filesystem or network access in `index.mjs` dependency graph. CLI alone writes four deterministic outputs to an absent normalized absolute external directory with real existing parent and no symlink component. It never overwrites; OS errors after creation are not rolled back transactionally. `make-package.py` uses an exact text allowlist, pre-reads regular nonsymlink members and writes only a new external ZIP. Unknown nested files are ignored, not scanned for secrets.

Exact same-source Node SVG/JSON bytes are tested; PNG, browser, platform, arbitrary scale/translation, raster antialiasing, color-management or scientific guarantees are not made. The new block-label lettering is intentionally limited, not Unicode shaping. No production safety/accessibility/owner aesthetic approval or new public family is implied.
