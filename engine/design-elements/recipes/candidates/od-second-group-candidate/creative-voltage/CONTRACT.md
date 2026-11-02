# Creative Voltage / static composition contract

## Frame and state

One complete 1920×1080 work. Fixed settled state: 47% electric-blue left panel,
53% dark right panel; three right-aligned display lines; rotated handwriting;
curved underline; opposite-corner monospace labels. No timeline, cursor, controls,
network requests, animation or responsive layout. The source mentions 4.5 seconds
while manifests say 15 seconds; neither duration is a verified deliverable here.

## Composition API

```js
const {compose, defaultScene}=require('./render.cjs');
const scene=defaultScene();
scene.copy.headline=['Render','any','video.'];
compose(hostContext,scene,{x:0,y:0,scale:1});
```

`compose` saves/restores host context, clips to the frame, and returns measured
layout data. Placement must be finite; scale positive. Do not issue simultaneous
draws into the same context. `render(output,scene)` writes a standalone PNG.

Independently reusable bricks:

- `drawSplitPanels(ctx,tokens)`: ratio, blue/dark fields and radial glow.
- `drawDisplay(ctx,scene)`: three-line right-aligned Syne title with filled-stroked
  second line. The visible word **any is not hollow**.
- `drawScriptMark(ctx,scene)`: shaped Caveat run rotated around its line box and
  the exact upstream cubic underline, not per-letter handwriting approximations.
- `drawMonoAnchors(ctx,scene)`: top-left bold mode label and bottom-right regular
  caption, with independent tracking and opacity.
- `trackedText(...)`: controlled monospace/display tracking; zero tracking draws
  one shaped string, preserving font contextual substitutions.

## Text slots / budgets

| Slot | Original copy | Constraint |
|---|---|---|
| headline[0] | Render | Syne 800, 132px, -3px tracking; max 760px advance |
| headline[1] | any | same metrics, blue fill + 2px light-blue stroke |
| headline[2] | video. | same metrics; exactly 3 hard-separated lines |
| script | make it move | Caveat SemiBold 120px; max 650px; -7° |
| meta | // CREATIVE_MODE · ON | Space Mono 700, 18px, +3px; max 650px |
| caption | html-video · creative voltage | Space Mono 400, 18px, +2px; max 760px |

Input is plain text; no newline inside a slot; currently Latin coverage only.
Oversized copy throws an error rather than silently wrapping or shrinking.
Chinese or another script requires a separately licensed typeface and a fresh
layout review. Content changes must not be misrepresented as original source copy.

## Source-native geometry

- Split at x=902.4; right gutter 110px, left gutter 90px.
- Display box x=1050, top=300, width=760. 132×0.96 = 126.72px line rhythm.
- Caveat box begins (90,420); rotation pivot is its content-box center.
- Underline viewport at (90,560): `M8 40 C140 12,360 12,512 34`; 5px round stroke.
- Mode label at (90,96). Caption right=110 and bottom=96.
- Glow center is (30%,40%) within the left panel; white alpha 0.16 fades to zero
  at 55% of the farthest-corner circle. No noise asset or photograph is needed.

Source tokens: blue #2f4bff, dark #0d0d14, white #fff, stroke #6f86ff.
The original PNG has minor RGB/edge differences from these CSS values (encoding
or color conversion is a possible cause, not established). The Native study
retains source tokens and discloses residual drift.

## Reuse boundary

Keep `NOTICE` and `LICENSES/`: Apache composition, frontend-slides MIT lineage,
and three OFL font families. Renderer never reads `evidence/reference.png`.
Reusing the full reference bitmap as a background violates this implementation
contract. No GSAP or original CSS keyframes are included. Native static QA says
nothing about browser behavior, animation timing, publication or user acceptance.
