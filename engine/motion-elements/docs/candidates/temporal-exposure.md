# Private candidate contract — not public registration

# Bounded temporal exposure — private candidate

Original JavaScript implementation. Not registered or publicly published.

`compileTemporalExposure({offsets,weights,boundary})` freezes 1–32 unique integer past-frame offsets (0–3600), finite nonnegative weights with positive sum, and an explicit `transparent` or `clamp-start` boundary. Weights normalize via maximum scaling to avoid sum overflow; underflowing positive relative/normalized weights are rejected. Exact caller arrays must be dense, ordinary data arrays without extra fields/symbols/accessors; no custom iterator is invoked.

`sampleTemporalExposure(plan,frame,{width,height,readFrame})` requests each distinct positive-weight source frame once, in first-tap order, copying each returned base Uint8ClampedArray before further callbacks. Shared backing buffers/subclasses are rejected. Frame is a nonnegative safe integer; only past offsets are supported. Before start, transparent contributes zero without renormalization, or clamp reuses frame 0. No automatic end-of-media policy exists: the caller owns the frame provider for every requested nonnegative absolute frame.

Dimensions 1–2048, at most 1,048,576 pixels and 8,388,608 pixel-taps per call. No history accumulator or hidden warm-up: repeated/out-of-order calls depend solely on source data and plan. Resource checks precede frame callbacks. Callback work itself remains caller-controlled; no time bound on user code is promised.

Input is straight RGBA8. Samples accumulate weighted alpha and weighted RGB×alpha, then unpremultiply and round; zero-quantized alpha is canonical transparent black. Arithmetic is **encoded-byte RGB**, not linear-light/physical camera exposure, optical flow or sub-frame interpolation. Output sourceFrames records actual callback identities. It is distinct from spatial convolution and source-over layers; this distinction does not itself guarantee visual quality or public foundation status.

## Evidence

Tests include independent hand rational premultiplied oracle, transparency pollution, start boundary/cache, seek determinism/copy isolation, overflow/underflow, illegal input and adversarial iterator/subclass/shared-buffer cases. Independent review found a real custom Array iterator bypass in initial b347…; fixed version a7cef74980de15e47f175256eb57630e4dadc60ce8709dac8f56a35d994f47aa rejects that class. Retain failure history; no false first-pass claim.

## Reference chronology

2026-10-29 17:55 UTC, **before implementation**, consulted FFmpeg official `tmix` documentation and `vf_mix.c` license/source overview, plus the official legal page. The conceptual comparison is finite weighted mixing of successive frames. FFmpeg also supports signed difference kernels and plane-specific controls; this candidate deliberately does neither. No C source was copied, translated, bundled or linked. The implementation and premultiplied-alpha contract were authored independently in JavaScript.

- https://ffmpeg.org/ffmpeg-filters.html#tmix
- https://ffmpeg.org/doxygen/trunk/vf__mix_8c_source.html (Paul B Mahol, LGPL 2.1-or-later header)
- https://ffmpeg.org/legal.html (LGPL baseline and optional GPL components)

The source listing/license header was inspected at 17:55; the exact current `tmix` section was explicitly located and read at 18:04, after first implementation. Do not describe that later section reading as earlier line-level source study. This is an algorithm-reference note, not legal advice.
