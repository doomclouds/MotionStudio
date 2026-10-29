# 平面视差：让近景与远景遵守同一投影关系

**Experimental。已有真实候选影片调用，技术与艺术状态分开，详见末节。** 一个机制覆盖不同深度平面的差速平移与推进缩放；不把每个图层、方向、相机移动或viewport变化拆成新元素。没有新handoff、遮罩或配方。

## 场景与边界

用于原稿已对齐的平行二维图层：同一镜头横移时近层移动更多，向前推进时近层放大更多。
同一hero保持同一plane ID和同一reference点，用该层matrix求屏幕位置，不另写一条看似对齐的屏幕路径。
这不是任意三维世界、相机旋转、网格、真正3D渲染、景深虚化、遮挡求解或自动美术布局。

输入reference是**零相机状态的已校准画稿像素**：每层在该状态下构图一致，深度不同不会默认把远景原稿缩小。
这些reference像素不等于所有深度平面共享的物理世界XY；不同深度同一点坐标指的是各自画稿中的对应位置。

## 严格API

```js
import {planeParallaxLayout} from '../lib/plane-parallax.mjs';
import {transformPoint} from '../lib/matrix.mjs';
const layers=planeParallaxLayout({
  planes:[{itemId:'back',depth:800},{itemId:'hero',depth:300}],
  reference:{width:400,height:240},
  camera:{x:20,y:0,z:40,focalLength:300},
  viewport:{x:12,y:18,width:200,height:120},
  near:10
});
const hero=layers.find(layer=>layer.itemId==='hero');
const screenPoint=transformPoint(hero.matrix,{x:220,y:120});
```

所有顶层字段和嵌套字段必填，不设默认值。普通输入对象采用当前库validator：本realm的Object.prototype或null-prototype对象；拒绝未知字段、Symbol、数组冒充对象、类实例和跨realm普通对象。

| 输入 | 约束 |
|---|---|
| planes | 本realm普通Array，1..64项；不可稀疏，不接受子类/跨realm数组、附加字段或Symbol |
| plane | 仅itemId/depth；ID为1..64 ASCII字母、数字、下划线或短横线，彼此唯一；depth有限0.001..1e6 |
| reference | width/height有限0.001..1e6 |
| camera | x/y/z有限−1e6..1e6；focalLength有限0.001..1e6 |
| viewport | x/y有限−1e6..1e6；width/height有限0.001..1e6 |
| near | 有限0.001..1e6，且所有plane的depth−camera.z都须≥near |

此外，派生scale必须为正且≤1000；派生matrix平移须在±1e9之内。字段单独合法不保证组合合法：越过这些限制将明确抛错，不钳制、翻转、跳过该层或回用上一帧。一个平面不合法会使整次求值拒绝。

返回深冻结、与输入隔离的**输入顺序**数组，不按深度排序：

```js
[{itemId,depth,distance,scale,matrix:[scale,0,0,scale,tx,ty]}, /* ... */]
```

distance为派生量，可大于输入depth上限；它不是要求再次通过depth输入验证的字段。
矩阵本身可以被现有matrix/transformPoint消费；任意再变换后的点/父矩阵仍需自行检查其组合域。
输出不带width/height、opacity、裁切或图像资源；绘制顺序、遮挡、超viewport区域及采样过滤属于调用方。

## 投影合同

设 `fit=min(viewport.width/reference.width, viewport.height/reference.height)`，
`D=depth−camera.z`，`center=(viewport.x+viewport.width/2, viewport.y+viewport.height/2)`：

```text
s  = fit * (depth / D)
tx = center.x − s * reference.width/2  − fit * focalLength * camera.x / D
ty = center.y − s * reference.height/2 − fit * focalLength * camera.y / D
```

- 零x/y/z相机时各层均是同一contain投影；不等比例viewport会居中留空，不拉伸、不自动裁切。
- 正x/y相机使画稿向反方向移动；正z推进会放大，负z后移会缩小。
- 这是已校准画稿的模型。focalLength用于平移投影量纲；单独改变它而x/y为0，不会产生光学变焦。
  一般作品应保持reference、depth和focalLength校准固定，用明确camera与viewport编排镜头。
