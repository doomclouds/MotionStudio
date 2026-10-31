# Soft-orb editorial frame · field versus information

## Design purpose

A subdued central reading zone is surrounded by large, soft color masses. The field is atmosphere; the authored three-line headline remains the subject. Mixed Latin/CJK contrast and one serif emphasis create an editorial voice, while tiny corner labels anchor the large empty margins.

Use it for a short title, calm statement or introductory poster. Avoid small-body reading, numerical comparison, live product status or claiming a functional command badge. More colored circles do not make information more legible. Keep high-energy color away from critical text or choose another frame.

## Independently composable pieces

```js
const { softOrb } = require('./src/index.cjs');
softOrb.drawLiquidField(ctx, {
  ...field,
  bounds: { x: 40, y: 40, width: 960, height: 540 }
});
softOrb.drawMixedHeadline(ctx, {
  lines, fill: '#fafaf8',
  bounds: { x: 80, y: 140, width: 550, height: 200 }
}, env);
```

- Field: positive16:9 bounds, clipped;1–8 ordered screen-blended circles with explicit center, radius, blur, color and alpha;64px grid. These are native blurred circles, **not WebGL, fluid simulation or recovered motion keyframes**.
- Local coordinates are1920×1080. Radius(0,700], blur[0,180], alpha[0,1]; finite bounded positions allow edge-cropped circles without leaking outside the component rectangle.
- Native blur already follows the context transform. Do not multiply the blur radius by scale a second time; a regression test covers this actual failure.
- Headline: positive11:4 bounds, exactly three authored lines,1–8 runs per line. Typesetting is explicit, not a CJK line-break or general multilingual layout engine.
- Headline local size128, tracking−3.84, baselines111/237/363; Chinese baseline+6; serif emphasis shear−0.23. Small bounded `dx`, `dy`, `scale` adjustments are headline-only and preserve reserved advance. Ink overflow fails.
- The source names Noto Sans SC but never loads it; the serif Chinese character is also absent from Source Serif Pro. Therefore source Chinese fallback identity is **unknown**. Final substitutes are pinned Noto Sans SC650/400 and Noto Serif SC600; Latin is genuine Inter Tight900/400/700. No source-font identification is implied.
- CJK fonts are deliberately subset. New unsupported characters fail. Extend the authorized subset and update hashes/visual review for real new copy; never quietly use a system fallback.
- The source-copy badges/marketing claims are not included in synthetic public examples. Full-frame adapters still require an explicit content classification and disclosure.

- All public component bounds use dimensions **1–8192 px** and x/y coordinates **−16384–16384 px**, with the fixed aspect preserved. Subnormal/undersized/huge geometry is rejected before paint.

- Measurement and text paint both normalize supported word spacing, direction, kerning, stretch, caps and rendering flags to the fixed LTR/default contract. Caller values are restored; inherited RTL or negative word spacing cannot change this composition. This is not a bidirectional layout engine.

## Relationship to existing assets

The field concept overlaps `design.material-surfaces.v1`; the headline overlaps `design.typographic-focus.v1`. This implementation does **not** call either module. It uses direct blurred circle geometry rather than the material-surface API's glass/paper panels. Keep it a candidate composition, not a “new gradient family.” A future common backdrop slot may be better than another public family; decide after real reuse.

## Acceptance checklist

Review the field without text; check that it supports a reading zone. Then add real copy and explicit lines. Inspect CJK/Latin baselines, emphasis, final punctuation, caption and badge. Test half-size and nested composition, then examine the whole frame. Native/source blur and unknown fallback differences remain disclosed. The owner’s group-level acknowledgement/submission request is recorded separately; it is not an itemized aesthetic review of this adapter.
