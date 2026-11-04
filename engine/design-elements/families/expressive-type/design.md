# design.expressive-type.v1 · 有边界的表现性文字

## 来源与设计逻辑
- `portfolio/works/cycling-year-report/design/scene.mjs`：数字先占据视觉权重，向下偏移的暖色层叠制造重量与冲劲；原作明确是2D偏移加仿射近似，不是3D。
- `portfolio/works/wave-weather-study/design/scene.mjs`：大字的水平条带、双色和留白建立玩味语气，天气值与标签仍完整可读。

这里抽取的是两种“主视觉字形处理”，不是源作品构图，更不是字库轮廓/汉字笔画拆解。两种模式共享同一短文本、度量、排布和效果边界契约。新实现不读原图，不拷贝品牌字形。

## 代码与契约
[index.mjs](index.mjs) 导出 id/version/guidance/validate/draw。`props.bounds`是固定尺寸目标区；`theme`要求surface/ink/muted/accent/fontFamily。字体由调用者安装并注册，模块不加载文件。`data.lines`是1–3行、每行不超过24字符；fontSize48–400、padding0–100、lineGap0–100；align为left/center/right；paintBackground:false可叠在其他材质上。

- layered-extrusion：depthX/depthY各-60..60，layers为2–60整数；theme.depthColors为1–6个明确颜色，从近到远。绘出实际度量文字的多层偏移，不包含模糊、透视、光源或真实厚度。
- sliced-text：offsets是4–32个条带的水平偏移，每个-40..40；fillRatio为.2..1的保留高度比例，交替用ink/accent。条带剪切处理当前字体绘出的文字，不解析字形结构。

使用当前Canvas真实字形包围盒检查文字和全部效果边界；过宽/过高即拒绝，绝不自动缩字或截断。返回regions可供版面避让，但不是可点击DOM，也无动画时钟。变化字体后必须重新渲染自检。

## 适用、不适用与内容选择
适合成绩数字、活动标题、章节片头、运动/音乐/实验性品牌的短主张。主视觉只能一处承担这种强风格，支持文字回归正常排版；主张必须另有可读的单位/上下文。不可用于正文、合同、账户余额、医疗/安全指令、必须精确快速识别的信息。条带处理会降低识字速度，不用于唯一的信息载体；需要完整副标题重复含义。

大字样式不能证明内容真实。样例180是虚构参与分钟数，不是训练建议；MAKE WAVES是活动口号，不是真实天气。不得把切片偏移解释为声音/波浪数据。

## 两种组合与验证

[examples/cases.mjs](examples/cases.mjs)提供两种模式不同内容参数。历史专项说明曾记录仓库外`verification-expressive-type/verify.mjs`组合typographic-focus：运动活动是单个量化焦点与解释带，创意节是两行切片口号与完整可读标题，并记录两张组合图实看。该说明属于原专项的历史记录；证据脚本/图片不随源码分发，本次共置迁移不据此声称重新实看、视觉通过或用户接受。

当前直接运行入口为同目录 [测试](test/contract.mjs)与[示例](examples/render.mjs)，完整使用合同见 [README](README.md)。它们检查实际字形/效果边界、非法输入绘前拒绝、输入/上下文恢复与确定性，属于Native静态技术验证。当前两份专题组合由design-elements/examples/specialist-compositions.mjs消费本族，不把历史私人脚本当必需运行入口。本次视觉审阅及用户接受仍为NOT_RUN。

来源路径均相对MotionStudio仓库根目录，是方法来源而非必须加载的外部资源；源作品本身未在此次迁移中改写。
