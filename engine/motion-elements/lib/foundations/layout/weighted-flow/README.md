# weighted-flow（experimental）

<!-- asset-self-description: composition.weighted-flow -->

## 当前资产入口

本页是`composition.weighted-flow`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/weighted-flow.test.mjs)保留原断言。旧实现和专属测试位置不留wrapper；原data-flow仅保留组合导航及作品历史，现役API合同以本页为准。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


## 加权流接口

```js
weightedFlowLayout({
  nodes:layout.items,
  links:[{linkId:'review-orders',fromId:'received',toId:'review',value:60}],
  unitsToPixels:0.9,portGap:8,samples:128,
});
```

- nodes为0..64项标准平移layout；rect坐标/translation为±1e7，rect尺寸.001..1e7，geometryBounds须一致。拒绝非平移矩阵、重复节点、陈旧bounds。
- links为0..128项，linkId唯一，value=0..1e6，unitsToPixels=.001..1000，portGap=0..10000，samples=2..256整数。
- 只支持左节点右边缘到右节点左边缘，且必须正向分离；不支持反馈环、回头线或同x垂直连接。
- 竖向厚度=value×unitsToPixels。输入/输出各自按对侧节点中心y、对侧ID、linkId排序；端口组在节点高度内居中。
- 每侧sum(thickness)+(linkCount−1)×portGap必须容纳于节点高度，最多容许32个相应数值量级的机器epsilon舍入误差。禁止暗中压缩量纲或重叠端口。
- **零权重链路仍保留其身份和端口间距**，形状退化不绘制；恒零身份保留自己的位置，不代表配方支持0↔正值交接。若要移除身份，应另做有明确策略的拓扑交接，不用本配方。
- 中心线以单调x和smoothstep y采样；竖直半宽不变。它是分段线性带形包络，不是等法线宽度的描边。采样不足可能有折线感，不能宣传精确曲线或抗锯齿等价；无法表达为严格递增x/正厚度的浮点几何会拒绝。
- 返回`{links,ports,balances}`，包括每条实际编译的旧机制band；可以用已有`drawSampledBand(ctx,link.band,{fill}, {Path2D})`绘制。序列化band不是可绘制缓存，需重算。
- 基础布局仅报告incoming/outgoing/net，不验证业务守恒；source/sink与缺失边语义必须由调用者解释。端口不重叠不等于整个流带无交叉，也不等于没有遮住中间节点。


## 组合与历史作品边界

本项是订单流转组合中的基础机制。保留LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT，不是优质作品或默认风格推荐；常速NOT_DONE、听审NOT_LISTENED、跨作品迁移NOT_RUN。

[组合责任与完整作品证据](../../../../docs/data-flow.md)保留实际调用、冻结runtime版本、修复桥接、用户有限接受及未验范围。目录共置不构成新影片等价、常速、听审或艺术接受；不能把共享章节中其他机制的调用归到本项。

[官方参考与许可决定](../../../../docs/data-flow-reference-decisions.md)保留原研究核查；不附私有影片/字体/声音或给出不存在的再分发许可。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/layout/weighted-flow/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/layout/weighted-flow/test/*.test.mjs
```

保留共享validate/matrix/math/time及原sampled-band/keyframe/weighted-flow依赖，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

返回状态复制并深冻。flow-handoff计划及weighted-flow使用的band品牌仅在同一canonical模块实例有效；保存原始输入重编译，不把JSON当品牌缓存。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
