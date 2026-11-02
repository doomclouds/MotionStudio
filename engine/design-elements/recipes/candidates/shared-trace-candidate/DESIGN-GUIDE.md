# Design guidance: a shared moment, not a decorative sparkline

The reusable part is **one cursor applied to one finite time base**, not the source desktop arrangement. Plot geometry and numeric readouts must be derived together. Keep the data/cursor model outside layout; recompose it at wide and portrait sizes rather than recopying displayed numbers.

1. Separate plots with unlike units; this API rejects unlike unit labels in one pane. Reusing a unit label is not evidence the quantities really are comparable.
2. Give each series a caller-chosen stable color and pair that color with a readable label. Reserve magenta cursor for the shared instant, not a third signal. The examples use indigo/brick/purple on neutral paper; no default AI-green branding.
3. Use shared x domains across plots; select y domains deliberately and include all samples. Different y ranges should be obvious from tick values. Avoid “same visual height means same quantity.”
4. Put readouts in a separate column on wide pages and below plots on narrow fixed plates. An interpolated point is a constructed value between samples, not an observed sample. Expose its bracket and full value in the paired JSON.
5. Do not smooth merely to look elegant. This candidate joins every sample linearly and offers no FFT, decimation, streaming, device or audio claim.
6. Keep renderer-neutral numeric/geometry APIs. The tiny block labels eliminate font/network dependencies, but have intentionally restricted typography; they are not a substitute for a general text system. A future renderer must revalidate text fitting and retain the same model semantics.
7. Transparent plot/readout tiles are composable, not a full automatic page generator. Explicit positions may overlap; the caller chooses composition order. Extent overflow rejects rather than silently cropping.

The wide example compares two simulated process traces plus a capacity trace. The tall example uses damped offsets and a linear ramp, not the same content restyled. Both remain illustrative synthetic data. New colors, page proportions and grouping differ from TRACEWELL's five-pane editor. Neither includes the PlotJuggler app shell, upstream datasets, icons or screenshot.
