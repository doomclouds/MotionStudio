# Bounded radial-node recipe

One **static classification composition**, not a new public design-element family or an interactive menu. Angles identify directions/categories; they do **not** encode a quantitative share. Marks are small overlapping circular lobes, with exact counts also printed in a same-model summary. The center shows the node count.

Two new fictional compositions are provided: a five-chapter **Field guide** on a horizontal light sheet (1560×1080), and three **Listening rooms** on a vertical dark sheet (1280×1520). Their node counts, mark totals and selected identity all come from their model. No original product screenshot, logo, private record, generated-art dependency, or font binary is in this text package.

## Run in external directories

Use Node 24, Python 3.12 + `fonttools==4.61.1`, and the pinned `@napi-rs/canvas@0.1.100`. Install the npm lock into a separate runtime directory, not here:

```sh
# P points to this package, W to an existing external work directory.
mkdir "$W/runtime"
cp "$P/package.json" "$P/package-lock.json" "$W/runtime/"
(cd "$W/runtime" && npm ci --ignore-scripts --no-audit --no-fund)
python3 "$P/fetch-font.py" --output "$W/master"
python3 "$P/prepare-fonts.py" --master "$W/master/Noto-master.ttf" --output "$W/fonts"
export RADIAL_RUNTIME="$W/runtime/node_modules/@napi-rs/canvas"
export RADIAL_FONTS="$W/fonts"
export DISABLE_SYSTEM_FONTS_LOAD=1
node --test "$P/test.mjs"
node "$P/test-resources.mjs" --work "$W/resource-tests"
python3 "$P/test-prepare-io.py" --work "$W/io-tests" --master "$W/master/Noto-master.ttf"
node --expose-gc "$P/verify-geometry.mjs"
node "$P/render.mjs" --output "$W/previews"
python3 "$P/make-report.py" --images "$W/previews" --output "$W/report.html"
python3 "$P/check-source.py"
python3 "$P/make-package.py" --output "$W/source.zip"
```

All output paths must be new, absolute, dot-component-free and outside this package, with an existing parent; symlinks (including dangling and ancestor links) reject. A network failure stops font fetch; no substitute/fallback is silently installed. `prepare-fonts.py` can instead use an exact caller-provided master with the recorded size/SHA.

```js
import {createModel, createKit} from './index.mjs';
import {loadRuntime} from './runtime.mjs';
const env = loadRuntime(process.env.RADIAL_FONTS);
const model = createModel({name:'Draft map', selected:'read', nodes:[
 {id:'read',label:'Read',angle:0,marks:2,icon:'stack'},
 {id:'write',label:'Write',angle:120,marks:4,icon:'weave'},
 {id:'share',label:'Share',angle:240,marks:1,icon:'east'}
]});
const kit = createKit(env);
const diagram = kit.radialTile(model, {width:1100,height:900,radius:190});
const summary = kit.summaryTile(model, {width:360});
// kit.place(nativeContext, diagram, 0, 0); // one drawImage, no interaction
```

For custom fonts, the core accepts a **trusted** `{createCanvas,regular,semibold}` environment. Callers must register both ASCII-capable fonts first and accept their different metrics/raster; no verification or fallback equivalence is inferred. Use the bundled locked loader for tested examples and cold byte identity. See CONTRACT / DESIGN / NOTICES. Publication, integration and full-repository history checks are separate gates; no registry or media allowlist is changed here.
