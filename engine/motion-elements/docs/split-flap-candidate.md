# Split-flap 2D candidate

Direct import from `lib/support/split-flap.mjs`. Unregistered, no catalog/barrel/count change; not a complete number widget, accepted recipe, 3D renderer or original-reference recreation.

## Deduplication and scope

The library already has [geometry.hinged-panel](../lib/foundations/geometry/hinged-panel/README.md), implemented in `lib/foundations/geometry/hinged-panel/index.mjs`: rigid convex panels rotate around an explicit XYZ axis through Rodrigues rotation, with parent×child transforms and shared attachment coordinates. It is genuine authored 3D geometry, not just a 2D transform. **This candidate does not add the first hinge, a new geometric degree of freedom, or a replacement for that mechanism.** Its cosine vertical compression is a restricted screen-space/orthographic-looking case of rotation about a horizontal hinge; geometrically it is less capable.

The library also already has [raster.projective-quad / projective-raster](../lib/foundations/raster/projective-raster/README.md), implemented in `lib/foundations/raster/projective-raster/index.mjs`: a supplied strictly convex nondegenerate quad receives a homographic RGBA warp, with premultiplied bilinear sampling and mapped attachment points. It is not a camera or full 3D renderer. A caller can project existing hinged-panel geometry, select front/back content and order the layers, then warp each nondegenerate face using that existing raster mechanism. At edge-on collapse the quad is degenerate: callers must skip that face instead of weakening projective-raster validation.

The narrow distinction here is **two stable panel identities, half-face clipping and painter order around a zero-area identity handoff**, packaged as a bounded convenience composition. Existing hinged-panel supplies geometry but does not choose old/new content or visible-face order; projective-raster supplies the image mapping but not the content swap or time schedule. This candidate chooses a fixed flat viewport, horizontal middle hinge, old-upper/new-lower ownership and explicit midpoint omission, then delegates scale/clip/drawing to Canvas. It neither calls those geometry/projective APIs nor claims their capabilities or usage. For tilted axes, camera perspective, parent hinges or texture perspective, use the existing geometry/projection path and author the identity ordering there rather than extending this helper into a second 3D pipeline.

Transform/local-reveal, linear-mask and fixed tiles remain sufficient building blocks for one-off authored compositions. The extracted helper only centralizes this particular identity/occlusion contract; there is no assertion that the visual effect was previously impossible. It remains unregistered support, not a new geometric foundation, general mask, timer or stagger. Existing sample-to-pair identity/ranking guidance is unchanged.

## Contract

`sampleSplitFlap({from,to,width,height,progress,reducedMotion?})` returns a deeply frozen, module-branded state. IDs obey the existing 1–64 ASCII letter/digit/underscore/hyphen instance-ID contract. Width is integer 1–4096, height integer 2–4096, total area at most 2,097,152 pixels. Progress is finite in [0,1]; out-of-range input is rejected, not extrapolated. Unknown own fields (including symbols/nonenumerable fields), missing fields and accessors reject. No implicit time, mutable previous frame, text shaping, numeric counting, queueing, delay or glyph cache. Caller handles absolute time and multi-digit stagger with existing tools.

At zero the old panel is drawn once; at one the new panel is drawn once. Equal IDs draw one stationary panel. Otherwise new content is a full opaque backing, old lower half sits over it, and a moving half is last: old upper for progress < 0.5, new lower for progress > 0.5. Its vertical scale is abs(cos(πp)); at exactly 0.5 there is no moving face and no singular transform. The full next backing prevents a transparent seam at fractional half-height. Glyphs never invert, and every face retains the same original [0,width]×[0,height] content coordinates. Reduced motion changes directly from old to new at 0.5; that is an intentional discontinuity, not the continuous folding path.

`drawSplitFlap(ctx,state,drawPanel)` requires the genuine state and a synchronous trusted callback `drawPanel(ctx,id)`. The callback must paint the **entire opaque panel**, including its background, with the same geometry and origin for every invocation. Caller owns the two immutable assets. Transparent glyph-only callbacks are out of contract: they let the lower backing show through. Do not mutate the context transform, use destructive compositing/clearRect, or unbalance saves/restores inside the callback. Caller Canvas drawing state/compositing remains its responsibility; use ordinary source-over and alpha 1 for the opaque-panel contract. The adapter clips each face and outer viewport, restores its save on callback exceptions, and returns no raster snapshot. Canvas current paths are not restored by save/restore; the adapter starts new paths and does not preserve the caller's current path.

This is **2D vertical compression**, not perspective, thickness, backside texture, lighting, mechanical simulation or a physical flip display. A seam stroke/shadow is optional caller decoration, not required to hide an incorrect identity switch.

## Use

```js
import {sampleSplitFlap,drawSplitFlap} from '../lib/support/split-flap.mjs';
const state=sampleSplitFlap({from:'2',to:'9',width:80,height:120,progress:.35});
drawSplitFlap(ctx,state,(c,id)=>drawOpaqueOriginalPanel(c,id));
```

## Validation boundary

`node --test engine/motion-elements/test/split-flap.test.mjs` checks genuine/frozen states, invalid input, endpoints/reduced motion, different digit identities, multiple viewport sizes including odd heights, Native pixel masks, opaque fractional hinge, outside clipping, ±1e−7 midpoint continuity, repeat/reverse sampling, and exception restore. Negative controls prove whole-panel swapping and retaining the old upper after midpoint differ from the correct result. Panels are original synthetic seven-segment geometry, with no fonts/media dependency. Native requires existing `MOTIONSTUDIO_CANVAS_MODULE` configuration when not installed locally.

Midpoint mean-byte difference under 0.02 in this Native test is evidence for this raster and these panels only, not universal perceptual continuity or cross-platform equality. No audio, reference media, artwork, brand, prices or benchmark results ship here. Pixel tests do not establish continuous audiovisual review, artistic acceptance, migration success or production maturity.