- reference点先映到该平面的校准世界点，再做针孔式平移投影，可独立验证同一关系；不承诺等价于Three/OGL等完整相机。
- 平面层序保持输入顺序，即使深度相反也不重排；同深度允许，不同ID不互相影响。
- 不支持角度、透视倾斜、roll、near穿越、裁切片段或z-buffer。near是安全距离检查，不是自动切碎图形的裁剪器。

全部运算为IEEE浮点，不承诺精确实数、数学边界吸附、跨平台像素一致或所有输入统一误差上界。
例如depth=.3、z=.2、near=.1在JS里D=.09999999999999998，因此会拒绝；不以任意epsilon改变该合同。
极端scale/平移与抵消会损失有效位，字段域不是精度定理。需要精确锚点时应检查实际投影点，而非只看参数合法。

## 时间、绘制与复用

本API没有时钟、range、reducedMotion、播放状态、cache、回调或全局资源。
每次由调用方的绝对帧/时间生成camera/viewport，再求布局；相同输入与调用历史无关。
减少动态时调用方可用静态camera并保留原作品时段，不表示已经通过无障碍或舒适度审查。

```js
for (const layer of layers) {
  ctx.save();
  try {
    ctx.transform(...layer.matrix);
    drawAuthoredLayer(ctx, layer.itemId); // 在reference像素空间绘制
  } finally { ctx.restore(); }
}
```

上面的drawAuthoredLayer由调用方提供。clip/圆角窗口须在外层明确应用；不要在每层又重复应用同一viewport矩阵。
本函数不接收Canvas context；它不会自动恢复调用方自己写错的绘图状态或追踪hero身份。
本次图层差速是一个投影机制，已有transformPoint/Canvas save-restore不是额外条目。

## 工程复现与待验范围

```sh
node --test engine/motion-elements/test/plane-parallax.test.mjs
node --test engine/motion-elements/test/*.test.mjs
```

测试包括5000组独立校准世界点/针孔投影oracle、零相机、近远层比例、前后推移、viewport contain/平移、身份/顺序/删除隔离、near与派生数值限制、strict非法输入、深冻结、逆序/重复/独立Node，以及Native逐层应用matrix后的像素复现。
Native小夹具只是工程测试，正确的caller save/restore也不能变成新增adapter承诺。
工程夹具不替代真实作品和艺术审查；以下覆盖只对应一支冻结候选，不推广到全部参数。

## 真实作品覆盖与复现范围

一支14秒、1080p60、840帧有声原创海岸候选，把卡片视窗展开为分层场景，再回到监测面板。
本函数在f0–839共求值840次；每帧四个图层matrix均被Canvas绘制消费，主要横移/推进变化在f120–473。
图层包含同深度的水面与主体，主物体屏幕锚点由同一层matrix转换；不是另写一条看似相同的屏幕路径。
影片viewport保持同一宽高比，深度校准固定、全程满足near安全距离；不等比例contain、近平面拒绝、负z及极值只有工程测试，没有本片效果验收。

原有motion参数求值、raster位移/绘图和transformPoint继续复用；图层数量、原图生成、裁切、浮体波动、反射与面板图线均非新增机制。
本片为合成观察叙事，不是潮汐实测、流体模拟或真正3D。生成画稿是固定输入，不承诺再次生成得到相同像素。

实际导入的projection及依赖字节与冻结影片一致；影片直接导入模块，公共index导出由测试验证，不冒称被影片读取。
目录、指导与测试整合在成片之后，原manifest不改。私有清单绑定源码、画稿、音源、影片和调用回执。
调用证据是render-time状态结果/绘图记录，加冻结源码的输入与消费路径核对，**不是独立逐调用参数拦截**。

已完成全解码、14点seek、840帧正逆状态、7张逆序Native PNG与重复帧；解压源包核对来源/重建音频并重渲一张Native帧。
这不是整片重新渲染或跨平台像素一致。独评核查四个编码静帧，无该范围内阻断；
常速连续观看NOT_DONE、实际听审NOT_LISTENED、用户艺术PENDING_USER、通用生产迁移NOT_RUN分别保留。
没有优秀设计或全片艺术通过的自动背书。

公开合成例可复现API合同；完整制作、媒体、艺术参数与私有证据不包含在本源包，不假称仅凭该例能重制原片。
复用时先核固定源和素材身份，重建声音/状态/代表Native帧，再完整编码和检查实际调用、视觉接缝及声音。
官方代码与许可对照见[parallax-reference-decisions.md](parallax-reference-decisions.md)。
