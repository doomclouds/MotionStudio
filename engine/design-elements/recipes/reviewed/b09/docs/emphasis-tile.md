# recipe.emphasis-tile.v1 · 受限旋转强调词

代码：[emphasis-tile.mjs](../recipes/emphasis-tile.mjs)。源关系：B09 `market-livingroom-study` 中实际使用的 `drawEmphasisTile`。原helper仅测advance，未完整约束字形高度与旋转后范围。新配方补齐两个边界，不迁移原scene，不升新族。

## 设计使用指导
先确定一句话中值得强调的词，而不是先找角度。强调词与前后文字形成完整语义：`MAKE MUSIC`＋`TRAVEL.`，`KEEP DOORS`＋`OPEN.`。斜贴词块是明确的阅读打断；一帧通常只使用一处。背景/词颜色需足够对比，不用多个随机角度代替品牌。

与typographic-focus的主副层级、expressive-type的挤出/切片不同，这是小范围的编辑强调配方。能够与它们同画布组合，但没有伪造本例实际共享族调用；现族仍14。

## API
`draw(ctx,p)`；bounds为允许旋转后完整落入的容器；x/y/width/height为旋转前词块；angle为−30至30度；padding≥2；baseline/fontSize/fontFamily/text/surface/ink均明确提供。示例参数见composition.mjs。

先验证所有矩形右/底、中心、四角和最终宽高有限且非退化，拒绝有限输入加法溢出或丢失精度；再计算四角旋转坐标与1px抗锯齿余量，拒绝最终包围盒越界；再检查文字实际左右bearing、advance、上伸/下伸是否在词块内。拒绝空/换行、长文本和非有限尺寸。不自动缩字、换行或转为竖排。字形guard是本渲染器的保守边界，不保证所有字体/浏览器完全一致。

通过所有检查才绘制，无shadow/filter、alpha1/source-over，恢复调用者样式与transform。返回corners、paintBounds、measuredAdvance。调用者须提供不与其他内容交叠的容器；模块不是自动行内流排或碰撞规避器，已有clip仍生效。

不提供原helper的额外描边/任意tracking：本轮没有验证这些维度，不能把源所有参数照搬成通用能力。字体权限及font registration属于调用者，样例用包外锁定字体。

verify包含旋转后包围盒像素检查、词宽/基线拒绝、目标零变更与状态恢复。两组合仅教学技术验证，未获用户审美认可。
