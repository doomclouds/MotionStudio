# Contract

## Model (font-free)

`createCueModel({durationMs,playheadMs,selectedId,cues})` returns an opaque, kit-independent model. Inputs are exact own enumerable data records, ordinary same-realm dense arrays with only canonical indices, primitive finite values. No getters, coercion, inherited fields, holes, extra/symbol/hidden fields. Own-index snapshots do not invoke numeric Object/Array prototype setters. This covers ordinary data, not Proxy traps, replaced JS intrinsics, hostile concurrent mutation or untrusted Native implementations.

- `durationMs`: integer 1000–86,400,000; playhead integer 0–duration inclusive.
- 1–24 cues, sorted, non-overlapping; gaps allowed. ID integer 1–999, unique; selected ID must exist.
- Cue exact `{id,startMs,endMs,lines}`: `0 <= start < end <= duration`. At least 1 ms.
- One or two **authored** lines, each trimmed printable ASCII 1–60 characters. Single spaces join lines for text/character count. No shaping, Unicode/BiDi, language segmentation or word timing support claimed.
- Active is exactly `start <= playhead < end`; gap and total endpoint have no active cue. Selection remains independent. Changing clock never changes selection automatically.
- HH:MM:SS,mmm and seconds with exactly 3 decimals derive from the same integer values. CPS is characters/seconds, rounded half-up to 1 decimal by integer arithmetic; line separator counts as one space. It is descriptive demo arithmetic, not a comprehension/speech rate assertion.
- `inspectCueModel` returns a detached snapshot. `intervalGeometry` returns clipped intersections for exact `{startMs,endMs,x,width}`; bounds inside duration, finite x ±1e6, width .001–1e6. Full timestamps/text retained. Floating output coordinates are not rational-exact or pixel areas.

## Native views

`createCueKit(api, env)` requires the same trusted API used by `setup`. `list`, `intervals`, `caption` validate and measure **before allocating a result canvas**; resource setup already allocates a 1×1 measurement surface. Normalized text state includes kerning/stretch/caps/rendering/direction/spacing; measurement save/restores its state. Invalid actual-fit rejects, never silently truncates full list/caption text. Fresh Canvas factory with normal initial state is required. No browser, responsiveness, native OS/editor interaction or video encoding tested.

All ratios are integer 1 or 2. Returned handles do not expose backing canvas; `inspect` is detached plan JSON and `png` a new encoded buffer. Trusted API factory can retain its own backing; this is encapsulation, not security.

- `list`: exact `{width,first,count,ratio,theme}`. Width 640–1600, first valid cue index, count 1–10 within remaining cues. Height `48+58*count`. `theme` paper/ink. One selected fill and separate active edge; a selected cue outside the window is **not** silently scrolled in (`selectionVisible=false`). All line text, time labels and CPS must fit their own columns.
- `intervals`: exact `{width,height,ratio,theme,startMs,endMs,tickMs}`. Width 360–1800, height 104–220; view inside duration, max 300,000 ms span. Tick integer 1–300,000 anchored to multiples, 2–12 visible ticks; actual adjacent label ink at least 6 px. Collision rejects, no sampled ticks. Cue labels explicitly choose full joined text, then `#ID`, then none; `labelMode` records reduction, full model text is never changed. Partial marks identify clipped ends. Tiny intervals may have no readable label or visible subpixel fill. Playhead model x is exact floating map; its displayed 1 px line is half-pixel inset at view endpoints. Selection underline and active fill do not imply playback.
- `caption`: exact `{width,height,ratio,fontSize}`. Width 320–1600, height 80–240, fontSize integer 18–48. Only active lines, centered with white fill/black 3 px round outline; 8 px actual-ink guard. Empty active means fully transparent canvas, not selected text. Caller provides background; no imagery or waveform dependency. Outline supports contrast but is not a universal accessibility guarantee.

`place(ctx,tile,x,y,scale=1)` uses one save/drawImage/restore and does not consume current path. Finite x/y ±1e6, scale .1–4. It inherits caller transform, clip, alpha, blend, filter, shadow and image smoothing. It does not clear/reset host state. Arbitrary translated/scaled canvases, encoders, platforms or alpha unpremultiplication are not promised pixel-identical. Same-size cold reproduction and reported expansion samples are narrower facts.

## External resource / IO boundary

`FONT-LOCK.json` is the public text expectation. Runtime's whole-lock SHA constant prevents empty/partial/duplicate/modified lock bypass, then verifies two exact alias paths and hashes plus OFL notice before registration. `CueRegular` and `CueSemibold` are full Inter instances (opsz14, weights400/600), renamed to avoid relying on system font families. Metadata Regular400 is deliberate Native registration normalization, not a claim that the 600 outline became 400. Full cmap/outlines/notices retained; historical screenshot font bytes are irrelevant here.

Inputs/output paths: absolute, normalized raw strings; no symlink final or ancestor; outputs must not exist, and parent must exist. They must be outside this package and a detected containing Git checkout. Guard uses ordinary filesystem checks, not TOCTOU protection, mount/alias resolution security or all possible repository detection. Caller owns the external runtime and global fonts. Fetch needs network and fails closed on identity mismatch; restore may become unavailable. Preparation uses pinned Python/FontTools; changing toolchain requires deliberate new lock/review. Multi-file write is not atomic on I/O/disk failure; partial new output may remain for diagnosis. No overwrite, cleanup, deletion, file monitoring or user media reading occurs.

## Publication scope

Only enumerated package text files may migrate. No fonts, original image, generated asset, rendered PNG/JSON evidence, private report or backup metadata. MIT code, MIT upstream notices, OFL font text and Native MIT notice are separate. Not a formal family; integration/source-policy/full-history/concurrent-baseline checks remain separate gates. Author tests are not independent review or owner aesthetic acceptance.
