# Designing with the seeded resin surface

This is a restricted static source candidate, not a registered family, reviewed recipe or accepted artwork. The [README](README.md) owns the callable contract, runtime requirements and rights.

## Choose it for

A quiet illustrated card/glyph surface with sparse rounded inclusions, a broad bent light band and darkened edges. Use a raster cached once per model when applying motion or repeated glyph clips. Keep important text on a separate quiet label. It is intentionally graphic, not photographed resin, optical transmission, volumetric refraction or physical bubbles. It always paints a rectangular colored base under its overlays; it does not sample the scene behind it.

Do not choose it for cloth folds, photographic materials, live lighting, arbitrary 3D viewpoints, semantic scientific diagrams, or high-frequency moving texture. A new seed is a **different static model**, not a smooth animation control. Changing counts can reorganize the drawing; do not interpolate seeds as animation.

## What the parameters mean visually

The [implementation](index.mjs) separates model compilation from drawing. A seed fixes inclusion positions and sizes; the two explicit colors establish the dark body and light overlays. Count changes the number of inclusions, radius their maximum relative size, and bend the broad light band's curvature. These are authored decorative choices, not measurements of a material. Keep one model stable while choosing the surrounding composition.

The base covers the entire tile. A caller wanting a letter or silhouette must supply its own clip or cached-tile composition; the candidate neither discovers that outline nor shades its contour. Do not interpret an attractive tile as evidence of readable glyphs. Review the actual mask, label contrast and output size separately.

## Deduplication

- Existing `material-surfaces` supplies paper/opaque/glass information panels and caller backdrop integration. This package neither replaces nor calls that API; it supplies seeded internal decorative geometry rather than a content container.
- Existing `drape-material-candidate` uses analytic brightness columns for cloth-like folds. This candidate does not copy its field, sample formula or renderer.
- Existing scalar/halftone candidates map supplied scalar fields to patterns. No scalar input, measured data or halftone is claimed here.
- Existing contour-rim shades the boundary of an alpha mask. This package does not shade arbitrary masks or extrude glyphs; caller clipping remains separate.
- Related matte-paper and glaze sketches were not extracted: generic layered paper and color pools alone did not justify another reusable candidate. No new “material engine” is claimed.

## Two transfer probes, not presets for every brief

[fixtures.mjs](fixtures.mjs) changes aspect ratio, dimensions, seed, count, radius, bend and palette between a 240×360 amber surface and a 520×220 blue-gray surface. This tests the same bounded mechanism in tall and wide regions. The caller still decides placement, supporting type and the importance of the surface relative to content.

[test.mjs](test.mjs) checks owned deterministic models, bounded inclusions, invalid inputs, placement and failure restoration. [test-native.mjs](test-native.mjs) renders both fixtures at 1×/2×, compares identical configurations, checks clipping/state and removes inclusions as an ablation. The ablation isolates their visual contribution; it does not certify that either style is preferable.

Object-local coordinates are not a guarantee of identical pixels after translation, clipping or scaling. Cache once when exact crop identity is needed. No continuous-motion, perceptual anti-flicker, physical-optics or user aesthetic acceptance follows from the static tests.
