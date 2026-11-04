# Motion Audio Core

A bounded local audio backend for Motion Core timelines. Audio editing and mixing
are first-class project operations, not an implicit soundtrack replacement.

## Processing contract

- Local, explicitly authorized, content-identified sources only. A hash establishes
  identity, **not permission or a license**.
- Source position zero means the first presented decoded sample after the decoder's
  codec priming/edit-list handling. Preparation establishes a 48 kHz float PCM
  sample domain; original packet timestamp zero is not an audio-edit coordinate.
- Mono/stereo only. Equal-rate clip ranges are half-open. Resampling converts sample
  rate, not playback speed. Source exhaustion is an error, never automatic padding.
- Clip gain, authored fades and automation are evaluated per sample. Overlaps and
  graph routing sum without normalization. No automatic loudness normalization,
  hidden limiter, taste score, or universal delivery target.
- EQ, compression, sidechain ducking, plugins, arbitrary FFmpeg filters, time
  stretching, reverse playback, network media and provider review are outside this
  initial increment. Unsupported processing must reject rather than be ignored.
- A review view crops the processed full master before applying an explicitly
  export-only boundary treatment. It does not modify the creative plan or master.

## Evidence and acceptance

Creative-plan, source, preparation, execution, view and output identities are
separate. Repeatability claims are restricted to PCM produced by the same pinned
local runtime; compressed bytes are not a substitute for listening or semantic
comparison. Source identity is checked again before accepting results.

Technical measurements are observations, not aesthetic approval. Local playback
or a successful encode does not mean anyone listened. Perceptual review and owner
acceptance remain `NOT_RUN` until an actual authorized review occurs. Silence can
be intentional; unavailable loudness measurements are not numerical zero.

## Runtime and tests

Use Node 24 or later and separately installed FFmpeg/ffprobe. No automatic download,
installation, bundled codec binary, credential access or network request is needed.
The core records its actual runtime. The repository license does not relicense
external FFmpeg builds.

Tests generate synthetic WAV fixtures in temporary directories. Exact PCM assertions
and codec/resampling tolerance assertions are deliberately separate. No production
media, private paths, source hashes or project names belong in this package.

```sh
node --test engine/motion-audio-core/test/*.test.mjs
```

This is the bounded first audio increment, not a claim that the complete M1
video/audio integration or later dynamics milestones have shipped.

## JavaScript API

```js
import {prepareMix} from './lib/audio.mjs';
const prepared = await prepareMix(timeline, {
  sourceRoots: ['/authorized/assets'],
  workDir: '/authorized/new-empty-run', // must not already exist
  ffmpeg: 'ffmpeg',
  ffprobe: 'ffprobe',
  signal: abortController.signal,
});
try {
  const master = await prepared.render({encodeAAC: true});
  const preview = await prepared.render({viewId: 'review', encodeAAC: true});
  await prepared.verifyIdentity();
} finally {
  await prepared.close();
}
```

`timeline` follows `motion-timeline-core/lib/timeline.mjs`: schema version 1,
canonical rational `{n: "integer", d: "positive integer"}` seconds, a 48 kHz
mono/stereo project, local sources, clips, stems, buses, master, and export views.
Sources select an optional absolute `streamIndex` and may pin `expectedSha256`.
The selected source's channel count must match the project: no implicit downmix,
upmix or stereo-to-mono collapse is performed. Source gain automation is
`linearAmplitude`, endpoint-held, in the original clip envelope coordinates.
Splitting preserves that envelope and never invents a cut fade.

Full output is promoted as `workDir/result/` only after source revalidation and
full PCM decode checks. It contains `master.wav`, each declared stem/bus WAV and
`report.json`; optional AAC files use `.m4a`. Views are separate
`workDir/view-<id>/` directories. Partial output remains diagnostic, never success.
Each view ID can be rendered once per work directory. Request the full output's
encoding on its first render; changing encoding later requires a fresh run.

Reports keep the original canonical PCM alongside AAC's independently decoded
sample counts, metrics and declared 0–1024 sample tail-padding tolerance. The
MP4 presentation/edit-list handling is explicit; compressed output is not promised
sample-for-sample equal to PCM. Sample clipping/headroom warnings do not insert
protection. The report has no configured delivery loudness target.

Resource bounds in this first implementation: 600 seconds per source/project,
64 sources, 256 clips, 16 combined stems/buses, 512 MiB total original sources, and
20 million scalar samples for prepared-source storage and graph buffers. Graph
size can make the practical duration limit lower. All source files must resolve
inside explicit authorized roots, including symlink resolution. Unsupported
schema fields reject.

## Command line

Run from the repository root (file locations are examples, not bundled assets):

```sh
node engine/motion-audio-core/scripts/audio.mjs capabilities
node engine/motion-audio-core/scripts/audio.mjs validate --timeline /project/timeline.json
node engine/motion-audio-core/scripts/audio.mjs probe --source /project/assets/music.wav --source-root /project/assets
node engine/motion-audio-core/scripts/audio.mjs render --timeline /project/timeline.json --source-root /project/assets --work /project/new-run --aac
node engine/motion-audio-core/scripts/audio.mjs render --timeline /project/timeline.json --source-root /project/assets --work /project/new-review-run --view review --aac
```

Repeat `--source-root` for additional authorized directories. `--output FILE` saves
the JSON result only when the destination does not already exist. Ctrl-C/SIGTERM
cancels owned commands; no successful output is promoted after cancellation.
The allowed demuxers are `wav,mp3,flac,ogg,mov,aac,aiff,caf`; there is no arbitrary
container fallback. Prepared-source storage and graph buffers each have a separate
20-million-scalar-sample budget, not one combined cap.

