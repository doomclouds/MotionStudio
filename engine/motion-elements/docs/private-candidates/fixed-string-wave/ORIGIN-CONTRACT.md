# Fixed-end string wave — private minimal candidate

Original implementation of a bounded1D initial-value solution, not a new damped-response parameter or manually animated sampled band. Unregistered; no complete film yet.

`compileFixedStringWave({profile,speed})`: ordinary dense array2..128 normalized piecewise-linear points, x0..1 with minimum knot gap1e-6, y−1..1, endpoints exactly(0,0),(1,0); speed0.01..8 normalized string lengths/second. Strict data-object/array validation rejects unknown fields/accessors/symbol iterators. The plan copies/freeze-seals input.

`sampleFixedStringWave(plan,{time,samples})`: t0..60s,2..1024 uniform positions, absolute-time seek. A period2 odd extension of the initial profile is sampled at x±ct, then averaged. Endpoints are exactly zero in output; no cache history, temporal integration, force, drag or damping. Reflection changes sign through the extension. This is a weak solution for a piecewise-linear initial profile: zero initial velocity is in the weak and away-from-initial-knot sense, not a claim of a classical derivative at every sharp pluck corner. Initial displacement is exact at returned x values; a uniformly sampled output need not include every input knot.

Output mode/value bounds and time range are deliberately narrow. Floating-point phase reduction is not exact real arithmetic and very tiny phase motion can quantize away. No large-time or arbitrary-precision promise. The domain's finite speed/time product avoids overflow; sampled geometry can still alias sharp moving corners and should be sufficiently dense for display.

## Art and reuse

`design/study.mjs` produced5 viewed native concept stills. It actually uses returned wave points with existing `compileSampledBand`, and existing rational `sampleKeyframeTrack` for a plectrum. Before release, a caller pull envelope scales initial shape; after release, the ideal undamped solution remains undamped. The plectrum/contact choreography is a rough concept and has NOT passed final contact QA. The illustration is2D, no simulated soundboard or true instrument physics. Display wave speed is an artistic time scale and is not the audio pitch.

The draft looked recognizable as three strings/bridges, but remains visually restrained; it is not accepted or a delivered film. No audio, encoded film, normal-speed review or listening happened in this candidate study.

## Primary-source reading chronology and rights

Duke's primary teaching module was read before implementation (initial research18:13 UTC; revisited18:26UTC):
https://sites.math.duke.edu/education/ccp/materials/engin/wave/wave1.html
It states fixed-end constraints, initial displacement/velocity, d'Alembert traveling terms, and odd alternating continuation for a finite string. Page copyright says CCP and authors,1999–2001. The further copyright-link click failed; no additional permission/license was inferred. No page text, diagram, asset or code was copied into implementation. Only established mathematical concepts were independently implemented.

MIT OCW license was independently inspected during earlier planning and is CC BY-NC-SA4.0, NOT the MIT software license. No OCW course material is bundled or claimed as read algorithm source here.

Tests6: exact symmetric tent phases/period, fixed endpoints/max absolute displacement/seek, hand asymmetric profile, frozen-copy isolation, malformed and resource rejection, independent4096-term Fourier series oracle for an asymmetric triangular profile. Independent review is still required before production freeze.

## Follow-up pre-review evidence

Test suite now10 tests. Additional checks cover an asymmetric profile's half-period negative **spatial mirror** (not a universal negative of the same profile), full period, near-end samples with8192-mode oracle rather than only forced endpoint values, corner displacement continuity, and a specific exact IEEE max-domain cycle(60×8=480; remainder0). Fourier oracles are truncated approximations, not exact proofs:4096/8192 modes with2e−5/1e−5 tolerances. Piecewise-linear displacement is continuous with derivative corners; truncation may show Gibbs-like derivative behavior and convergence error near corners.

Current reviewed concept uses a compact triangular pulse, not the earlier whole-string tent; the earlier concept remains triangle-contact.jpg. Current stills show two propagating lobes and reflected sign inversion, rather than a global sine wiggle. Pointwise display samples use161 points; topology/near-knot slopes are an approximation to the continuous piecewise solution.

## Production follow-through (18:52 UTC)

Final candidate film is under `production/validation-resonance`, with a different authored contact plan: three separate18px-high picks,135px row spacing,45px negative initial pulse,52px resting offset,0.12s vertical withdrawal. The earlier single-pick `design/contact-plan.mjs` and positive-pulse study are NOT final choreography: a dense release audit found between-frame penetration even though600 output samples passed. A subsequent wider three-pick plan also hit a neighboring row. Both failures are retained under production QA/versions; do not reuse their PASS-at-output-times claim as continuous or final clearance.

The wave module itself remains frozen ab075458732132412a2f853d90e2f389380317c0905ec2736d115e4690a0a231. Final production consumes that exact module and records raw wave/band identities. Author gate passed, independent final review pending at this note's timestamp; no public registration or Library save performed by this producer.
