# Design guide — timing as explanation

## A distinct method, not another dashboard skin

The reusable method is one strict half-tick model driving digital state steps, bus partition polygons, uncertainty hatching, a shared tick grid and text summaries. It is useful for educational signal diagrams, editorial explanations of a handshake, staged workflow states, and static video inserts. It is not a hardware simulator. Do not infer latency in seconds from cell counts.

General interval-lane layout already exists in the host library; use that for arbitrary ranges. General motion timeline clock/trim/split logic also exists; do not fork it here. These tiles add discrete two-level traces and symbolic contiguous buses, not a new universal time engine. Classification remains one limited source candidate, zero formal family additions.

## Hierarchy and data honesty

1. Use a clear title outside the tile to state what is being explained.
2. Align every row to one model's half-ticks. Keep names left of the signal area and grid quieter than signals.
3. A high state is a geometric level, not a green success badge. The fixed black/blue/gray encoding is readable on a light host; host colors can vary with purpose, but the current tile is not a dark-theme solution.
4. Hatch null bus segments only. A blank-space symbol is intentionally different from unknown.
5. Derive every repeated label, count and detail lane from the compiled snapshot. Do not independently type a figure caption that can drift from the visual data.
6. Bus labels consume real ink. Increase allowed width or use shorter symbols when preflight rejects; do not clip or silently drop information.

## Two different complete compositions

`HANDOFF` uses five cycles and four lanes. The 1440×800 warm-paper composition prioritizes a single broad overview. Q4 occupies half-ticks2..6, and the caption derives the five-cycle/ten-half-tick/four-lane count.

`CAPTURE` uses eight cycles, five lanes and three known symbols M1/N8/P3. The 1200×1280 cool-paper composition places a complete overview above two independently composed details. The symbol detail and hold detail are selected from the same model; six high hold cells are calculated, not hand-authored. Detail widths deliberately have a different pixel scale: they share logical coordinates, not screen x positions. Add a ruler if viewers need visual scale comparison across panels.

Both are fixed-size compositions with readable margins and restrained accent colors. The examples establish different content and layout; they do not establish arbitrary headline fitting. Tests inspect every current fixed text draw and expanded component margins.

## Motion-ready, not motion-implemented

A future video host may reveal a pre-rendered lane or crop a diagram after verifying its own compositing semantics. Keep the model snapshot as the narrative source. This package has no time argument, easing, animation export, video rendering or playback test. A reveal should not imply that this synthetic signal was recorded. Validate clip/alpha/transform behavior in the actual renderer, especially Native fractional clip/save antialiasing behavior described in the contract.
