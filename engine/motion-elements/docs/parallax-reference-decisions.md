# 平面视差：官方相机合同与明确不做的事

核查日2026-10-29。本批只解决卡片视窗与分层场景间的连续比例/位移关系，不新增真正3D、GPU后端、网格或蒙皮。
原稿校准平面投影为本项目原创实现，零新增依赖，无第三方代码复制；一个平面集合只计一个机制。

## Three.js：投影参数、视窗与场景状态必须区分

实际读取固定提交`83f6bd095356c68334df7d9b7ec03a0abebff3fc`的
[PerspectiveCamera.updateProjectionMatrix](https://github.com/mrdoob/three.js/blob/83f6bd095356c68334df7d9b7ec03a0abebff3fc/src/cameras/PerspectiveCamera.js)
（blob `efb12682f7954a5c0d6bb4319e638b8dee83bfda`）及[官方相机文档](https://threejs.org/docs/pages/PerspectiveCamera.html)。
实现由near、fov、zoom、aspect计算视锥，再处理view window与film offset，更新投影和逆矩阵。
这提醒我们明确原稿坐标、camera与最终viewport的单位和组合顺序，而不是把几个互不相关的平移叫“共享相机”。

本批刻意缩小问题：平面始终与屏幕平行，每层在零相机时按共同reference画稿校准；
深度只决定推进时的差速/缩放。它不是Three.js完整视锥、FOV/filmGauge或任意world XYZ的等价实现。
near只是整个输入必须满足的距离防护，不会自动裁切穿近平面的几何，也没有far裁面或深度缓冲。
viewport是contain等比映射，不是GPU渲染目标、自动clip或相机view-offset的逐参数替代。

该提交的[实际MIT许可](https://github.com/mrdoob/three.js/blob/83f6bd095356c68334df7d9b7ec03a0abebff3fc/LICENSE)
blob `8ada2a5f982916b0ba4b7a0aa7de347587e745d7`已核。未复制相机实现、未安装Three.js；
阅读原则不构成引入该库，更不借其名称宣称当前库能渲真正3D。

## OGL：投影不是有状态场景相机的同义词

实际读取固定提交`385ce65c352c70734a36dc98c787fdd1d30ddb3b`的
[Camera.js](https://github.com/oframe/ogl/blob/385ce65c352c70734a36dc98c787fdd1d30ddb3b/src/core/Camera.js)
（blob `942e7f5ade1397fad632b1f16d24d68b3af8951e`）。其camera继承Transform，维护world/view/projection矩阵；
updateMatrixWorld由world求逆view，project会依次改变传入向量。
本批不移植这种可变场景对象：输入全部显式，返回新冻结矩阵，不改调用方点，也不依赖上次camera更新。
图层排序、遮罩、素材绘制及主物体身份仍由作品负责，不能由一个projection函数推断遮挡合理。

许可核查不是只看仓库标签：该固定根目录没有独立LICENSE文件，
[README的Unlicense全文](https://github.com/oframe/ogl/blob/385ce65c352c70734a36dc98c787fdd1d30ddb3b/README.md#unlicense)
（blob `e5534c443723a9c3c001c24eb7c711ca3fe2c08d`）与
[package.json](https://github.com/oframe/ogl/blob/385ce65c352c70734a36dc98c787fdd1d30ddb3b/package.json)
（blob `70403d6e90ac3ac9740e999856400005589180b5`）均明确Unlicense，**不是MIT**。
README同时说明Math扩展自gl-matrix；以后复制具体数学文件须另核其原通知，不用顶层名称替代逐文件审查。
本批不复制这些文件或其第三方数学层。

## 其余18库的本轮取舍

- Remotion、HyperFrames、React Spring：现有绝对帧与Canvas可表达此镜头，不换浏览器/React时间线。
- Anime.js：已有camera参数由绝对帧产生，不增加播放器、回调或历史状态。
- PixiJS、p5.js、Paper.js：本次只需旧Canvas画稿/矩阵/遮罩，不额外引像素滤镜、字体或路径API；相关此前决策仍有效。
- Matter.js、Rapier：场景层深度是导演参数，不是物理体或刚体积分。
- tsParticles、GL Transitions：不以粒子或另一个shader过渡替代主物体连续性。
- glTF Transform：无glTF或3D模型输入。
- OBS、OpenCut：离线渲染，不新增录屏或编辑器。
- Chatterbox、faster-whisper：无语音生成/转写需求，不引模型。
- Tone.js、FFmpeg：沿用此前明确许可与离线声音/编码链；技术音轨测量不替代听审。

未采用库不在此重新推断许可证结论。参考阅读、相机方向、层数与回调数量均不增加机制计数；
需实际作品消费输出、冻结源码与指导、技术审查后才登记，艺术接受另记。
