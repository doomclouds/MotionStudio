# 二维加权蒙皮：同一组骨变换带动轮廓与内部纹理

**Experimental 候选。** 一个基础机制。显式绑定、骨数、权重变化不是额外积木；不自动造型、画骨架或做物理模拟。

## 场景与区别

适合叶片、耳朵、布标等有明确控制点的二维柔性图形。外轮廓和内部装饰可以放在同一plan，消费同组骨变换，避免各自运动脱节。
已有 two-link IK 解的是两段刚性长度；hinged-panel 旋转刚性平面；registered-polygon-morph 在两组对应顶点之间插值。
本项从静止顶点、逆绑定和多骨权重求点，不需要目标polygon，也不推断轮廓拓扑。只是变形求值，不保证凸性、骨长、面积、无折叠或真实组织行为。

## 使用

```js
import {compileAffineSkin,sampleAffineSkin}
  from '../lib/foundations/geometry/affine-skin.mjs';
const plan=compileAffineSkin({
  bones:[{id:'base',rest:[1,0,0,1,0,0]},{id:'tip',rest:[1,0,0,1,80,0]}],
  vertices:[{id:'v00',position:{x:40,y:6},weights:[
    {boneId:'base',weight:1},{boneId:'tip',weight:1}
  ]}]
});
const state=sampleAffineSkin(plan,{bones:[
  {id:'base',world:[1,0,0,1,0,0]},{id:'tip',world:[1,0,0,1,80,10]}
]});
// state.vertices: [{id:'v00',x:40,y:11}]
```

矩阵采用Canvas `[a,b,c,d,e,f]`，x'=a·x+c·y+e。rest/world是调用方提供的**世界变换**，不是父子层级局部变换；本API不推导骨层级。
编译计算inverse rest绑定、复制数据并归一化每点权重。数学关系为 `p'=ΣwᵢPᵢRᵢ⁻¹p`；数值使用残差形式 `p+Σwᵢ(Pᵢ−Rᵢ)Rᵢ⁻¹p`，保证所有pose等于对应rest时严格返回原位置。
局部绑定先减rest平移，再乘逆线性部分，减少不必要的大平移消减。

返回深冻结 `{vertices:[{id,x,y},...]}`。bones、vertices、influences按ASCII ID排序，重排输入不会改变求和次序。绘制轮廓须由caller保持显式拓扑ID序列，不能把返回排序当作自动多边形连接规则。

## 输入域与所有权

- bones 1..64；vertices 1..4096；每点1..16个不同骨影响，最多65536总影响。
- 所有ID为1..64位ASCII字母/数字/下划线/连字符。重复骨/点/影响ID拒绝，即使某重复影响weight=0。
- rest点、矩阵平移各±1e6；四个线性分量各±1000。
- 权重有限0..1e6，每点总和必须正。未知骨ID拒绝。pose骨集合必须和plan完全一致，不隐含补缺失骨。
- rest线性变换的最小奇异值至少1e−4、估计2范数条件数至多1e6；按IEEE数值判定并拒绝奇异/过小/过病态。合法镜像rest允许。
- posed矩阵可以奇异或镜像；点的坍缩/翻转是显式输入效果，不自动修复。

普通或null-prototype记录仅接受确切自身data字段；accessor、隐藏额外字段、Symbol、未知键拒绝且不执行getter。数组必须当前realm普通密集数组，无洞/额外属性/accessor。Proxy及被改写JS内建对象不在安全合同内。
plan深冻结并模块品牌化，JSON只是检查数据，不能反序列化伪造plan；重新compile显式spec。不同模块URL实例的plan不可混用。无输入修改、时钟、回调、累积历史或后台缓存。

## 精度与组合限制

权重归一可能使极小权重在IEEE中下溢为0。高条件数、大平移和接近完全坍缩时相对误差可很大；观察到某些合法极端组的绝对误差约1e−6，不是全域上界。精确rest身份不保证任意pose的精确坐标。
输出只要求有限，可超过输入域或旧matrix/绘图helper的接受域；接入其他模块时仍须检查其范围。不能从点位有限推断拓扑有效或跨后端像素相同。

纯求值不含Canvas上下文。调用方提供骨pose和图形绘制；运动可来自旧motion或独立damped-response。局部骨角变化和图形配色不单独计数。

## 验证与作品状态

```sh
node --test engine/motion-elements/test/affine-skin.test.mjs \
  engine/motion-elements/test/rig-response-data.test.mjs \
  engine/motion-elements/test/rig-response-fresh.test.mjs
```

测试包括逆矩阵独立oracle、exact-rest、镜像/坍缩、权重与身份、条件数拒绝、重排/冻结/品牌、随机求值和新进程。实际影片版本、消费范围与分类路径桥接待最终公共包闭合后记录；数值测试不是艺术、听审、完整物理或通用迁移验收。
原理来源和实现后官方对照见[rig-response-reference-decisions.md](rig-response-reference-decisions.md)。

## 公共集成补记

本项已纳入本地公共包候选的index/catalog，仍experimental。最终影片调用、公共路径桥接及明确未完成的视听/用户质量门见[公共集成证据](print-rig-integration.md)；上文“待桥接”描述的是集成前阶段，不表示运行时需要私人影片。发布状态以远端核验为准。
