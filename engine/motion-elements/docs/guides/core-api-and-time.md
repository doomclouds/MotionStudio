# 基础 API、时间与输入合同

[返回入口](../../README.md) · [目录与公共 API](../registered-foundations.md)

本页保存对应机制的详细合同、合成示例和已有证据限定。历史批次数量不是当前目录数，已有测试描述不代表本次重新运行或艺术通过。代码片段中相对导入以本页所在目录为基准；shell 命令按各段注明的工作目录运行。

`sampleMotion` 输出 `{matrix, opacity, phase, progress}`。每次求值只依赖输入，不递增内部播放状态，不使用 `Math.random()`；顺序、倒序和跳时应相同。范围是 `[start,end)`，到数学 `end` 可以取得终态，但帧渲染器通常不渲染项目结束帧；需要终态停留时显式留出 hold，不把 N 帧映射成 N−1。

时间用 timeline-core 的 `{n:'integer',d:'positive integer'}`。先有理数比较边界，进入内部才转为浮点进度。范围要求 start ≥ 0、duration > 0、end ≤ 24 小时；不支持零时长动作或负项目起点。`framesToTime` 为共享函数，调用者提供有效正帧率。

曲线：`{type:'linear'}`、`{type:'smoothstep'}` 或 `{type:'cubic-bezier',values:[x1,y1,x2,y2]}`。Bezier 按 x 反求参数；本版控制值均在 0..1 且 x1 ≤ x2，不支持 overshoot 曲线。

未知字段、显式 null、NaN、非法枚举、重复 ID、负间距/错误范围等拒绝，不做静默降级。

## API 与参数

`catalog.json` 给出每个元素可执行示例，包括所有必需字段。名称和函数：

| 元素 ID | API | 主要参数 |
| --- | --- | --- |
| motion.transform | sampleMotion | 完整 from/to `{x,y,scaleX,scaleY,rotation}`，可选 origin |
| motion.opacity | sampleMotion | from/to 在 0..1 |
| motion.anchored-squash | sampleMotion | amount 0..0.8、axis x/y、origin |
| motion.shake | sampleMotion | amplitudeX/Y、rotation、frequencyHz、seed、elementId，可选 origin |
| motion.stagger | compileStagger | itemIds、start、duration、step；三时间均为 Time |
| transition.push | sampleTransition | width、height、direction left/right/up/down |
| transition.rect-wipe | sampleTransition | width、height、direction left/right/up/down |
| composition.offset-cards | offsetCards | itemIds、origin、card、offset，可选 rotationStep、zOrder |
| composition.split-panels | splitPanels | itemIds、viewport、axis，可选 gap |
| recipe.offset-reassembly | sampleOffsetReassembly | 卡片布局参数、Time step、travel |

上表早期 motion/transition/recipe spec 有 `type,version:1,range,params` 和可选 curve；layout 与 stagger 直接接受表中参数。stagger 表示错峰启动，不是串行等待，返回稳定 itemId 和绝对 range。recipe 的整体 range 保持不变，每个卡片动画时长 = 总长 − 最后卡片延迟；不足正时长则拒绝。

矩阵乘法、唯一属性写入者、回调同步性、Path2D、透明合成及reduced-motion的详细边界统一见[Canvas组合](canvas-composition.md)。
