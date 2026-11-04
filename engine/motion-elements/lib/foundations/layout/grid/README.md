# grid（experimental）

<!-- asset-self-description: composition.grid -->

## 当前资产入口

本页是`composition.grid`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/grid.test.mjs)补充独立断言，原混合测试保留。旧实现不留wrapper；原混合测试与组合导航保留。

本次迁移独立函数；grid/stack共用的dense、dimension、placed移到单一internal支持模块，函数主体不改，不复制算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


### gridLayout

```js
gridLayout({itemIds:['mon','tue','wed'],width:120,height:58,columns:3,gap:0});
```

- `itemIds`：1..128个不重复ID，遵循已有 `[a-zA-Z0-9_-]{1,64}` 合同。
- `width/height`：每个格子的局部尺寸，0.001..10000。
- `columns`：1..128整数，可以大于实际项数；按行优先排列。
- `gap`：水平和垂直间距，0..10000局部单位。
- 起点固定为(0,0)，不会自动缩放到视口；调用者显式设置父变换。

本函数返回深冻结、与输入隔离的数组：
`{itemId,rect,matrix,zIndex,geometryBounds}`。
rect是局部`{x:0,y:0,width,height}`；matrix是`[1,0,0,1,x,y]`；
zIndex按输入顺序。geometryBounds不含描边、阴影、光晕或滤镜外溢。

空/稀疏数组、重复ID、额外对象或数组字段、显式null、非有限值和越界数值
均拒绝，不悄悄删项或猜默认值。布局只计算空间，不自动动画；
reduced-motion由调用者或明确配方处理。重新计算布局不会改掉已经画出的帧。


共享组合、历史作品与验收边界见[UI说明](../../../../docs/ui-foundations.md)。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/layout/grid/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/layout/grid/test/*.test.mjs
```

保留共享validate/matrix/math/time、timeline和itemIds；grid/stack共用单一internal/structured-layout-support实现，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

这些函数返回深冻结数据，没有品牌计划或伪造状态入口；公共barrel直接导出各目录函数，保存输入即可重算。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
