# Umbrella pictogram geometry candidate

A source-only **candidate**, not a registered family or portfolio work. It returns the local geometry of one opening/furling umbrella pictogram, adapted from credited LemoLab MIT source. [Credits](CREDITS.md) and both MIT notices remain required. It supplies no scene, weather, motion controller, rendering backend, fonts or sound.

## Interface

`sampleUmbrellaPictogram({ openness = 1 })` in [umbrella-pictogram-geometry.mjs](umbrella-pictogram-geometry.mjs) accepts one same-realm plain or null-prototype options object. A VM/cross-realm bridge must create a local plain options object. The only key is `openness`, a finite number in **0–1.15**. Omitting options or passing undefined uses an empty options object. An absent openness defaults to 1, but explicit openness: undefined, null or strings are rejected. Extra own string/symbol keys, arrays and exotic prototypes are also rejected. It does not clamp out-of-range inputs. Inputs are assumed trusted, ordinary in-memory objects; validation is not a sandbox for hostile getters or proxies.

The deeply frozen return uses normalized units, with positive y down and reference origin at the fully open canopy rim center. The caller chooses position, radius/scale, rotation, paint and camera transform:

- `canopy.upper`: 29 points, left-to-right along a 28-segment top half ellipse. `canopy.hem`: four quadratic bays, right-to-left, each with `control` and `end`. Connect in that order and close.
- `gore`: ellipse descriptor; draw its half-ellipse and close, **clipped by the canopy**. It is not an independent unbounded filled ellipse.
- `shaft`, `ferrule`: line endpoints and stroke widths; `handle`: circular arc descriptor and width. `lineCap` is `round`. Paint shaft and handle behind canopy, then canopy, clipped gore, and ferrule.
- `width`, `height`, `rimY`, `scallopDepth`, `openness`: exact normalized construction parameters, not raster bounds or collision shapes.

At 0 the canopy is narrow but not a zero-width line. Above 1, width and shaft end continue extrapolating; height, rimY and scallopDepth use openness capped at 1. Canopy/hem x coordinates and gore radiusX continue to follow width. This bounded width overshoot preserves the source's opening gesture. There is no implicit time or easing.

## Use and non-use

Useful for a consistent icon seen alone, folded on a support, or repeated in a shelf/pattern. Geometry changes preserve a recognizable silhouette without swapping unrelated closed/open drawings. It is not cloth simulation, a physical umbrella, an arbitrary canopy generator, SVG parsing, a collision solver or a general path morph. It uses a fixed 28-segment top arc; very large output scales can reveal facets. Returned construction extents exclude stroke caps and are not certified safe bounds.

A Canvas adapter needs only ordinary path operations; no runtime dependency is imported here. Match operation order and floating-point arithmetic when checking a port. Snapshot equality between two times says nothing about the chosen motion's intent or pacing. Frozen structures can be shared or caller-cached; this module itself has no cache or global mutable state.

## Validation

Run `node --test engine/design-elements/recipes/candidates/umbrella-pictogram-geometry-candidate/umbrella-pictogram-geometry.test.mjs` from the repository root. Tests cover domain limits, fixed topology, finite output, independent calls, immutability and equivalence to the credited source geometry arithmetic. These are numerical/unit checks, not browser, cross-platform raster, physical, perceptual or artistic acceptance. Actual film integration is separately verified at the consumer, not inferred from this package's presence.
