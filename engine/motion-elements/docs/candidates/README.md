# Five private candidates — review entry, not registration

> Historical pre-registration snapshot. Private/unregistered counts, old publication blocks and proposals below describe that earlier stage, not current status. Current catalog: 60 foundations + 7 recipes; expansion paused. See [current registration and runtime boundaries](../registered-foundations.md).


This isolated preparation tree adds no public catalog ID, package export, published module count, dependency or shared validator change. Import explicitly from `lib/candidate-index.mjs` only during private review. Canonical public `lib/index.mjs`, `catalog.json` and their39-foundation/7-recipe contract stay unchanged. Do not count playback modes, seed variants, styles or helpers separately.

| Responsibility / canonical private module | API | Time/input unit |
|---|---|---|
| motion/finite-particles | compileFiniteParticles / sampleFiniteParticles | bounded IEEE Number seconds; analytic one-shot lifetimes and constant acceleration, NOT integration/collision/fluid simulation |
| layout/weighted-hierarchy | layoutWeightedHierarchy | dimensionless nonnegative leaf weights and continuous rectangles; no clock |
| raster/temporal-exposure | compileTemporalExposure / sampleTemporalExposure | integer whole-frame offsets and absolute frame; encoded-byte RGBA accumulation, NOT physical light |
| layout/poisson-disc | samplePoissonDisc | circle-domain coordinates/minimum center distance; static seeded points, NOT trajectory planning |
| raster/sprite-atlas | compileSpriteAtlas / sampleSpriteAtlas | caller-defined integer ticks, declared integer source rectangles; NOT a ticker, image loader or geometric morph |

All five implementations are byte-identical to their independently tested film-source candidates. This path move is source equivalence, not a claim that a new canonical path has been used to re-render the original films. Private origin/film/hash mappings are retained outside the source tree in the audit evidence. Any later algorithm change requires new independent review and actual full-film version bridging before generic-ready claims.

The compile/sample pairs retain module-instance plan branding and copied frozen plan data. The two stateless layouts produce frozen results. Temporal exposure returns a new mutable pixel buffer by design. Uniformity does NOT mean silently changing seconds into ticks or pretending these APIs share one clock contract; adapters must state conversions.

Input contracts deliberately accept bounded ordinary same-realm records/arrays, reject unknown fields/accessors, and do not promise to sandbox adversarial Proxy traps or arbitrary host objects. Raster callback cost is caller-owned. Original runtime toolchain dependencies remain separate from these zero-new-dependency functions.

Tests validate API arithmetic, bounds, isolation and backend-specific synthetic pixels, not user artistic acceptance, actual listening, perceived sync or cross-platform bit identity. Private film reviews retain those distinctions. The sprite source-addressing mechanism has real prepainted atlas consumption evidence; three playback modes are one candidate, not three foundations.
