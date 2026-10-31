# Byte field diagnostic candidate

A small static combination of an original synthetic byte field, its32-bin histogram and an exact sampled-byte note. Two new complete examples use different data and layouts. It is **one unregistered candidate**, not a new public family or a working diagnostic application. See CONTRACT.md and DESIGN-GUIDE.md.

## Run with an external exact font

Tested Node24.22.1 / Canvas0.1.100 on Linux. Node22+ is the declared package range, not a cross-platform pixel-equivalence guarantee.

```sh
npm ci --ignore-scripts
export DIAGNOSTIC_FONT=/absolute/external/LiberationSans-Regular.ttf
export DISABLE_SYSTEM_FONTS_LOAD=1
npm test
node render.mjs /absolute/new/output-directory
```

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
