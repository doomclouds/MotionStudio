# Private candidate entry: polyline sections + arrival field

> Historical pre-registration snapshot. Private/unregistered counts, old publication blocks and proposals below describe that earlier stage, not current status. Current catalog: 60 foundations + 7 recipes; expansion paused. See [current registration and runtime boundaries](../registered-foundations.md).


This isolated local tree adds **two private, unregistered candidate mechanisms** through `lib/candidate-index.mjs`. The public index, package exports, catalog, fixtures and all baseline files are unchanged: **39 foundations + 7 recipes**. No public release, registration or publication is authorized by these tests. The separate previously denied four-foundation/36-file operation is not included or retried.

```js
import {
  compilePolylineSections, extractPolylineSection,
  compileArrivalField, sampleArrivalField,
} from '../../lib/candidate-index.mjs';

const route = compilePolylineSections({points:[{x:0,y:0},{x:3,y:0},{x:3,y:4}]});
const section = extractPolylineSection(route,{startDistance:1,endDistance:6});
// positions: (1,0), (3,0), (3,3); consume returned vertices with moveTo/lineTo.
const field = compileArrivalField({sources:[{id:'pulse',position:{x:0,y:0},at:{n:'1',d:'3'}}],speed:2,tickRate:2});
const arrival = sampleArrivalField(field,{points:[{id:'target',position:{x:3,y:4}}]});
// target arrival is {n:'17',d:'6'} after quantized travel; it is not a callback.
```

## Polyline sections contract

- Exact-own-data specification `{points}`; ordinary dense same-realm array of 2..4096 records `{x,y}`, each coordinate finite within ±1e6. Plain/null-prototype records accepted; hidden/symbol/extra fields, getters, derived arrays and sparse arrays reject without invoking getters. Hostile Proxies and modified built-ins are not sandboxed.
- Consecutive distances must be ≥1e-9, and accumulated stored length strictly increase and remain ≤1e9. Repeated adjacent points or lost cumulative increments reject. Nonadjacent coincidence, retracing, redundant collinear points and explicit closed coordinates are permitted.
- Extraction requires the branded plan from this module instance and `{startDistance,endDistance}` with finite `0≤start≤end≤totalLength`; no clamping, reverse/wrap, epsilon snapping or seam topology. Deep-frozen output is `{startDistance,endDistance,length,empty,vertices}`; each vertex has `position,distance,sourceVertexIndex,segmentIndex,parameter`.
- Zero interval returns one anchor and `empty=true`. Exact corners appear once; interior boundary points use null source index. At an exact corner the address is the outgoing segment with parameter0; at final endpoint it is final incoming segment with parameter1.
- Coordinates and stored cumulative distances use binary64; interior interpolation divides by differences of stored cumulative boundaries, not a separately recomputed segment distance. No arbitrary-scale uniform relative-error guarantee. Tiny nonzero intervals may return equal rounded coordinates while remaining nonempty.
- Compile O(N); extraction approximately O(logN + KlogN), bounded by N+2 output vertices. No clock, mutable progression or random state. Caller converts absolute time to distances. Plans cannot be JSON-cloned or exchanged across module instances.
- This is not a general SVG/Bezier path system, smoothing, topology repair, curve recovery or additional compilation mechanism count.

## Arrival field contract

- `compileArrivalField({sources:[{id,position:{x,y},at:{n,d}}],speed,tickRate})`; source count1..64, unique ASCII `[A-Za-z0-9_-]{1,64}` IDs, coordinates±1e6, speed .001..1e6, integer tickRate1..192000. Rational inputs are integer strings of ≤12 decimal digits; source start0..86400s.
- `sampleArrivalField(plan,{points:[{id,position:{x,y}}]})`; points1..4096 with unique IDs. Result `{points}` sorted ASCII, each with `id,position,arrival,winnerSourceId,tiedSourceIds,winner`. Winner diagnostics include sourceId/distance/rawTravelSeconds/travelTicks/arrival.
- Distance = `Math.hypot`; travel ticks = `ceil((distance/speed)*tickRate)`. Rational source start plus quantized travel determines the winner; tied IDs sort ASCII. Source starts need not align to ticks. Earliest arrival >86400s rejects the whole sample; later nonwinning candidates may exceed that threshold.
- Ceil bounds the computed floating value only, **not exact physical distance/time**. Near rounding boundaries libm can alter a tick/winner. No obstacles, attenuation, dynamic sources, collision, PDE, Doppler or causal feedback. Diagnostic raw seconds are not a conservative certificate.
- Same strict data/immutability and module-brand rules apply. Source/query permutations produce canonical ordering. Sampling is stateless, not event emission or a per-frame requirement.
- Its unchanged support closure contains `node:crypto` through the timeline module. This private entry is tested on Node, not claimed browser-compatible or tree-shaker portable. Event bindings and timeline are dependency/support only, not exported new candidate mechanisms or extra foundation counts.

## Historical versus current evidence

The byte-preserved origin documents are historical snapshots. Their “no real film yet” statements describe the draft stage, not current consumption. Later private evidence records BETWEEN THE LINES (plus later reuse) and OFFBEAT. OFFBEAT consumes arrival once while compiling its score; downstream audio/visual code consumes the event table, not the field every frame. Separate external-to-repo evidence retains exact frozen source/film hashes and independent reviews.

This isolated private-entry work does not alter the frozen films or assert that their original MP4 bytes were re-encoded through the new entry. Numerical test success is not artistic acceptance, actual listening, normal-speed viewing or publication authorization. The 1,815 bounded arrival reference samples and 2,048 distinct polyline intervals in the supplementary tests are finite evidence only; declared coordinate tolerance is not a universal API error bound.
