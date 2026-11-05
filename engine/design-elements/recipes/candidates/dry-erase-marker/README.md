# Dry-erase marker · 受限绘制候选

一支有圆毡尖、渐变箍圈/白笔杆、色带/尾帽和投影的 **2D立体感干擦笔**。外观与绘制代码适配自 LemoLab，保留[固定来源、差异和完整MIT版权](CREDITS.md)，不是纯原创或真实3D物理。它是现有设计积木目录中的源码候选，不登记正式family/catalog，不成为作品或整片模板。

## 三种笔分别保留

- [paper-drawing](../paper-drawing/README.md) 的原创 `drawMarker`：简洁平面马克笔，原接口保持不变。改变length/width不是另一支笔。
- 本候选的 `drawDryEraseMarker`：LemoLab派生、渐变白杆干擦笔。
- [wooden-pencil](../wooden-pencil/README.md)：RyanBowie派生木杆铅笔，另有独立契约和许可。

按纸面/白板视觉系统选择一种，不默认叠用。路径裁切与运动继续交给既有 [polyline-sections](../../../../motion-elements/docs/support/polyline-sections.md) 或timeline消费者，不为保留外观复制第二套白板引擎。

## API

```js
import {drawDryEraseMarker} from './index.mjs';
// 先画同一条可见墨迹的前缀；lastPoint必须来自该前缀。
const marker = drawDryEraseMarker(ctx, {
  x: lastPoint.x, y: lastPoint.y,
  angle: -.95, length: 120, ink: '#2a5cb3', lift: 0,
});
```

输入是当前realm普通或null-prototype记录，仅接受自有data字段。必需 `x,y` 为±1e6内有限数。可选字段只有：

- `angle`：−2π..2π弧度，默认−.95；从局部正X向下顺时针为正，笔身从接触锚向该方向延伸。
- `length`：24..430，默认120；表示名义原点到尾帽末端的轴向长度，不含尖端向前伸出的5/430或投影。固定宽高比，尾帽最大厚度为58×length/430。
- `ink`：严格六位十六进制 `#RRGGBB`，默认 `#2a5cb3`。同时着色圆毡尖、色带和尾帽。
- `lift`：0..1，默认0。令s=length/430、up=26×s×lift，笔身原点移动至(x−.15×up,y−up)，这是**caller-local Y方向**抬起，不是世界/屏幕坐标保证。影子随lift偏移、变淡并变软。
- `shadow`：boolean，默认true；false关闭本图标的投影，适用于狭小标注或几何测试。

缺省才用默认值；显式undefined/null、字符串数字、NaN/Infinity、越界、未知字段（含Symbol/隐藏额外字段）、getter及特殊原型均拒绝，不clamp。验证完成才接触Canvas。调用者与Canvas为信任边界，不是恶意Proxy沙箱。没有时间、随机流、文件加载、全局状态、网络或离屏Canvas。

### 接触锚不等于轮廓最前沿

返回值及嵌套点冻结，含 `contact`、`bodyAnchor`、`feltFront`、`length`、`lift` 和 `staticOnly:true`；坐标均未应用ctx父变换。

- `contact` 恒为输入(x,y)，表示纸面名义接触锚，应与可见墨迹末点共源。
- `bodyAnchor` 是抬起后的笔身原点。lift=0时与contact一致，原点实际位于圆毡尖**内部**。
- 源圆毡尖二次曲线由(−2,−5)经控制点(−8,0)至(−2,5)，轴向最前点为(−5,0)，不是(0,0)或控制点(−8,0)。`feltFront = bodyAnchor − 5×s×(cos(angle),sin(angle))`，是这个轴向曲线点，不是旋转后全轮廓的屏幕极值、碰撞边界或像素包围盒。

该区别允许圆头覆盖名义接触点，不能声称“轮廓最前沿与路径末点精确重合”。lift期间墨迹进度应保持或由调用者停写，飞行轨迹不得变成新墨迹。小笔的渐变/尖端细节会丢失；先在最终观看尺寸检查，不仅放大看样张。

### Canvas状态与有限域

使用已有Canvas 2D上下文（含roundRect、quadraticCurveTo、线性渐变及filter）。只追加局部transform，不调用setTransform/resetTransform。继承父transform、clip、alpha和composite。内部显式管理图标filter与shadow属性，所有save以finally配对，异常也恢复状态；Canvas当前path会被替换，后端异常前已绘像素不会回滚。

投影blur在本地数值范围约0.335..16，固定普通小数写法，不产生科学记数法；父transform仍由调用者控制，不承诺任意巨大缩放的性能。渐变/抗锯齿/blur依赖后端，不保证跨平台逐像素一致。Native部分样式getter缓存可能与restore后的真实绘色不同，测试以实际后续像素为准，不读取陈旧getter再写回。

## 消费与验证

[examples/consumers.mjs](examples/consumers.mjs) 有两个独立语义内容：从直角边构造三角形对角线；围绕电池/灯泡连接串联电路。两者都实际调用既有polyline-sections，以同一前缀画线并把唯一末点传给干擦笔，不是两种换色。它们是无字体合成技术图，不是数学/电路教学保证、自动布局或影片。

[test/marker.test.mjs](test/marker.test.mjs) 覆盖锚点/真实尖端/lift、严格输入、无getter执行、blur序列化、父变换/alpha/composite、实际绘后样式/clip恢复、两处异常恢复、同源墨迹端点，以及乱序/重复输入的Native像素一致。状态恢复测试使用轴对齐clip加非平凡父变换；部分Native版本对旋转clip仅save/restore亦可产生边缘抗锯齿差异，不把该后端行为说成任意clip逐像素保证。

```sh
export MOTIONSTUDIO_CANVAS_MODULE=/absolute/path/to/installed/@napi-rs/canvas/index.js
node --test engine/design-elements/recipes/candidates/dry-erase-marker/test/*.test.mjs
mkdir -p /absolute/external/marker-samples
node engine/design-elements/recipes/candidates/dry-erase-marker/examples/render.mjs /absolute/external/marker-samples
```

Node24和Native Canvas需事先可用；不安装依赖。portable中将engine改为runtime。生成样张只写已存在的仓库外目录（校验真实路径），不随源码分发。固定源独立小宿主的有限样张对照与静态查看，只支持这一外观保留范围；测试通过不等于源片运动还原、浏览器/跨后端验收、成片观看、实际听审或用户美术接受。
