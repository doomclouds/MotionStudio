# Editorial feature group · candidate

A small static composition for six short editorial messages: one spanning anchor with an excerpt, a statement with an authored statistic, an aside, and three supporting messages. The split encodes **reading hierarchy, never numerical magnitude**. Zero registered families or formal reviewed recipes. Not a full page, responsive system, dashboard or accepted brand design.

## Use

This source has no npm dependencies, file/network operations, fonts or screenshots. Supply a compatible Canvas API and your own already-registered regular/bold font family. The family must remain unchanged between planning and drawing. Font identity, licensing, glyph coverage and cross-platform behavior belong to the caller; no font fallback/coverage verification is offered by this small layout module.

```js
import {planGroup,drawGroup} from './index.mjs';
import {archive,renderExamples} from './examples.mjs';
import {verify} from './test.mjs';
// api: a caller-supplied Canvas implementation. MyRegisteredFont: caller resources.
const context = api.createCanvas(1600,1200).getContext('2d');
const plan = planGroup(context,archive,{fontFamily:'MyRegisteredFont'});
drawGroup(context,plan,{canvasApi:api,x:20,y:20});
const checks = verify(context,api,'MyRegisteredFont');
const examples = renderExamples(api,'MyRegisteredFont');
// examples expose canvases/plans. Save outputs outside the repository if desired.
```

Observed integration used Node24.22.1, Native Canvas0.1.100 and explicitly registered external Liberation Sans regular/bold, with system-font discovery disabled. This is a tested integration, not a bundled runtime or exact-font recovery workflow. Different fonts may reject the same text; shorten/recompose rather than silently reducing type.

The two fictional examples alter content, line count, dimensions, split, spacing and insets without scaling type. They are explicit non-proportional compositions, not evidence of automatic responsiveness. Run `verify` with your actual registered font and inspect `renderExamples` before use. All six items and the excerpt/stat are required; this deliberately avoids a general grid framework.

See CONTRACT.md for input/state boundaries and DESIGN.md for decisions and deduplication. Source policy: only these original text/code files, never generated images, native installations, font files or private comparison evidence.
