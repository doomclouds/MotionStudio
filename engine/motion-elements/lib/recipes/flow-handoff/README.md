# flow-handoff（experimental）

<!-- asset-self-description: recipe.flow-handoff -->

## 当前资产入口

本页是`recipe.flow-handoff`当前合同，状态与证据登记在[catalog](../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/flow-handoff.test.mjs)保留原断言。旧实现和专属测试位置不留wrapper；原data-flow仅保留组合导航及作品历史，现役API合同以本页为准。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


## 流量交接配方

```js
const plan=compileFlowHandoff({nodes:layout.items,from:beforeLinks,to:afterLinks,
  range:{start:T(4),end:T(9)},unitsToPixels:0.9,portGap:8,samples:128});
const state=sampleFlowHandoff(plan,T(6),{reducedMotion:false});
// {phase,progress,flow:{links,ports,balances}}
```

from/to必须拥有同一组linkId和相同端点，节点几何不变；返回links始终按to顺序。v1每条链路必须两端同为0（恒隐）或两端同为正；不支持0与正值之间的出现/消失，不能用任意近时点的不可表示正宽度让渲染中途抛错。正链路还须满足保守数值裕量：两端最小半宽至少为`32 * Number.EPSILON * max(1, abs(node.bounds.y)+node.bounds.height+1)`（对全部节点取最大值）。这是一项明确的编译域限制，不隐式阈值掉小流量、不伪造量纲。内部节点（同时有输入和输出链路）两端快照必须守恒，source/sink可不平衡；仅容许`32 * Number.EPSILON * max(incoming,outgoing)`的相对求和误差；双零通量容差为0，不使用单位1的绝对下限，以免微量流量被允许凭空倍增。没有外部业务数据验证或自动推导缺失流量。

range沿用start≥0、end>start、end≤24小时rational Time。**共享时钟限制：输入Time分子/分母各不超过30位，中间差分也受同一位数上限约束；极端异分母输入即使各自合法，仍可能抛`Rational exceeds 30-digit bound`。因此不保证每个合法Time组合都能seek。调用者应在渲染前验证计划使用的时间集合，优先使用同一项目帧率生成的时钟；本批不改已发布共享时钟。**配方用旧keyframe求绝对进度、旧smoothstep求空间混合比例；from/to端点值精确保留；对称调用旧lerp避免大到小的消减。reduced直接使用终态权重，但仍返回原phase/progress/时段；是否适合信息变化要由调用者决定，不能据此宣称无障碍通过。

纯状态输出，不绘图/播放声音/写全局时钟；输入复制、输出深冻结，plan仅同模块实例认可。它不是拓扑形变、流体模拟、订单调度算法或实际吞吐提升功能。


## 组合与历史作品边界

本项是订单流转组合中的配方。保留LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT，不是优质作品或默认风格推荐；常速NOT_DONE、听审NOT_LISTENED、跨作品迁移NOT_RUN。

[组合责任与完整作品证据](../../../docs/data-flow.md)保留实际调用、冻结runtime版本、修复桥接、用户有限接受及未验范围。目录共置不构成新影片等价、常速、听审或艺术接受；不能把共享章节中其他机制的调用归到本项。

[官方参考与许可决定](../../../docs/data-flow-reference-decisions.md)保留原研究核查；不附私有影片/字体/声音或给出不存在的再分发许可。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/recipes/flow-handoff/examples/contract.mjs
node --test engine/motion-elements/lib/recipes/flow-handoff/test/*.test.mjs
```

保留共享validate/matrix/math/time及原sampled-band/keyframe/weighted-flow依赖，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

返回状态复制并深冻。flow-handoff计划及weighted-flow使用的band品牌仅在同一canonical模块实例有效；保存原始输入重编译，不把JSON当品牌缓存。代码适用[包MIT许可](../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
