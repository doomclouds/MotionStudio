# 固定片块与全局时间反射

<!-- asset-self-description: fragment.fixed-tiles -->

## 当前资产入口

本页是`fragment.fixed-tiles`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/fixed-tiles.test.mjs)保留原断言。旧实现、专属测试与scene入口不留wrapper；共享reveal导航与Canvas适配层继续保留。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


[返回入口](../../../../README.md) · [目录与公共 API](../../../../docs/registered-foundations.md)

本页保存对应机制的详细合同、合成示例和已有证据限定。历史批次数量不是当前目录数，已有测试描述不代表本次重新运行或艺术通过。代码片段中相对导入以本页所在目录为基准；shell 命令按各段注明的工作目录运行。

## 固定片块分散 / 全局时间反射重组

`fragment.fixed-tiles` 是一个机制。反向只是同轨迹倒放配方，不另算一种物理。先由调用者完整绘制一张 raster，再编译固定身份：

```js
const plan=compileTileScatter({
 sourceRect:{x:0,y:0,width:641,height:359},columns:8,rows:5,
 seed:'demo',instanceId:'card',
 range:{start:rational(0),end:rational(3)},step:rational(1,50),
 displacement:{x:85,y:60},maxRotation:0.18
});
const state=sampleTileScatter(plan,at,{direction:'in'}); // out 或 in，必填
drawTileScatter(ctx,sourceSnapshot,plan,state);
```

sourceRect x/y 是非负安全整数，右/下边界也必须为安全整数。width/height 各1..8192，总面积≤16,777,216；行列正整数且不超过对应像素尺寸，总片数≤256。位移各0..1e4局部长度，旋转0..π弧度。seed/instanceId 遵循现有 seededUnit 验证。range 共用 rational Time，step≥0，整段扣除(N−1)·step 后每片时长必须>0。使用同一 shared timing/rational 实现，不修改旧 compileStagger 的128项上限。

按 floor(i·width/columns) 的整数边界分片，非整除余边完整保留。每片 tileId=row:r/col:c、sourceRect、homeRect、center固定；home从(0,0)开始，不另设目标拉伸。dx/dy/rotation 分离随机通道，只由seed、instanceId、tile索引决定。plan深冻结；state与plan品牌绑定，伪造/序列化对象须重新compile，不能跨模块实例冒充。

每片 progress=smoothstep(local u)，围绕其home中心旋转，不重复加片原点。`in` 先反射**完整全局时间** start+end−at，再计算同一stagger，包含顺序；并非只对局部q做1−q。所有q精确0才atHome，每个matrix严格单位矩阵；禁止阈值提前归位。atHome只将同一个source完整裁切域绘制一次，避免分片边界重采样缝；其它时刻逐片固定row-major绘制，不扩大UV、不补宽、不alpha隐藏错误。整体绘制不替代tile身份/矩阵正确性测试。

**sourceSnapshot 是调用约定，不是自动冻结像素的容器。** adapter将plan绑定首次有效source对象，换对象显式拒绝；每次检查crop位于实际source尺寸内。但同一个Canvas的像素仍可被调用者修改，库不clone、不逐帧hash、不自动验证像素内容。调用者必须预绘完成并在整个机制期间不再改source像素；否则确定性和同源重建保证不成立。冻结JS对象不能冻结Canvas像素。本轮未提供私有offscreen捕获API。

调用者设置父矩阵；adapter save/transform/drawImage/finally restore，不修改current path。精确home在同source、同ctx状态/父变换、同Canvas后端下与整图基线逐像素一致。**运动期不承诺任意父变换下逐片无缝**：旋转/缩放/透明边缘可能产生采样缝或混色；即使非常接近home也不提前snap。连续坐标不等于像素差连续，末端切换整图的观感需要慢放审查。

两类合成输入均内存绘制：非整除641×359棋盘/细线/透明孔/半透明块，以及整张文本卡快照（不解析字形）。8秒展示前4秒out、后4秒in；首1.5秒身份debug，之后干净画面。reduced模式整图中点出现/消失，保留区间，不伪装为碎片运动。

```sh
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/tiles-study-new --demo tiles
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/tiles-still-new --demo tiles --frame 224
```

没有任意形状碎裂、glyph shaping、物理碰撞、内容自动抓取、motion blur或音效。技术验证/邻帧检查/常速艺术审看/真实迁移分别记录，不能互相冒充。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/fragment/fixed-tiles/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/fragment/fixed-tiles/test/*.test.mjs
```

保留共享validate/matrix/math/time和timeline；sampleTransition/drawTransition及drawTileScatter仍通过原共享适配器，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

输出深冻，不保留播放历史。linear-mask状态与tile计划/状态使用canonical实例品牌，JSON复制不能供对应适配器绘制；iris不增加品牌。保存原始定义重新采样/编译。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。

原合成示例：[ tiles-scene.mjs ](examples/tiles-scene.mjs)。它是可调用Canvas函数或gallery scene，不是自动播放的生产影片。
