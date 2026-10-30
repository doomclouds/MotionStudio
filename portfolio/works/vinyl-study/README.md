# Vinyl shop: complete editable static study

1200×750 Native Canvas reconstruction of the [Huashu design specimen](https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/web/03-memphis-maximalism.html), not a real store's official site. Upstream MIT attribution is preserved in `LICENSES/huashu-MIT-LICENSE.txt`. Geometry, typography and paper dots are editable; source screenshots, generated textures and external artwork are not used. No production review reports or images are redistributed.

`design/scene.mjs` is the full composition, not the simplified synthetic fixture. `design/content.json` separates content. This remains a case-specific composition: it is not a generic responsive framework or a newly invented motion element. [Design reasoning](../../../skills/motion-film-director/research/design-knowledge/cases/ui-003-print-poster.md).

## Dependencies and rendering

Use the existing `engine/motion-render-core` package. No fonts are bundled. `font-inputs.json` lists required font files and official family locations; OFL notices are in `LICENSES/`. Obtain licensed Noto Serif SC and Noto Sans SC variable fonts into an external directory named `NotoSerifSC-variable.ttf` and `NotoSansSC-variable.ttf`, plus `Bungee-Regular.ttf`, `SpaceMono-Bold.ttf`, `DMSerifDisplay-Regular.ttf`. Install Python fonttools. Run:

```
python prepare-fonts.py --font-dir /absolute/external-fonts
VINYL_FONT_DIR=/absolute/external-fonts node ENGINE/scripts/render.mjs --scene ABS/design/scene.mjs --work /absolute/new-render-dir --frames 0
```

The preparation script subsets and instantiates Noto weights and renames modified families to Vinyl; it writes only into the supplied font directory. For exact comparison use the same font versions; upstream font updates/platform rasterization may differ. Missing fonts fail clearly. Retain OFL notices alongside any font redistribution; linking a public repository does not waive rights.

This complete scene was rendered against supplied licensed fonts and visually compared privately. Residuals: cleaner paper than source JPEG, localized type weight/spacing/rasterization differences, approximate groove/shadow edges. Static only; no browser, responsive, interaction or video validation. Generated frames stay outside Git.

![Native recreation preview](cover.jpg)

此封面由完整代码重渲染帧转为JPEG，只用于项目内预览；不是上游截图。
