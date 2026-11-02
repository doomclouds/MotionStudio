# raster.palette-error-diffusion

Serpentine Floyd–Steinberg error diffusion onto an explicit RGB palette.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`paletteDiffuse`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/raster/palette-diffusion.mjs](../../lib/foundations/raster/palette-diffusion.mjs)。

## 参数、用途与边界

## 共同合同

纯 ES modules，无安装依赖。options 必须是普通对象且字段恰好匹配、不能有 accessor；数据向量接受稠密 Array / Float64Array / Uint8Array，逐元素校验有限数。不执行数组元素 getter。数组额外命名属性不影响数值语义。返回独立缓冲区，不修改输入；不携带隐式时钟、随机数或可变全局历史。代理对象不在可信输入承诺内（JavaScript descriptor反射本身会触发Proxy trap）。坐标均为二维栅格像素中心，数值非颜色管理工具，不导入音频。

## 2. `paletteDiffuse({width,height,rgb,palette})`

尺寸与距离变换相同。RGB长度3WH，输入[0,1]；palette含2…32个显式RGB三元组。返回 `indices:Uint8Array` 和仅由palette颜色组成的 `rgb:Float64Array`。每行蛇形扫描，欧氏RGB最近色（等距选最小索引），Floyd–Steinberg 7/16、3/16、5/16、1/16误差分配到尚未处理的邻居。边界外误差丢弃；**不夹紧中间误差**。复杂度O(WH×paletteLength)，空间O(WH)。

适用于限色海报、带状渐变转换、屏幕质感。不是halftone的圆∩格面积反解：此处从已知RGB和有限调色板出发，通过有方向的量化误差反馈实现空间补偿，不输出圆点几何。不是convolution的归一邻域线性聚合。调色板选择、sRGB转线性、alpha预合成属于调用者；本实现不做抖动噪声、不支持透明通道、不保证感知色差最小或全图均值精确守恒。逐帧重算可能出现爬点，切勿声称时间稳定性；需要稳定印刷定格时固定源图后只移动画稿。

```js
const q = paletteDiffuse({width:3,height:1,rgb:Array(9).fill(.5),palette:[[0,0,0],[1,1,1]]});
// indices: [0,1,0]
```

## 可执行输入

按 [注册示例](../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

```json
{
  "width": 2,
  "height": 1,
  "rgb": [
    0.4,
    0.2,
    0.6,
    0.9,
    0.5,
    0.7
  ],
  "palette": [
    [
      0,
      0,
      0
    ],
    [
      1,
      1,
      1
    ]
  ]
}
```

## 当前证据与来源边界

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[test/seven-foundations-raster.test.mjs](../../test/seven-foundations-raster.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../history/private-candidates/seven-foundations/raster-GUIDE.zh-CN.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。
