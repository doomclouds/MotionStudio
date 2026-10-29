# 凸平面刚性铰链（experimental）

## 用途与计数

平铺纸面沿明确折线抬起，印刷窗格随纸面一起转动；第二块面可以跟随已折起的父面，再绕自身折线折起。适合纸艺卡片、包装展开和受控的平面道具动作。

这是一个 **XYZ 坐标中的刚性凸平面铰链几何机制**，可由调用者投影到 Canvas 形成 2.5D 画面；不是纯二维旋转算法，也不是通用三维渲染器、纸张力学或实心模型系统。只计 `geometry.hinged-panel` 一项；编译、求值、装饰点辅助、父子层次和角度变体不再计数。

既有二维 transform 不保留离开画面平面的折叠几何；plane-parallax 只处理始终面向画面的校准图层。这里新增明确铰轴、刚性面片及父×子组合，不重复它们，也不替代它们。

## 最小运行例子

```js
import {compileHingedPanel, sampleHingedPanel, transformHingedPoint}
  from '../lib/foundations/geometry/hinged-panel.mjs';

const plan = compileHingedPanel({
  vertices:[{x:-40,y:0,z:0},{x:40,y:0,z:0},{x:40,y:0,z:60},{x:-40,y:0,z:60}],
  hinge:{from:{x:-40,y:0,z:0},to:{x:40,y:0,z:0}},
});
const state = sampleHingedPanel(plan,{angle:-Math.PI/3});
const printedPoint = transformHingedPoint(state,{x:0,y:0,z:30});
// 示例正交画法：只是调用方投影，不是新的公共相机 API。
const project = p => ({x:160+p.x-.35*p.z,y:150-p.y+.25*p.z});
const polygon = state.vertices.map(project);
// 将 polygon 作为 Canvas path；印刷点也必须使用同一 project。
```

库不访问 Canvas、文件、字体、时间或全局动画循环；给定角度和同一父状态可反复/乱序求值。用旧时间函数生成 angle，或为 reduced-motion 固定终态角度并保留作品时段；本接口不增加专用 reducedMotion 字段或替用户决定可读性。

## 严格输入

`compileHingedPanel({vertices,hinge})`：

- 所有记录均须是当前 realm、`Object.prototype` 原型的普通对象；**不接受 null-prototype、跨 realm 记录或类实例**。这是本新接口的明确范围，不等同于其他模块允许 null-prototype 的合同。
- 未知自有字符串、不可枚举字段和 Symbol 字段全部拒绝；必填字段必须自有，不能继承提供。已知字段可以不可枚举。
- `vertices` 为当前 realm 普通稠密 Array，3..64 个 `{x,y,z}`；无额外自有属性、重写 map、稀疏索引或 Array 子类。
- 所有输入点的各坐标均为 `[-10000,10000]` 有限 number，包括 hinge 和辅助点；不做字符串转换。
- `hinge` 恰含 `{from,to}` 两点。轴的长度须至少 `1e-8`。轴不必是多边形边，可以穿过内部或位于面外，但必须通过下述共面检查。
- 顶点按顺序描述严格凸多边形。顺时针/逆时针均可，第一组三点决定 normal；翻转顶点顺序会翻转 normal，不翻转铰轴角度方向。

`sampleHingedPanel(plan,{angle,parent?})`：

- plan 必须由此 canonical 模块实例编译；复制/JSON 反序列化/另一实例的 plan 不可用。
- angle 是 `[-2π,2π]` 有限弧度，不截断、不自动按时间推进；正方向遵循 `from→to` 的右手定则。
- 若提供 parent，必须是同一模块的合法 sampled state。显式 `undefined`、`null`、任意矩阵和克隆 state 拒绝；继承的 parent 不被读取。
- 根为第1层，最多128层祖先组合；第129层整次拒绝。深度为私有 WeakMap 元数据，不是全局调用计数；重复采样同一父节点和独立分支不消耗额度。128是资源/累计组合范围，不是数值误差上界。

