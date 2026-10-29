# 固定半开区间最少分轨（experimental）

## 场景和唯一新增机制

在排期或片段时间条中保留所有固定时间范围，以不同轨道显示互相重叠的项目；调用者明确更改某个范围后，再计算新的静态轨道快照。这里只分配轨道，**不更改时间、不筛掉项目、不自动解决排程**。

与既有grid、stack、flow-wrap不同，轨道成员由时间重叠决定，不按格子、输入宽度或单轴顺序分组。sticky-interval是滚动位置钳制，不是此重叠分轨。已有layout-handoff负责同ID位置交接，不重复计数；本批另有显式staged-layout-handoff配方，单独计配方而非基础；单位、颜色、方向和轨数不是多个机制。

## 接口与合成例子

```js
import {intervalLaneLayout} from '../lib/foundations/layout/interval-lanes.mjs';
const result = intervalLaneLayout({
  items: [
    {itemId:'segment-a',start:0,end:4},
    {itemId:'segment-b',start:2,end:6},
    {itemId:'segment-c',start:6,end:10},
  ],
  domain:{start:0,end:12}, width:480, laneHeight:36, laneGap:12,
});
// result.items -> old compileLayoutHandoff({from:...,to:...,range})
// result.laneCount === 2
```

所有字段必填。对象必须是当前realm的plain或null-prototype记录；未知字符串/symbol/不可枚举自有字段拒绝，已知字段可以不可枚举。getter/Proxy不是安全沙箱。

| 参数 | 限制 |
|---|---|
| `items` | 当前realm普通稠密Array，0..128项，无额外字段/子类/稀疏位置 |
| 每项 | 恰含`itemId,start,end` |
| `itemId` | 唯一ASCII `[a-zA-Z0-9_-]{1,64}` |
| `domain` | 恰含`start,end`，两者为±1,000,000内有限number，且start<end |
| 项目start/end | 同一有限number域，start<end，全部包含于domain |
| `width`,`laneHeight` | `.001..10000`有限number |
| `laneGap` | `0..10000`有限number |

单位完全由调用者统一，比如秒、分钟或抽象坐标。这里不调用旧rational时间模块，也不接受Time对象、日期字符串、时区、日历或递归事件。零时长区间拒绝；空items合法，轨数/高度0。任何非法项或过小投影使整次调用失败，不返回部分结果。

## 半开、排序和最少轨数

每项是半开`[start,end)`。上一项end等于下一项start可以共轨，没有隐藏epsilon。排序为start升序、end升序、最后按itemId的ASCII词典顺序；不使用localeCompare或输入索引决定tie。

按此顺序处理，选择**索引最小的可用轨道**（该轨最后end<=当前start）；没有可用轨道才新增。这不是选最早结束的轨道，两者都可达到最少数量，但本版固定前者以给出确定轨号。算法只使用当前输入，不保留历史。

