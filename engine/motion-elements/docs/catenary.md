# Hanging cable geometry — experimental

For a designed cable, garland or hanging connection between two supports, compute a uniform flexible cable's static equilibrium shape from endpoints, length and gravity. Sample it by normalized arc address to place a stroke, marker or ornament. This is **one geometry mechanism**, not rope dynamics, collision, elasticity, a force integrator, or a guarantee that a moving cable is physically plausible. Animate inputs with an existing timeline; the solver has no clock/history.

## API

Import `compileCatenary`, `sampleCatenary`, `sampleCatenaryPolyline` from `lib/foundations/geometry/catenary.mjs`.

```js
const plan = compileCatenary({
  from: {x: 40, y: 80}, to: {x: 480, y: 150},
  length: 560, gravity: {x: 0, y: 1}
});
const marker = sampleCatenary(plan, 0.4);
const stroke = sampleCatenaryPolyline(plan, {segments: 180});
// draw marker.position; orient with marker.angle; connect stroke positions.
```

All fields shown are required. Objects must be this realm's ordinary plain objects (null-prototype, inherited-only fields, arrays and foreign-realm records reject). Unknown own string/symbol/nonenumerable fields reject. Do not pass accessors or proxies with side effects. Coordinates and gravity components: finite ±1e6. Length: 1e−6..1e6. Gravity Euclidean norm must be **at least 1e−12**, inclusive, then is normalized; magnitude is not mass or acceleration. Chord uses `Math.hypot(to.x-from.x,to.y-from.y)`, must be ≥1e−6. Length must be ≥chord and length/chord≤32. Positive-slack transverse separation/chord must be ≥1e−4; unsupported vertical/near-vertical slack is rejected, not silently folded or replaced by a parabola. Taut vertical lines are supported.

Plans deeply copy/freeze points and are branded per module instance. A JSON clone or another module instance's plan cannot be sampled. Recompile the original specification. Public diagnostic fields are `kind`, `from`, `to`, `length`, `chord`, normalized `gravity`, `transverseAxis`, `base`, `flip`, `transverse`, `vertical`, `a`, `u`, `w`, `z0`, `z1`, `analyticLength`, `tautLengthError`. Hyperbolic coefficients are null for taut plans; they are diagnostics, not a serialization format.

Sampling requires finite fraction in [0,1], no wrapping/extrapolation. Result is frozen `{fraction,distance,position,tangent,normal,angle}`. Distance is `fraction*analyticLength`, an input-length address computed in IEEE doubles. `analyticLength` preserves the supplied length; it is **not an exact measured length of the rounded hyperbolic coefficients, sampled curve or discrete polyline** and is not a global error guarantee. Tangent and normal are unit directions up to rounding; normal is the left normal, angle is `atan2` and can wrap at ±π. Endpoint positions are returned exactly from input copies. Input direction is respected, including reversed spans. Polyline segments must be an integer2..4096; it returns segments+1 samples. Coarse chords underestimate smooth length and may miss bends; choose a tessellation appropriate for the image.

## Stability and numerical limits

Only actual IEEE `length === chord` is classified `taut`; its length error is zero. Every accepted positive excess is solved as a catenary. The previous prototype's relative taut threshold is **removed**: it could turn a small length change into a multi-pixel jump at large scale.

For horizontal span H, vertical difference V, length L and computed chord C, solve `sinh(u)/u−1 = E/(sqrt(1+E)+1)`, where `E=((L−C)/H)*((L+C)/H)`. Positive-term series through u^24 is used for u≤1; otherwise the hyperbolic expression is used. Both branches evaluate the same function, not different geometries. Bisection has90 iterations after bounded-domain bracketing. Near-zero excess is never rounded away by first adding it to1.

