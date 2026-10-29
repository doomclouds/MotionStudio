# 覆盖率形态学：扩边补缝，收边留空

**Experimental 候选。** 一个基础机制，包含同一有限矩形邻域上的dilate/erode。两个操作、不同半径和边界方式不分开计数；没有新增物理印刷、颜色或时间系统。

## 适用场景

印刷图案的相邻色版稍微错位会露出纸色缝，扩展其中一版覆盖可产生有限的重叠；也可收缩遮罩、扩大图形保护区。调用方决定哪些色版扩展、位置、颜色和合成方式。不是自动识别相邻色、自动trap方向或ICC/CMYK校准。

不同于卷积的加权平均，本操作取局部最大/最小，能够维持硬边，而不是把白缝仅仅模糊。它只修改显式单通道mask，不移动原图坐标或做位移重采样。

```js
import {morphologyCoverage} from '../lib/foundations/raster/morphology-coverage.mjs';
const expanded = morphologyCoverage({
  width:128, height:96, data:coverageBytes,
  operation:'dilate', radiusX:2, radiusY:1, boundary:'transparent'
});
// expanded.data 是新Uint8Array；调用方再把覆盖率用于墨版/遮罩。
```

## 严格合同

全部字段必填。data必须是当前realm原生Uint8Array或Uint8ClampedArray，长度恰为width×height，值是0..255单通道覆盖；不能传RGBA、普通数组或带自定义属性的view。

- width/height整数1..4096，像素总量≤4194304；radiusX/radiusY整数0..64。
- `dilate` 取闭邻域 `[x−radiusX,x+radiusX]×[y−radiusY,y+radiusY]` 最大值，`erode` 取最小值。
- `transparent` 的图外样本对两种操作都为0，故erosion会清掉接触边界的像素；`clamp` 重复最近边缘。
- 半径可大于图像尺寸，但仍受64上限约束。两个半径均0也返回独立拷贝，不共享输入buffer。
- 仅固定普通ArrayBuffer；SharedArrayBuffer、resizable/detached buffer、view子类、跨realm view与额外自身属性拒绝。内建metadata getter直接读取真实长度/buffer，不执行调用方伪造的length getter。
- 记录须为当前realm普通Object.prototype、确切自身data字段；accessor/未知字段/Symbol拒绝。Proxy及篡改内建对象不在安全合同内。

输入先复制。返回冻结的 `{width,height,data}`，但**新data的字节允许调用方修改**；不要把冻结外壳误认为typed array也深冻结。后续修改结果或输入均不会影响另一方或下一次求值。

## 算法、资源与边界

横向/纵向两次单调队列求极值，不是半径平方的逐邻域扫描。工作量O(WH+H·radiusX+W·radiusY)，临时字节数组O(WH)，队列O(max(W,H)+128)。严格own-key检查另分配O(WH)键元数据，其内存可能远大于图像字节本身。

一次同机4M像素、radius64有界探针峰值约501MiB；这是观察值，不是所有Node/机器的上限，也不是长期耐久或实时保证。优先tight ROI、缓存不变结果；大批次需实测驻留内存与事件循环回收，不擅自宣称低内存。无新增依赖或后台worker。

mask是离散字节，输出仍是邻域中某个输入/边界字节，不补亚像素采样、圆形结构元素、抗锯齿、gamma或线性光处理。若先把图像缩小再扩边，半径单位也随之改变；应在作品中明确实际像素坐标系。

## 验证与当前质量门

```sh
node --test engine/motion-elements/test/coverage-print.test.mjs
node --test engine/motion-elements/test/*.test.mjs
```

测试使用独立二维朴素max/min oracle、非均匀/透明/半覆盖/实心图、宽于图像的半径、零半径、扩张/收缩单调性、clamp补色对偶、矩形可分离、输入隔离、非法数据与buffer、合成白缝、Native新进程复现。原真实片的实际调用与缓存消费不由这些测试替代。

本项仍须绑定最终真实作品及新旧源码路径桥接；技术检查不等于用户艺术认可、常速观看、听审或通用迁移。与halftone组合时前者改变覆盖边界、后者把测得覆盖变成网点，两者职责独立；普通multiply/相机/纸张运动不另外计数。

原理/许可和实现来源见[print-coverage-reference-decisions.md](print-coverage-reference-decisions.md)。

## 公共集成补记

本项已纳入本地公共包候选的index/catalog，仍experimental。最终影片调用、公共路径桥接及明确未完成的视听/用户质量门见[公共集成证据](print-rig-integration.md)；上文“待桥接”描述的是集成前阶段，不表示运行时需要私人影片。发布状态以远端核验为准。
