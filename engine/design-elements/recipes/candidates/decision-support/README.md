# Decision support · static candidate

A small, bounded composition recipe: an authored recommendation is always shown with its counter-explanation, next measurement and reversible step. It does not judge whether the recommendation is correct. Inspired by the visible hero of OpenDesign's `research-decision-room` at commit `12d970eacc8971150e3c76470d2a9afe16dc2ed1`.

## Use

`draw(ctx, { bounds, theme, data })` from `decision-support.mjs` returns measured rectangles, line content and reading order. `layout` measures without painting. The host supplies a Canvas 2D context, loaded body font, background and these colors: `ink`, `muted`, `line`, `inverse`.

`data` requires nonempty authored `recommendation`, `counter`, `measure`, `reversible` text. `label` defaults to “Recommended move”. Explicit line breaks are preserved; ordinary space-separated text wraps at word boundaries. It is not a general CJK typesetter. Width is at least 320 and height at least 480 pixels; the recommendation is capped at five lines and each support note at three. Content that cannot fit rejects before painting. It never truncates a counterargument to make a claim look stronger.

This narrow recipe keeps a high-contrast recommendation above a lower group of limitations. It is suitable beside a problem statement and its evidence, not as a general card renderer or a substitute for a research ledger. The two-column split is already supplied by `design.color-sections.v1`; do not create another layout family for it. Larger headings, source statistics and page-level navigation belong to the host composition.

## Learning and limits

- Preserve the relation: claim → supporting evidence → competing explanation → measurement → reversible action.
- A convincing large heading without source limits is the counterexample; a black card is not itself a decision method.
- `examples.mjs` contains two synthetic content variants. They are not real research findings.
- Run `node --test test.mjs` for deterministic unit checks. Its text context is a test double, not a browser or visual renderer.
- The originating study also executed the same `draw` export with Native Canvas, two synthetic variants, and the static reference recreation. Those private images/measurements are not distributed here and do not certify user acceptance, responsiveness, interaction, accessibility, or universal font recovery.

Status: isolated source candidate; **0 new registered families, 0 promoted recipes, 0 accepted portfolio works**. No claim of exact-font or pixel identity to the source screenshot.

## Source and rights

Reference: [OpenDesign source HTML](https://github.com/nexu-io/open-design/blob/12d970eacc8971150e3c76470d2a9afe16dc2ed1/skills/research-decision-room/example.html) and [visible screenshot](https://github.com/nexu-io/open-design/blob/12d970eacc8971150e3c76470d2a9afe16dc2ed1/docs/screenshots/skills/research-decision-room.png). See `NOTICE` and Apache-2.0 `LICENSE` for this source-derived recipe. No screenshot, font binary, personal research, or generated report is included. Fonts remain caller supplied under their own licenses.