最少数量的理由：新增第k条轨道时，之前k−1条轨道都仍在当前start处占用，加上当前项目，至少k项同时存在，任何有效分配至少需要k轨。每条已分配轨道又从不含时间重叠，所以该下界同时被达到。这个保证只针对互换、无其他偏好约束的固定区间，不适用于真实房间资格、优先级或自动改期。[Illinois CS473区间分区讲义](https://courses.grainger.illinois.edu/cs473/sp2011/Lectures/lecture11.pdf)第72–90页（零基71–89）区分了此问题与“选择一个不重叠子集”的interval scheduling；后者不是本接口。

同一ID/端点集合无论输入如何排列，lane成员与轨号相同；输出items和zIndex仍按输入顺序。**修改时间/增删项目后，不保证原ID继续留在原轨**，不追求最小搬移量或跨快照轨道稳定。

## 返回与坐标

```text
{
  items:[{itemId,rect:{x:0,y:0,width,height},matrix,zIndex,geometryBounds}],
  lanes:[{itemIds,y,height}], laneCount, width, height, domain:{start,end}
}
```

- items是旧translation-layout精确字段形状，无额外lane字段，直接供旧handoff消费；zIndex是0基源索引。
- lanes数组索引即轨号，itemIds按该轨时间排序；y=`laneIndex*(laneHeight+laneGap)`，height=laneHeight。
- 外层width是请求的总宽；height是最后轨底部，没有末尾gap。空items仍保留请求的width和domain。
- 域内横坐标按`x=((start-domain.start)/(domain.end-domain.start))*width`、`right=((end-domain.start)/(domain.end-domain.start))*width`计算，rect.width=`right-x`，rect.height=laneHeight。matrix平移至(x,轨y)。父原点、clip、字体和标注由调用者处理。
- geometryBounds使用已有transformBounds，仅矩形几何，不含文字、阴影、边框或实际墨迹。所有返回值复制/深冻，不暴露可写状态。

## IEEE和派生域限制

端点比较针对**实际传入number值**精确比较，不宣称它代表十进制意图的任意精度实数。比如`.1+.2`不自动等于`.3`；±0比较相等，复制domain可以保留−0，但矩阵/JSON序列化可能归一为+0。

输入domain的正span可以很小，甚至最小正subnormal；不设虚构的时间精度，但按上述IEEE公式映射。两个映射端点可能重合，或相减得到小于`.001`的宽度，均拒绝，**不clamp、不放大、不epsilon吸附**。此门维持旧handoff对局部rect的最小尺寸合同。数学上合法的区间并不保证在请求的像素尺度下可接受。

相接时间用同一横坐标公式，轨道分配在时间域判定；矩形再经过浮点相加/相减，可能有很小边缘/派生bounds差异，不保证任意变换后逐像素无缝或不触边。不得把几何数值与抗锯齿墨迹视为同一性质。

最多128轨、最大高度/间隙下，y≤2,540,000，总height≤2,550,000；x与局部宽在0..10000且宽≥.001，兼容已有矩阵与handoff范围，不需改共享runtime。复杂度为有限排序及最多128×128轨扫描，无不受限迭代、全局缓存或随机状态。这不等于长片Native内存或实时性能保证。

## 交接不是连续冲突求解

调用者可明确编辑时间，得到两个快照后交给旧layout-handoff；拖动/吸附/松手时机仍属于项目编排。插值中的项目可以相互遮挡，不保证每一帧满足瞬时区间排轨或容器约束；lanes只描述端点静态快照，不随handoff自动更新。

空→非空可用旧recipe；空→空仍被旧recipe拒绝，不因本API允许空布局而放宽。纯分轨没有reducedMotion字段；调用者可保持原时段而固定目标快照，或沿用旧handoff的reducedMotion终态策略，视觉可读性另验。

## 参考实现与许可取舍

实际阅读20库中的Anime.js固定提交[`01b81be1df6843ccfe0a71c0699a746bf740dd77`](https://github.com/juliangarnier/anime/tree/01b81be1df6843ccfe0a71c0699a746bf740dd77)的[`timeline/position.js`](https://github.com/juliangarnier/anime/blob/01b81be1df6843ccfe0a71c0699a746bf740dd77/src/timeline/position.js)（blob`982a8d658b49296b1429e58cce680dbe610c1cfa`）与[MIT LICENSE.md](https://github.com/juliangarnier/anime/blob/01b81be1df6843ccfe0a71c0699a746bf740dd77/LICENSE.md)（blob`f999fa58ebdda6d8d0f3ae581ebdfe821f09603a`）。该源码解析数值、标签和相对动画时间位置，不实现这里的最少轨道分区。只借鉴“时间编排和几何布局分开”的责任边界，不误称Anime提供该算法、不复制其源码，不引入新时钟或依赖。

本实现是原创有界区间分配；讲义用于核对算法性质，不移植代码或转载图表。未安装库、下载字体/媒体，也不将外部日历产品的完整行为当成本API合同。

## 验证状态

测试覆盖普通/嵌套/相接/相邻浮点区间、同起点tie、最小free轨、空/最大输入、严格拒绝、映射下限、输入复制与深冻、排列不变性、独立BigInt端点深度oracle、旧handoff端点/reduced兼容及Native乱序/新进程合成像素。

实际8秒/480帧有声候选中，2次初始化产生3轨与2轨两个静态快照，随后由新显式分阶段交接配方消费。没有把松手编排伪称当帧重新分轨。480次配方采样中313帧提交1252次卡片绘图，312帧Native alpha为正（首提交帧alpha量化为0）；采样/提交/可见不能互换。运行时与10文件闭包同原冻结源码逐字节相等；总index是后续接入，不是原片导入。独立全状态/实际Canvas、33新进程代表帧和42实际编码节点限定审通过。真实媒体/源hash/帧范围/调用回执私有保存，不进入公共库。常速NOT_DONE、听审NOT_LISTENED、用户艺术PENDING_USER、跨场景迁移NOT_RUN；不由数学测试或限定帧审升级。
