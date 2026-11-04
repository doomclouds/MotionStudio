# design.proportional-partition.v1 · 等比例面积分区

<!-- asset-self-description: design.proportional-partition.v1 -->

唯一登记见 [catalog](../../catalog.json)。[index.mjs](index.mjs)导出id/version/guidance/validate/draw，总 [dispatcher](../../index.mjs)调用同一实现。版本和状态保持原登记；旧平层实现/说明/样例路径移除，无兼容别名。

## 选择与关系

给有限分类值分配无内缝的平面矩形面积，外置图例承载标签与原数值。适合库存或工时构成，不是任意层级treemap、地理占地、排名比较或凭感觉分配编辑重要性。[design.md](design.md)说明为何不复制来源中的头栏/间距面积误差。

## 自足输入合同

`draw(ctx,{bounds,data,theme})`需要Canvas 2D context；`validate`返回原输入，不修改、不补全，非严格未知字段schema。

- bounds：有限x/y像素，width/height 40–4096。实际plot宽≥300、高≥100；图例占用ceil(items.length/3)×28+44px，必须另留。
- theme必需surface/ink/muted/accent四个六位#RRGGBB色、非空fontFamily（≤100字符）。surface铺底、ink图例、muted来源说明；类别色来自item，accent是共享合同字段。
- data.unit非空≤12字符，sourceLabel非空≤120字符，items为1–12条。
- item含唯一非空id（≤40）、非空label（≤40）、color六位#RRGGBB、value有限0..1e12。总和必须>0且有限。正值项颜色不能重复，比较忽略字母大小写；零值项可用重复色但需标签解释。

算法保留输入顺序，选择累计值最接近一半的分界，再沿当前矩形长边递归二分，不排序、不自动分组。正值叶几何面积=value/total×plotArea，无叶内文字、组标题、间隙或边框。零值不占矩形，但保留图例并返回zeroIds。任何正值叶宽/高<1px或面积<16px²会绘前拒绝，不能静默吞掉小类；由调用者明确聚合或放大。

图例三列，13px字；显示同一item的label/value与共同unit。来源说明12px字置底。提前测量每条图例advance（≤width/3−28）及sourceLabel（≤width−24），不自动换行、裁切或缩字；校验未禁止字符串内换行，仍应提供单行文本。数学面积同尺度不等于抗锯齿后的每类RGB像素计数必然精确比例。

返回 `id,bounds,plotBounds,total,areaPerUnit,cells,zeroIds,semantics`。cell含id/value/ratio、绝对rect与几何area。可复算面积和、每单位面积和不重叠；返回结构不带标签布局盒。保存/恢复上下文，当前路径可能改变，无随机、动画、自动数据分析或真实性校验。

## 两例与专项验证

[输入](examples/cases.mjs)比较档案库存和制作工时，第二例含零值类别。[测试](test/contract.mjs)核真实双例、所有叶同尺度/面积和/不相交、零值保留、整数边界25/75实际像素、负值/零和/重复色/不可辨小叶绘前拒绝。原始数据与单位真实性由调用者负责，不把合成示例当实际预算或库存。

## 执行示例与恢复

[render](examples/render.mjs)真实调用本族，默认输出PNG哈希、几何和字体SHA256，不写媒体。

```sh
export MOTION_ENGINE_ROOT=/absolute/path/to/installed/runtime
export UI_TEST_FONT_DIR=/absolute/path/to/dejavu
node engine/design-elements/families/proportional-partition/examples/render.mjs
node engine/design-elements/families/proportional-partition/test/contract.mjs
```

Node24+；外置已安装@napi-rs/canvas，以及DejaVuSans.ttf、DejaVuSans-Bold.ttf、DejaVuSerif.ttf、DejaVuSerif-Bold.ttf。可用`PROPORTIONAL_PARTITION_FONT_DIR`覆盖UI_TEST_FONT_DIR。包内命令将engine换runtime。可加 `--out /absolute/new-external-directory`写入尚不存在的仓库/Skill外目录，独占创建文件；路径和文件系统须受信任。不自动安装、下载、替代缺失字体或分发node_modules/字体。

本目录英文独立例子不需要CJK字体；[B05完整组合](../../examples/b05-compositions.mjs)仍包含另一族的汉字排版，须单独提供完整CJK资源，不能用这两个英文例子替代其验证。

## 依赖、权利与验收边界

实现依赖 [shared.mjs](../../shared.mjs)的校验/字体/上下文支持，不能只复制单个index后宣称依赖齐全。Canvas及合法字体由调用者提供。源码为本库原创有界实现，遵循根 [MIT](../../../../LICENSE)、[第三方声明](../../../../THIRD_PARTY_NOTICES.md)和[源码范围](../../../../SOURCE-SCOPE.md)。来源关系见design.md和catalog，历史提取快照不是运行依赖，方法来源也不是原作品实际调用证据；外部字体/品牌/媒体权利另核。

[同目录测试](test/contract.mjs)与 [总族测试](../../test/verify.mjs)是技术验证。未据搬迁取得新视觉、浏览器、交互、无障碍、Motion或用户接受；作品锁及状态独立保留。
