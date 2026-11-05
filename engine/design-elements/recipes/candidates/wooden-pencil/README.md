# Wooden pencil · 受限外观候选

保留《Launch Race》的**削木锥、石墨/红色笔芯、三面蓝/红漆杆、金属箍、粉色橡皮和硬投影**，供后续白板内容复用。绘制主体是 RyanBowie 的 MIT 源码改编，不是原创笔设计；固定来源、逐项差异与权利见 [CREDITS.md](CREDITS.md)、[LICENSE-RyanBowie](LICENSE-RyanBowie) 和 [LICENSE](LICENSE)。只保留笔，不复制影片、内容数据、动作表、素材、字体或音轨。

这是未登记 design family/catalog 的源码 candidate，不因保留或测试通过而晋级。现有 [paper-drawing.drawMarker](../paper-drawing/README.md) 的原创平面矩形笔继续保持原 API；本候选不是它的换色版本，也不改写它。

## API

```js
import {drawWoodenPencil} from './index.mjs';
// contact 来自 caller 已经画出的 polyline 前缀末点。
const state = drawWoodenPencil(ctx, {
  x: 120, y: 180, angle: -.5, length: 280, lift: 0, lead: 'blue', shadow: true,
});
```

`drawWoodenPencil(ctx, options)` 是一次固定状态绘制，不拥有时间：

- 必需 `x,y`：有限数字，范围各 ±1e6，caller-local 纸面接触点。
- `angle`：弧度，范围 ±2π，默认 `.62`；围绕可见笔尖旋转，杆沿局部正 X 延伸。Canvas 的正角在通常 Y 向下坐标中为顺时针。
- `length`：有限数字，范围 `56..1120`，默认 `560`。这是相对源坐标 560 的**名义长度**；全部几何、线宽、lift 和投影偏移等比缩放。宽度固定为 `30 × length/560`，不提供独立胖瘦参数。橡皮曲线实际最远轴向点在源坐标 558，硬投影最远点在 560；不把名义长度冒称外观的精确包围盒。
- `lift`：有限数字 `0..1`，默认 `0`。纸面 contact 不变，可见尖端在 caller-local 负 Y 方向上移 `24 × length/560 × lift`，此位移发生在笔自身旋转之前，不沿笔杆方向抬升。父 transform 随后照常作用，因而它不是设备/屏幕坐标中的固定上移。
- `lead`：仅 `'blue'`（默认）或 `'red'`。blue 是蓝漆杆配石墨芯，red 是红漆杆配红芯；沿用源配色，不接受任意 CSS 色、资源或回调。
- `shadow`：布尔值，默认 `true`。源硬投影相对 contact 的 X/Y 偏移均为 `(6 + 16 × lift) × length/560`，透明度是 caller alpha 的 `.16` 倍，不是光照模拟。

返回冻结记录 `{contact, visibleTip, shadowTip, length, lift, lead, staticOnly:true}`；三个点是 caller-local 坐标，尚未施加 ctx 父变换，`shadow:false` 时 shadowTip 为 null。零 lift 时 contact 等于 visibleTip，几何尖端严格为该点；尖端是三角形零面积顶点，不能要求其所在单个像素必然完全着色，抗锯齿覆盖受后端与缩放影响。

options 仅支持普通或 null-prototype 记录、已知可枚举自有数据字段。拒绝数组、类实例、额外字符串/symbol、getter/setter、不可枚举字段、缺必需字段；不调用 getter。只对省略字段使用默认值，显式 null/undefined 不当作省略。数值不隐式转换或夹取，越界/非有限抛 RangeError，记录/枚举/Canvas 方法缺失抛 TypeError。普通调用者和 Canvas 是信任边界；恶意 Proxy、被改写的内建对象不属于安全沙箱保证。

## Canvas 与 caller 职责

- 继承 caller 的 transform、globalAlpha、clip、globalCompositeOperation，以及未覆盖的 ambient shadow/filter。没有 resetTransform、离屏 Canvas、内部时钟、随机流、DOM、网络或运行依赖。
- 在平衡的 save/try/finally/restore 内覆盖笔的 fill/stroke、线宽、线端/连接、miter 和 dash；绘制异常仍恢复状态。与 Canvas 通常语义一致，当前 path 会被替换，恢复不撤销已经画出的部分像素，不提供事务式绘制；Canvas 自身 save/restore 失效不在保证内。
- 笔身使用 caller alpha；源代码把硬投影 alpha 直接设 `.16`，这里修正为 `callerAlpha × .16`，所以父 alpha 为零时笔和投影均消失。不宣称所有 caller 状态下与源像素完全相同。
- 世界到纸面映射、镜头、角度设计、时间、进出场、抬笔间移动、墨迹颜色和路径揭示由 caller 决定。先用既有 `polyline-sections`/`polyline-trail` 画墨迹，再把**同一个可见末点**交给此 API。抬笔移动轨迹不能自动成为墨迹。
- 这是一种有限的二维分面外观，不是通用物理笔、完整 3D、真人手、笔刷/压感、自动文字笔顺或自动书写。它不保证不遮挡字块；长段正文应另行安排笔退场与构图。

## 两种消费与测试

[examples/consumers.mjs](examples/consumers.mjs) 用既有 polyline-sections 生成可见前缀：一例是带站点的路线标注，一例是直角三角形几何构造。两例使用同一种蓝笔且内容/拓扑不同，不是两个换色版本；零长度前缀不画笔，时间和进度来自 caller。这些是合成契约消费者，不是整片模板或生产迁移证明。

```sh
export MOTIONSTUDIO_CANVAS_MODULE=/absolute/path/to/installed/@napi-rs/canvas/index.js
node --test engine/design-elements/recipes/candidates/wooden-pencil/test/*.test.mjs
```

需要 Node 24 和已有 Native Canvas；不自动安装。测试包括真实尖端附近像素/lift、各材料色面、父 transform/alpha、硬投影 alpha、实际绘后样式/clip 恢复、后端异常恢复、非法值/getter、两种内容消费者、固定打乱顺序重复像素。Native 部分版本 restore 后样式 getter 可能缓存旧值，故采用后续实际绘色验证，不据陈旧 getter 强行写回。

固定源小宿主的有限外观对照、两张实际样图和检查报告留在仓库外，不分发 golden PNG。此处只声明测试契约；技术和有限静态外观检查不等于用户审美批准、连续运动审阅、实际影片消费、音画同步、浏览器/跨后端一致或正式生产验收。
