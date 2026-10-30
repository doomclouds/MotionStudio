# design.typographic-focus.v1 · 标题层级

## 设计意图
把一句主张变成画面第一焦点，再让证据或解释退到第二层。来源观察是《慢火》极端字阶、《汉字解构》的标题与展讯、骑行年报的大数字；本模块抽取的是字阶、行数、对齐、语义强调与留白，不复用其文案、商标或特定字形。

## 可以用 / 不要用
适合短标题的品牌标题帧、活动引导和产品价值说明。不要用于长正文、自动排版任意中文段落、书法字形解构、复杂混合字体或多个同权焦点。它不自动创造品牌，也不把最大字号等同好设计。

## API
代码 `../typographic-focus.mjs`，入口 `draw(ctx, props)`；`bounds` 为明确画幅内矩形，`theme` 显式定义背景/主字/次字/强调色/字体，`data.lines` 1–4 行，`titleSize` 24–180，`body` 1–4行，`bodySize`12–32，`padding`0–100，`accentLine` 指明哪一行承担强调角色，`align` left/center。

不变量：阅读顺序为 kicker → headline → support；显式测量全部文字，横向或纵向溢出时拒绝，不隐式缩字号或裁掉正文。不会加载字体。调用者必须提供可用且有许可的字体；测量以当前Canvas宿主为准。返回各行实际布局区域。

## 组合
与 `design.color-sections.v1` 的主张槽组合；可把具体证据留给 `design.semantic-data.v1`。两者若都用巨字会争抢焦点，应降低证据区字阶。样例 `../examples/typographic-focus.mjs` 更换了语气、字体、行数、对齐和配色；不是源作品的审美复刻，也未获用户认可。

## 证据与边界
运行统一 `test/verify.mjs` 和 `examples/render.mjs`。两套真实输出在生成报告中；技术通过不能替代审美审阅。当前只验证静态固定画幅，不验证响应式、浏览器、交互、无障碍达标或动效迁移。

来源作品：`portfolio/works/slow-roast-study`、`hanzi-poster-study`、`cycling-year-report`。这是根据已审作品设计关系独立编写的代码，不是声称每个源场景已经改用此模块。

嵌入材质contentBounds时使用`data.paintBackground:false`，只画字不盖掉底材质；默认true保持独立标题区背景。
