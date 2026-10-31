# Feature Stack contract

## Inputs and geometry

`layoutFeatureStack(props,env)` measures the complete list and returns fresh data.
`drawFeatureStack(ctx,props,env)` performs the same preflight, stages a transparent
layer, composites it once and returns that geometry. Neither accepts a precomputed
caller-mutated layout. Only environments returned by `loadFeatureStackEnvironment`
are accepted. They bind external exact fonts and Canvas 0.1.100.

| Input | Supported domain |
|---|---|
| x / y | Finite numbers, -10000..10000; defaults 0 |
| width | 240..1600 logical pixels, default 940 |
| columns | Exactly 1 or 2; default 1 |
| gap | 0..100, default 18; both between columns and rows |
| items | Dense array of 1..8 plain data objects |
| item.icon | `check`, `layers`, `arrow`, `spark` — code-native geometric marks |
| item.title | Nonblank printable ASCII U+0020..U+007E, maximum 80 characters, 1..2 measured lines |
| item.description | Same character domain, maximum 180 characters, 1..3 measured lines |
| palette | Only title, description, iconBackground, icon; each #RRGGBB or #RRGGBBAA |
| env.pixelRatio | Set by loader, finite 1..4, default 2 |

Unknown keys, symbol keys, accessor properties, sparse arrays and extra array keys
(including non-enumerable pseudo-indices such as `01`) reject. Plain objects have
Object.prototype; null-prototype/custom-prototype objects reject. Inputs are trusted
plain data, not hostile Proxy objects. No getter is deliberately executed.

Text is trimmed and repeated ASCII spaces collapse to one during **word-boundary**
wrapping. No hyphenation, Unicode shaping or character splitting is supplied; an
unbroken word wider than its text cell rejects. Explicit controls/newlines, bidi
controls, CJK, emoji and unsupported characters reject rather than invoke fallback.
The original study's wider multilingual/character-wrap support is deliberately not
promised by this extracted ASCII candidate.

Each column width is `(width-gap*(columns-1))/columns`; its text width is column
width minus 60 and must be at least 160. Icon tiles are 42 square / radius 12, marks
22 square at inset 10; text begins 60 from the column edge. Titles: 22px weight 600,
33px line pitch, baseline 25.4. Descriptions: 15px weight 500, pitch 23.25, begin
4px after the title line boxes, baseline +18.3. The ink checks use ascent/descent
budgets 25.4/7.6 and 18.3/4.95, right ink within cell and left overhang at most 2px
(the 60px inset safely contains it). No hidden font-size reduction or ellipsis.

Rows take the tallest peer; the next row begins after that height plus gap.
An odd last row is left-aligned. Total measured height must not exceed 1600.
Returned geometry is not frozen but modifying it does not affect later calls.

## Composition and state

- All data validation, text measurements and native offscreen painting precede the
  sole caller composite. Invalid model data cannot partially paint the caller.
- The caller's current path, font, direction, spacing, transform and clip remain
  unchanged. Internal contexts explicitly normalize text direction/spacing/state.
- The final image inherits caller transform, clip, alpha, blend, shadow, filter and
  image-smoothing state. Those can deliberately crop, tint, blur or hide the result;
  the component does not silently neutralize them. Use your own save/restore and
  neutral state if that is the intended composition.
- The component does not own caller canvas size, final overlap, contrast, read
  order or composited bounds. Transparent colors are legal, not automatically
  accessible. Native/compositing failure is not a transaction rollback guarantee.
- Pixel ratio 4 with the maximum bounds can allocate about 41 million RGBA pixels
  before caller buffers; caller owns memory/concurrency budgets. Use ratio 1 or 2
  for routine compositions. Fonts and the module remain trusted process state.
- `ctx` is a trusted native Canvas 2D context. No browser DOM/canvas adapter contract
  or arbitrary rendering backend compatibility is claimed.

## Filesystem/resource boundary

No font/icon/image is in the candidate. `font-lock.json` describes one public OFL
input and two renamed derived instances. The preparer checks all hashes before
creating a new directory. Render/runtime paths must be absolute, external and
without symlink ancestors; font files must be non-symlink regular files. Font bytes
are hashed before buffer registration, and falsy registration fails closed. Module
version checking is not a cryptographic attestation of arbitrary caller module
code; use the pinned npm lock and a trusted runtime installation. A failed native
registration may leave an earlier alias in the process registry; no environment
is returned, and callers requiring registry isolation should discard that process.

All Native tests are static scope only. This is one restricted local candidate,
not a registered family, product feature, automatic design generator or owner-
approved new artwork.
