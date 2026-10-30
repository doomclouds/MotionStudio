# 南鸢过境 · 完整静态复刻

用户同意收藏；固定1200×750 Native静态，不是可交互产品。

## 干净恢复
1. 依font-inputs.json合法提供精确SHA原字体到外置目录，版本不符立即拒绝，不自动下载。
2. `python prepare-fonts.py --font-dir /external/fonts`（fontTools 4.61.1）。检查原源后确定性派生，并检查输出SHA；Plex Mono无需派生。
3. `NANYUAN_MAP_FONT_DIR=/external/fonts node engine/motion-render-core/scripts/render.mjs --scene ABS/portfolio/works/nanyuan-cartographic-study/design/scene.mjs --work /tmp/nanyuan-cartographic-study-render --frames 0`

运行时再次检查全部原源及派生hash，缺失/错版不回退。依赖版本见locks。
已审帧SHA：`2533458573064ba7ef1422fc573cabd8e3ebc5043cda7fbbfa52b6c9e3b0e478`。唯一公开图为自渲染cover.jpg，报告容器已从私有Library取回核对，独审原文已在仅所有者私有Page读回核验；私有引用不公开，准确状态见retention.json。

## 沉淀与使用
阅读DESIGN-RETENTION.md及retention.json，再使用完整入口。现有14个公共UI族无实际runtime import；案例配方被真实调用，不等于新增通用族，不虚构依赖或源码快照。配方源码随完整项目保留并列入entry文件SHA。

地图为虚构气象与底图占位，不是真实气象/岸线。圆面积编码成立，但重叠遮挡不等于可见面积比例；线性经纬布局不作投影精度背书。 设计逻辑与残差见DESIGN-REASONING.md；私有执行记录原地保留、不随源码发布。未验证浏览器/交互/响应式/Motion或真实世界正确性。
