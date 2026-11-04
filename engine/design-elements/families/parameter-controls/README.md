# design.parameter-controls.v1 · 参数刻度与状态

<!-- asset-self-description: design.parameter-controls.v1 -->

## 选择与身份

用于把一个当前值、线性量程、单位与滑块位置放在同一静态图中：曝光补偿、产品参数解释、控制流程对比。不要用于对数频率、真实音量响度、多个无共同量纲的数据比较，或把绘图当成可操作控件。设计判断与内容替换见 [design.md](design.md)。

唯一登记为 [catalog](../../catalog.json) 的 `design.parameter-controls.v1`，版本与发布状态以该项为准。直接实现 [index.mjs](index.mjs) 导出 `id/version/guidance/validate/draw`；总 [dispatcher](../../index.mjs) 同样调用该实现。旧平层实现、文档和示例路径已删除，无兼容入口。源案例关联不是源案例实际调用证据。

## 使用与参数

调用 `draw(ctx, props)`，ctx 为具有 `roundRect/measureText` 等标准方法的 Canvas 2D context。`validate(props)`返回带默认值的规范化对象，不修改输入。输入并非严格的未知字段拒绝 schema。

- `bounds={x,y,width,height}`：有限像素坐标；width 180–1600，height 160–1200。纵向至少 300px，但仍受下述文字/轨道约束。
- `data={label,value,min,max}`：label 单行字符串，至多60字符；有限数值 max>min，min≤value≤max，不自动截断。`unit=''` 单行至多12字符；`orientation='horizontal'` 可选 vertical；`ticks=5` 整数2–21；`precision=0` 整数0–3；`disabled=false` 必须为布尔值。
- `theme` 可省略。默认 `surface='#11151b'`、`ink='#f3f4f6'`、`muted='#a3adbb'`、`accent='#ff822e'`、`track='#384150'`、`edge='#535c69'`，自定义色须为六位 #RRGGBB。`fontFamily='sans-serif'` 单行至多100字符；`fontSize=18`，10–32px。调用者提供可用且合法授权的字体，校验不证明字体实际加载。

几何下限不是任意文字组合的排版保证。横向要求 `height >= 124.5 + 4.08 × fontSize`，纵向还检查值行框、轨道间距和刻度密度；实际标题、值和刻度测量超宽会抛错。`draw` 在画之前完成这些检查，调用者可以据错误调整尺寸、内容或刻度数，不应隐藏裁切。

返回 `id,bounds,textRegions,track,thumb,ticks,normalized,value,unit,disabled,staticOnly`。normalized=(value−min)/(max−min)，水平左小右大，垂直下小上大；track/ticks/thumb 为绝对画布坐标。disabled 将内容 alpha 乘0.45，不改变量程或值；背景/边框仍完整。它不实现事件、焦点、键盘、ARIA 或实际禁用逻辑。

绘制用 save/restore，并显式恢复实现列出的样式；当前路径可能变化，不承诺所有宿主状态或字体栅格完全一致。无动画时钟或缓动，动效需由消费者安排且保持值与位置同源。

## 运行示例与测试

[两组输入](examples/cases.mjs) 分别是黑黄横向曝光补偿与米色纵向监听增益；[render](examples/render.mjs) 实际 import 本实现并逐例绘制，返回PNG哈希、几何与字体SHA256。它们只是合成数据，不是设备规格。

仓库根执行（可移植包中将 engine 换为 runtime）：

```sh
export MOTION_ENGINE_ROOT=/absolute/path/to/installed/runtime
export UI_TEST_FONT_DIR=/absolute/path/to/dejavu
node engine/design-elements/families/parameter-controls/examples/render.mjs
node engine/design-elements/families/parameter-controls/test/contract.mjs
# 可选输出到尚不存在的仓库外目录
node engine/design-elements/families/parameter-controls/examples/render.mjs --out /absolute/new-external-directory
```

实现无模块/资源依赖。示例与测试需要 Node24+、MOTION_ENGINE_ROOT 下已安装的 `@napi-rs/canvas`，以及 DejaVuSans.ttf、DejaVuSans-Bold.ttf、DejaVuSerif.ttf、DejaVuSerif-Bold.ttf。也可用 `PARAMETER_CONTROLS_FONT_DIR` 覆盖 UI_TEST_FONT_DIR。不自动下载、不静默替代缺失字体、不携入node_modules。输出路径需受信任；工具不提供对抗性文件系统沙箱。

[同目录测试](test/contract.mjs) 覆盖两组真实绘制、重复确定性、两方向min/mid/max值位一致、dispatcher一致、输入不变、非法输入绘前拒绝和禁用状态。总族回归仍在 [verify](../../test/verify.mjs)。技术通过不等于浏览器、交互、动效、无障碍、视觉或用户接受，作品状态和锁独立保留。

## 来源、权利与边界

本库原创参数化实现，按根 [MIT](../../../../LICENSE) 使用。设计关系来自 hardware-sampler-study 的推子/选中状态观察，没有复制参考图、设备logo或真实设备规格；来源关系见 catalog，不能推导为作品已调用。字体及参考媒体权利不由源码MIT授予，调用者核实外部字体许可。[第三方声明](../../../../THIRD_PARTY_NOTICES.md)和[源码范围](../../../../SOURCE-SCOPE.md)继续适用。
