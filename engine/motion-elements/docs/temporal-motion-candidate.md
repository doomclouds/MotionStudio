# Temporal position history candidate

Unregistered direct-import research utility: `lib/support/temporal-motion-candidate.mjs`. Not a catalog foundation or public-barrel API. Original source and synthetic tests only; no source artwork, font binaries, audio, captured frames or private evidence are distributed.

## Need and deduplication

`geometry.polyline-trail` samples a fixed spatial arc length, explicitly not history in time. `raster.temporal-exposure` integrates past integer-frame RGBA images, not geometric positions or velocity. Neither returns sub-frame positions from an absolute-time trajectory. This candidate provides those positions and one backward secant; drawing, opacity, speed-to-stretch and satellite shapes remain the caller's responsibility. Sharing a single contour state across parent and satellites is a composition practice, not a separate new mechanism.

## Exact contract

`sampleTemporalMotion({time, history, samples, velocityStep, samplePosition})` uses number seconds, not rational times or frame indices. `time` is finite 0–3600; `history` is 0.000001–10 seconds; integer `samples` is 2–32; `velocityStep` is 0.000001–1 second. Exact plain/null-prototype data records only, with no unknown keys, symbols or accessors. Callback outputs are exact `{x,y}` finite coordinates in ±1,000,000 local units. Proxy code and callback side effects are outside the trust boundary; this is not an untrusted-code sandbox.

Points are sampled newest-first, uniformly in past time, including now and `now-history`, clamped to time zero. Repeated clamped points remain in the returned array, while callbacks deduplicate exact numeric times. A copied position is stored before another callback. Velocity uses `(position(now)-position(max(0,now-velocityStep)))/actualInterval`. At time zero the velocity is zero. Derived velocity components and speed must remain finite; an extremely small positive interval and position discontinuity can overflow even when input coordinates are valid. Such samples throw RangeError rather than clamp or return fabricated finite velocities. `velocity.angle` is radians, zero by convention at zero speed; `velocity.interval` reports the actual secant interval. Fresh output graphs are frozen. No persistent accumulator, warmup, cache between calls or previous-render dependence.

At most `samples+1` (33) callback evaluations, O(samples) utility memory/work per call, with all parameter/resource validation before callbacks. No wall-time or memory limit is promised for callback code itself. A pure deterministic absolute-time callback is required for seek/repeatability. Evaluation order is newest-to-oldest trail points, then the additional velocity point if needed. No opaque plan identity or serialization format.

## Counterexamples and ownership

- A backward secant is NOT the instantaneous derivative. At a cusp or reversal it can average opposite directions; decrease velocityStep if appropriate but do not label it exact physics. Discontinuities can produce large finite speeds; caller stretch must be explicitly capped.
- True history can lie ahead of the head after reversal. Do not force it onto `head - currentVelocity * age` or sort by X.
- Uniform time samples can bunch during easing and miss high-frequency oscillation. This utility does not adapt sample count, resample by arc length, blur pixels or integrate exposure. Clamped duplicate marks can over-darken a source-over drawing; caller can deduplicate visually or choose zero opacity near the start.
- Coordinates and speed are local units and units/second. Nonuniform parent transforms change screen speed; no automatic screen-space correction, normal/tangent guarantee or path inference.
- Do not add contour correspondence or satellite IDs here. A caller can evaluate one current shape, then reuse it under distinct transforms; that does not establish identity across unrelated scene objects.

## Executable evidence and limits

`node --test engine/motion-elements/test/temporal-motion-candidate.test.mjs` exercises stationary/linear directions, acceleration, a circle, a sharp reversal, early clamp, resource extremes, provider scratch reuse, validation, immutable outputs and out-of-order repeatability. `examples/temporal-motion-candidate.mjs` generates an original three-trajectory technical animation using this sampler. Outputs belong outside the repository. Set the existing `MOTIONSTUDIO_CANVAS_MODULE` environment variable if Canvas is not locally installed.

The example caps scale at 2.3, derives orientation from the returned secant, and explicitly controls alpha. Those are example styling choices, not utility defaults. Mathematical tests and rendered frame inspection are not normal-speed playback, aesthetic acceptance, cross-platform validation or production promotion. No audio is generated or implied.
