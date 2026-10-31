# Glyph evidence — unregistered static candidate

One bounded recipe connects **outline, Unicode, glyph name, hmtx advance and fixed axes** through one immutable model. It is not a font editor, shaping engine, new formal family, live-axis control or motion system. Two original teaching compositions show different content/layouts; no application window or source screenshot is required.

## External setup

Node24 and Native Canvas0.1.100 tested. Use a separate Python environment with `fonttools==4.61.1` (`requirements.txt`) for preparation. No upstream application is installed or run.

```sh
# From this package; all directories below must be absolute and external.
export GE_RUNTIME_DIR=/absolute/external/runtime
mkdir "$GE_RUNTIME_DIR"
cp package.json package-lock.json "$GE_RUNTIME_DIR/"
npm ci --prefix "$GE_RUNTIME_DIR" --ignore-scripts --no-audit --no-fund
export PYTHONDONTWRITEBYTECODE=1
python fetch-masters.py --output /absolute/external/new-masters
python prepare-outlines.py --inputs /absolute/external/new-masters --output /absolute/external/new-outlines
export GE_RESOURCE_DIR=/absolute/external/new-outlines
export DISABLE_SYSTEM_FONTS_LOAD=1
npm test
python test-resources.py
python test-prepare-io.py
python verify-model.py
node verify-ink.mjs
node examples/render.mjs /absolute/external/new-render
python check-source.py
```

Alternatively provide exact unmodified masters named `fraunces.ttf` and `inter.ttf` per `master-lock.json`. The fetcher uses only fixed official URLs, byte/SHA/Git-blob checks and no runtime network. The generator checks all inputs, version and expected output identity. **No font binaries or generated outline JSON are in this source package.** The generated JSON is OFL font software and carries both OFL notices externally. Runtime verifies code-pinned manifest identity and every external resource before loading Native; no font registration/system fallback.

## Compose

```js
import {createGlyphEvidenceKit} from './index.mjs';
const kit=createGlyphEvidenceKit();
const model=kit.model({text:'AVATAR 04',instance:'serif-display',size:88});
const specimen=kit.specimenTile(model,{width:610,height:154,ink:'#9bd5f8'});
const table=kit.glyphTableTile(model,{width:610,rowHeight:34,start:0,count:5});
const axes=kit.axisPanelTile(model,{width:610,rowHeight:90,tags:['wght','opsz','SOFT']});
kit.place(callerContext,specimen,40,60);
const bytes=kit.png(specimen); // detached Buffer
```

`model.line.glyphs` supplies ruler positions and `tile.plan` records slice/axis semantics. Public instances are `serif-display`, `serif-soft`, `sans-text`, `sans-heavy`. No exposed setter changes font axes. `glyph` in the table is a **font-local name, not numeric GID**.

See `CONTRACT.md`, `DESIGN.md`, `NOTICES.md`. The precise text payload is `source-policy.json`; generated outputs/resources/evidence/dependencies remain external. Not published, not registered, no claimed individual aesthetic acceptance.
