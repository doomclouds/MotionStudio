# recipe.value-grid.v1 · 有明确量程和空值的等面积格网

[代码](../recipes/value-grid.mjs)。源关系：B10骑行杂志的`source-opacity-grid`提供密集格网节奏启发，原168个CSS透明度没有真实出行记录。本配方**没有把这些透明度反推成次数**，另定义完整数值契约，例值均作者虚构。

## 设计指导
格网适合一个横维度×纵维度的同单位比较。每格相同面积，大小不编码数量；颜色辅助扫描，格内保留原数值使读者不必只靠色深猜值。行/列标签、量程、单位及空项含义必须一起给。`0`是真零；`null`由—表示并单独着色，调用者说明是未安排、缺测还是不适用，不能默认当零。

## API / 边界
`draw(ctx,{bounds,rowLabels,columnLabels,values,domain,unit,missingLabel,fontFamily,surface,ink,low,high,missing})`。
- 1–8行、1–12列、总格≤80；labels唯一且单行，矩阵严格对应。values仅有限数或显式null，undefined、NaN、越量程拒绝。负量可在明确domain内表示，不能暗中从0截断。
- domain为有限递增二元数组，差值也必须有限；不自动用当前数据min/max，以免两个图的色阶被误认为同一尺度。low/high必须是不同的显式#RRGGBB颜色。
- 每格以`t=(value-min)/(max-min)`线性插值**sRGB通道**，非感知均匀色阶、非真实物理热量/亮度；不外推或clamp越界数据。null独立fill，0按量程定位。各图数值不可只比较色深而忽略量程。
- 固定标签区78px、头部40px、底部64px、格间6px；等面积格至少30×30。字号标签14/数字18；所有文本真实度量不适合就拒绝，不能裁掉标签或调小格内字。所有bounds边均有限且有效。
- 格内数字在黑/白中选较高的相对亮度对比，返回contrast作为**该背景与字色计算值**；不宣称整体WCAG/无障碍通过（周边文字/视觉理解尚需审查）。数值String原样显示，非舍入编码。

返回全部cells的value/t/fill/ink/contrast/bounds及domain。全部先检后画；保存并恢复绘图状态，已有clip有效，不自动流排或滚动。与color-sections的叙事分区、semantic-data的圆面积/示意区分，不新增通用家族。

不适用于数千格、颜色代表互斥类别却仍用连续量程、混单位指标、医疗/天文结论。没有数据采集、记录真实性、响应式或Motion验证。
