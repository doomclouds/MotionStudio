> Integration status: source-case technical card; batch retention/submission is authorized. The two new cross-content compositions are not individually owner-reviewed. See ../README.md for external resources and ../CANDIDATE-GUIDE.md for the narrower promoted wrapper contract.

# Composition and text contract

## Full canvas: `draw(ctx, props, env) -> geometry`

- Canvas coordinates are exactly **1920 × 1080**. Caller owns the Canvas; the routine paints an opaque full frame but does not resize its backing store. Parent transform/clip deliberately remain in effect. Use identity transform and an unclipped 1920×1080 Canvas for canonical output.
- `props`: `width=1920`, `height=1080`, `contentKind='fictional-demo'`, `disclosure='Sample launch copy; not evidence of a real launch.'`; `section:{index,total}` with integer `1 ≤ index ≤ total ≤ 99`; exactly four `navLabels`; `activeIndex` integer 0..3; `label`, two `titleLines`, `footer`; `palette:{stageEdge,stageMid,text,card,ink}` in `#RRGGBB`.
- The navigation labels are explicit uppercase content (no locale-dependent automatic casing); active index is a visual token, not a validated link or chapter mapping. No interaction is implied.
- Default palette uses #1a1a1a / #2d2d2d stage, #ff5722 card, #1a1a1a ink, white stage text. Card/ink and text/each stage stop must have luminance contrast ≥ 4.5. This is **not full accessibility certification**: original dim nav/footer deliberately remain low-contrast at .35 alpha.
- The full recipe locks card `{x:740,y:240,width:1180,height:600}`, radius36 on left only, title130 / leading122.2 / tracking−2, padding110 horizontally and96 bottom, label20 / tracking4. Large left-side negative space is part of the complete work.

## Component: `drawCard(ctx, cardProps, env) -> geometry`

`cardProps = { bounds:{x,y,width,height}, shadow:boolean, palette:{card,ink}, label, titleLines:[line1,line2] }`.

- Nonnegative finite origin, width236..2360; uniform **1180:600** aspect ratio. Text, radius and shadow parameters scale uniformly. No automatic arbitrary aspect distortion, wrapping or font shrinking.
- Set `shadow:false` for contained transparent component use. `shadow:true` paints a soft shadow beyond bounds; caller owns room and clipping. A transformed caller Canvas is supported for compositing but canonical shadow fidelity is calibrated only at identity transform; prefer explicit bounds scaling.
- `delivery/card-component.png` is a standalone drawCard call on transparent 1360×760. It is not a crop from the full frame and not counted as another reference work.

## Text and dependencies

- `env.glyphs` supplies actual verified cmap Sets for roles `black`, `sans500`, `sans700`; caller must register the corresponding aliases `SignalBlack`, `SignalSans500`, `SignalSans700` from hash-verified `font-lock.json`. `render.cjs.loadFonts()` is the canonical adapter.
- All strings must be nonempty single lines without control/newline/tab characters. Latin coverage comes from original subsets; unsupported Chinese/emoji fail before platform fallback. Extend font coverage only by deliberate newly audited assets.
- Actual native advances, including tracking, are measured before any painting. Max title/label width960 at base size, nav label220, footer1300. Two authored title lines are mandatory. `titleLines` and `navLabels` must be dense arrays with every required index present as an own property; missing slots fail before any paint in both full-frame and card entries. Errors are explicit; there is no clipping, automatic ellipsis or hidden shrinking.
- Archivo Black is the actual regular-weight black-design face (v1.006), not synthetic900. Space Grotesk v2.000 is instanced at500 and700 and renamed; copyright/OFL retained. Alias font files advertise Regular to prevent accidental extra synthetic weight.

## Isolation and deterministic behavior

No IO/network/clock/random/image inputs inside `signal-frame.cjs`. Caller supplies a compatible 2D context. Inputs are not mutated. Paint/typographic styles, transform and dash are restored after success or thrown validation; paint styles are normalized before drawing, including shadow, filter, direction, kerning, word spacing and variants. Validation/measurement completes before paint. Canvas **current path is not part of save/restore**; start a fresh path after use. Parent clipping cannot be reset by the helper.

The pinned backend applies shadowColor alpha twice; the adapter uses `sqrt(.18)` to approximate source CSS opacity .18, with90px blur and (−40,+30) offset. A named pixel regression guards this empirical calibration. This is a renderer-specific approximation, not pixel-identical CSS box-shadow. Upgrading Canvas requires rerender and visual review.

Canonical output is repeatable on the pinned runtime. Cross-platform rasterizer equality, animation, browser behavior, responsive layout and actual launch claims are outside this contract.

## Integration-only correction

The retained native module has one validation-only correction: sparse authored title/navigation arrays are rejected rather than skipped by `forEach`. Original painting/layout and all authored fixture bytes are unchanged. `../source-lock.json` records both original and corrected module hashes; canonical PNG hashes remain the original six-case values. Eight slot-deletion regressions verify zero pixel/style pollution.
