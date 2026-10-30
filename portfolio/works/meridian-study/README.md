# Meridian · 黑白对分品牌与产品首屏

Complete fixed-frame Native Canvas study. [Pinned original](https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/showcases/website-saas/saas-pentagram.html). 非官方复刻；Meridian是Huashu SaaS样例，不是Pentagram官方作品或真实商业服务；客户名、3x/50%等数据不构成实际关系、指标或背书。暗图表低对比风险来自参考，未通过无障碍审查。

![Code-rendered preview](cover.jpg)

Complete editable source: `design/scene.mjs`. [Design reasoning](DESIGN-REASONING.md) explains content, brand, composition, type, color and remaining limits. Only this rebuilt cover is bundled; no source screenshot, bitmap font or generated artwork.

## Restore and render

Use the existing MotionStudio Native core and its lock. Obtain licensed original inputs named LiberationSans-Regular.ttf, LiberationSans-Bold.ttf into an external directory, matching `font-inputs.json` SHA identities; family URLs and actual terms are in `entry.json`/`LICENSES`. Preparation verifies the supplied original Liberation Sans files directly; no subsetting or font derivation occurs. The render entry checks those same hashes.

```sh
python prepare-fonts.py --font-dir /absolute/external-fonts
MERIDIAN_FONT_DIR=/absolute/external-fonts node ENGINE/scripts/render.mjs --scene ABS/design/scene.mjs --work /absolute/new-output --frames 0
```

All fonts and generated files remain outside Git. Missing/wrong fonts fail closed. To change copy, edit the scene and rerender to review layout and glyph coverage. There is no font-charset.txt for this work; its full external Liberation Sans fonts are not subset. Replacing a font requires deliberately updating identities and visual regression.

## Evidence and limits

Full frame and critical details were visually reviewed; user elected to retain the work. Complete entrypoints reproduced the retained Native frame. Visual status remains PARTIAL: JPEG/antialiasing and small text residuals remain; Meridian uses disclosed font substitution. Static only: no browser, responsive, interaction, audio or Motion validation. Source claims and interface values are examples, not verified facts.
