# 解析阻尼响应：换目标不断速，冲量显式发生

**Experimental 候选。** 一个标量二阶响应机制；欠阻尼、临界、过阻尼只是同一模型参数，不分别登记。不同于有限艺术残差sampleFiniteSettle，本项维护事件边界的position/velocity连续关系，但不是完整碰撞、叶片、布料或空气动力学。

## 使用场景与接口

适合受控的柔性回弹、目标中途改变后继续运动、短促冲量后的余振。调用方将标量映射为角度/位移；同一输出可驱动蒙皮pose等旧/新几何机制，不在本API里偷偷加入绘图。

```js
import {compileDampedResponse,sampleDampedResponse}
  from '../lib/foundations/motion/damped-response.mjs';
const plan=compileDampedResponse({
  initial:{position:0,velocity:0,target:0},frequencyHz:1.8,dampingRatio:0.7,
  events:[
    {id:'lift',time:0.5,target:12,velocityImpulse:0},
    {id:'tap',time:1.1,target:12,velocityImpulse:-4},
    {id:'release',time:2.2,target:0,velocityImpulse:0}
  ]
});
const state=sampleDampedResponse(plan,1.4);
// {time,position,velocity,target,eventId}
```

恒定目标g之间的模型为 `x''+2ζωx'+ω²(x−g)=0`，ω=2π·frequencyHz。位置单位由caller定义；velocity和velocityImpulse为位置单位/秒。冲量字段直接表示**速度增量**，不是力、质量或冲量物理单位的自动换算。

所有字段必填。事件时间必须严格递增且ID唯一；同一时间的多个动作应显式合成一个事件，不擅自排序或猜执行次序。空events合法。初态和事件目标/速度增量各有限±1e6；frequencyHz0..1000、dampingRatio0..1e4，事件至多512个，事件和采样时间为有限number秒0..86400。这里不接受有理时间对象；外部帧/时钟转换必须显式，不宣称任意精度时间比较。

在事件时刻先求前段状态，再换target、加velocityImpulse。非冲量换目标保持x/v连续，acceleration可跳；冲量有意跳v但不跳x。采样在事件点右连续，包括time=0事件。plan带冻结的before/after transition记录。
编译预求各边界状态，sample二分定位当前段直接计算；乱序、倒放、跳帧不逐帧积分，不依赖上一采样。频率/阻尼在同一plan内恒定，不提供移动目标插值、任意外力callback或有限时长自动归零。

## 数值策略与限制

近临界根使用(ζ−1)(ζ+1)，欠阻尼小角使用sinc，过阻尼慢根用避免大数相减的形式，指数差使用expm1。
当无量纲区间足够小时，24项解析transition Taylor递推保存极小目标响应；这是同一线性响应的直接近似求值，不是固定步长物理模拟。
frequencyHz=0为弹道极限x=x0+v0·t，目标不施力；零阻尼不一定收敛。这里也不会模拟真实物体的重力或接触。

返回位置/速度不钳到输入范围，弹道、共振、连续冲量可能越界；只有非有限返回才拒绝。把输出喂给其他受限模块前须核其范围。
subnormal项、完全衰减指数可下溢，极长无阻尼相位受平台三角约化影响。合法极端长相位近零速度可有约5e−5绝对误差的观察案例；没有全尺度相对误差或所有参数的统一误差界。高频数值可算不代表画面舒适或采样率足够。

普通/null-prototype记录只接受自身data字段；额外/未知/隐藏/Symbol/accessor拒绝。数组当前realm普通密集且无额外属性，非有限/字符串/装箱数字不强制转换。Proxy与被改写内建对象不在安全合同内。
plan深冻且模块品牌化，不能伪造JSON或跨模块实例复用。输出独立冻结，无隐式时间、RNG、缓存或可变状态。

## 复现与工程证据

```sh
node --test engine/motion-elements/test/damped-response*.test.mjs \
  engine/motion-elements/test/rig-response-data.test.mjs \
  engine/motion-elements/test/rig-response-fresh.test.mjs
```

测试覆盖目标连续、显式速度跳、time0与边界排序、三阻尼区间及临界邻居、零频/零阻尼、极小时间、重启半群关系、严格数据、随机seek和新Node。
公开测试另读84组**独立100位矩阵指数**合成fixture，不在测试时调用本solver生成expected，也不要求用户安装mpmath。fixture记录生成方法、生成器hash、每组输入与分区容差；长相位容差刻意更宽，不冒称全域高精度。

实际片参数/调用与分类路径桥接待公共包证据闭合；技术验证与常速、实听、用户艺术和通用生产迁移分别记录。原作品不被目录整理改写。
官方来源及React Spring行为对照见[rig-response-reference-decisions.md](rig-response-reference-decisions.md)。

## 公共集成补记

本项已纳入本地公共包候选的index/catalog，仍experimental。最终影片调用、公共路径桥接及明确未完成的视听/用户质量门见[公共集成证据](print-rig-integration.md)；上文“待桥接”描述的是集成前阶段，不表示运行时需要私人影片。发布状态以远端核验为准。
