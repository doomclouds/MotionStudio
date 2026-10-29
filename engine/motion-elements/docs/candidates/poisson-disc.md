# Minimum-distance disc distribution — private layout candidate

```js
import {samplePoissonDisc} from '../../lib/candidate-index.mjs';
const result=samplePoissonDisc({
  domain:{x:0,y:0,radius:300}, exclusion:{x:0,y:0,radius:100},
  minDistance:80, seed:8602, maxPoints:40, attempts:30,
});
```

Original bounded2D Bridson-style active-list sampler. It returns seeded points with at least `minDistance` between centers, inside the circle domain and outside the optional exclusion circle. Exclusion must lie strictly within the domain. The candidate is static layout, NOT collision dynamics, a trajectory solver, cryptographic RNG, exact-count generator or maximal packing proof. `maxPoints` is a cap; inspect returned count and termination (`point-limit` or `active-list-exhausted`).

Uniform-area annulus proposals use radii between r and2r; background cells accelerate neighbor checks. Initialization is rejection-sampled with a4096-proposal ceiling and may explicitly fail for an extremely narrow available domain. `attempts` defaults30, accepts1–64; points1–128, spatial grid≤262144 cells. Domain/exclusion x/y±1e6, radius0.001–1e5; minDistance0.001–2e5; seed uint32. All records have exact supported ordinary data descriptors; getters/unknown fields reject before reading values. Return is copied/frozen. No array input, callback or new dependency.

This is not grid jitter or an ordinary random cloud: an actual hard center-distance check constrains every accepted sample. Rendered-object radii, stroke/shadow bounds and protected visual clearance must be checked separately. BREATHING SPACE's private target-specific footprint evidence does so; its caller radial start assignment and existing handoff do not establish general collision-free travel.

Tests include independent brute-force pair/domain oracle across many seeds, offset exclusion, bounded proposals, exact grid budget, numeric extremes, narrow-domain termination, descriptor no-call checks and deterministic copy/freeze behavior. Research/rights in SOURCES.md.
