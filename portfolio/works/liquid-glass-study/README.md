# 液态玻璃 · 冲浪预报三屏展示

1200×750完整固定画幅静态学习复刻。用户接受视觉作品并要求收藏，技术验证范围独立记录。[原作](https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/app/02-liquid-glass.html) · [来源许可](CREDITS.md) · [设计分析](design/DESIGN-ANALYSIS.md)。不是苹果官方界面或Mac桌面。

## 完整工程
- design/scene.mjs：完整三屏可编辑Native场景，而不是简化演示。
- design/content.json：主要状态与列表内容。
- font-inputs.json、font-subset.json和prepare-fonts.py：外置字体来源、字符范围及确定性准备。
- cover.jpg：唯一已审代码渲染封面。

## 重现
使用MotionStudio已有engine/motion-render-core的锁定依赖与Python fonttools 4.61.1。按font-inputs.json获取有许可的原字体并保存于外部目录，脚本只验证和派生字体，不联网下载。

```sh
python prepare-fonts.py --source-dir /absolute/source-fonts --output-dir /absolute/prepared-fonts
LIQUID_GLASS_FONT_DIR=/absolute/prepared-fonts node ENGINE/scripts/render.mjs --scene ABS/design/scene.mjs --work /absolute/new-render-dir --frames 0
```

字体输出须在工程目录外。修改内容后重跑字体准备，重新检查文本长度和固定画幅溢出。同源字体及锁定渲染器下可重现已审PNG；不同字体/平台不保证像素一致。使用独立Node进程渲染，本工程没有承诺跨案例共用全局字体别名。

## 验证范围
独立实看确认卡高、文字间距、柔影返修有效；干净目录还原与已审Native帧字节一致。原生玻璃以画布取样饱和度与alpha柔影实现，未等效CSS真实backdrop-filter空间模糊。字体度量、背景光团、描边和小时卡细节仍有近似。仅静态，未验收浏览器、交互、响应式、视频或声音。内部drawImage只合成自产背景和阴影，不加载原作位图。

![作品预览](cover.jpg)