This package's tests are audio-only. Final-film mux, video edits and A/V alignment
belong to the integration wrapper and are not established by these results. The
core's A/V review status remains `NOT_RUN`.

## Inspect the actual encoded delivery

`inspectEncodedAudio` independently decodes and measures an existing local AAC
file, including the audio stream inside the final MP4. It uses the same local
measurement implementation as mix outputs; this checks the bytes actually
encoded/muxed, not an assumed copy of premux PCM.

```js
import {inspectEncodedAudio} from './lib/audio.mjs';
const inspection = await inspectEncodedAudio('/project/final.mp4', {
  sourceRoots: ['/project'],
  workDir: '/project/new-delivery-inspection',
  expectedFrames: 48000 * 10,
  channels: 2,
});
```

The inspection requires exactly one AAC stream at 48 kHz with the declared
mono/stereo layout. It rejects mismatched duration outside the explicit 0–1024
sample decoder-padding allowance, records the source hash, checks identity again
at completion, and reports post-encode sample/true peaks and loudness availability.
It never changes the input file. The new scratch directory receives decoded PCM
and `inspection.json` (or failure diagnostics). Audio inspection alone **does not
establish video synchronization, listening quality or owner acceptance**; those
review lanes remain `NOT_RUN`.

### Source path context

The JSON schema accepts local POSIX absolute or relative source paths, but never
URI, Windows-drive/backslash or `..` traversal syntax. Validation happens **before**
path resolution. The CLI resolves relative assets against the directory containing
`--timeline`, not the caller's current working directory. `--source-root` remains
an explicit authorization boundary; locating a timeline does not grant asset access.

Library callers must use absolute source paths or explicitly pass an absolute
`sourceBaseDir` to `prepareMix`. Relative paths without that context are rejected.
The original validated plan and declared source paths remain intact in reports;
only filesystem access uses the resolved path. Path context does not change the
creative-plan identity, and actual source bytes remain separately fingerprinted.

## Source-range-aware preparation

A source's prepared PCM covers one contiguous canonical 48 kHz interval from its
lowest referenced clip source start to its highest referenced source end. Thus a
short selection from a long asset does not consume the full asset's decoded PCM
budget. Repeated ranges reuse the same prepared source; gaps between disjoint
ranges still count toward the existing 20-million-scalar-sample preparation cap.
This is not a sparse-range cache or an increase to memory/duration limits.

Decoding and resampling still begin at the original source origin; canonical
sample trimming happens **after** resampling, without input seeking. AAC
priming/edit-list handling therefore remains the same as a full-origin decode.
Metadata records `preparedStartSample`, `preparedEndSample`, and prepared `frames`;
prepared PCM index zero corresponds to `preparedStartSample`, not source zero.
Original-source and prepared-PCM identities stay distinct. If any referenced
range exhausts its source, preparation fails instead of silently padding.

Declared but unreferenced sources are still authorized, probed, snapshotted and
identity-checked. They report `preparationStatus: "UNREFERENCED"`, zero frames and
null prepared path/hash, and allocate no prepared PCM. The 600-second source
limit and all original-file byte limits remain in force.

Source duration must currently be finite and no more than 600 seconds according
to the selected stream probe, with container duration used conservatively when
stream duration is absent. An unknown duration (or an overly long container
fallback) rejects even when a requested selection is short; this bounded first
implementation does not infer full duration by unbounded decoding.

## Graph budget diagnostics

The full-project graph is bounded independently of prepared-source spans:

```text
(stem count + bus count + 2) * project frames * channels <= 20,000,000
max project frames = floor(20,000,000 / ((stems + buses + 2) * channels))
```

Frames are quantized at 48 kHz; channels are 1 (mono) or 2 (stereo). The two
additional buffer allowances are part of the existing graph accounting. All
declared stems/buses count, including silent or unreferenced nodes. This scalar
budget is not a promise about total process memory usage; decoding, encoding and
verification also use memory. Other limits still apply, including 600 seconds.

For example, a 60-second stereo project with five stems and no buses requires
40,320,000 graph scalar samples. Its graph ceiling is 1,428,571 frames
(about 29.761896 seconds). Use the integer frame ceiling, not rounded-up seconds,
when authoring a bounded plan. Changing mono/stereo or routing is a creative and
source-layout decision, never an automatic repair. Fewer nodes can permit a
longer project, but do not waive the separate prepared-source cap.

`validateAudioPlan` and `prepareMix` reject an over-budget graph before media
access. The error has `code: "AUDIO_GRAPH_BUDGET_EXCEEDED"` and a `budget` object:
`stems`, `buses`, `buffers`, `frames`, `channels`, `sampleRate`,
`requiredScalarSamples`, `limitScalarSamples`, and `maxProjectFrames` (bounded by
both this topology's graph cap and the 600-second project cap). The CLI prints the
same actionable message on stderr and exits nonzero. Successful validation still
returns the normalized plan, not an estimate or a guarantee of source readiness.
Other resource errors remain separate; no runtime capabilities probe is needed
for plan validation.

Shortening source selections reduces prepared PCM, not the full graph allocation.
Export views crop a fully processed master, so a short view cannot bypass this
limit. The two 20M budgets are not added together and neither can borrow unused
capacity from the other.

Automatic project segmentation is not implemented. Naively rendering independent
chunks can reset clip fades/automation coordinates, cut baked source tails, or
change seam treatments and encoded padding. External stateful processing (such as
reverb or dynamics, unsupported by this core) also requires continuity and tail
handling. A separately authored segmented workflow needs explicit sample-boundary,
envelope, tail and final-assembly verification plus actual listening; passing
these numeric budget checks is not evidence of audible equivalence or acceptance.
