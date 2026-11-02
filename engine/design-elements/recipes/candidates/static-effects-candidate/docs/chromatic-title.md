# Chromatic title · what to reuse, and when not to

## Design purpose

Use a short, decisive two-line statement for a chapter break, deliberate pause or technical-themed title. The vocabulary is mechanical: strict centering, monospace peripheral metadata, low-energy grid, and small opposite-corner diagnostic marks. Cyan/magenta offsets give one white title a charged edge; they are not separate illustrations, real channel data or proof of a system failure.

Keep the reading order: **title → status/kicker → short caption → peripheral metadata**. Do not compete with the title by increasing the scan field or corner contrast. A full copy panel, table, error explanation or operational incident dashboard is a different design problem.

## Contract and composition

```js
const { chromatic } = require('./src/index.cjs');
const { loadFonts } = require('./runtime.cjs');
const env = loadFonts('glitch');
chromatic.drawChromaticTitle(ctx, {
  lines: ['TYPE', '_SHIFT'],
  bounds: { x: 20, y: 30, width: 600, height: 200 },
  theme
}, env);
```

- Full frame1920×1080. Independent title bounds are positive3:1; uniform scaling from1200×400.
- Exactly two authored lines. Real Space Grotesk700, size200, baseline interval180, native tracking−2.7, offsets cyan(−3,+1) / magenta(+3,−1) with screen blending.
- Source CSS requests900 although its font axis ends700. The native face is genuinely700. Never relabel it900 or silently synthesize bolder outlines to claim a nonexistent master.
- Whole-frame text/theme/glyph/overflow checks are explicit. Three header/footer fields, fixed kicker/caption slots. The component does not automatically shrink or wrap.
- `contentKind:'fictional-style'` is required by the frame adapter. The visible REC/timecode shapes are illustrative, not a recording-status UI.
- Source missing glyphs are explicit geometry: block-density tokens, record dot/play triangle; caption strike is a separate segmented style over plain text. No silent OS font fallback. Keep these as decoration, not meaningful machine-readable symbols.
- `drawSignalField` uses seeded native scan texture, not the source SVG turbulence algorithm. The seed is explicit and nonzero uint32. A frozen field is not an animation implementation.
- Styles/transforms are restored; current path follows Canvas semantics. Call `beginPath()` before subsequent caller-owned paths.

- All public component bounds use dimensions **1–8192 px** and x/y coordinates **−16384–16384 px**, with the fixed aspect preserved. Subnormal/undersized/huge geometry is rejected before paint. Diagnostic mark x/y uses the same coordinate domain; all four 9-cell string rows are densified and prevalidated, so sparse/malformed arrays cannot partly paint.

- Measurement and text paint both normalize supported word spacing, direction, kerning, stretch, caps and rendering flags to the fixed LTR/default contract. Caller values are restored; inherited RTL or negative word spacing cannot change this composition. This is not a bidirectional layout engine.

## Relationship to existing MotionStudio assets

This is a specialized combination near `design.expressive-type.v1` and `design.typographic-focus.v1`; it does **not** call those modules. Existing expressive-type covers authored extrusion/slices; this candidate locks real font metrics, two screen-blended channel offsets and a fictional status frame. Do not register a new family merely because the colors changed. Test real reuse before deciding whether the channel variant belongs inside expressive-type instead.

## Acceptance checklist

Read the text without effects first; choose the two authored line breaks; verify supported glyphs; keep the caption short; inspect at final output size; then inspect cyan/magenta separation on a magnified crop. A byte-identical render is not evidence that the headline reads well or that the owner prefers this style. The owner’s group-level acknowledgement/submission request is recorded separately; it is not an itemized aesthetic review of this adapter.
