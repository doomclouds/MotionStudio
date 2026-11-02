# Authored byte edits — bounded source candidate

One static recipe: **given edits in base coordinates, show the resulting target coordinates and byte evidence**. It does not discover differences or find a minimum edit script. Two new fictional combinations demonstrate insertion after a deletion and a deletion that becomes an empty target anchor. No app window, product brand, original screenshot, user file, private audit or font binary belongs in this source package. No formal family or registry entry is added.

## Public entry

```js
import {compileEdits, baseByteEvidence, targetByteEvidence,
        createByteEvidenceKit} from './index.mjs';
const model = compileEdits({base, edits, selected: 0});
const kit = createByteEvidenceKit(canvasAPI, {fontFamily: 'MyLoadedMono'});
const pair = kit.pairView(model, {
  width: 1280, rows: 10, rowHeight: 24, fontSize: 12,
  leftStart: 128, rightStart: 128, theme: 'paper', ratio: 1
});
kit.place(hostContext, pair, 40, 200);
```

`operationTable` and `summaryCard` consume that same compiled model. A replacement removes base bytes and inserts new bytes even if their values happen to match; provenance follows authored intent, not content equality. Mapping functions return retained coordinates or explicit removed/inserted provenance, never a fabricated one-to-one mapping for replacement interiors.

## External reproducible runtime

Node 24 and Native Canvas **0.1.100** were used. Install from the supplied package.json/package-lock.json in a separate runtime directory, not here. Use `npm ci --ignore-scripts --no-audit --no-fund`. An existing npm cache can support `--offline`; that is not a fresh network or clean-OS claim.

A single **unmodified IBM Plex Mono Regular** (actual weight400, OFL1.1) is restored from the pinned public Google Fonts commit. No FontTools or derived font is needed. Run all paths below as normalized absolute paths to new external locations with existing real parents. Do not place resources in this source package or a recognized MotionStudio checkout.

```sh
python3 fetch-font.py --output /absolute/new-font-directory
export BYTE_EDIT_FONTS=/absolute/new-font-directory
export BYTE_EDIT_RUNTIME=/absolute/runtime/node_modules/@napi-rs/canvas
export DISABLE_SYSTEM_FONTS_LOAD=1
node --expose-gc --test test.mjs
node test-resources.mjs
python3 test-io.py
python3 verify-model.py
node --expose-gc verify-raster.mjs
node render.mjs --output /absolute/new-render-directory
python3 check-source.py
python3 make-package.py --output /absolute/new-source.zip
python3 make-report.py --renders /absolute/new-render-directory --output /absolute/new-report.html
```

Optional `BYTE_EDIT_TEST_ROOT` selects an existing external directory for disposable negative tests. Font fetch validates its output before contacting the network. Exact original bytes may also be provided instead of fetching. The adapter rejects wrong bytes, missing fonts, symlinks and false registration; no system fallback. Direct kit users may instead inject a trusted API and an already-registered family. They own font rights/identity; every actual label and byte glyph must still fit the checked slots. Arbitrary injected fonts are not promised to match the reference font's pixels.

## Boundary

`package/` is the eventual exact text-only migration unit, not its enclosing study folder. Generated PNG/layout/report, restored fonts, dependency installations, private handoffs and audit/checkpoint records stay outside. `source-policy.json` is an explicit path allowlist. Full current-repository/history checks and independent review are later integration gates; this package's local check is not those gates. `CONTRACT.md`, `DESIGN.md` and `NOTICES.md` specify the limits and layered rights.
