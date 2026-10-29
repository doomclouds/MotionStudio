# 覆盖率网屏：让灰度成为可放大的点阵几何

**Experimental 候选。** 一个基础机制：显式单通道覆盖率格 → 方格裁切圆点。网角、尺寸、色彩不是新积木；它不自动读取图片、分色或模拟印刷机。

## 适用场景与可见效果

适合印刷海报、双色图案或素材的微观到整体镜头：点的面积携带明暗，而不是在画面上叠一张装饰噪点。调用方先在选定的网格空间测量覆盖率，再用同一几何绘制和放大。
与已发布的卷积不同，它不做邻域平均；与 matte 不同，它不把另一张图像当逐像素透明度。它也不承担 ink trapping：扩边/收边由独立的 morphologyCoverage 处理。

## 接口

```js
import {halftoneScreen} from '../lib/foundations/geometry/halftone-screen.mjs';
const screen = halftoneScreen({
  columns:3, rows:1, values:[0.15,0.6,0.96], cellSize:16,
  origin:{x:24,y:32}, angle:Math.PI/12
});
ctx.save();
try {
  ctx.transform(...screen.matrix);
  for (const cell of screen.cells) {
    ctx.save();
    try {
      ctx.beginPath(); ctx.rect(...cell.clip); ctx.clip();
      ctx.beginPath(); ctx.arc(...cell.center,cell.radius,0,2*Math.PI);
      ctx.fill();
    } finally { ctx.restore(); }
  }
} finally { ctx.restore(); }
```

全部字段必填。`values` 是 row-major 普通密集数组，长度恰为 columns×rows，每值为有限覆盖率0..1，不是RGB亮度，也不自带色彩管理。调用方需明确源mask采样位置和旋转网格之间的映射。

返回深冻结的 `{columns,rows,cellSize,matrix,cells}`。每格为 `{id,column,row,coverage,center:[x,y],clip:[x,y,w,h],radius}`。ID为`column:row`，同一网格的覆盖率/角度变化不会改变ID。
点/裁切框留在本地空间，矩阵采用Canvas `[a,b,c,d,e,f]`：先绕本地原点旋转，再平移到origin。没有DOM、时钟、上帧状态或隐藏缓存。

- columns/rows：整数1..1024，总格数≤65536。
- cellSize：0.001..10000；angle：−2π..2π弧度。
- origin.x/y：各±1e7；保守派生界 `max(abs(origin))+columns*cellSize+rows*cellSize≤3e7`。
- 普通记录必须是当前realm的Object.prototype，字段为自身data属性；null-prototype记录、accessor、额外字符串/Symbol字段、稀疏/派生/跨realm数组拒绝，不进行数字强制转换。
- 这不是恶意Proxy或被篡改JS内建对象的安全沙箱。

## 面积合同与数值限制

**必须同时画方格clip和圆。** 低覆盖时半径是面积反解；超过π/4时圆半径必须大于方格内切圆，裁去方格外圆弓后才能继续增加覆盖。单位方格的圆角点距离为1/√2，coverage=1返回该极限，coverage=0返回0。

高覆盖分支用解析圆/方格交集面积与54次二分反解。低覆盖先sqrt再除sqrt(π)，避免最小正subnormal先除π而归零。初版的这一真实缺陷已回归修复；不把修复前版本当最终证据。
IEEE运算、角函数和近满覆盖的敏感性仍存在，不承诺任意输入的精确实数结果或统一相对误差上界。独立高精度数值测试不是数学误差定理。

面积是**理想几何面积**，不是Canvas抗锯齿后的像素平均值。逐格 source-over 在旋转clip边缘可能产生视觉假缝；这是栅格化/合成问题，不宜通过改覆盖率或增大数学半径掩盖。
可在明确分辨率的独立coverage层超采样，并对理想互不重叠的单元覆盖做受限累加后下采样；这不适用于任意重叠图元或整张彩色墨版。满覆盖格在理想集合意义下可直接fillRect，**不保证与圆∩clip的抗锯齿字节相同**。实际输出仍须逐镜头检查。

最坏工作量O(格数×54)，输出O(格数)对象；尽量缓存不变的网屏结果与栅格化图层。局部变色、相机缩放和纸张移动可复用旧motion能力，不要每帧重复构造相同网格。

## 测试与复用

```sh
node --test engine/motion-elements/test/coverage-print.test.mjs
node --test engine/motion-elements/test/*.test.mjs
```

合成测试包含独立截面积分、端点和高覆盖、subnormal正半径、矩阵与ID、深冻结/源隔离、非法结构零getter执行、资源上限、Native逆序/重复/新进程。绘图示例是调用方显式save/restore，不代表此纯函数新增了Canvas adapter。
实际片的参数/调用/缓存消费、版本桥接和限定质量门待最终影片回执闭合后单独记录；当前指南不构成艺术、听审或跨场景生产验收。

官方原理/许可、原创与实现后核对的区别见[print-coverage-reference-decisions.md](print-coverage-reference-decisions.md)。内部严格数据helper不计第三个机制。

## 公共集成补记

本项已纳入本地公共包候选的index/catalog，仍experimental。最终影片调用、公共路径桥接及明确未完成的视听/用户质量门见[公共集成证据](print-rig-integration.md)；上文“待桥接”描述的是集成前阶段，不表示运行时需要私人影片。发布状态以远端核验为准。
