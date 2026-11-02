# What is worth reusing

## 1. A truthful bounded linear chart

The useful addition is **a y-axis whose geometry has one declared numerical meaning**, not the newspaper imitation or a red line style. Existing `design.semantic-data.v1` intentionally uses y as composition and circle area as magnitude; it is not a substitute for an explicit axis. `value-grid` uses equal cells, and `metric-board` displays individual numbers. This wrapper therefore stays a chart candidate, not an alias for those families; none of them is falsely claimed as a runtime import.

`drawLinearChart(ctx, props, theme, env)` consumes the source transfer chart structure with:
- `mode='linear-values'`, `dataKind='synthetic'`, explicit synthetic disclosure, domain`[0,positiveMax]`.
-2–12 equally spaced category points;2–6 strictly increasing ticks including both domain endpoints. Not an irregular-time/log/forecast/confidence-interval engine.
- Bounds integer width660..2200 with exact1100:460 ratio; finite x/y with magnitude≤8192. Returned point geometry remains in the documented1100×460 local chart coordinates; bounds are returned separately.
-0–12 annotations,0–2 callout lines. Authored single-line ASCII labels only in the narrowed wrapper; point labels≤min(95, adjacent slot−8)basepx, tick labels≤35basepx gutter, annotations/callouts≤220basepx. Actual glyph ink must fit the chart. No shrinking/truncation/automatic rerouting.
- Numerical mapping is checked; user-authored tick/annotation label text is **not parsed as evidence**. Labels can still contradict values, and annotations can overlap one another. Keep that semantic/visual review with the author.
- `env` requires the actual registered Chart font glyph Set plus`canvasApi`. Font registration is an external adapter responsibility. Case-level mixed-CJK support is not promoted to arbitrary-language support.

The source `reference-geometry` mode is deliberately rejected here. It remains in the preserved full-case module solely for faithful reproduction, with its axis mismatch declaration. Do not launder that source illustration into a numeric chart.

## 2. A reproducible static atmosphere

`drawLightField(ctx, props, {canvasApi})` uses the existing field palette/focus/scratches/seed contract but requires integer bounds≥120×80 and≤4096×2160, finite x/y magnitude≤8192. It draws procedural gradients, authored fine scratches and a fixed-seed noise tile. Field contents are clipped to the declared rectangle; the result is not CSS/SVG pixel identity, real35mm grain, film damage or a moving leak.

Useful for a short title's quiet/bright separation: keep the reading zone dark, use one dominant glow, and tune opacity before adding more marks. The two synthetic compositions use cool green and amber fields as title bands. Extreme shallow/wide fields stretch the glow; do not assume every accepted aspect ratio is aesthetically suitable. Existing `material-surfaces` handles opaque/paper/glass content layers; it does not provide this exact seeded atmosphere. Related method, not an actual dependency or a new family count.

## Common compositing contract

Both wrappers render into their own bounded fresh-context tile, fully finish validation/drawing before calling caller`drawImage`, and never mutate props. This keeps caller path and typography untouched and prevents inherited negative word spacing from changing internal measurements. **Final compositing intentionally inherits caller transform, clip, alpha, blend, shadow and filter**; a caller shadow/filter can extend outside component bounds. Do not claim output independent of all caller paint settings. Start from identity/default compositing for canonical PNG comparisons.

Source-case modules are preserved snapshots with their original narrower style/path assumptions; use these wrappers for cross-content embedding. Full scenes are adapters, not generic layout engines. The modules don't read files, fonts, network, time, or reference images.

## 3. What not to promote

Bold Signal's distinctive full-frame emptiness, edge-flush orange card and black type are a **case composition**, not another card primitive. Retain`drawCard`and the detailed design contract, but do not add a “signal-card”public family beside typographic-focus/material-surfaces. A future genuine brief should first test those existing modules; if they suffice, use them rather than proliferating near-duplicates.

## Evidence and next decision

Two complete1600×1080 synthetic compositions call both new wrappers with different copy, domains, values, colors, glow geometry and seeds. These are two composition tests, not two accepted reference works or real research datasets. The batch's positive owner feedback authorizes selective retention/submission; the new composition aesthetics and generalization remain separately reviewable. Formal promotion requires evidence from real new briefs and an explicit deduplication decision. No animation/interaction/audio capability is implied.
