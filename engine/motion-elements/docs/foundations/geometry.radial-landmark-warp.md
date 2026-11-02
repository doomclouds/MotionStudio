# geometry.radial-landmark-warp

Gaussian radial basis landmark displacement with residual-checked solve.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`compileRadialWarp`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/geometry/radial-landmark-warp.mjs](../../lib/foundations/geometry/radial-landmark-warp.mjs)。

## 参数、用途与边界

## 通用合同

所有记录必须为普通对象、准确字段集合、数据属性，拒绝未知字段、symbol和getter；代理对象不属于支持输入。数组必须为稠密数据数组；不读取索引getter。点为 `{x,y}`，每轴有限且在[-10000,10000]；矩形 `{x,y,width,height}`，宽高[0.0001,10000]。不修改输入，不缓存调用者数组。浮点运算不是鲁棒精确计算几何内核。外部ID由输入顺序对应，算法不生成业务身份。验证器、矩阵求解、插值strength与示例时钟全部支持层，不另计基础。

### 4. `compileRadialWarp({source,target,radius}) → {sample(points,strength=1)}`

1–32对地标，radius[0.0001,10000]；高斯径向基函数插值**位移**，全局求系数。高斯消元带部分主元，主元小于1e-9、系数绝对值大于1e8或重建任一地标任一轴误差超过1e-7即拒绝。这个残差只保证地标，不保证任意点条件数/全域误差。每次0–8192点、strength[0,1]，返回新点数组；0为精确原样，1为完整变形。compile O(N³)，sample O(PN)。支持多次任意顺序求值，输入地标被复制。

应用：海报局部拉动、2D布面纹理、示意图校正。区别affine-skin：无骨架、权重或逆绑定，权重来自控制点之间的距离核与插值约束；区别projective-quad的全局单应，以及polygon-morph的逐点对应内插。本项给未显式对应的内部点提供空间延拓；样片将规则网格一起形变。

反例：不是弹性力学、不保长度/面积/方向、不保证无折叠；同源点、很宽核造成病态会拒绝。离控制点远时变形衰减到身份，不是全域刚体平移。目标可导致局部翻转，调用者需限制视觉输入。

## 可执行输入

按 [注册示例](../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

```json
{
  "source": [
    {
      "x": 0,
      "y": 0
    }
  ],
  "target": [
    {
      "x": 1,
      "y": 2
    }
  ],
  "radius": 3
}
```

## 当前证据与来源边界

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[test/seven-foundations-geometry.test.mjs](../../test/seven-foundations-geometry.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../history/private-candidates/seven-foundations/geometry-GUIDE.zh-CN.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。
