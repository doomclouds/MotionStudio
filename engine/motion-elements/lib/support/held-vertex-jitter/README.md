# Held vertex jitter · 分帧保持的顶点扰动

未注册、direct-import support candidate。`index.mjs` 输出作者折线顶点的小幅偏移；不是新增catalog基础机制，不变更公共barrel。与现有 `motion.shake` 去重：shake平滑改变整体矩阵，本项让各顶点在固定若干帧内不动、到下一组才更新，能得到有限的沸腾线。它既不裁切路径，也不重做polyline-sections的弧长支持。

```js
import {compileHeldVertexJitter,sampleHeldVertexJitter} from './index.mjs';
const plan=compileHeldVertexJitter({
 points:[{x:10,y:20},{x:50,y:20},{x:80,y:50}],
 seed:'route',amplitude:1,holdFrames:4,lockEndpoints:true,
});
const {points,tick}=sampleHeldVertexJitter(plan,12);
// caller moveTo(points[0])、lineTo其余；不是输出SVG或自动绘制。
```

输入点遵守现有compilePolylineSections的2..4096密集点、相邻非零距离、有限坐标及资源限制；编译复用该实现，复制后冻结。seed必需字符串≤128字符；amplitude默认1、0..100；holdFrames默认4、1..10000整数；lockEndpoints默认true、必需布尔。可移动点须在±1e6坐标域内为amplitude预留余量；记录拒未知字段与getter，不是恶意对象沙箱。采样frame为0..1e9整数，tick=floor(frame/holdFrames)，使用现有seededUnit按顶点/轴/tick独立取值；无时钟、随机流或上帧缓存。输出深冻结，任意顺序/跳帧/重放一致。

每轴偏移≤amplitude，不表示欧氏距离≤amplitude。lockEndpoints锁两端；显式首末同点的闭合坐标即使不锁端点，也共享首顶点偏移以免裂缝。其余点不自动锚定、不保证拓扑/切线/面积/碰撞。大扰动可自交、翻折或让相邻点重合；编译预留坐标余量，但不保总弧长/短段不退化。因此用于重编译路径时仍须验证，不把本项用于精确统计图、汉字笔画轮廓或碰撞计算。原几何需留足段长、形状和累计长度余量。

固定4帧在30fps等于7.5次/秒，在24fps则6次/秒；这是帧分组而非Hz。动画中的主运动先按连续时间计算，再决定是否在同一局部空间应用材质扰动；不要把整个人物动作也锁成低帧率。只需静态不规则边缘时固定frame=0，避免背景每帧闪烁。

## 证据与运行

`examples/contract.mjs` 有开放路径与闭合纸卡两种内容。纯测试核偏移边界、锁端点、闭合缝、固定帧组、零振幅、不可变、拒坏值与重放。Native测试实际把两种输出画成线，验证组内像素相同、组间不同及乱序重放；闭合例显式closePath。另由paper-drawing的held-annotation技术例真实串联当前顶点→保角裁切→同源笔尖。没有真实影片迁移、常速观看、中文自然书写或视觉接受声明。

```sh
node --test engine/motion-elements/lib/support/held-vertex-jitter/test/contract.test.mjs
MOTIONSTUDIO_CANVAS_MODULE=/absolute/installed/@napi-rs/canvas node --test engine/motion-elements/lib/support/held-vertex-jitter/test/native.test.mjs
```

Node24；Native测试需要已有依赖，不安装、不联网、不产出媒体。portable中engine替为runtime。原创代码沿模块MIT；没有复制来源影片函数或第三方字形。
