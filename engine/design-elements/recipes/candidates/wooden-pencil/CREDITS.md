# Source, rights and adaptation

The faceted wooden-pencil design and drawing sequence in `index.mjs` are adapted from **RyanBowie's `drawPencil` in Launch Race**, not presented as an original design. Upstream copyright: **Copyright (c) 2026 RyanBowie**, MIT. The complete upstream root license is retained verbatim in [LICENSE-RyanBowie](LICENSE-RyanBowie). Candidate interface, validation, synthetic consumers, tests and documentation additions use this repository's MIT notice in [LICENSE](LICENSE), Copyright (c) 2026 Palink. Retain both notices when redistributing this candidate.

Fixed upstream: `RyanBowie/ai-video-creation-guide@d40133983b8765f7ecf255448d38e99c65032c29`.

- [Original pencil renderer: examples/launch-race/engine.js, lines 206–222](https://github.com/RyanBowie/ai-video-creation-guide/blob/d40133983b8765f7ecf255448d38e99c65032c29/examples/launch-race/engine.js#L206-L222)
- [Original source palette, including red core](https://github.com/RyanBowie/ai-video-creation-guide/blob/d40133983b8765f7ecf255448d38e99c65032c29/examples/launch-race/engine.js#L8)
- [Original MIT license](https://github.com/RyanBowie/ai-video-creation-guide/blob/d40133983b8765f7ecf255448d38e99c65032c29/LICENSE)

`source-lock.json` records the fixed upstream source/notice byte identities, not a source-retrieval or production-evidence claim. Links are provenance, not bundled media or upstream endorsement.

## Preserved

The sharpened wood quadrilateral and grain strokes, dark graphite/red triangular core, three original blue/red lacquer faces, metal ferrule and its grooves, pink quadratic-curve eraser, hard-offset shadow polygon, base proportions, palette values and drawing order. At nominal length 560 the underlying source coordinates remain unchanged. Source `COL.red` is fixed here to its original `#b3261e` value.

## Adapted deliberately

- Global `CTX` becomes caller-supplied Canvas 2D `ctx`; `st.p` becomes required `x,y`. World-to-screen/camera mapping is not retained.
- Source `lerp(.62,.18,clamp((y-560)/300))` becomes explicit bounded `angle`, default `.62`; the implicit film-position angle rule is not a general pencil rule and is not imported.
- Added bounded uniform `length/560` scaling, applying consistently to geometry, stroke width, lift and shadow. Source length is fixed, source lift is `24 × lift`; default length preserves that unit choice.
- Source clamp becomes rejection of invalid values. `lead` is explicit blue/red, rather than treating every non-red input as blue. The optional shadow switch permits a caller to omit this cosmetic layer.
- Source hard-shadow alpha replaces the parent's alpha with `.16`; this candidate multiplies it by caller alpha. This fixes invisible-parent leakage and is an intentional pixel difference for non-unit parent alpha.
- Local stroke width/cap/join/dash are explicit instead of accidentally inheriting caller dash. Balanced try/finally restores state after a drawing exception. Current path and already-written pixels are not restored.
- Returned contact/visibleTip/shadowTip distinguish the unlifted paper anchor from the drawn pointed end. Immutable result and strict data validation are added. No mutable frame state is retained.

Not extracted: `pencilAt`, `ACTIONS`, its source `pole` schedule, interpolated entrance/exit actions, current-frame scratch paths, source text, data/illustrations, camera or any complete film scene. The synthetic route and triangle consumers are new examples, drawing their visible paths using the repository's existing polyline-sections helper. No media, fonts, audio, secrets or private production evidence is included. No registered family, portfolio work, physics/3D renderer, handwriting system or acceptance claim is added.

The limited source comparison must supply the original angle mapping, source length 560 and matching lift explicitly. Pixel agreement there does not establish whole-film equivalence or a universal pixel guarantee; alpha/dash changes, resizing and caller angle choices are deliberate departures.
