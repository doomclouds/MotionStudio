# Layout handoff — experimental recipe

## 场景与效果
列表插入或移走一张卡片后，让同身份的其余卡片移动到新的位置；新增项淡入、移除项淡出。调用者提供两个实际布局，不用数组下标冒充对象身份。

这是新增 **recipe.layout-handoff 配方**，不是新增基础机制。实际调用既有 `sampleMotion` 的 `motion.transform` 与 `motion.opacity`，并复用共享 rational 时间、`curve` / `lerp` 完成rect插值与 `transformBounds` 计算几何边界；可接本批 grid/stack 或调用者提供的显式布局。没有自动决定新的排序或日历槽位。

## API

```js
import {compileLayoutHandoff,sampleLayoutHandoff} from '../lib/recipes/layout-handoff.mjs';
const plan=compileLayoutHandoff({from:oldLayout,to:newLayout,range:{start:{n:'1',d:'1'},end:{n:'3',d:'1'}}});
const {items}=sampleLayoutHandoff(plan,{n:'2',d:'1'},{reducedMotion:false});
// 每项 itemId、rect、matrix、zIndex、geometryBounds、opacity、role
```

每侧为标准 layout 数组，最多128项，联合身份最多128项；可一侧空，不能同时空。itemId唯一，rect正尺寸；matrix只接受 `[1,0,0,1,x,y]`。rect与translation限制±1e7局部单位，尺寸0.001..1e7；geometryBounds是派生几何，坐标和可达±2e7，尺寸允许浮点消减误差，但必须与rect/matrix重算结果相差不超过1e-7。拒绝稀疏数组、未知字段、非有限值、重复ID及非平移矩阵。range沿用start≥0、duration>0、end≤24小时有理数时间。

共享项位置和rect尺寸按smoothstep插值；新增项在终布局位置淡入，退出项在原位置淡出。输出身份顺序固定为to数组顺序再接退出项，zIndex重新按此顺序编号；不保持原zIndex数值，不自动解决遮挡。before/after夹到端点，透明的退出项仍保留身份。输入复制、输出深冻结，编译对象不能序列化冒充缓存。

reducedMotion只让共享项直接使用终态位置/尺寸；不改变phase/progress、进入退出透明度或时间段。这里是一个明确静态空间策略，不保证适合所有无障碍情境。

## 限制与证据
不能插值旋转/skew/透视，不处理碰撞、文字重排、手势物理、跨场景资源装载或内容宽高测量。内容绘制与Canvas状态隔离由调用者负责，本配方只输出纯状态。

复现工程检查：`node --test engine/motion-elements/test/layout-handoff.test.mjs`。测试覆盖身份与端点、非法输入、最小尺寸布局衔接、派生坐标上限、Native像素乱序复现、全新进程一致性。

私有候选影片有已独立核查的实际调用回执，只覆盖shared身份插值；调用者显式重映射时钟，不代表配方原生支持任意缓动曲线。影片进入/退出是项目编排，不能算本配方淡入淡出被该片验证。已检查解码帧未发现阻断；正常速度连续观看NOT_DONE，实际听审NOT_LISTENED，用户艺术认可PENDING_USER，原创生产迁移NOT_RUN。影片冻结制作版本与后续边界修复版本须由独立等价回执区分，不得仅凭本文件声称新版本重新制作过影片。
