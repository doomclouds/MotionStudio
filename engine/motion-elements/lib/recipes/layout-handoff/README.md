# Layout handoff — experimental recipe

<!-- asset-self-description: recipe.layout-handoff -->

## 当前资产入口

本页是`recipe.layout-handoff`当前合同，状态与证据登记在[catalog](../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/layout-handoff.test.mjs)保留原断言。旧guide、实现和测试位置不留wrapper。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


## 场景与效果
列表插入或移走一张卡片后，让同身份的其余卡片移动到新的位置；新增项淡入、移除项淡出。调用者提供两个实际布局，不用数组下标冒充对象身份。

这是新增 **recipe.layout-handoff 配方**，不是新增基础机制。实际调用既有 `sampleMotion` 的 `motion.transform` 与 `motion.opacity`，并复用共享 rational 时间、`curve` / `lerp` 完成rect插值与 `transformBounds` 计算几何边界；可接本批 grid/stack 或调用者提供的显式布局。没有自动决定新的排序或日历槽位。

## API

```js
import {compileLayoutHandoff,sampleLayoutHandoff} from './index.mjs';
const plan=compileLayoutHandoff({from:oldLayout,to:newLayout,range:{start:{n:'1',d:'1'},end:{n:'3',d:'1'}}});
const {items}=sampleLayoutHandoff(plan,{n:'2',d:'1'},{reducedMotion:false});
// 每项 itemId、rect、matrix、zIndex、geometryBounds、opacity、role
```

每侧为标准 layout 数组，最多128项，联合身份最多128项；可一侧空，不能同时空。itemId唯一，rect正尺寸；matrix只接受 `[1,0,0,1,x,y]`。rect与translation限制±1e7局部单位，尺寸0.001..1e7；geometryBounds是派生几何，坐标和可达±2e7，尺寸允许浮点消减误差，但必须与rect/matrix重算结果相差不超过1e-7。拒绝稀疏数组、未知字段、非有限值、重复ID及非平移矩阵。range沿用start≥0、duration>0、end≤24小时有理数时间。

共享项位置和rect尺寸按smoothstep插值；新增项在终布局位置淡入，退出项在原位置淡出。输出身份顺序固定为to数组顺序再接退出项，zIndex重新按此顺序编号；不保持原zIndex数值，不自动解决遮挡。before/after夹到端点，透明的退出项仍保留身份。输入复制、输出深冻结，编译对象不能序列化冒充缓存。

reducedMotion只让共享项直接使用终态位置/尺寸；不改变phase/progress、进入退出透明度或时间段。这里是一个明确静态空间策略，不保证适合所有无障碍情境。

## 曲线选择与时钟边界

[实现](index.mjs)固定使用 smoothstep：共享项位置/尺寸与进入/退出透明度使用同一曲线；没有可选 `curve` 字段。返回的 `phase/progress` 描述传入时间在 range 中的位置，`progress` 是线性时钟进度，不是缓动后的空间进度。不能再把它直接当作已采样几何的进度，令文字、图标与容器错拍。

单个对象的简单位置或尺寸变化若已有明确速度要求，优先用现有 [ease / lerp](../../math.mjs) 保持同一个内容进度，不必为了调用配方引入身份匹配或额外时钟。需要显式变换轨道时，[sampleMotion 的曲线合同](../../../docs/guides/core-api-and-time.md)另有 linear、smoothstep 和受限 cubic-bezier；缩放整个内容不等于容器改变尺寸后的内容重排。

有界参考：[Tessel 编排](https://github.com/doomclouds/MotionStudio/blob/9806a1bd7c44f44cb331576b032417f58c655081/portfolio/works/tessel/src/choreography.mjs)对 shared 日程项先求目标空间进度，再用[反 smoothstep](https://github.com/doomclouds/MotionStudio/blob/9806a1bd7c44f44cb331576b032417f58c655081/portfolio/works/tessel/src/math.mjs)构造合成采样时间；返回矩形供场景绘制。这是调用者适配，不是配方原生支持任意曲线，也不证明新内容或整片审美通过。

若采用这种适配，点击、字幕、阅读停留仍用原项目时间；返回的 `phase/progress` 对应合成时间，不能混作原时间或直接推进 [staged-layout-handoff](../staged-layout-handoff/README.md) 的阶段边界。还需核端点、量化误差、所需曲线的单调性，以及新进/退出透明度是否也被改速。Tessel 的进入/退出由项目另行编排，不能据此宣称这些透明度路径已获该场景验证。先比较直接使用底层 API 的代价；本说明不新增 API、通用重映射器或兼容层。

## 限制与证据
不能插值旋转/skew/透视，不处理碰撞、文字重排、手势物理、跨场景资源装载或内容宽高测量。内容绘制与Canvas状态隔离由调用者负责，本配方只输出纯状态。

复现工程检查：`node --test engine/motion-elements/lib/recipes/layout-handoff/test/layout-handoff.test.mjs`。测试覆盖身份与端点、非法输入、最小尺寸布局衔接、派生坐标上限、Native像素乱序复现、全新进程一致性。

私有候选影片有已独立核查的实际调用回执，只覆盖shared身份插值；调用者显式重映射时钟，不代表配方原生支持任意缓动曲线。影片进入/退出是项目编排，不能算本配方淡入淡出被该片验证。已检查解码帧未发现阻断；正常速度连续观看NOT_DONE，实际听审NOT_LISTENED，用户艺术认可PENDING_USER，原创生产迁移NOT_RUN。影片冻结制作版本与后续边界修复版本须由独立等价回执区分，不得仅凭本文件声称新版本重新制作过影片。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/recipes/layout-handoff/examples/contract.mjs
node --test engine/motion-elements/lib/recipes/layout-handoff/test/*.test.mjs
```

保留共享validate/time/matrix及原timeline、transform/opacity依赖，不改Node arrival-validation支持边界，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

计划品牌仅当前canonical模块实例有效；保存原始定义并重新compile。结果复制并深冻，不保留可变输入或播放历史。代码适用[包MIT许可](../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
