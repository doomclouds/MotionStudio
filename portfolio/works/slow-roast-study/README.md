# 慢火 · 巨型字品牌首屏

1200×750完整固定画幅静态作品工程，非官方复刻。[固定来源](https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/web/06-bold-big-type.html)。不是实际上线品牌网站或活动；不宣称原作者背书。

![Native重建预览](cover.jpg)

保留完整 `design/scene.mjs` 与 `design/helpers.mjs`、[设计逻辑](DESIGN-REASONING.md)、唯一代码重渲染封面及MIT/OFL条款。不是简化技术夹具，不以截图作为背景。

## 准备与渲染

复用项目 `engine/motion-render-core`。字体二进制不打包、不自动下载。按font-inputs.json从官方字体家族合法取得指定版本输入，放入仓库外目录，文件名为 NotoSansSC-variable.ttf, NotoSerifSC-variable.ttf, PlayfairDisplay-Italic-variable.ttf, Anton-Regular.ttf。准备脚本需要Python fonttools；将静态实例化/子集化与改名输出写入所给外置目录。

```sh
python prepare-fonts.py --font-dir /absolute/external-fonts
SLOW_ROAST_FONT_DIR=/absolute/external-fonts node ENGINE/scripts/render.mjs --scene ABS/design/scene.mjs --work /absolute/new-output --frames 0
```

缺少字体明确失败。精确复现需要同版本字体与Native依赖；派生字体元数据可能不同，重点另验实际像素。所有输出和字体缓存留在仓库外。

## 验证范围

完整静帧、关键局部和说明已审看，用户决定保留。完整工程重渲染与已审画面一致；视觉仍标记PARTIAL而非像素无差。右下方原作本身是照片占位，不宣称完成摄影。14′20″、产地与批次是样例文案，真实使用需要核实；字体栅格化和局部字距存在差异。 仅静态Native；未浏览器、交互、响应式、音频或视频验证。

准备脚本会校验原始字体SHA，拒绝错版本。修改文案时须同步font-charset.txt加入所需字符后重新准备字体；本例不是自动多语言字体回退系统。
