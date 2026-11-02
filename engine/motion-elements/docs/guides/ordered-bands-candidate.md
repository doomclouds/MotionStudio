# 有序分带候选：共享边界，不做身份重排

状态：**未注册研究候选**；不进 catalog / public barrel，不增加正式机制计数。用于显式权重变化的单轴分区；两个中性技术示例不是作品或跨作品验收。

## 真实缺口与去重

- `design.proportional-partition` 是二维递归矩形划分，分割树可随数据变化，不是稳定的一维边界。
- `design.color-sections` 是两个静态区域，比例受限且允许间隔，不覆盖多个类别的连续全宽分配。
- `sampled-band` 是沿 x 采样的上下包络，不是相邻类别分区。
- `layoutWeightedHierarchy` 已提供静态有序权重切分；本候选不是新的静态分配大类。它不接受层级树，新增的是跨两端固定身份、共享边界的可乱序求值插值合同。该静态布局拒绝不可表示的正面积，而本候选允许极小权重折叠（见数值限制），不可混称精确数据可视化。
- 本候选只增加 **固定同序 ID 的归一共享边界插值**。调色、语义推断、输入框/打字、时间曲线、布局和颜色变化均由调用者决定，不重复实现。

## 使用与数学合同

[源码](../../lib/foundations/layout/ordered-bands.mjs) / [两个中性示例](../../examples/ordered-bands.mjs) / [测试](../../test/ordered-bands.test.mjs)。

从仓库根运行（Node 24+；不需要 Canvas、FFmpeg 或外部素材）：

```sh
node --input-type=module <<'JS'
import {compileOrderedBands, sampleOrderedBands}
  from './engine/motion-elements/lib/foundations/layout/ordered-bands.mjs';
const plan = compileOrderedBands({
  from:[{id:'work',weight:2},{id:'rest',weight:3}],
  to:[{id:'work',weight:4},{id:'rest',weight:1}],
});
const state = sampleOrderedBands(plan, .5);
// boundaries = [0, .6, 1]; bands 提供 id/start/end/fraction，均为归一坐标。
console.log(state.boundaries); // [0, 0.6000000000000001, 1]（浮点近似）
JS
```

已有 Canvas 场景可直接调用现有绘制示例，不需要新适配器。下面保存到仓库根的 `.mjs` 场景文件中；`ctx` 由宿主提供已初始化的 Canvas 2D context，不是独立可执行命令：

```js
import {createOrderedBandExample} from './engine/motion-elements/examples/ordered-bands.mjs';
const example = createOrderedBandExample(0);
example.draw(ctx, .5, 640, 120); // 当前局部原点；调用者可先平移/裁切。
// reduced motion 由宿主选择静态端点，例如 example.draw(ctx, 1, 640, 120)。
```

纯采样命令不依赖 Canvas；真正绘制需宿主已提供 Canvas（仓库 Native 路径使用 `@napi-rs/canvas`）。示例不写文件、不安装依赖。

1. 输入 `from/to` 各 1..128 个 `{id,weight}`；两端 ID 数量、顺序必须完全相同，ID 唯一且符合现有实例 ID 规则。插入、删除、换序直接拒绝，不隐式匹配、补齐或切帧。需要出现/消失时显式保留同一 ID 并将权重设零。
2. 权重为有限数 0..1e12，各端总量须正。分别归一化后求前缀边界 `A_i/B_i`。**不是先插值原始量再归一化**；端点总量变化不表达为整个画面面积变化。
3. 显式进度 `u∈[0,1]`，边界 `C_i=(1-u)A_i+uB_i`；每段共享 `C_i/C_(i+1)`。两端固定 0/1，非降序边界保持非降序；宽度总和为 1，映射固定宽 W、高 H 时总几何面积为 W×H（浮点误差内）。单个类别面积可以变，不是物理质量守恒。
4. 不对每段单独加不同 easing、stagger 或 round，否则共享边界约束会失效。可统一将外部曲线结果限制在 [0,1] 后作为进度。若需整像素边界，调用者应统一舍入整条边界序列，再取相邻差，不能各自舍入宽度。
5. 零宽 ID 仍返回；极小相对权重可能在 IEEE-754 累加中折叠成零宽，不承诺可见最小像素或任意精度。不要靠本机制掩盖不可读数据，需调用者明确聚合或另用表格。
6. 编译/采样均 O(n)，计划内部复制，返回每次新数组。没有时钟、随机或上一帧状态；同环境相同输入确定性求值。非有限数、未知字段、稀疏数组和 accessor 拒绝；不承诺恶意 Proxy 隔离或跨 JS 引擎逐位一致。
7. 只保证连续几何覆盖，不保证 Canvas 子像素抗锯齿无接缝。示例配置深冻结，索引为整数 0/1，绘制宽高须为有限正数且各不超过 1e6；简单 `fillRect` 组合保留 context 状态；不是独立 UI、可访问性图表或成熟 renderer。reduced motion 应由调用方选静态端点，不将动画当必需信息。

## 静态观察、源码事实与边界

研究动机：[OpenDesign Semantic Color Stripes 固定版本](https://github.com/nexu-io/open-design/tree/5a0c47777975ddb91d09c1c16b423a3ef74bf572/plugins/_official/examples/motion-semantic-color-stripes)。静态封面可见居中输入词、水平细线和下方不等宽色带。读取同版 `example.html` 可确认：`drawBands` 仅前后类别 ID 序列相同时插值，否则沿用前帧直至关键帧切换；延长停留额外摆动边界。词语替换走文字替换函数，颜色来自预置轨迹，不能称为实时语义模型。

这里独立实现数学分区，不移植原模板、关键帧数据、实测色板、字体或媒体。上游清单标 Apache-2.0，但同时署名原动画 Matt DesLauriers (@mattdesl) 且注明未访问原链接；这不证明原动画或音乐的分发权。本库不附这些素材。未实际看完整原动画、未运行上游浏览器演示，不宣称复刻动态、音频、交互或用户接受已验证。

## 验证入口

```sh
node --test engine/motion-elements/test/ordered-bands.test.mjs
```

解析边界/份额 oracle；两组独立中性合成分配；面积/相邻共享边界；乱序 seek；零宽/单段/极端数值/128段；等比例权重；输入输出隔离；重排/增删/非法输入拒绝。运行结果需绑定当次代码；技术通过不等于美术或真实数据迁移通过。
