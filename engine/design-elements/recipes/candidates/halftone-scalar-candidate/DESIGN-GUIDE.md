# Composing a scalar halftone tile

Use this recipe as an abstract editorial texture/panel when you have explicit normalized scalar data and rights to use it. It does not convert an arbitrary image, preserve a source silhouette or extract scientific data. Low/high values influence dot radius and palette mixing; vignette, gamma and bicubic clamping make it unsuitable for claiming accurate visual area percentages. For measured quantities, show the original numbers in another verified component and use a validated chart rather than decorative halftone.

Keep pitch large enough to resolve at delivery scale. Inspect the full-size image and final reduction: rotation/grain can cause aliasing or moire. Do not claim print quality without physical proof. Palette contrast and text readability on a tile are caller decisions; this API deliberately supplies no typography and makes no WCAG claim.

Example1 uses a new9×7 analytic wave field, two rectangular panels and sparse graphic rules. Example2 uses a new7×9 two-island field, a tall and a wide panel with a warm palette. These are genuine different scalar inputs and compositions, not copies of the reference-calibrated mesh, but remain demonstrations of one visual system, not separate real commissions.

Core does not receive a target context. Call drawImage at your desired position and use your own clipping/transforms. Transparent background is not supported; the tile is opaque, and host alpha/composite behavior belongs to the caller. No invented primitive family count: formal registration requires future deduplication against existing texture/color/grid helpers and specific review.

## Color decisions, not a prohibited hue

Green is not a forbidden color. Any valid caller RGB palette remains supported, including green when suitable for the content or brand. Omitted-palette behavior uses a neutral charcoal/slate and warm-paper preset because the generic renderer has no brand or real measurement context. The two explicit examples use cool indigo waves versus warm terracotta islands to distinguish two abstract compositions and balance their paper backgrounds; these are demonstration art-direction choices, not categorical quality rules. Neither fixture describes actual sea/vegetation data or implies a scientific hue mapping. Choose color for purpose, hierarchy and contrast; do not mechanically remove green or infer a permanent user aversion to it.
