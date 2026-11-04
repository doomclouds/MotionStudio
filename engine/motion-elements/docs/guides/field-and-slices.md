# 解析方向场与分带错位

[返回入口](../../README.md) · [目录与公共 API](../registered-foundations.md)

本页保存对应机制的详细合同、合成示例和已有证据限定。历史批次数量不是当前目录数，已有测试描述不代表本次重新运行或艺术通过。代码片段中相对导入以本页所在目录为基准；shell 命令按各段注明的工作目录运行。

## Experimental: analytic orientation field and masked slice displacement

Two mechanisms, not parameter-count variants. Audit distinction: `fragment.fixed-tiles`
scatters a raster snapshot; `reveal.local-geometry` clips one geometric window;
`motion.shake` perturbs one transform. None provides independent analytic grid
orientations or fixed bilateral horizontal strip displacement.

### 当前资产合同

- [解析方向场](../../lib/foundations/field/attractor-orientation/README.md)
- [分带错位](../../lib/foundations/transition/masked-slice-displacement/README.md)

上述两项详细API各自共置，下面保留原组合示例及验证边界。

`examples/field-slices-scene.mjs` has two semantic examples each: compass needles
and circulating ribbon marks; a signal chart and a complete text card. It exports
`config` and native `createGalleryScene`; render it with
`node scripts/render-gallery.mjs --out /tmp/field-slices-demo --demo field-slices`
(from `engine/motion-elements`). The example is 960×640, 180 frames / 6 seconds. Field
reduced mode freezes the authored attractor; slice reduced mode is identity.
`test/field-slices.test.mjs` covers validation, stable IDs, singularities, subnormal
weights, seek/seed determinism, bounds, native endpoint/reduced raster equality and
context restoration. Experimental technical evidence only: no artistic approval,
hearing approval, cross-backend identity, or independently validated production
transfer is claimed. No reference/media/calibration data is included.
