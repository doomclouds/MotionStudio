# Bounded scalar field — source candidate

One reusable static field factory, **zero new registered public families**. New implementation extracted from an original procedural material study; not a brand UI, fractal editor, node engine, GPU shader, animation or scientific data visualization. No image/font/mesh inputs, font registration or network calls in rendering. There is no reference-derived sampled dataset.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run render -- /absolute/new/output-directory
```
Pinned external dependency: `@napi-rs/canvas` 0.1.100. The lockfile is not a bundled runtime; offline installation requires a compatible populated cache. Tested with Node 24.22.1 and Native Canvas 0.1.100 on Linux x64 GNU. Fonts and Python are unnecessary.

```js
import * as canvas from '@napi-rs/canvas';
import {createScalarFieldKit} from './index.mjs';
const kit=createScalarFieldKit(canvas);
const tile=kit.fieldTile({width:320,height:240,phase:.5,frequency:2.8,
  palette:[[24,24,40],[94,89,152],[232,196,146]]});
const host=canvas.createCanvas(400,320);
kit.place(host.getContext('2d'),tile,40,40);
```

Read [CONTRACT](CONTRACT.md), [DESIGN-GUIDE](DESIGN-GUIDE.md), [CREDITS](CREDITS.md). `examples.mjs` demonstrates two new geometric compositions using different fields, dimensions, palettes and host clipping. They are verification compositions, not two new client works or individually owner-approved designs. Core work was authorized for local retention; no automatic publication or family admission is asserted.
