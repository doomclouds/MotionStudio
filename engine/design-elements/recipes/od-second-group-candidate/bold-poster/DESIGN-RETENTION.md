# Reusable local typography study
Purpose: use type mass and asymmetry to communicate a short manifesto without invented charts or decorative cards. Maintain one red accent with deliberate large whitespace.
- Small sans kicker/date establish issue metadata.
- One oversized tilted numeral balances the left headline; not a quantitative chart.
- Three display lines use different rotation origins, not one flattened headline image.
- Serif standfirst supports the declaration, with explicit line breaks.
- Two thin rules unify the panel without adding frames.

## Local helper: drawTiltedType(ctx, options)
Authored text, x/y baseline, size, family, angle, origin, color and spacing; optional maxWidth; required canvasApi.createCanvas. Input: 1–200 text characters, font family 1–64 letters/digits/spaces/hyphens; |coordinates|≤8192; 4≤size≤512; |angle|≤15 degrees; |spacing|≤12; maxWidth 1..4096; six-digit hex color. Reject width overflow before painting.
Rotated text is painted onto a tightly bounded scratch tile (≤8,388,608 pixels, ≤8192 each axis), then composited once. This protects caller current path from Canvas backend transform interactions. Font/styles/transform are restored; 13 negative contracts assert no pixel/style pollution.
Caller owns registered fonts, nonsingular sensible existing transform, clipping, alpha/composite/filter/shadow and final canvas fit. No auto-wrap, automatic accessible spacing, generalized responsive layout, or whole-poster transaction guarantee.
Main composition and alternate copy both consume the helper. The source-specific rotation origin/baselines stay in scene.mjs; do not mistake these for a generic layout engine.

## Deduplication
This overlaps existing MotionStudio B09 emphasis-tile in “rotated typography.” It adds a local current-path-isolated rendering experiment, not automatically a new public primitive or recipe. New public family count: 0. New formal recipe count: 0 until separately reviewed/registered.

### Caller typography isolation (review correction)
Measurement and offscreen painting now use identically configured fresh contexts: authored font/letterSpacing, wordSpacing=0px, direction=ltr, left/alphabetic alignment. Caller wordSpacing and direction are intentionally not typography inputs and remain unchanged. Regression tests cover caller -25px and +25px word spacing with RTL direction, requiring identical bounds and complete PNG bytes to the default caller. Original faithful and alternate output hashes remain unchanged. This fixes the independently reported negative-word-spacing crop rather than relaxing the error contract.
