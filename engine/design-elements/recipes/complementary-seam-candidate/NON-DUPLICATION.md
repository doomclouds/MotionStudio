# Incremental scope against fixed dev

Evaluated against MotionStudio dev `b7841f6f865e3f7b1dbd0e1063f6ea470c66da32`, tree `6073513e3e8e449c0dd74d5fb86310646e64a8a7`. The working “58” is a broad inventory of 14 catalog families, 9 formal recipes and 35 candidate methods, **not a single authoritative registry**. We inspected current Index/README/contracts and nearest implementations; a directory or internal helper count is not a method count.

| Existing scope | Why this is / is not new |
|---|---|
| sampled-window (`lib/sampled-window.mjs`) | Already copies exact center-nearest pixels into disjoint destination rectangles. Rectangular piece permutation and lifted-cell reuse are therefore rejected as new methods. We reuse its exact published helper only in examples; new core does not reimplement sampling. |
| indexed-pixel-layer, halftone-scalar | Map supplied palette/index/scalars to color fields; do not assign one supplied RGBA plane to complementary nonrectangular parts. |
| material-surfaces paper/glass | Rectangular surface material and shadow; no shared authored seam or complete pixel ownership partition. |
| expressive-type sliced-text | Text-only horizontal strip masks/offsets, not arbitrary RGBA complementary seam pairs. |
| authored-paths, proportional-partition, xhs08 | General path or quantitative share geometry; no shared RGBA sample ownership. We do not promote general polygons or quantitative partition charts. |
| color-sections, semantic-data, B10, flow-ledger | Already solve color hierarchy/stages/counts; no new colored-stage candidate is retained. |
| drape-material, scalar-field, nested-squares, row-runs | Original material/geometry generation, not splitting supplied image samples. The example plates are fixtures, not new generative methods. |

**Retain exactly one restricted method:** one monotone authored seam → two complementary full-plane pixel masks with exact owner counts and independently placeable transparent tiles. No registered family, formal recipe or whole-page adapter is added. No claim that every possible conceptual relative in the repository was exhaustively excluded by a numeric inventory alone.
