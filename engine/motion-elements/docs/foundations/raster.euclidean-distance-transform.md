# raster.euclidean-distance-transform

Exact squared Euclidean distance to the nearest foreground pixel.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`distanceTransform`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/raster/distance-transform.mjs](../../lib/foundations/raster/distance-transform.mjs)。

## 参数、用途与边界

## 共同合同

纯 ES modules，无安装依赖。options 必须是普通对象且字段恰好匹配、不能有 accessor；数据向量接受稠密 Array / Float64Array / Uint8Array，逐元素校验有限数。不执行数组元素 getter。数组额外命名属性不影响数值语义。返回独立缓冲区，不修改输入；不携带隐式时钟、随机数或可变全局历史。代理对象不在可信输入承诺内（JavaScript descriptor反射本身会触发Proxy trap）。坐标均为二维栅格像素中心，数值非颜色管理工具，不导入音频。

## 1. `distanceTransform({width,height,mask})`

`mask` 为长度 width×height 的严格0/1值；返回 `{width,height,squaredDistances: Float64Array}`。每像素返回到最近1像素中心的 **平方** 欧氏距离，无种子则全部 Infinity（有意的空集距离，不能直接作为可见alpha）。尺寸各1…1024且总像素≤262144。两遍抛物线下包络，O(WH)，临时空间O(WH+max(W,H))；有限距离是该域内可精确表示的整数。

用法：对位图文字内外分别求距离，把 `sqrt(outside)-sqrt(inside)` 组合为采样中心有符号距离；可做轮廓光带、空间等距标记、由遮罩推出可调轮廓。**连续真实字形边界距离、亚像素抗锯齿、矢量距离不是保证**。距离阈值效果与morphology外观可能相近，但其输出完整度量场，而已有morphology输出矩形邻域max/min后的覆盖；这里不是把半径模式拆成计数。已有iso-contour可消费场，等值线提取仍归旧积木。

```js
const d = distanceTransform({width:3,height:3,mask:[0,0,0,0,1,0,0,0,0]});
// squaredDistances: [2,1,2,1,0,1,2,1,2]
```

## 可执行输入

按 [注册示例](../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

```json
{
  "width": 3,
  "height": 1,
  "mask": [
    1,
    0,
    1
  ]
}
```

## 当前证据与来源边界

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[test/seven-foundations-raster.test.mjs](../../test/seven-foundations-raster.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../history/private-candidates/seven-foundations/raster-GUIDE.zh-CN.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。
