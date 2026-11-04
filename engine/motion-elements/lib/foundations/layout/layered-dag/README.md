# layered-dag（experimental）

<!-- asset-self-description: composition.layered-dag -->

## 当前资产入口

本页是`composition.layered-dag`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/layered-dag.test.mjs)保留原断言。旧实现和专属测试位置不留wrapper；原data-flow仅保留组合导航及作品历史，现役API合同以本页为准。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


## 分层DAG接口

```js
layeredDagLayout({
  nodes:[{itemId:'received',width:100,height:120},{itemId:'review',width:100,height:120}],
  links:[{linkId:'review-orders',fromId:'received',toId:'review'}],
  layerGap:160,nodeGap:40,
});
```

- nodes为0..64项，links为0..128项；所有对象/数组严格验证未知字段、稀疏、Symbol、null。
- itemId/linkId各自唯一，ID沿用ASCII `[a-zA-Z0-9_-]{1,64}`；端点必须存在。允许不同linkId的并行边，但拓扑邻居去重。
- width/height=.001..4096，layerGap=.001..4096，nodeGap=0..4096。
- 拒绝环和自边；空nodes只能配空links。无自动删边、修复或回退。
- 最长路径决定层；每层按最大节点宽度推进x。按实际高度和nodeGap排列，并垂直居中于最高一层。
- 层内先ID排序，再固定2轮双向barycentric sweep；邻居求和顺序按ID固定，避免输入边顺序影响浮点结果。不承诺最少交叉、不做避障布线。
- 返回深冻结`{items,placements,extent}`。items为标准layout字段；返回顺序/zIndex沿用nodes输入顺序，同ID几何不受nodes/links重排影响。placements为`{itemId,layer,order}`。empty extent为0×0。
- 有项时输出可接既有layout-handoff。返回范围不包含文字、描边、阴影，调用者负责父变换/视口和可读性。


## 组合与历史作品边界

本项是订单流转组合中的基础机制。保留LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT，不是优质作品或默认风格推荐；常速NOT_DONE、听审NOT_LISTENED、跨作品迁移NOT_RUN。

[组合责任与完整作品证据](../../../../docs/data-flow.md)保留实际调用、冻结runtime版本、修复桥接、用户有限接受及未验范围。目录共置不构成新影片等价、常速、听审或艺术接受；不能把共享章节中其他机制的调用归到本项。

[官方参考与许可决定](../../../../docs/data-flow-reference-decisions.md)保留原研究核查；不附私有影片/字体/声音或给出不存在的再分发许可。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/layout/layered-dag/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/layout/layered-dag/test/*.test.mjs
```

保留共享validate/matrix/math/time及原sampled-band/keyframe/weighted-flow依赖，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

返回状态复制并深冻。flow-handoff计划及weighted-flow使用的band品牌仅在同一canonical模块实例有效；保存原始输入重编译，不把JSON当品牌缓存。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
