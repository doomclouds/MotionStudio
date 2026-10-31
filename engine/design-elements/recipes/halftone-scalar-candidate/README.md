# Halftone scalar — constrained code-retention candidate

One font-free recipe: caller-supplied scalar grid → opaque RGBA/tile. Not the Halftone Drift artwork or its reference-derived mesh. Public families/registered recipes added: **0**. Pending independent review and coordinated integration; no standalone push.

```
const {renderScalarPixels, createScalarTile} = require('./index.cjs');
const props = {width:320,height:240,field:{cols:2,rows:2,values:[0,.3,.7,1]}};
const pixels = renderScalarPixels(props); // no Canvas dependency
const tile = createScalarTile(props, require('@napi-rs/canvas'));
hostContext.drawImage(tile, 40, 60); // host controls composition
```

Install the optional example/test backend with `npm ci --ignore-scripts --no-audit --no-fund`, then `npm test`. `node examples.cjs /absolute/new-external-output-directory` writes wave.png and islands.png. Existing exact Canvas0.1.100 can be supplied as CANVAS_MODULE. No font or external visual resource download required. Native platform package availability still applies; a cache-based tested install is not proof of every platform/network.

See CONTRACT.md for strict geometry/data/resource boundaries, DESIGN-GUIDE.md for composition choices, CREDITS.md and licenses/ for MIT attribution. `fixtures.cjs` is entirely new synthetic input; no original image,25×25 calibrated mesh, private evidence or source study output is included. Examples are static, not real telemetry, animation or interactive controls. Group work acceptance does not auto-approve this newly extracted API.
