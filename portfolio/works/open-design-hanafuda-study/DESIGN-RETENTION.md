# Composable learning, not an inflated library claim
Two bounded LOCAL candidate helpers are consumed by the main scene and a separate synthetic transfer:
1. design/pixel-card.mjs drawPixelMotif(ctx,{x,y,scale,rects}): authored 24×32 rect palette; validates every cell and total count before drawing, bounded scale 0.125≤scale≤64, integer cell geometry, |x|/|y|≤8192, ≤4096 rects. No image decoding, auto-detection, arbitrary grid support, or claim of new public primitive.
2. design/timeline.mjs drawTimeline(ctx,{x,y,width,height,items,font,Path2D}): static clipped timeline strip, ≤64 items, 0≤item.x≤width, |x|/|y|≤8192, 1≤width≤4096, 1≤height≤256, ≤160 characters/label. Authored positions are caller responsibility; no automatic layout/collision solution or animation.
Both save/restore Canvas transform/clip and explicitly restore fillStyle/font/letterSpacing because this backend exposes cached style properties across restore.
Pixel preflight rejection tests assert no mutation. Timeline text fit is not guaranteed; caller must supply typography and positions. Fixed background/type/registration belong to this particular scene, not a new family.
Do not turn source caption overlap into a rule. The revision demonstrates one hand-authored resolution. Main year body is not a generalized auto-fitting title API.

After independent review: timeline takes the caller-backend Path2D constructor and builds isolated clip/dot paths without beginPath, preserving the current caller path. Path-preservation pixels tested. Domain guards reject 1e20 origins/items and Number.MIN_VALUE scales/extents; pixel cells must be positive integer extents. The caller still owns its existing transform, canvas allocation, font availability, and text fit; no guarantee is made for a singular/overflowing preexisting caller transform.

Sparse-item fix: Array.from densifies the entire items array and snapshots object label/x before any drawing. Holes, null, undefined, primitives, arrays and invalid properties are rejected. Nine negative cases assert zero pixel/style/current-path pollution (36 checks).


## Approved collection scope (2026-10-30)
Owner approved the ten static examples: “挺不错的，沉淀积木，然后推送，继续任务”. This permits retaining this static study and source assets, not trademark endorsement, fact verification or motion acceptance. Original screenshots and fonts remain outside this source tree. Local helper code is retained, not promoted to a new public family.
