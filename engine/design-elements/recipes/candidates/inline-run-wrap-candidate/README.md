# Inline run wrapping candidate

Status: local candidate, unregistered, not a new catalog family. Original bounded static source and synthetic content only. No reference copy, brand, screenshot, font binary, generated output, or private report is included.

This adds automatic whitespace-based line breaking across continuous styled Latin runs. It does not replace existing authored-row or glyph-path APIs. See [scope and deduplication](DESIGN.md), [implementation](inline-paragraph.mjs), [two synthetic compositions](examples.mjs), and [regressions](test.mjs).

## Contract

`layout(context, input)` validates and measures without painting pixels. Input has:

- `bounds`: x, y, width, height in the context's local coordinates.
- `runs`: 1..64 `{text, style, strike?}` objects; 4096 characters total.
- `styles`: 1..16 named `{family, weight, italic, color}` definitions. Family is a caller-registered Canvas alias; color is six-digit hex.
- `size`: uniform 8..200px size for every run; `lineHeight`: uniform 8..400px baseline distance.
- `maxLines`: required integer 1..64. NaN, infinity, zero and fractional limits reject.
- `inkGap`: optional 0..100px interline ink clearance, default 0 only when omitted. Explicit null/undefined reject.

Supported text is printable ASCII, NBSP (U+00A0), and LF. Other Unicode, tabs and carriage returns reject. Ordinary spaces collapse; they permit wrapping. NBSP is preserved and never a break opportunity. Style changes do not permit wrapping inside a word. LF ends a nonempty line; blank hard lines reject. Blank text rejects. There is no hyphenation, emergency word splitting, ellipsis, font fitting, horizontal scaling, or Unicode line-breaking algorithm.

Both shaped advance and actual glyph ink determine fit. Whole-line origin compensation preserves a negative italic bearing. A one-pixel inset reserves antialiasing room. Strike geometry excludes trailing whitespace and participates in vertical and horizontal preflight. Fixed baseline spacing that collides with prior line ink rejects. Any overflow rejects before pixels are painted.

A plan is deeply frozen and is bound to the exact measurement context. `paint(context, plan)` accepts only a plan created by `layout` on that context. Font and paint state are restored on success or error. Returned `bottom` and `usedHeight` let a caller place subsequent content using real ink height, rather than assuming a number of lines.

## Caller responsibilities and limits

Register and verify font files and glyph coverage before layout. This module does not identify fonts, recover missing glyphs, certify a font family exists, or infer a fallback. Keep the registered font set unchanged between measurement and paint. Use a context without an unrelated clipping region; bounds are local-coordinate geometry, not a promise about transformed device-space pixels. The module preserves the caller's transform and clip.

This is Latin static Canvas layout, not a browser paragraph engine, shaping engine, rich-text editor, accessible DOM, bidi implementation or multilingual layout. Font loading, kerning and rasterization depend on the supplied Canvas implementation. No cross-platform pixel identity or user aesthetic acceptance is claimed.

## Run externally supplied dependencies

Set `CANVAS_MODULE` to an installed `@napi-rs/canvas` module, and `FONT_REGULAR`, `FONT_BOLD`, `FONT_ITALIC` to local font files that cover ASCII and NBSP. The example helper registers three fixed aliases. No package or font is downloaded by these scripts. The regression fixture is designed for the DejaVu Serif regular/bold/italic triplet. Other fonts can produce different line breaks or fail font-specific bearing/width assertions; they need a separate validation, not comparison to unrelated screenshots.

Run `node test.mjs` from this directory. Run `node examples.mjs /absolute/directory/outside/repository` for the two independent PNGs and geometry JSON files. The examples reject an output path within this repository. They use different text lengths and move the support block using measured title bottom. Resulting row counts depend on the supplied fonts; they are not a font-independent acceptance condition. Generated files must remain outside the public source tree.

Tests cover style-boundary words, NBSP, finite limits, glyph/decoration fit, line collisions, actual-height placement, input rejection, immutable plans, context ownership, Canvas state restoration, determinism, and independent raster-bound checks. These are bounded technical fixtures, not public artwork or production acceptance.

## Rights

Original candidate code and synthetic text follow the repository's MIT license. The externally installed Canvas library and caller-provided fonts retain their own licenses; the repository license does not grant rights to those resources. No third-party source font, brand artwork or reference media is redistributed here.
