# matte（experimental）

<!-- asset-self-description: raster.matte -->

## 当前资产入口

本页是`raster.matte`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/matte.test.mjs)补充独立断言，原混合测试继续保留。旧combined实现不留wrapper；共享guidance和混合测试保留原职责。

本次提取原函数主体，布局校验与快照存储分别单份共享，不复制算法或WeakMap。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


## matte：覆盖图不是几何clip

`sampleRasterMatte({source,mask,mode,invert})`要求source/mask尺寸相同，不自动缩放、对齐或推断密度。
可以传同模块快照或显式原始RGBA输入。

alpha模式coverage=mask.alpha/255；luma模式再乘
`(.2126R+.7152G+.0722B)/255`。invert在完整coverage后做`1−coverage`。
输出alpha为source.alpha×coverage，再钳位并四舍五入至byte；RGB沿用source（包括不可见RGB）。
输入不被修改，没有累计destination-in状态。

luma是在**encoded-sRGB字节域**的加权亮度近似，不是线性光、HDR、色彩管理或光学亮度。
一张半透明黑/白/灰mask都要同时考虑alpha；不能只拿RGB忽略透明度。
与旧矩形/圆/多边形clip不同，本机制接受逐像素连续覆盖；但文字排版、描边和遮罩生成仍是调用方工作。


## 快照输入与共享支持

source/mask或map可为本runtime快照，或{width,height,pixels}原始RGBA。width/height为1..4096整数，最多2,097,152像素；pixels是同realm Uint8ClampedArray或严格0..255整数JSON数组，长度恰为width×height×4。输入复制，拒绝SharedArrayBuffer；返回只暴露冻结width/height，字节在单一共享WeakMap。copyRasterPixels返回可改副本，不是内存别名；跨runtime或JSON克隆快照须复制原像素后重新创建。

创建/复制、预算及Canvas绘制的完整合同与原作品证据见[共享栅格说明](../../../../docs/raster-effects.md)。本次共置不改变原冻结影片或有限接受范围。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/raster/matte/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/raster/matte/test/*.test.mjs
```

保留共享validate/matrix及既有time/timeline依赖；layout-input与raster-snapshot各只有单份内部支持，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

布局输出深冻数据且没有品牌计划。栅格快照使用共享WeakMap品牌，copyRasterPixels是可变隔离副本；不能把JSON快照冒充真实对象，传输需复制像素后重新创建。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
