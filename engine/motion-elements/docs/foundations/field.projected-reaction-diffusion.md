# field.projected-reaction-diffusion

Bounded explicit Gray–Scott-style reaction diffusion with projection onto [0,1].

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`reactionDiffusion`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/field/reaction-diffusion.mjs](../../lib/foundations/field/reaction-diffusion.mjs)。

## 参数、用途与边界

## 共同合同

纯 ES modules，无安装依赖。options 必须是普通对象且字段恰好匹配、不能有 accessor；数据向量接受稠密 Array / Float64Array / Uint8Array，逐元素校验有限数。不执行数组元素 getter。数组额外命名属性不影响数值语义。返回独立缓冲区，不修改输入；不携带隐式时钟、随机数或可变全局历史。代理对象不在可信输入承诺内（JavaScript descriptor反射本身会触发Proxy trap）。坐标均为二维栅格像素中心，数值非颜色管理工具，不导入音频。

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

## 可执行输入

按 [注册示例](../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

```json
{
  "width": 3,
  "height": 3,
  "u": [
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8
  ],
  "v": [
    0.15,
    0.15,
    0.15,
    0.15,
    0.15,
    0.15,
    0.15,
    0.15,
    0.15
  ],
  "steps": 1,
  "dt": 0.1,
  "diffusionU": 0.8,
  "diffusionV": 0.4,
  "feed": 0.035,
  "kill": 0.06
}
```

## 当前证据与来源边界

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[test/seven-foundations-raster.test.mjs](../../test/seven-foundations-raster.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../history/private-candidates/seven-foundations/raster-GUIDE.zh-CN.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。
