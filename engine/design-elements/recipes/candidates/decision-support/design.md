# Keep a recommendation beside its limits

A small static source candidate, not a decision engine or an accepted research result. The [README](README.md) specifies inputs, usage, rights and verification boundaries; [decision-support.mjs](decision-support.mjs) is the callable implementation.

## Selection and reading order

Use this recipe when the author can supply a recommendation, a competing explanation, a next measurement and a reversible step. It keeps those four authored statements visible together. A convincing headline without its limits is the counterexample: the dark card alone is not a decision method, and the renderer cannot establish causality or the truth of the supplied text.

The high-contrast recommendation sits at the top. Three separated notes occupy the lower part of the bounds, in the fixed order “What could be wrong”, “Measure next”, “Reversible step”. This makes the supporting material a required continuation rather than optional small print. Evidence and a problem statement belong in the host composition; this API has no evidence/source field and cannot verify their connection to the claim.

## Geometry serves that relationship

The implementation wraps the recommendation at 18px with 22px horizontal inset and the notes at 14px across the full bounds. Recommendation height follows its line count; the notes are stacked from a bottom-aligned starting position. It rejects overlap instead of covering, truncating or silently shrinking the qualifications. A minimum-sized rectangle is not a promise that every valid-length string fits: actual font metrics and line budgets still decide.

The caller supplies the font and contrast roles. Preserve readable inverse text on the recommendation, readable muted notes and visible separators; the implementation does not measure contrast. It normalizes local text alignment, while caller alpha still affects output. Review the real font and surrounding background, not just the returned rectangles.

## What to compose rather than duplicate

Use existing color sections for a two-column page split. Place source statistics, larger headings, navigation and an evidence ledger in the host. This recipe is neither a general card system nor a substitute for that ledger. Word wrapping supports authored space-separated text and explicit line breaks, not general CJK typesetting or responsive browser layout.

## Examples and what they prove

[examples.mjs](examples.mjs) contains two synthetic scenarios: onboarding guidance versus permission confusion, and batch instrument review versus hardware warm-up. Both retain a competing explanation and a reversible pilot rather than turning a new topic into a new renderer. These are authored illustrations, not actual research findings.

[test.mjs](test.mjs) passes both examples through the same draw export with a deterministic text-measurement double. It checks retained notes/order, missing content, overflow, explicit breaks, failure before painting and host-state behavior. It does not establish real glyph fit, visual quality, accessibility, browser behavior or user acceptance. Native rendering with a licensed caller font is a separate check; historical private study images are not distributed evidence for a new composition.
