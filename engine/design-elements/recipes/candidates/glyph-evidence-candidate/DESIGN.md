# Design guidance: show the evidence, not a mock control panel

One immutable font/text instance should supply the visible word, table, ruler and axis readings. This is a bounded educational recipe, not another slider/table foundation.

1. **Word first, then evidence.** Large specimens give the audience a shape to relate to. Keep metric labels small but readable, never decorate with unrelated numbers.
2. **Name units.** Raw `adv u` values belong to a font's units-per-em. Convert to pixels with the actual size; do not compare two fonts' raw units as equal scales.
3. **Advance is not ink width.** Rulers use cumulative hmtx advances, not the rightmost pixel. Spaces/overhangs prove the distinction.
4. **Fair comparison changes font, not content.** The dark1440×1200 composition compares `AVATAR 04` at88px: Fraunces Display and Inter Heavy. Two different advances and SOFT support come from their respective models.
5. **Reuse must vary content and layout.** The light1600×1220 composition uses two horizontal bands: `minimum i.` in Fraunces Soft, `ill. 2026` in Inter Text at108px. Narrow glyphs, punctuation and a space make a different lesson, not merely a recolor.
6. **Honest slicing.** Both examples disclose a first-five-character table; all characters remain in the specimen/advance sum. No cropped table is called the whole text.
7. **Unsupported is not zero.** Inter has no SOFT. Show n/a and no knob, not a copied serif value. These are fixed instance readings, not working controls.
8. **No independent stretching/tracking.** It would invalidate measurements unless the underlying model and labels were updated.

## Existing foundation boundary

Existing `glyph-run-path` lays caller-provided glyph/advance cells onto a cubic path; it does not derive font cmap/hmtx/outlines. These measurements could supply it after explicit unit conversion, but that integration is not included and would not add shaping. Spatial-character snapshots are equal-cell address grids; this is proportional font evidence. Parameter controls already cover generic slider geometry. **0 new formal families/registrations.**

## Practical limits

Transparent tiles need a deliberate ink color for the host. Place inherits context appearance; a caller wanting normal opacity/source-over should explicitly save/set/restore its own context. Internal outline preflight is not full accessible web UI certification. Examples are static rasters, with no responsive DOM, keyboard interactions or WCAG claim.

A future lesson could reveal glyphs and highlight cumulative advances using an existing timeline. Continuous axes, outline morphing and matching topology are not provided or validated. Do not call fixed axis panels live font interpolation.
