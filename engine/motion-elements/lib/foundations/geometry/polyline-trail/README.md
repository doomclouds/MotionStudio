# polyline-trail（experimental）

<!-- asset-self-description: geometry.polyline-trail -->

## 当前资产入口

本页是`geometry.polyline-trail`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/polyline-trail.test.mjs)保留原断言。旧实现、专属测试及scene位置不留wrapper；paths-and-contours仅保留跨机制导航。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


## 局部弧长路径与空间拖尾

一个机制 `geometry.polyline-trail`（experimental），不是把采样函数数量算成多个效果：

```js
import {compilePolyline,samplePath,sampleTrail} from '../../../index.mjs';
const path=compilePolyline({points:[{x:0,y:0},{x:120,y:0},{x:120,y:80}]});
const head=samplePath(path,0.1);
const trail=sampleTrail(path,{headProgress:0.1,length:45,samples:16});
// head: {position,unitTangent,distance,segmentIndex}
// trail: {tailDistance,headDistance,points:[same shape as head]}
```

- compile 只计算一次累计弧长，复制并深冻结输入；2..1024 个点，坐标各在 ±1e9 内。相邻重复、长度低于最小正常浮点数（2.2250738585072014e-308）、累计长度无法增加的段一律拒绝。只接收当前模块实例编译结果；序列化后应从 points 重新 compile，不接受伪造缓存。
- progress 必须在 [0,1]，不自动 clamp；按局部累计弧长分配，不按段数等分。精确顶点选出发段，末端选入射段；尖角方向可能跳变，不宣称平滑朝向。
- length 是有限非负**局部空间弧长**，不是秒、屏幕像素或比例；samples 是 2..256 整数。严格区间为 [max(0,headDistance-length),headDistance]。即使起步 headProgress<0.2，任何点都不能领先头部。length=0 返回重复头部点。
- points 为固定数量的等弧长采样；用直线相连跨越尖角时可能近似切角，不是保留全部顶点的精确路径裁剪。增加 samples 可降低近似误差，不承诺消除所有尖角误差。
- 路径函数不读时钟、不保存上一帧。外层通过已有 rational 时间与 sampleMotion 的 progress 驱动；换时间曲线就改变速度。非均匀父缩放后不保证屏幕等速，朝向和父矩阵由调用者显式处理。
- reduced-motion 在示例层选择静态终态，同时保留原时间范围；数学采样 API 不接收未实现的 reducedMotion 字段。
- 该折线API不提供 Bézier、粒子模拟、碰撞、平滑拐弯、时间历史拖尾或 finite-settle 新曲线；这些不应从路径采样能力推断。

两类合成内容在同一 8 秒、非正方形画布 demo：四段电路路径，以及旋转父坐标下的三个流程节点。使用相同函数，不含私有素材。

```sh
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/path-demo-new --demo path
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/path-still-new --demo path --frame 43
```

CLI 默认仍是原十宫格 `--demo gallery`；path demo 保持现有输出文件名 `motion-elements-gallery.mp4`，render.json 的 demo 字段区分内容。技术测试与合成展示不代表真实生产迁移或艺术认可，须另记证据。


## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/geometry/polyline-trail/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/geometry/polyline-trail/test/*.test.mjs
```

保留共享validate及公开barrel引用的math/time/matrix、timeline依赖；Canvas绘制仍复用原共享适配层，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

编译计划或band品牌仅当前canonical模块实例有效；保存原始输入重新compile，polygon绘制还要求对应的真实sample状态。输出深冻，不保留可变输入或播放历史。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。

原合成示例：[path-scene.mjs](examples/path-scene.mjs)，可调用Canvas函数或gallery scene；不是自动生成的生产影片。
