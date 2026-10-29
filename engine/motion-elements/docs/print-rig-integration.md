# 印刷覆盖与二维柔性响应：公共集成证据

本批增加四个独立 experimental 基础，总 **43基础＋7配方（50项）**。不增加配方；角度、半径、边界、阻尼区间、骨数、采样helper与严格数据helper不另计数。目录分类不是新机制。

| ID | 公共职责路径 | 实际验证作品 |
|---|---|---|
| geometry.halftone-screen | lib/foundations/geometry/halftone-screen.mjs | AFTER RAIN，8.6秒、516帧 |
| raster.coverage-morphology | lib/foundations/raster/morphology-coverage.mjs | AFTER RAIN，8.6秒、516帧 |
| geometry.affine-skin | lib/foundations/geometry/affine-skin.mjs | ROOM FOR TWO，9.4秒、564帧 |
| motion.damped-response | lib/foundations/motion/damped-response.mjs | ROOM FOR TWO，9.4秒、564帧 |

## 真实调用与版本桥接

AFTER RAIN 在初始化时计算两套网屏与一套1920×1080、半径3的扩边结果，缓存为墨版，后续绘制消费这些图层；不是每帧重新求值。选定源mask缝隙检查成立，不声称所有抗锯齿像素的覆盖定理。公开模块仅改变helper相对导入，helper字节不变。分类路径候选完整516帧场景状态/usage与原片相同，36个代表原生PNG相同；不等于全部帧逐像素、重新编码或新听审。完整缓存场景桥接RSS观察值约4.238GB，不是单个基础机制资源上限。

ROOM FOR TWO 的3骨plan把56个叶片轮廓/叶脉点传入真实样条绘制，解析响应驱动每帧骨pose。公共桥接保留原scene/art；原192文件闭包中只替换两个桥接wrapper，新增3个canonical模块/helper，扩展闭包195文件。9个新Node进程代表帧与原PNG一致。不能称原始Native声明的指纹已经覆盖后来加入的canonical文件。

两片原始媒体与冻结源码保持不变；公共index是后续集成，不冒充影片原始导入方式。技术证据和sourceVersionRelation保存在catalog中，公开仓库不要求私人生产媒体才能执行示例及单元测试。

## 示例与严格输入

所有catalog例子均可执行。形态学的运行时要求原生字节view；JSON无法表达typed array，因此该条明确记录`exampleSetup.dataEncoding`。调用者使用：

```js
const input = {...entry.example, data: Uint8Array.from(entry.example.data)};
const result = morphologyCoverage(input);
```

这是显式示例物化，不是运行时允许普通数组，更不通过查询命令自动导入/执行代码。三个其他例子直接调用列出的api；蒙皮与阻尼plan再交各自sample函数。

## 仍然分开的质量门

- 数值、严格输入、不可变数据、跳帧/新进程及公共导出/示例测试属于工程证据。
- 独立编码帧检查是静态采样，不等于连续常速观看。常速 **NOT_DONE**；实际听审 **NOT_LISTENED**。
- 用户艺术反馈 **PENDING_USER**；不把测试、送达或内部判断写成优秀作品认可。
- affine skin可能折叠、坍缩、不保面积；合法极端坐标存在消减误差。解析响应极长无阻尼相位有约5e−5绝对误差观察，独立高精度oracle不是全域误差定理。
- 网屏是几何面积，不是校准印刷；形态学是离散矩形邻域，不自动选择trap或进行色彩管理。形态学4M像素严格验证可消耗显著内存，需按实际批次预算。

运行`node --test engine/motion-elements/test/*.test.mjs`。这些证据不改变52秒/Tessel保护、SIDE STREET否决状态或历史作品的反馈与视听门。
