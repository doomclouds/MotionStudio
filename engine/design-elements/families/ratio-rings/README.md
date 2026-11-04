# design.ratio-rings.v1 · 目标比环

<!-- asset-self-description: design.ratio-rings.v1 -->

唯一登记见 [catalog](../../catalog.json)。[index.mjs](index.mjs)导出id/version/guidance/validate/draw，总 [dispatcher](../../index.mjs)调用同一实现。版本和状态保持原登记；旧平层实现/说明/样例路径移除，无兼容别名。

## 选择与关系

把每个对象的value/max同时编码成弧角、原值/目标和百分比，避免手填dash造成图文不一致。适合阅读计划或准备进度的静态说明。不同半径/单位的环面积不可比较，不能据环大小比较工作量或健康程度；不是临床评分、运动追踪或交互控件。[design.md](design.md)解释来源修正与radial-scale的区别。

## 自足输入合同

`draw(ctx,{bounds,data,theme})`使用Canvas 2D context；`validate`返回原输入，不改对象、不补全，非严格未知字段schema。

- bounds：有限x/y像素，width/height 40–4096；实际需满足圆区、24px中央空心、图例宽和行高约束。
- theme必需：surface/ink/muted/accent四个六位#RRGGBB色，非空fontFamily（≤100字符）。surface铺底、muted轨道/百分比、ink数值，彩弧来自ring；accent是共享合同字段。
- data.sourceLabel非空≤120字符；thickness默认18，8–28px；gap默认12，8–32px；rings为1–4条。
- 每ring有唯一非空id（≤40字符）、非空label（≤40）、非空unit（≤12）、六位#RRGGBB color、有限max（大于0且≤1e12）、value有限0..max。超目标拒绝，不自动clamp或折返。

左侧图形区占bounds宽54%。中心在图形区中间、可用高(height−48)的一半；外半径=min(图形区半宽−20,可用半高−20)−thickness/2。每后续环半径递减thickness+gap；最内侧边缘距中心至少24px。右图例需至少140px宽；height−80至少为环数×68。所有label、原值/目标字符串和sourceLabel提前按实际字体测量，溢出绘前拒绝。

每环从正上方顺时针，角度2π×value/max，butt端帽不额外延伸；0不画彩弧，100%用0→2π完整圆路径以避免Native负起点整圆差异。轨道使用muted降低alpha。百分比文字只保留1位小数，但弧和返回ratio使用未舍入值；label16px、数值14px、百分比/sourceLabel12px。图例单行不自动换行，换行字符不获得多行布局。

返回 `id,bounds,center,rings,semantics`。每ring含id/value/max/ratio、startAngle和sweepAngle（弧度）、radius/thickness及名义annularSectorArea。center为绝对坐标；面积只供本环几何检查，不用于跨半径/单位比较。原始数值真实性、单位适合性仍由调用者负责。

实现清除本地dash，使用save/restore恢复调用者dash、样式/transform，当前路径会改变。无事件、动画时钟、无障碍DOM或实时数据读取。

## 两例与专项验证

[输入](examples/cases.mjs)是含0的阅读目标与含100%的工作坊准备，改变目标对象、数量、颜色和厚度。[测试](test/contract.mjs)实测两例、0/半/满环几何与采样像素、宿主dash不影响结果、文字/弧同源、超目标/重复id/空间不足绘前拒绝。Native技术通过不代表用户接受或真实计划已完成。

## 执行示例与恢复

[render](examples/render.mjs)真实调用本族，默认输出PNG哈希、几何和字体SHA256，不写媒体。

```sh
export MOTION_ENGINE_ROOT=/absolute/path/to/installed/runtime
export UI_TEST_FONT_DIR=/absolute/path/to/dejavu
node engine/design-elements/families/ratio-rings/examples/render.mjs
node engine/design-elements/families/ratio-rings/test/contract.mjs
```

Node24+；外置已安装@napi-rs/canvas，以及DejaVuSans.ttf、DejaVuSans-Bold.ttf、DejaVuSerif.ttf、DejaVuSerif-Bold.ttf。可用`RATIO_RINGS_FONT_DIR`覆盖UI_TEST_FONT_DIR。包内命令将engine换runtime。可加 `--out /absolute/new-external-directory`写入尚不存在的仓库/Skill外目录，独占创建文件；路径和文件系统须受信任。不自动安装、下载、替代缺失字体或分发node_modules/字体。

本目录英文独立例子不需要CJK字体；[B05完整组合](../../examples/b05-compositions.mjs)仍包含另一族的汉字排版，须单独提供完整CJK资源，不能用这两个英文例子替代其验证。

## 依赖、权利与验收边界

实现依赖 [shared.mjs](../../shared.mjs)的校验/字体/上下文支持，不能只复制单个index后宣称依赖齐全。Canvas及合法字体由调用者提供。源码为本库原创有界实现，遵循根 [MIT](../../../../LICENSE)、[第三方声明](../../../../THIRD_PARTY_NOTICES.md)和[源码范围](../../../../SOURCE-SCOPE.md)。来源关系见design.md和catalog，历史提取快照不是运行依赖，方法来源也不是原作品实际调用证据；外部字体/品牌/媒体权利另核。

[同目录测试](test/contract.mjs)与 [总族测试](../../test/verify.mjs)是技术验证。未据搬迁取得新视觉、浏览器、交互、无障碍、Motion或用户接受；作品锁及状态独立保留。
