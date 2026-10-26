# Motion timeline core — v0.1

**Implemented / 已实现:** zero-dependency Node >=24 audio-timeline contract,
exact rational arithmetic, source/clip ranges, pure split/trim/move operations,
pause/resume authoring, gain-only stem/bus routing, fade/automation validation,
export views and creative-plan identity. This module does not open media, run DSP,
install dependencies or contact a service. `motion-audio-core` owns execution.

**Deferred / 未实现:** multi-scene video editing (frame rate is a shared time grid
only), EQ/compression/ducking processors, arbitrary retiming, OTIO interchange,
DAW/plugin hosting and perceptual acceptance. Unknown fields, including
`processors` or arbitrary FFmpeg expressions, are rejected rather than ignored.

```sh
node --test engine/motion-timeline-core/test/*.test.mjs
```

## Contract

Import from `lib/timeline.mjs`. All `Time` values are rational seconds:
`{n: "integer", d: "positive integer"}`; normalized fractions use at most 30 digits
per integer. `rational(n,d=1)` accepts safe integers, bounded strings or BigInt.
`add`, `sub`, `compare`, `framesToTime(frame,{n,d})`,
`samplesToTime(sample,rate)` and `timeToSamples(time,rate)` provide exact
arithmetic. The latter returns **BigInt**, rounding nearest with ties away from
zero. It is not directly JSON-serializable: report writers must serialize integer
strings. Shared absolute endpoints are rounded once; durations are differences,
not separately rounded values accumulated over clips.

`validateTimeline(document)` returns a new deeply frozen, normalized document.
All keys below are required except those marked `?`. Unknown keys reject at every
schema object. Optional defaults apply only to omitted/undefined values; explicit
`null`, `false` or other wrong types reject. All ranges are half-open `[start,end)`, nonnegative and nonempty.

```text
schemaVersion: 1
project: {sampleRate, frameRate:{n,d}, channelLayout:'mono'|'stereo', duration:Time}
sources: [{id, path, streamIndex?, expectedSha256?}]
clips: [{id, sourceId, sourceRange:{start:Time,end:Time},
         timelineRange:{start:Time,end:Time}, outputId,
         gainDb?, fades?, automation?, envelopeOffset?, envelopeDuration?}]
stems: [{id, outputId, gainDb?}]
buses: [{id, outputId, gainDb?}]
master: {gainDb?}
views: [{id, range:{start:Time,end:Time}, outputs:[id],
         boundaryFade?:{duration:Time,curve:'linear'|'equalPower'}}]
```

IDs are unique across the document, up to 64 ASCII letters/digits/underscore/hyphen;
`master` is reserved. Sources identify local POSIX paths; URI schemes, control
characters, backslashes, `//` roots and `..` path components reject. This syntax
check is **not filesystem authorization**. Execution must resolve symlinks, check
allowed roots, freeze/hash actual bytes and restrict decoder protocols. Optional
`streamIndex` is the nonnegative absolute ffprobe stream index; absent means the
first audio stream. Optional `expectedSha256` is lowercase hex and is enforced by
the execution layer. A digest proves identity, not rights.

Source times refer to presented decoded/prepared audio, after codec priming/edit
list handling, not raw packet timestamps. Clip source and timeline durations must
be rationally equal (rate=1). Gaps are silence and overlaps mix explicitly. No
implicit rate changes, normalization, fade or source-exhaustion padding occurs.

Clips route only to known stems. Stems and buses route only to a bus or `master`;
cycles reject. Every node has one output. Gain defaults to 0 dB and accepts finite
-120..24 dB. Mono/stereo only; channel conversion remains an execution capability,
not a hidden schema action. No processor chains in this version.

Resource bounds: project duration >0 and <=24h, sample rate 8k..192k, frame rate
positive and <=240, <=1024 sources, <=10000 clips, <=128 stems, <=128 buses,
<=128 views, <=4096 automation points per clip. Executing backends may impose
stricter disclosed capabilities; schema validity does not promise renderability.

## Envelopes and edits

- `fades` defaults `[]`, at most one `in` and one `out`. Each is
  `{direction, duration:Time, curve:'linear'|'equalPower'}`. Duration is positive,
  at least one project sample and within the original envelope duration.
- `automation` defaults `[]`: `{at:Time,gainDb}` points on the original
  envelope-local sample grid, strictly increasing after quantization. Convert dB
  to amplitude, interpolate **linear amplitude**, and hold the nearest endpoint
  outside points. An empty array multiplies by 1.
- Gain, automation and fades multiply. A fade of N samples uses endpoints
  0..N-1: fade-in starts at 0, reaches 1 at N-1; fade-out reverses that ratio and
  ends at 0. For N=1 its one sample is 0. Equal power uses
  `sin(pi/2 * ratio)`. Overlapping fades multiply; no implicit normalization.
- `envelopeOffset` defaults zero; `envelopeDuration` defaults original clip
  duration. They retain the original envelope after split/trim, rather than
  approximating a curved fade with new linear points. Offset+clip duration must
  fit the original envelope (itself <=24h).

`quantizeClip(normalizedClip,rate)` returns BigInt fields `startSample`,
`endSample`, `sourceStartSample`, `sourceEndSample`, `durationSamples`,
`envelopeOffsetSamples`, `envelopeDurationSamples`. It rejects source/timeline
sample-count mismatches caused by different fractional phases: align endpoints
to the project sample grid rather than silently pad/delete a sample. Envelope
sample origin is derived from `sourceRange.start - envelopeOffset`; subtracting
its rounded absolute origin preserves original sample coordinates even if a
split point and original start are both fractional samples. Do not independently
round the envelope offset in the audio backend.

Pure operations accept a document and return a new validated frozen document:

```js
splitClip(doc, {clipId, at, rightId}); // at is project time, interior only
trimClip(doc, {clipId, start, end});  // project range inside current clip
moveClip(doc, {clipId, start});      // changes placement, not source/envelope
compileSequence({sourceId, outputId, idPrefix, start, sourceStart,
  segments:[{kind:'play',duration}, {kind:'pause',duration}]});
```

The sequence helper returns frozen clip descriptors for inclusion in a document.
Play consumes source time; pause advances project time only. No mutable render
cursor exists. Continue-under-silence is not pause and is not silently substituted.
Split preserves both source mapping and original fade/automation coordinate
system; it never adds transition fades. Subsample edits may quantize empty or
mismatch phase and are rejected by validation/execution, not silently repaired.

## Identity and views

`creativeIdentity(doc)` is SHA-256 over normalized creative data with sorted object
keys, excluding source **paths** and all export **views**. Source IDs, optional
stream selectors and expected hashes remain. Array order is retained, including
mix summation order. Relocating media or creating a review view does not change
creative identity. Without expected hashes this is **plan identity only**, not
media identity; the renderer must separately bind actual source bytes, prepared
PCM, toolchain and encoded output.

A view selects a project range and nonempty, unique output IDs (`master`, stems
or buses). Its optional boundary fade belongs to the **export only** and must be
recorded in a separate view/execution identity. It never changes clip fades or
full-master identity. Validate output sample counts and decode/meter final
encoded media separately. This module makes no listening, pleasantness, loudness
target or owner-approval claim.
