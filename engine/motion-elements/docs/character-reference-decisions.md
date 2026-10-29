# 角色接触镜头：官方实现对照与取舍

核查日2026-10-29。需求是二维两段肢体在身体移动时够到明确目标，不是把角色整块平移，也不是任意物理模拟。
本批只计划一个解析几何机制；父矩阵、路径、残余回摆及关节数量不重复计数。无第三方代码复制、无新运行时依赖。

## Paper.js：零长度方向不能偷偷依赖历史

固定提交`fcdc9eb2e11965a5ee680923db210f77ce78239b`的
[Point角度/长度处理](https://github.com/paperjs/paper.js/blob/fcdc9eb2e11965a5ee680923db210f77ce78239b/src/basic/Point.js#L286-L407)
和[normalize/rotate](https://github.com/paperjs/paper.js/blob/fcdc9eb2e11965a5ee680923db210f77ce78239b/src/basic/Point.js#L471-L521)
已实际阅读，源码blob `f05a2a0d16ff9ee353aca227f54b8e73197cef7f`。
Point会保存角度，让归零后的长度恢复有方向；两向量求角时处理零分母并钳制acos输入。
这提示我们必须明确零长度、角度与坐标合同，但不照搬其可变`_angle`状态：
本API每次显式接收fallbackAxis，不能靠上一帧或隐藏默认姿态决定完全折叠的解。

其[实际MIT许可](https://github.com/paperjs/paper.js/blob/fcdc9eb2e11965a5ee680923db210f77ce78239b/LICENSE.txt)
blob `84e905d812d93807dbcc0e370b5706ecca0fe4dc`。这里只做合同对照，不移植Point或PaperScript；
若将来复制实质实现仍需保留版权通知。Paper Point本身不是两连杆IK求解器，不能误称同算法迁移。

## Matter.js：有固定长度不等于无状态物理解

固定提交`b8ee71cd7f9b49f53639ddaedd6254f1929bcbe5`的
[Constraint.solve](https://github.com/liabru/matter-js/blob/b8ee71cd7f9b49f53639ddaedd6254f1929bcbe5/src/constraint/Constraint.js#L140-L260)
与[官方Constraint说明](https://brm.io/matter-js/docs/classes/Constraint.html)已实际阅读，源码blob
`b4c86b3d83fe170cc0289983ddb88cdda5673c52`。
其距离约束迭代会更新body位置/角度、累积constraintImpulse，并为阻尼读取positionPrev。
这与直接输入世界root/target、一次返回几何解不同，不因名字里都有“约束”就宣称可无历史seek。

本次目标明确且只有两段，采用原创解析三角几何，不引迭代solver、质量、速度、碰撞或弹簧。
圆片轨迹、接触时段与放手交接由作品显式导演编排；不把IK“够到目标”说成力学抓住物体。
实际[MIT许可](https://github.com/liabru/matter-js/blob/b8ee71cd7f9b49f53639ddaedd6254f1929bcbe5/LICENSE)
blob `0e1ed72ff0030ea67071620dc7466093da8ff047`已核；未复制此solver。

## 其余参考库：按需求而非数量采用

- Anime.js：沿用此前已研究的seek/回调状态边界，本次没有新增播放器；现有绝对帧轨迹足够。
- Remotion、HyperFrames、React Spring：不切换到React/浏览器运行栈，不把阅读行为变成依赖或默认MIT结论。
- PixiJS、p5.js：上一图文批已研究像素覆盖与位移；角色本轮不为使用它们而添加滤镜。
- Three.js、OGL、glTF Transform：本轮是平面两杆几何，无真正3D、骨骼蒙皮或glTF，故不采用。
- Rapier：没有物理body/joint积分需求，不引状态世界或伪称碰撞。
- tsParticles、GL Transitions：目标是少量角色/物体的动作因果，不以粒子或新转场堆数量。
- OBS、OpenCut：仍离线渲染，不新增桌面录制或编辑器。
- Chatterbox、faster-whisper：没有语音克隆/转写需求，不引模型和权重。
- Tone.js、FFmpeg：沿用已核离线声音/编码链，非静音测量与实际听审继续分开。

未采用的库不在本批重新断言其全部许可；需要引入具体版本时仍须重新核源码与资源条件。
候选代码、工程测试或参考阅读都不增加已验证数量；只有真实作品调用与指导、独立审查后才可登记，艺术状态另列。
