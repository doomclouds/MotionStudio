# Shared directional spotlight field

An independently callable **2D art-directed light candidate**, not a registered Design family or Motion mechanism. [design.md](design.md) explains selection and counterexamples; [index.mjs](index.mjs) exports the public functions; [candidate.json](candidate.json) records scope; [RIGHTS.md](RIGHTS.md) bounds source distribution.

One solved state drives lamp mouth placement, beam coverage, receiver reveal and synthetic motes. Caller owns choreography, materials, compositing and camera. No source film, museum figures, character staging, private media, font, audio, external URL or network access is needed.

## Callable content

- [Archive tokens](examples/archive-scene.mjs): a side lamp reveals six authored geometric tokens on a shelf, with warm light and fixed camera.
- [Orbit diagram](examples/orbit-scene.mjs): a top-mounted cool lamp reveals a synthetic orbital diagram under a shared uniform moving camera. It is not astronomical data.

Both are new procedural content, not a recoloring of one source scene. Each exports the Native scene contract and sampleLighting(t). The public helper input example below is accepted by solveSpotlight imported from index.mjs; Canvas functions accept caller-provided contexts and scratch surface. Scene t is seconds in [0,4); the Native core enforces valid frame indices. Scene functions are fixtures, not general layout engines.

## Dedupe and provenance

At integration baseline dev c79b128, iris-reveal supplies a circular time transition, linear-mask supplies a half-plane/band, raster matte combines already supplied masks, light-echo-field moves blobs/reflections, ray-chain traces refracting interfaces, and finite-particles supplies trajectories. None supplies the combined lamp emitter, soft directional coverage and art-directed receiver state. This is a bounded source inspection, not a universal novelty claim. No duplicate public catalog/API was introduced.

The solver and adapter are independently authored generic code extracted from an earlier private lighting experiment. Reference-facing scenes, screenshots, movies, comparison images and historical private evidence are excluded. The two fixtures here are newly authored geometry. Earlier 18-test results and private visual judgments do not certify these new consumers.

## Solver contract

All points use one caller-chosen 2D coordinate space. Angles are radians. Caller owns time/choreography, camera, materials, particles and compositing order.

```js
const light = solveSpotlight({
  mount: {x: 100, y: 400},
  target: {x: 600, y: 200},
  emitterOffset: 40,
  halfAngle: 0.2,
  feather: 0.25,
  intensity: 0.9,
  receiver: {aspect: 1.2, rotation: 0, projectionScale: 2}
});
```

Inputs are exact plain data objects. Unknown properties, getters, non-finite values and degenerate aim are rejected before drawing.

| Parameter | Bounds and meaning |
|---|---|
| mount / target | x,y in [-32768,32768]. Total distance ≤32768; remaining reach after emitter offset must exceed 0.01. |
| emitterOffset | [0,4096], in world units along mount→target. The point emitter sits at the lamp's front face. |
| halfAngle | [0.005, π/3], beam half-angle. Beam endpoint radius = remaining distance × tan(halfAngle). |
| feather | [0.001,1], proportion of beam edge / receiver radius used for smooth falloff. |
| intensity | [0,1], shared maximum field coverage. Zero disables beam and reveal. |
| receiver.aspect | [0.1,10], elliptical X/Y ratio. |
| receiver.rotation | [-π,π], ellipse rotation in world coordinates. |
| receiver.projectionScale | [0.1,10], **art-directed** enlargement of the receiver footprint relative to beam radius. Not a physical plane intersection. |

Beam radius and receiver radii are bounded at 16384 world units. `coverageAt` query coordinates are bounded at ±131072, allowing points outside the geometry input domain to return zero safely.

Output is deeply frozen and branded to the module instance. It includes mount, target, emitter, emitterOffset, direction, normal, angle, length, radius, triangular beam bounds, intensity/feather and receiver ellipse. Call `solveSpotlight` again from ordinary input data after JSON/worker transfer; a serialized output cannot be used directly.

`coverageAt` returns separate values:
- `beam`: soft angular edge × sin(π × axial progress) × intensity; zero behind the emitter and beyond the target cross-section.
- `receiver`: smooth elliptical radial coverage × intensity.

These are complementary art-direction fields, not equal values or an energy-conserving photometric model. The axial sine deliberately avoids a hard luminous cap and singular origin.

## Canvas contract

`drawReceiverMask(ctx, light)` paints a white-alpha ellipse. The gradient uses 64 stops within the feather region. Existing target pixels are not cleared. Use an empty mask surface for reveal compositing.

`drawBeam(ctx, light, {surface, color, opacity, pixelSize})` paints RGB beam coverage using a caller-owned scratch Canvas distinct from `ctx.canvas`.
- color: dense three-channel integer RGB, [0,255]; sparse arrays and accessor entries rejected.
- opacity: [0,1], compositing opacity separate from field intensity.
- pixelSize: integer [1,16], default 4. At 1, analytic coverage is sampled at pixel centers. Coarser sizes intentionally trade soft-edge resolution for speed.
- scratch dimensions are overwritten. Max raster edge 8192 and area1,048,576 pixels. Oversized work fails before allocation rather than silently lowering quality.
- target transform, style and smoothing are restored, including exceptions. The tested native Canvas runtime's stale fillStyle getter after restore is handled explicitly.
- the camera belongs to the caller. Apply the same transform to receiver, beam, particles and lamp. This adapter does not infer camera coordinates.


## Reproduce checks and frames

From the repository root with Node >=24 and an already installed @napi-rs/canvas (tested version 0.1.100):

```sh
export MOTIONSTUDIO_CANVAS_MODULE=/absolute/path/to/node_modules/@napi-rs/canvas
node --test engine/design-elements/recipes/candidates/spotlight-field-candidate/test/*.test.mjs
node engine/motion-render-core/scripts/render.mjs --scene "$PWD/engine/design-elements/recipes/candidates/spotlight-field-candidate/examples/archive-scene.mjs" --work /absolute/external/new-archive-run --frames 0,30,60,90,119
node engine/motion-render-core/scripts/render.mjs --scene "$PWD/engine/design-elements/recipes/candidates/spotlight-field-candidate/examples/orbit-scene.mjs" --work /absolute/external/new-orbit-run --frames 0,30,60,90,119
```

No installation occurs during tests or rendering. Pure field tests do not require Canvas. Images/reports remain outside the repository; do not commit generated outputs. The scenes list all imported candidate sources for Native identity verification. These direct imports work in the repository and the existing portable runtime layout; no private workspace path is embedded.

Tests cover field bounds, immutable state, invalid input, uniform coordinate invariance, pixel coverage, state restoration, scratch isolation/budgets, repeated/reverse/fresh-process frame hashes and both actual consumers. Numerical/structural testing is distinct from continuous viewing, audio, artistic acceptance and cross-platform validation. Four-second silent fixtures are technical tests, not delivered film samples.

## Limits and promotion

Not physical lighting: no occlusion/shadows, inverse square, true plane intersection, normals, area emitters, volumetric transport or multiple-light policy. Receiver projectionScale is art direction; beam and receiver are complementary fields, not equal coverage or energy conservation. CPU raster is bounded; coarse pixelSize may spill/soften edges. Use 1 for pixel-level tests. Lamp material/color stays consumer-owned. No arbitrary nonuniform camera guarantee. Hostile Proxies or monkey-patched JS intrinsics are not a security sandbox.

No new family/recipe registration, original-film migration, user aesthetic acceptance, actual audio review, physical correctness or full-film completion is claimed. To promote, separately review the public contract, genuinely different consumer use, visual behavior and relevant platform evidence; successful tests alone cannot promote it.
