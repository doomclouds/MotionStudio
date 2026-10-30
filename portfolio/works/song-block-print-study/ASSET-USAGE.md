# B05 实际积木账单

- design.material-surfaces.v1：宋刻实际调用 paper / elevation 0 / radius 0 一次，绘出纸叶基础；纸缘内晕另由案例代码绘制，不声称积木已实现宋刻版式。
- design.color-sections.v1：包豪斯实际调用一次，690/510 两区分别为几何场黄色基础和米白节目单；几何场的两块黄色仍来自本调用，九格物件另按源作绘制，不删改为通用卡片。
- print-poster：未使用，宋刻是版框不是硬偏移纸签；包豪斯没有错印字影。
- typographic-focus：未使用，原作纵排版心和精确双行彩色主标题不适用通用横排焦点合同。
- semantic-data：未使用，气象文字是样例记述、圆方三角是剧目身份，不是可量化数据编码。
- parameter-controls：未使用，无参数调节器；订票按钮不是滑杆。
- expressive-type：未使用，无切片/挤压/多层错影字效。
- radial-scale：未使用，左侧圆弧是造型不是刻度或读数。
- diagonal-field：未使用，包豪斯个别三角是九格局部物件，不是全画面的斜向场。
- authored-paths：未使用，本例路径是定点基础圆弧/鱼尾，没有路径叙事或可复用曲线接口需求。

新增公共族0。仅案例特定能力：纵列、emphasis侧占位、鱼尾版心、内纸晕和精确几何拼贴。收藏准备时已核实际调用回执与重渲染同帧；每例1次真实成功调用；不把调用次数当审美分数。代码需要外置 MOTION_UI_ASSETS_ROOT，模块哈希见 ui-dependencies.json，用户已验收收藏，发布由统筹流程执行。
