# Byte field diagnostic candidate

A small static combination of an original synthetic byte field, its 32-bin histogram and an exact sampled-byte note. Two new complete examples use different data and layouts. It is **one unregistered candidate**, not a new public family or a working diagnostic application. Package identity: `motionstudio-byte-field-diagnostic-candidate@0.0.0` in [package.json](package.json). See [CONTRACT.md](CONTRACT.md) and [DESIGN-GUIDE.md](DESIGN-GUIDE.md).

## Run with an external exact font

Tested Node24.22.1 / Canvas0.1.100 on Linux. Node22+ is the declared package range, not a cross-platform pixel-equivalence guarantee.

`loadNative()` resolves `@napi-rs/canvas` relative to this package's `runtime.mjs`, not the shell's current directory. It has no external-runtime environment-variable selector. Use a clean source-only package copy in a **new authorized directory outside the repository**, then install there. Do not install into `SOURCE`, copy a whole checkout, or regenerate the supplied lockfile.

In this shell example, replace the absolute paths with authorized locations. `SOURCE` is the retained text package; `WORK` is its new standalone copy and the cwd for every following command and composition snippet; `OUTPUT` is a separate new output directory. Their parent directories and the test-scratch directory must already exist, with no symlink ancestors. Copy only the clean payload, including its original `package.json`, `package-lock.json`, font lock and notices, without `node_modules` or generated files.

```sh
set -eu
SOURCE=/absolute/MotionStudio/engine/design-elements/recipes/candidates/byte-field-diagnostic-candidate
WORK=/absolute/authorized-scratch/byte-field-source
OUTPUT=/absolute/authorized-output/byte-field
mkdir "$WORK"
cp -R "$SOURCE/." "$WORK/"
cd "$WORK"
npm ci --ignore-scripts --no-audit --no-fund
export DIAGNOSTIC_FONT=/absolute/external-assets/LiberationSans-Regular.ttf
export DIAGNOSTIC_TEST_TMP=/absolute/existing-test-scratch
export DISABLE_SYSTEM_FONTS_LOAD=1
npm test
node render.mjs "$OUTPUT"
```

The lockfile is not a bundled runtime. Offline installation additionally needs an independently available compatible populated npm cache; an empty-cache dependency install is not established by these instructions.

Use the unmodified Liberation Sans2.1.5 file specified by bytes/SHA in font-lock.json. This package supplies the complete OFL/distribution notices but **no font binaries or automatic downloader**. Provide-exact is an explicit prerequisite; network exact recovery is NOT_VERIFIED. Do not substitute another system font and call the same images reproduced. The generated directory contains two PNGs, two layout JSON files and outputs.json. It must be outside the package/recognized repository; existing targets reject.

## Compose directly

```js
import {buildScalarField,sampleField,copyFieldRGBA} from './model.mjs';
import {loadNative,loadEnvironment,createDiagnosticKit} from './index.mjs';
const api=loadNative();
const env=loadEnvironment(api,{fontPath:process.env.DIAGNOSTIC_FONT});
const kit=createDiagnosticKit(api,env);
const model=buildScalarField({width:320,height:200,mode:'wave',phase:1});
const field=kit.createFieldLayer(model);
const bars=kit.createHistogram(model,{width:320,height:180,accent:'#6595ce'});
const note=kit.createSampleNote(model,{x:80,y:120,width:360,title:'One source record'});
// Use a fresh host big enough for all three; explicit placement, no auto-layout.
const host=api.createCanvas(740,400),ctx=host.getContext('2d');
field.place(ctx,20,20); bars.place(ctx,20,220); note.place(ctx,370,20);
```

The pure model entry needs no Native/font/filesystem. Tile rendering needs the exact verified external font, even the field tile when using this combined kit. Returned data/Canvas pixels are intentionally mutable copies; model bytes remain private. Details, allocations, host effects and limitations are in CONTRACT.md.

## Rights and status

Original renderer/formulas, source context and fonts have distinct notices; see CREDITS.md, LICENSE, licenses/ and provenance.json. No upstream application was executed, no source screenshot or private research evidence is shipped, no rain/shader/music assets are used. New examples have no inferred individual user aesthetic approval. This source directory is only a candidate payload: no automatic commit, push, catalog or formal-recipe registration.
