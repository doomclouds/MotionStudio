# design.vertical-imprint.v1 · 直列刻本排印

<!-- asset-self-description: design.vertical-imprint.v1 -->

唯一登记见 [catalog](../../catalog.json)。[index.mjs](index.mjs)导出id/version/guidance/validate/draw，总 [dispatcher](../../index.mjs)直接调用本实现。旧平层源码/说明/输入及旧字体检查路径移除，无兼容别名；版本和状态仍以catalog为准。

## 选择与阅读关系

用明确的右起列序、逐字格距、双边框和正文/批注色组织短札记。适合作者自分列的文化出版式信息，不是自动古籍排版、历史鉴真、长文引擎、医疗记录证明或复杂中西混排。[design.md](design.md)说明来源与视觉取舍。示例文字是当代虚构，批注须真实说明其作者身份。

## 自足输入合同

`draw(ctx,{bounds,data,theme})`需要支持实际字形墨迹度量的Canvas 2D context。`validate`返回原输入、不修改、不补全，非严格未知字段schema。

- bounds：有限x/y像素，width/height 40–4096。实际内部frame为x=28,y=64,width=width−56,height=height−112，frame宽≥100、高≥80。
- theme必需surface/ink/muted/accent四个六位#RRGGBB色，非空fontFamily（≤100字符）。body用ink，annotation用accent；主题名称不自动加载字体。
- data.title非空≤70字符，caption非空≤100字符，均横向画出。它们不是自动多行文本，校验未显式拒绝换行，不应据此加入多行标题。
- fontSize必需18–64px，fontWeight默认600，有限400–700；step必需，1.2×fontSize..2×fontSize；columnGap必需，1.5×fontSize..3×fontSize。
- columns为1–12条，按右至左阅读顺序给出；每条唯一非空id（≤40字符）、非空text（≤40字符的输入字符串长度限制）及role，role仅body/annotation。
- 列text只允许Unicode Han脚本字符和〇；不支持Latin、标点转向、组合标记、禁则换行或自动拆列。绘制按Unicode码点遍历；不要依赖字符串长度限制推导所有补充平面字都能占40格。

columns数量×columnGap不能超过frame宽−32。每列字符数×step不能超过frame高−32。每字使用actualBoundingBoxLeft/Right/Ascent/Descent：可见墨迹高须有限且>0，宽≤columnGap−8、高≤step。标题20px/600字重，说明13px，列文字使用fontSize/fontWeight；预检与实画相同。任何版面/字体度量溢出在画像素前拒绝，不缩字、不拉伸字距填版。

列起点从frame右边内缩16px，再按(columnIndex+0.5)×columnGap递减。每字在其step格内按墨迹高度居中，body与annotation只改变颜色，不自动另排批注栏。绘制清除本地dash、画双框和列间线，save/restore保留调用者样式/transform/dash，当前路径会改变。

返回 `id,bounds,frame,readingOrder,glyphs,semantics`。frame与glyph.bounds是绝对坐标；每glyph含character/columnId/role及实际墨迹盒。readingOrder是输入列id，不是推断出的历史阅读法。无动画、事件、ARIA或文本内容真实性校验。

## 字体身份、来源与恢复

实现本身只依赖 [shared.mjs](../../shared.mjs)，不读字体文件。调用者必须提供覆盖实际文字且有使用许可的完整字体。原作品Song400/600子集不能用于任意新文案。历史专项使用的NotoSerifTC变量字体与Noto Serif CJK TC静态face是不同资源，不得因同属Noto就互换历史锁或宣称像素复现。

[示例runtime](examples/runtime.mjs)要求显式绝对字体路径，先调用 [verify-font.py](test/verify-font.py) 检查当前两份夹具Han字的cmap，再注册为B05Song。报告实际family/PostScript/version、文件SHA256、cmap条数及缺字列表。覆盖检查只证明当前夹具字集，不自动证明完整字体库、许可或历史身份；新文案需另外核其字集，不能用占位框混过。

可以使用合法既有字体集合中的完整独立face，但应在仓库外提取并记录集合SHA、face索引、提取文件SHA与名称，保留许可。不得把提取字体塞入源码、重命名冒充历史字体或以来源不明子集替代。静态Regular face请求600字重时可能由宿主合成，必须如实记录该测试环境。

## 两例实际调用与测试

[输入](examples/cases.mjs)是茶事札记与街巷观察，改变内容、列数、主题、字号、步长与列距。[render](examples/render.mjs)真实调用，默认只输出几何、PNG哈希与字体身份，不写媒体。

```sh
export MOTION_ENGINE_ROOT=/absolute/path/to/installed/runtime
export VERTICAL_IMPRINT_FONT_FILE=/absolute/path/to/licensed-standalone-CJK-font.otf
python3 engine/design-elements/families/vertical-imprint/test/verify-font.py
node engine/design-elements/families/vertical-imprint/examples/render.mjs
node engine/design-elements/families/vertical-imprint/test/contract.mjs
```

Node24+、外置已安装@napi-rs/canvas、Python3及fontTools。UI_B05_FONT_FILE可作显式字体路径的备用变量；没有任何默认系统字体搜索或联网下载。包内把engine换runtime。可加 `--out /absolute/new-external-directory`输出到尚不存在的仓库/Skill外目录，独占写文件；路径与文件系统须受信任。

[合同测试](test/contract.mjs)覆盖两例实际绘制、确定性、列序/逐字映射、墨迹盒边界、dash恢复、非法字符/角色/密度绘前拒绝、dispatcher一致及字体覆盖拒绝。完整B05组合另需其英文组件字体；各自环境应明确记录。

## 权利与验收

本库原创有界源码遵循根 [MIT](../../../../LICENSE)、[第三方声明](../../../../THIRD_PARTY_NOTICES.md)与[源码范围](../../../../SOURCE-SCOPE.md)。字体及参考媒体权利不由源码MIT授予。历史提取快照和源作品是方法来源，不是运行依赖或实际复用证明。

本次测试只建立显式字体身份下的Native静态技术证据，不是历史字体锁复现、原作品复验、视觉审美、浏览器、交互、Motion或用户接受。作品状态与锁独立保留。
