# Complementary seam — one restricted candidate

One font-free method: **one RGBA plane + one explicit monotone seam → two independently placeable complementary pieces**. Not a paper texture, arbitrary cutter, collage generator, puzzle, page clone, registered family or interactive tool. Zero families/registrations/portfolio additions. No public push is authorized by this package.

```js
import {createSeamModel, partitionPixels, createSeamEngine} from './index.mjs';
const model = createSeamModel({width:480,height:320,axis:'horizontal',
  points:[{u:0,v:150},{u:160,v:175},{u:320,v:142},{u:480,v:165}]});
// rgba is a caller-owned ordinary Uint8ClampedArray of exactly 480*320*4 bytes.
const pair = partitionPixels(model, rgba); // exact pure byte ownership
const kit = createSeamEngine({createCanvas, ImageData});
const tiles = kit.tiles(model, rgba);
tiles.before.place(hostContext, 40, 30);
tiles.after.place(hostContext, 48, 60); // original plane-sized transparent backing
```

## Keep one, reject the duplicates
[Non-duplication](NON-DUPLICATION.md) records the fixed dev inventory and nearest implementations. Rectangular permutation/lift can already be composed with `sampled-window`; colored stages belong to existing color/data/ledger methods. Neither is another new candidate here. This candidate adds only complementary nonrectangular ownership. It does not rewrite or migrate the original private studies.

[Design guide](DESIGN-GUIDE.md) connects actual code to seam orientation, visual continuity, gap and independent host transforms. [Contract](CONTRACT.md) is authoritative for bounds and raster semantics.

## Reproduce with external inputs
Tested Node 24.22.1, Python 3.12.14 stdlib, Native Canvas **0.1.100**, Linux x64. Core numeric tests need no fonts/Native. A lockfile is not an installed backend and offline npm needs a populated compatible cache.

```sh
# S = this package; W = an existing absolute external work directory.
mkdir "$W/runtime"
cp "$S/package.json" "$S/package-lock.json" "$W/runtime/"
npm ci --prefix "$W/runtime" --ignore-scripts --no-audit --no-fund
# REPO supplies exact published sampled-window helper bytes at the pinned baseline.
# FONT is the full official Instrument Sans master identified in examples/input-lock.json.
python3 "$S/examples/prepare-inputs.py" "$REPO" "$FONT" "$W/inputs"
export SEAM_INPUTS="$W/inputs"
export SEAM_FONT="$W/inputs/InstrumentSans.ttf"
export SEAM_RUNTIME="$W/runtime/node_modules/@napi-rs/canvas"
export DISABLE_SYSTEM_FONTS_LOAD=1
node --test "$S/test.mjs" "$S/test-native.mjs"
node "$S/resource-tests.mjs" "$W"
python3 "$S/io-tests.py" "$W"
node "$S/examples/render.mjs" "$W/render"
python3 "$S/package.py" "$W/package"
```

The two helper modules are **existing code**, not newly retained methods. Preparation only validates and copies supplied exact files, never fetches or executes an upstream application. `examples/input-lock.json` includes immutable source URLs; exact raw fetch is optional manual acquisition, not promised network availability. Font binaries and dependency copies stay outside this source package; full notices are inside. `loadSampler` checks the complete lock and both helper files before import; example font bytes are checked before Native loading/registration. The font-free core accepts any correctly sized RGBA plane and does not need those helpers.

Two **new** static combinations: `Split / Field` (1400×900, synthetic strata, horizontal split + detail window) and `Cut / Exchange` (1100×1200, original geometric plate, resampled then vertical split). Counts come from the split model. Editorial labels are authored, not automatically factual. No private original image, photograph, generated asset, application UI, audit identifier, rendered preview or font binary belongs to the text-only whitelist. Source snapshot may retain PENDING review as historical author-stage status; current review lives outside this projection.