Arc inversion works from the nearer endpoint using a hyperbolic half-angle difference and a rationalized cosh difference. It avoids subtracting near-equal `asinh` values and avoids multiplying a cancellation-dominated `z+w` by large a. The vertical offset coefficient uses `sign(V)*0.5*log1p(2*abs(V)/(L-abs(V)))` rather than first rounding V/L near1. For exact, mutually consistent geometry, the two endpoint formulas describe the same curve. Rounded projections, coefficients and length-address arithmetic can leave a small seam where the implemented sampler switches endpoint at fraction1/2; exact continuity or correct rounding throughout the accepted domain is not promised. Two explicit large near-vertical test fixtures observe approximately 1.10e−7 and 1.26e−6 coordinate-unit seams across adjacent addresses around1/2; these are fixture observations, not global bounds. Their coefficient-derived arc lengths can also differ from the input address length; no residual is silently relabeled as zero.

This is floating-point geometry, **not certified interval arithmetic or exact-real equilibrium**. Normalizing gravity and projecting endpoints rounds; C² and H²+V² need not match exactly. The excess equation intentionally uses the computed chord for coherent IEEE slack classification. Especially within a few ULPs of taut, an exact-real reference can disagree about slack/reachability and sag is ill-conditioned. Tiny length/tangent residuals are not a uniform position-error bound. Rotation/scale covariance is approximate under IEEE arithmetic. Exact endpoint overrides do not certify an exact global arc length. Derived positions can exceed the input coordinate domain; do not assume they can be fed back as inputs. No cross-runtime libm or cross-backend pixel equality is promised.

## Tests and evidence boundaries

Run `node --test test/catenary.test.mjs` from `engine/motion-elements`. Tests cover symmetry, independent quadrature and dense-polyline length, finite-difference tangent, reversal/rotation, large-scale one-ULP positive slack and removed-threshold continuity, near-vertical constraints, series/halfway seams, strict input errors, copied/frozen state, module-brand isolation and new-process deterministic seek.

An actual8.5-second/510-frame sound candidate uses the original frozen prototype:511 compile calls including1 initialization,2330 public samples (510 ledger-only midpoints;1820 used for geometry),510 polyline evaluations with181 samples each. Independent original-film review verifies2040 cord strokes,1020 attached root/plug matrices and47 pulse frames. Public polyline internal samples are not an extra mechanism.

The public numerical revision does not overwrite that video, its original runtime or historical manifests. A separate510-frame actual ledger/primary-cable-path replay measures non-bit-identical state differences (largest observed cable-point delta8.66e-13) and13 representative Native PNG plus13 fresh-process rebuilds match. This is not a full new encoded movie, all-frame pixel equality or a guarantee for unrelated parameters. The film does not exercise the extreme near-taut/near-vertical branches; those have separate numerical tests. Sources, hashes, calls and frame receipts are retained privately; no film/media/font/private authored parameters are part of the public package.

Normal-speed viewing remainsNOT_DONE, listeningNOT_LISTENED, owner artistic acceptancePENDING_USER and general production transferNOT_RUN. Technical evidence and limited decoded-frame review do not confer artistic approval.

## References and scope versus existing tools

Original implementation, no copied third-party code or new runtime dependency. Mathematical references checked2026-10-29: [MathWorld Catenary](https://mathworld.wolfram.com/Catenary.html) for uniform gravity equilibrium and [OpenStax hyperbolic calculus](https://openstax.org/books/calculus-volume-2/pages/2-9-calculus-of-the-hyperbolic-functions) for derivatives/inverses. These are references, not a license to copy their text or figures.

Among the requested open-source tools, [Matter.js0.20 Constraint source](https://github.com/liabru/matter-js/blob/0.20.0/src/constraint/Constraint.js) and [API](https://brm.io/matter-js/docs/classes/Constraint.html) describe body-to-body distance constraints with stiffness and an iterative solver. Its [MIT license](https://github.com/liabru/matter-js/blob/0.20.0/LICENSE) was checked. A chain of those constraints is a different stateful approximation, not this stateless equilibrium solution; it is not imported or copied. [Paper.js Curve](https://paperjs.org/reference/curve/) provides authored Bézier length/offset/tangent queries; those are useful sampling precedents but do not solve a hanging cable from supports and length. Existing cubic/polyline paths and rigid two-link IK remain different mechanisms. Stroke styling, pulses, lights and time choreography belong to the caller and are not counted as new foundations.
