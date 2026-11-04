# displacement-map（experimental）

<!-- asset-self-description: raster.displacement-map -->

## 当前资产入口

本页是`raster.displacement-map`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/displacement-map.test.mjs)补充独立断言，原混合测试继续保留。旧combined实现不留wrapper；共享guidance和混合测试保留原职责。

本次提取原函数主体，布局校验与快照存储分别单份共享，不复制算法或WeakMap。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


## displacement：显式逆取样，不是真实折射

`sampleRasterDisplacement({source,map,scaleX,scaleY,edge,filter})`要求source/map等尺寸；
scaleX/Y为有限数−4096..4096（像素），edge必须为clamp或transparent，filter必须为nearest或bilinear。

输出像素(x,y)读取源坐标
`x+(map.R−128)/128*scaleX*(map.A/255)`、
`y+(map.G−128)/128*scaleY*(map.A/255)`。
R/G=128精确中性，通道范围对应−1..127/128，B忽略；透明map或零scale保持原字节。
这是输出向源的反向查找，正offset不等于画面向正方向平移。
map的8位量化与采样滤波是独立限制；bilinear不会把量化map变成无限精度连续场。

- nearest对**IEEE运算得到的坐标**使用`floor(coordinate+.5)`，负半值也按此规则。
  数学上恰为半像素的输入可能在浮点求值后落在阈值另一侧，选中相邻整像素；通道差可达255，
  不是1LSB误差保证。例：R2、A187、scaleX−160从x0计算出115.49999999999999，取像素115；
  精确有理数为115.5、应取116。合同不做exact-rational tie修正或任意epsilon补偿。
- bilinear按相邻四tap的覆盖权重插值**预乘alpha的RGB**，再解预乘；避免透明像素的隐藏颜色污染边缘。
  精确整数坐标直接保留源字节（包括hidden RGB）；真正分数插值且结果byte alpha为0时RGB置0。
- clamp先钳住有效像素中心范围；transparent把越界tap视为透明黑，因此分数边缘可部分覆盖，
  不在坐标一越界就整像素硬切。nearest越界采样为透明黑。
- bilinear也使用IEEE浮点和8bit输出量化；已测半byte边界与精确有理数oracle有1LSB差，
  这不是所有输入的误差上界，更不适用于nearest的整像素选择。
  特别是数学alpha=.5与浮点alpha=.4999999999999999会分别量化为1/0；后者按合同清RGB为0，
  因此RGB也可差255（预乘后的可见贡献仍很小），不能说bilinear每通道最多差1LSB；
  不承诺精确rational取样、跨后端/平台逐字节一致或Pixi shader等价。不能靠加epsilon统一篡改round掩盖差异。

滤波不负责给map生成流体、弹性、物理透镜或真正3D。不做forward splatting、洞修复、自动padding、
地图缩放/旋转、色差或光学能量守恒。旧slice-displacement按条带整体错位，本机制每像素二维查找，
两者去重依据是取样合同，不是视觉方向变化。


## 快照输入与共享支持

source/mask或map可为本runtime快照，或{width,height,pixels}原始RGBA。width/height为1..4096整数，最多2,097,152像素；pixels是同realm Uint8ClampedArray或严格0..255整数JSON数组，长度恰为width×height×4。输入复制，拒绝SharedArrayBuffer；返回只暴露冻结width/height，字节在单一共享WeakMap。copyRasterPixels返回可改副本，不是内存别名；跨runtime或JSON克隆快照须复制原像素后重新创建。

创建/复制、预算及Canvas绘制的完整合同与原作品证据见[共享栅格说明](../../../../docs/raster-effects.md)。本次共置不改变原冻结影片或有限接受范围。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/raster/displacement-map/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/raster/displacement-map/test/*.test.mjs
```

保留共享validate/matrix及既有time/timeline依赖；layout-input与raster-snapshot各只有单份内部支持，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

布局输出深冻数据且没有品牌计划。栅格快照使用共享WeakMap品牌，copyRasterPixels是可变隔离副本；不能把JSON快照冒充真实对象，传输需复制像素后重新创建。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
