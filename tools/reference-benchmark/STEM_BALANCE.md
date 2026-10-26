# Experimental offline stem-balance sidecar

Optional, separate CLI; no changes to benchmark schemas, default review, source media, mixes or approval gates. Requires NumPy only. No subprocess, decoder, URL fetching, source separation, weights or paid calls. Output is JSON, **COLLECTED_NOT_APPROVED / NOT_LISTENED**. It measures signal competition, not auditory masking or emotional suitability.

This is for **your own explicitly available post-gain/post-pan stems**. An X/reference video normally supplies only a mixed soundtrack: it cannot supply a comparable SFX/music ratio through this tool. Do not invent stems or infer missing effects from full-mix peaks. Reference full-mix features and actual listening remain separate evidence; this tool does not replace a listening/model review workflow.

## Run and input

```sh
python tools/reference-benchmark/stem_balance.py /private/config.json \
  --input-root /private/aligned-stems --output /private/new-diagnostic.json
python -m unittest discover -s tools/reference-benchmark -p test_stem_balance.py -v
```

`--input-root` is an explicitly selected local directory. Asset paths must be relative, remain within it after resolving symlinks, and be distinct regular files. URLs, absolute paths and `..` are rejected. Keep output private; no media is uploaded. Output parent must already exist, output must not exist. Validated JSON is fully serialized before temporary-file creation, then published with an atomic, non-overwriting hard link; a filesystem that cannot support this fails without silently overwriting. Exit 0 means collection and conditional reconstruction-bound compatibility only; exit 2 means invalid contract or reconstruction mismatch. A mismatch still produces a clearly labelled diagnostic of the supplied groups, not attributed final audio.

Supported media: little-endian RIFF WAVE **IEEE float32 format tag 3**, native **48 kHz**, mono `["M"]` or stereo `["L","R"]`; exact shared sample count, channel labels and origin required. No resampling, lossy decode, padding, automatic origin shift or normalization. Extensible WAV, RF64, integer PCM, compressed audio and other rates fail explicitly. RIFF/chunk sizes, alignment, optional fact count, finite samples and amplitude magnitude ≤16 FS are checked; the latter is only a resource/numerical scope limit, not a clipping-quality policy.

Bounds: 2–8 stems plus master; ≤64 MiB each, ≤384 MiB total; ≤64 KiB configuration; one event ≤2 s, native-sample-aligned boundaries; ≤16 MiB serialized output. Reconstruction checks all source samples in bounded blocks, spectral analysis only event-overlapping windows. Unknown config/asset fields and duplicate JSON keys fail. These are trusted operator-selected files, not a security sandbox for concurrently mutated hostile directories.

Minimal shape (replace hashes with actual complete-file SHA256; this is not a runnable media fixture):

```json
{
  "schema": "motionstudio.stem-balance/1",
  "rounding_model": "independent_f32_exports_of_common_sum",
  "provenance_note": "Describe actual export arithmetic, shared effects and any uncertainties",
  "event_interval_s": [10.5, 10.74],
  "analysis_floor_db": -100,
  "per_channel": true,
  "stems": [
    {"path":"sfx.wav", "sha256":"ACTUAL_SHA256", "origin_s":0,
     "channel_labels":["L","R"], "post_gain_post_pan":true, "group":"target"},
    {"path":"music.wav", "sha256":"ACTUAL_SHA256", "origin_s":0,
     "channel_labels":["L","R"], "post_gain_post_pan":true, "group":"background"}
  ],
  "master":{"path":"master.wav", "sha256":"ACTUAL_SHA256", "origin_s":0,
            "channel_labels":["L","R"]}
}
```

`origin_s` is the first sample's time relative to actual first video PTS, not inferred from filename. Event uses that same timeline. Hash binds bytes but does not prove source identity, channel meaning or post-gain declaration. A grouped actions stem measures all overlapping actions, not one named source. Shared nonlinear bus processing, omitted tracks, independent gains or unknown routing prevent attribution; even a small residual does not prove the declared pipeline. `final_mix_attribution` is therefore always `NOT_ESTABLISHED`.

## Reconstruction: conditional numerical compatibility

Assumption: stems are individually round-to-nearest IEEE binary32 exports of components of one underlying sum; master independently rounds that sum. It is **not** a claim of sequential float32 mixing and not independently verified exporter arithmetic. Let `u=2^-24`, `n` stem count, `A=sum(abs(stored_stems))`, `m` stored master. The per-sample bound is:

