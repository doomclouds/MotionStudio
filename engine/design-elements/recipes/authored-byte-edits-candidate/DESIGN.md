# Design guide: explain coordinate movement, not software chrome

## The useful idea

A patch explanation becomes misleading when a number from the original buffer is presented as an offset in the resulting buffer. Show both coordinate systems, and put the cumulative earlier delta beside the selected operation. Highlight the exact same operation in the bytes, range table and summary. Selection is explicit authored data, not a heuristic difference detector.

## A reusable shot sequence

1. Establish the **base** byte count and **target** byte count.
2. Select one operation. Show its original half-open interval and resulting interval.
3. Call out `baseStart -> targetStart`; reveal the earlier cumulative delta, not just this edit's size.
4. Place the twin byte view under the callout, then the operation table. Use an anchor, not a fake span, when one side has zero length.
5. If the edit lies outside the displayed rows, expose clamping/partial metadata in narration. Do not imply the bridge shows the whole file.

The recipe is a static snapshot suitable for a larger video composition. A timeline renderer may generate independent snapshots, but this package does not interpolate, play, decode or execute anything.

## Two actual new combinations

- **Packet revision**: 512 synthetic bytes; delete16 before an inserted24-byte field. Base offset160 maps to target144. Other operations produce final524 bytes/net+12. Light evidence panels on dark blue; the inserted side has a real span while the base side is an empty anchor.
- **Archive repair**:640 synthetic bytes with insert/replace/delete/insert. The selected base[336,360) is deleted; target[332,332) is empty after prior delta−4. Final620 bytes/net−20. Dark evidence panels on a warm neutral sheet; the selected left span collapses to the right anchor.

These are not the private source case's fixtures or application screenshot. Both invoke the exact same model and three component methods. Their byte contents are invented phrases, not actual protocol or archive formats.

## Composition and readability

Use a plain monospace to make two-digit cells rhythmically comparable. Keep the widest legal bytes visible, not a sample of narrow glyphs. Offset columns are outermost; the middle gap is reserved for the bridge. The fixed16-byte rows are a pedagogical unit, not arbitrary column-count flexibility. Keep the table adjacent so offset mapping can be verified without deciphering the bridge.

Use a selected fill with strong text contrast; the two themes are presets, not a full design system. Keep direction explicit in labels rather than relying on color. Sparse data or out-of-range rows remain blank. Do not add decorative scrolling, tabs, traffic lights or filenames: those would turn an evidence view back into a fake application.

## Relationship to existing recipes

Against the pinned MotionStudio baseline in candidate-manifest.json: spatial-character-snapshot already covers character cells/marks/cursor, indexed-pixel covers layer palettes, and byte-field-diagnostic covers scalar samples/histograms. None supplies author-edit base→target coordinate/provenance mapping. That is the distinct increment here. The paired grid, operation table and summary are one recipe, **not three new families**. Font gates, IO validation and save/restore are support engineering, not design inventions.
