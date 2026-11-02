# Private candidate contract — not public registration

# finite particles — local candidate, not registered/public

Compile `{seed, emissions}` with a uint32 seed and1–512 ordinary dense records. Each record has unique bounded ASCII `id`, numeric `birth` seconds0–3600, `position` and `velocity` with x/y `[minimum,maximum]` intervals, constant `acceleration` x/y, and `[minimum,maximum] lifetime` seconds. Coordinates±16384, velocity±4096, acceleration±1024, lifetime0.001–60. Intervals are closed authoring bounds; sampled random fraction is in[0,1). Accessors and unknown fields are rejected before evaluating property values. No unsafe generic host-object/proxy contract is claimed.

`compileFiniteParticles` returns frozen copied parameters. The seed mixer is deterministic per ID and parameter channel; changing order or removing another identity cannot change retained particle random samples. It is not cryptographic or a statistically certified generator. All births are explicit once-only events; there is no hidden loop, recycling, frame integration or unbounded emitter.

`sampleFiniteParticles(plan, at)` accepts bounded IEEE Number seconds0–3660 and returns frozen alive states. Birth is included; computed `death=birth+lifetime` is excluded. Age is `at-birth`; position is `x0+v0*age+0.5*a*age²`; velocity is `v0+a*age`. Not exact rational time, force integration, collision or fluid simulation. Plans are branded to their module instance. Seek order does not matter.

A caller draws each alive item; alpha/shape/texture and viewport culling remain caller art, not extra foundations. LAST TRAIN uses authored puff growth and fade with this lifetime and attaches each initial world origin to a sampled train position at its birth. It does not recompute origin from current train position, so the cloud remains after the vehicle exits.

v01 had an accessor resource-limit bypass, independently reproduced. v02 adds descriptor checks across all ordinary object/array input levels;12 author tests and3 independent tests passed. v01 technical output may reproduce the same valid-input images, but it cannot stand as generic corrected API evidence. New source hash12262ed80125f601833e6ead224a9c5eb7e1fa87121e9aec4495ec3e86875c35.