验证不是恶意 getter/Proxy 或被篡改内建原型的执行沙箱。输入 getter 自己的副作用不由本库保证隔离。

## 浮点几何合同

1. 由前三点的叉积求 normal；叉积模长 `<1e-8` 拒绝。这是面积量级条件，与轴/边长度条件的单位不同，不能当作统一“最小尺寸”。
2. `scale=max(1,最大顶点到首点距离)`，共面容差为 `scale*1e-9`。所有顶点和两铰点到该参考平面的有符号距离绝对值不得超过容差。
3. 对每条边，所有非端点顶点在 normal 方向的内半空间值必须 **严格大于** `tolerance*edgeLength`。边长度 `<1e-8` 拒绝。重复点、共线退化、凹形和交叉顺序不接受。

这是 JavaScript IEEE 浮点判定，不是 exact-real/symbolic convexity 证明，不保证任意微小、狭长或近共线合法多边形都被接受。非常接近阈值的分类可受舍入影响。容差内的轻微离面点保持原坐标，**不投影/吸附到平面**；因此接受的面可有容差内的非共面残差。

铰轴也只检查两端点各自到参考平面的距离，**不另验axis与plane平行，也不将轴投回平面**。短轴的法向差可能主导方向：例如XY大方面容差约1.4e-5时，轴端点z为±1e-6仍可接受，轴却沿normal，得到平面内旋转而非折页。需要实际折页时，调用者须提供同面且足够长、方向明确的铰轴；端点容差不能被当作轴方向误差界。

局部旋转由 Rodrigues 公式构造，平移为 `a-Ra`（a 为铰轴起点）。没有 epsilon 修正、旋转归一或求值历史。`0`、`±π`、`±2π` 的三角函数仍按浮点计算，不能承诺所有对应点逐位精确重合。边长、铰点与法向量测试的观察残差不是整个输入域的证明界。

## 父子共同画稿坐标与输出

父面和子面在**同一未折叠画稿坐标系**中编写，子折线也在这个坐标系；先做子局部铰链，再应用父状态，即 `parent × local`。它不是先把子点改写为父节点局部坐标再套第二次父变换。若希望接缝不裂开，调用者必须将子折线明确放在父面连接边上；API不检查父子实际相邻、是否共用边或组合是否构成闭合实体。

返回值递归冻结，复制输入点，不保留可写调用者数组：

```text
plan  = {vertices,hinge:{from,to},axis,normal,centroid,tolerance}
state = {angle,matrix,vertices,normal,centroid,hinge:{from,to}}
```

- `matrix` 是 **12元素 row-major 仿射3×4矩阵**，`x'=m0*x+m1*y+m2*z+m3`，y/z按后两行。不是 Canvas 的6元素矩阵，不能直接传给旧 `withMotion` 或 `ctx.transform`。
- state.angle 保留本节点局部角度，不是父子合成后某个全局欧拉角。
- normal 仅乘旋转部分，不加平移、不在每层重新归一；parent 多次组合会积累舍入，不能承诺任意深度逐位正交。
- centroid 是 **顶点算术平均**，不是面积加权多边形重心；不提供面积/惯量/光照计算。
- `transformHingedPoint(state,{x,y,z})` 用完全相同的矩阵变换印刷点/附着点，是未计数辅助。点不必在面内或面上。
- 输出世界坐标可以超出输入±10000域；不能不经判断将它再次当作合法 authored input。没有 world-to-screen、near裁切、透视纹理变形或反变换辅助。
- 计划/state 仅模块私有品牌有效，公共 index re-export 共享同一实例；用不同 query URL 加载 canonical 文件会创建另一品牌。

编译最多64×62个非端点半空间检查，采样最多64点、常量大小矩阵计算；无积分、跨帧缓存、随机数或递归场景遍历。丢弃的品牌由 WeakSet/WeakMap 弱持有，不保留场景历史。层数上限不替代应用自己的帧/对象/内存预算。

