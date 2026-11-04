# design.geometric-marks.v1 · 几何标识语法

<!-- asset-self-description: design.geometric-marks.v1 -->

唯一登记见 [catalog](../../catalog.json)。[index.mjs](index.mjs)导出id/version/guidance/validate/draw，总 [dispatcher](../../index.mjs)调用同一实现。版本和状态保持原登记；旧平层实现/说明/样例路径移除，无兼容别名。

## 选择与关系

为一组明确标签提供共享网格、大小与颜色角色，而不是把六个绘图分支算成六个资产。适合栏目索引、活动阶段或作者自定义身份组。标签赋予语义，圆/方/三角不天然表示观察、音量或安全含义；不得当作经过验证的公共标识、安全图标或商标生成器。[design.md](design.md)解释来源与取舍。

## 自足输入合同

`draw(ctx,{bounds,data,theme})`使用Canvas 2D context。`validate`返回原输入、不修改、不自动补全，不拒绝所有未知字段。

- bounds：有限x/y像素，width/height 40–4096，实际格子还需至少100×120px。
- theme必需：surface/ink/muted/accent四个六位#RRGGBB色和非空fontFamily（≤100字符）。实现以surface铺底、ink画标签；每格图形颜色来自item，字体由调用者注册。
- data.columns：1–6整数；gap默认12，0–40px；items为1–12条。
- 每item必须有唯一id（非空≤40字符）、label（非空≤40字符）、motif、background/foreground/accent三个六位#RRGGBB色。
- motif仅circle、semicircle、triangle、square、stripes、quarter-disc；rotation默认0，仅0/90/180/270度，不接受任意角或负角。

行数ceil(items.length/columns)，格宽=(width−gap×(columns−1))/columns，格高=(height−gap×(rows−1))/rows。顺序按输入从左到右、从上到下，末行不足不会自动居中。每格底部34px留标签带，形体根据min(格宽,格高−34)−32缩放；标签固定14px/600字重，不随形体旋转。前景motif和accent小点一同围绕格内中心旋转，背景矩形不转。

draw在画任何像素前检查格尺寸与标签advance宽（≤格宽−24）。label不自动换行，校验没有显式拒绝换行字符，不代表支持多行。主题对比度、字形墨迹超出advance、多个符号是否可区分仍需调用者检查。

返回 `id,bounds,tiles,semantics`；每tile含id/label/motif/rotation、绝对bounds和anchor。没有单独motif轮廓或点击区，anchor不带动画时钟。保存/恢复上下文样式与transform，输入不变，当前路径可能变化。

## 两例与专项验证

[输入](examples/cases.mjs)分别是三列LISTEN/MAKE/SHARE与两列四项索引，覆盖不同数量、形体、四分之一转向、主题和标签。[测试](test/contract.mjs)实测两例、网格/顺序/anchor、六种motif与四个旋转、非法形体/角度/尺寸/标签绘前拒绝及dispatcher一致。技术通过不证明品牌或标识含义被用户接受。

## 执行示例与恢复

[render](examples/render.mjs)真实调用本族，默认输出PNG哈希、几何和字体SHA256，不写媒体。

```sh
export MOTION_ENGINE_ROOT=/absolute/path/to/installed/runtime
export UI_TEST_FONT_DIR=/absolute/path/to/dejavu
node engine/design-elements/families/geometric-marks/examples/render.mjs
node engine/design-elements/families/geometric-marks/test/contract.mjs
```

Node24+；外置已安装@napi-rs/canvas，以及DejaVuSans.ttf、DejaVuSans-Bold.ttf、DejaVuSerif.ttf、DejaVuSerif-Bold.ttf。可用`GEOMETRIC_MARKS_FONT_DIR`覆盖UI_TEST_FONT_DIR。包内命令将engine换runtime。可加 `--out /absolute/new-external-directory`写入尚不存在的仓库/Skill外目录，独占创建文件；路径和文件系统须受信任。不自动安装、下载、替代缺失字体或分发node_modules/字体。

本目录英文独立例子不需要CJK字体；[B05完整组合](../../examples/b05-compositions.mjs)仍包含另一族的汉字排版，须单独提供完整CJK资源，不能用这两个英文例子替代其验证。

## 依赖、权利与验收边界

实现依赖 [shared.mjs](../../shared.mjs)的校验/字体/上下文支持，不能只复制单个index后宣称依赖齐全。Canvas及合法字体由调用者提供。源码为本库原创有界实现，遵循根 [MIT](../../../../LICENSE)、[第三方声明](../../../../THIRD_PARTY_NOTICES.md)和[源码范围](../../../../SOURCE-SCOPE.md)。来源关系见design.md和catalog，历史提取快照不是运行依赖，方法来源也不是原作品实际调用证据；外部字体/品牌/媒体权利另核。

[同目录测试](test/contract.mjs)与 [总族测试](../../test/verify.mjs)是技术验证。未据搬迁取得新视觉、浏览器、交互、无障碍、Motion或用户接受；作品锁及状态独立保留。
