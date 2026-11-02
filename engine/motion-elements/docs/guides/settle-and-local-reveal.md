# 有限落定残差与局部几何揭示

[返回入口](../../README.md) · [目录与公共 API](../registered-foundations.md)

本页保存对应机制的详细合同、合成示例和已有证据限定。历史批次数量不是当前目录数，已有测试描述不代表本次重新运行或艺术通过。代码片段中相对导入以本页所在目录为基准；shell 命令按各段注明的工作目录运行。

## 有限落定残差与对象局部几何揭示

### Foundation：sampleFiniteSettle

```js
const {residual,derivative}=sampleFiniteSettle(u,{
  amplitude:0.3, oscillations:2, decay:3
});
```

u∈[0,1]；amplitude∈[-1,1]、oscillations∈[1,4]、decay∈[0,8]，所有字段必填，未知字段拒绝。这是 foundation，不另凑 catalog 效果数量。

令 E=sin(πu)² exp(-decay·u)，ω=2π·oscillations：
residual=amplitude·E·sin(ωu)；
derivative=amplitude·exp(-decay·u)·[(πsin(2πu)−decay·sin(πu)²)sin(ωu)+sin(πu)²·ωcos(ωu)]。
两个端点残差和导数显式为0，符合解析极限，不是末帧截断。

residual 是有符号残差，**不是 0→1 progress，也不是物理弹簧**；不能直接注入 opacity、mask progress 或受限 ease/lerp。abs(residual)≤abs(amplitude)，amplitude 只是系数，不是实际峰值。derivative 对 u 求导，若位移尺度 L、时长 D>0，物理时间速度为 L·derivative/D。基础轨迹本身若端点不静止，相加后仍不静止；示例基础使用 smoothstep。

reduced-motion 在组合层把残差设0，保留基础轨迹/时段；没有低层空选项。角色示例通过脚底 pivot 与面积保持 scale 实现回弹，不把角色推入地面。尺度最终应>0。低FPS仍可能混叠：演示3秒2周期，在24/30/60fps至少每周期36帧；更短时段应减少周期或不用该效果，不修改数学定义迁就帧数。

### Reveal：withLocalReveal

```js
withLocalReveal(ctx,{
  bounds:{x:0,y:0,width:240,height:140},
  progress:0.6, radius:12, direction:'left-to-right'
},drawContent,{Path2D:canvasApi.Path2D});
```

`reveal.local-geometry` 是独立 catalog 机制。最后参数必须显式注入后端 Path2D（Native 或浏览器），要求支持 roundRect/rect 与 ctx.clip(path)；不自动下载或切换后端。方向只接受 left-to-right/right-to-left/top-to-bottom/bottom-to-top。bounds x/y 限±1e6，width/height 为(0,1e6]；radius∈[0,min(width,height)/2]，progress∈[0,1]，均不静默clamp。

调用者拥有局部矩阵，API 不接收或重复施加矩阵。可见域=固定圆角边界∩方向条带，不将条带重新圆角。progress=0 不调用内容；progress=1 仍完整clip。用两个独立 Path2D，不修改调用者 current path；save/finally restore 保绘图状态。**内容callback自己修改current path或外部对象不在回滚保证内**。仅同步callback：AsyncFunction/thenable拒绝，不是能撤销恶意异步副作用的沙箱。

这只是几何裁切，不是字形alpha mask、署名扫光、滤镜、任意SVG或多边形morph。透明孔洞仍透明。reduced模式在示例层按原时段中点cut，无低层另一个时钟。

四格合成片分别展示：到位卡片、脚底锚定几何角色、非均匀父缩放和旋转下的图表窗口、两方向透明图标展示框；各机制两种内容。显式每4秒重复一次，8秒无声；当前只作技术展示，艺术/重量感/常速审看与真实迁移证据另计。

```sh
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/settle-reveal-new --demo settle-reveal
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/settle-reveal-still-new --demo settle-reveal --frame 43
```