## 不提供的视觉与物理能力

投影、画面裁切、层级构建、遮挡排序、光照/阴影、纸张厚度/弯曲、碰撞、约束解算、实体闭合、纹理网格和音画 cue 均由作品负责。本机制不调用 Three.js、WebGL 或物理库；XYZ 几何不自动带来真实三维渲染质量。按 centroid 排序只是某些项目的画法，不是此 API 对任意穿插面片的可见性保证。

## 验证作品与版本关系

已存在10.8秒、60fps有声候选：8个三角/四边面计划，648帧共5184次面状态求值并实际提交多边形；136752次辅助点变换确实进入印刷线/窗格绘制。背向或被其他面挡住的提交不冒称始终可见。复用既有 motion.stagger、motion.opacity；finite-settle、时间工具和Canvas适配为已有支持，不重复计数。摄影机、海面、水纹、灯光和船是项目编排，不是新公共机制。

原作品冻结候选的未知自有字段校验过宽。入库版收紧完整own字段、必填own、普通稠密数组和128层父链；没有修改原视频、原runtime或历史manifest。修复版的实际影片参数全帧状态/绘图路径与代表Native PNG等价桥接另有回执；**不声称源码字节仍与旧片相同，也不声称重新编码了整片**。公共index接入另测，不说旧片曾import它。

工程检查与有限编码帧复看不等于常速、听审或艺术通过：常速NOT_DONE、听审NOT_LISTENED、通用迁移NOT_RUN。用户对整组三片给出总体正面意见，仅记组级反馈，不推断此单片/具体参数或音频细节单独验收；单项艺术仍待明确。空/退化/128层极值/恶意结构等仅工程分支，并未在作品中获得视觉认可。

复现合成接口：`node --test test/hinged-panel.test.mjs test/hinged-panel-integration.test.mjs`（motion-elements目录）。完整私有作品媒体、字体、实际美术参数与回执不进公共仓库；上方例子可复现本机制而非重建全部影片。

## 入库前外部核验与许可

原候选由项目自行实现 Rodrigues 旋转和仿射父子组合，制作时没有读取或移植外部库。以下是**入库前补充核验**，不倒填成创作时已经参考过。

实际读取 Three.js 固定提交 [`83f6bd095356c68334df7d9b7ec03a0abebff3fc`](https://github.com/mrdoob/three.js/tree/83f6bd095356c68334df7d9b7ec03a0abebff3fc) 的 [Matrix4.makeRotationAxis](https://github.com/mrdoob/three.js/blob/83f6bd095356c68334df7d9b7ec03a0abebff3fc/src/math/Matrix4.js)（blob `3620aecfae3e737125b91de3383201aa81a45099`）、[Object3D.updateMatrix / updateMatrixWorld](https://github.com/mrdoob/three.js/blob/83f6bd095356c68334df7d9b7ec03a0abebff3fc/src/core/Object3D.js)（blob `95d8aa36f1279be4548158442e5c3362ed7025ef`）及 [MIT LICENSE](https://github.com/mrdoob/three.js/blob/83f6bd095356c68334df7d9b7ec03a0abebff3fc/LICENSE)（blob `8ada2a5f982916b0ba4b7a0aa7de347587e745d7`）。核对任意轴旋转、pivot平移与父×子次序；Three.js内部为column-major 4×4且是可变场景对象，本接口为冻结row-major 3×4，不可直接互换数组，不复制其源码或引入依赖。

Matter.js/Rapier的积分刚体、glTF Transform的模型管线、OGL/Three.js渲染场景管理不承担本片的明确折角编排；Anime.js/React Spring等播放器也不是此静态求值几何的新增需求。其余参考库沿用既有对应场景决策，不为“参考过20库”强行安装或新增20种变体。无第三方代码/资源复制，因此不附不存在的第三方代码归属声明；若未来移植外部代码必须另核许可证并保留通知。
