# design.semantic-data.v1 · 带图例的语义序列

<!-- asset-self-description: design.semantic-data.v1 -->

唯一登记 [catalog](../../catalog.json)；[index.mjs](index.mjs)导出id/version/guidance/validate/draw，总 [dispatcher](../../index.mjs)直接调用本实现。状态与版本以catalog为准。旧平层源码/说明/样例路径已移除，无兼容别名。

## 选择与证据边界

为有限阅读序列明确类别、值、图例和说明，避免装饰点暗示未经证实的趋势。x只是作者阅读顺序，y只是构图位置，连接线不表示插值、真实时间或地理路线。[design.md](design.md)解释来源与组合。不要用于金融走势、精确时间轴、地图、医疗指标或缺少数据依据的效果主张。

## 自足输入合同

`draw(ctx, {bounds,data,theme})`需要Canvas 2D context；`validate`返回原输入，不修改对象、不自动补全。非严格未知字段schema。

- bounds：x/y有限像素，width/height 40–4096。draw实际要求width≥216、height≥250，再检查标签和图例；最小画幅并不保证所有内容可用。
- theme必需：surface/ink/muted/accent四个六位#RRGGBB色，fontFamily非空至多100字符。字体需由调用者注册。accent为共享主题字段，圆颜色来自category。
- data.mode必需且仅 `quantitative` 或 `illustrative`。metric非空至多60字符，caption非空至多130字符。metric仅返回作语义元数据，不画到画布；caption需实际说明数据/示意边界。文本并非自动多行排版。
- maxValue必需，有限0.01..1e9，所有点使用同一尺度；maxRadius默认30px，8–48。
- categories为1–6个 `{id,label,color}`。id和label非空且至多40字符，id唯一，color六位#RRGGBB。
- points为2–24个 `{id,label,x,y,value,category}`。id非空至多40字符且唯一，label非空至多45字符；x/y在0..1，x严格递增；value在0..maxValue；category必须对应已声明类别。

名义半径 `sqrt(value/maxValue)×maxRadius`，两种mode使用同一公式；quantitative只改变输出编码声明，不验证来源/单位真实性。**名义圆面积按value成比例，实际着色面积不是严格比例**：实现会以surface色挖掉半径min(3,r)的中心。小正值的圆尤其容易被中心挖空削弱；不要用着色像素面积作精确量化读取。需要严格面积编码时另行选择适合的图表或独立修订并复验此实现，不能将本次搬迁说成算法修复。

标签不自动包含value，metric也不自动显示。量化使用必须在point.label加入实际数值或在宿主中提供清楚的数值/参考尺度。现有独立样例的Session标签没有显示各值，只证明调用和名义几何，**不是完整数值读取的合格示范**；组合配方另外提供数值标签。

局部x=48+x×(width−96)，局部y=44+R+y×(height−150−2R)，y越大越向下。先测量caption、点标签和图例；点标签advance最多120px，水平方向须至少留4px间隔。错误绘前抛出，不删标签或重排点。这不是圆之间不重叠的保证，也不检查对比度或墨迹外溢。

绘制先铺surface，再以0.4倍宿主alpha画虚线连接，恢复alpha并清除本地dash后画圆/图例/说明。save/restore保留调用者dash和样式；当前路径会改变。

返回 `id,bounds,regions,encoding,readingOrder`。regions包含点id、名义圆包围盒、原value/category，不直接返回面积或中心；encoding保留metric与x/y/category/size说明；readingOrder为点id序列。无随机、动态时钟、事件或数据分析。

## 两份例子与验证重点

[输入](examples/cases.mjs)对比synthetic参与人数与illustrative故事注意力，改变模式、量程、类别、数值和构图。[同目录测试](test/contract.mjs)核名义面积比例、零值、中心挖空边界、顺序/类别、非法数据与标签碰撞绘前拒绝、确定性及dispatcher一致。几何正确不是数据真实性、读者理解或用户视觉接受。

## 实际执行与恢复

[render](examples/render.mjs)真实import并调用draw，默认只报告PNG哈希、返回几何和字体SHA256，不写媒体。

```sh
export MOTION_ENGINE_ROOT=/absolute/path/to/installed/runtime
export UI_TEST_FONT_DIR=/absolute/path/to/dejavu
node engine/design-elements/families/semantic-data/examples/render.mjs
node engine/design-elements/families/semantic-data/test/contract.mjs
```

Node24+；示例/测试需要外置已安装@napi-rs/canvas，以及DejaVuSans.ttf、DejaVuSans-Bold.ttf、DejaVuSerif.ttf、DejaVuSerif-Bold.ttf。可用`SEMANTIC_DATA_FONT_DIR`覆盖UI_TEST_FONT_DIR。包内命令将engine换runtime。可加 `--out /absolute/new-external-directory`写到尚不存在的仓库/Skill外目录，文件独占创建；路径/文件系统须受信任。不自动下载或安装，不静默替代缺失字体，不分发node_modules或字体。

## 依赖、来源与验收

实现依赖 [shared.mjs](../../shared.mjs) 的校验/字体/上下文支持；本目录不能作为脱离支持模块的独立单文件包。来源关系见design.md和catalog，方法来源不等于源作品实际调用。源码为本库原创有界实现，遵循根 [MIT](../../../../LICENSE)、[第三方声明](../../../../THIRD_PARTY_NOTICES.md)及[源码范围](../../../../SOURCE-SCOPE.md)；不复制参考媒体，外部字体/品牌/素材权利另核。

同目录测试与 [总族测试](../../test/verify.mjs)属于Native静态技术验证。新文案、新字体、新构图需重新审查；它们不代表视觉、浏览器、交互、无障碍、Motion或用户接受，作品锁与验收状态独立保留。
