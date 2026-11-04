# 局部几何揭示（experimental）

<!-- asset-self-description: reveal.local-geometry -->

## 当前资产入口

本页是`reveal.local-geometry`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/local-geometry.test.mjs)保留原断言。旧实现位置不留wrapper；共享组合guide、scene及混合测试保留原职责。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


### Reveal：withLocalReveal

```js
withLocalReveal(ctx,{
  bounds:{x:0,y:0,width:240,height:140},
  progress:0.6, radius:12, direction:'left-to-right'
},drawContent,{Path2D:canvasApi.Path2D});
```

`reveal.local-geometry` 是独立 catalog 机制。最后参数必须显式注入后端 Path2D（Native 或浏览器），要求支持 roundRect/rect 与 ctx.clip(path)；不自动下载或切换后端。方向只接受 left-to-right/right-to-left/top-to-bottom/bottom-to-top。bounds x/y 限±1e6，width/height 为(0,1e6]；radius∈[0,min(width,height)/2]，progress∈[0,1]，均不静默clamp。

调用者拥有局部矩阵，API 不接收或重复施加矩阵。可见域=固定圆角边界∩方向条带，不将条带重新圆角。progress=0 不调用内容；progress=1 仍完整clip。用两个独立 Path2D，不修改调用者 current path；save/finally restore 保绘图状态。**内容callback自己修改current path或外部对象不在回滚保证内**。仅同步callback：AsyncFunction/thenable拒绝，不是能撤销恶意异步副作用的沙箱。

这只是几何裁切，不是字形alpha mask、署名扫光、滤镜、任意SVG或多边形morph。透明孔洞仍透明。reduced模式在示例层按原时段中点cut，无低层另一个时钟。


四格共享scene及原技术证据边界见[settle/reveal组合说明](../../../../docs/guides/settle-and-local-reveal.md)。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/reveal/local-geometry/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/reveal/local-geometry/test/*.test.mjs
```

保留共享validate/math/time及既有timeline依赖；跨资产示例仍共享，不复制组合代码，不复制通用实现。记录式Path2D例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

field计划与slice计划/状态使用canonical品牌，保存原始定义重新compile。local reveal是同步绘制函数，不编译品牌计划或返回冻结状态。纯采样结果深冻，不保留播放历史。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
