# design.material-surfaces.v1 · 材质与表面层级

代码：[`material-surfaces.mjs`](../material-surfaces.mjs)。示例：[`examples/material-surfaces.mjs`](../examples/material-surfaces.mjs)。

## 设计判断

表面的任务是把信息从背景中分离，并让物体的语气和品牌一致：纸签适合印刷、手作和现场活动；近实色面板适合阅读；玻璃适合让背景色参与画面且信息不密集的场景。颜色、字重和可读性由整体主题负责，不能把每个内容框一律变成玻璃。

来源追踪：已接受的 `portfolio/works/liquid-glass-study/design/scene.mjs` 提供了“同画布背景、半透明白色覆层、细亮边、真实可见柔影”的视觉经验；`portfolio/works/vinyl-study` 提供纸张硬偏移影；深色工具作品提供前后表面分离。这里的代码是重新参数化的通用实现，未复制来源图片或原作尺寸；不是原场景回归替换。

## 契约

`draw(ctx, props, env)` / `validate(props)`，`props.bounds={x,y,width,height}`；`data.variant` 为 `paper/opaque/glass`，可选 title、subtitle、padding、radius、elevation、opacity。`theme` 为 surface/ink/muted/edge/shadow 五个十六进制颜色、fontFamily、fontSize。字体由调用者提供。

- width 120–1600，height 100–1200，有限坐标；padding 8–80 且不能占满内容区。
- elevation 0–3。纸张生成硬影；其他表面生成有界 alpha-mask 三次 box blur 柔影。不是 CSS shadowBlur 等效声明。
- opacity .04–.75 仅控制玻璃白色覆层，不代表真实材料透射率。
- title/subtitle 单行最多100字符，绘制前按实际字体测量；溢出拒绝，不自动缩字。
- `env.canvasApi.createCanvas` 用于阴影。glass 还必须提供 `env.backdrop({ctx,width,height,bounds})`，由调用者画该表面应采样的背景。无默认远程图像，无网络访问。
- 返回 bounds、contentBounds、headingHeight、material。上层可把任意图表、正文或控件放进 contentBounds；本模块不负责整页内容。
- 保持 Canvas 状态；不读时钟或随机数，不修改props。背景回调自身也应确定。

## 组合规则与反例

先在完整画面上确定大面积背景，再明确哪些表面要有前后关系。纸签和玻璃可以共存于对照演示，通常不应无理由共存在同一品牌主画面。避免在低对比背景上叠浅色字、多个同强度发光边框；长正文使用 opaque 更稳妥。返回的内容槽可与指标/标题/图形资产组合。

不能称作物理玻璃：没有折射、真实背景模糊或浏览器 backdrop-filter。只提供显式背景采样图层和覆层。边界/阴影向外扩展，布局需预留约70px；调用者clip可能裁掉阴影。暂不支持自动换行和响应式。

## 重组证据与状态

同源码的两个候选样例：蓝紫珊瑚色听音面板；米色印刷工作坊纸签。位置、尺寸、内容、表面、颜色和层级全部参数化，不修改实现。它们是重组验证画面，不新增优秀作品计数；审美需独立看图，不能以像素不同代替好看。正式验证结果由上层统一报告关联，不预填通过。

## 轻量组合例：同一工作区的跨区主题一致性

[shared-theme.mjs](../examples/shared-theme.mjs)以现有 material-surfaces、typographic-focus 和 parameter-controls 组合一个原创固定画幅示例；[测试与外置渲染](../examples/shared-theme.test.mjs)覆盖两套调色角色 × paused/active 两个演示状态。不是新主题资产、候选、框架或真实应用；不增加注册数量。现有 `theme` 输入已能承担这种组合，不需要仅为配色新增公共 API。

先声明角色及作用区，再在同一内容/状态下比较主题：背景、主表面、内层表面、正文、次要字、强调、边线、轨道分别来自单一 palette。侧栏、正文、参数卡、提示卡和输入区示意都消费这些角色；允许不同区域使用不同表面角色，不要求所有区域颜色完全相同。状态仍由独立输入决定，换主题不应改变内容 ID、参数值、禁用状态或几何。图中 paused/active 只标静态演示，不暗示后台任务或交互已执行。

