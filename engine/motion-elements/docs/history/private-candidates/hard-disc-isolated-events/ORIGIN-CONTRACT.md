# Hard-disc isolated elastic events — private candidate, not registered

One responsibility: compile a bounded 2D frictionless hard-disc system into an isolated-contact event sequence and an absolute-time piecewise-linear trajectory. No gravity, spin, friction, restitution parameter, deformable contact, stacks, joints, persistent contact, sleeping, forces, interactive stepping, general polygon obstacles or 3D. No helper or wall/pair parameter variant counts as another mechanism.

## API and strict data

`compileHardDiscs({bounds:{x,y,width,height},discs:[{id,x,y,radius,mass,vx,vy}],duration,maxEvents})`.

Current-realm ordinary records and dense ordinary arrays, exact own data fields only. Accessors, symbol/unknown keys, custom array iterators, sparse/subclass arrays reject without invoking their values. Proxy traps or monkey-patched platform intrinsics are not sandboxed.

- Bounds x/y in [-10000,10000], width/height in [1,10000]. Let S=max(width,height).
- 1..16 discs, unique ASCII IDs `[A-Za-z0-9_-]{1,32}`. Canonical ASCII-ID ordering makes input permutations equivalent.
- Radius [S/1000,.49S], mass [.1,100], each initial velocity component [-4S,4S] per second. Initial center in bounds and **strictly separated from all discs/walls by more than 1e-8 S**.
- Duration [.001,30] seconds; integer event budget 0..256. Zero budget permits genuinely event-free trajectories, but rejects any collision within horizon.
- Positions/velocities normalized internally by S. No external callback or RNG.

`sampleHardDiscs(plan,{time})`, time in [0,duration], requires the actual authenticated compiled plan, returns fresh world-coordinate states. At an event's stored numeric time, seek returns post-event velocity and continuous contact position. At time zero it returns the initial state. Arbitrary order is allowed; seeking does no integration. Inputs are copied; plan/events/segments are deeply frozen. Output mutation cannot modify later seeks.

Public plan includes event time, involved IDs, contact point, normal, pre/post states, plus separately identified piecewise-linear segments. `identity` is canonical exact input/algorithm JSON, NOT a cryptographic hash. Caller can hash it. Nothing is persisted between compilations.

## Mathematics and fail-closed scope

Between events all centers are linear in time. Every pair computes the approaching quadratic contact root; the implementation uses the non-cancelling smaller-root form c/(-b+sqrt(b²-ac)). Walls use linear time of impact. A full all-pairs/walls rescan follows each event. No discrete frame collision detection is used.

Only one isolated contact at a time is accepted. Pair impulses are along the center-to-center normal, perfectly elastic, weighted by inverse mass. Wall normal velocity reverses. **No position push, epsilon advance, clamping, arbitrary ID tie-resolve, or discarded impulse** occurs. Post-contact pairs within positional tolerance are skipped only if their separation dot velocity is strictly positive; closing/tangent touching rejects. Initial touching always rejects.

For normalized pair discriminant D, uncertainty threshold is `64 EPS (abs(b²)+abs(a c))`. A near-zero D whose closest approach lies within the horizon rejects. A resolved pair's normal approach speed must exceed 1e-7 S/second. All consecutive candidate event times must differ by more than `1e-9 max(1,duration)` seconds; near-simultaneous pairs (even independent pairs), multi-body contacts and corner dual-wall impacts reject. An event in that guard neighborhood of the horizon rejects unless the computed numbers are exactly equal. This can reject mathematically clean decimal endpoint scenes: move the authored horizon, do not silently snap the root.

`numericContract.minimumNormalImpactSpeed` specifically names the pair-contact approach guard; wall reflections do not apply this pair-grazing criterion. Root contact residual must be within `1e-8 S`. Each segment separately checks **the actual analytic minimum** pair distance: evaluate the norm of relative linear motion at clamped `-dot(r,v)/dot(v,v)`; walls use endpoint minima. Negative gap below `-1e-8 S` rejects. A near-contact pair not belonging to the current segment's start/end event rejects, even when no interpenetration is measured.

These are bounded floating arithmetic checks and explicit rejection guards, **not a certified exact-real, all-input no-penetration theorem**. Small negative gaps within the declared positional tolerance can remain; they are measured in `clearanceAudit`, not relabelled as zero. No promise that a given valid-looking scene will compile. Dense frame samples are not used as a continuous proof. The independent high-precision oracle evaluates analytic segment minima too, but covers finite test cases rather than all accepted inputs.

## Resources and failures

At most 257 segments, 256 events, 16 disc states each; candidate work O((events+1)*N² log N) including sorting at most152 candidates per step, bounded all-pairs storage O(N²), frozen trajectory storage O(events*N). Public pre/post/world conversion copies and canonical identity add bounded overhead. Energy-conserving collisions can raise an individual speed above its input cap; there is no per-event velocity clamp. Finite initial mass/energy and the event budget bound this accepted computation. Resource budget exhaustion throws before any plan is returned. No partial successful prefix and no automatic retry/extended budget.

## Genuine difference / reuse

Finite particles use independent constant acceleration and caller lifetime: no geometry-derived impulses. Damped response has caller-provided scalar impulses/targets, not contacts. Poisson-disc guarantees static target-center spacing, not trajectories. Keyframes can imitate the result only by hard-coding the collision plan. Pair/wall branches and metadata extraction are one candidate, not extra foundations.

Consumer may map event times into the existing audiovisual event table; that is reuse, not a new sound mechanism. Sound/reading comfort, perceived timing, art quality and continuous normal-speed review remain separate.
