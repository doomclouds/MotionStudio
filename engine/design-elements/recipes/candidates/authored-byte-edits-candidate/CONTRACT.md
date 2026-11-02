# Bounded authored-edit contract

## Pure model and coordinates

`compileEdits({base,edits,selected})` accepts only exact own enumerable data fields on ordinary or null-prototype records. Arrays must have Array.prototype, dense enumerable own data indices and length, no extra keys/symbols/custom iterator. No coercion or input callback is used. Unknown fields, holes, accessors, boxed values and typed arrays reject. The owned model/plan arrays define own indices rather than invoking inherited numeric setters. This is not a sandbox for Proxy traps, replaced builtins, native APIs or concurrent mutations.

- `base`: 64–4096 safe integer bytes0–255.
- `edits`: 1–8 exact `{at,remove,insert}` records, strictly ascending `at`, non-overlapping **base-coordinate** remove ranges; `at`0–base.length, `remove`0–min(512,remaining), dense inserted bytes0–512. An empty remove AND empty insert is rejected.
- Zero-length insertion at a previous removal's end is allowed if base offsets remain strictly ascending; two edits at the same base offset reject. Apply all offsets against original base, not successively edited target.
- `selected`: valid zero-based operation index. Target must remain64–8192 bytes. All buffers are copied and deep frozen. The returned module-owned model cannot be replaced by parsed JSON or another instance's object.
- Each operation includes half-open base/target ranges, net delta and `deltaBefore`. `targetStart = baseStart + sum(prior insertion lengths - prior remove lengths)`. Totals and segments are derived, never caller-supplied.
- `baseByteEvidence(model,i)` returns a retained targetIndex/value or `removed-by-authored-edit` with operation and target range. Replacement interiors have no exact surviving byte correspondence.
- `targetByteEvidence(model,i)` returns retained baseIndex or authored insertion/insertIndex. Indices are valid byte indices, not boundary positions. These functions do not read files or execute patches.

## Kit, geometry and text

`createByteEvidenceKit(trustedAPI,{fontFamily})` requires a registered simple family name and fresh Native Canvas factory. One1×1 measurement scratch is allocated at kit creation. Each component validates data/fit completely before allocating its output raster. No truncate, ellipsis, shrink-to-fit or hidden text clip.

All components take a compiled model. Options are exact own records:

- `pairView(model,{width,rows,rowHeight,fontSize,leftStart,rightStart,theme,ratio})`: width880–1600 integer, rows4–24, rowHeight18–32 integer, fontSize10–16 finite; starts are multiples of16 inside their respective buffers; theme primitive `paper|ink`; ratio integer1|2. Height=rows×rowHeight+92. Some combinations inside these numeric ranges fail real ink fit, e.g. font16 at width880. Byte columns remain16; final partial rows leave nonexistent bytes blank. Left offset column sits on the outer left, target offset column on the outer right. Offsets in the grid are hexadecimal; operation-table ranges and summaries are decimal.
- `operationTable(model,{width,rowHeight,theme,ratio})`: width760–1600 integer, rowHeight30–48 integer. Height48+operationCount×rowHeight+12. It shows exact base/target half-open intervals, earlier cumulative delta and this operation's net delta.
- `summaryCard(model,{width,theme,ratio})`: width420–900 integer, height178. Counts/selection/mapped offset are from the same model.

Only selected byte cells in the visible windows are filled. Empty insertion/deletion sides use an **anchor line**, not invented selected bytes. Connector endpoints use continuous byte-offset/16 row coordinates clamped to the shown body, and metadata exposes raw coordinates, clamping and intersection. The bridge is a bounded viewport representation, not a guarantee the whole edit is visible. No decorative scrollbar, OS chrome, path/filename or product identity is included.

Every rendered text operation is measured with the same font/size and normalized letter/word spacing, direction, baseline, alignment, kerning, caps, stretch and rendering flags used when painting. Ink must fit its own slot on all four edges; invalid/abnormal measurements reject. Monospaced typography is recommended; injection does not waive fit checking. This is limited ASCII hexadecimal/labels, not Unicode shaping or font-engine equivalence.

Handles and plans are deep frozen; raster canvases are private to the kit. `png(handle)` returns an independent Buffer. `place(ctx,handle,x,y,scale=1)` accepts same-kit handles, finite coordinates±16384, scale.1–4; one drawImage under save/restore preserves state/current path but **inherits transform, clip, alpha, composite, filters, shadows and smoothing**. It does not normalize the host appearance. A trusted API/factory can observe a canvas, so encapsulation is not security isolation. Internal `src/paint.mjs` plan replay is a trusted diagnostic hook, not an untrusted serialized-plan API.

## External resources and IO

The default runtime checks code-pinned SHA/size of one full, unmodified OFL IBM Plex Mono Regular before registration, then requires successful registration and alias presence. `font-spec.json` documents public source identity; it is advisory, not mutable authority. Fonts are process-global; concurrent alias replacement is outside scope. Native version0.1.100 is required by the adapter, not binary-attested.

Font, dependency and output locations are normalized absolute paths outside this source package and outside recognized MotionStudio source checkouts (catalog+source-validator markers). All existing ancestors and resource files must be non-symlinks. Output must be absent with an existing real parent. The checks do not defend against TOCTOU/races or maliciously replaced code. Runtime/report/package writers never overwrite. New batch outputs are preflighted but not rollback-atomic after OS failure. Font fetch validates destination before network and exact size/SHA/Gitblob before saving. No font binary enters the text ZIP.

## Nonclaims

Not a minimal-diff algorithm, file comparator/parser/editor, decoder, binary patch installer, real device trace, interactive tool, browser or animation. All examples are synthetic. No original screenshot, product identity or private evidence is included. Same-size fixed-runtime outputs are tested separately from expanded-backing samples; no global AA, translation, scale, cross-OS or browser pixel guarantee. No accessibility/security certification, owner aesthetic acceptance or new formal family is implied.
