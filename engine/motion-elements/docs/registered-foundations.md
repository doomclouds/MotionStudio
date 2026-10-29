# Seventeen-mechanism registration adaptation

This source tree registers **17 mechanisms** on the prior 43-foundation baseline, yielding **60 foundations + 7 separate recipes**. Foundation expansion pauses at 60. The two support extensions are excluded from the count. All entries remain experimental; technical or native-render evidence is not artistic acceptance.

## Entrypoints and runtime

- `motion-elements` (`lib/index.mjs`) retains the existing exports and adds sixteen mechanisms plus two **uncounted** supports: sprite-atlas playback and polyline-section extraction. These supports are not catalog rows and do not create extra foundations.
- `motion-elements/node` (`lib/node.mjs`) explicitly adds `compileArrivalField` and `sampleArrivalField`. The package subpath is guarded by a `node` condition and has no browser/default fallback.
- Both entrypoints re-export the original implementation functions. They do not copy validators or compiled-plan brands. Legacy `candidate-index.mjs` and `seven-foundations-candidate-index.mjs` remain compatibility aliases; their private labels document the historical fixtures, not the new catalog.

**The existing default index was already Node-dependent** through `lib/time.mjs` → sibling `motion-timeline-core/lib/timeline.mjs` → `node:crypto`. No native-browser compatibility is claimed for that entry. Arrival adds its own historical timeline/hash dependency only through the explicit Node entry. Existing browser consumers that directly import pure implementations are not redirected or changed. Static dependency checks cover the new non-arrival modules; they are not browser-rendering tests or bundler guarantees. Do not rely on tree shaking to erase an unconditional builtin import.

## Calling and ownership

Use a single canonical module instance for compile/sample pairs. A serialized plan or another copy of identical source does not carry WeakSet/WeakMap brands; persist raw specs and recompile. Number seconds, integer frames/ticks, and rational string times are separate contracts. No new coercion is introduced.

Runnable usage is in `examples/registered-foundations.mjs`; catalog examples use the listed entry/API and may supply `exampleArgs`. Grid transport requires the documented velocity-grid setup rather than substituting a different mechanism. The API manifest below identifies all public names without counting helpers as foundations.

Historical scoped technical/native bridge records and origin contracts remain under `docs/candidates` and `docs/private-candidates`. Their old private/count statements are historical, not current publication attestations. Source implementations and their boundaries are retained unchanged. Resource bounds do not promise realtime speed or bounded caller/provider memory. No new MP4, listening, normal-speed viewing, owner acceptance, or original-film mutation is represented by this registration adaptation.
