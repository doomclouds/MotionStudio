# 公交早晨 计算式数据肖像

1200×750固定静态完整复刻。通过大量个体轨迹形成系统纹理，以蓝暖方向色、时间轴和两处注释建立读图入口。见[设计逻辑与数据限制](design/DESIGN-ANALYSIS.md)、[来源许可](CREDITS.md)。非官方Huashu样张，已获静态收藏，不是交通分析结论。

## 完整工程

- design/model.mjs：固定种子模型，明确区分来源计数与已绘制轨迹计数。
- design/scene.mjs、content.json：完整可编辑线群、轴线、标题与注释；无参考图贴图。
- font-inputs.json、fonts.lock.json、font-charset.txt与prepare-fonts.py：外置合法字体的原始与派生hash校验。
- cover.jpg：唯一自渲染预览。

## 离线重现

使用MotionStudio Native引擎的锁定依赖和Python fonttools 4.61.1。按font-inputs.json提供合法原字体到外部目录，准备脚本不联网且先验证全部输入，不接受静默替换。

```sh
python prepare-fonts.py --source-dir /absolute/font-sources --output-dir /absolute/prepared-fonts
BUS_MORNING_FONT_DIR=/absolute/prepared-fonts node ENGINE/scripts/render.mjs --scene ABS/design/scene.mjs --work /absolute/new-work --frames 0
BUS_MORNING_FONT_DIR=/absolute/prepared-fonts MOTION_ENGINE_ROOT=/absolute/engine/motion-render-core node verify.mjs
```

缺少或错误字体会明确失败。改文案需更新字符集、重新准备字体与锁并检查画幅；改模型需重验计数和视觉，不以旧验收自动覆盖。相同源字体与运行时能还原已审PNG，不保证跨平台或字体版本像素相同。输出放Git之外。

## 必须保留的边界

虚构风格样张：源程序保留1641行程，实际绘制端点与时间窗相交1640；08:12源计数543，实际绘制相交538，区别来自最后绘制点后的一次额外时间步进。37路线及真实站距未在源码建模；密度亮度不是客流。完整保留设计与源口径，但不能用于真实交通报告。

视觉为PARTIAL：源线群更灰雾，候选分色略锐，字体与透明叠加栅格有残差。未验证浏览器、交互、响应式、动效或声音。源码收录需合法自备外置字体，不声称克隆即可无条件重现。

![作品预览](cover.jpg)
