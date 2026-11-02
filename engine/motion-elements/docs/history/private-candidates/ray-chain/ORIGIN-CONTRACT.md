# Single-convex 2D optical ray chain — PRIVATE candidate

One new responsibility: nearest-boundary traversal and medium state across a single convex dielectric, including chosen Snell transmission and total internal reflection (TIR). NOT merely a direction helper; NOT a visibility fan, image warp, general scene/path tracer, Fresnel splitting or3D.

## API and finite inputs
`compileOpticalMedium({width,height,polygon,ior})`: viewport `[0,width]×[0,height]`, dimensions1..10000;3..32 finite vertices strictly convex **counterclockwise in numeric x/y coordinates** (positive cross product; this appears clockwise on a y-down Canvas). Every nonadjacent vertex must lie more than the distance guard inside each edge halfplane. Polygon wholly inside viewport guard. Glass IOR1.01..4, ambient air index fixed1. Each edge>4 distance guards. No holes/nesting/overlapping media/curves.

`traceOpticalRay(plan,{origin,direction,maxInteractions})`: origin strictly inside viewport, at least one distance guard from every finite medium edge; may lie inside or outside medium. Direction finite components bounded±1e6, norm>1e-12, normalized internally. Budget integer1..64 actual interfaces. Returns frozen chain segments from source to viewport. Each segment reports endpoints, medium, direction and ending (`transmit`,`tir`,`viewport`); an interface reports nearest edge, incoming-facing normal, outgoing unit vector, n1/n2, cosI, sin² transmitted angle. Complete successful output only; budget overflow throws, never masquerades as escaped light. Plans WeakMap authenticated; source data copied; result deeply frozen. All inputs ordinary own data objects/dense arrays; accessors, unknown fields, symbols, sparse/subclass arrays rejected. Hostile Proxy/intrinsic monkeypatching is not sandboxed.

## Meaning and geometry
Edges have outward right-hand normal `(dy,-dx)/length` for numeric CCW. First medium classification uses all edge halfplanes. A ray intersects all edges except its immediately previous edge; the smallest positive valid distance wins. At an interface, inside state requires outward-facing travel, outside requires inward-facing travel. Failure throws `medium orientation mismatch`.

Snell uses n1/n2 and a normal facing against incident travel. Undercritical: follow **only the transmitted branch**, toggle medium. Overcritical: specular TIR, keep medium. No partial reflection below critical, Fresnel power, absorption, polarization, dispersion model, coherent phase, diffraction, scattering or radiance/energy calculation. Separate per-ray IOR would be caller parameters, not a spectral renderer. There is no physical time-of-flight; later arc-length reveals are graphic pacing.

Polygon containment and convexity mean an inside ray must encounter another medium boundary before viewport; a missing inside intersection throws `lost enclosing boundary`. Outside misses may reach viewport. Previous edge is excluded by identity, not by nudging the origin. Returned interface endpoint is shared exactly by adjacent output records. Source and viewport boundary corners are separate from medium corner uncertainty; viewport corner exit is permitted because no refractive branch is chosen there.

## Explicit exclusion bands
Scale = viewport diagonal. `distanceGuard = scale * 1e-7` in source coordinate units. At1280×720 it is0.000146860478 pixels. Directional `angularGuard=1e-10` is dimensionless normalized cross/dot; `criticalGuard=1e-9` is dimensionless `|1−sin²θ_transmitted|`. These constants are part of plan identity, not adjustable silent tolerances.

- Source within distanceGuard of finite medium edge: reject.
- Nearest hit within distanceGuard along an edge of either vertex: reject `vertex guard`.
- Two nearest interfaces less than distanceGuard apart: reject `ambiguous nearest boundary guard`.
- Positive/near-origin candidate≤distanceGuard: reject, do not push ray.
- Ray near-parallel to a supporting edge and within distanceGuard of its supporting line, with forward finite-edge extent: reject `grazing supporting line guard`. Else parallel edges contribute no candidate. Incidence normalized dot≤angularGuard rejects.
- Critical discriminant within±criticalGuard: reject; never silently clamp to transmitted or TIR branch.

These guards define a restricted floating-point API, NOT exact predicates or interval arithmetic. No claimed universal error bound for all ill-conditioned accepted scenes. Tests cover analytic slab and right-prism oracles, but artistic paths must be checked separately across all sampled and relevant extrema states. Explicit failures are retained as counterexamples.

## Resources and identity
At most32edges×65trace iterations; at most65returned segments. Polygon validation≤1024halfplane checks. No callback, recursion in tracing, stochastic integration or mutable frame history. Identity is canonical JSON string containing version/viewport/ordered normalized vertices/IOR/guards; caller may SHA256 it. It is not itself a cryptographic digest. Same frozen plan can be sampled out of order.

## Source provenance and limits
Original implementation from vector geometry/Snell law, no copied source. Primary sources read: PBRT4 §9.3 and OpenStax University Physics3 §§1.3–1.4, links in RESEARCH.md.13 author tests plus5 independent tests pass; evidence `../motion-homeward-independent/result.json`, core SHA `ac8dcf6756008b3306295eed91110f7100726685101eb8201886d3d0fd3b8ca0`. Candidate is not registered/public, and no rejected publication is retried or bundled. One final independently reviewed film now exists: `../motion-homeward-study/delivery-packet-v01.json`. Its render has1 static trace consumed across600frames, not600 changing-ray traces. Cross-scene limits and reproducible accepted/rejected fixtures are in `REUSE.md`.
