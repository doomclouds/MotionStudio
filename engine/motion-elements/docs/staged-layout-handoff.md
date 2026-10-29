# Explicit staged layout handoff (experimental recipe)

## 场景与可感知效果
当同一批卡片需要**先横移、再收轨**，或者**先腾行、再横移**时，调用者明确提供中间布局与各阶段时间。该配方统一绝对时间采样、阶段边界及身份顺序，不要求项目在渲染中自行维护当前阶段。

这是 **1 个配方，不是新增基础机制**。复用既有 `compileLayoutHandoff` / `sampleLayoutHandoff`（内部再复用 `motion.transform`、`motion.opacity`）；不新造插值器。所有阶段沿用旧配方 smoothstep，无可选曲线、自动避碰、waypoint生成、时间重映射、缩时、DOM或依赖安装。

## 最小调用

```js
import {compileStagedLayoutHandoff,sampleStagedLayoutHandoff}
  from '../lib/recipes/staged-layout-handoff.mjs';
import {rational as T} from '../lib/time.mjs';
import {transformBounds} from '../lib/matrix.mjs';

// before/after 均为标准translation-layout数组。重算waypoint的bounds。
const waypoint=before.map(a=>{
  const b=after.find(v=>v.itemId===a.itemId);
  const matrix=[1,0,0,1,b.matrix[4],a.matrix[5]];
  return {...a,matrix,geometryBounds:transformBounds(matrix,a.rect)};
});
const plan=compileStagedLayoutHandoff({
  snapshots:[before,waypoint,after],
  ranges:[{start:T(1),end:T(2)},{start:T(2),end:T(4)}],
});
const state=sampleStagedLayoutHandoff(plan,T(3),{reducedMotion:false});
// state: {phase,progress,stageIndex,stageProgress,items}
```

位置单位为调用者局部坐标，时间为秒的共享rational字符串整数。上述1–2秒横移、2–4秒收轨是独立合成演示时段，不取自任何作品制作时点，不是隐藏默认值。调用者可以使用另一顺序及其它正时长，不能把已有作品使用项目代码的历史倒填成调用了新配方。

## 输入与资源合同
- `snapshots`：3..17个快照；每快照1..128项，每项标准 `{itemId,rect,matrix,zIndex,geometryBounds}`。每快照ID唯一，所有快照**严格同一ID集合**，禁止进入/退出或空快照。
- 所有快照按首快照ID顺序归一，再交给旧配方。输出顺序固定、`zIndex`重编为0起始顺序，**不是保留输入zIndex数值**。原数组顺序可以不同，不能借此在边界突然换层。
- `ranges`：2..16段，数量为快照数减一；每段严格正时长，相邻 `end == next.start` 以有理数精确比较，拒绝重叠、间隙、倒序和零时长。总范围仍须0..24小时。
- 顶层数组、每快照数组、每matrix均要求同realm普通稠密Array；拒绝Array子类、跨realm数组、空洞、附加字段/方法/Symbol。record沿用旧plain-object/null-prototype合同，未知/缺失/null字段不放宽。
- 平移矩阵只接受 `[1,0,0,1,x,y]`；坐标/translation为±1e7，rect尺寸0.001..1e7；派生bounds坐标±2e7，必须满足旧配方1e-7一致性检查。尺寸可以逐阶段改变，但不能旋转、缩放或shear矩阵。
- 输入复制并深冻结，结果品牌仅当前模块实例有效；JSON复原数据必须重新compile，不能冒充缓存。最多16×128阶段项目负担，不创建播放时钟或帧历史缓存。

## 采样边界与reduced motion
- `phase`、`progress`属于**整个范围**。`stageIndex`为0基索引，`stageProgress`是旧配方的**原始linear时钟进度**，不是smoothstep空间进度；不能再将它ease后重复施加位置。
- 内部边界精确属于后一段：2秒为段1、局部进度0。总终点属于最后段、局部进度1。之前选首段起点，之后选末段终点。
- 正常模式每段 `items` 与按首序归一输入后单独调用旧配方完全等价。所有项 `role:'shared'`、`opacity:1`。
- `reducedMotion:true` **所有时间包括before** 都采用全局最后快照位置/尺寸；总phase/progress、阶段选择及stageProgress仍保持原时钟。不是逐段跳至各自终点。
- 共享rational的输入及归一化算术结果有30位整数限制；即使输入各自合法，求时差/总duration/采样局部时差仍可能超限而抛错。这里不扩大核心限额、不隐式转float避错、不自动量化。测试包含compile和sample的中间算术超限反例。

## 验证与限制

运行：`node --test engine/motion-elements/test/staged-layout-handoff.test.mjs`。
工程测试覆盖正常/非法输入、边界阶段归属、规范顺序下旧API数值及Native像素等价、乱序seek、跨plan隔离、新进程一致、16阶段×128项资源上限、超界拒绝与reduced全局终态。

这不保证中间不碰撞、不保证速度连续（每段旧smoothstep在边界停顿）、不自动产生有意义waypoint、不处理新增/删除项。影片中卡片关系正确与艺术质量须独立审查。

实际8秒/480帧有声候选调用1次compile、480次公开sample，内部旧handoff/motion不另报新增机制。两个静态interval-lanes快照与一个调用者明确构造的waypoint控制同ID交接；313帧提交1252次卡片绘图，312帧Native alpha为正。原冻结运行时及10文件闭包逐字节相等，独立全状态/实际Canvas、33新进程代表帧和42编码节点限定审通过。历史项目先腾行再横移仅为需求来源，没有调用此API的作品绝不倒填为调用证据。真实时点/参数/hash/逐帧回执私有留存；公共例子是另构合成数据。常速NOT_DONE、听审NOT_LISTENED、用户艺术PENDING_USER、跨场景迁移NOT_RUN。技术/限定帧通过不是作品风格推荐。

## 官方机制研究与许可

核查 Anime.js v4.0.0 固定commit `3552e706433ebd22010c631d875b31f17a52985c`：
- [timeline源码](https://github.com/juliangarnier/anime/blob/3552e706433ebd22010c631d875b31f17a52985c/src/timeline.js)：参考显式子段位置与统一timeline入口这一原理；没有采用其有状态Timer、DOM、标签或动态时间拉伸实现。
- [MIT许可证](https://github.com/juliangarnier/anime/blob/3552e706433ebd22010c631d875b31f17a52985c/LICENSE.md)，Julian Garnier 2025。

本模块为基于既有MotionStudio纯采样接口的原创组合；没有复制Anime.js代码、没有引入其runtime，也没有将参考阅读等同于集成验证。
