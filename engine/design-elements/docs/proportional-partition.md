# design.proportional-partition.v1 · 等比例面积分区

## 修正来源，不传播来源错误
源 `ocean-health-batch/ocean/verification/encoding-check.json`：组外框面积/值一致，但扣不同头栏、间距后，叶块paintedAreaPerUnit从约1602到1435不等。原作品仍按复刻保留；新代码不沿用“全局叶面积同尺度”假声明。

新资产是**扁平正值矩形分割**，不是任意层级treemap。给定items[id,label,value,color]，按输入顺序二分近半总值，沿当前矩形长边分割；每叶面积=value/total×plotArea。没有内部组标题、边框、圆角或间隙，图例与sourceLabel在plot外，因而不会对小叶扣掉更大比例面积。无叶内文字遮盖，颜色在外部图例映射。数学几何面积严格同尺度，光栅边缘有像素量化/抗锯齿，不能说每个RGB像素数绝对等比。

输入1–12项、非负有限值、总和>0、单位一致且必须声明sourceLabel。零值不画矩形但保留图例并返回zeroIds。正值小到任一边<1px或面积<16px²时拒绝，要求调用者显式合并或扩大画布，不能静默吞类。重复id、正项重复颜色、负数、总和0、过长图例均拒绝。值和图例来自同一字段，算法不另抄展示值。

输出total、areaPerUnit、每叶rect/area/ratio；可独立复算无重叠、面积和、同尺度。适合分类库存、时间分配、预算构成（数据真实性仍调用者负责）。不适合极端小类、精确排名比较、层级头栏、地理占地或对多组保留独立空隙却仍声称全局面积相等。

两真实内容组合：档案分类库存与制作工时计划；再结合独立ratio-rings表达“完成目标”，不把分类份额误当完成率。

稳定来源作品：`portfolio/works/ocean-plastic-treemap-study`。本地提取快照：`ocean-health-batch/ocean`。这里是设计关系提取；原作品scene未改为调用本模块，真实新调用见`examples/b05-compositions.mjs`。
