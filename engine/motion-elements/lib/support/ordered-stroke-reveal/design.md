# Design choice: retain ordered source, reveal inside each stroke

Use this when the input already provides individually closed stroke outlines and directed, ordered centerline medians. A heading that must visibly write in Chinese is a reasonable consumer, but choosing handwriting style, text position, duration and pen performance remains director work.

The new responsibility is the association of outline + directed median + explicit sequential timing, not arc-length math. Existing polyline-trail supports sampling a head/trail, but a uniform sampled trail can cut across an omitted corner. Existing polyline-sections retains every prefix vertex, so this consumer reuses its compiler/extractor for both ink path and centerline tip. General local-geometry reveals, whole-word wipes and glyph contour tracing cannot substitute for real ordered-stroke input. Do not label those as stroke order.

The empty and completed states must be reliable before any styling. Empty prefixes draw no round cap/dot. Completed strokes fill the authoritative outline, not an approximate median tube. In between, clip only the current stroke outline and paint its prefix. This keeps asymmetrical source stroke silhouettes without implementing a third-party animation engine. Straight segments, sharp bends and disconnected strokes use the same operation. A gap gives the external pen a lift cue, not an ink bridge.

## Deliberate tradeoffs / counterexamples

- A brush cap protrudes past its center. The endpoint is suitable for an anchored marker, but not proof the physical contact point exactly matches the outermost black pixel.
- A broad mask crossing nearby portions of a folded outline may expose future ink early. Smaller width reduces early reveal but can leave uncovered side lobes; there is no universally correct width.
- A too-short median, wide serif or isolated outline lobe may pop into view at completion. Full-outline terminal correctness and continuous-looking transition are separate tests. Compare immediately before/at completion at the actual render scale.
- Mislabeled ordering or a flipped median produces wrong writing even if every schema test passes. This module cannot infer or repair language correctness.
- Plain font outlines have no stroke identities/medians. They are unsuitable input; tracing their contour is not writing the character.
- No pressure, speed-dependent width, smoothing, nib contact physics, recorded movement or glyph aesthetics is inferred. A whiteboard-marker look is an external visual choice.
- Layout, Unicode segmentation, absent glyph handling and cross-glyph pen routing are not solved here. Compile requested data explicitly; fail missing glyphs instead of substituting a font wipe.
- Absolute-time geometry does not make cumulative painting reversible. Re-render a cleared layer for random access.

## Consumption and validation sequence

1. Establish source rights and exact external resource identity; retain original license separately from code.
2. Check outline/median count, directional coordinates, bounds and content. Choose uniform placement, stroke timings and lift intervals explicitly.
3. Inspect zero, partial bends, each stroke end, each gap and the complete glyph. Compare final raster to independent whole-outline rendering; test p≈1 separately.
4. Drive marker contact from sample.tip (or adapter-local result.tip), using the same transform. During lift use lift.from/to as motion cues without drawing connecting ink. Hide or separately pose the marker after completion.
5. Replay/reverse times and compare pixels on cleared surfaces. Check short, folded and multi-stroke content, not only a long straight bar.
6. View the authored sequence at normal speed separately; mathematical/raster tests do not accept its pace, typography or handwriting quality. Keep private rendering evidence outside the public source package.
