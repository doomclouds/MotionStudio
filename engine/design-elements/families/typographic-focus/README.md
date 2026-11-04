# design.typographic-focus.v1 · 标题层级

<!-- asset-self-description: design.typographic-focus.v1 -->

唯一登记 [catalog](../../catalog.json)；[index.mjs](index.mjs)导出id/version/guidance/validate/draw，总 [dispatcher](../../index.mjs)直接调用本实现。状态与版本以catalog为准。旧平层源码/说明/样例路径已移除，无兼容别名。

## 选择与视觉关系

把短主张放在第一层，kicker提示语境，support承接解释；只允许一处主要焦点。适合活动标题、章节帧和产品短说明，不是长正文排版器、书法字形拆解、自动品牌生成或任意响应式布局。[design.md](design.md)解释来源与组合取舍。

## 自足输入合同

`draw(ctx, {bounds,data,theme})`需要Canvas 2D context；`validate`返回原输入，不修改对象，不自动补全，非严格未知字段schema。

- bounds：x/y有限像素，width/height 40–4096。外层合法不等于文字一定放得下。
- theme必需：surface/ink/muted/accent四个六位#RRGGBB色，fontFamily非空至多100字符。可选displayFont用于标题；当前validate不校验displayFont类型或是否实际加载，调用者应传已注册有效字体名。正文与kicker使用fontFamily。
- data.lines：1–4个非空标题字符串，每个至多45字符。data.kicker非空至多70字符；data.body：1–4个非空字符串，每个至多120字符。每项是作者分好的行，不自动换行；实现未逐项拒绝换行字符，不能据此当多行排版器。
- titleSize必需24–180px；bodySize必需12–32px；padding默认24，0–100px；align默认left，可选center；accentLine默认−1（不强调标题行），否则为0..lines.length−1整数。kicker始终用accent。
- paintBackground默认true，false时只画文字，适合叠在材质内容区域上；不代表字体或文字变透明。

标题行距1.05×titleSize，正文行距1.45×bodySize，kicker固定12px。先计算纵向布局，再按实际Canvas测量所有行的advance宽；越界抛错，不隐式缩字、换行或剪掉正文。空间计算包括padding、标题/正文间隔，但不是实际字形墨迹边界审计。

返回 `id,bounds,regions,readingOrder,semantics`；regions按kicker、每个标题、每个正文排列，包含绝对x/y、advance width和名义字号height，**不是actualBoundingBox墨迹盒**，也没有每行独立ID。readingOrder固定为kicker/headline/support。调用者不能将这些框当成所有字形（尤其斜体、重音、装饰字体）绝不外溢的证明。

save/restore支持恢复样式与transform；输入不变，当前路径可变化。无时间、事件、无障碍DOM、自动语义校验或字体加载。

## 两份例子与验证重点

[输入](examples/cases.mjs)把small-press的衬线左排主张换成open-lab的无衬线居中邀请，同时改变强调行、颜色、字号与支持文案。[同目录测试](test/contract.mjs)检查真实双例、顺序/行数、居中关系、透明底保留、溢出绘前拒绝、输入/上下文恢复及dispatcher一致。两套文案均为合成内容，不是已接受品牌作品。

## 实际执行与恢复

[render](examples/render.mjs)真实import并调用draw，默认只报告PNG哈希、返回几何和字体SHA256，不写媒体。

```sh
export MOTION_ENGINE_ROOT=/absolute/path/to/installed/runtime
export UI_TEST_FONT_DIR=/absolute/path/to/dejavu
node engine/design-elements/families/typographic-focus/examples/render.mjs
node engine/design-elements/families/typographic-focus/test/contract.mjs
```

Node24+；示例/测试需要外置已安装@napi-rs/canvas，以及DejaVuSans.ttf、DejaVuSans-Bold.ttf、DejaVuSerif.ttf、DejaVuSerif-Bold.ttf。可用`TYPOGRAPHIC_FOCUS_FONT_DIR`覆盖UI_TEST_FONT_DIR。包内命令将engine换runtime。可加 `--out /absolute/new-external-directory`写到尚不存在的仓库/Skill外目录，文件独占创建；路径/文件系统须受信任。不自动下载或安装，不静默替代缺失字体，不分发node_modules或字体。

## 依赖、来源与验收

实现依赖 [shared.mjs](../../shared.mjs) 的校验/字体/上下文支持；本目录不能作为脱离支持模块的独立单文件包。来源关系见design.md和catalog，方法来源不等于源作品实际调用。源码为本库原创有界实现，遵循根 [MIT](../../../../LICENSE)、[第三方声明](../../../../THIRD_PARTY_NOTICES.md)及[源码范围](../../../../SOURCE-SCOPE.md)；不复制参考媒体，外部字体/品牌/素材权利另核。

同目录测试与 [总族测试](../../test/verify.mjs)属于Native静态技术验证。新文案、新字体、新构图需重新审查；它们不代表视觉、浏览器、交互、无障碍、Motion或用户接受，作品锁与验收状态独立保留。
