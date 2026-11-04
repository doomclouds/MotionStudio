# 偏移卡片重组（experimental配方）

<!-- asset-self-description: recipe.offset-reassembly -->

## 当前资产入口

本页是`recipe.offset-reassembly`当前合同，状态与证据登记在[catalog](../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/offset-reassembly.test.mjs)补充独立断言，原混合测试保留。旧实现不留wrapper；原混合测试与组合导航保留。

本次迁移独立函数；grid/stack共用的dense、dimension、placed移到单一internal支持模块，函数主体不改，不复制算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


sampleOffsetReassembly(input,at,context)接收type='recipe.offset-reassembly'、version=1、range:{start,end}、params和可选curve。时间为字符串整数有理数，range起点≥0、终点≤86400秒、总长>0；曲线沿用linear/smoothstep/受限cubic-bezier，默认smoothstep。

params必需itemIds、origin、card、offset、step、travel；可选rotationStep及zOrder。itemIds为1..128唯一ID；origin/offset/travel坐标±1e9，card.width/height为0.001..100000，rotationStep在[-π,π]默认0，zOrder为ascending/descending默认ascending。step是非负Time；每项动作时长=总长−(项数−1)·step，必须为正。

组合真实调用offsetCards、compileStagger和sampleMotion(transform/opacity)，不另造曲线或状态机。各卡从travel位移和0.85缩放变到布局终态，同时透明度0→1。矩阵是parent×layout×motion，bounds按当前矩阵算，zIndex保留布局声明。返回布局项加opacity和phase的深冻结数组；无可序列化品牌计划，任意时刻由输入重算。

context只接受reducedMotion和parentMatrix。减动令transform直接取终态，opacity仍按原曲线及时间采样，不缩range或改项目时钟；curve仍必须合法。单项范围可互相重叠，配方不是碎字、任意拓扑形变或物理重组。内容绘制由调用者负责，输出rect/bounds不包含阴影描边。

原十宫格展示和混合core/Canvas测试继续共享；工程通过不代表完整新版本影片或艺术认可。共享时钟合同见[核心API](../../../docs/guides/core-api-and-time.md)。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/recipes/offset-reassembly/examples/contract.mjs
node --test engine/motion-elements/lib/recipes/offset-reassembly/test/*.test.mjs
```

保留共享validate/matrix/math/time、timeline和itemIds；grid/stack共用单一internal/structured-layout-support实现，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

这些函数返回深冻结数据，没有品牌计划或伪造状态入口；公共barrel直接导出各目录函数，保存输入即可重算。代码适用[包MIT许可](../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
