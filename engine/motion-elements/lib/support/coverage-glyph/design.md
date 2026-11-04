# Design: choose tokens, do not promise glyph coverage

Use when the visual language specifically calls for character material and the host already has a mask and luminance. Keep mask formation, grid sampling, font choice, measured cell advance and drawing outside the selector. The word coverage names the caller's geometric mask gate; it is not a measurement of the selected character's actual black area.

## Decisions the caller owns

- Start from the subject's silhouette and minimum legible feature width. Coarse grids can erase thin features; higher density increases draw calls and native font cache pressure.
- Select an ordered ramp for the actual font/size. Unicode scalar validity says nothing about glyph availability, ink area or monotone visual density. A monospace fallback can silently change metrics; register and verify the chosen font externally.
- Use `minimumIndex` deliberately when sparse symbols disappear. Raising it flattens low-end contrast; a short ramp plus a high floor can intentionally become constant. A space is a legitimate low bin, so a masked dark region can become blank.
- Near bin/coverage boundaries, small input changes can pop characters. This function has no temporal identity, hysteresis, optical flow, rotation, variable size or persistence. Do not infer smooth reconstruction from one frame.
- The host should cap grid cells, reuse glyph atlases or quantize font/rotation variants, and validate complete encoded duration after chunking. A bounded scalar function does not solve renderer memory exhaustion.

## What the two consumers establish

A shaded annulus tests character selection across a bounded silhouette and a light gradient; the thermal field tests a short, deliberately three-level alphabet on a different scalar topology. Both call the exact module, not a copied formula. The private static comparison showed that the old helper lost all thermal variation, while this revision selected all three symbols. Existing halftone produced continuous dot-area variation instead, demonstrating different output semantics rather than superiority. No aesthetic or production acceptance follows.

Counterexamples: accurate tone reproduction without font ink calibration; script shaping or emoji sequences; persistent character flow; source-image reconstruction; an arbitrary mask with sub-cell limbs; smooth temporal changes across bin boundaries. Prefer `halftoneScreen` for geometric area coverage, `glyph-run-path` for path placement, and ordinary inline mapping if the reusable input contract adds no value.

A future material mechanism would need font-specific measured ink/advance tables, sampled coverage rules, explicit foreground/background polarity, stable identity and temporal validation. That is a separate task, not a claim made by this small candidate.
