# 显式关键帧轨道（experimental）

<!-- asset-self-description: motion.keyframe-track -->

## 当前资产入口

本页是`motion.keyframe-track`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/keyframe-track.test.mjs)保留原断言。旧实现和专属测试位置不留wrapper；ui-foundations保留组合导航和历史证据。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


## 3. 关键帧轨道：明确等待与变化

从[index.mjs](index.mjs)导入；`T`为既有`rational`函数。

```js
const spec = {
  range: {start: T(1), end: T(5)},
  params: {knots: [
    {at: 0,    value: 0,   interpolation: 'hold'},
    {at: 0.25, value: 20,  interpolation: 'linear'},
    {at: 0.75, value: 100, interpolation: 'hold'},
    {at: 1,    value: 100, interpolation: 'linear'},
  ]},
};
const state = sampleKeyframeTrack(spec, T(3));
// {phase:'active', progress:0.5, value:60, segment:1}
```

- 时间使用字符串整数有理数；start≥0，end>start，end≤24小时。
- 2..256个连续数组节点；at严格递增，首尾精确为0和1。
- value为±1e9内有限数；interpolation只允许linear或hold。
- interpolation描述**离开该节点**后的区间；最后一个字段仍必填以保持结构一致，
  但没有离开终点的区间。
- 精确内部节点选择其后区间；达到/超过end返回最后精确值；start前返回首值。
  hold允许有意跳变，不是平滑ease。
- 区间选择按rational时间与数字节点的规范十进制表示精确比较，避免极近边界时
  浮点进度提前触发hold；线性区间先计算精确局部差和宽度，再转换为浮点比例，
  不从全局浮点progress相减，以免极近节点丢失区间内进度。

context只接受`{reducedMotion:boolean}`。为true时value取终值、segment取最后区间
索引`knots.length-2`，但phase/progress仍来自原项目时间。调用者应判断该策略是否
适合对应属性：承载信息的计数或逐字内容不一定应跳到终值。不据此宣称无障碍审查通过。


## 组合与历史证据

[共享UI布局指导](../../../../docs/ui-foundations.md)保留组合用法、实际作品证据和修复边界；当前艺术PENDING_USER、常速NOT_DONE、听审NOT_LISTENED、迁移NOT_RUN。旧片只用hold字符计数，linear区间来自合成测试，不扩大影片覆盖。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/motion/keyframe-track/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/motion/keyframe-track/test/*.test.mjs
```

保留共享validate/time/matrix及原timeline、transform/opacity依赖，不改Node arrival-validation支持边界，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

此采样函数不编译品牌计划，保存原始definition供任意顺序seek。结果复制并深冻，不保留可变输入或播放历史。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
