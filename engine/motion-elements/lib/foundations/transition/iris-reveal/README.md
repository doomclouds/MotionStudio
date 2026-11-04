# iris-reveal（experimental）

<!-- asset-self-description: transition.iris-reveal -->

## 当前资产入口

本页是`transition.iris-reveal`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/iris-reveal.test.mjs)保留原断言。旧实现、专属测试与scene入口不留wrapper；共享reveal导航与Canvas适配层继续保留。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


## Iris reveal：圆域 over-reveal（不是透明场景 replacement）

`transition.iris-reveal` 是独立机制。与现有sampleTransition/drawTransition共用体系，原push/wipe三参数调用保持不变：

```js
const state=sampleTransition({
 type:'transition.iris-reveal',version:1,
 range:{start:rational(1),end:rational(5)},curve:{type:'smoothstep'},
 params:{width:640,height:360,center:{x:210.35,y:180.65}}
},at,{reducedMotion:false});
drawTransition(ctx,state,{outgoing:drawA,incoming:drawB},{Path2D:canvasApi.Path2D});
// Caller-owned shared actor, if any, is drawn exactly once after the backgrounds.
```

width/height是局部视口尺寸，各[1,8192]，面积≤16,777,216；允许非整数。center必须位于闭视口内，包括边/角。range/curve复用现有严格rational与曲线验证，无direction/areaMode/ring/replacement字段。最大半径为center到四角的最大hypot；radius=q·maxRadius，**按半径进度而非面积进度**。state显式提供viewport、center、radius、maxRadius、revealProgress、raw progress和composition='over-reveal'，两层matrix均identity。

唯一合成语义：**A全视口持续保底，B在圆内source-over覆盖**。
- before/start：只调用A，不调用B；
- 中途：完整A，随后viewport∩circle内B；
- end/after：继续调用A+B，B只clip完整viewport，不做圆clip，避免最远角抗锯齿漏角；
- B的透明孔有意显示A。若A也透明，按source-over显示caller底层。不能声称终态等于透明B-only；
- 即使B不透明，也不自动探测并跳过A；库不会自动销毁A场景。A/B按当前时间绘制，不缓存旧帧，after仍需A有效绘制上下文。若需后续独立B场景，caller提供opaque B或显式做另一次交接。

reducedMotion按**raw progress=0.5**从A-only切到完整A+B，不按eased q中点，不改range/cue。终态同over语义，没有突然撤除A。push/wipe自己的行为保持不改。

Iris必须显式注入Path2D，第四参数仅接受Path2D，未知字段拒绝；push/wipe可省略。adapter用独立viewport/circle路径，不调用beginPath，parent由caller设置且只作用一次；非均匀父缩放时屏幕上成为椭圆，这是局部圆合同，不继承push的整数限制。每层临时设置source-over并在finally恢复caller composite、transform、alpha、clip。两个callback类型在绘制前验证，AsyncFunction/thenable拒绝；不是能撤销外部副作用的沙箱。

adapter自身不污染current path；callback自行修改path仍不在回滚保证内。callback应在提供的clip内正常绘制，不clear/reset整个canvas、破坏clip或自行改合成语义；每帧初始化由caller负责。共享actor必须从A/B背景移出，drawTransition后单独画一次；库不检测/去重角色。若需遮挡，caller显式安排独立clip。

互补clip（A圆外+B圆内）曾在Native实测出现opaque场景AA边缘漏caller底色，**不是本实现**。本实现用完整A保底，不靠装饰环遮缝。真正透明replacement的多surface方案及生命周期/显存预算未实现，不暗称具备。运动圈内实际视觉与不同backend仍需验证。

两类合成案例各有中心变化：opaque桌面→几何花园与caller单次绘制角色；红A图表上半透明B及透明孔（偏心/角点），after孔仍显示红A。示例不含私有品牌/素材，无portal装饰环；蓝色圆环是B的内容本身，不是接缝遮盖。8秒单次展示、静音。

```sh
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/iris-study-new --demo iris
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/iris-end-new --demo iris --frame 150
```

技术证据覆盖分数center/radius的opaque红A蓝B绿caller底、透明end/after基线、原始中点、四角覆盖、Path2D/parent/异常隔离与乱序。技术通过不等于复刻/艺术/声音通过。


## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/transition/iris-reveal/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/transition/iris-reveal/test/*.test.mjs
```

保留共享validate/matrix/math/time和timeline；sampleTransition/drawTransition及drawTileScatter仍通过原共享适配器，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

输出深冻，不保留播放历史。linear-mask状态与tile计划/状态使用canonical实例品牌，JSON复制不能供对应适配器绘制；iris不增加品牌。保存原始定义重新采样/编译。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。

原合成示例：[ iris-scene.mjs ](examples/iris-scene.mjs)。它是可调用Canvas函数或gallery scene，不是自动播放的生产影片。
