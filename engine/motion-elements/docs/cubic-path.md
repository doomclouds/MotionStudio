# 三次曲线路径：近似距离寻址与解析切线（experimental）

## 适用画面与去重

用于以控制柄创作的弯曲路线：标记点按近似路程推进，或者把方向明确的对象交给路径切线。输入是真实三次Bezier曲线，不把`progress`直接代入Bezier参数冒充匀速。既有`compilePolyline/samplePath`继续适合折线；本机制增加的是控制柄曲线的有限精度编译与求值，不是多一种折线颜色、方向或速度。

没有导航/最短路、碰撞、速度积分、路径自动规划、SVG解析、字体测量、文字shaping或绘图器。绝对时间由调用者换算成progress；模块不读时钟，不保存上次位置。

## API

```js
import {compileCubicPath, sampleCubicPath}
  from '../lib/foundations/geometry/cubic-path.mjs';

const plan = compileCubicPath({
  segments: [{
    p0: {x: 20, y: 160}, p1: {x: 100, y: 160},
    p2: {x: 180, y: 40}, p3: {x: 300, y: 40},
  }],
  tolerance: .02,
});
const state = sampleCubicPath(plan, .5);
// state.position, state.unitTangent, state.angle
```

### `compileCubicPath({segments, tolerance})`

所有字段必填；未知字符串/symbol/不可枚举字段、非plain记录、NaN/Infinity拒绝。记录允许null-prototype；segments必须是本realm的普通稠密Array，不接受Array子类/跨realm数组/附加字段。

- `segments`：1..16段，每段恰为`{p0,p1,p2,p3}`，每点恰为`{x,y}`。
- 每个坐标在`[-16384,16384]`。此域是设计/渲染局部单位，不是经纬度或物理米。
- 相邻段必须严格满足前段p3与后段p0的x/y数值相等。只要求位置连续，不替调用者保证切线连续。
- 每段四点完全相同会拒绝；首尾相同但控制柄形成闭环/折返并不自动拒绝。
- `tolerance`：`[.001,1]`，控制下述两个IEEE停止诊断。不是精确弧长或任意输入的严格世界坐标误差证明。
- 总近似长度必须至少`1e-6`。累计距离不能严格增加、无法满足停止诊断或达到固定资源上限时，整次编译失败，不返回部分计划。
- 最大深度24、最大32768叶区间、最大65536被访问节点。不能为某一输入静默放宽tolerance或突破资源上限。

输出深冻且复制输入：

```text
{
  segments, totalLength, tolerance,
  approximation: {
    lengthMethod: 'subdivision-chord-sum',
    leafCount, lengthBracketGap, maxParameterDeviation
  }
}
```

plan是本模块实例创建的品牌对象，不能用JSON/浅拷贝伪造。它没有公开可写的距离表。复制原始定义后重新compile才是新模块实例/新进程的可复现方法，不是序列化plan后直接sample。

### `sampleCubicPath(plan, progress)`

`progress`必须为有限数`[0,1]`，不wrap、不外推；求值不改变plan。

```text
{
  position: {x,y},
  unitTangent: {x,y} | null,
  angle: radians | null,
  tangentDefined: boolean,
  distance, segmentIndex, parameter
}
```

- `distance = progress * totalLength`是编译表中的距离地址，**不是反过来测出的精确曲线弧长**。
- `segmentIndex`为0基，`parameter`是该原始cubic的近似反查参数`[0,1]`。position通过原始cubic求值，不把折线弦上的点冒充原cubic点。
- 开头/末尾直接返回作者端点；精确落在表的距离边界时选outgoing区间，最终端点用incoming区间。把某距离先除以总长再乘回来可能有IEEE舍入，不能宣称每个数学边界都精确落点。
- 切线来自该参数处解析导数的方向。端点导数为零时，用第一/最后非重合控制方向的一侧极限；内部IEEE导数两分量恰零时返回`false/null/null`，不借前一帧方向。邻近驻点的方向会敏感，不能把位置精度诊断当角度误差界。
- 多段连接只要求C0，连接处方向可能跳变；`atan2`还可能跨负x轴跳约2π。模块不提供角度解缠或历史平滑。

