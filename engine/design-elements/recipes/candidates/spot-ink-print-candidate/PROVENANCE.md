# Provenance and license

Derived from **LemoLab**, [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar), commit `bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00`.

- [riso.js](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/styles/risograph/demo/riso.js): GLSL print algorithm and original WebGL composition, SHA-256 `38608d32fae1cf963983587d9c64cf21274334f90f9148621bafedb07ec42eb2`.
- [STYLE.md](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/styles/risograph/STYLE.md) and [DEMO.md](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/styles/risograph/DEMO.md): studied density-plate, registration, print-screen and partial-boiling design.
- [Original MIT license](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/LICENSE), Copyright (c) 2026 LemoLab: full unchanged notice at [licenses/LemoLab-MIT.txt](licenses/LemoLab-MIT.txt). It governs substantial derived portions and is not replaced by the root MotionStudio copyright. Original MotionStudio adapters, validation, fixtures and tests use the root MIT license.

## Adaptation

1. Removed water uniforms and reflection branch. Other shader equations retain upstream behavior, including screen threshold, pinholes, streaks and blots. A stale sweep-direction comment is retained; the contract states the actual left-to-right behavior.
2. Removed signature palette constants; inks and paper are mandatory. Boil defaults to 0 rather than .35, sweep to width+200 rather than 1e5. Fidelity consumers must pass explicit upstream parameters.
3. Replaced the scene-oriented factory with injected Canvas render/dispose, strict parameter/dimension validation, dedicated-context resource ownership, cleanup and error handling.
4. Added a canonical shader export, pure deeply frozen render plan and bounded JSON/JSONL transport. The Canvas adapter consumes this same plan.
5. Added original unbranded geometry fixtures, negative/lifecycle tests, optional externally supplied upstream comparison, a restricted local browser harness and one-process EGL diagnostic.

No story, figures, street, captions, fonts, music, original video/stills, full upstream oracle or production evidence is included. Upstream films/stills have separate CC BY 4.0 terms and third-party assets have their own terms; this source package is not a license to redistribute them. Optional verification only reads a caller-supplied, hash-matching original source file. No upstream scripts are downloaded or executed automatically.
