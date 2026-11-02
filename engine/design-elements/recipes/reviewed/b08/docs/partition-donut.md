# recipe.partition-donut.v1 · 单环份额与完整外图例

**配方，不新增积木族。** 文件：[partition-donut.mjs](../recipes/partition-donut.mjs)；两内容输入：[A](../examples/partition-donut-a.json)、[B](../examples/partition-donut-b.json)；独立测试：[test-partition.mjs](../test-partition.mjs)。不依赖或改写 ratio-rings 的同心进度语义。

## 来源与修正

来源：`fintech-science-batch/fintech/design/partition-audit-recipe.mjs` 的 `auditPartition()`。保留其“按份额累积角度、从12点方向起始”的数学规律，但不迁移整个 scene wrapper。原案例份额为38/20/14/14/14，图例遗漏两项共28%；本配方**强制每项输入都生成图例**，含0值。不推断原作缺失类别名称。

A使用相同数值仅验证全部100%均有图例，类别替换为明确虚构的制作资源分配；B使用总数50、四类且一类0的虚构展览材料，检验非百分数原值和零值保留。都不是实际账户、投资配置、真实统计或用户已通过作品。

## 契约

`draw(ctx, props)` 与 `validate(props)`；导出 id/version/guidance。无文件、网络、字体注册副作用。传入Canvas 2D上下文和调用者注册的字体。

- `bounds:{x,y,width,height}`：有限坐标，width 500–2000、height 320–1600；下述可读性预检仍可能拒绝边界内组合。
- `title`：1–100字符单行、无首尾空白；`unit`：1–16字符同约束。
- `data:[{label,value,color}]`：1–12项；label 1–80字符单行非空；NFKC且英文小写规范化后不能重名。value有限非负，有限合计必须大于0；无需凑成100。每项color必须显式 #RRGGBB，非法值拒绝，不回退黑色。
- `theme`：surface/ink/muted三色，均 #RRGGBB；fontFamily为调用者拥有字体名。默认主题提供显式深底/亮字；标题22px、图例标签16px/明细13px、总数24px，字阶固定，不能传fontSize假装已生效。
- 固定一环一总量，外圈/内圈半径比为1/0.64。同一图内每段角度=`value / total × 2π`，顺时针从−π/2开始；末个正值端点闭合到3π/2以收敛浮点误差。各段没有人为间隙或圆头加长。
- 0不画扇区但保留图例；100%使用完整butt圆环，避免Native整环反向路径退化；不得给零份额“最小可见弧”。正值弧长若不足1px直接拒绝，要求增加尺寸或合理聚合内容。
- 图例明细显示原始数值/单位及一位小数百分比；正份额若按一位小数会显示0.0%，则标为`<0.1%`而非伪装零；非全量接近100%时相应标`>99.9%`而非假称全量；显示舍入可能合计99.9%或100.1%，不回写真实角度。数学sum与图例完整性由返回值检查，不用显示舍入做对账。

## 预检与组合

绘制任何像素前检查所有输入、总量、份额有效角度、完整图例行数、标题/每项标签/数值明细/中心总数的实际字体宽度、左右ink bearing与高度。图例不足不会折叠、裁切或隐藏；应扩大区域、精简标签或减少分类。500×530适合短标签5项外图例；长标题仍需调用者精简。每行图例48px，环与图例独立分区。

绘制保存/恢复Canvas变换和样式（含lineDash数组与offset），恢复Native样式getter；内部设置确定性的无阴影source-over绘制，不继承调用者圆头或透明度。调用者已有clip仍生效；本配方拥有整个bounds背景。返回total/unit、center/radius/innerRadius、segments的原值/份额/起止角、每项legend文字盒、legendComplete及staticOnly。

适合**同一总量的互斥完整分类**。不适合重叠分类、带负值分项、缺失类未知比例、多个独立完成率、会计对账或通过跨图不同半径/环宽比较面积。不要把“角度比例准确”扩展成跨环面积可比，不能靠调环宽暗示更多数量。

## 验证证据

由`B08_PARTITION_EVIDENCE_DIR`指定的源码包外全新/空目录包含2份确定性示例PNG、100%/0特殊PNG和results.json。测试核对每项真实角份额与完整图例、调用者设置虚线/offset后的全量环8个圆周采样像素及dash状态恢复、1%小份额中点颜色、0值圆环区域无该类颜色且有图例、输入和上下文状态不变；10个非法/失效布局输入均抛错且PNG前后字节一致。该证据为技术与视觉自检，不代替用户审美批准。

运行前设置：`MOTION_ENGINE_ROOT`为安装`@napi-rs/canvas@0.1.100`的项目目录，`B08_DISPLAY_FONT`和`B08_BODY_FONT`为源码包外且与font-lock.json哈希一致的字体绝对路径，`B08_PARTITION_EVIDENCE_DIR`为源码包外全新或空目录；随后 `node b08-recipe-retention/test-partition.mjs`。测试使用runtime的loadFonts和outputDirectory，不默认向源码包写任何证据。
