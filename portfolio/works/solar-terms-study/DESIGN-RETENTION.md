# 节气行 · 让当季颜色贯穿内容

来源：https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/east/07-traditional-colors-solar-terms.html

## 设计逻辑
朱砂先进入主标题，再出现在当前寒露色条和路线四色中，三个尺度的相同身份建立内容联系。24色条保留节气顺序，寒露以更宽更高突出；纸色留白和宋体减少噪声，让红叶和季节成为主角。

## 重建方式
material-surfaces真实绘制路线卡底，边框半像素校准。24条数据和选中索引已提取为本案例可调用配方；完整页调用寒露16，提取前后帧字节一致。另有冬至21的独立色条验证，不冒充整页自动更新或第二件新作品。

## 边界与残差
这是Huashu节气路线设计样例，日期与节气关系、路线11.4km/5h/620m及海拔三百米先红的文案未核实，不作出行建议。传统色名与hex是源作的设计对应，不是标准色认证。条宽/高度表达选中，非数量大小；字体/JPEG/卡边细节有残差，未验证实际交互或视频。


## 可复用判断、反例与迁移
相同内容身份在标题、当前色条、路线色卡三个尺度呼应；先确定当季身份和序列，再决定强调面积。条的宽高表示选中不是数量，不可用于金额/里程等定量比较。

关联代码：design/scene.mjs 真实调用 material-surfaces.draw 一次；design/seasonal-strip.mjs 导出 drawSeasonalStrip，数据在 terms.json。固定 1200×232、恰24项、2字节气名/1–3字色名，索引0–23、hex色、有限原点，字体由调用方注册。完整页使用16寒露，另测21冬至及8个非法输入；仅色条语义与几何更新，不是整页冬至文案自动生成，也未验证 Latin 标签、任意字体/画幅。候选案例配方不计公共族。

## 验证与入口
用户已收藏，完整入口 design/scene.mjs，运行见 README。独立视觉审查与精确 Native 恢复范围分开记录在 retention.json。换内容必须重新检查信息顺序、事实边界和字形溢出；不能据静态通过声称 Motion 迁移完成。

## 后续组合研究

[recipe.ordered-focus.v1](../../../engine/design-elements/recipes/b06/docs/ordered-focus.md)：原场景内seasonal-strip原样快照被新组合复用；原场景未调用此新组合。组合以两份合成内容通过有限静态技术/视觉复核，不计新族，也不是用户对新作品的审美验收。
