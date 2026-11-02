# Cue intervals — restricted source recipe

One millisecond model, three independent views: **selection list, interval band, transparent active caption**. Two synthetic compositions demonstrate distinct content, size and clock states. This is an MIT code candidate, **not a registered MotionStudio family**, subtitle editor, SRT parser, transcription system or player.

No original screenshot, movie still, generated image, brand UI, audio, private audit, font binary, outline dump or rendered preview belongs in this source projection. All preview graphics are simple original code geometry. Mandatory historic copyright names remain in legal notices; they are not product endorsements.

## Reproduce outside the source checkout

Node **24.22.1**, `@napi-rs/canvas` **0.1.100**, Python **3.12.14**, FontTools **4.61.1** were used. Native OS/architecture and font rasterization matter. Python/FontTools are prerequisites; no claim of a clean OS or fresh pip environment. Network is used only by the explicit pinned font fetch and npm dependency restore, never by the renderer.

Choose a new `WORK` directory **outside this package and any containing Git checkout**. Do not run `npm ci` in this source directory. The CLI rejects package-local resources/outputs and a detected ancestor Git checkout (`.git` file or `.git/HEAD`); this is an ordinary path guard, not a sandbox or exhaustive repository detector.

```sh
PKG=/absolute/path/to/cue-interval-candidate
WORK=/absolute/outside-checkout/new-cue-run
mkdir "$WORK" "$WORK/runtime" "$WORK/tmp"
cp "$PKG/package.json" "$PKG/package-lock.json" "$WORK/runtime/"
(cd "$WORK/runtime" && npm ci --ignore-scripts --no-audit --no-fund)
python3 "$PKG/fetch-fonts.py" --output "$WORK/masters"
python3 "$PKG/prepare-fonts.py" --inputs "$WORK/masters" --output "$WORK/resources"
export CUE_RUNTIME_DIR="$WORK/runtime" CUE_RESOURCE_DIR="$WORK/resources"
export CUE_MASTER_DIR="$WORK/masters" DISABLE_SYSTEM_FONTS_LOAD=1 TMPDIR="$WORK/tmp"
node --expose-gc --test "$PKG/test.mjs"
python3 "$PKG/test-resources.py"
python3 "$PKG/test-prepare-inputs.py"
python3 "$PKG/test-io.py"
python3 "$PKG/verify-model.py"
python3 "$PKG/verify-fonts.py"
node "$PKG/verify-ink.mjs"
node "$PKG/examples/render.mjs" --output "$WORK/rendered"
python3 "$PKG/check-package.py"
```

`npm ci --offline --cache /absolute/existing-cache` is an alternative only when that exact lock is cached. It is not an empty-cache network test. Font inputs and all derived files must remain external; the font fetch verifies fixed SHA256 + Git blob identities before creating its destination. Preparation checks both inputs before writing. Runtime checks the whole lock SHA, exact two aliases, each font and notice before first registration. A registration failure may leave earlier aliases registered; discard that process. Global font registration is process-wide.

```js
import {createCueModel} from './lib/model.mjs';
import {createCueKit} from './lib/tiles.mjs';
import {loadNative, setup} from './runtime.mjs';
const api = loadNative(), env = await setup(api), kit = createCueKit(api, env);
const model = createCueModel({durationMs: 5000, playheadMs: 2400, selectedId: 1,
  cues: [{id:1,startMs:0,endMs:2000,lines:['A chosen sentence.']},
         {id:2,startMs:2200,endMs:5000,lines:['The currently visible words.']}]});
const layer = kit.caption(model,{width:600,height:120,ratio:1,fontSize:28});
kit.place(hostContext,layer,100,200); // inherits caller compositing and clipping
```

See `CONTRACT.md` for exact supported domains, `DESIGN-GUIDE.md` for composition, `CREDITS.md` for rights, and `DEDUP.md` for the narrow incremental value. New text can fail actual-ink fit even when structurally valid. No implicit wrapping, ellipsis or fit-to-size.

## Font-free path checks

`python3 test-io.py` runs with Python's standard library and Node, without Canvas,
FontTools, font files or CUE environment variables. It uses synthetic path/JSON
fixtures, asserts specific preflight failures and positive boundary controls, and
stubs acquisition before any network request. CLI output preflight runs before
Native/font loading; `prepare-fonts.py` loads FontTools only after path preflight.
This does not replace `test-resources.py`, exact font derivation, or real rendering.

The separate resource-dependent `test-prepare-inputs.py` preserves both real
`prepare-fonts.py` CLI input-symlink cases (`Inter.ttf` and `OFL.txt`). It requires
`CUE_MASTER_DIR` with the exact authorized masters and the declared Python/
FontTools versions, first proves successful real derivation, then checks the
specific nonsymlink-path rejection and absence of output. It is not run by the
font-free IO suite and must remain explicitly NOT_RUN when masters are absent.
