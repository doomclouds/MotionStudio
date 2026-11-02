# XHS08 定量面积受限配方

最小源码闭包；0新增公共家族。独立教学技术验证，不是完整品牌作品、原画改版或事实认证。原忠实复刻保留；本包不带原截图、私人报告、图像或字体二进制。

接口与数值边界见 DESIGN-RETENTION.md、design/area-plan.mjs。gap=0仅连续几何面积精确；离散光栅允许边缘误差。gap>0返回逻辑和着色比例，不混淆。华夫格使用部分格，1格=10单位，空尾不是类别。两套分类在演示中明确区分。原源样例计数不是经核验研究数据。

## 独立运行
Node 24.22.1；安装 @napi-rs/canvas@0.1.100（见package.json），不带node_modules。核心plan函数无第三方依赖、无需字体；像素测试需Canvas但无需字体。
```
node test.mjs
python prepare-fonts.py /absolute/Figtree.ttf /absolute/new-font-dir
XHS08_FONT_FILE=/absolute/new-font-dir/Figtree700.ttf XHS08_OUTPUT_DIR=/absolute/new-empty-output node render.mjs
```
字体fontTools==4.61.1；原源与派生均SHA锁定。字体从Google Fonts Figtree获取，版本以SHA为准，不自动下载、不接受替代；OFL通知随包。输出与字体路径须在本配方工程包外（不是承诺整个仓库外）；输出必须新建/空目录，拒绝symlink或工程内路径。输出两1600×1460教学PNG与JSON计划；不生成带原参考图的报告。

运行时只核派生字体，准备过程核原源和派生。显式英文图例，中文需另验字体覆盖。当前连续状态保护与数学测试不等于Motion跨帧重排验证。