需要沿路径定向的调用者必须检查`tangentDefined`。错误品牌、非法progress直接报错；不默默改用另一种路径或默认方向。

## 数值方法及限制

原创实现使用de Casteljau二分。每个叶区间同时检查：

1. 控制多边形长度与弦长的非负差，按参数区间宽度分配全路径tolerance预算。
2. 两个内部控制点相对“按参数均匀分布的直线控制点”的最大偏差不超过tolerance。

第二项不可省：对`p0=p1=p2=(0,0), p3=(100,0)`，曲线虽然是直线且长度gap为0，`x(t)=100t³`却不是线性速度。简单地拿距离比例当t会让半程落在12.5而非约50。测试包含这个反例、其反向、闭环、折返与驻点。

编译表按叶弦长累加；寻址在所选叶的已存距离区间内插值参数，再求原cubic位置。细分阈值、累计、归一化与导数都用IEEE-754。`lengthBracketGap`和`maxParameterDeviation`是算法的停止诊断，虽受请求tolerance限制，但**不是经过区间算术认证的端到端误差界**；不能把它们写成任意坐标/角度/真实速度都被严格保证的精度。更小tolerance通常会增加成本，极端输入可以被资源门拒绝。

本模块不缓存不同帧的计划。控制点随画面改变时，由调用者用该时刻明确的控制点重新编译；顺序/乱序跳时使用相同输入得到相同结果。变形引起的总长变化是调用者编排问题，不是自动保速/保位。

## 工程验证与作品门

专属测试覆盖正常/边界/非法结构、t³非匀速直线、段连接、闭环/折返、驻点、输入复制与深冻、品牌隔离、资源拒绝、720次合成变形与独立Node进程输出一致。另有70位独立导数速度积分/Bernstein oracle及有限CPU/heap探针；这些只说明明确样本域内的工程结果，不是全域数学证明、长期耐久保证或艺术认可。

本机制已在一支9.5秒有声原创候选中真实消费：初始化3次compile（直线路线、四段路线及估算弯段末端的前缀）；5785次公sample中，3297次建立绘图缓存、1918次直接供绘图、570次只供相机取景。缓存复用不是每帧重新compile；前缀自身长度是近似地址，不是全路径的数学exact seam。glyph内部调用sample不混入公wrapper计数。

正常切线分支、作者明确路线有调用/限定编码帧证据；闭环、驻点、极端输入与资源拒绝只有工程检查，没有本片视觉验收。实际导入两模块及validator字节与影片冻结一致，后续index/catalog接入不改历史回执。私有源hash/参数/帧区间/影片保留在作品交付，不复制到公开库。常速NOT_DONE、听审NOT_LISTENED、用户艺术PENDING_USER、通用迁移NOT_RUN；技术通过不构成高质量设计或默认风格推荐。

纯几何API没有reducedMotion字段。无障碍版本由调用方在相同项目时段内使用静态终态或明确的更少运动编排；不要改变时间范围，也不要把本片普通运动验收扩称reduced-motion验收。

## 官方原理研究与许可

参考了Paper.js固定提交`fcdc9eb2e11965a5ee680923db210f77ce78239b`的[Curve.js](https://github.com/paperjs/paper.js/blob/fcdc9eb2e11965a5ee680923db210f77ce78239b/src/path/Curve.js)、[Numerical.js](https://github.com/paperjs/paper.js/blob/fcdc9eb2e11965a5ee680923db210f77ce78239b/src/util/Numerical.js)及[官方Curve文档](https://paperjs.org/reference/curve/)：曲线参数与长度地址必须分开，长度本身是数值近似。该固定源码走速度积分/有界反查；这里使用不同的原创细分诊断与弦长表，没有复制其实现或引入其运行时。[实际LICENSE.txt为MIT](https://github.com/paperjs/paper.js/blob/fcdc9eb2e11965a5ee680923db210f77ce78239b/LICENSE.txt)。无新增安装、第三方运行依赖或字体/媒体资源。
