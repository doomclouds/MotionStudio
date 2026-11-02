# Bounded spatial-character snapshot contract

One restricted recipe, two linked views; no new public family or registration. Public entry `createSpatialCharacterKit(api)` → `gridTile`, `summaryTile`, `place`. `normalizeGrid` is the same font-free model validator. The supported raster environment is Native Canvas 0.1.100 with the exact **unmodified IBM Plex Mono Medium, actual weight 500**, registered as `SpatialGridMono` by the external runtime adapter. No system fallback is an accepted resource recovery path.

## Grid data and syntax

Exactly `{columns,rows,cellWidth,cellHeight,cells,marks,cursor}`:

- columns integer 8–64, rows 4–32, cellWidth 18–28, cellHeight 28–36. All bounds intersect the **900,000 logical pixel** cap. For example 64×32 does not fit even the minimum cell size; the largest attainable cell count is 1,770 at 59×30 with 18×28 cells.
- `cells`: exactly `rows` strings, each exactly `columns` printable ASCII characters U+0020–U+007E. No tabs, newline, Unicode, automatic wrapping, trimming or normalization. Spaces keep their addresses and remain empty; `.` means a small circular placeholder, not the literal dot glyph. Other 93 characters use their font glyphs. This is a display convention, not an operator language.
- `marks`: zero to columns×rows unique records `{column,row,role}`. Zero-based coordinates are in bounds; role is one primitive string `accent | paper | bright`. Duplicate addresses reject even if roles agree. Marks may cover spaces or dots and are still counted.
- `cursor`: exactly one `{column,row}`, in bounds, zero based. It cannot be null/hidden in this bounded API.
- Records must have Object.prototype, exactly the required own data keys, no accessors or symbols. Arrays must have Array.prototype and dense own data indices. Input array custom methods/iterators are ignored, never called. Non-enumerable own data values are supported. Primitive numbers/strings only, no coercion. Proxies, cross-realm objects, monkey-patched builtins and hostile Canvas implementations are outside this contract.

A fresh immutable snapshot copies cells/marks/cursor and derives role counts, total cells, dot count, space count and other-glyph count; the latter three sum to total. Numbers are not supplied independently. Retaining and mutating caller input cannot alter an existing plan or image.

## Drawing and priorities

All syntax/model/pixel-budget checks happen before any Canvas allocation. A valid model then allocates a 1×1 measurement scratch. At fixed 24px, **each distinct actual glyph** is centered by advance and checked on all four ink bounds with a 0.5 logical-pixel guard; nonfinite/unreasonable metrics fail. If any ink does not fit, there is no output raster. There is no silent crop, shrink-to-fit or ellipsis. Small cell sizes may therefore reject some ASCII characters; declared numerical ranges are not a promise that every content combination fits.

Grid backing is exactly 2× logical width/height, up to 3.6M RGBA pixels (~14.4 MB before native overhead). Summary backing is also 2×. Place scales each backing to the handle's logical size; this is not a guaranteed device-pixel ratio for arbitrary caller transforms. No benchmark, bounded whole-process RSS or long-sequence performance is claimed.

Fixed roles (not an arbitrary theme API): cursor fills gold and overrides any mark; accent fills cyan; paper fills light gray; all filled cells use dark ink. Bright changes only glyph/dot ink to cyan. Unmarked other glyphs use gray, unmarked placeholder dots use quiet gray. Transparent unfilled background stays transparent. Designed for a dark host surface; quiet decorative dots intentionally have low contrast. No comprehensive WCAG claim or background-independent contrast promise.

## Same-handle summary

`summaryTile(gridHandle,{label})` accepts only a grid from this kit, not a clone, foreign-kit handle or prior summary. Requires at least 32 grid columns. Label is nonblank printable ASCII, length 1–16. Width equals that grid's logical width; height is 132. Two columns of GRID / CURSOR / MARKS / GLYPHS / DOTS / SPACES are derived from the same grid snapshot. Label is descriptive only, not a hidden source of data. A 1×1 scratch preflights every label/value in its fixed slot before output allocation; invalid syntax rejects even earlier.

Both handles/plans are frozen. Raster storage is builder-private, with no explicit export or mutation method. This is encapsulation, not a sandbox: the caller must supply a genuine trusted Canvas context/factory; a forged drawImage callback can observe the canvas. Shared Native font-registry races or a factory that returns dirty/reused surfaces are not supported.

## Placement and lifetime

`place(ctx,handle,x,y)` accepts same-kit handles and primitive finite x/y in ±16384; negative and fractional placement are allowed. It calls drawImage once, does not save/restore or change caller style/current path. Caller transform, clip, alpha, composite, shadow, filter and smoothing are **intentionally inherited**; dirty state can change appearance. New data requires new grid and summary handles, not editing a plan and expecting old pixels to update.

No executing code, command interpretation, terminal, editor, audio/MIDI, connected devices, clock, animation, event handling or timeline API. No motion validation, random-access frame guarantee, responsive app or itemized owner aesthetic approval is implied.

## Resource and filesystem adapter

`loadEnvironment` requires absolute external font/runtime directories (`SC_FONT_DIR`, `SC_RUNTIME_DIR`), outside this source package. All path ancestors must be real directories, not symlinks; exact font/license hashes and the code-pinned font-lock SHA are checked before registration. Exactly one font/alias is accepted; missing/tampered/symlinked resources fail rather than fall back. Runtime's external dependency is checked as Canvas 0.1.100. It is a trusted installed dependency, not a malicious-module sandbox.

`fetch-font.py --output ...` validates a fresh external output with existing real parents before network/read/write, retrieves only the fixed public URL and checks length/SHA/Git blob before writing. No fontTools, font derivation, bundled font binaries or private resources are needed. A caller may instead supply the same exact public bytes. `writeOutputs` requires a new external directory, bounded png/json basenames and Buffer data; it refuses existing directories rather than overwrite. Trusted parent ownership/no concurrent filesystem or resource modification are assumptions; no rollback across unrelated native/IO failure is promised.