```
u/(1-u) * (A + abs(m)) + (n+1)*2^-150 + gamma_n_float64*A
gamma_n_float64 = n*2^-53 / (1-n*2^-53)
```

The first term bounds independent normal-value export rounding; the second conservatively covers subnormal rounding; the third covers the diagnostic's float64 accumulation. This conservative relative-error bound preserves component error under cancellation; it is not a hand-selected dB tolerance. Max residual/bound, residual RMS and count above **each local bound** are reported. No user-selectable tolerance can turn a mismatch into approval. Exact zeros stay exact. If the pipeline is different or unknown, retain that uncertainty in `provenance_note`; do not reinterpret compatibility as identification or musical success.

## Measurements and supports

- Event RMS: common `[start,end)` native samples, mean squared across samples and channels, in FS² and `10log10(power)` dB re 1 FS². Difference is target minus background dB. No independent activity gating or level matching.
- Spectrum: full **3072 sample/64 ms periodic Hann** windows at **1200 sample/25 ms** hop, anchored to the source start. Native 48 kHz one-sided PSD, multiplied by bin width, integrated into **48 triangular HTK-mel bands spanning 40–20,000 Hz**. `band_edges_hz` stores 50 overlapping triangle breakpoints, not disjoint bin edges: band k uses lower=points[k], centre=points[k+1], upper=points[k+2]. Stereo uses mean channel power, never summed mono; optional L/R values are separate, not binaural loudness.
- This intentionally differs from the existing benchmark's resampled 16 kHz / 40–8,000 Hz spectrum. Do not compare them as identical bins. Neither bank represents critical-band excitation or a psychoacoustic masking threshold. Above 20 kHz and below 40 Hz are not represented; transient resolution is bounded by 64 ms support.
- Select windows by support overlap, not centre-in-event. Each carries start/end, centre and boundary-crossing flag. Crossing windows include outside-event content. No padding: short sources and tail-only events can lack full windows. `spectral_status`, `frame_count`, exact uncovered event intervals and source-edge-context flags make this explicit. Hann endpoints can give zero weight to a boundary impulse; coverage is geometric, not a guarantee of sensitivity.
- Exact target/background zeros have distinct states and null ratio. Nonzero low-level values retain numbers and independent below-analysis-floor flags (default −100 dB, configurable −200..−20). This is a **display/analysis floor, not hearing threshold**. Near-floor differences can reflect dither/leakage. No floor gating erases data. Compare sensitivity by rerunning another declared floor; signal values are unchanged.

No global masking score, automatic event label, onset adjustment, duck or remix is produced. Equal broadband ratios can have disjoint spectra; overlapping spectra can still be perceptually segregated. Antiphase or correlated stems can cancel despite large separate energies. Informational masking, temporal masking, binaural unmasking, playback SPL, listener attention/hearing and intended dramatic role remain outside the model.

## Primary research, not claimed model implementations

- [ITU-R BS.1770-5](https://www.itu.int/dms_pubrec/itu-r/rec/bs/R-REC-BS.1770-5-202311-I!!PDF-E.pdf): programme loudness/true peak, not target audibility. Existing benchmark already meters these.
- [EBU Tech 3341 (2023)](https://tech.ebu.ch/docs/tech/tech3341.pdf): ungated 400 ms momentary/3 s short-term versus gated integrated loudness. This tool's 64 ms powers are not EBU momentary LUFS.
- [Glasberg & Moore (JAES 2005)](https://aes.org/publications/elibrary-page/?id=13391): partial loudness uses target/background excitation and temporal integration. Publisher abstract verified; paid full text not obtained, no formulas implemented.
- [Ma, Reiss & Black (AES 2014)](https://aes.org/publications/elibrary-page/?id=17098): musical-stem equal-loudness study found model underestimation, cautioning against unvalidated domain transfer. Publisher abstract and indexed author-paper passages verified; direct author-PDF fetch failed. No model replication.
- [Synchformer (ICASSP 2024)](https://www.robots.ox.ac.uk/~vgg/publications/2024/Iashin24a/iashin24a.pdf): sparse-cue synchronization is separate from sound balance; model not run.

Synthetic tests establish arithmetic/contracts only. Normal-speed listening of bound media, declared device/level context and the intended sound-role brief are required for audible clarity or emotional-fit conclusions. Any mix change must stay within the user-authorized scope and be checked by A/B audition; already authorized polishing does not require repeated permission. This diagnostic never remixes, and no metric upgrades listening or owner approval.
