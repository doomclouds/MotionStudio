# Source, rights and changes

The shaded marker's felt curve, collar/barrel gradients, color band, end cap, highlight details and projected shadow are **adapted from LemoLab**, not claimed as wholly original MotionStudio artwork/code.

- Repository: [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar), fixed commit `bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00`.
- Adapted function: [`styles/whiteboard/demo/engine/wb.js`, drawMarker, lines 425–454](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/styles/whiteboard/demo/engine/wb.js#L425-L454).
- Related but **not extracted**: [`Pen`/`Timeline`/`penPose`, lines 225–292](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/styles/whiteboard/demo/engine/wb.js#L225-L292).
- Copyright (c) 2026 LemoLab. The unchanged [complete MIT license](LICENSE-LemoLab.txt) is retained from the [fixed source LICENSE](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/LICENSE). Keep that copyright and permission notice with copies/substantial portions of the derivative. Repository MIT does not replace it.
- The new bounded API, validation, returned anchor geometry, independently authored consumers and tests use the repository's [MIT license](LICENSE), Copyright (c) 2026 Palink.

## Adaptation boundary

The drawing keeps the source's normalized 430-unit construction and proportions. New `length` scales **all** icon, lift and shadow dimensions uniformly by `length / 430`. This agrees with the source's `pen.len=430` and camera zoom `length/430` within this bounded domain; it is not the source's arbitrary combination of a different pen length and independently chosen zoom. At `length=430`, source zoom 1 and pen length 430 map directly. Blur is bounded and serialized to six decimal places; extremely small numerical differences from the unrounded source are possible at other sizes.

Camera-to-screen conversion, hidden `ctx.setTransform` reset, zoom cap, per-frame sine wobble, pen identity, label, timeline, inter-stroke hops, in/out park motion and visibility policy are not copied. The caller supplies local position, angle, lift and whether to draw. A caller-selected angle can include its own deterministic motion. There is no private reproduction dependency or whole-film runtime.

The adapter preserves caller transform, clip, composite and alpha; it owns internal icon filter/shadow settings and restores state in `finally`. It exposes the nominal contact origin separately from the felt curve's forward axial point. Source-generated pixels are not an API or a promise of cross-backend exactness.

No source scene/story, images, font, music, sound effect, original film, upstream full engine, production evidence or generated sample is distributed. The existing polyline-sections and optional installed Native Canvas keep their own licenses; the latter is a test/render dependency, not vendored here. Check new drawing content and external dependencies separately.
