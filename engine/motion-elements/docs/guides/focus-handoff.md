# 信息与焦点接力配方

[返回入口](../../README.md) · [目录与公共 API](../registered-foundations.md)

本页保存对应机制的详细合同、合成示例和已有证据限定。历史批次数量不是当前目录数，已有测试描述不代表本次重新运行或艺术通过。代码片段中相对导入以本页所在目录为基准；shell 命令按各段注明的工作目录运行。

## 配方 A：信息 / 焦点接力（固定 7 秒）

`recipe.focus-handoff` 是现有 transform、offset-cards、stagger 与 local-reveal 的组合配方，不是新基础动作或 NLE。片块署名为另一独立配方，见[片块署名](tile-signature.md)。

```js
const plan=compileFocusHandoff({
 type:'recipe.focus-handoff',version:1,
 cardIds:['draft','structure','output'],selectedId:'structure',
 detailId:'detail',nextId:'next',start:rational(0),
 travel:{x:0,y:55},rotationStep:0.03,focusScale:1.6
});
const state=sampleFocusHandoff(plan,at,{
 reducedMotion:false,parentMatrix:[1,0,0,1,0,0]
});
```

固定1920×1080设计空间、640×360局部卡片；正好3个唯一cardIds，selectedId必须存在，detailId/nextId与卡片ID互不重复。ID遵循现有64字符规则。start≥0且start+7≤24h。travel各轴±100以内，rotationStep±0.04以内（三张最大旋转±0.08），focusScale1.3..1.6。所有字段必填，未知字段拒绝。plan深冻结，仅真实编译对象可采样。首版不开放任意时长或额外曲线，避免压缩阅读hold。

时间以start为零点：0–0.70入口；0.70–1.50选择停留；1.50–2.35选中卡放大归正、其它短退场；2.35–3.65详情阅读；3.65–4.35下一内容接管；4.35–7.00下一内容阅读。返回 cueTimes 为绝对rational，phase在边界切换；矩阵连续。选中卡从第一帧起最高z=3，绝不途中跳层。每张卡每时刻只有一个 transform track，其opacity独立；入口末态精确继承到focus from。

state.layers 持久保留三张卡的 itemId/zIndex/matrix/opacity/rect/geometryBounds。父矩阵只允许正等比缩放与平移，不支持旋转、非均匀缩放或把任意拉伸叫响应式。geometryBounds为当前父变换后的几何AABB，不含阴影或内容溢出。焦点中心固定(960,500)，内容接管期间同一框不动。

**内容绑定是调用者职责，不在callback里暗换图。** 每层 content 明确给出：
- baseId：短标签与thumbnail绑定；
- detailId、detailReveal：选中卡在原布局额外揭示短详情，不能整卡突然重排；
- nextId、nextReveal：下一内容的方向揭示进度；
- drawPrevious：nextReveal精确1时为false，否则旧内容仍完整保底。

调用者按z排序、通过withMotion绘制，每个base只画一次；next使用withLocalReveal覆盖同一个640×360圆角框。next必须绘制完整不透明卡片背景，再绘新内容；**不能只透明画新文字或两份正文alpha交叉淡化**。配方返回状态而不接管Canvas/内容source。详情/下一内容标题必须简短，字宽与安全区由caller验证；这不是自动排版器，不能仅凭输入长度宣称可读。合成demo使用measureText，溢出直接报错，不偷偷缩成小字。未选卡标签需放在不被重叠覆盖的安全区；demo第1张左对齐、第2/3张右对齐。

reduced模式入口保留三卡可见；focus中点1.925s切焦点布局，handoff中点4s切内容，阶段和阅读时长不变。不是对整段缩时，也不声称已经通过舒适度/无障碍体验评审。

两内容合成demo：数据摘要选中中卡，图文卡选中第一卡，并排展示各自等比设计空间。7秒无循环、静音，输出210帧；其余旧gallery仍保持原8秒240帧。

```sh
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/focus-handoff-new --demo focus-handoff
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/focus-detail-new --demo focus-handoff --frame 90
```

技术门验证identity/z、阶段边界、单轨连续、父bounds、明确接管状态、reduced时序和乱序像素。实际能否看懂“先选谁、随后看什么”、阅读速度与声音质量仍是分开的验收，不以静音测试伪称audio-pass。
