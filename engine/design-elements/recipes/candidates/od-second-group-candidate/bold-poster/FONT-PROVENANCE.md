# Exact bundled source font snapshots
Use source/fonts WOFF2 files from the same fixed OpenDesign template, not newly downloaded substitutes. assets/font-lock.json binds original and derived SHA256.
- Shrikhand Latin f74512e776f666632.woff2 → Display.ttf.
- Libre Baskerville Italic Latin f49632e776f666632.woff2 → Italic.ttf.
- Space Grotesk Latin f71552e776f666632.woff2 → Sans500.ttf / Sans700.ttf at wght500/700.
Conversion used fontTools TTFont(recalcTimestamp=False), flavor=None, and instantiateVariableFont for Space Grotesk; all original glyph names/metrics preserved. Source font subsets are limited: this is not a claim of arbitrary-language coverage. All scene characters visually checked.
Source fonts.css maps one normal Latin-ext face to the italic file; our scene only uses the explicitly italic Latin face and is unaffected. We do not silently claim the whole stylesheet has been corrected.
Copies of the matching OFL notices are preserved separately from code licensing.
