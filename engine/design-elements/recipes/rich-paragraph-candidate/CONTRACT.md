# Contract

## API and trust boundary

`createRichParagraphEngine({createCanvas,faces})` returns frozen `{layout,tile,draw}`. `faces` has exactly `text`, `em`, `code`; each is an own-data `{family,weight,italic?,variations?}` record. Family is a bounded safe name, weight integer 100–900, italic a Boolean, variations an explicit bounded axis string or omitted. Faces are snapshotted. Registration, glyph coverage, correct axes/style identity and licenses are the caller's responsibility. A core family name is not proof that the requested font exists. The optional adapter hash-checks both supplied fonts and rejects registration returning false.

The native factory must return a **new clean Canvas** for each call. It, native APIs, the font registry and local filesystem are trusted dependencies, not a sandbox for hostile callbacks, mutated modules, proxy traps or concurrent filesystem replacement. Use separate processes when other code may replace registered font families. Factory/context failures are not an input validation guarantee.

- `layout(model)` returns deeply frozen geometry. It may allocate a 1×1 measurement Canvas but never paints a caller or creates the final output surface.
- `tile(model)` completes full input/geometry preflight, then allocates and draws a new transparent Canvas. Wrapper/metadata are frozen; Canvas pixels are intentionally mutable and independently owned.
- `draw(ctx,model,x=0,y=0)` creates the validated tile, then makes exactly one `drawImage`. It does not save/restore or change caller styles, transform, clip, current path or font. Caller transform/clip/alpha/filter/composite/shadow **affect placement appearance**. The tile's wrapping does not inherit caller RTL, wordSpacing, letterSpacing or other text state. Coordinates are finite primitive numbers in ±1,000,000; no arbitrary scale parameter.

## Model

Required: `width`, `height`, `runs`. Optional: `fontSize`, `lineHeight`, `padding`, `maxLines`, `colors`. Unknown fields, accessors, custom record prototypes, sparse/augmented arrays and symbol keys reject. Non-enumerable own data values are accepted and retained. Only own array indices are read; input iteration methods are never used. The contract is ordinary data, not Proxies.

- Width integer 96–1600; height integer 48–1200 (at most 1.92M output pixels).
- Font size 8–72, default 20; finite line height fontSize–160, default 1.6×fontSize. Code font is 0.9×fontSize.
- Padding integer 4–64, default 16; minimum remaining inner width 32 / height 12.
- maxLines integer 1–64, default 32. Valid scalar domains do not guarantee content fits; geometry can still reject.
- 1–64 runs `{kind:'text'|'em'|'code',text:string}`. Non-code run ≤2000 characters; code ≤128; total ≤8192. Whole paragraph and each code run must contain a non-space character.
- Printable ASCII U+0020–U+007E only. Tabs/newlines, nonbreaking spaces, accents outside ASCII, combining marks, CJK, bidi, emoji and control characters reject. This intentionally is not Unicode line breaking/shaping.
- Colors are optional own-data `text`, `em`, `code`, `chip`, `chipBorder` fields with primitive six-digit hex strings. Undefined fields use defaults; boxed/coercible objects reject.

## Wrapping and ink semantics

Ordinary spaces collapse across run boundaries; leading/trailing spaces are removed. Spaces *inside code* remain part of the indivisible chip. Adjacent styled fragments without an intervening space form one indivisible word, including punctuation adjacent to code. Long words/chips reject; there is no ellipsis, hyphenation, shrinking, clipping, forced character break, or newline parsing. Font kerning is applied within each drawn fragment, not across style/run boundaries.

Measurement uses the exact same face, variation settings, font size and text segment as painting. Both advance and left/right ink side bearings determine whether a line fits. A line is shifted to keep overhanging glyphs within the slot; each code chip contains its own measured overhang. The full union of ink/chip bounds has a 2px guard inside padding. Baselines advance by lineHeight; adjacent line ink/chips must have ≥2px separation. Height/maxLines overflow or unsupported/nonfinite font metrics reject before any final output Canvas allocation or caller draw. The renderer never silently clips to hide overflow.

Input/metric validation errors leave caller pixels, path and state unchanged. A trusted native backend failure or externally changed font registry is outside that guarantee. Returned layout is native pixel geometry, not browser/CSS layout equivalence. Avoid huge volumes of tiles without releasing references; no sustained throughput or memory-budget guarantee is made.

## External adapter

`loadEnvironment` is a trusted local convenience adapter, not an untrusted JSON endpoint. It requires absolute external dependency/font paths, exact Canvas package version and two hash-locked masters. No automatic download, network execution, fallback font or binary embedding. `writeExclusive` accepts only safe PNG/JSON basenames and never replaces existing files. Symlink paths/ancestors, in-repository resources/output and dangling links reject. Filesystem checks are not atomic against malicious concurrent path changes.
