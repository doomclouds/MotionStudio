# design.diagonal-field.v1 · 斜切色域

<!-- asset-self-description: design.diagonal-field.v1 -->

## 用途与入口

用一个有方向的色域边界分开主张与证明，适合活动、发布或工作室开场。颜色是语气，不是面积数据。不要用于透视、3D、光照模拟或自动保证文本对比。[design.md](design.md)解释来源、组合和取舍。

唯一登记见 [catalog](../../catalog.json)。实现 [index.mjs](index.mjs) 导出 `id/version/guidance/validate/draw`，总 [dispatcher](../../index.mjs) 指向同一模块。旧平层源码、说明和输入路径直接移除，无别名。

## 必需输入与绘制行为

`draw(ctx, {bounds,data,theme})`，ctx 为Canvas 2D context。`validate`检查结构并返回原输入；不填充对象、不修改输入、非严格未知字段schema。

- bounds：x/y有限像素；width/height 40–4096。此为通用外层限值，实际内容带要求更大尺寸。
- theme 必须给出 `surface,ink,muted,accent` 四个六位 #RRGGBB 色及非空 `fontFamily`（至多100字符）。实际绘制只使用surface，其余为共享主题契约。此模块不画文字，不需字体测量。
- data.angle：−25..25度，屏幕向右时正角边界向下；cutoff：0.3..0.75，边界在中央的高度比例。
- data.stops：2–8个 `{at,color}`，at严格递增且首0末1，color六位#RRGGBB。相同颜色可以形成纯色区；此模块不要求渐变色彼此不同。
- data.padding：默认24px，0–100。它是安全内容净距，不是额外背景内边距。

先画整个surface矩形，再画上方斜切多边形。渐变从局部(0,0)指向(width,边界两端较小y)，不是垂直梯度或沿斜边渐变。几何：delta=tan(angle)×width/2，中央y=height×cutoff，左右端y分别为y−delta和y+delta。

两端必须离顶部/底部至少80px。再扣除两侧padding后，安全矩形宽和上下内容带高度都至少40px，否则draw绘前抛错。`validate`不执行最后这项padding可用空间检查；调用者不能把validate通过当成draw必然成功。

返回 `id,bounds,edge:{left,right},contentBounds:{upper,lower},semantics`，均为绝对画布坐标。upper止于两端较小y之前，lower始于较大y之后，不是直接按cutoff切分。返回矩形仅确保不跨色边界，不会排版、裁切子元素或检查对比度。调用者须实际用这些矩形布局并检查文字。

绘制使用共享save/restore支持，不修改props；当前路径可能变化。绘图没有时间、随机、事件、降动效或动态渐变参数。

## 示例与测试

[输入](examples/cases.mjs)包含暖色−9度边界与冷紫+12度边界，改变方向、cutoff、净距和主题。[render](examples/render.mjs)真实调用draw并报告PNG哈希、几何和字体身份；默认不写文件。它使用统一Native示例工具注册字体，但斜切实现本身不消费字体。

```sh
export MOTION_ENGINE_ROOT=/absolute/path/to/installed/runtime
export UI_TEST_FONT_DIR=/absolute/path/to/dejavu
node engine/design-elements/families/diagonal-field/examples/render.mjs
node engine/design-elements/families/diagonal-field/test/contract.mjs
```

Node24+，外置已安装 `@napi-rs/canvas`；字体目录含DejaVuSans/DejaVuSans-Bold/DejaVuSerif/DejaVuSerif-Bold.ttf。`DIAGONAL_FIELD_FONT_DIR`可覆盖UI_TEST_FONT_DIR。示例可加 `--out /absolute/new-external-directory`，目录必须尚不存在且在仓库/Skill外，文件独占写入；路径与文件系统需受信任。包内命令将engine换runtime。不联网安装，不重新分发依赖或字体。

[同目录测试](test/contract.mjs)覆盖真实双例、确定性、角度/边界计算、安全区不跨边、无像素拒绝和dispatcher一致。专题组合还在 [specialist-compositions](../../examples/specialist-compositions.mjs)实际消费返回区域。技术结果不是视觉、浏览器、动效、无障碍或用户接受。

## 依赖与权利

实现依赖 [shared.mjs](../../shared.mjs) 的边界、主题和上下文支持，并非可脱离它复制的单文件包。原创代码按根 [MIT](../../../../LICENSE)，保留 [第三方声明](../../../../THIRD_PARTY_NOTICES.md)与[源码范围](../../../../SOURCE-SCOPE.md)。设计来源为muqi-study斜切关系，不复制原图/品牌资产，不声称源案例调用了此族。字体、参考媒体及新作品权利由调用者核实。
