# Design with density plates

Start with what each ink contributes, then design the image in three density channels. Do not draw an ordinary colored illustration and expect the compositor to infer separations. Test one plate at a time: the subject should disappear only when the story intentionally withholds that plate.

## Composition choices

- **Knockout or overprint:** source-over can replace all three densities; additive drawing can overlap selected channels. Choose per object. Check white openings and two/three-ink overlaps separately.
- **Screen scale:** period is in output pixels. Choose at delivery resolution and inspect native-size strokes, small lettering, low-density dots and solid fields. It is not ideal area-calibrated coverage.
- **Registration:** small stable offsets communicate independently printed plates. Large/random offsets can destroy captions and silhouettes. Off-image samples extend the edge pixel, so pad content if paper is needed outside a shifted plate.
- **Motion:** keep camera, character poses and print sampling separate. For example, a camera can move each frame while a character updates on twos. Hold base plate registration within a shot; use a motivated decaying event rather than random full-frame jitter.
- **Boil:** make shot-fixed material variation the baseline and use the smaller changing component deliberately. Grain zero is not a neutral-material bypass.
- **Color:** use mandatory caller palettes and test overlap before production. Multiplicative RGB is an authored appearance, not physical ink/color management. A light paper is not a guarantee that all overlapping inks remain legible.

## Useful tests and limits

The two synthetic fixtures intentionally differ: one uses stepped densities and overlapping discs; the other uses radial bars and a central knockout. Test changed content as well as changed colors. Include gated plates, sweep edges, repeated times, different render order and fresh instances. Read the result, not only an exit code.

There is no reflection, automatic trapping, photographic separation, typography layout, camera, implicit timeline or sound in this recipe. Use existing geometry or typography tools for those responsibilities. If a story requires water reflection, retain a separate explicit implementation rather than quietly discarding it.

A shared visual/sound cue schedule can support intentional plate/voice entrances; it does not establish perceived sync or audio quality. Native-size frame review, full-speed playback, actual listening and rights checks remain separate from shader equivalence and numerical tests.
