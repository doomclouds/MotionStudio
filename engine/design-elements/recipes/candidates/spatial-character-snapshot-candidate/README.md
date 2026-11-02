# Spatial-character snapshot — isolated candidate

Restricted static 2D character addresses, mark/cursor priority and a summary derived from the same immutable handle. One recipe, zero catalog registrations or new public families. Not an Orca executable, terminal, editor, sequencer, audio/MIDI interface or animated component. Read CONTRACT, DESIGN, NOTICES and the preserved MIT/OFL licenses.

## External restoration and run

Requires Node 24.22.1, external `@napi-rs/canvas` 0.1.100, Python 3 with standard library only for the optional font fetcher. Font is the unmodified official IBM Plex Mono Medium 500; no fontTools or private asset is required. Author validation used Linux x64; cross-platform raster equality is unclaimed.

Choose real absolute directories **outside this source package**, with no symlink ancestors. Runtime may be an existing real directory; font fetch/output directories must be absent and their parents must exist:

```sh
# Set these to your own absolute external directories.
export SC_RUNTIME_DIR=/absolute/external/runtime
export SC_FONT_DIR=/absolute/external/fonts
mkdir "$SC_RUNTIME_DIR"
cp package.json package-lock.json "$SC_RUNTIME_DIR/"
npm ci --prefix "$SC_RUNTIME_DIR" --ignore-scripts --no-audit --no-fund
python3 fetch-font.py --output "$SC_FONT_DIR"
export DISABLE_SYSTEM_FONTS_LOAD=1
npm test
node examples/render.mjs /absolute/external/new-output
python3 check-source.py
```

Alternatively supply the exact public font bytes described in font-lock.json into the real external font directory. Locked network font recovery and cached offline npm installation are separately evidenced; cached installation is not a no-cache public npm proof. The adapter rejects resources and registration failures rather than silently choosing system fonts.

Outputs: route.png/json, pattern.png/json and outputs.json; all synthetic, no original reference. The payload is **text-only**; generated examples, evidence and review live outside it. No edit to any source study or public repository is needed. Tests create and remove only their own temporary directories; `SC_TEST_TMP` can select an existing external test parent instead of the system temporary folder.

## Usage

```js
import { createSpatialCharacterKit } from './index.mjs';
import { loadEnvironment } from './runtime.mjs';
const api = loadEnvironment();
const kit = createSpatialCharacterKit(api);
const grid = kit.gridTile(input); // see the exact bounded contract
const readout = kit.summaryTile(grid, {label:'SNAPSHOT'});
kit.place(ctx, grid, 40, 40);
kit.place(ctx, readout, 40, 600);
```

`input` is not code and is never executed. A fresh handle is necessary for any changed snapshot. Backgrounds and surrounding typography in examples are composition helpers, not additional public constructors. Caller transform/clip/compositing are deliberately inherited at placement.