这是对[Creator Mode 参考片](https://x.com/DeepSeekHarness/status/2117256196227019194/video/1)约63–70秒关系的去素材化练习：可见换肤同时影响多个区域，但影片不证明持久保存、任意插件适配或具体 CSS/token 实现。本例不复制原片界面、皮肤、品牌、文案或图像；当前仅两套显式颜色及一份固定内容，不泛化为自动主题设计。

从仓库根运行：

```sh
DISABLE_SYSTEM_FONTS_LOAD=1 MOTION_ENGINE_ROOT=/absolute/installed/engine/motion-render-core UI_TEST_FONT_DIR=/absolute/dejavu-font-directory node --test engine/design-elements/examples/shared-theme.test.mjs
```

沿用现有示例的外置 Native/字体方式：Node 24、`@napi-rs/canvas` 0.1.100、调用者许可下的 DejaVuSans.ttf 和 DejaVuSans-Bold.ttf（DejaVu/Bitstream 条款，不是仓库 MIT）。不捆绑字体、不联网；输出记录实际字体 SHA256，未验证跨机器像素一致。加 `UI_THEME_OUTPUT=/absolute/new-external-directory` 可生成四张1440×900 PNG、调用/几何记录和资源身份；目录必须新建、非符号链接且在此仓库外，产物不入库。缺依赖直接报错，不能把未渲染当测试通过。

测试既比对角色传参、内容、状态、测量几何，也抽查实际表面和强调标记像素；仍需实看整图，不能凭几处像素宣称所有文字对比、可访问性或审美通过。禁用态降低对比沿用原控件行为，未做可访问性认证。范围不含字体/间距主题、浏览器样式传播、菜单/弹层、响应式、持久化或动画；这些需求应在真实场景内另验，不通过扩建本例伪造能力。

## 方向短笔触：非注册示例

[directional-paint.mjs](../examples/directional-paint.mjs) 是单独可调用的原创绘制示例，不扩展上面的 `paper/opaque/glass` 契约、不注册新族。用于调用者已经画好底色和轮廓后，以短多边形色块和细高光表达局部方向；不是油画仿真或自动风格迁移。

`drawDirectionalPaint(ctx,{bounds,palette,seed,count,length,width,angleAt,brush})` 在矩形范围内确定性分布笔触；调用者先设置任意轮廓 clip，函数进一步裁到 bounds。`angleAt(u,v)` 接收归一化位置、返回弧度，须是纯函数且不访问画布；全部角度先检查后绘制。seed 为 uint32；count 1–10000；length 2–80px；width 1–20px 且不大于 length；bounds 尺寸16–2048px、坐标绝对值不超过1e6；palette 为2–8个六位十六进制颜色。画布继承调用者 alpha/合成/变换；绘制后恢复变换、clip、所改样式，但与普通 Canvas 绘制一样替换当前 path。输入/回调及 Canvas 后端是可信调用者资源，不是恶意对象沙箱。

可选 `brush: 'taper'` 只把直笔触轮廓改为固定的中段宽、两端窄压力包络（12段，端点宽度系数0.12）；省略或显式 `'polygon'` 保持原六边笔刷和随机序列。其他值在绘制前拒绝。不加曲率、边缘噪声、笔毛沉积或新注册机制，原高光保持不变，因此细端附近可能仍有高光越出色块。它是图形轮廓选项，不是物理压力模拟或普遍审美升级。`drawPaintExample(ctx,variant,seed,{brush})` 在原 leaf/ribbon 输入上可显式比较；旧三参数调用不变。

同一函数附带两份无字体原创输入：绿色叶形的斜向渐变方向场、暖色弯带的波动方向场。轮廓、尺寸、方向、色板、笔触宽长均不同；它们仅证明局部方向纹理可复用，不是两件审美通过作品。均匀密度与重复笔触仍明显；不适用于需要真实颜料厚度、自然干刷边缘或随形自动推导笔触的任务。先在最终画幅判断方向是否帮助形体，再调密度，不能把全屏噪声当材料。

字体/图片/音乐均不需要，Node 使用调用者提供的 `@napi-rs/canvas`。测试写入仓库外全新目录：

```sh
CANVAS_MODULE=/absolute/path/to/node_modules/@napi-rs/canvas \
node engine/design-elements/test-directional-paint.mjs /absolute/new-private-output
```

[测试](../test-directional-paint.mjs)覆盖两输入实际出图、同seed重复、换seed差异、矩形与调用者clip、输入不变、状态恢复及非法输入绘制前拒绝。确定性只针对相同回调/输入/后端环境；没有跨后端逐像素、动画连续性、音频或用户接受结论。

可选压力策略的[专项测试](../test-directional-pressure.mjs)需要调用者在仓库外提供固定改动前实现，避免把当前代码与自身比较。它比较两输入、三种seed的旧/省略/显式polygon逐像素输出，另验taper重现、边界和非法参数、晚发生方向错误、状态属性及后续实际填色/描边（含渐变与clip）。兼容性结论限定相同已安装Canvas后端；不把像素差当审美接受。示例包装函数也显式恢复颜色/线宽，避免部分Native后端restore后的属性不一致。

```sh
# 从审查指定的改动前提交导出；BASE_SHA 必须由评审固定，不能使用改动后的 HEAD。
git show "$BASE_SHA":engine/design-elements/examples/directional-paint.mjs > /absolute/private/baseline.mjs
CANVAS_MODULE=/absolute/path/to/node_modules/@napi-rs/canvas \
BASELINE_DIRECTIONAL_PAINT=/absolute/private/baseline.mjs \
node engine/design-elements/test-directional-pressure.mjs /absolute/new-private-pressure-output
```

### 与已有材料的分工

- [print-poster](../print-poster.mjs) 是纸签与硬偏移叠印，不能代替方向笔触。
- 漫画网点优先用现有 [halftone-screen](../../motion-elements/docs/halftone-screen.md) 或 [标量网点候选](../recipes/candidates/halftone-scalar-candidate/README.md)，保持各自原状态。集中线的位置/留白仍由构图决定，不为这一观察另建网点或排线积木。
- 砖墙、喷漆、粗糙描边和滴流分别处理：墙缝应穿过未覆盖区域，喷漆局部透明度逐渐衰减；把它们烘为整张材质会锁死构图。当前不提供新的喷漆/砖墙函数，因为尚无独立双输入实渲验证；[drape候选](../recipes/candidates/drape-material-candidate/README.md) 的布面明暗也不能冒充这些材料。

研究来源：[Open Design Usage Reset](https://open-design.ai/showcase/usage-reset-motion-video-design/) 的6秒私有研究，仅抽帧观察，不是连续观看、实际听审或声画同步验收。上述代码和两份输入是原创程序几何，适用仓库 MIT；未带入原片像素、标形、字体、音乐或私有对照报告。来源链接不转授参考设计/品牌权利。局部材质改善与此示例运行均不等于原片复刻或用户审美通过。
