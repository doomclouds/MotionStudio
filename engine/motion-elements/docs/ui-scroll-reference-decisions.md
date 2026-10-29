# 滚动分区约束：来源、边界与去重

核查日2026-10-29。本轮只解决一个可见问题：分区标题随内容进入，抵达指定顶边后保留，所属分区结束时被带走。
它不是另一个滚动播放器；普通内容平移、窗口裁切和同ID卡片交接继续复用旧机制，不重复计数。
本项目原创数值实现，零新增依赖，没有第三方代码复制。

## Anime.js：滚动同步不等于sticky几何求解

实际读取固定提交`01b81be1df6843ccfe0a71c0699a746bf740dd77`的：

- [ScrollObserver源码](https://github.com/juliangarnier/anime/blob/01b81be1df6843ccfe0a71c0699a746bf740dd77/src/events/scroll.js)，blob `4d58938891d6db2db94cb4b6e59a6c886305f30b`。
- [onscroll-sticky脚本](https://github.com/juliangarnier/anime/blob/01b81be1df6843ccfe0a71c0699a746bf740dd77/examples/onscroll-sticky/index.js)，blob `0bfd06ebef33664aa95e36c2bee012c0e7a6344a`。
- [该示例HTML/CSS](https://github.com/juliangarnier/anime/blob/01b81be1df6843ccfe0a71c0699a746bf740dd77/examples/onscroll-sticky/index.html)，blob `275c664351d1853167ddaa8e46bc54a9f8d10421`。
- [官方onScroll说明](https://animejs.com/documentation/events/onscroll/)。

示例的贴顶由浏览器CSS `position: sticky`负责，脚本将进入/离开阈值与时间线同步；不能把该示例误称为Anime提供的纯sticky求解器。
源码的`updateBounds`暂时恢复sticky元素的普通位置以量取原始几何，随后恢复样式；容器还维护DOM监听、前次滚动和速度。
这给本批的启发是把原始内容坐标、滚动偏移和最终绘制坐标分开，而不是从上一帧的已偏移矩形继续累加。
离线实现显式接收这些量，不创建ScrollObserver、不探测DOM、不引入其监听器或平滑播放状态。

该提交的[实际MIT许可](https://github.com/juliangarnier/anime/blob/01b81be1df6843ccfe0a71c0699a746bf740dd77/LICENSE.md)
blob `f999fa58ebdda6d8d0f3ae581ebdfe821f09603a`已读取。未移植该实现或示例视觉资产；若以后复制实质代码，仍须保留相应版权和许可通知。

## CSS工作草案：只采用受容器限制的含义，不宣称浏览器一致性

读取[CSS Positioned Layout Level 3，2025-10-07工作草案的sticky条款](https://www.w3.org/TR/2025/WD-css-position-3-20251007/#sticky-pos)。
它区分滚动视口的约束与所属容器的约束；多个sticky元素独立偏移，可能互相重叠。
因此当前机制保留明确的分区尾部边界，不把“永远固定在屏幕上”叫做同一种效果，也不自动解决标题间碰撞。

这只是有限二维纵向几何合同，**不是完整CSS实现或符合性测试**：没有margin box、双向inset、writing-mode、嵌套滚动容器、浏览器布局量取或自动滚动到元素。
上面的规范链接是固定的工作草案而非最终推荐标准；本实现的严格字段、IEEE边界与拒绝条件以本库指导为准。

## 其他参考库与已有积木

- Remotion、HyperFrames、React Spring：本片沿用绝对帧求值，不切换React/浏览器时间线，也不默认其许可都是MIT。
- Paper.js、PixiJS、p5.js：本次没有新增路径布尔、字体排版或像素滤镜需求，矩形与已有Canvas裁切足够。
- Matter.js、Rapier：标题位置受明确区间约束，不是惯性滚动、碰撞或动力学积分。
- Three.js、OGL、glTF Transform：无三维相机、模型或资源变换；上一平面视差候选不为此强行引入。
- tsParticles、GL Transitions：不以粒子或shader掩盖分区交棒与主体身份。
- OBS、OpenCut：继续离线渲染，不增加录屏和编辑器流程。
- Chatterbox、faster-whisper：无语音生成或转写要求，不引入模型。
- Tone.js、FFmpeg：沿用已有离线声音与编码链；有音轨或响度测试不表示已实际听审。

其余库在此不重新推断许可证；本轮新增来源核查集中在真正相关的滚动/位置合同。
颜色、标题数量、滚动方向/速度、回调次数均不增加条目。真实作品调用、代码审计和指导齐备后才可登记；技术通过、听审和艺术接受仍分开记录。
