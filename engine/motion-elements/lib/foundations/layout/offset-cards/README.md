# offset-cards（experimental）

<!-- asset-self-description: composition.offset-cards -->

## 当前资产入口

本页是`composition.offset-cards`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/offset-cards.test.mjs)补充独立断言，原混合测试继续保留。旧combined实现不留wrapper；共享guidance和混合测试保留原职责。

本次提取原函数主体，布局校验与快照存储分别单份共享，不复制算法或WeakMap。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


offsetCards({itemIds,origin,card,offset,rotationStep?,zOrder?})接受1..128唯一ID（[a-zA-Z0-9_-]{1,64}），origin/offset各含x/y有限坐标±1e9，card含width/height各0.001..100000。rotationStep默认0，范围[-π,π]；zOrder默认ascending，另可descending。

第i项平移origin+i·offset，并绕该卡中心旋转i·rotationStep。ID和输出数组顺序仍按输入，zOrder只改变zIndex。返回深冻{itemId,rect,matrix,zIndex,geometryBounds}数组，rect从局部0,0起，geometryBounds是变换后AABB，不含阴影/描边。

它只做静态几何布局，不存时钟、不给透明度、不保证卡片无遮挡。不是动画品牌计划，无需compile；调用者可用布局交接或重组配方驱动。共享itemIds/dimensions行为完整保持，不趁迁移收紧旧输入边界。

原混合core/Canvas测试与十宫格示例仍共享；时间/合成边界见[核心API](../../../../docs/guides/core-api-and-time.md)。没有新增艺术或生产接受。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/layout/offset-cards/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/layout/offset-cards/test/*.test.mjs
```

保留共享validate/matrix及既有time/timeline依赖；layout-input与raster-snapshot各只有单份内部支持，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

布局输出深冻数据且没有品牌计划。栅格快照使用共享WeakMap品牌，copyRasterPixels是可变隔离副本；不能把JSON快照冒充真实对象，传输需复制像素后重新创建。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
