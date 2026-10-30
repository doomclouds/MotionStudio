# design.parameter-controls.v1 · 参数刻度与状态

代码：[`parameter-controls.mjs`](../parameter-controls.mjs)。示例：[`examples/parameter-controls.mjs`](../examples/parameter-controls.mjs)。

## 设计判断

专业工具的识别来自“当前值—量程—选中位置—单位”的一致关系，不是装饰几个旋钮。把强调色留给当前参数，把刻度/边界退到次级，读者才能迅速理解调整对象。该资产把这条关系保持为可验证的不变量。

设计来源：`portfolio/works/hardware-sampler-study/design/scene.mjs` 中音频推子与橙色选中状态。实现是独立参数化绘制，不使用原图或示例设备logo，不宣称真实设备量程/摄影建议。

## 契约

`draw(ctx, props)` / `validate(props)`。`props.bounds={x,y,width,height}`；data 包含 label、value、min、max，和可选 unit、orientation、ticks、precision、disabled。theme 包含 surface/ink/muted/accent/track/edge 六个 #RRGGBB 色、fontFamily和fontSize。所有字体调用者拥有。

- min/max/value 有限，max>min，value在范围内；越界拒绝，不悄悄clamp。
- ticks为2–21整数，precision为0–3整数。刻度太密而无法按字体阅读时拒绝。
- width 180–1600，height 160–1200 是外层范围，并非所有字体/尺寸组合都合法；纵向需至少300px高。标题和值按 1.2 倍字号保留行框，值行框下方与轨道/滑块至少留 24px。横向高度必须满足 `height >= 124.5 + 4.08 × fontSize`；例如 560×160 / fontSize32 在绘制前拒绝。纵向轨道起点随字号下移，还需容纳所有刻度间距。
- label单行<=60字符，unit<=12字符；按实际文字测量拒绝标题/值溢出。
- 返回实际value/unit、normalized、thumb、track、tick几何、textRegions行框、disabled；布局和上层动效可据此跟踪稳定语义。
- disabled改变整体视觉强度，同时返回状态，但不替代真正交互禁用逻辑。
- 数值到位置严格线性，水平左小右大、垂直下小上大；不要将它当作对数频率/音量响度量表，除非后续明确新增映射契约。

## 组合与边界

用在单参数讲解、产品特性页、控制流程对比；可放入表面资产的contentBounds。多个参数应共享颜色角色和字阶，不要每个控件用不同霓虹色。不要把静态绘图当作已实现的键盘、鼠标或触控控件；没有可访问性语义DOM，没有交互事件，也没有动效时钟。

两个实际重组候选：黑黄横向曝光补偿（-3..3 EV）；米色纵向监听增益（0..80 dB）。它们改变内容、量程、方向、主题和几何，不改内部实现。示例数值仅测试资料，不是设备规范。重组验证不增加案例数量，视觉与技术状态分别记录。
