# 沿线设施图例 · 完整静态复刻

用户同意收藏；固定1200×750 Native静态，不是可交互产品。

## 干净恢复
1. 依font-inputs.json合法提供精确SHA原字体到外置目录，版本不符立即拒绝，不自动下载。
2. `python prepare-fonts.py --font-dir /external/fonts`（fontTools 4.61.1）。检查原源后确定性派生，并检查输出SHA。
3. `TRAIL_PICTOGRAM_FONT_DIR=/external/fonts node engine/motion-render-core/scripts/render.mjs --scene ABS/portfolio/works/trail-pictogram-study/design/scene.mjs --work /tmp/trail-pictogram-study-render --frames 0`

运行时再次检查全部原源及派生hash，缺失/错版不回退。依赖版本见locks。
已审帧SHA：`ddff1dbb45e4d004aabead34a40bb9d85d69c7cfa3589095f952b63756efecc1`。唯一公开图为自渲染cover.jpg，其余对照与独审证据目前只有本地记录，不假称持久归档。

## 沉淀与使用
阅读DESIGN-RETENTION.md及retention.json，再使用完整入口。现有14个公共UI族无实际runtime import；案例配方被真实调用，不等于新增通用族，不虚构依赖或源码快照。配方源码随完整项目保留并列入entry文件SHA。

图标源只45°与严格8×8的文案存在反例；路径保留源几何，不能冒称严格网格认证或真实户外导视认证。 设计逻辑与残差见DESIGN-REASONING.md；私有执行记录原地保留、不随源码发布。未验证浏览器/交互/响应式/Motion或真实世界正确性。
