# 钱是怎么飞走的 · 完整静态复刻

已获收藏同意，固定1200×750。设计思考见DESIGN-RETENTION.md和DESIGN-REASONING.md；完整入口design/scene.mjs。

## 恢复与验证
1. 按font-inputs.json的官方来源合法提供精确SHA原字体到外置目录。缺文件/错版本明确失败，不自动下载。
2. `python prepare-fonts.py --font-dir /external/fonts`（fontTools 4.61.1），先验原源，再确定性子集/实例化/更名，最后验派生。
3. `SALARY_STACK_FONT_DIR=/external/fonts node engine/motion-render-core/scripts/render.mjs --scene ABS/portfolio/works/salary-unit-stack-study/design/scene.mjs --work /tmp/salary-unit-stack-study-render --frames 0`
4. `node portfolio/works/salary-unit-stack-study/tests/recipe.test.mjs`

原源和派生字体运行时均再次验hash，禁止系统回退。运行版本见locks；本工程需要仓库标准engine/design-elements/material-surfaces.mjs，其SHA必须为`70bf1fcfa89bfbf911f5cf735b1b08e8ae7f360e43bd43a8c831efef579696eb`，运行时fail-closed。其他案例源码不依赖公共UI族。

已审原生PNG SHA：`8ba295c4f648c9f9380e3e7af9adf7ec4dcbb9c445b1a4d2f2f97ee3b5f6efd6`。干净重制外置字体后，标准引擎帧与已审帧一致；临时import seam追踪确认material真实调用1次且帧一致。此技术证据不代替新审美验收。唯一公开图为cover.jpg，报告容器已从私有Library取回核对，独审原文已在仅所有者Page读回核验；运行回执仍为本地证据，不随之升级。

## 真实复用与候选沉淀
material-surfaces.v1用于右上说明纸的纸面和边缘，圆角硬影为案例代码。unit-stack-recipe.mjs：校验整数张数、金额、分母与百分比，拒绝半张/错金额/溢出；不是通用绘图族。案例测试源码可运行，测试输出不入库。候选不增加公共族数量。

## 边界
原作虚构预算和几何钞票示意；40张×300=12000，六分类金额及百分比核验成立，但非真实个人财务建议。该校验不承担票堆绘制。只验证固定Native静态；未通过浏览器/响应式/交互/Motion/音频或真实世界正确性测试。
