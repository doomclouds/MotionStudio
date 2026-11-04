# Bounded 2D drape material — source-only candidate

One **static material recipe**, not a new public family. It produces an opaque cloth-like field from seed and two color endpoints, with no images, font files, system fonts, DOM, upstream app or GPU. It does not simulate cloth or animate.

```js
import {compileDrape, createDrapeKit, sampleDrape} from './index.mjs';
const model = compileDrape({width:480,height:640,seed:503,
  low:'#1b1422',high:'#edb683',vignette:0.24});
const kit = createDrapeKit({createCanvas:(w,h)=>trustedCanvasAPI.createCanvas(w,h)});
const layer = kit.tile(model,{ratio:2});
kit.place(hostContext,layer,80,120); // single drawImage; host appearance applies
const analysis = sampleDrape(model,0.5,0.25); // analytic stop, before vignette
```

Read [CONTRACT.md](CONTRACT.md) before composition. Public entry exports only `compileDrape`, `sampleDrape`, `createDrapeKit`. Other files are internal implementation or fixed examples, not additional generic APIs. See [DESIGN-GUIDE.md](DESIGN-GUIDE.md) for hierarchy, palette and motion limits.

## Reproduce

Node22+ and Python3 standard library; tested Native dependency `@napi-rs/canvas@0.1.100` is pinned. Package identity is `bounded-drape-material-candidate@0.0.0` in [package.json](package.json).

The internal `runtime.mjs` resolves Canvas relative to its own file; changing cwd or setting an invented runtime variable does not redirect it. Copy the clean source package into a **new authorized directory outside the repository**, retaining the original `package.json`, `package-lock.json`, source policy and notices. Do not copy the whole checkout, `node_modules` or generated files, and do not install into the retained source.

Replace the absolute paths below: `SOURCE` is the retained package, `WORK` is the new independent source copy and cwd for all commands/snippets, and `OUTPUT` is a separate new destination. All parent directories must already exist without symlink ancestors.

```sh
set -eu
SOURCE=/absolute/MotionStudio/engine/design-elements/recipes/candidates/drape-material-candidate
WORK=/absolute/authorized-scratch/drape-source
OUTPUT=/absolute/authorized-output/drape
mkdir "$WORK"
cp -R "$SOURCE/." "$WORK/"
cd "$WORK"
npm ci --ignore-scripts --no-audit --no-fund
npm test
python3 verify-math.py
python3 check-source.py
npm run examples -- "$OUTPUT"
```

For air-gapped replay, replace the install command with `npm ci --offline --ignore-scripts --no-audit --no-fund --cache /absolute/compatible-populated-cache` while remaining in `WORK`. The source package does **not** include dependencies or claim fresh empty-cache recovery. `verify-math.py` and `check-source.py` are independent of Canvas; they do not establish raster or visual acceptance.

The examples script sets `DISABLE_SYSTEM_FONTS_LOAD=1`; its direct equivalent from `WORK` is `DISABLE_SYSTEM_FONTS_LOAD=1 node render.mjs "$OUTPUT"`. Output must be outside this package and a recognized MotionStudio repository. Parent directory must exist and be a regular non-symlink chain. The command builds five buffers before writing two PNG compositions, two JSON layouts and one standalone material PNG. It never loads a reference or font. The environment flag prevents Native's optional automatic system-font registration; the code itself calls no text/font API.

Two new examples: portrait **Material Study** with one copper field and model-derived endpoints/frequency; landscape **Drape Atlas** with six independent seeds/palettes and corresponding labels. Original elementary bitmap letter patterns are example-only geometry, not an imported font or newly promoted typography system.

## Status / rights

MIT adaptation, complete original notice preserved. [CREDITS.md](CREDITS.md) distinguishes adapted formula from new input contracts, composition and checks. [SOURCE.json](SOURCE.json) pins official upstream text identity. No reference image, historical UI, original brand, font binary, private checkpoint/audit identifier, installed runtime or media is in this source package.

Candidate only: no formal family registration, approved production recipe, publication, browser, interaction, video or individual aesthetic acceptance is asserted. Existing scalar-field/material-surface concepts remain the deduplication baseline; this is a restricted anisotropic-fold variant, not a new procedural-rendering family.
