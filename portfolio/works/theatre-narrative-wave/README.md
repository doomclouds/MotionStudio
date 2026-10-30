# 现在与可能 · 小剧场叙事波形

完整1200×750固定静态学习复刻。[原作](https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/ppt/14-narrative-sparkline.html)；见[设计逻辑](design/DESIGN-ANALYSIS.md)与[许可](CREDITS.md)。该例已获收藏，但不是通用设计能力或动效质量的证明。

## 离线重现

使用MotionStudio现有Native引擎锁定依赖，Python fonttools 4.61.1。按font-inputs.json提供合法原字体到外部目录；脚本核验SHA后生成静态改名子集。缺少、错误字体或环境变量会明确失败，不静默回退系统字体。

```sh
python prepare-fonts.py --source-dir /absolute/font-sources --output-dir /absolute/prepared-fonts
THEATRE_FONT_DIR=/absolute/prepared-fonts node ENGINE/scripts/render.mjs --scene ABS/design/scene.mjs --work /absolute/new-work --frames 0
THEATRE_FONT_DIR=/absolute/prepared-fonts MOTION_ENGINE_ROOT=/absolute/engine/motion-render-core node verify.mjs
```

源码、content.json和颜色可编辑。字体字符集是已审版精确集合，变更文本后须更新font-charset.txt、重新准备字体与锁，再重做固定画幅溢出和视觉检查，不应绕过hash。相同环境、源字体及内容可还原验收PNG；平台或版本变化不保证像素一致。输出目录位于Git之外，原图/字体二进制/报告不随收藏发布。

图形用于叙事隐喻，无量化轴，不能作为真实业绩趋势或预测。未验证浏览器、交互、响应式、视频及声音。

![作品预览](cover.jpg)
