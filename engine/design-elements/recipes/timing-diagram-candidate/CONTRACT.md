# Contract — bounded timing tiles

## Model

`compileTiming({cycles,rows})` accepts cycles integer 4..10 and 1..6 rows with unique printable-ASCII names of 1..14 characters. A digital row is exactly `{name,type:'digital',values}` with `2*cycles` integer 0/1 values. A bus row uses `type:'bus'` and 1..`2*cycles` segments, each exactly `{start,end,label}`. Segments form a contiguous positive-length partition of `[0,2*cycles)`, with integer boundaries; label is null (hatched unspecified symbol) or printable ASCII 1..8 characters. Labels are symbols, **not parsed hexadecimal values**. Spaces are legal symbols, not null.

Records must be same-realm ordinary objects containing exactly the specified enumerable own data properties. Arrays must be dense, same-realm ordinary arrays with indexed enumerable own data properties and no extra protocol. Accessors, hidden fields, custom prototypes, sparse arrays, boxed scalars and coercion are rejected without calling getters. Proxies, altered language intrinsics and hostile supplied APIs are outside this trusted-code contract. Accepted input is copied and deeply frozen. Compiled models are module-owned; copies or raw records are not diagram models.

## Tiles

After `loadEnvironment` and `createTimingKit`:

* `laneTile({row,cycles,width})`: raw or compiled-snapshot row, cycles 4..10, integer width 360..900; logical height 30.
* `timingDiagramTile({model,width,labelWidth})`: owned compiled model with 2..6 rows, integer width 520..1100 and labelWidth 100..180; plotWidth=`width-labelWidth-6` must be at least360. Height=`38*rowCount+26`.
* Tiles have fixed 2× backing resolution. Largest diagram: 2200×508 pixels; largest lane:1800×60. Private canvases are not returned. Handles and plans are frozen and kit-owned.
* Signal x positions share a 2px inset and `(plotWidth-4)/(2*cycles)` half-tick mapping. Cycle centers use the same coordinates. White bus interiors coexist with otherwise transparent backgrounds; black lines, blue names and gray ticks are fixed, not a general theme API. Compose on light opaque hosts.
* Input-domain validation precedes measurement. Actual font ink is then checked before result-surface allocation. One or more 1×1 measurement canvases are permitted; string length validity does not guarantee fit. Impossible labels throw rather than shrink, truncate or paint clipped output. Text direction, letter/word spacing and other text properties are normalized internally.

`place(ctx,tile,x,y,scale=1)` requires an owned tile, finite x/y within ±4096 and finite scale .25..3. It saves/draws/restores in a finally block, preserving caller numeric state and current path. It intentionally inherits caller transform, clip, alpha, composite mode, filter, shadow and smoothing. This does **not** guarantee equivalence to a no-save drawing sequence under arbitrary fractional clipping: Native0.1.100 has known clip/save antialiasing differences. No implicit readback flush is added. Validate the actual downstream compositor; integer alignment is a useful conservative starting point, not a universal guarantee.

`png(tile)` returns a new mutable PNG buffer. Mutating it does not mutate the tile. Handle ownership is not a security sandbox: a hostile context could retain the canvas received by its drawImage. Caller canvas factories must produce fresh requested-size Native surfaces, not reused or adversarial canvases. Expanded-surface factories in the test suite are instrumentation only.

## Resources and lifecycle

`loadNative()` checks installed Canvas package version0.1.100. `loadEnvironment(api,{fontPath})` accepts a trusted Native-like API, authenticates the entire code-pinned lock and two font notices, checks external regular-file/ancestor status and exact font bytes, then requires successful font registration and family lookup. An injected arbitrary API is trusted, not version-attested. Returned environment ownership is bound to the exact API object. Global font registration is process-global and is not rolled back on later failure.

Only the exact unmodified external font in `font-lock.json` is supported. No system-font fallback, font binary, font downloader or claimed exact public font recovery is shipped. Calling code and metadata are trusted; this is not a sandbox against modification of both code and lock. Resource guards are checked at use, not race-proof against concurrent filesystem mutation.

`render.mjs` builds all five outputs before creating the destination. Output must be a new normalized absolute directory outside package/recognized MotionStudio repository, beneath existing non-symlink directory ancestors. `writeNew` is an internal trusted helper, not independently safe for arbitrary directory arguments or concurrent hostile filesystem changes. Writes are exclusive per file, but a disk failure can leave a partially populated new directory; no transactional rollback is promised.

## Deliberate limits

Half-ticks are unitless synthetic cells, not seconds or measured duration. No simulated hardware, signal validity assertion, sampling, electrical timing guarantee, animation, browser tests or responsive UI. Examples have fixed text and dimensions, not a general poster-layout engine. Source-only public candidacy, exact external resource access, independent audit, repository integration and publication remain distinct gates.
