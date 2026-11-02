# Bounded static-grid transport — PRIVATE candidate, not registered

Original portable ES module, no import/dependency. One mechanism: shared static velocity-grid material transport. Noise, streamfunction derivatives, palettes and widths are caller authoring, not separate mechanisms.

## Difference from existing code
Actually read `motion-dev-published-184f27e5/engine/motion-elements/lib/foundations/field/attractor-field.mjs`: it samples normalized radial/tangent **orientations**, not velocity/trajectory history. Existing `motion-last-train-candidate/lib/finite-particles.mjs` is independent constant-acceleration trajectories with finite lifetime; this module integrates the SAME spatially varying field from all seeds. It is neither an alpha/trail compositor nor a manual sine perturbation of a strip.

## Inputs and boundaries
`compileVelocityGrid({columns,rows,vectors})`: 2..128 inclusive each axis; exactly rows×columns ordinary dense vector array, row-major nodes at `(column/(columns-1),row/(rows-1))`; velocity components finite −4..4 unit-square coordinates/sec. Bilinear interpolation, closed [0,1]² only. No callback, time-varying grid or mutable external reference.

`compileGridTransport(grid,{seeds,duration,steps})`: 1..256 ordinary dense `{x,y}` seeds inside closed unit square, duplicates permitted as distinct ordered addresses. Duration [.0001,30] seconds, integer steps1..4096. Reject before allocating/integrating if `seedCount*(steps+1)>262144`. Fixed explicit midpoint RK2: `m=p+h*v(p)/2; next=p+h*v(m)`. All midpoint and endpoint stages must be inside CLOSED square in actual IEEE arithmetic; otherwise compilation rejects, no partially returned cache. No epsilon clipping, wrapping, sliding, extrapolation, obstacle detection or automatic boundary handling. An ODE might leave/reenter between sampled stages even if all stages pass; we do NOT claim a certified continuous ODE containment proof.

`sampleGridTransport(plan,{time})`: finite [0,duration]. Piecewise-linear interpolation of cached step endpoints; exact cache endpoint is returned at horizon. Fresh point objects, arbitrary out-of-order repeatable seeking, no integration during seek and no previous-frame state. This is a defined discrete approximation, not the exact continuous ODE or an adaptive integrator. Linear cache segments are within the convex square when compilation succeeds. This is NOT proof about unsampled exact ODE positions.

`sampleVelocityGrid(grid,{x,y})` exposes the same bilinear interpolant for testing/reuse.

## Identity and resources
Plans are WeakMap-authenticated and frozen. Source inputs copied, grid vectors hidden/frozen, cache private. Canonical JSON identity includes normalized finite inputs (−0 canonicalized to0), grid dimensions/vector order, seed order, duration, step count and explicit algorithm/version/boundary/seek. It is an exact comparison string, **not a cryptographic digest**. Caller may SHA256 it (concept harness does); no Node-only import in core. A changed parameter cannot intentionally reuse the same canonical string. No cross-process cache loader yet; replay recompiles the source. Output mutation never changes later seek.

Grid input max16384 vectors; each interpolation reads four grid corners, independent of grid size. Work is O(gridNodes + seeds×steps), NOT gridNodes×seeds×steps. Accepted worst cache262144 point states =4194304 Float64 payload bytes, at most524288 velocity evaluations /2097152 four-corner reads (loose safe bounds; endpoints count reduces actual maximum). Validation and identity strings add bounded input/output overhead. One seek outputs at most256points and does not resample grid. All numeric maxima are checked before integration; arbitrary callbacks/iterators/accessors/unknown keys/symbol keys/subclass arrays/sparse arrays rejected for normal data inputs. Hostile Proxy traps and monkey-patched platform intrinsics are not a sandboxed input model.

## Numeric limits
Bilinear field is continuous but generally not smooth across cells; no general second-order convergence guarantee asserted for arbitrary fields/near boundaries. Constant and affine-shear exact analytic oracles and smooth linear rotation convergence tests pass; midpoint rotation has numerical radius drift and is NOT energy-preserving. Floating precision, spatial grid resolution, material-segment resolution and piecewise-linear temporal interpolation all contribute error. No fluid pressure, incompressibility, collision or material inextensibility guarantee. Caller widths do not conserve mass.

## Concept, not full film
49×49 baked grid, 245 seed points (five lines ×49), 800steps/8s →196245 states. All points use one grid and one cache. Underlying analytic scalar-potential derivatives are caller-defined and sampled; bilinear interpolation/RK do NOT inherit a strict divergence-free guarantee. Native1280×720 concept image. Actual point-return hashes retained in design/receipts.json.

Candidate film uses this mechanism + existing cubic-path for the independently swimming gold fish. Ribbon segments use ordinary Canvas strokes; no claimed extra mechanism. Attempt to reuse sampled-band was REJECTED: its x-monotone/vertical-width contract does not fit transported folding material lines. No relaxing/bypassing old module contract; no fake sampled-band usage count. Fish does not automatically avoid strips; strip crossings are graphic overlays, not solid obstacles. No audio or full animation produced at this gate.
