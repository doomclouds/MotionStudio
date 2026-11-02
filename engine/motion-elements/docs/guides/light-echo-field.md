# 灯点身份与断续竖条映像配方

[返回入口](../../README.md) · [目录与公共 API](../registered-foundations.md)

本页保存对应机制的详细合同、合成示例和已有证据限定。历史批次数量不是当前目录数，已有测试描述不代表本次重新运行或艺术通过。代码片段中相对导入以本页所在目录为基准；shell 命令按各段注明的工作目录运行。

## 灯点身份与断续竖条映像（experimental recipe）

`compileLightEchoField` → `sampleLightEchoField` → `drawLightEchoField`：一个配方，
组合已有 rational 时间、smoothstep、seededUnit、motion.transform 和 withMotion。
适合**显式设计的灯点及同色竖条映像**；不是镜面倒影、物理雨水/折射、真实
景深或 3D。没有自动布景、随机灯群、地平线检测、透视或遮挡求解。

```js
import {compileLightEchoField, sampleLightEchoField, drawLightEchoField,
  rational as T} from '../../lib/index.mjs';
import {example} from '../../examples/light-echo-field-scene.mjs';
const plan = compileLightEchoField(example); // once; input remains mutable
const state = sampleLightEchoField(plan, T(3, 2)); // absolute project time
// Caller fills background, applies optional parent transform/clip once.
drawLightEchoField(ctx, state);
```

合同（完整可执行输入见示例与目录）：

- `type:'recipe.light-echo-field',version:1,range,seed,lights,camera,focus,drift`
  全部必填。range 沿用共享 0..24h、正时长约束；seed 为至多128字符字符串。
- lights 1..512 个，唯一 `id`（沿用1..64 ASCII字母/数字/下划线/连字符），
  显式 `position:{x,y}`, `radius` 0.1..1000、RGB整数三元组、`opacity` 0..1。
  `echo` 可省略（不画映像），显式 null 拒绝。
- echo 为 `offset:{x,y}`（相对该灯原始位置，不随失焦扩散）、`width`、`step`、
  `count` 1..64、`heightMin/heightMax`、`opacity`。宽/间距/高在0.1..1000，
  max≥min；坐标沿用 point 的±1e9上限。允许条段重叠，重叠不等于水面物理。
- seed 按 **light ID＋channel＋fragment index** 隔离；编译时固定每段高/强度，
  采样时只作连续平移。删除/重排其他灯不改变本灯的状态；数组顺序仍决定层序，
  重叠半透明灯重排后的像素不保证一致。每段返回 `sourceId,index` 便于绑定。
- camera 是已有 motion.transform 的 `{from,to,origin}` 参数，由共享 evaluator
  求值；返回 `state.motion`，adapter只应用一次。focus `{from,to}` 为0.1..8，
  smoothstep只改变光盘半径，不改灯位、映像位置/宽/高。它是设计尺度，不是焦距。
- drift `{x,y,frequencyHz}` 的幅度0..1000、频率0..10Hz，按绝对时间和每灯固定
  phase 对映像作正弦平移；高幅/高频可能不舒适，需项目观看审查。范围外钳住首尾。
  reducedMotion 使用终态camera/focus、零drift，保留时间与身份，不等于无障碍验收。
- 输出深冻结，只接受本模块compile/sample产生的plan/state（不可JSON往返伪造）。
  adapter按 source-over 先画全部光盘，再画全部映像；继承caller alpha/clip，
  正常/抛错路径restore，不改current path。无背景、雾层、玻璃遮挡、纹理、音频。

反例：需要镜面倒置几何、灯被遮挡时自动消失、真实雨滴折射、HDR能量守恒或
自动合理城市布局时，不应使用此配方。层序与映像偏移是艺术输入，不能当物理解。

提炼来源是局部二维样片中的身份关联方法；局部曾获认可不能覆盖后续完整作品的否决。**新API未回填原样片**，
样片认可不等于此API或其他布局的艺术/生产迁移认可。仓库只含合成三灯示例，
不含项目灯位、原片媒体、音乐或生成图。当前目录保持 experimental，艺术及
生产迁移为 NOT_RUN。合成例源码可由 Native 渲染器输出；测试覆盖乱序/重复采样、
30000/1001时间、首尾、重复ID、重排、seed、focus解耦及Canvas像素状态恢复。
