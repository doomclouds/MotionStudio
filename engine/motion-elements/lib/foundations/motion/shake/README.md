# shake（experimental）

<!-- asset-self-description: motion.shake -->

## 当前资产入口

本页是`motion.shake`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/shake.test.mjs)补充专属断言，原core/Canvas混合测试保留。旧motions/transitions实现入口删除；核心guide和混合测试保留原职责。

本次提取原参数与采样分支，统一dispatcher保留共享流程；不复制公式或改变公开API。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


公开入口仍是sampleMotion(spec,at,context)，spec必须含type='motion.shake'、version=1、range:{start,end}和params，可选curve。range与at用{n:字符串整数,d:正整数字符串}；start≥0、end>start、end≤86400秒。边界先有理比较，before/after保留端点，phase/progress不靠递增帧状态。curve默认linear，另支持smoothstep与受限cubic-bezier（四控制值0..1且x1≤x2），不支持overshoot。

context可含boolean reducedMotion（默认false）和parentMatrix（默认identity）；返回深冻{matrix,opacity,phase,progress}。父矩阵在局部计算后乘一次。

## 专属参数与行为

params必需amplitudeX/Y（0..10000）、rotation（0..π弧度）、frequencyHz（0.01..120）、seed、elementId；origin可选默认0,0。elementId遵循[a-zA-Z0-9_-]{1,64}，seed必须为长度≤128的字符串（允许空字符串）。只在active时求值：raw progress乘range时长得seconds，frequencyHz决定相邻确定性噪声样本，以smoothstep混合，再乘sin(π·raw progress)²包络。使用x/y/rotation独立通道，不用Math.random或帧计数。curve字段仍严格验证，但摇动采样使用raw时钟，不以curve扭曲噪声时序。before/after或reducedMotion的局部矩阵identity，opacity固定1。

## 实现与组合边界

本目录index.mjs存放真实专属参数/计算分支，供单一internal/element-dispatch调用；它不是旧模块wrapper，也不是新增公开完整spec API。共享dispatcher保留原校验顺序、时钟、context、端点与状态组合。直接调用内部hook不替代公开API校验。无品牌计划，新模块不复制WeakMap；其他既有品牌机制沿原canonical实例消费。

完整Canvas回调、合成及通道写入边界见[Canvas组合](../../../../docs/guides/canvas-composition.md)，共同时间合同见[核心API](../../../../docs/guides/core-api-and-time.md)。原core/Canvas混合测试与gallery保留，不新增生产或艺术接受。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/motion/shake/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/motion/shake/test/*.test.mjs
```

保留单一element-dispatch与共享validate/matrix/math/time/timeline；Canvas绘制不复制到资产，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

这些基础函数没有品牌计划，公开API输出深冻状态。其他依赖的既有品牌仍只有原canonical实例；不创建包装对象替代。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
