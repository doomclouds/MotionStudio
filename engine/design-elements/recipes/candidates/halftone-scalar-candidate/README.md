# Halftone scalar — constrained code-retention candidate

One font-free recipe: caller-supplied scalar grid → opaque RGBA/tile. Not the Halftone Drift artwork or its reference-derived mesh. Public families/registered recipes added: **0**. Pending independent review and coordinated integration; no standalone push.

```
const {renderScalarPixels, createScalarTile} = require('./index.cjs');
const props = {width:320,height:240,field:{cols:2,rows:2,values:[0,.3,.7,1]}};
const pixels = renderScalarPixels(props); // no Canvas dependency
const tile = createScalarTile(props, require(process.env.CANVAS_MODULE));
hostContext.drawImage(tile, 40, 60); // host controls composition
```

## Run without installing into the source tree

The core is dependency-free; the example/test adapter accepts an existing absolute `CANVAS_MODULE` directory. Use an already authorized Canvas 0.1.100 installation, or prepare a new external runtime using this package's original lock:

```sh
PKG=/absolute/path/to/halftone-scalar-candidate
RUNTIME=/absolute/new-external-runtime
mkdir "$RUNTIME"
cp "$PKG/package.json" "$PKG/package-lock.json" "$RUNTIME/"
(cd "$RUNTIME" && npm ci --ignore-scripts --no-audit --no-fund)
export CANVAS_MODULE="$RUNTIME/node_modules/@napi-rs/canvas"
node "$PKG/test.cjs"
node "$PKG/examples.cjs" /absolute/new-external-output-directory
```

Both external directory parents must exist. The output must be new and outside the repository. No fonts or visual resources are downloaded; Native platform-package availability still applies, and an existing-cache run is not a fresh-network or all-platform guarantee.

See CONTRACT.md for strict geometry/data/resource boundaries, DESIGN-GUIDE.md for composition choices, CREDITS.md and licenses/ for MIT attribution. `fixtures.cjs` is entirely new synthetic input; no original image,25×25 calibrated mesh, private evidence or source study output is included. Examples are static, not real telemetry, animation or interactive controls. Group work acceptance does not auto-approve this newly extracted API.
