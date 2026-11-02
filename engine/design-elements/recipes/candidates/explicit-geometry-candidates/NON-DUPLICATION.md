# Scope comparison against existing inventory

Read-only baseline: MotionStudio dev `78efc55e7197bfc1575936e2a839404cf13ad635`. The requested “55” is a broad manual count of14 catalog families +9 recipes +32 public candidates, **not one unified registry**. We inspected Index/catalog, recipe README/manifests and nearest implementation files. This package does not revise that inventory or claim promotion.

| Existing method | Boundary / why this is not its replacement |
|---|---|
| geometric-marks | Six symbol motifs with labels and rotations; no maximal binary runs or arbitrary ordered inset stack / visible-band model. A generic square is not a new family by itself. |
| indexed-pixel-layer | Palette indices → exact integer-cell RGBA. Here a maximal run becomes a continuous capsule, and nested layers use ideal geometric areas rather than indexed pixels. Use the existing asset for true pixel art. |
| spatial-character-snapshot | Actual external-font characters addressed on a 2D character grid, markers/cursor/summary. Here explicit bits have no inherent characters or interpreter. |
| B10 value-grid / semantic-data | Equal-area values/range/units or semantic sequences. Here decorative matrices/layers are authored, not data values; never repurpose colors as real metrics without a new semantic design. |
| typographic-focus / expressive-type / rich-paragraph | Measured font text hierarchy/effects/rich layout. No font core, shaping or full alphabet is introduced here. |
| sampled-window | External RGBA source lookup/crop. No photo/RGBA input, cropping or image sampling here. |
| scalar/halftone fields | Numeric sampled field and intensity marks. No field function, sampling grid or analytic intensity. |

**Keep:** two narrow geometry relations with copied immutable models, exact run/area metadata and independent transparent rendering.
**Do not keep:** original page chrome, CTA/layout templates, complete MENDRA alphabet, FENRO seeded field/five motifs, background texture, generic caption renderer, random palette generator or new family registration. Source studies remain unchanged and are not claimed migrated to these APIs. New API-call evidence is only the two synthetic compositions and tests in this package.
