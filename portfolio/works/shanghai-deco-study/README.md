# 摩登焙香 · 装饰艺术月历静态复刻

1200×750完整固定画幅Native Canvas作品工程，非官方复刻。[原作与固定版本](https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/east/04-shanghai-deco-calendar.html)。不是浏览器应用，不是视频；没有响应式或交互验证。

## 保留的是什么

- design/scene.mjs：完整构图、几何、文字、颜色和材质，可直接编辑，非简化夹具。
- DESIGN-REASONING.md：内容意图、品牌语言、构图、颜色与迁移边界。
- cover.jpg：当前已审版本的唯一预览，来自代码重渲染。
- font-inputs.json与LICENSES：外置字体身份、来源和条款。

## 准备与重渲染

复用仓库engine/motion-render-core及其锁定依赖；不复制node_modules。字体不打包、不自动下载，请从font-inputs.json列出的家族合法取得字体到外部目录。原始输入文件名为：NotoSansSC-variable.ttf、NotoSerifSC-variable.ttf、ZCOOLXiaoWei-Regular.ttf。准备脚本需要Python fonttools，参数说明见脚本。

```sh
python prepare-fonts.py --font-dir /absolute/external-fonts
DECO_FONT_DIR=/absolute/external-fonts node ENGINE/scripts/render.mjs --scene ABS/design/scene.mjs --work /absolute/new-output --frames 0
```

字体准备与输出都在仓库外，缺少字体会明确失败。精确重现需要同版本字体；平台和字体版本变化可能改变栅格化。

## 验证范围

完整单帧和关键局部已对照审看，独立解包/重渲染通过；用户决定保留作品。视觉状态仍为PARTIAL：文字字形/字距、细材质和原JPEG颗粒存在差异。仅固定尺寸静态，未浏览器、交互、响应式或视频验证。月份、纪年与日期是原作样例内容，未作历史历法正确性背书。

![重渲染预览](cover.jpg)

完整署名与权利边界见[CREDITS.md](CREDITS.md)。
