# Three spot-ink print candidate

A bounded, source-derived recipe for three ink-density plates. It adapts LemoLab's MIT-licensed [Risograph compositor](PROVENANCE.md), not an original shader invention. It adds no registered family, counted foundation or portfolio work. Real-browser execution and artistic acceptance remain unverified.

```js
import {createSpotInkCompositor} from './spot-ink.mjs';
const print = createSpotInkCompositor({outputCanvas, inputCanvas});
print.render({
  inks: [[35,75,68], [176,98,49], [81,67,135]],
  paper: [250,249,245], off: [[0,0], [2,-1], [-1,1]],
  seed: 0, sheet: 0, boil: 0
});
print.dispose();
```

## Input and runtime contract

R/G/B are three independent ink densities, not displayed colors. Black is no ink; white is all three inks. The caller draws opaque input, including its own knockout/overprint logic. This is not automatic separation of ordinary photographs. Alpha must be 255 everywhere. The pure plan and Canvas adapter do not inspect alpha; the diagnostic PNG backend does. The shader ignores input alpha and writes opaque output. Transparent Canvas inputs can lose hidden RGB through premultiplication and are outside the contract.

Inject distinct, equal-sized HTMLCanvasElement or OffscreenCanvas objects. Integer dimensions are 1..4096 and total pixels at most 8,388,608. The output WebGL2 context is dedicated: do not change its state externally. Resizing invalidates the instance. Dispose is idempotent; render after disposal throws. Unavailable/lost context, shader/link/allocation/render errors and tainted uploads fail rather than falling back silently. Context restoration is not provided. GPU allocation, performance, Canvas upload/color behavior and cross-driver equivalence are not guaranteed.

Input uploads on every render with LINEAR filtering and CLAMP_TO_EDGE. Off-image sampling extends edge pixels, not paper. No DOM lookup, font, network, scene, clock or render history is required. Caller owns the canvases and sampling time.

Each render requires `inks` (3×3) and `paper` (3), with finite fractional or integer RGB values 0..255. The shader multiplies normalized RGB, not linear light, CMYK, ICC-calibrated or physically modeled ink. Optional fields:

| Field | Domain | Default |
|---|---|---|
| `off` | Three [x,y] offsets, −8192..8192 output pixels | Zero |
| `rot`, `ang` | Three radians, −2π..2π | Zero / [.2618,0,1.309] |
| `gate` | Three 0..1 values | All 1 |
| `sweep` | Three x positions, −100000..100000 pixels | width+200 |
| `period` | .25..4096 output pixels | 7 |
| `grain` | 0..4 | 1 |
| `seed`, `sheet` | −1e6..1e6 | 0 |
| `boil` | 0..1 | 0 |

Defaults apply only to absent fields. Null/undefined, extra keys and `water` are errors. Records must be current-realm plain objects with listed own data fields; arrays must be dense ordinary arrays without added keys/accessors. No numeric coercion. Validation is not a malicious Proxy or altered-builtins sandbox; Canvas instanceof checks are not a hostile-object security boundary.

Sweep advances left to right despite a conflicting retained upstream comment. Grain zero does not eliminate all ink/paper variation. Screen and grain use each plate's transformed output-pixel coordinates, not inferred scene geometry or camera-scaled UVs. Thresholded coverage is not area-conserving. See [design guide](DESIGN-GUIDE.md).

## Backend-neutral interface

`shader-sources.mjs` exports frozen `spotInkShaderSources` with language, vertex and fragment. It is the only shader definition. `createSpotInkRenderPlan({width,height,options})` from `render-plan.mjs` returns copied, deeply frozen JSON-compatible data with schema `spot-ink-render-plan/1` and shader identity `spot-ink-nonreflection/1`. All three arguments are required. It reads no pixels or DOM.

`uniforms` maps GLSL names to `{type,value}` with flat value arrays. Types are `1i`, `1fv`, `2fv`, `3fv`; float vector count is array length divided by arity. Colors are already normalized. Backends must consume the texture, fullscreen-triangle geometry and target-state contract without adding defaults or renormalizing. They need ES3/WebGL2-compatible shaders. JSON preserves uniform meaning, not every IEEE bit pattern: −0 serializes as +0.

`node export-render-plan.mjs` accepts a JSON request on stdin and writes `{plan,shaderSources}`. `--jsonl` streams one per line. Requests are limited to 65,536 UTF-8 bytes before parsing; oversized unterminated lines and invalid UTF-8 fail. Output waits for drain. This bounds request/queued-response buffering, not process/GPU memory. Reject an entire batch on a later nonzero exit even if earlier lines were emitted.

## Tests and optional diagnostics

Run from this directory with existing Node:

```sh
node --test test-*.mjs
node verify-upstream-source.mjs --upstream /absolute/authorized/riso.js
```

The 20 default tests cover validation, isolated plan data, CLI/resource boundaries, HTTP whitelist and fake-API lifecycle. They need neither browser nor upstream oracle. Fake API instrumentation proves call/cleanup behavior, not browser GPU execution.

The separate source verifier requires an external file matching the pinned source-code SHA in [provenance](PROVENANCE.md), then compares shaders after removing the water branch. Missing input is NOT_RUN/exit 2; wrong source/comparison is FAIL/exit 1. It does not fetch source or run upstream setup. No original oracle is bundled.

Optional synthetic rendering uses existing authorized dependencies; install nothing in the source tree. Set CANVAS_MODULE to an existing @napi-rs/canvas installation when normal package resolution is unavailable. Use new absolute output directories **outside the repository**, whose parents already exist:

```sh
node prepare-egl-fixtures.mjs --out /absolute/new-fixtures
python3 render-plan-egl.py --plate /absolute/new-fixtures/geometry-0.png --options /absolute/new-fixtures/options-0.json --out /absolute/new-render
node run-browser-tests.mjs --out /absolute/new-browser-results --upstream /absolute/authorized/riso.js
```

The EGL diagnostic requires existing Python/Pillow, Node and libEGL. It executes the sibling plan exporter with a 30-second timeout, validates fixed backend contracts, accepts bounded RGB/RGBA PNG, checks dimensions before decode and opaque alpha before upload. Options are at most 65,536 bytes; encoded PNG at most 64 MiB. Checks remain active under Python −O. It is a one-process diagnostic, not a persistent production backend; process exit reclaims resources. `--node` must name a trusted executable. Native-library security and concurrent file replacement are outside its guarantees.

The browser runner uses installed Playwright and Chromium, configurable with PLAYWRIGHT_MODULE and CHROMIUM. It serves six package files and one fixed, hash-verified oracle route on localhost, not external directories. Missing dependencies/oracle report NOT_RUN; startup failure reports BLOCKED, neither is a pass. Pixel differential, repeated/out-of-order/fresh renders and failure cases require the actual browser run.

File-producing helpers reject existing destinations, package-contained paths and symlink aliases. They do not grant permission to write elsewhere: keep outputs, dependencies and caches outside this repository.

## Evidence boundary

The unchanged shader has run on Mesa llvmpipe ES3.2: two distinct original synthetic geometries × three option sets matched the upstream non-reflection shader byte-for-byte on that renderer. This bounded synthetic result does not assert whole-film source-pixel equality, real-browser lifecycle/color correctness, cross-GPU behavior, constant-speed viewing, actual listening, audiovisual acceptance or user approval. Production inputs, media and evidence are deliberately not bundled.

This differs from geometry.halftone-screen's ideal circle∩square area inversion and halftone-scalar-candidate's one-channel RGBA tile. It neither duplicates those contracts nor adds trapping/morphology. Synthetic fixtures demonstrate limited reuse, not a new finished artwork.
