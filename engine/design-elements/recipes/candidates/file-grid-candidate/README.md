# Same-source file grid + summary

One **restricted recipe candidate**, two tile factories, **zero formal public families**. This is a standalone extraction, not a full file-manager skin or a production integration. All example names and paths are fictional. No files are listed, no device is contacted, and nothing is transferred or executed.

## Run with external fonts and outputs

Use Node 24.22.1, `@napi-rs/canvas` 0.1.100, Python 3.12.14 and fontTools 4.61.1. The source package contains text only. Font binaries and generated PNGs must remain **outside this package directory**. No existing private study, screenshot, icon, report or asset is needed.

```sh
PKG=/absolute/path/to/file-grid-candidate
export PYTHONDONTWRITEBYTECODE=1
WORK=/absolute/new-external-file-grid-work
# WORK's parent must exist; WORK itself must be new and outside the repository.
mkdir "$WORK"
mkdir "$WORK/runtime" "$WORK/tmp"
cp "$PKG/package.json" "$PKG/package-lock.json" "$WORK/runtime/"
(cd "$WORK/runtime" && npm ci --ignore-scripts --no-audit --no-fund)
export CANVAS_MODULE="$WORK/runtime/node_modules/@napi-rs/canvas"
python3 -m venv "$WORK/venv"
"$WORK/venv/bin/python" -m pip install -r "$PKG/requirements-fonts.txt"
# The next command accesses fixed public font sources; run only when authorized.
"$WORK/venv/bin/python" "$PKG/fetch-fonts.py" --output "$WORK/inputs"
"$WORK/venv/bin/python" "$PKG/prepare-fonts.py" --inputs "$WORK/inputs" --output "$WORK/fonts"
export PORTAGE_FONT_DIR="$WORK/fonts" PORTAGE_FONT_INPUTS="$WORK/inputs"
export TMPDIR="$WORK/tmp" DISABLE_SYSTEM_FONTS_LOAD=1
node --test "$PKG/test.mjs"
"$WORK/venv/bin/python" "$PKG/test-resources.py"
node "$PKG/policy.mjs"
node "$PKG/render.mjs" "$WORK/previews"
```

The existing loader accepts `CANVAS_MODULE` as an absolute Canvas module directory. If a separately installed, authorized Canvas 0.1.100 runtime already exists, point there instead of installing again. Dependency installation occurs only in the external runtime, Python packages only in the external venv; script paths still point at this source package. `TMPDIR` keeps resource-test scratch files outside the repository. The commands describe the supported setup, not a claim that a fresh network/font restore has been performed. Exact font inputs may also be supplied under the existing lock; do not substitute a different Inter build.

`fetch-fonts.py` requires a **new** external output directory and downloads the fixed public Inter master plus OFL notice, validating complete SHA identities before writing. The offline preparation step verifies all inputs and derives two exact renamed instances. `font-lock.json` is copied with them; the runtime checks both font files and that lock before any font registration. Registration is process-global; rollback after a later registration failure is not promised. See the full filesystem/trust limits in `CONTRACT.md`.

## Compose

```js
import {setup} from './runtime.mjs';
import {createFileTiles} from './file-tiles.mjs';
const api = setup(process.env.PORTAGE_FONT_DIR);
const tiles = createFileTiles(api);
const grid = tiles.fileGridTile({
  columns: 2, rows: 1, cellWidth: 220, cellHeight: 260,
  items: [{id:'a',name:'Notes',kind:'folder'},
          {id:'b',name:'Brief.txt',kind:'text'},
          {id:'c',name:'Bundle.zip',kind:'package'}],
  offset:0, selectedIds:['c']
});
const summary = tiles.paneSummaryTile({
  width:800, label:'Sample', grid, path:['Workshop','Draft']
});
const host = api.createCanvas(900,500).getContext('2d');
tiles.place(host,grid,32,24);
tiles.place(host,summary,32,320);
// grid.plan.selectedTotal === 1; selectedVisible === 0.
// summary.plan.stats.selectedHidden === 1, derived from that exact handle.
```

## Two independent examples

- `examples/compositions.mjs:renderFieldStudy`: 1240 × 940, 10 items, offset 3, 6 visible, 3 selected overall / 1 selected here / 2 hidden; warm paper and dark indigo.
- `renderEdition`: 1120 × 1160, 9 different items, 2-column/3-row grid, 6 visible, no selection; pale lilac and warm-white editorial layout.

The grid is consumed directly on two different host layouts. Both summaries receive their actual grid handle; annotations read the frozen model instead of duplicating counts. Neither example reproduces the original application's window frame.

`CONTRACT.md` specifies input and context boundaries. `DESIGN-GUIDE.md` explains reuse decisions. `CREDITS.md` and `provenance.json` distinguish MIT code, external OFL fonts and excluded third-party icons. The bounded native tests do not certify browser interactivity, accessibility, performance at scale or universal font shaping.
