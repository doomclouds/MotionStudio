# Provenance and changes

This limited recipe adapts the indexed-identity protection and two-palette selection technique studied in **LemoLab, lemo-opuscar**, MIT, Copyright (c) 2026 LemoLab. It is **not an original algorithm**. Preserve the complete license in `licenses/LemoLab-MIT.txt` in redistributed copies or substantial portions.

Fixed revision: `bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00`.

- https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/styles/pixel-rpg/demo/px.js
- https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/styles/pixel-rpg/demo/main.js
- https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/LICENSE

Changes: replace fixed story-specific palette/index protection with caller-supplied ordinary RGB hex tables and explicit index list; protection defaults off. Replace DOM output/pick callback with an explicit binary selection array and concatenate two caller tables into a model for the existing indexed renderer. Add strict bounded validation, fresh detached outputs and tests. No new rasterizer, nearest-color quantizer, luminance mapper, Bayer generator, story, ENDESGA colors, sprites, fonts, audio, or film is included in the reusable module. No upstream oracle or private production evidence is bundled.

New bounded adaptation, tests and documentation are offered under the repository's MIT license, Copyright (c) 2026 Palink, reproduced in `LICENSE`. These licenses do not establish rights to unrelated source assets.

Existing output dependency: `indexed-pixel-layer-candidate/index.cjs` at repository commit `b9cef7c354006fb413d6ea6a928dc081a2181f50`, under `engine/design-elements/recipes/candidates/`. Its own LICENSE, CREDITS.md, SOURCES.json and third-party notices remain applicable when copying that implementation. This recipe does not replace or expand its contract.
