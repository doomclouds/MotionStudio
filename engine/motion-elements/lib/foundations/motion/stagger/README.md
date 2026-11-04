# 错峰时间编译（experimental）

<!-- asset-self-description: motion.stagger -->

## 当前资产入口

本页是`motion.stagger`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/stagger.test.mjs)补充独立断言，原混合测试保留。旧实现不留wrapper；原混合测试与组合导航保留。

本次迁移独立函数；grid/stack共用的dense、dimension、placed移到单一internal支持模块，函数主体不改，不复制算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


compileStagger接收{itemIds,start,duration,step}，时间均为字符串整数有理数{n,d}。itemIds为1..128个唯一ID，沿用[a-zA-Z0-9_-]{1,64}；不重排身份。step≥0，每项起点=start+i·step，终点=该起点+duration。所有起点非负、duration>0、终点不超过86400秒，非法输入拒绝，不自动缩短。

返回深冻结的{itemId,range:{start,end}}数组。它是可检查的时间表，不是带品牌的动画计划，sampleMotion仍由调用者给出完整spec。错峰启动不等于前一项完成才开始；step小于duration时动作重叠，step为0允许同时开始。该编译器不读取播放时钟，也无reducedMotion选项。

只使用共享time/timeline和itemIds校验，不复制有理数实现。旧itemIds支持边界原样保持，本次不顺便收紧数组/描述符规则。一般输入、非法时间、重复身份与组合测试仍见[core测试](../../../../test/core.test.mjs)。原十宫格合成示例及共享时间/曲线边界见[核心API](../../../../docs/guides/core-api-and-time.md)，不新增生产或艺术接受。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/motion/stagger/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/motion/stagger/test/*.test.mjs
```

保留共享validate/matrix/math/time、timeline和itemIds；grid/stack共用单一internal/structured-layout-support实现，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

这些函数返回深冻结数据，没有品牌计划或伪造状态入口；公共barrel直接导出各目录函数，保存输入即可重算。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
