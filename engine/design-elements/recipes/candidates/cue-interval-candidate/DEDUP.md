# Scope relative to existing MotionStudio assets

Read-only official baseline: `doomclouds/MotionStudio` dev `16bc9bae02ad2904bff0e21274f3634657638d49` (2026-11-01), tree `70ad3e4ef620f2059a47182888fd8e7aeea9a683`. Existing catalog has14 formal families; this package registers **zero**.

`recipes/timing-diagram-candidate` represents unitless half-tick digital/bus levels. This candidate shares the generic notion of horizontal intervals but adds a bounded **millisecond text model**, half-open active/gap semantics, independent editing selection, exact duration/timecode/CPS, partial view clipping and a standalone transparent caption. It does not replace or duplicate PULSE's digital signal meanings. Existing typography/layout assets should remain general; this is one restricted recipe rather than a new time, table, card or subtitle family.

The source-only whitelist is designed for a later `recipes/cue-interval-candidate/` projection. This standalone package check is **not** the official repository full-index/full-history policy gate. Final integration must re-read remote dev, reconcile parallel changes, apply the exact whitelist, preserve required notices, run project policy/regressions, and receive independent review before any push. No original case portfolio, reference image, font binary or private audit migrates.
