# Explicit run-matrix + nested-square candidates

Two **restricted static methods**, one small text-only package. No new public family, registered recipe, portfolio promotion or edit to the source studies. Not a page clone, automatic logo generator, pixel-art layer, chart, font renderer or animated site.

- `createRunMatrix({rows})`: caller-authored binary rows → maximal consecutive horizontal runs, bit/single/bar counts. No built-in alphabet. One run becomes one rounded capsule, not one pixel per bit.
- `createNestedTile({layers})`: explicit ordered opaque color squares with increasing inset basis points → visible band areas. No seed, preset motif, implicit white layer or material/quantity claim.
- `createGeometryKit({createCanvas})`: font-free `runPlan`, `nestedPlan`, `tile`, `place`. Models are independent of Native; supplied fresh Canvas backend is trusted. See [CONTRACT](CONTRACT.md).

```js
import {createRunMatrix,createNestedTile,createGeometryKit} from './index.mjs';
const kit=createGeometryKit({createCanvas:native.createCanvas});
const mark=createRunMatrix({rows:['11001','00111','10101']});
const frame=createNestedTile({layers:[
  {inset:0,color:'#14372e'},{inset:1600,color:'#eadfc2'},
  {inset:3800,color:'#b8573d'}]});
const a=kit.tile(kit.runPlan(mark,{cell:24,rowGap:3,thickness:12,
  padding:8,color:'#14372e',pixelRatio:2}));
const b=kit.tile(kit.nestedPlan(frame,{size:180,padding:8,pixelRatio:2}));
kit.place(hostContext,a,40,40);kit.place(hostContext,b,350,100);
```

## Reproduce the two combinations

Node 24.22.1, Native Canvas 0.1.100, Python 3 standard library. Use external absolute real paths; output absent, parent existing, no symlink ancestors or dot components. The core loads **no font**. Example supporting captions use one complete unmodified public OFL Instrument Sans master. Large marks use newly authored example-only binary arrays, not that font. No screenshot/photo/derived font is needed.

```sh
mkdir /absolute/external/runtime
cp package.json package-lock.json /absolute/external/runtime/
npm ci --prefix /absolute/external/runtime --ignore-scripts --no-audit --no-fund
python3 examples/fetch-font.py /absolute/external/new-fonts
export GEOMETRY_RUNTIME=/absolute/external/runtime/node_modules/@napi-rs/canvas
export GEOMETRY_FONT=/absolute/external/new-fonts/InstrumentSans.ttf
export DISABLE_SYSTEM_FONTS_LOAD=1
node --test test.mjs test-native.mjs
node examples/render.mjs /absolute/external/new-images
python3 package.py /absolute/external/new-package
python3 io-tests.py /absolute/external/existing-test-parent
node resource-tests.mjs /absolute/external/existing-test-parent
```

Alternatively provide the exact SHA/bytes in SOURCES.json; system fallback is not allowed. `npm ci --offline` with a cache is not proof of empty-cache network restoration. `fetch-font.py` downloads only the fixed font and checks its bytes; complete OFL already accompanies this package. No cross-platform pixel equality is promised.

`exhibition.png/json`: dark landscape exhibition poster, large continuous-run mark, small secondary mark and nine repeated nested specimens. `fieldguide.png/json`: warm portrait editorial index, two-column physical specimens, different title/scale/rhythm and four geometry-derived area captions. Both are new synthetic compositions, not source brands or user-approved finished identities. Outputs stay external; 0 private reference or review record in the package.

[Design rules](DESIGN-GUIDE.md) · [API bounds](CONTRACT.md) · [scope comparison](NON-DUPLICATION.md) · [licenses](CREDITS.md). Future Git integration needs separate current-base/policy review and authorization. No automatic commit/push.
