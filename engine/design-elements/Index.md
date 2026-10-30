# UI 设计积木索引

计数单位为可调用的设计族，不是作品、函数或截图。

| 稳定 ID | 文字指导 | 代码 | 复用场景 |
|---|---|---|---|
| design.print-poster.v1 | 既有案例知识卡，见 catalog | [print-poster.mjs](print-poster.mjs) | 既有印刷海报，保持原 API |
| design.typographic-focus.v1 | [文字主视觉](docs/typographic-focus.md) | [代码](typographic-focus.mjs) | 主张、章节标题、嵌套活动信息 |
| design.color-sections.v1 | [色彩分区](docs/color-sections.md) | [代码](color-sections.mjs) | 主张与证据分区、互换阅读顺序 |
| design.material-surfaces.v1 | [材质表面](docs/material-surfaces.md) | [代码](material-surfaces.mjs) | 纸、实体、显式背景玻璃及内容槽 |
| design.semantic-data.v1 | [语义序列](docs/semantic-data.md) | [代码](semantic-data.mjs) | 类别、阶段、明确量程的面积符号 |
| design.parameter-controls.v1 | [参数刻度](docs/parameter-controls.md) | [代码](parameter-controls.mjs) | 有数值范围的横/纵静态参数 |
| design.expressive-type.v1 | [层叠/切片](docs/expressive-type.md) | [代码](expressive-type.mjs) | 有边界的2D标题效果 |
| design.radial-scale.v1 | [圆弧读数](docs/radial-scale.md) | [代码](radial-scale.mjs) | 旋钮/半圆量程，线性静态 |
| design.diagonal-field.v1 | [斜切色域](docs/diagonal-field.md) | [代码](diagonal-field.mjs) | 带安全内容矩形的方向分区 |
| design.authored-paths.v1 | [叙事路径](docs/authored-paths.md) | [代码](authored-paths.mjs) | 有声明的故事弧与序列示意 |

## 新增专项：技术复核，不等于用户审美验收

| 稳定 ID | 文字指导 | 代码 | 边界 |
|---|---|---|---|
| design.vertical-imprint.v1 | [纵列印记](docs/vertical-imprint.md) | [代码](vertical-imprint.mjs) | 右起字列/批注；非混排竖排引擎 |
| design.geometric-marks.v1 | [几何标识](docs/geometric-marks.md) | [代码](geometric-marks.mjs) | 共享网格图形家族；不自动设计品牌 |
| design.proportional-partition.v1 | [比例分区](docs/proportional-partition.md) | [代码](proportional-partition.mjs) | 声明明确的面积编码；非任意层级treemap |
| design.ratio-rings.v1 | [比率圆环](docs/ratio-rings.md) | [代码](ratio-rings.mjs) | 数值比率与弧长一致；非医学判断 |

公共族合计14（既有10+新增4）；新增族通过独立合成组合与技术/视觉复核，没有改写原B05作品，sourceSceneMigrated=false，userAestheticApproval=false。原作品真实调用仍以自动覆盖表为准。新组合入口[examples/b05-compositions.mjs](examples/b05-compositions.mjs)。

- [机器索引 catalog.json](catalog.json)：版本、状态、来源、样例与验证。
- [组合配方](examples/compositions.mjs)：固定 1440×900 二栏演示；标题/材料/数据/参数由 recipe 输入。
- [全部静态作品覆盖账单](CASE-COVERAGE.md)：来源启发与实际调用分列；由作品sidecar自动生成，不以适配关系冒充已重构。
- [使用/运行方法](README.md)：Native Canvas 环境、字体注入与测试。
- [证据生成入口](examples/render.mjs)：重渲染合成组合；私有视觉报告不随源码发布，不计为新增收藏作品。

## MotionStudio 使用顺序
先按内容目的选表达方式（主张→文字；对比→分区；数据→带数值/图例的语义图；设备参数→刻度），再选材料与品牌颜色；不能先挑好看的积木硬塞内容。先在固定尺寸静态画面验证阅读层级，用户通过后才能进入后续 motion 实验。当前资产没有时钟/运动参数，不能声称自动产出动画。

## 入库门槛
每族需有文字契约、稳定 ID、可调用代码、不同内容的例子、输入边界测试、实际渲染与独立视觉复核。合成测试通过不替代用户审美确认。原作品保留与通用资产状态分别管理。

二阶段组合入口：[specialist-compositions.mjs](examples/specialist-compositions.mjs)。上区使用安全矩形容纳效果标题与可读支持，下区使用路径与圆弧读数，所有数据由recipe输入。
