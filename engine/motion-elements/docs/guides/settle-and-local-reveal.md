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

完整API、实现与测试见[局部几何揭示资产](../../lib/foundations/reveal/local-geometry/README.md)。finite-settle是不额外计数的共享基础，继续保留上段原合同。

四格合成片分别展示：到位卡片、脚底锚定几何角色、非均匀父缩放和旋转下的图表窗口、两方向透明图标展示框；各机制两种内容。显式每4秒重复一次，8秒无声；当前只作技术展示，艺术/重量感/常速审看与真实迁移证据另计。

```sh
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/settle-reveal-new --demo settle-reveal
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/settle-reveal-still-new --demo settle-reveal --frame 43
```
