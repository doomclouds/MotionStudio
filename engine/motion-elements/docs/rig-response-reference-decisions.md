# 蒙皮与阻尼：真实研究来源、官方对照和许可

实现与测试为原创，无复制外部实现代码、无新增运行时依赖。原作者实际先读的数学材料与后来的独立库对照分开记录。

## 原始数学研究

- [SIGGRAPH 2014 Skinning: Real-time Shape Deformation](https://www.skinning.org/)：显式加权变换、逆绑定及变形局限。未复制讲义图片/源码；阅读不把课程资料改成项目MIT内容。
- [MIT 18.03SC Damped Harmonic Oscillators](https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-ii-second-order-constant-coefficient-linear-equations/damped-harmonic-oscillators/)及[RES.8-009 Lecture 4](https://ocw.mit.edu/courses/res-8-009-introduction-to-oscillations-and-waves-summer-2017/mitres_8_009su17_lec4.pdf)：二阶线性模型与阻尼分类。未复制课程图/音频/代码，不改变其材料权利边界。

## 用户所列库的实现后独立核对

以下于2026-10-29实际读取，是候选已写出后的对照，不倒填为作者当时的来源。

### Three.js：逆绑定与加权顶点

固定commit `0af9729d0c143a86a1d725d6e2c3ad83301f3f34` 的 [Skeleton.js](https://github.com/mrdoob/three.js/blob/0af9729d0c143a86a1d725d6e2c3ad83301f3f34/src/objects/Skeleton.js)、[skinning vertex shader](https://github.com/mrdoob/three.js/blob/0af9729d0c143a86a1d725d6e2c3ad83301f3f34/src/renderers/shaders/ShaderChunk/skinning_vertex.glsl.js)和[skinbase shader](https://github.com/mrdoob/three.js/blob/0af9729d0c143a86a1d725d6e2c3ad83301f3f34/src/renderers/shaders/ShaderChunk/skinbase_vertex.glsl.js)实际核对inverse bind-time world、current world×inverse bind与四个显式骨影响；[该版MIT许可](https://github.com/mrdoob/three.js/blob/0af9729d0c143a86a1d725d6e2c3ad83301f3f34/LICENSE)亦已读。

候选是二维仿射数据求值，不引入Three对象层级、mesh/WebGL或真3D；exact-rest残差形式、16影响上限和数值拒绝域都是本API自己的合同，不声称Three兼容或移植。线性权重不能保证刚性、面积或无折叠。

### React Spring：状态积分不等于绝对时间解析响应

官方v9.7.5 annotated tag解到commit `8b09751fbde6c20e542312db75c48df61714e3b1`，实际读取 [SpringValue.ts](https://github.com/pmndrs/react-spring/blob/8b09751fbde6c20e542312db75c48df61714e3b1/packages/core/src/SpringValue.ts)与[MIT许可](https://github.com/pmndrs/react-spring/blob/8b09751fbde6c20e542312db75c48df61714e3b1/LICENSE)。其advance(dt)的spring分支读上次位置/速度，按1ms小步积分，并带rest阈值及可选bounce/clamp；duration/decay是另外分支，不能混称全都解析弹簧。

本候选不采用该frame loop，而是固定频率/阻尼、显式分段恒定目标与速度增量的绝对时间求值。需要自己的事件连续/临界数值/乱序测试；官方实现不能替代这些证明。没有引入React、实时碰撞或自动交互系统。

## 与已有积木的去重

two-link IK、刚性hinge、注册polygon morph、有限settle各自仍保留原合同；它们不是本次蒙皮/解析响应的别名。绘图、骨pose编排、雨点、手端IK、声音和艺术资产不另外计数。共享严格数据helper为支持层，不算基础。

MIT参考实现没有被复制进原创代码；若后续复制任何实质代码必须保留对应notice。公开包只含原创源、合成测试/fixture与文字指南，不含作品、私有rig权重/镜头时点、字体/音源或课程材料。
