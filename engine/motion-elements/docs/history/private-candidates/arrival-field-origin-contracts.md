# Contracts / candidate v0

## Static arrival field

`compileArrivalField({sources:[{id,position:{x,y},at:{n,d}}],speed,tickRate})` -> branded frozen plan. `sampleArrivalField(plan,{points:[{id,position:{x,y}}]})` -> frozen point records sorted by ASCII ID.

For each point/source: IEEE `Math.hypot(dx,dy)/speed` produces diagnostic `rawTravelSeconds`; `ceil(rawTravelSeconds*tickRate)` produces travelTicks; arrival is exact rational addition of authored source start plus travelTicks/tickRate. The **quantized-travel arrival values**, not underlying exact real distances, determine winners. Distinct continuous arrivals may merge into ties; tiedSourceIds is ASCII sorted and winnerSourceId is first. Equal raw distances do not override unequal source starts. Source starts need not lie on the tick grid, so this is not globally integer-tick event timing.

`rawTravelSeconds` is a floating-point diagnostic, not an exact rational or conservative certified physical value. Ceil is no earlier than the *computed floating product*, not necessarily the exact real arrival. Near rounding boundaries cross-platform libm may change a tick or winner. No epsilon, interval proof, obstacles, attenuation, dynamic source, collision, PDE, Doppler or causal feedback.

Domain: 1..64 sources, 1..4096 queried points; coordinates ±1e6; speed .001..1e6 units/s; integer tickRate 1..192000. All source/query IDs unique in each collection. Earliest arrival at a query must be ≤86400s, otherwise the entire call rejects; far later nonwinning sources are allowed. Source start 0..86400s. Empty queries reject. Storage input permutations preserve the returned plan/state ordering. Plans cannot be JSON-cloned or crossed between module instances.

## Event bindings

`compileEventBindings({duration,frameRate,sampleRate,sourceIdentity,roles:{visual:[id],audio:[id]},events:[{id,creativeOrder,at,visualRole,audio,silenceReason}]})`.

All clocks are `{n,d}` integer strings. Reuses existing `rational/add/sub/compare/timeToSamples`; no second general time or audio editing system. Duration >0..86400s, fps >0..240, sample rate integer 8000..192000. A raw rational input uses at most 12 decimal digits in numerator magnitude and denominator. Exact derived rationals use existing timeline bounds. Up to4096 events, visual roles1..256, audio roles0..256. IDs ASCII1..64. Event at must be in [0,duration), with a first visual frame strictly inside film.

`creativeOrder` is an explicit integer0..4095 unique across the entire table (stricter than merely same-time unique). Storage array reorder is immaterial; changing creativeOrder changes the creative plan identity and tie ordering. Events sort by exact authored time then creativeOrder. This explicit authored field is not inferred from storage.

Audio is null only with a nonempty silenceReason. Otherwise silenceReason must be null and audio is `{role,offset,duration,offsetReason}`. Roles must be registered, cue duration positive, offset within ±86400s with a nonempty reason. Absolute start=event+offset, end=start+cue duration. Negative starts, tails outside film, or cues quantizing to zero samples reject. No truncation, automatic extension, hidden fade or unverified audible-tail guarantee.

Visual first frame = exact rational ceiling(event*fps), with visualAt and signed visualError recorded. Audio absolute start/end use existing nearest-sample, half-away-from-zero rule, with quantizedStart and signed startError recorded; independently rounded durations are never accumulated. Thus same event does **not** guarantee the same discrete visual/audio instant. Example17/10s at24fps and48kHz -> frame41 at41/24s, audio sample81600 at17/10s.

`eventsThroughFrame(plan,frame,sourceIdentity)` returns all events whose firstVisualFrame is ≤frame, not callbacks or one-shot mutable events. Repeated/reverse seek is deterministic. frame integer0..20736000 and frame time inside film. `audioCues(plan,sourceIdentity)` returns cues ordered by quantized start then creativeOrder. Both require the same declared64hex sourceIdentity: this does not read files or prove the declaration was true. Automatic expiry detection and measured-event provenance are **not implemented**.

## Object/security/ownership boundary

Inputs require exact own data fields on plain/null-prototype records, ordinary dense same-realm arrays, finite numbers; accessors, symbols, unknown fields, array extras and holes reject before getter execution. Proxy traps and modified builtins are outside this contract. Copies and output graphs are deeply frozen. No mutable cache, wall clock, IO, random state, closures, schema eval or network. Returned canonical identity is SHA256 of the compiled declared plan, not an authenticated execution receipt.

## Evidence boundary

Local numeric, boundary, storage-shuffle, creative-order, freshness declaration, repeated seek, fresh Node and synthetic shared pixel/PCM tests only. No real film yet; no art acceptance, normal-speed viewing or listening, no current registration or publication. Test fixture buffers demonstrate common-table consumption but are not claimed as a soundtrack or Native Canvas scene.
