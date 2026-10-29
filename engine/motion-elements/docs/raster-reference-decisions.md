# 图文像素批：官方机制与许可对照

核查日2026-10-29。只服务“完整分辨率字形coverage＋纹理局部压力位移”的实际镜头需求。
下面是读过具体入口后的合同对照，不是下载库或把参考实现直接搬入本库。
本批保留Native Canvas，零新增运行时依赖；新CPU实现为本项目原创，第三方源码未复制。

## p5.js：图像遮罩的覆盖意义与状态差异

实际固定提交`fee4d86ccfcd914c0e79f81863e62a6ad4913aeb`：
[Image.mask源码](https://github.com/processing/p5.js/blob/fee4d86ccfcd914c0e79f81863e62a6ad4913aeb/src/image/p5.Image.js#L999-L1048)，
[许可文本](https://github.com/processing/p5.js/blob/fee4d86ccfcd914c0e79f81863e62a6ad4913aeb/license.txt)，
以及[官方mask说明](https://p5js.org/reference/p5.Image/mask/)。源码blob为`59fdc14251e3df1cf1701cf4c188a18de96477ff`，许可blob为`602010bac7f5f49d168d0b1987863708cb177b2d`。

它按图像/渲染器像素密度组织复制区域，以destination-in把mask覆盖作用到当前image/GIF帧，
正常路径恢复原composite状态，并标记图像已修改。官方说明也强调累计应用与密度缩放。

本批采用的是覆盖图与源alpha共同决定可见性的原则；**刻意不采用**隐藏密度缩放、
修改源图/GIF或累计遮罩状态。两个输入必须等尺寸，输出新不可变快照；按绝对帧重新求值时
不依赖上一帧是否执行过。文字布局和coverage生成由制作场景提供，并不是p5 typography被移植。
实际许可文本为LGPL2.1，不复制实现到本项目MIT文件，不把阅读行为当依赖引入或许可证豁免。

## PixiJS：逆向纹理取样不是刚体移动，也不是光学折射

实际固定提交`2e8cacbe1ed4ed0fc31d5b59b9895c811ac0e003`：
[DisplacementFilter](https://github.com/pixijs/pixijs/blob/2e8cacbe1ed4ed0fc31d5b59b9895c811ac0e003/src/filters/defaults/displacement/DisplacementFilter.ts)、
[GLSL](https://github.com/pixijs/pixijs/blob/2e8cacbe1ed4ed0fc31d5b59b9895c811ac0e003/src/filters/defaults/displacement/displacement.frag)、
[WGSL](https://github.com/pixijs/pixijs/blob/2e8cacbe1ed4ed0fc31d5b59b9895c811ac0e003/src/filters/defaults/displacement/displacement.wgsl)，
以及[MIT许可](https://github.com/pixijs/pixijs/blob/2e8cacbe1ed4ed0fc31d5b59b9895c811ac0e003/LICENSE)。
对应blob为`b9aa756c726a69bd0f4b64023b37f7222b6424fe`、`e63c5a854de534c49bda2fed04f2b68cbc5ea0e1`、
`5c199b3e61bc8749e436bcbe975f679dc274c48d`、`13f706e9d211dabcd69c80951b0f834f9c70f6c6`。

两种shader均由输出坐标反查源纹理，使用map的RG−0.5与scale，按input尺寸归一化、应用旋转，
然后钳住输入取样范围。所读表达式不使用map alpha。wrapper从map sprite世界变换中提取旋转，
分别创建GL/GPU program，因此不是当前Native Canvas的即插即用滤镜。

本批用同类逆查找解决实际双色纹理压力场，但有明确差异：byte128精确中性、
`(byte−128)/128`的略非对称量纲、map alpha门控局部强度、equal-size local map、
显式nearest或预乘alpha bilinear、可选transparent边缘。没有sprite世界旋转或GPU采样状态。
因此**不声称Pixi等价、相同滤镜参数的跨后端同图或真实物理折射**。
MIT许可仍要求复制实质代码时保留通知；本批没有复制其shader/wrapper，没有安装Pixi。

## 为什么需要双线性，但它不是第三个积木

制作方实际输入是紧致ROI中的高对比曲线条纹与局部移动压力场；
nearest会使字内纹理以整数像素跳动，因此增加显式bilinear模式而不是偷换默认采样。
透明RGB在插值前预乘alpha，避免透明蓝色污染可见红色边缘；mask在位移之后应用固定字形边。
整数查找、分数边缘、低alpha量化、正负偏移、原字节identity分别测试。

CPU bilinear的已测IEEE半byte量化边界与精确有理数oracle有1LSB差（不是所有输入的误差上界）。
bilinear在alpha半byte阈值也可能由1舍为0并清RGB，RGB差可达255，尽管预乘贡献很小。
nearest的浮点半texel阈值可能选择不同邻像素，通道差可达255；它不遵从精确有理数tie规则，
不能承诺数学零误差或靠统一epsilon把round结果“修”成某个后端。
模糊放大字形不能靠bilinear补救：coverage必须在实际最终像素空间绘制；
本批2,097,152像素上限来自全HD需求，不是新增“高分辨率”机制。

## 用户所列20库在本批的取舍

| 库 | 本次决定 |
|---|---|
| Remotion / HyperFrames / React Spring | 不切React/浏览器时间线运行栈，已有绝对帧与Native满足实际镜头；不把三者许可默认写MIT。 |
| Anime.js | 继续已有绝对时间合同，上一数据批已读固定seek源码；本批未复制其播放状态逻辑。 |
| PixiJS | 本批实际深读shader/wrapper/许可，采用逆取样原则而不引后端，见上。 |
| p5.js | 本批实际深读Image.mask/许可，采用coverage意义但保持不可变等尺寸合同，见上。 |
| Paper.js | 字形由现有Canvas字体coverage生成，本片无路径布尔/自适应flatten需求；不强塞新矢量API。 |
| Matter.js / Rapier | 压力场是导演显式二维map，不假装刚体/流体模拟，不引物理状态求解。 |
| Three.js / OGL / glTF Transform | 无真正3D或glTF资源，本批不采用。 |
| tsParticles | 红线是单一可追踪元素，不以粒子堆掩盖身份或计数。 |
| GL Transitions | 不切换GL shader过渡，双色底变使用已有动作/遮罩编排。 |
| OBS | 离线直接渲染，不做桌面录制。 |
| Chatterbox / faster-whisper | 无语音生成/克隆/转写需求，不引模型或权重。 |
| Tone.js / FFmpeg | 沿用上一批已核的离线声音/实际编码链原则；原创声音、实际音轨测量与听审分开，无新依赖。 |
| OpenCut | 本次不做编辑器，沿用现有渲染/封装工具。 |

其余库并未在本批重新声明许可证结论；需实际采用时仍要查相应版本、入口和资源许可。
上一批相关官方决定见[data-flow-reference-decisions.md](data-flow-reference-decisions.md)。
这份研究既不新增机制数量，也不把候选片提升为艺术通过。
