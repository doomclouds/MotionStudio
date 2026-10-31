# Review tiles — restricted static candidates

**Source-retention candidate requiring separately supplied exact resources; not a publicly recoverable turnkey component.**

Two composable Canvas tile factories, not a GitHub integration, inbox application or native desktop UI. No branded logo, personal data, network requests, credentials or original screenshot. Examples are fictional. **Candidate only: zero public families/registered recipes added; no per-item owner aesthetic acceptance is claimed.**

```sh
npm ci --ignore-scripts --no-audit --no-fund
export REVIEW_TILE_FONTS=/absolute/path/to/exact-fonts
npm test
npm run render -- /absolute/new/output-directory
```

Canvas is pinned to 0.1.100, tested on Node24.22.1. Offline installation requires a populated compatible cache, not just the lockfile. Font files are deliberately excluded. Supply all three exact files in `asset-lock.json`: two renamed Inter derivatives and Liberation Mono regular. Their original-font provenance and OFL notices are retained; automatic network download or reproducible derivation of these exact historical subsets is **not** offered. Without these assets this package is not runnable out of the box.

```js
import {createReviewTiles} from './index.mjs';
const tiles=createReviewTiles({fontRoot:'/absolute/exact/fonts'});
const tile=tiles.diffPreviewTile({file:'fiction/demo.txt',lines:[
  {kind:'add',lineNo:1,text:'A fictional example.'}
],width:640});
// Returned tile is 2x; caller selects position/scale and owns the composition.
ctx.drawImage(tile,20,20,tile.width/2,tile.height/2);
```

`fixtures.mjs` and `examples.mjs` compose code-review and editorial-note examples with different line content, counts, status mixes and colors. Rendered PNGs are verification outputs, not included in this public text projection. See CONTRACT and CREDITS. Minimal examples CLI refuses existing output paths, builds both images before creating a new directory; it is not a hostile concurrent-filesystem service.

## Composition guidance

Use the diff tile for a small, authored before/after excerpt with explicit line labels, not a full file, syntax highlighter or executable patch. Provide context before changes; keep the excerpt short enough that both meaning and measured text fit. Green/red plus +/- express supplied change kinds, not inferred semantics or automatic validation. This is not a replacement for B10's code-spans styling primitive: it adds bounded line gutters, a filename surface and authored row kinds rather than arbitrary syntax spans.

Use reviewer summary beside material that genuinely needs a compact status legend. Its count derives only from supplied `approved` statuses, not a service query; never present synthetic or stale statuses as real approval. Initials are display labels, not authentication. `pending` and `none` differ visually but do not infer a workflow or deadline. Keep a readable host background and review initials, color contrast and the composited scale.

Compose either tile independently using `drawImage`; keep a logical margin between excerpt and status and retain contextual captions. The two examples change code/editorial content, line counts, status mixes and colors within the same visual system. They demonstrate parameter migration, not a second commissioned design, user trial, or independently accepted new work. For longer text, another alphabet, live state or smaller screens, redesign and validate instead of shrinking/truncating to bypass this contract.
