# Submit action → status: existing-mechanism usage

This is a caller-owned composition example, **not a new recipe, foundation, catalog entry, live UI, or general aesthetic recommendation**. The existing staged-layout handoff already supports one stable ID, authored waypoints, translation and size changes. Adding a second runtime interface would duplicate that contract.

## Reference, observation, and assumptions

The [Creator Mode announcement](https://x.com/DeepSeekHarness/status/2117256196227019194/video/1) provides a useful visual relationship around 18.4–20.6 seconds: a submit control changes to a busy icon, the surrounding composer disappears, the blue focal container moves/shrinks, then widens into an analysis-status line. Adjacent original frames were inspected for this interval; this is not a normal-speed viewing or audio/synchronization claim. The reference's engineering, exact easing, source layers and state model are unknown.

The useful relation is continuity of the action's focal identity across an operation, not its brand color or exact timing. The example explicitly assumes a single rectangular focus with rounded corners, a single coordinate plane, authored status timing, and a label that fits its destination. The example does not claim to reconstruct the reference animation. Local synthetic times and sizes are not measurements of the film.

## Existing interfaces and caller ownership

- `compileStagedLayoutHandoff` / `sampleStagedLayoutHandoff` supply all container geometry and stable identity. Three snapshots represent the action position, a compact intermediate position, and the wide status position. Existing smoothstep interpolation and exact stage selection remain authoritative.
- Existing `sampleMotion` with `motion.opacity` handles shell disappearance and icon/label crossfade. The example keeps these content tracks independent of geometry.
- Rounded-corner radius is derived as half the shorter side. No polygon-morph, new shape topology solver or spring is required.
- The caller supplies submit/busy/label semantics, typography, measured fit, palette and UI shell. The synthetic shell is a neutral rectangle, not a recovered application.
- Reduced motion uses the existing global-final-geometry policy but does not fast-forward the business/status clock. Content still changes at its authored times. This is not an accessibility acceptance claim; the user experience needs its own review.

## Example input and output

See [executable caller example](../examples/action-status-usage.mjs). Its two fixtures use different content, viewport sizes, positions, colors and timing. They are examples of parameter binding, not a validated general-purpose public API.

Input fields: viewport dimensions; three `[x,y,width,height]` boxes; three stage boundary times; shell-fade and label-fade ranges; busy-icon time; explicit label and color. Container snapshots use the stable ID `action`. The small example helper quantizes decimal seconds to integer milliseconds; production callers should pass their exact rational timeline directly to the underlying APIs rather than silently rounding a frame clock.

Output: the existing container item plus caller-derived radius, shell opacity, label opacity, icon opacity and icon/label content. Only the existing staged API writes geometry. Only the opacity tracks write opacity. There is no accumulated playback state, DOM, network request or real export/sync operation.

The drawing function uses caller-available Canvas and a generic sans-serif font, measures its actual label and rejects overflow. It installs no font and bundles no font binary. Typeface identity and appearance depend on the caller's environment. A production composition must lock an appropriately licensed font and validate its actual render.

## Verification and limits

Run from the repository root:

```sh
node --test engine/motion-elements/test/action-status-usage.test.mjs engine/motion-elements/lib/recipes/staged-layout-handoff/lib/recipes/staged-layout-handoff/test/staged-layout-handoff.test.mjs
```

The usage test checks both synthetic configurations over 121 samples each, exact delegation to the staged API, ID preservation, continuous stage-boundary geometry, bounded opacity/radius, reverse-seek equality, and reduced-motion geometry without premature status changes. The usage renderer also draws both sizes at all 121 samples, rejects an overflowing label, and checks selected reverse-seek PNG equality. Existing staged tests exercise validators and Native pixel equivalence. These tests do not validate arbitrary example-helper input, a real UI state machine, brand design, full film rhythm or actual listening. The helper is deliberately an example, not another supported runtime validator.

For visual inspection, draw both examples at before, compact-waypoint, widening, and final-hold times. Check that a small busy icon remains visible while the shell leaves; content must not appear before its semantic event; the label must fit at every time it is visible. Full destination readability, not exact reference mimicry, is the aim. If a label begins fading while the container is too narrow, change the caller timing or destination size rather than bypassing the fit check.

## Rights and status

This original synthetic composition uses existing MotionStudio code under [its MIT license](../LICENSE). No reference video frame, logo, application UI, font binary, audio, source implementation or extracted asset is included. The source post is attribution, not a redistribution license; reference-media rights remain unconfirmed. No registered mechanism count, portfolio acceptance or artistic status changes. Technical tests, visual inspection, normal-speed playback, audio review and user approval remain separate.
