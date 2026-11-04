# 到达场：比较的是量化后的到达时刻

## 两种时间分开
IEEE距离除speed得到诊断travelSeconds，再向上取整为travelTicks；该有理旅行时间与作者精确source start相加。source start不必落tick网格，因此结果不是全局整数tick时钟。

## 胜者和身份
不同连续距离可能量化成同到达时刻，平局按ASCII source ID选首项并完整报告ties。最近空间源未必最早到达，较晚启动会改变胜者。输入重排不改变身份结果。

## 不是物理因果求解
没有障碍、衰减、动态源或PDE；ceil只不早于浮点乘积，不是精确实数距离的保守证明。近边界libm舍入可能影响tick和胜者，不能宣称跨平台鲁棒预测。

## 组合边界
event-bindings是共享不计数支持，视觉ceil帧与音频最近采样规则不同，不自动同步在同一离散时刻。公开API保持Node入口，不扩大默认barrel平台合同。例子手算3-4-5距离和有理启动，历史范围见[README](README.md)。
