> Integration status: source-case technical card; batch retention/submission is authorized. The two new cross-content compositions are not individually owner-reviewed. See ../README.md for external resources and ../CANDIDATE-GUIDE.md for the narrower promoted wrapper contract.

# Retained design relationships

## Whole-frame intent

A title card is allowed to be quiet. The 1920×1080 outer black field and 2.39:1 inner image create a deliberate cinematic viewing distance. Removing the black surround would change the source, not “recover” omitted content. The top/bottom film metadata establish a frame-within-frame reading context without heavy borders.

## Reusable relationships

1. **Light and reading occupy opposing zones.** The warm focus lives in the upper right; the large cream title sits in the lower-left dark region. The headline can feel open and luminous without fighting the brightest area.
2. **Layer order is a material decision.** Low-frequency deep-brown base → ambient ellipse → lower terracotta haze → orange side light → yellow upper light. Scratches/grain/vignette modify the field; typography is placed above them, as the original z-index structure dictates.
3. **Texture is subordinate.** Three thin scratches and low-opacity grain add scale and age. They should not become decorative noise that competes with the title. Source-defined `.perfs` CSS was not instantiated in the HTML, so no perforations were invented.
4. **Type contrast supplies the emotional range.** Large EB Garamond italic establishes human editorial tone; tiny widely tracked IBM Plex Mono supplies restrained technical framing. There are no buttons, cards or arbitrary icons.
5. **Content variation does not require implementation duplication.** The fictional “After the Last / Train.” transfer changes text, warm-to-cool palette, light centers/spreads, grain seed and scratches through the same recipe. This demonstrates bounded transfer, not universal automatic art direction.

## Code evidence

- `film-frame.cjs`: whole-frame `draw`, field-only `drawField`, validation, measured typography and fixed-seed material.
- `fixtures.cjs`: two explicit datasets, not two copies of the renderer.
- `verification/tests.json`: geometry, failure modes, frozen inputs, deterministic outputs and composition isolation.
- `delivery/comparison.png` and `delivery/transfer.png`: visual proof from the same renderer.

## Deliberate limits

This is one complete reference study, plus one synthetic transfer fixture. It adds no public design family and does not move any existing portfolio scene. Black margins, fixed title geometry, two-line headline and specific type roles remain part of the bounded recipe.

The material is procedural, not real film footage. The title, coordinates, 35MM claim, reel count and timecode are fictional styling in the original. Grain is a documented Native approximation of the original SVG turbulence. No “pixel-perfect” claim, animation reconstruction, film-color science claim or actual movie production evidence is made.

## Review

Reference, Native frame, changed-content frame and full comparison have been opened. Independent reviewer found no P1/P2 blocker. P3 differences remain in grain frequency, glow edge rendering and text anti-aliasing. A reviewer-found caller-shadow inheritance issue was fixed at the whole-frame entry and covered with an output pixel-hash test. See `verification/independent-review.md`.
