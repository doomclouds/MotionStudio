# 户外地形工具 · 完整静态复刻

已获收藏同意，固定1200×750。设计思考见DESIGN-RETENTION.md和DESIGN-REASONING.md；完整入口design/scene.mjs。

## 恢复与验证
1. 按font-inputs.json的官方来源合法提供精确SHA原字体到外置目录。缺文件/错版本明确失败，不自动下载。
2. `python prepare-fonts.py --font-dir /external/fonts`（fontTools 4.61.1），先验原源，再确定性子集/实例化/更名，最后验派生。
3. `TOPO_OUTDOOR_FONT_DIR=/external/fonts node engine/motion-render-core/scripts/render.mjs --scene ABS/portfolio/works/topo-outdoor-study/design/scene.mjs --work /tmp/topo-outdoor-study-render --frames 0`
4. `node portfolio/works/topo-outdoor-study/tests/recipe.test.mjs`

原源和派生字体运行时均再次验hash，禁止系统回退。运行版本见locks；本工程需要仓库标准engine/design-elements/material-surfaces.mjs，其SHA必须为`70bf1fcfa89bfbf911f5cf735b1b08e8ae7f360e43bd43a8c831efef579696eb`，运行时fail-closed。其他案例源码不依赖公共UI族。

已审原生PNG SHA：`7a32c3c584023ee0526ee19da2c1bf1125681f340ef69f050f937294d667822d`。干净重制外置字体后，标准引擎帧与已审帧一致；临时import seam追踪确认material真实调用3次且帧一致。此技术证据不代替新审美验收。唯一公开图为cover.jpg，报告容器已从私有Library取回核对，独审原文已在仅所有者Page读回核验；运行回执仍为本地证据，不随之升级。

## 真实复用与候选沉淀
material-surfaces.v1用于三台设备的底层壳面与柔影。route-halo-recipe.mjs：校验同几何白9/橙5描边、先后绘制顺序、有限宽度和round接点；不是GIS或绘图组合资产。案例测试源码可运行，测试输出不入库。候选不增加公共族数量。

## 边界
原作地形、路线及海拔为示意路径，非可导航地图；峰值1,184与1200参考线同y的源编码问题保留披露。不能据此规划真实路线、计算坡度或给出安全建议。只验证固定Native静态；未通过浏览器/响应式/交互/Motion/音频或真实世界正确性测试。
