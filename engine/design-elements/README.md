# Static print-poster study

Stable ID: `design.print-poster.v1`. [Design intent and counterexamples](../../skills/motion-film-director/research/design-knowledge/cases/ui-003-print-poster.md).

Original code: `print-poster.mjs`; exports `drawPaper`, `drawOverprint`, `drawPoster`, `recipes`. Paper has local center rotation, 3px border and hard offset shadow; overprint rejects measured overflow rather than shrinking typography. Both save/restore context. Finite geometry and bounded rotation/offset are enforced; fonts/colors are caller-owned Canvas styles. No images, bundled fonts, source titles, runtime clock, network, or source-page geometry.

Use `drawPoster(ctx, recipes.listening)` / `recipes.workshop` on a 1000×600 Canvas. These are deliberately synthetic fixed-layout composition fixtures, not replicas or user-approved artworks. Same implementation changes content, color roles and subject geometry. The workshop changes the record to overlapping paper sheets because subject meaning matters. Titles must fit the measured region; this is not responsive or multilingual typography automation. Platform fallback fonts may differ between hosts.

Run `node engine/design-elements/test-print-poster.mjs` after installing the existing Native core dependencies; optionally set `MOTION_ENGINE_ROOT` to that installed engine. Tests cover deterministic rendering, different recipe pixels and rejected invalid values, not beauty, accessibility or video transfer. Rendered files remain outside Git.
