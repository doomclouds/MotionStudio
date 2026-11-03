# Seeded resin surface — restricted candidate

One bounded original decorative surface generator. **Zero registered design families, zero reviewed recipes, zero portfolio works.** This candidate does not implement editor interaction, a timeline or a motion response. Only its surface generation is proposed for review; source-study event/response repairs are unrelated existing work.

## Choose it for

A quiet illustrated card/glyph surface with sparse rounded inclusions, a broad bent light band and darkened edges. Use a raster cached once per model when applying motion or repeated glyph clips. Keep important text on a separate quiet label. It is intentionally graphic, not photographed resin, optical transmission, volumetric refraction or physical bubbles. It always paints a rectangular colored base under its overlays; it does not sample the scene behind it.

Do not choose it for cloth folds, photographic materials, live lighting, arbitrary 3D viewpoints, semantic scientific diagrams, or high-frequency moving texture. A new seed is a **different static model**, not a smooth animation control. Changing counts can reorganize the drawing; do not interpolate seeds as animation.

## Contract

`compileResin({width,height,seed,dark,light,count?,radius?,bend?})` returns an owned deeply frozen model. Dimensions are integer 64..1024, product <=524288. Seed is uint32. Dark/light are explicit #RRGGBB colors. Optional defaults apply only to undefined: count 20 (integer 0..64), radius .065 (0.01..0.15 of the minimum dimension), bend .6 (-0.8..0.8). Radius is a maximum; individual radii are 0.35..1 times it. Seeded centers keep full circular inclusions inside the rectangle. The broad light band may cross the clip boundary.

Inputs are ordinary or null-prototype records containing enumerable own data fields only. Unknown keys, symbols, accessors, inherited required fields and custom prototypes reject. No coercion; null is not a default. Trusted JavaScript callers only: this is not a Proxy/hostile-intrinsic sandbox. Model compilation is O(count) and does not allocate raster data, read time, use ambient random state, load fonts or perform IO.

`drawResin(ctx, model, {x?,y?}={})` draws a same-module owned model at finite placement ±16384 (default 0). It clips to its rectangle and returns frozen logical bounds plus count. Canvas context is caller-owned and trusted. Style values changed here (fillStyle, strokeStyle, lineWidth) are restored explicitly as well as save/restore, because Native Canvas 0.1.100 style accessors require explicit restoration in this usage. Caller transform and clip are preserved. **The current path is replaced**, as with ordinary beginPath drawing, and cannot be recovered by save/restore; do not invoke midway through an unfinished caller path. Caller alpha, compositing, shadows and filters affect the rendering. Clean/default raster state is required for the illustrated opaque fixture behavior.

Coordinates and inclusion radii are object-local, independent of viewport placement. They are geometric stability, **not a pixel-equivalence or anti-flicker promise**. Rasterizing the same geometry into differently clipped/translated canvases can change curve antialiasing. If exact crop identity matters, draw once to a caller-owned full tile and crop that cached tile. Scaling changes filtering; inspect actual-size output and continuous playback before accepting a motion use. Sampling-error diagnostics compare renderer consistency only; they do not establish perceptual flicker removal.

## Deduplication

- Existing `material-surfaces` supplies paper/opaque/glass information panels and caller backdrop integration. This package neither replaces nor calls that API; it supplies seeded internal decorative geometry rather than a content container.
- Existing `drape-material-candidate` uses analytic brightness columns for cloth-like folds. This candidate does not copy its field, sample formula or renderer.
- Existing scalar/halftone candidates map supplied scalar fields to patterns. No scalar input, measured data or halftone is claimed here.
- Existing contour-rim shades the boundary of an alpha mask. This package does not shade arbitrary masks or extrude glyphs; caller clipping remains separate.
- Related matte-paper and glaze sketches were not extracted: generic layered paper and color pools alone did not justify another reusable candidate. No new “material engine” is claimed.

## Reproduction and evidence boundary

`fixtures.mjs` supplies two different aspect ratios, dimensions, seeds, inclusion counts/radii, bends and palettes: 240×360 amber and 520×220 blue-gray. Call compile/draw using a separately installed Canvas implementation. No runtime/font/media is bundled. The source tests write no files.

From repository root:

    node --test engine/design-elements/recipes/candidates/seeded-resin-candidate/test.mjs
    CANVAS_MODULE=/absolute/path/to/installed/canvas/index.js node --expose-gc --test engine/design-elements/recipes/candidates/seeded-resin-candidate/test-native.mjs

Native tests explicitly require an external module; absent configuration fails rather than claiming success. Tested with @napi-rs/canvas 0.1.100. Native fixtures cover 1x/2x raster scale, repeat-byte equality at identical configuration, explicit style/transform restoration, isolated count-zero ablation and clipping. Pure tests cover deterministic owned models, bounds, budget endpoints and invalid inputs. Actual raster previews belong outside the repository. These are synthetic transfer tests, not different accepted artworks or production reuse, and not a clean-install/cross-platform test.

Independent review and final aesthetic acceptance remain separate. Continuous normal-speed viewing and audio review are not established by this static candidate.

## Rights

Original implementation and fixtures under the repository MIT license. Conceptual stimulus: the material-letter/card passage in [Software motion study](https://open-design.ai/motion-demo/software-20261027-web.mp4). No reference image, font, soundtrack, application branding, source template script or third-party implementation is included or required. External Canvas remains separately licensed; its runtime binaries are not redistributed here. This is not an official Figma feature or affiliated product.
