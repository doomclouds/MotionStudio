# split-panels（experimental）

<!-- asset-self-description: composition.split-panels -->

## 当前资产入口

本页是`composition.split-panels`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/split-panels.test.mjs)补充独立断言，原混合测试继续保留。旧combined实现不留wrapper；共享guidance和混合测试保留原职责。

本次提取原函数主体，布局校验与快照存储分别单份共享，不复制算法或WeakMap。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


splitPanels({itemIds,viewport,axis,gap?})接受2..8唯一ID（[a-zA-Z0-9_-]{1,64}），viewport含width/height各0.001..100000。axis只能x或y，gap默认0且范围0..100000；(项数−1)·gap必须小于该轴长度。

可用长度减gap后等分为每项尺寸，另一轴占满viewport。项按输入顺序平移，zIndex按输入顺序。返回深冻{itemId,rect,matrix,zIndex,geometryBounds}数组；不假定整数像素、不额外四舍五入，也不测量内容。

仅布局，不是场景切换或遮罩。父变换、内容溢出和文字阅读时间由调用者负责；gap不是分隔线绘制。无播放状态或品牌计划，共享itemIds/dimensions语义保持原样。

原混合core/Canvas测试与十宫格示例仍共享；时间/合成边界见[核心API](../../../../docs/guides/core-api-and-time.md)。没有新增艺术或生产接受。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/layout/split-panels/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/layout/split-panels/test/*.test.mjs
```

保留共享validate/matrix及既有time/timeline依赖；layout-input与raster-snapshot各只有单份内部支持，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

布局输出深冻数据且没有品牌计划。栅格快照使用共享WeakMap品牌，copyRasterPixels是可变隔离副本；不能把JSON快照冒充真实对象，传输需复制像素后重新创建。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
