# B08 配方 · 显式宣言句法堆叠

`recipe.manifesto-stack.v1`是局部可组合配方，**不新增设计族或积木数量**。

## 来源与原作边界
已读取`theatre-manifesto-candidate/design/manifesto-stack.mjs`与`design/scene.mjs`。原作以同一窄体字重、显式三行文案、145.36px基线步长构建口号节奏，随后由分隔线、译文和活动信息补足语义；原helper只检查advance宽度，没有检查字形左右超出、顶部、下伸高度与后续内容可用空间。

新配方独立实现这些边界。**原scene仍使用原helper，未迁移到本wrapper**，也没有改动原作品。上列为学习时的本地候选路径；正式作品提交与固定链接已记录于 `../source-provenance.json`，源码不从候选路径读取。

## 为什么保留为配方而非新增族
- `typographic-focus`适合主标题—支持文字的层级；本配方用于用户已经写好且精确断行的平行句式，不自动代写、换行或缩字。
- `expressive-type`处理挤出/切片字形；宣言的力量来自语法重复、基线节奏、字重与版面，不需要强加字形效果。
- `diagonal`相关背景提供情绪与视觉方向，可作为兄弟层独立先画，不能用斜切去掩盖文字碰撞。

因此不强行调用现有族，也不把一个排版函数改名当成第15族。可以与现族在组合层共存，但原作和组合调用关系必须分别记录。

## API
`recipes/manifesto-stack.mjs`导出`validate`、`measureManifestoStack(ctx,p)`、`drawManifestoStack(ctx,p)`。调用者提供Canvas 2D实例和已注册、具备使用权的字体；模块不读取文件、下载字体、创建画布或访问全局时钟。

```
{
 bounds:{x:70,y:100,width:500,height:420}, // 包含字形+下游槽的边界
 x:78, baseline:205, step:112, tracking:-0.5,
 font:{family:'B08Display',size:100,weight:400},
 ink:'#FFFFFF', lines:['MAKE ROOM','FOR REPAIR.'],
 minLineGap:8, afterGap:24, reserveAfter:80
}
```

示意参数需以调用者实际字体度量确认，不保证上述字体在任何环境存在。lines为1–4个明确单行，拒绝空行/内嵌换行；坐标、步长、tracking、尺寸必须有限，尺寸为正。tracking限定在字号的-10%到50%；非零tracking需要实际Canvas letterSpacing支持，不能静默丢弃。

**全部行先测量，再一次绘制**。检查每行实际glyph bbox（包括左悬挂、上伸、下伸）与advance；拒绝整体边界溢出、相邻行墨迹相碰、约定minLineGap不足或reserveAfter不足。不会只用`font.size × lines`估算高度，不会clip或缩字掩盖错误。

Native Canvas测试发现非零tracking时bbox和实际墨迹可有约2px差异，因此`measuredInk`保留原始metrics，`ink`另含横向`1+abs(tracking)`px、纵向1px的保守栅格余量，用于溢出与间距校验；`rasterGuard`明确返回。它不是所有字体/浏览器的数学保证，换字体或渲染器仍需像素/视觉验证。

返回：`lines[{text,baseline,advance,measuredInk,ink,rasterGuard}]`、`downstreamSlot{x,y,width,height}`、`automaticWrap:false`、`sourceSceneMigrated:false`。坐标属于调用者当前局部坐标系；上下文已有变换不会被重置。下游槽从最后一行保守墨迹底部加afterGap开始；调用者可放解释、数据来源或行动信息。

## 适用与禁用
适合短宣言、文化活动片头、价值主张、三段平行句式。先确认内容和断行有意义，再选择字阶与节奏。不适合正文分页、长段翻译、任意文本自动适配；不把口号当事实证明。大字不应遮住日期、单位、免责声明等必要信息。

## 建议与验证
`examples/manifesto-stack.json`提供两个不同语义/断行建议：两行社区舞台邀请与三行创意实验宣言。均为合成内容，不是实际活动。统一两组合可由整合层替换成维修/文化内容，且必须显式传入参数，不能按recipe id暗改尺寸。

`test-manifesto.mjs`是纯代码专项测试，不生成图片。外置Native canvas与DejaVu Sans字体检验23项：实际高度/左右/advance边界、下伸字母、正负tracking、绘前拒绝且像素不变、测量不绘制、状态/输入保持、确定性及可用下游槽。最终视觉报告由整合层统一生成，本配方不把代码通过等同用户审美通过。

```
MOTION_ENGINE_ROOT=/absolute/installed/motion-render-core \
B08_DISPLAY_FONT=/absolute/Anton-Regular.ttf \
B08_BODY_FONT=/absolute/DejaVuSans.ttf \
node b08-recipe-retention/test-manifesto.mjs
```

## 绘制状态约定
文字固定使用实色、globalAlpha=1、source-over，无shadow/offset/filter；不继承调用者的screen叠色或模糊，以免越过已验证的字形边界。保留当前transform与clip。绘制前save，完成或异常后restore，并显式恢复Native getters（阴影、alpha、composite、filter、文字样式）。回归加入shadowBlur30/offset20/screen/.4/blur5px情形：实际像素与正常绘制完全相同，调用者状态恢复。
