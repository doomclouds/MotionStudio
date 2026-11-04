# 片块回归与署名配方

<!-- asset-self-description: recipe.tile-signature -->

## 当前资产入口

本页是`recipe.tile-signature`当前合同，状态与证据登记在[catalog](../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/tile-signature.test.mjs)保留原断言。旧guide、实现和测试位置不留wrapper。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


[返回入口](../../../README.md) · [目录与公共 API](../../../docs/registered-foundations.md)

本页保存对应机制的详细合同、合成示例和已有证据限定。历史批次数量不是当前目录数，已有测试描述不代表本次重新运行或艺术通过。代码片段中相对导入以本页所在目录为基准；shell 命令按各段注明的工作目录运行。

## 配方 B：片块回归 → 署名轻揭示（固定 8 秒）

`recipe.tile-signature` 复用 fixed-tiles、transform、local-reveal，不新增底层机制。输入仍为调用者的 raster 与署名内容绑定，不取私有素材：

```js
const plan=compileTileSignature({
 type:'recipe.tile-signature',version:1,
 sourceId:'source',signatureId:'signature',
 sourceRect:{x:0,y:0,width:641,height:359},grid:'8x5',
 seed:'demo',instanceId:'study',start:rational(0),
 displacement:{x:60,y:35},maxRotation:0.16
});
const state=sampleTileSignature(plan,at,{reducedMotion:false});
```

固定1920×1080设计空间；只允许整体正等比缩放+平移的 parentMatrix。source/署名ID必须不同。sourceRect继承tile整数/像素预算，另外宽高比限1.5..2以保证本配方布局；grid只接受5x3/8x5，step固定0.01秒。位移上限各0.2×宽/0.25×高、旋转≤0.35rad。每片的中心平移区间加外接圆半径做保守扫掠边界验证，必须留在设计空间 x[24,1896]、y[24,900]；不是有限帧采样冒充连续证明。即使未超过位移上限，保守安全区不通过也会拒绝，需减小位移或换网格。严格字段、时长、品牌验证与其它配方一致。

以start为零：0–1认识整图；1–2.20分散；2.20–2.55片块hold；2.55–3.75回归；3.75–4.55归位读图；4.55–5.15整图缩小上移；5.05–5.65署名揭示；5.65–8固定收尾。source初始宽900、中心(960,480)，归位读图结束才变为宽720、中心(960,420)。署名局部bounds为800×110，位置(560,710)，与源图留白不相交。署名位于独立层，不用碎片拼字。

`sampleTileSignature` 返回 phase/cueTimes/source/signature：
- source.bindingId、matrix、geometryBounds、tilePlan、tileState；
- signature.bindingId、matrix、bounds、reveal。
source.geometryBounds 仅是父变换后的完整home raster足迹，不是运动片群的动态union bounds，不能用于碎片碰撞/屏幕包围盒判断；分散安全区由编译时独立保守界限检查。
source的 matrix 在0–4.55绝对固定；在source绘制中先应用此matrix，再调用drawTileScatter。回归阶段先映射 mappedAt=tileStart+(at−returnStart)，再对**同一个tilePlan**调用 direction=in；内部只反射一次完整global time，含stagger。归位后的 tileState 保留完整身份/UV与精确单位matrix，仅整体节点开始transform。没有alpha隐藏、epsilon提前归位或换图。

sourceSnapshot固定对象身份由drawTileScatter验证；**同对象像素不可变仍由caller保证**，本配方不clone/hash像素。使用同source完整绘制为端点基线；运动期采样缝/近端点像素差风险仍继承tiles合同，不声称任意变换下每片无缝。

绘制示意（不要重复乘父矩阵）：

```js
withMotion(ctx,{matrix:state.source.matrix,opacity:1},()=>{
 drawTileScatter(ctx,sourceSnapshot,state.source.tilePlan,state.source.tileState);
});
withMotion(ctx,{matrix:state.signature.matrix,opacity:1},()=>{
 withLocalReveal(ctx,{
  bounds:state.signature.bounds,radius:0,progress:state.signature.reveal,
  direction:'left-to-right'
 },drawSignature,{Path2D:canvasApi.Path2D});
});
```

调用者验证署名字宽、安全区和内容来源，合成demo measureText溢出即报错。Path2D适配器自身不改current path，callback自行改path仍不可回滚。固定8秒，不为署名增加假循环。reduced保留完整source、不演绎碎片叙事，metadata明确 `static-source-no-fragment-narrative`；整体落定保留，署名5.35中点cut，所有阅读hold和cue不改。不宣称舒适度审核或audio-pass。

```sh
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/tile-signature-new --demo tile-signature
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/tile-signature-home-new --demo tile-signature --frame 113
```

两类内存合成内容为透明几何图与整张文本卡；8秒连续顺序，不循环填时。正反状态、父锁定、归位像素、末帧署名与邻帧检查各自验证；人工常速叙事/艺术评审与技术测试分列。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/recipes/tile-signature/examples/contract.mjs
node --test engine/motion-elements/lib/recipes/tile-signature/test/*.test.mjs
```

保留共享validate/time、基础motion/layout/tile与Canvas支持，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

计划品牌仅当前canonical模块实例有效；保存原始定义并重新compile。返回状态深冻，内容及素材绑定仍由调用者负责。代码适用[包MIT许可](../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。

## 原合成场景

[场景代码](examples/tile-signature-scene.mjs)与本资产共置，保持原绘图、内容和持续时间；共享字体注册支持继续位于包examples中。场景需要Native Canvas/字体，示例是合成技术演示，不是优质风格或听审通过。
