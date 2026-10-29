# 数据关系批：20库的需求选择与官方实现对照

核查日期：2026-10-29。**这是原创候选冻结阶段的官方对照与制作约束补充，不倒叙声称候选代码原本取自这些库。** 没有新增依赖、复制第三方实现或把文档阅读算作影片验证。DAG分层与加权端口分配本身由本项目原创实现；不能为了贴参考，把几何、物理或动画库的名称当成已经存在的同一算法。

## 1. Paper.js：用误差而不是采样点个数解释路径质量

实际阅读：固定提交`fcdc9eb2e11965a5ee680923db210f77ce78239b`的[Path.flatten](https://github.com/paperjs/paper.js/blob/fcdc9eb2e11965a5ee680923db210f77ce78239b/src/path/Path.js#L1379-L1395)、[PathFlattener](https://github.com/paperjs/paper.js/blob/fcdc9eb2e11965a5ee680923db210f77ce78239b/src/path/PathFlattener.js#L62-L87)，以及[官方Path参考](https://paperjs.org/reference/path/)。它按平坦度递归细分，并明确处理开路径终点。这里只吸收“终点合同＋可解释误差预算”的原则，不复制细分实现。

本批使用已有sampled-band，uniform-x采样smoothstep-y；**不是Paper的自适应flatten，不是精确Bezier，也不是等法线宽度描边**。对当前固定函数，线性弦的局部竖向误差可保守界定为`0.75*abs(deltaY)/(samples-1)^2`；镜头均匀缩放后再乘实际倍率。最终作品应检查放大后的误差预算与实际像素，不能只说“128点很平滑”。该界不包括浮点舍入、抗锯齿或字体质量；透视不适用此简单倍率规则。

实际[LICENSE.txt](https://github.com/paperjs/paper.js/blob/fcdc9eb2e11965a5ee680923db210f77ce78239b/LICENSE.txt)为MIT；没有依据GitHub的自动识别字段作结论。以后若复制实质代码，须保留版权与许可通知；本批未复制。

## 2. Anime.js：seek是一项状态合同，不只是有个时间参数

实际阅读：固定提交`01b81be1df6843ccfe0a71c0699a746bf740dd77`的[Timer.seek实现](https://github.com/juliangarnier/anime/blob/01b81be1df6843ccfe0a71c0699a746bf740dd77/src/timer/timer.js#L399-L414)与[官方seek文档](https://animejs.com/documentation/timeline/timeline-methods/seek/)。此实现会处理完成/暂停状态并调用tick；回调静音是显式选项。

对应决定：保留本库纯绝对时间求值，不增加播放循环、回调或DOM。测试必须覆盖倒序、跳时、重复与新进程；reduced保留原phase/progress而只改变权重显示策略。支持seek不等于天然无历史状态，不能直接贴“确定性”标签。该对照用于审查合同，没有搬运Anime实现。

实际[LICENSE.md](https://github.com/juliangarnier/anime/blob/01b81be1df6843ccfe0a71c0699a746bf740dd77/LICENSE.md)为MIT；未引入该依赖。

## 3. Matter.js：这次不把物理constraint当图数据约束

实际阅读：固定提交`b8ee71cd7f9b49f53639ddaedd6254f1929bcbe5`的[Engine.update](https://github.com/liabru/matter-js/blob/b8ee71cd7f9b49f53639ddaedd6254f1929bcbe5/src/core/Engine.js#L85-L123)、[Runner.tick](https://github.com/liabru/matter-js/blob/b8ee71cd7f9b49f53639ddaedd6254f1929bcbe5/src/core/Runner.js#L94-L150)和[官方Runner文档](https://brm.io/matter-js/docs/classes/Runner.html)。这些入口累加世界时间、推进物体/约束；runner还处理浏览器帧间隔与时间缓冲。

对应决定：订单图需要的是拓扑、端口容量及数据守恒，不是重力/碰撞。这里不采用Matter运行时，也不把物理动量守恒误称订单数量守恒。将来确实需要物理动作时，再考虑固定步长预烘焙＋随机访问缓存验证；本批没有做这种验证，不能宣称已支持物理求解。

实际[LICENSE](https://github.com/liabru/matter-js/blob/b8ee71cd7f9b49f53639ddaedd6254f1929bcbe5/LICENSE)为MIT；未复制代码。

## 4. Tone.js与FFmpeg：声音跟随作品时钟，不能只确认“有音轨”

实际阅读Tone固定提交`28a689c4a80c3b840b9e08e457285584e09f9d5f`的[Offline](https://github.com/Tonejs/Tone.js/blob/28a689c4a80c3b840b9e08e457285584e09f9d5f/Tone/core/context/Offline.ts#L42-L66)与[OfflineContext](https://github.com/Tonejs/Tone.js/blob/28a689c4a80c3b840b9e08e457285584e09f9d5f/Tone/core/context/OfflineContext.ts#L84-L116)。它将离线上下文、时钟推进与整段缓冲渲染分开；包装器也会切换上下文，不能误称完全无状态。吸收离线缓冲/绝对cue原则；本作品可用原创波形和现有离线链，不安装Tone。其[实际许可](https://github.com/Tonejs/Tone.js/blob/28a689c4a80c3b840b9e08e457285584e09f9d5f/LICENSE.md)为MIT。

实际阅读与本机7.1.5对应的FFmpeg标签提交`3a0867c2bfda4a4d4309ca1a8cbdc6175e67f587`的[音频trim实现](https://github.com/FFmpeg/FFmpeg/blob/3a0867c2bfda4a4d4309ca1a8cbdc6175e67f587/libavfilter/trim.c#L150-L247)及[许可说明](https://github.com/FFmpeg/FFmpeg/blob/3a0867c2bfda4a4d4309ca1a8cbdc6175e67f587/LICENSE.md)。本机配置实测含`--enable-gpl`/`--enable-libx264`，不能按纯LGPL二进制介绍或顺手打包发布。

对应决定：沿用项目rational帧/样本时钟，按实际样本边界处理声音、保留尾音；检查最终编码后的样本数、峰值、loudness和解码。离线生成、非静音及技术指标都不能替代听审或感知声画同步。Tone文档URL和ffmpeg.org页面本次抓取超时，以上改查官方固定源码，不声称读到了超时页面。

## 5. 本批逐项选择表（不是15项未经核验的许可结论）

| 用户列出的库 | 本批需求决定 |
|---|---|
| Remotion | 维持现有Native链，不增加新制作框架；不默认其许可等同MIT。 |
| HyperFrames | 本批不改为另一套网页/时间线运行栈；没有直接引用实现。 |
| Anime.js | 深读seek源码，核对绝对时间/回调/状态边界，见上。 |
| React Spring | 不为此数据交接增加React状态运行栈；使用既有明确曲线，不登记“弹簧变体”。 |
| PixiJS | 不切换渲染后端或假设任意版本Canvas兼容；保持当前Native像素基线。 |
| p5.js | 不增加sketch生命周期或复制其源码；现有纯函数与Canvas已满足本场景。 |
| Paper.js | 深读路径细分与终点逻辑，新增制作误差预算，见上。 |
| Matter.js | 实证与本次非物理数据约束不同，不引运行时，见上。 |
| Three.js | 本批明确不做真正3D，不引入。 |
| Rapier | 本批没有刚体模拟需求，不引入。 |
| OGL | 本批不新增GL后端，不引入。 |
| tsParticles | 不用装饰粒子凑效果；若需要沿路标记，先复用已有path/trail/stagger。 |
| glTF Transform | 本批没有glTF输入或资源变换，不引入。 |
| GL Transitions | 本批不需要shader场景过渡，不切GL管线。 |
| OBS | 直接离线渲染，不需要桌面录制/直播。 |
| Chatterbox | 本批没有人声生成/克隆需求，不引入模型或权重。 |
| Tone.js | 深读离线上下文/调度原则，用于原创声音方案；不引依赖，见上。 |
| faster-whisper | 本批无语音转写输入，不引入ASR。 |
| OpenCut | 本批不制作交互式编辑器，沿用现有渲染/封装CLI。 |
| FFmpeg | 现有实际编码/解码链；核实样本处理源码、构建与许可，见上。 |

其他15项若在后续场景实际采用，需当批查官方具体入口、版本、代码/模型/资源许可，不能沿用“名字在表里”作通过证据。任何新增依赖、软件安装、媒体上传或密钥操作仍受原授权边界约束。

## 6. 如何形成真实验证证据

- DAG/端口/权重配方保留原创来源声明，旧sampled-band/keyframe明确为复用，不重复计数。
- 每项写真实初始化与采样/绘制消费区间，区分直接观测调用和源码证明的内部组合路径。
- 采样误差预算按最终参数/镜头重算；工程示例上的数学误差不是最终影片视觉验收。
- 声音原创源码/实际输出hash、字体OFL及使用资源许可留实际交付manifest；不把技术测量写成听审。
- 当前研究本身不提升库数量、作品状态、用户艺术认可或对其他库的全部能力判断。
