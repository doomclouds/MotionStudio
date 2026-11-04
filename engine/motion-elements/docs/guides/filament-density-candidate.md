# 多频密度与细脊材料候选

**未注册源码研究**：不进入 catalog / 公共 barrel，不增加60基础＋7配方计数，不是完整复刻或已接受作品。

## 选择与职责

用途是给调用层提供可重现的二维无色材料。低频密度决定明暗体块，扭曲细脊决定局部丝线；关闭细脊可独立使用软密度。可用于抽象背景、遮罩、低分辨率材料研究，不提供体积烟、真实流体、灯光、阴影或抗混叠。

现有 `folded-ripple` 为连续正弦坐标折叠与事件扰动，没有种子噪声和多频密度；`spherical-splats` 为球面高斯投影；`reaction-diffusion` 是迭代化学系统；`grid-transport` 搬运给定材料；raster 只负责已有像素。此候选不再造余烬、光扫、screen 合成或渲染器。已有一维 shake 噪声也不能代替二维材料。

## 最小使用与受限合同

从仓库根运行（Node 24+；不需要 Canvas、FFmpeg 或外部素材）：

```sh
node --input-type=module <<'JS'
import {compileFilamentDensity, sampleFilamentDensity}
  from './engine/motion-elements/lib/foundations/field/filament-density.mjs';
const plan = compileFilamentDensity({
  seed:29, scale:4, warp:1.2, ridgeWidth:.25, filamentMix:.85,
});
const field = sampleFilamentDensity(plan, {
  width:240, height:160, offsetX:0, offsetY:0,
});
// field.density: row-major Float64Array, [0,1], newly allocated.
console.log(field.width, field.height, field.density.length); // 240 160 38400
JS
```

现有中性示例已经完成调色；从仓库根取出 RGBA 像素副本（不写文件、不编码视频）：

```sh
node --input-type=module <<'JS'
import {filamentDensityFrame} from './engine/motion-elements/examples/filament-density.mjs';
import {copyRasterPixels} from './engine/motion-elements/lib/index.mjs';
const snapshot = filamentDensityFrame(0, 2, {reducedMotion:false});
const pixels = copyRasterPixels(snapshot);
console.log(snapshot.width, snapshot.height, pixels.length);
// pixels 为行优先 Uint8ClampedArray，RGBA 四通道；修改副本不改变 snapshot。
JS
```

`snapshot` 仅公开宽高，不含可直接读取的 `.pixels`。实际显示仍由现有 Canvas 调用层消费像素；此命令不代表视觉验证。

- seed：0..2³²−1 安全整数；scale：0.25..12，空间频率倍率；warp：0..2，噪声坐标位移倍率；ridgeWidth：0.04..0.8，无量纲细脊响应宽度；filamentMix：0..1，0为纯密度，1为密度×细脊。脊线只降低密度，不制造超过基底的能量。
- width/height 各1..256整数，最多65,536样本、单个结果数组524,288字节；每像素固定9次二维 value-noise（每次4个格点哈希），无迭代缓存或分辨率隐藏增长。这里只限定本次输出和算法空间，不承诺整个进程峰值内存或调用者保留多个结果的内存。
- 中心原点，x向右、y向下；较短边为1单位、像素中心采样，不随宽高比拉伸。offsetX/Y 各−100..100，单位同短边；是材料采样偏移，不是时间或物理速度。
- 五层整数哈希/quintic value noise合成密度；两路低频噪声扭曲双频旋转脊线坐标；输出为密度平方×可混合脊线响应。无上游固定红色、椭圆遮罩、品牌字或screen叠层。
- 精确普通数据记录；拒绝未知字段、accessor、非有限数、越界及伪造计划。编译复制输入、隐藏内部参数；输出独立。无时钟、随机状态、帧累积；同环境同输入重复和乱序一致，不保证跨JS引擎位级一致。
- 无时间轴、纹理平铺保证、循环、面积积分。低分辨率/高频/细脊会混叠，格点结构仍可能可见；单层不自动成为自然烟雾。调用层先选择密度与细节比例，再做留白/遮罩/合成；不要靠增频掩盖不良构图。

[两组中性示例](../../examples/filament-density.mjs) 分别为横向青色较细脊和竖向暖色软密度；只映射现有 raster snapshot，绝对秒产生小幅采样偏移，reducedMotion 固定0秒。不是求解烟流，也没有原片运动质量结论。

## 来源与证据界限

研究参考：[OpenDesign固定提交](https://github.com/nexu-io/open-design/tree/5a0c47777975ddb91d09c1c16b423a3ef74bf572/plugins/_official/examples/motion-superx-audience-growth)。实际看过官方完整静态封面，读取 `cloudTexture` / `atmosphere`；该源码以七层value noise、域扭曲脊线和screen合成产生云纹。**没有核见原片连续动态**；私有源码移植只验证局部背景机制，不当成整幅封面复刻完成。

原模板清单声明Apache-2.0，同时credits注明原片视觉/演示音乐来自 @robj3d3；不得把模板许可外推到品牌、参考图、音轨或全部原作表达。私有源移植保留出处且不入库。这里是中性独立实现：整数哈希、quintic插值、五层密度、旋转双频脊线及本合同均重新实现，没有复制上游函数、常量序列、素材或字形；代码沿用模块MIT。源机制学习不是完全独立于参考的灵感声明。

```sh
node --test engine/motion-elements/test/filament-density.test.mjs
```

专测含Python独立标量基准、种子/乱序/隔离、矩形裁切一致、细脊混合解析关系、关闭细脊/warp消融、极值/最大数组和非法输入，以及两个raster样例和reducedMotion。静帧观察仅覆盖样例0/2/4/8秒；不代表连续观看、产品交互、跨内容生产迁移或用户接受。生成图、参考、源移植和详细报告均在公开库外。
