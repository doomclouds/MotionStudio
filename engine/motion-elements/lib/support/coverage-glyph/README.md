# Coverage-gated character selector

<!-- asset-self-description: support.coverage-glyph-candidate -->

Unregistered direct-import support candidate. This is a small character-material adapter, not a catalog foundation, artwork, glyph renderer, or ASCII reconstruction engine. [Design](design.md), [implementation](index.mjs), [two executable consumers](examples/contract.mjs), and [focused tests](test/coverage-glyph.test.mjs) are colocated. Root MIT covers this original code. No source footage, font, brand, audio, or rendered output is distributed.

## Why keep this narrow function

A caller already owns a coverage/luminance grid and wants discrete character tokens rather than circle geometry. `halftoneScreen` maps coverage to clipped circle area; `glyph-run-path` positions explicit measured glyph identities; `glyph-evidence` inspects prepared font outlines. None chooses character tokens from scalar bins. Use those assets for their respective tasks rather than expanding this function to duplicate them. A one-off fixed ramp can remain inline; this candidate is useful when several consumers need the same explicit validation and selection rule.

## Contract

```js
import {coverageGlyph} from './index.mjs';
const token = coverageGlyph({coverage:.8, luminance:.6, ramp:' .#'}); // '.'
if (token !== null) drawCharacter(token); // caller supplies drawing and layout
```

Input is a same-realm plain record with own `coverage` and `luminance` data fields, both finite numbers in [0,1]. Optional fields: `shade=1`, `threshold=.23`, `ramp=' .,:;-/+*%$0MW#'`, `minimumIndex=0`. Shade and threshold are finite [0,1]. Unknown string/symbol fields and accessors reject without invoking the accessor. Null-prototype/cross-realm records reject; hostile proxies or modified language builtins are not a security boundary.

Ramp is an ordered string of 2..64 Unicode scalar values (at most128 UTF-16 code units). Control characters, isolated surrogates, Unicode marks, formatting characters and separators other than ordinary ASCII space reject. Each scalar is a token, **not a shaped glyph or a grapheme cluster**. No font coverage, equal width, density ordering, emoji presentation, ligature or script support is implied. Adjacent scalars are alternatives, not a multi-scalar glyph. Caller must supply a verified font and meaningful order. Repeated scalars are permitted as explicit repeated bins.

`minimumIndex` is an integer from0 through rampLength−1. Coverage below threshold returns `null`; equality selects a token, including coverage=0 when threshold=0. Otherwise select index `max(minimumIndex, min(N−1, floor(luminance × shade × N)))`. Bins have equal scalar width1/N; the final endpoint is clamped. A returned space is distinct from `null`. Coverage is only a gate, not average ink density or an opacity multiplier. Validation occurs even when coverage is below threshold.

Returns one immutable string token or null, without writes, caches, I/O or mutable output. For valid input each call validates at most64 tokens: O(N) time/space with N≤64. Invalid records with many keys still require enumerating those keys before rejection; this is not a constant-work admission guard for hostile objects. It does not bound the consumer's frame count, grid size, text drawing caches or encoder memory.

## Compatibility and evidence

This is an explicit revision of a private consumed helper, not a drop-in promise: the old helper imposed a hidden floor of3 and used UTF-16 indexing with N−1 bins. Two/three-token ramps became constant and supplementary Unicode split. This candidate defaults the floor to0, uses scalar tokens and equal bins. `minimumIndex:3` requests a floor but does **not** restore the old quantizer. Existing productions are unchanged; regenerated results need fresh review.

The original helper was statically traced to the independently written production renderer, with separate production notes recording use. This does not prove every scene called it, establish runtime coverage, or validate this revised code in that film. Two new synthetic contents actually call the revised selector: a shaded ring and a three-level thermal map. Their executable example verifies30×24 grids and distinct content; the thermal map contains space, dot and hash rather than a constant hash. External Native Canvas comparison also rendered both against the original selector and actual `halftoneScreen`; that is a limited static experiment, not real-world telemetry, real production migration, font portability, visual acceptance, continuous motion, or listening review.

## Run

From this directory with Node24, no dependencies or external assets:

```sh
node examples/contract.mjs
node --test test/coverage-glyph.test.mjs
```

The example prints original text grids to stdout and writes no files. These are real API consumers, but remain synthetic technical examples. Main API barrel/catalog counts are unchanged. Any future promotion needs demonstrated production reuse and font/material/temporal evidence beyond these tests.
