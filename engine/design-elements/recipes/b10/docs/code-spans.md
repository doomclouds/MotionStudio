# recipe.code-spans.v1 · 显式多行彩色文本片段

[代码](../recipes/code-spans.mjs)，源关系：B10 `rollcall-docs-study` 的真实case `drawCodeRuns`。原helper按单行advance预算；本配方增加显式多行与字形左右/上伸/下伸、行间净距与全部预检。原scene未迁移，代码未引用源截图或浏览器解析。

## 设计指导
颜色表达文本角色而非随机彩虹：普通符号/结构用主文字色，键或关键词用一种强调色，显式数值/字符串用另一色，注释低一层但仍可读。语义分组应先正确，再着色。适合技术解释视频中的配置片段/伪代码、文档示例。示例的配置文本与图网行列数/单位/量程来自同一输入，但不是完整可执行数据程序。

## 输入/返回
`draw(ctx,{bounds,lines,fontFamily,fontSize,lineHeight,padding,surface})`。
`lines`是1–16个显式行，每行0–24个`{text,color}`；空行明确传[]。text不可包含换行/tab，单run≤200字符；color须#RRGGBB。不会根据词自动猜颜色/补语法/插入空格/折行，也不执行任何代码。
字体12–48px，行高至少字号+4、至多100；padding6–80。bounds有限、非退化、≤4096，所有边及相加后的几何必须有效。调用者提供已经注册的字体，本轮样例只验证LTR拉丁等宽字形。

全部run先测量，保留exact text与advance，检查每run实际glyph bbox+1px guard、行尾预算、纵向内容区及相邻行墨迹至少2px净距。失败前不绘任何目标像素；不会缩字或clip掩盖错误。返回每行/每run位置、paintBounds、文本与advance。跨字体/字体系需要重新覆盖与视觉校验，guard不是任意字体的通用数学证明。

内部固定无阴影/滤镜/虚线、alpha1/source-over、LTR、零额外字距，恢复调用者样式/transform；已有clip仍有效。此模块拥有bounds背景，不提供行号、编辑、语法解析、语法正确性或运行结果真实性。

## 与现有族
typographic-focus用于主副信息层级；本配方保留同一行内不同语义颜色及空格。它不是第15族。代码面板皮肤也不因此复制一个material-surfaces族；本验证使用简单底色，不伪称公共表面族实际调用。
