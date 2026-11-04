# 球面光斑场候选：投影，而非体积渲染

状态：**未注册研究候选**。不在 catalog / public API 清单中，不增加当前 60 基础＋7 配方计数，不代表正式准入、美术通过或跨作品验证。按需直接读取源码与测试；不建立兼容入口。

## 缺口与复用边界

| 已有机制 | 为什么不替代本候选 |
|---|---|
| `field.attractor-orientation` | 给二维点方向，不生成球面连续标量纹理 |
| `field.grid-transport` | 沿给定二维速度场搬运材料，不提供球面投影或球面场 |
| `field.projected-reaction-diffusion` | 网格化学迭代，不是可直接乱序求值的球面斑块 |
| `field.arrival-field` | 距离/开始时刻决定到达时间，不是球面纹理 |
| `geometry.iso-contour` | 读取显式标量网格提取轮廓，不生成此场 |
| `geometry.ray-chain` / `geometry.hinged-panel` | 分别处理几何折射路径、刚性平面，不是曲面标量采样 |
| `raster.matte` / raster snapshot | 已直接复用；不另造颜色/alpha混合机制 |

本候选唯一新职责：把显式球面高斯斑块在旋转后的前半球投影成二维标量网格。宽斑块表达雾感、窄斑块表达亮点是参数变化，只算同一机制候选。调色、rim高光、时间、循环、布局、UI语义、音频都不属于该采样器。

## 输入/输出合同

实现：[spherical-splats.mjs](../../lib/foundations/field/spherical-splats.mjs)。

从仓库根运行（Node 24+；不需要 Canvas、FFmpeg 或外部素材）：

```sh
node --input-type=module <<'JS'
import {compileSphericalSplats, sampleSphericalSplats}
  from './engine/motion-elements/lib/foundations/field/spherical-splats.mjs';
const plan = compileSphericalSplats({lobes:[{
  direction:{x:0.6,y:-0.3,z:0.7}, sigma:0.2, strength:2,
}]});
const field = sampleSphericalSplats(plan, {
  width:128, height:128, yaw:Math.PI/4, pitch:0.2,
});
// field.density 和 field.coverage 是独立 Float64Array，行优先，均在 [0,1]。
console.log(field.width, field.height, field.density.length); // 128 128 16384
JS
```

现有中性示例已经完成调色；从仓库根取出 RGBA 像素副本（不写文件、不编码视频）：

```sh
node --input-type=module <<'JS'
import {sphericalSplatFrame} from './engine/motion-elements/examples/spherical-splats.mjs';
import {copyRasterPixels} from './engine/motion-elements/lib/index.mjs';
const snapshot = sphericalSplatFrame(0, 2, {reducedMotion:false});
const pixels = copyRasterPixels(snapshot);
console.log(snapshot.width, snapshot.height, pixels.length);
// pixels 为行优先 Uint8ClampedArray，RGBA 四通道；修改副本不改变 snapshot。
JS
```

`snapshot` 仅公开宽高，不含可直接读取的 `.pixels`。实际显示仍由现有 Canvas 调用层消费像素；此命令不代表视觉验证。

- 0..32 个斑块；空场 density 为 0，但投影球 coverage 仍存在。方向各分量 ±1e4，长度至少 1e-8，编译归一化并复制，后续源对象变更不影响 plan。
- `sigma` 0.03..2 是球面弦距尺度，`strength` 0..8；场由 `sum(strength * exp((dot-1)/sigma²))` 累加，再用 `1-exp(-sum)` 压到 [0,1]。强度不是亮度、能量或物理单位。
- 宽高各 1..512；`width*height*max(1,lobeCount) <= 4194304`。复杂度 O(像素×斑块)，内存 O(像素)；不是高清实时 GPU shader。
- `yaw/pitch` 弧度，各 ±1e4。屏幕 x 向右、y 向下、z 朝观察者。屏幕圆盘映射正 z 半球，逆 yaw 后逆 pitch 查询场；球居中，直径取较短边，矩形不会把球拉成椭圆。
- coverage 是一像素径向线性羽化，**不是精确像素面积积分或超采样**；羽化范围内圆外样本投回圆边。coverage=0 的样本 density=0。density 不预乘 coverage。
- 返回数组每次新建、归调用者所有；不暴露计划内部缓冲。未知字段、accessor、稀疏数组、非有限数、非法尺寸/成本会拒绝。
- 机制没有时钟/随机/累积状态；相同输入同环境重复求值一致。角度相差 2π 在浮点误差内等价；不承诺跨 JS 引擎逐位一致。窄斑块在低分辨率可能欠采样，应增加分辨率或加宽，不能用其模拟真实体积深度。

## 示例与验证

[三个纯源码示例](../../examples/spherical-splats.mjs)：铜色宽窄混合、青色小尺寸光斑、淡紫大范围雾场。三者不同尺寸/方向/配色，非三种独立机制。示例返回既有 raster snapshot，可与 matte 等组合。正常模式显式 6 秒周期，reduced 模式固定首相位；周期不是机制内隐含行为。无字体/图片/模型/凭据或第三方 shader。生成媒体留在仓库外。

```sh
# 仓库根运行：
node --test engine/motion-elements/test/spherical-splats.test.mjs
```

测试覆盖解析中心值、旋转约定、归一方向、矩形等比例投影、空场、coverage边界、乱序求值、2π误差、输入/输出隔离、极点与最大尺寸/成本、未知/非法输入、三例/reduced和已有matte组合。测试存在不等于当前环境运行通过；实际测试/视觉/全片常速观看/用户审定分别记录，不以像素变化数字代替美术审查。

## 来源与反例

研究动机为 OpenDesign 的 [composer-send.mp4 固定引用](https://github.com/nexu-io/open-design/blob/12d970eacc8971150e3c76470d2a9afe16dc2ed1/apps/web/public/composer-send.mp4)。该媒体仅私有参考，独立素材许可未知；仓库不包含、下载或运行它。未读取/复用其原 shader（未知），不是 `thinking-orbs` 或 `SiriOrb` 的实现移植。源码为独立解析数学实现，参数及示例为中性原创。

这是 **2.5D表面标量投影**，不是真实体积、云层积分、PBR、流体、折射或遮挡多层体；没有原片细碎星点、复杂涡流或体积层次。不适合被描述为原片精准复刻，也不自动代表“AI正在思考”的真实系统状态。要更丰富纹理，先用真实制作证明额外自由度必要，再决定是否扩展；不要塞入参考图或新增同义 orb 模板掩盖差距。
