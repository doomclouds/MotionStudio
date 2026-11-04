# 有序分带（experimental）：共享边界，不做身份重排

<!-- asset-self-description: composition.ordered-bands -->

## 当前资产入口

本页是`composition.ordered-bands`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/ordered-bands.test.mjs)保留原断言。旧guide、实现和测试位置不留wrapper。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


状态：**experimental**；以 `composition.ordered-bands` 注册，公共入口为 `lib/index.mjs`。用于显式权重变化的单轴分区；三个中性参数变体及两种内容消费者都是合成技术/迁移测试，不是客户作品或跨作品验收。

本页是该机制的完整自描述入口：用途与取舍、输入输出、代码与场景、验证及限制在此统一导航。原候选guide已迁入本目录，旧入口删除；当前状态以上方稳定 ID 和 catalog 为准。

## 真实缺口与去重

- `design.proportional-partition` 是二维递归矩形划分，分割树可随数据变化，不是稳定的一维边界。
- `design.color-sections` 是两个静态区域，比例受限且允许间隔，不覆盖多个类别的连续全宽分配。
- `sampled-band` 是沿 x 采样的上下包络，不是相邻类别分区。
- `layoutWeightedHierarchy` 已提供静态有序权重切分；本机制不是新的静态分配大类。它不接受层级树，新增的是跨两端固定身份、共享边界的可乱序求值插值合同。该静态布局拒绝不可表示的正面积，而本机制允许极小权重折叠（见数值限制），不可混称精确数据可视化。
- 本机制只增加 **固定同序 ID 的归一共享边界插值**。调色、语义推断、输入框/打字、时间曲线、布局和颜色变化均由调用者决定，不重复实现。

## 使用与数学合同

[源码](index.mjs) / [三个中性变体](examples/ordered-bands.mjs) / [测试](test/ordered-bands.test.mjs)。

从仓库根运行（Node 24+；不需要 Canvas、FFmpeg 或外部素材）：

```sh
node --input-type=module <<'JS'
import {compileOrderedBands, sampleOrderedBands}
  from './engine/motion-elements/lib/index.mjs';
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
import {createOrderedBandExample} from './engine/motion-elements/lib/foundations/layout/ordered-bands/examples/ordered-bands.mjs';
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
7. 只保证连续几何覆盖，不保证 Canvas 子像素抗锯齿无接缝。示例配置深冻结，索引为整数 0..2，绘制宽高须为有限正数且各不超过 1e6；简单 `fillRect` 组合保留 context 状态；不是独立 UI、可访问性图表或成熟 renderer。reduced motion 应由调用方选静态端点，不将动画当必需信息。

## 静态观察、源码事实与边界

研究动机：[OpenDesign Semantic Color Stripes 固定版本](https://github.com/nexu-io/open-design/tree/5a0c47777975ddb91d09c1c16b423a3ef74bf572/plugins/_official/examples/motion-semantic-color-stripes)。静态封面可见居中输入词、水平细线和下方不等宽色带。读取同版 `example.html` 可确认：`drawBands` 仅前后类别 ID 序列相同时插值，否则沿用前帧直至关键帧切换；延长停留额外摆动边界。词语替换走文字替换函数，颜色来自预置轨迹，不能称为实时语义模型。

这里独立实现数学分区，不移植原模板、关键帧数据、实测色板、字体或媒体。上游清单标 Apache-2.0，但同时署名原动画 Matt DesLauriers (@mattdesl) 且注明未访问原链接；这不证明原动画或音乐的分发权。本库不附这些素材。未实际看完整原动画、未运行上游浏览器演示，不宣称复刻动态、音频、交互或用户接受已验证。

## 验证入口

```sh
node --test engine/motion-elements/lib/foundations/layout/ordered-bands/test/ordered-bands.test.mjs
```

解析边界/份额 oracle；三组中性参数变体；面积/相邻共享边界；乱序 seek；零宽/单段/极端数值/128段；等比例权重；输入输出隔离；重排/增删/非法输入拒绝。运行结果需绑定当次代码；技术通过不等于美术或真实数据迁移通过。


## 设计意图、内容迁移与取舍

共享边界让观者读出“同一整体内部重新分配”，而不是把每段当作独立卡片飞入。固定类别顺序保留比较锚点；稳定的标题、端点值与图例让动画不是获取信息的唯一途径。不要用弹簧过冲、每段延迟或独立取整破坏连续覆盖。

[两种内容消费者](examples/ordered-bands-studies.mjs)复用同一编译/采样实现，不复制机制：

- `createOrderedBandStudy('workload')`：浅底横向 40 小时预算，从 8/24/8 到 12/16/12，三个固定类别；端点小时数与当前份额并列，强调同一时间预算内的取舍。
- `createOrderedBandStudy('inventory')`：深底自下向上库存组成，从总量 100 到 160；四个类别，其中 Seasonal 从零出现。表格明确列出两个端点数量，动画只表达份额插值，不声称中途实际库存量。总面积不随总量增长，这是归一组成的选择，不可冒充绝对数量对比。
- `createOrderedBandStudy(name, true)`：静态终态 reduced motion；`study.draw(ctx, progress, width, height)` 使用调用者 Canvas，显式统一边界取整，不改机制采样。示例是固定 16:9 内容版面，不是响应式排版/可访问性组件；超小显示应改用表格而非继续缩字。

实际 Native Canvas 检查覆盖两种内容、明暗背景、1280×720 与 640×360；关键帧 0/.25/.5/.75/1、重复进度与静态 reduced-motion 输出。代码测试覆盖乱序、端点、零宽、极端权重、未知字段、accessor、绘图异常恢复。关键帧观察未见遮挡、标签溢出或分带空隙；字体使用宿主已装系统字体并记录外置证据，不附字体或媒体。

本轮独立审阅已核对实现/消费者字节、两类关键帧和相关测试，未见阻断；后续改动需重新绑定受影响证据。常速完整观看 NOT_DONE、实际听审 NOT_LISTENED、用户艺术接受 PENDING_USER、真实客户制作迁移 NOT_RUN；本次两种合成内容验证只支持 experimental 准入，不支持 stable 或默认美术风格推荐。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/layout/ordered-bands/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/layout/ordered-bands/test/*.test.mjs
```

保留共享validate，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。本项三份测试和Native内容研究已共置；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

计划品牌仅当前canonical模块实例有效；保存原始定义并重新compile，采样返回独立新数组。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。

原[中性变体](examples/ordered-bands.mjs)和[两种内容研究](examples/ordered-bands-studies.mjs)及三份专属测试全部共置，不删除原合成证据。
