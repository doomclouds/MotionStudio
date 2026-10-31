# OpenDesign second group: engineering candidate

Baseline: MotionStudio dev `5f5e8f1395581a89bf5314a4c5f452f8ffb72fb5`.
Three fixed-frame adapters: Bold Poster, Decision Tree, Creative Voltage.
**User认可 source studies (“不错，可以沉淀几个积木”); new adapter/API review remains separate. User subsequently authorized “沉淀，提交，然后继续”; submission is pending unified integration, NOT yet published. No new registered recipes or public families.** No portfolio entry/cover/index/catalog is changed.

## Use
Install with `npm ci --ignore-scripts --no-audit --no-fund` (Canvas exactly 0.1.100).
For each candidate, supply the exact external resource set listed in its asset-lock.json:
`python prepare-assets.py bold-poster /path/to/supplied-assets /new/external/bold-poster`
Preparation validates all bytes before creating the destination; no downloads or automatic source reconstruction are implied.

```js
import * as canvasApi from '@napi-rs/canvas';
import {renderFrame, drawFrame} from './runtime.mjs';
const frame = await renderFrame('bold-poster', {canvasApi, assetDir:'/external/bold-poster'});
// Optional synthetic copy transfer: alternate:true, Bold Poster only; not another accepted work.
drawFrame(frame, hostContext, {x:20,y:20,scale:0.25});
```
Test: `OD_SECOND_ASSETS=/external npm test` (three named subdirectories).

## Boundary
Each renderer owns a fresh 1920×1080 canvas. Only successful complete frames are returned; no caller context enters study renderers. drawFrame accepts x/y within ±8192, scale 0.125..2, does not modify the caller current path or typography, and respects caller transform/clip/compositing. Caller owns final layout/overlap and canvas resource budget. This is not auto layout, a general decision-tree layout engine, arbitrary copy-fitting or a hardened output CLI. Internal native exports are not a stable public API.
GlobalFonts registration is process-global, so use isolated worker/processes if font registry separation matters. No automatic web-font fallback is supported.

## Rights and resources
All three compositions are pinned OpenDesign Apache-2.0 adaptations. Bold Poster/Creative Voltage retain separately attributed MIT style-preset provenance; do not collapse the composition license into MIT. Fonts retain separate OFL notices. Decision Tree excludes upstream GSAP runtime; its emoji is a declared Noto replacement, not the unknown source system glyph.
Source provenance and exact dependency hashes are beside each adapter. Font/PNG/SVG binaries, original screenshots, comparison sheets, upstream HTML, private review records and rendered covers are deliberately absent. See RESOURCE-RECOVERY.md for limitations. Tests with supplied local resources do not prove automatic Internet recovery or user approval.

## Deduplication
Bold tilted type overlaps B09 emphasis/typographic focus; Voltage panels/type overlap existing color-sections and expressive-type; Decision Tree remains a fixed seven-node layout, not a novel graph family. Keep all three as restricted local candidates until an independently reviewed registration design and registration approval exist. No count increases.

## Selected reusable pieces (two, not two new public families)
1. `drawTiltedType`: bounded transparent text composition, rotation, color and letter spacing; caller-owned registered font. Exported from runtime.mjs, contract in bold-poster/DESIGN-RETENTION.md. Already overlaps existing type family.
2. Decision Tree `renderFrame` with `nodeCopy`: exactly seven nonempty single-line Latin strings, at most 80 characters each, indexed root/yes/not-sure/python/nocode/website/course. Actual text width must fit each locked node budget before native drawing; branch label copies follow the two intermediate texts and are width-checked too. Topology, node positions, palette, selected item, cursor and licensed replacement emoji stay fixed. Not a graph solver.

`example-compose.mjs` genuinely combines the diagram with different topic copy and the tilted-text helper using the already registered Inter family. This synthetic transfer is not another accepted artwork. Creative Voltage stays a full-frame restricted recipe; its panels/script helpers are not separately counted.

Native documentation/NOTICES copied from authors retain historical study-status wording. This README and recipe-manifest.json record the later user feedback, without changing licenses or claiming approval of the new engineering interface.
