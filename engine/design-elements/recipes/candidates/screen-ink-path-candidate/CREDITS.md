# Source and rights

The affine point transform, screen-space arc-length resampling and normal-displacement line boil are adapted from LemoLab's `tx`, `toScreen` and `boilPts` in Rubber Hose `toon.js`. The sine hash, smoothstep value noise and scalar interpolation are from its shared `core/lib.js`. This is a credited source adaptation, not an original invention of those algorithms.

Fixed upstream repository commit: `bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00`.

- [Rubber Hose helpers: styles/rubber-hose/demo/toon.js](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/styles/rubber-hose/demo/toon.js)
- [Earlier helper source: styles/scifi-toon/demo/toon.js](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/styles/scifi-toon/demo/toon.js)
- [Shared hash/noise/interpolation: core/lib.js](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/core/lib.js)
- [Upstream MIT license](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/LICENSE)

The Rubber Hose source explicitly says it was copied from the Sci-Fi Toon helper and changed its ink color/line width, BASE pre-scale and arbitrary affine transform. This candidate preserves that source lineage; it does not attribute the shared line-boil technique exclusively to Rubber Hose.

Preserved: affine arithmetic, seven-unit sample spacing, 38-unit noise scale, original sample carry and endpoint rules, local normals, noise formula/weights and closed-seam blend. Additions: one pure explicit-state API, omitted-field defaults, bounded strict input validation, input/output isolation, fixed input/output caps with exceptions, original synthetic tests/documentation and small fixed numerical fixtures. The source's shape counter, frame cycling, mutable matrix stack, renderer, shape constructors and drawing helpers are not copied.

LemoLab copyright (c) 2026; the full original MIT notice is retained verbatim in [LICENSE-LemoLab](LICENSE-LemoLab). Palink copyright (c) 2026; the full MIT notice for candidate additions is in [LICENSE](LICENSE). Retain both notices when redistributing this module.

No upstream story, character, scene/background geometry, palette, font, media, film, frame, private production input, comparison report or local filesystem identity is included or authorized for publication by this candidate. External links identify source provenance, not bundled content or endorsement. A passing numerical test does not establish rights to other upstream materials or visual/user acceptance.
