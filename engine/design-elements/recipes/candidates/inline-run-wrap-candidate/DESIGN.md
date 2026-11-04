# Scope and overlap

## Reuse decision

- [code-spans](../../reviewed/b10/recipes/code-spans.mjs) already validates actual glyph bounds for colored runs, but accepts caller-authored rows and one font. Use it for source/code rows; it does not supply continuous mixed-font paragraph reflow.
- [typographic-focus](../../../families/typographic-focus/index.mjs) uses authored title/body lines and whole-line emphasis. Prefer it when those inputs are already the intended design.
- [editorial-evidence](../../reviewed/b06/recipes/editorial-evidence.mjs) composes authored columns and baselines; it does not turn continuous copy into lines.
- [emphasis-tile](../../reviewed/b09/recipes/emphasis-tile.mjs) is a bounded rotated word/tile, not an inline line-breaking service.
- [glyph-run-path](../../../../motion-elements/lib/foundations/typography/glyph-run-path.mjs) places caller-measured glyph cells along curves. It does not shape or wrap paragraphs.

The incremental candidate is only continuous styled-run wrapping with actual ink preflight, a nonbreaking-space contract, uniform size/baseline rhythm, and strike fragments. It is kept separate from existing APIs, not silently added to them. There is no new catalog registration or family count. Adoption still needs independent review and integration against the current branch.

## Layout lessons encoded by the contract

A style boundary changes appearance, not word identity. Build break opportunities from text before fitting styled fragments; otherwise `Hello` plus italic `World` incorrectly becomes two words.

Advances place adjacent runs; ink bounds reserve visible space. A negative italic bearing shifts the whole line, not just one word. Matching total line width alone cannot establish font resemblance or visual quality.

A decoration is also geometry. Its horizontal and vertical extent must fit, and trailing spaces must not extend the strike toward a replacement phrase.

A consumer should use `bottom` to position the next block. A fixed line count or a fixed support-text coordinate is not reusable when copy changes. The two examples vary title content under one size and width policy; actual row counts remain dependent on the supplied fonts.

## What remains deliberately out of scope

No source-page reconstruction, paper material, column compositor, font resolver, fallback substitution, animation, accessibility semantics, or general Unicode layout is added. The caller owns the wider composition and font resources. Unsupported characters reject instead of being presented as verified glyphs. A future extension should be justified by content and negative cases, not by a desire to broaden a component name.
