# rect-wipe（experimental）

<!-- asset-self-description: transition.rect-wipe -->

## 当前资产入口

本页是`transition.rect-wipe`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/rect-wipe.test.mjs)补充专属断言，原core/Canvas混合测试保留。旧motions/transitions实现入口删除；核心guide和混合测试保留原职责。

本次提取原参数与采样分支，统一dispatcher保留共享流程；不复制公式或改变公开API。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


公开入口仍是sampleTransition(spec,at,context)，spec必须含type='transition.rect-wipe'、version=1、range:{start,end}和params，可选curve。range与at用{n:字符串整数,d:正整数字符串}；start≥0、end>start、end≤86400秒。边界先有理比较，before/after保留端点，phase/progress不靠递增帧状态。curve默认linear，另支持smoothstep与受限cubic-bezier（四控制值0..1且x1≤x2），不支持overshoot。

context只接受boolean reducedMotion（默认false）；返回深冻{type,phase,progress,viewport,layers}。reduced按eased progress<0.5选A，否则B；不移动/裁缩内容。raw起点隐藏B，raw终点隐藏A。drawTransition仍为共享Canvas绘制API，父矩阵由调用者设置，不复制适配器。

## 专属参数与行为

params必需width/height/direction，width/height为0.001..100000有限数，可为分数；direction为left/right/up/down。A保持完整视口保底，B在方向矩形clip内出现，两层局部matrix保持identity，不移动内容。中间透明B孔可透出A；精确终态会隐藏A，因此不能把它当永久over-reveal或透明replacement无差异的保证。

## 实现与组合边界

本目录index.mjs存放真实专属参数/计算分支，供单一internal/element-dispatch调用；它不是旧模块wrapper，也不是新增公开完整spec API。共享dispatcher保留原校验顺序、时钟、context、端点与状态组合。直接调用内部hook不替代公开API校验。无品牌计划，新模块不复制WeakMap；其他既有品牌机制沿原canonical实例消费。

完整Canvas回调、合成及通道写入边界见[Canvas组合](../../../../docs/guides/canvas-composition.md)，共同时间合同见[核心API](../../../../docs/guides/core-api-and-time.md)。原core/Canvas混合测试与gallery保留，不新增生产或艺术接受。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/transition/rect-wipe/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/transition/rect-wipe/test/*.test.mjs
```

保留单一element-dispatch与共享validate/matrix/math/time/timeline；Canvas绘制不复制到资产，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

这些基础函数没有品牌计划，公开API输出深冻状态。其他依赖的既有品牌仍只有原canonical实例；不创建包装对象替代。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
