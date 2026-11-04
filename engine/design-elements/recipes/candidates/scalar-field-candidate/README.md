# Bounded scalar field — source candidate

One reusable static field factory, **zero new registered public families**. New implementation extracted from an original procedural material study; not a brand UI, fractal editor, node engine, GPU shader, animation or scientific data visualization. No image/font/mesh inputs, font registration or network calls in rendering. There is no reference-derived sampled dataset.

Package identity: `bounded-scalar-field-candidate@0.0.0` in [package.json](package.json); public factory `createScalarFieldKit` is exported from `index.mjs`.

## Run from an external source copy

`render.mjs` and `test.mjs` statically import `@napi-rs/canvas` relative to their source location. The core factory accepts a trusted API object, but the supplied CLI/test have no external-runtime environment-variable selector. Copy the clean source package into a **new authorized directory outside the repository** and install there rather than in the retained source. Keep the original `package.json`, `package-lock.json` and notices unchanged; do not copy the whole checkout, `node_modules` or generated files.

Replace the absolute paths: `SOURCE` is the retained text package, `WORK` is its new independent copy and cwd for all commands and the JavaScript snippet, and `OUTPUT` is a separate new output directory. Parent directories must already exist.

```sh
set -eu
SOURCE=/absolute/MotionStudio/engine/design-elements/recipes/candidates/scalar-field-candidate
WORK=/absolute/authorized-scratch/scalar-field-source
OUTPUT=/absolute/authorized-output/scalar-field
mkdir "$WORK"
cp -R "$SOURCE/." "$WORK/"
cd "$WORK"
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run render -- "$OUTPUT"
```

The CLI requires an absolute new output directory with an existing trusted parent, but does not detect repository ancestors. Keep output outside the repository and both source copies; this is a caller requirement, not an added runtime guard. Tests use the system temp directory for output-path probes, so that directory must also be an authorized external location.

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
