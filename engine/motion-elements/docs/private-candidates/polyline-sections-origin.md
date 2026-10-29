# 折线路径区间提取（独立本地候选，未注册）

一个机制：按累计弧长区间提取折线，保留区间中的**全部原折点**。不是新的完整路径系统，不把compile或元数据分开计数。尚无实际影片消费、用户艺术认可、常速/听审或公共发布证据。

## 与已有库去重

已读既有 `engine/motion-elements/lib/path.mjs` 与 `foundations/geometry/cubic-path.mjs`：

- `compilePolyline/samplePath` 已能编译折线和查单个距离点；这一编译职责不算本项创新。
- `sampleTrail` 按固定samples均匀取距离点；直接连接会漏掉不落在采样位置的转角。
- 本项输出两个边界切点＋区间内部每个原顶点，点数由几何/区间决定，不由samples决定；保持原折线而不是用采样折线近似它。
- 不涉及Cubic Bezier求值、弧长逆求、圆角生成、平滑、路径拓扑修复或布尔运算。若作者用折线近似曲线，本项只忠实保留那条折线，不声称恢复解析曲线。

编译函数只为隔离严格合同、共享累计数据与品牌，不是第二个基础机制；未来集成时可以评估与旧编译支持层共用，但本次不改变旧API或其输入域。

## API

```js
import {compilePolylineSections,extractPolylineSection} from './lib/polyline-sections.mjs';
const plan=compilePolylineSections({points:[
  {x:0,y:0},{x:3,y:0},{x:3,y:4},{x:8,y:4}
]});
const section=extractPolylineSection(plan,{startDistance:1,endDistance:10});
// section.vertices positions: (1,0), (3,0), (3,4), (6,4)
```

返回 `{startDistance,endDistance,length,empty,vertices}`。每个vertex含 `{position,distance,sourceVertexIndex,segmentIndex,parameter}`。边界不落原顶点时sourceVertexIndex为null；原顶点保留其索引与精确坐标。输入负零规范为正零；这里精确保留指规范化后的plan坐标。vertex恰落折点时segmentIndex指向出段、parameter=0；末端指最后入段、parameter=1。这只是地址身份，不表示双边切线或平滑接头。

调用方可以moveTo首点、lineTo余点；`empty=true`时不自动画线/圆点。不含Canvas adapter、样式、时钟或历史状态。

## 有限域与退化行为

- `points`为当前realm普通密集Array，2..4096点；每点恰有x/y，有限坐标各±1e6。
- 每段Math.hypot长度至少1e−9；累计长度必须严格增加且≤1e9。相邻重复点、过短段、加到长累计值后丢失增量的段均拒绝，不静默删点。
- 区间两端为有限number、`0≤startDistance≤endDistance≤totalLength`，不接受有理数、字符串、比例progress或隐式clamp。
- 零区间返回一个锚点且empty=true；落原折点也不插重复点。常规区间的两端恰落原顶点时各保留一次。
- 非相邻同位置、折返、共线冗余点允许并保留。显式首末同坐标形成closedCoordinates标识，但首末仍有不同distance/索引身份。
- 不自动close、不wrap、不跨缝、不反向。调用者要跨显式闭合接缝时自行取两个区间并决定是否连接；本机制不做此拓扑策略。
- plain或null-prototype记录只接受确切自身data字段；getter、Symbol、隐藏额外字段、稀疏/派生数组拒绝且不执行getter。不把此合同当作恶意Proxy或篡改内建对象的安全沙箱。
- 输入复制、plan及结果深冻结；仅本模块实例编译的plan可用。序列化原始点重编译，不接受伪造plan。

## 精度与资源

累计距离由IEEE Math.hypot及加法计算，不是精确实数弧长。精确相等比较依照公开的vertexDistances；不按epsilon吸附到顶点。

内部切点在相邻两个**存储的累计边界**之间线性插值，分母为endDistance−startDistance，以保持边界一致与局部参数在[0,1]。该差可能不逐位等于单段Math.hypot，尤其长路径后的小段；不承诺任意尺度下统一相对长度精度。若累计增量消失则拒绝。极小但非零区间可能因坐标舍入返回同位置的两点，这仍保留非零区间身份，不伪装成empty。

编译O(N)时间/空间；边界二分O(logN)，保留K个顶点约O(K logN)，输出最多N+2个顶点。无后台缓存、随机数或上帧依赖。参数由caller按绝对时间计算，倒序/重复/跳帧结果相同。

## 测试与参考

`node --test test/*.test.mjs`：独立逐线段裁切oracle对1200条整数路线/区间、折点精确边界、闭合缝身份、累计丢增量拒绝、4096点上限、严格数据/零getter执行、不可变性、乱序以及新Node进程。

2026-10-29实际读取 [W3C SVG2 Paths](https://www.w3.org/TR/SVG/latest/paths.html) 的路径、lineto/closepath与距离章节作为术语和边界参考。SVG允许的能力大于本候选；本模块不实现SVG解析、closepath接头语义或SVG完整规范。原理为基础分段直线几何，代码原创，没有复制规范示例/第三方实现。曲线细分资料仅曾搜索，未用于本限定折线实现。
