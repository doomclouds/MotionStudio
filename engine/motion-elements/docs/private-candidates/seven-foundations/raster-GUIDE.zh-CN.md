# 三项二维栅格候选（未登记、未计入正式总数）

> Historical pre-registration snapshot. Private/unregistered counts, old publication blocks and proposals below describe that earlier stage, not current status. Current catalog: 60 foundations + 7 recipes; expansion paused. See [current registration and runtime boundaries](../../registered-foundations.md).


只读比较基线 `motion-dev-published-184f27e5/engine/motion-elements/catalog.json` 及 `candidate-readiness-{first8,last8}/result.json`。仅在本新目录写入；不改变旧工程、待审联合树、52秒或Tessel，不推送。

## 共同合同

纯 ES modules，无安装依赖。options 必须是普通对象且字段恰好匹配、不能有 accessor；数据向量接受稠密 Array / Float64Array / Uint8Array，逐元素校验有限数。不执行数组元素 getter。数组额外命名属性不影响数值语义。返回独立缓冲区，不修改输入；不携带隐式时钟、随机数或可变全局历史。代理对象不在可信输入承诺内（JavaScript descriptor反射本身会触发Proxy trap）。坐标均为二维栅格像素中心，数值非颜色管理工具，不导入音频。

## 1. `distanceTransform({width,height,mask})`

`mask` 为长度 width×height 的严格0/1值；返回 `{width,height,squaredDistances: Float64Array}`。每像素返回到最近1像素中心的 **平方** 欧氏距离，无种子则全部 Infinity（有意的空集距离，不能直接作为可见alpha）。尺寸各1…1024且总像素≤262144。两遍抛物线下包络，O(WH)，临时空间O(WH+max(W,H))；有限距离是该域内可精确表示的整数。

用法：对位图文字内外分别求距离，把 `sqrt(outside)-sqrt(inside)` 组合为采样中心有符号距离；可做轮廓光带、空间等距标记、由遮罩推出可调轮廓。**连续真实字形边界距离、亚像素抗锯齿、矢量距离不是保证**。距离阈值效果与morphology外观可能相近，但其输出完整度量场，而已有morphology输出矩形邻域max/min后的覆盖；这里不是把半径模式拆成计数。已有iso-contour可消费场，等值线提取仍归旧积木。

```js
const d = distanceTransform({width:3,height:3,mask:[0,0,0,0,1,0,0,0,0]});
// squaredDistances: [2,1,2,1,0,1,2,1,2]
```

## 2. `paletteDiffuse({width,height,rgb,palette})`

尺寸与距离变换相同。RGB长度3WH，输入[0,1]；palette含2…32个显式RGB三元组。返回 `indices:Uint8Array` 和仅由palette颜色组成的 `rgb:Float64Array`。每行蛇形扫描，欧氏RGB最近色（等距选最小索引），Floyd–Steinberg 7/16、3/16、5/16、1/16误差分配到尚未处理的邻居。边界外误差丢弃；**不夹紧中间误差**。复杂度O(WH×paletteLength)，空间O(WH)。

适用于限色海报、带状渐变转换、屏幕质感。不是halftone的圆∩格面积反解：此处从已知RGB和有限调色板出发，通过有方向的量化误差反馈实现空间补偿，不输出圆点几何。不是convolution的归一邻域线性聚合。调色板选择、sRGB转线性、alpha预合成属于调用者；本实现不做抖动噪声、不支持透明通道、不保证感知色差最小或全图均值精确守恒。逐帧重算可能出现爬点，切勿声称时间稳定性；需要稳定印刷定格时固定源图后只移动画稿。

```js
const q = paletteDiffuse({width:3,height:1,rgb:Array(9).fill(.5),palette:[[0,0,0],[1,1,1]]});
// indices: [0,1,0]
```

## 3. `reactionDiffusion({width,height,u,v,steps,dt,diffusionU,diffusionV,feed,kill})`

二维 **投影版** Gray–Scott有限差分状态推进：四邻接离散Laplacian、显式Euler、边界clamp邻居即零通量，不是wrap。每步计算后把两浓度投影到[0,1]；明确是视觉生成模型，**不是未约束PDE精确解或科学化学模拟**。

- width、height各1…256；steps整数0…2048，WH×steps≤8388608。
- u/v稠密[0,1]向量；dt∈[0,.1]；扩散系数∈[0,1]；feed/kill∈[0,.1]。
- 返回独立u/v；steps或dt零是数值恒等但复制输出。
- 时间单位由作者定义。O(steps×WH)时间、O(WH)空间；多调用累计总成本由场景负责。

方程：`du=D_u lap(u)-u v²+F(1-u)`、`dv=D_v lap(v)+u v²-(F+K)v`。适合菌落纹理、合成墨斑、有限有机生长场。与grid-transport对给定流场作采样/输运不同，此模型两种浓度通过局部非线性反应相互生成和消耗；与convolution不同，它不是单次线性滤波。feed/kill/两种浓度/扩散和反应子项共计一个责任，不拆计。

```js
const opts={width:64,height:64,u:Array(4096).fill(1),v:Array(4096).fill(0),
 steps:100,dt:.1,diffusionU:.8,diffusionV:.4,feed:.035,kill:.06};
for(let y=28;y<36;y++)for(let x=28;x<36;x++){opts.u[y*64+x]=.5;opts.v[y*64+x]=.8;}
let state=reactionDiffusion(opts);
state=reactionDiffusion({...opts,...state,steps:100});
```

不是常数时间任意seek：需要从初态重放或调用者缓存有明确整数步编号的状态。相同初态和参数逐次推进与一次总步数一致（只要总步数在单次预算内）；不能靠跳过帧改变步数。制作视频时先固定所有输出帧对应整数步，再渲染；Reduced Motion使用明确冻结终态。预热超过2048步可分块，但必须公开累计步数/预算，不把单次限制宣传成全片限额。

## 验证和未完成项

`node --test raster.test.mjs`：16项全通过，含400组距离暴力穷举oracle、200组调色板独立按通道实现oracle、100组反应扩散不同邻域求和oracle；还有空域、满域、单行列、最大距离域、参数/资源拒绝、getter不执行、非mutation、输出隔离、分块回放恒等、纯扩散守恒（无投影触发）检查。

这些是作者技术测试，不冒充独立审计。父任务正在制作三个≥7秒组合场景；本子任务尚未看过成片，也未进行真实听审/艺术验收。不能据此登记为正式积木、声称达到60或替代现有发布门槛。
