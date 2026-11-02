# Linked volume — restricted source candidate

Three orthogonal slices and a whole-volume distribution from one immutable byte field. This is a **font-free static numeric visualization primitive**, not a medical viewer, imaging loader, interactive app or 3D renderer. Zero registered public families. Only the explicit text whitelist is a prospective integration payload; the outer private checkpoint and previews are not that payload.

## Run

Node 24.22.1, Linux x64, `@napi-rs/canvas` 0.1.100. Install the pinned dependency with `npm ci --ignore-scripts --no-audit --no-fund`, then `DISABLE_SYSTEM_FONTS_LOAD=1 npm test`. The numeric `model.mjs` has no dependencies. Native examples optionally accept `VOLUME_RUNTIME=/absolute/external/runtime` (directory containing node_modules); otherwise package-local node_modules is used. No fonts, images, credentials, network resource fetches or source reference are needed.

`DISABLE_SYSTEM_FONTS_LOAD=1 node examples.mjs --output /absolute/new/outside/directory` writes two PNGs and two JSON sidecars. Parent must exist, destination must be new, normalized, outside package and have no symlink ancestors. This trusted local multi-file writer is not transactional. It renders before validating the output path but will not write on a rejected path. Existing-cache offline cold tests do not prove a future no-cache network install.

## Compose

```js
import {createVolume, slice, inspect, moveCursor} from './model.mjs';
import {createKit} from './tiles.mjs';
const volume = createVolume({size:[2,2,2], cursor:[1,0,1],
  values:[0,1,2,3,4,5,6,7], thresholds:[4]});
const kit = createKit(trustedNativeAPI);
const options = {width:240,height:200,ratio:1,
  palette:[[25,30,40],[220,160,90]],background:[15,18,24]};
const tile = kit.sliceTile(volume, 'xy', options);
kit.place(destinationContext, tile, 20, 20);
const distribution = kit.histogramTile(volume, options);
// inspect(volume) and tile.plan are text/axis/legend sources for your own UI.
// All views at the default indices intersect at the same cursor voxel.
```

See CONTRACT.md for exact accepted input and composition semantics, DESIGN-GUIDE.md for why/when, CREDITS.md for separate provenance. No label font is silently loaded: the examples deliberately show unlabelled primitives and put all dimensions/counts/plane names in JSON. A user-facing chart must add truthful labels/legend/units/accessibility descriptions itself. These are two content/layout demonstrations, not two independently commissioned works or user aesthetic approvals.
