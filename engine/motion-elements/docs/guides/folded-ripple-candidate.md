# 折叠标量场与单次径向扰动候选

状态：**未注册源码机制研究**，不是视觉复刻。未进入 catalog / public barrel，60 基础＋7 配方计数不变；技术测试、合成帧检查与原作比对/用户接受分开。

## 去重与唯一职责

已有 `arrival-field` 输出到达时刻，`attractor-field` 输出方向，`grid-transport` 搬运给定材料，`reaction-diffusion` 迭代化学网格；`spherical-splats` 是球面高斯投影，`fixed-string-wave` 是一维定弦。都不提供可乱序采样的二维连续折叠纹理与事件域扰动。本候选只生成标量网格；颜色/混合复用 raster snapshot，不另造渲染器或把两套颜色算两个机制。

实现：[folded-ripple.mjs](../../lib/foundations/field/folded-ripple.mjs)。原创数学选择为五轮固定旋转＋正弦坐标扰动，累加正序 smoothstep 的窄脊响应并平均；没有抄录原例的模铺排、常量偏移、倒数距离链或其色调公式。单次脉冲使用绝对事件时间差、平滑起振、空间与时间指数衰减，方向用有限软化分母避免中心奇点。所有 smooth 边界严格正序。

```js
import {compileFoldedRipple, sampleFoldedRipple}
  from '../../lib/foundations/field/folded-ripple.mjs';
const plan = compileFoldedRipple({
  scale:1.2, speed:.4, ridgeWidth:.2,
  pulse:{x:0, y:0, at:1, strength:.2, decay:2}, // 或 null
});
const grid = sampleFoldedRipple(plan, {width:128,height:96,seconds:1.3});
// grid.density: 新建 Float64Array，行优先，范围 [0,1]。
```

## 受限合同

- 固定五轮，不暴露可无限提高的迭代数。width/height 各整数 1..256，至多 65,536 样本；时间 0..10,000 秒。O(5×像素) CPU 采样，不宣称高清实时 GPU 性能。
- 屏幕中心为原点，x 向右、y 向下；较短边长度为 1，像素中心采样，宽屏不拉伸坐标。脉冲中心 x/y 各 -2..2 同单位，可在画面外。
- scale 0.25–8：空间频率尺度；speed -2–2：相位速度（不是流体速度）；ridgeWidth 0.03–0.5：无量纲窄脊宽度。
- pulse 为 null 或唯一事件。at 0..10,000 秒；strength 0–0.3 域位移上界；decay 0.1–8 每秒。事件前和事件时位移严格为零；0.12 秒正序平滑起振，之后按 exp(-age×decay) 衰减。不是精确有限终止，也不是因果传播波前：整个空间在事件之后同时获得衰减扰动。
- 中心方向采用 `delta/sqrt(distance²+.0025)`，中心位移零且无除零。脉冲仅扭曲采样坐标，不增加能量或改变 field 输出范围。
- 输入都是必需的精确普通数据记录，拒绝未知字段/accessor/非有限值/越界。编译复制输入并隐藏内部参数；输出新建，修改输入/输出不改变计划。
- 无时钟、累计帧、随机状态；相同输入在同环境重复/乱序求值一致。不是整数周期循环；不承诺不同 JS 引擎逐位相同。调用者必须传绝对秒，不逐帧累加固定步长。
- 无颜色、alpha、裁切、阴影、物理折射或流体。density 是风格化脊线强度，不是焦散能量。窄脊/高频在低分辨率或极窄长图上可能严重欠采样/混叠，未提供抗混叠或面积积分。不要用静态帧通过替代常速运动审查。

## 示例、来源与验证边界

[两组中性源码示例](../../examples/folded-ripple.mjs)：横向低频暖色、纵向较高频青色，不含原例排版/标题/素材。颜色是调用层映射；reducedMotion 固定 0 秒。媒体和实测报告留在仓库外。

研究输入为 OpenDesign [固定提交源码](https://github.com/nexu-io/open-design/blob/5a0c47777975ddb91d09c1c16b423a3ef74bf572/plugins/_official/examples/webgl-caustic-pool/example.html)，其官方 manifest 声明 MIT。**未见该例实际可视预览、没有与原图/原片核验**，只读取源码机制；不把源码阅读当审美参考已验证。原实现包含反向 smoothstep（GLSL 未定义边界）与每帧固定 `1/60` 的脉冲老化，两者不移植。独立实现没有第三方 shader、字体、图像、媒体或 WebGL 依赖；许可沿用模块 MIT。

```sh
node --test engine/motion-elements/test/folded-ripple.test.mjs
```

专测覆盖独立零相位中心解析值、seek/24-30-60fps 共同时间点、事件前后/平滑起振/衰减、中心与矩形坐标、参数边界/最大网格、输入输出隔离、拒绝非法输入、两组 raster 示例与 reducedMotion。未测试原 WebGL shader 渲染、GPU 性能、完整作品叙事、真实产品交互或用户接受。仅技术研究候选，不是新成功作品。
