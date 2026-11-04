# design.authored-paths.v1 · 有声明的叙事路径

<!-- asset-self-description: design.authored-paths.v1 -->

## 选择与身份

用于作者给定的故事起伏或序列示意，保留可追溯锚点、类别图例与示意声明。不是地理路线、测量趋势、音频分析或带统计轴的数据图。[design.md](design.md)解释顺序、插值和来源取舍。

唯一登记见 [catalog](../../catalog.json)；[index.mjs](index.mjs)导出id/version/guidance/validate/draw，总 [dispatcher](../../index.mjs)调用同一模块。旧平层实现、说明、输入路径已删除，无兼容层。

## 输入合同

调用 `draw(ctx, {bounds,data,theme})`，ctx为Canvas 2D context；`validate`返回原输入，不修改或自动补全。未知字段不全部拒绝。

- bounds：x/y有限像素，width/height 40–4096。但实际plot为 `{x:24,y:24,width:width−48,height:height−120}`，要求plot宽≥100、高≥60，因此可绘制画幅至少148×180。还须容纳图例和说明。
- theme必需：surface/ink/muted/accent四个六位#RRGGBB色、fontFamily非空至多100字符。字体由调用者提供。accent为共享主题字段，路径颜色来自各条path。没有默认主题。
- data.mode必须是 `illustrative`；interpolation必须是 `polyline` 或 `smooth`；caption非空、至多130字符，说明图仅为示意。
- data.paths为1–16条。每条id非空至多40字符且在本输入唯一；label非空至多60字符；color六位#RRGGBB；width有限1–12px；points为2–1000个 `{x,y}`。
- 点x/y均在0..1，x严格递增，不能折返或重复。x表达作者给定阅读顺序，y表达构图高度；不提供单位、刻度或测量真实性。

绘图把y=1放在plot顶部，y=0放在底部。polyline直连锚点；smooth在相邻锚点横向中点生成两控制点，保持水平切线且不纵向越过端点范围。输入点不是贝塞尔控制点，平滑不增加测量信息。

先按实际字体测量caption和所有图例的总advance宽度，不够则绘前拒绝，不换行/省略/缩字。实现未对caption和label显式禁止换行，也没有多行布局；应传单行说明，换行不等于获得多行排版能力。路径本身不自动裁切，线宽外延需由调用者考虑。

返回 `id,bounds,plotBounds,paths:[{id,pointCount,points}],semantics`；点和plot为绝对画布坐标。返回点数是输入锚点数，不是车辆、乘客、波峰或事件计数。无随机、时钟、自动数据生成或事件交互。绘图使用save/restore支持恢复样式/transform，当前路径可能改变；宿主dash会影响路径笔触，需实线时调用者应先清除dash。

## 真实调用的示例与验证

[输入](examples/cases.mjs)包含一条平滑故事弧，以及两条折线服务序列，改变内容、类别数、插值和主题。[render](examples/render.mjs)实际绘制，默认只输出几何、PNG哈希与字体SHA256。

```sh
export MOTION_ENGINE_ROOT=/absolute/path/to/installed/runtime
export UI_TEST_FONT_DIR=/absolute/path/to/dejavu
node engine/design-elements/families/authored-paths/examples/render.mjs
node engine/design-elements/families/authored-paths/test/contract.mjs
```

Node24+；外置已安装@napi-rs/canvas和DejaVuSans.ttf、DejaVuSans-Bold.ttf、DejaVuSerif.ttf、DejaVuSerif-Bold.ttf。`AUTHORED_PATHS_FONT_DIR`可覆盖UI_TEST_FONT_DIR。包内将engine换runtime；可加 `--out /absolute/new-external-directory`写入尚不存在的仓库/Skill外目录，文件独占创建，文件系统与路径须受信任。不自动下载、不重新分发字体/依赖。

[同目录测试](test/contract.mjs)检查两个真实示例、确定性、返回点与原输入一致、重复id/错误语义/倒序x/范围/图例溢出绘前拒绝和dispatcher一致。专题组合在 [specialist-compositions](../../examples/specialist-compositions.mjs)消费这些输入。技术结果不证明视觉、浏览器、动效、无障碍或用户接受；新作品需独立审查。

## 依赖与权利

实现依赖 [shared.mjs](../../shared.mjs)的校验/字体/上下文支持，本目录不是脱离支持模块的单文件包。原创代码按根 [MIT](../../../../LICENSE)，[第三方声明](../../../../THIRD_PARTY_NOTICES.md)与[源码范围](../../../../SOURCE-SCOPE.md)继续适用。来源为theatre-narrative-wave的作者锚点与bus-morning-study的路径类别关系，没有复制原SVG/图片或建立交通/音频模型。方法来源不是源作品已调用的证据，外部字体和参考素材权利需另行核实。
