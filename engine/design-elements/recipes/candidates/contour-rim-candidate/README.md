# Contour-aware raster rim — restricted candidate

A source-only, unregistered raster helper for a **merged alpha mask**. It separates a thin contour shade from a flat face. It is not a design family, formal recipe, portfolio work, metal renderer, 3D bevel, perspective model or PBR system. No registered counts change.

```js
import {shadeContourRim} from './index.mjs';
const rgba = shadeContourRim({width, height, alpha, bandWidth:5,
  face:[200,200,207], edgeBase:190, contrast:49, light:[.52,.85]});
```

## Contract
Node 24+, no external dependency. Input alpha is a Uint8Array/Uint8ClampedArray with one byte per pixel; dimensions are integers 5..2048 with at most 1,048,576 pixels. All four outer borders must be transparent. Output is a fresh RGBA byte array preserving every input alpha byte. Caller supplies already merged shape/font pixels and handles premultiplication/compositing. Inputs are not mutated.

`bandWidth` is 1..32 screen pixels; face is three 0..255 values; edgeBase 0..255; contrast 0..127; light is a finite 2D direction with Euclidean norm at least 1e-6, internally normalized. Dense arrays with their own numeric entries are required for face and light; sparse or inherited entries are rejected. `enabled:false` removes **only** the contour shading, retaining the same alpha and face. Out-of-range color results clamp to bytes.

Two-pass chamfer distance uses an alpha>127 interior threshold, not an exact Euclidean distance or subpixel curve. The strict condition is distance < bandWidth: on a binary mask every opaque pixel has distance at least 1, so bandWidth=1 adds no rim shading. Anti-aliased pixels with alpha 1..127 have distance 0 and can still receive rim color at bandWidth=1; their original alpha is preserved. Finite differences approximate a screen-space gradient; curves can staircase, thin strokes may be entirely rim, and adjacent shapes have no independent material identities. Use sufficient raster scale and inspect holes/diagonals at delivery size. Do not use it to claim correct perspective lighting or turn a flat mask through a 3D camera.

Time is O(N) for N pixels, with a fixed number of raster passes. The two new typed arrays use approximately 8N bytes (4N Float32 distance + 4N RGBA output), excluding caller input, objects and runtime overhead. The maximum accepted budget is 1,048,576 pixels. No throughput, interactive latency or frame-rate guarantee is made.

## Design choice and deduplication
Existing material-surfaces implements paper/opaque/glass information panels; it does not shade contours of arbitrary masks. Existing Canvas masks and offset stacks remain responsible for clipping and projected thickness. Existing scalar halftone candidates handle background density. This candidate adds only the bounded alpha-to-rim operation: neither font layout, extrusion, sweep highlights nor dot backgrounds are copied here. It does not replace any registered API.

Prefer broad quiet faces with a narrow directional rim rather than high-contrast bands across the entire object. Always compare identical content/time with `enabled:false`; removing all depth or removing the background cannot isolate the rim's contribution. Keep decorative texture away from critical copy. Different words must be measured by actual ink bounds; this helper does not perform that layout.

## Synthetic verification
Run `node --test engine/design-elements/recipes/candidates/contour-rim-candidate/test.mjs` from the repository root. `fixtures.mjs` supplies three original masks: ring, open bridge, diamond. Tests cover deterministic output, byte-for-byte alpha preservation, isolated output, input nonmutation, narrow-rim ablation, direction reversal, holes, empty masks, half-transparent AA bytes, one-pixel lines, band endpoints 1/32, exact maximum pixel budget, over-budget rejection, the minimum light norm and invalid inputs. These are bounded synthetic checks, not arbitrary geometry or typography coverage. A caller can put returned bytes into ImageData with an independently installed Canvas renderer; this package does not write media or load fonts.

## Provenance and status
Original implementation inspired by analysis of the official [Motion Future 20-second English adaptation](https://open-design.ai/showcase/futuristic-motion-graphics-design/), not a claim to have watched its third-party 62-second original. Source media, glyphs, typography binaries, original music and private rendered evidence are excluded. No source shader or mesh code is adapted. Static review and technical tests do not establish continuous playback, audio review, physical accuracy or user aesthetic approval. Candidate remains subject to independent review.
