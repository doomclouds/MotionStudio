# Give a flat silhouette a readable edge

## Intent and selection

Use a narrow directional rim when a large, already readable silhouette needs a little surface character without adding another object, shadow system or competing texture. Keep the broad face quiet. The source of meaning remains the word or authored shape; the rim is a secondary material cue.

Useful contexts: a large display title, a static object concept sheet, or a rasterized identity mark with generous counters. Choose ordinary flat ink for body copy, small UI icons, accurate diagrams and low-resolution labels. The helper cannot establish a brand, layout hierarchy, physical material or manufacturing detail by itself.

## Two actual consumers, different responsibilities

[consumers.mjs](consumers.mjs) calls the **existing** `shadeContourRim` implementation. It supplies two original fixed compositions, not copied source scenes:

- `open-form`: 960 × 600 letterform workshop invitation. Two measured serif lines carry the effect; large counters, narrow serifs and diagonal strokes exercise typography. Small invitation copy stays flat and is outside the rim mask. The narrow three-pixel band lends a cut-paper/engraved suggestion; it is not a claim of metal. Replacing the two title strings must pass actual ink bounds, without automatic shrinking.
- `loop-tool`: 800 × 800 illustrative carry-tool concept. An independently authored rounded loop, central opening, stem and teeth carry the rim. Plain title, index number and annotation baseline organize a product sheet. Its five-pixel band separates a pale object from a pale ground without changing the opening. The silhouette is illustrative, not a CAD or safety specification.

The consumers accept a caller Canvas API and caller-registered font. They return the canvas, exact mask alpha/shaded bytes, rim placement bounds and copy regions. This makes the actual compositing boundary inspectable. They are deliberately fixed brief examples, **not** a general layout engine or a public family adapter. The object geometry remains authored content, not a parameterized product generator.

## Tradeoffs and counterexamples

- A rim that consumes a narrow stroke no longer behaves like an edge around a face. Start narrow, inspect the smallest delivery view, then reduce contrast or omit it. Do not thicken all strokes automatically to rescue an effect.
- Rounded corners and counters expose the chamfer approximation. A bright/dark edge can staircase; increased contrast makes it more obvious. An anti-aliased source does not turn this into an exact distance-field renderer.
- Small text can remain technically unclipped yet be unreadable. These consumers' half-size previews are inspection views, not a claim that their 6–7 px metadata is an acceptable final layout. Recompose small delivery variants with larger flat supporting copy.
- The same directional shading touches every merged shape. Objects requiring different lights, material identities or occlusion relationships need separate masks or a different rendering approach.
- High-contrast broad bands, full-face texture and offset extrusion alter the design question. Do not bundle them into the rim ablation. Compare identical content/background/position with only `enabled:false`.
- In the title example, the flat control is still a viable design. That is intentional: the effect adds character, not essential legibility or missing content. On the pale object, the rim carries more edge separation, but should not be the sole means of recognizing a critical symbol.

## Classification and next evidence

This is a reusable **static raster foundation candidate**: alpha mask → same-alpha shaded RGBA. Its two distinct consumers support reuse beyond a ring test, but do not establish one shared semantic Design family. An adapter that merely supplies bounds/data/theme around these bytes would add API surface without another design responsibility. No Design registry entry or count is added.

A shared raster foundation consumed by both Design and Motion is a more natural eventual home than a new design family. Current tests prove only static sampling. Before promoting into a Motion foundation, compare its contract with that domain's existing raster utilities, add an actual time-sampled consumer and inspect temporal stability of moving/resampled masks and light. Cache stable masks rather than recomputing a distance field per frame without measurement. This document proposes classification; it does not move code, register a Motion mechanism, promise frame rate, or imply animation validation.

## Evidence boundary

[verify-consumers.mjs](verify-consumers.mjs) executes both compositions, exact per-byte alpha preservation, enclosed transparent holes, identical layout in the enabled/disabled pair, deterministic rendering in the supplied environment, rejected overflow, and unchanged final pixels outside the affected mask. It writes native-size, half-size and paired ablation PNGs only to an external output directory. These are synthetic static transfer tests; independent visual review and user acceptance remain separate. See [README](README.md) for execution and provenance.
