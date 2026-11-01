# Designing with a shared seam

## Visual problem → actual method
A believable cut-and-rearrange composition needs one source identity, not two unrelated decorative crops. `partitionPixels` assigns every sample of the *same plane* to one side of one shared seam. The design meaning is continuity: two shifted pieces still belong together. This method is narrower and more testable than a “torn paper component”.

1. **Make a plane first.** Create/provide original RGBA. If scaling or windowing is desired, use existing `sampled-window`, then split the resulting plane. Re-sampling the two pieces independently can destroy their seam relationship.
2. **Author the seam.** A few large, irregular turns read at poster scale. Every point must span the full selected axis and stay interior. The implementation has no preset tear noise, fibers or physical simulation. Dense knots are not automatically better.
3. **Choose meaning by axis.** Horizontal splits support stacked narratives or editorial continuity; vertical splits support exchange or separation. Neither implies quantity unless counts/areas are explicitly labeled.
4. **Place the pair independently.** Each tile keeps full plane coordinates. Use the same origin to reunite them; move/rotate with host save/transform/restore to reveal the shared cut. Maintain enough room for the complete transformed canvas. The core does not fit or trim transformed parts and cannot ensure no overlap.
5. **Keep evidence honest.** `beforePixels`/`afterPixels` are sample ownership, not visible screen area. `beforeArea2`/2 is ideal geometry, not alpha-weighted ink. Source transparency remains separate from the mask. Counts stay valid even when host pieces overlap or clip, but visual coverage changes.

## Two new combinations, not two page copies
- **Split / Field** uses a warm paper background and original flat-color strata. A 7-segment horizontal seam separates two angled pieces. An independent detail rectangle from the existing sampler reinforces the common source. A side column carries the reading order; the footer counts are model-derived. Synthetic strata explicitly are not geology data.
- **Cut / Exchange** uses dark navy, coral/yellow/lilac geometry and a tall format. A square source is nearest-resampled into a non-square plane, then a 7-segment vertical seam creates left/right pieces. Rotation opens some parts of the seam and overlaps others: that is a host composition choice, not a new ownership calculation. The title/footer are fixed example chrome, not another candidate API.

## Selection decision
The private language-course case suggested a common-image tear; the toy case suggested shared source addresses. We retain only the complementary ownership rule. Rectangular cell permutations/selected-cell reuse can already use `sampled-window` and are not admitted again. Colored stages, palettes and badge counts are already covered elsewhere. No source portrait/toy or whole scene is carried into this package. Original case APIs are not retroactively migrated.

## Avoid
- Calling this a natural paper edge or expecting photorealism.
- Splitting different crops while describing them as one perfectly complementary plane.
- Comparing partial-alpha PNG bytes to the pure raw-array oracle.
- Using pixel counts as physical area, quantity or statistics.
- Calling two independent transforms a valid sliding-puzzle state, collision-free layout or interaction.
- Claiming aesthetic acceptance, universal accessibility, all-font coverage, browser parity or animation. New examples are static method demonstrations.
