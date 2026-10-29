# 基础机制职责目录与旧路径兼容

目录整理不新增机制。当前为 **32基础＋6配方**（新增曲线/字格/尺寸换行机制另有真实作品证据；分类迁移本身仍不计数）；目录别名、辅助函数、适配器和重导出入口不计数。实验状态及每件作品原有的技术/用户反馈/视听检查状态不因迁移而升级。

## 当前已实施：field 单域

| 职责 | canonical 实现 | 保留的旧入口 |
|---|---|---|
| 解析方向场 `field.attractor-orientation` | `lib/foundations/field/attractor-field.mjs` | `lib/attractor-field.mjs` |

推荐新调用使用职责路径；原总入口 `lib/index.mjs` 与旧直接路径均继续可用。三个入口导出的函数是同一对象，内部只存在一份实现及一套计划品牌，不是复制三份代码。

```js
import {compileAttractorField, sampleAttractorField}
  from '../lib/foundations/field/attractor-field.mjs';

const plan = compileAttractorField({
  bounds: {x: 0, y: 0, width: 320, height: 180},
  columns: 16, rows: 9,
});
const state = sampleAttractorField(plan, {
  attractor: {x: 160, y: 90}, radial: 1, tangential: 0,
});
```

这仍是无历史、无速度的局部二维方向场，不是粒子积分/流体/光流。原参数、限制、奇点及冻结状态语义不变。旧入口创建的plan可由canonical入口采样，反之亦然。直接用不同query URL导入canonical实现会创建独立模块实例及独立品牌，不能混用其plan；这不是跨实例序列化格式。注意：给旧re-export入口URL添加query只重新加载入口，本身不会给其依赖的canonical URL加query，因此仍共享同一品牌。迁移前给旧实现URL加query曾可创建独立品牌；此刻意cache-busting用法不能继续被当作隔离契约。需要显式独立实例的调用者应使用不同canonical URL，普通旧路径导入无需修改。

## 新机制直接分类

| 职责 | canonical 实现 | 稳定 ID |
|---|---|---|
| 控制柄曲线距离寻址 | `lib/foundations/geometry/cubic-path.mjs` | `geometry.cubic-path` |
| 显式字格沿路径布局 | `lib/foundations/typography/glyph-run-path.mjs` | `composition.glyph-run-path` |
| 显式尺寸逐行换行 | `lib/foundations/layout/flow-wrap.mjs` | `composition.flow-wrap` |
| 凸平面刚性铰链 | `lib/foundations/geometry/hinged-panel.mjs` | `geometry.hinged-panel` |

此处四项均为新机制，没有需要兼容的旧平层路径；总入口显式re-export同一模块实例。
`typography`是物理职责目录，不另造query kind，也不把辅助采样算成第二条曲线机制。

## 分类原则与后续边界

- `lib/foundations/<职责>/` 存实际基础机制实现，而非按作品名、参考库名或颜色方向复制代码。已存在的field目录是第一域；尚未迁移的旧实现暂保持原路径，不声称已完成全库迁移。
- 后续职责可包括motion、layout、geometry、transition、fragment、raster、camera。只有真实实现时才创建目录；核心验证/时间/矩阵与配方分别归支持层和recipes，不混入基础数量。
- 目录职责不改稳定catalog ID或kind。例如未来layout/camera物理目录不自动改名既有`composition.*`。
- Canvas适配器与纯求值分开；`reveal.local-geometry`目前是绘图适配器，不为分类再复制一份纯lib实现。
- 旧入口只显式re-export canonical实现，不做第二份计算或输入转换。新代码不再添加平层基础实现。
- 本次不移动测试和已公开指南；现有测试发现路径与分享链接保持有效。今后移测试前须先验证递归发现，不能因漏测而获得假绿。

## 迁移验证与作品锁

此前field单域整理不改`lib/index.mjs`、任何其他求值模块、catalog内容或Tessel作品集锁定的13个共享源码文件。原作品冻结runtime/manifest不被覆盖。新公开版本的场实现路径及源码hash确实改变，不能沿用旧manifest声称字节同版。

技术门包括新旧函数identity、跨入口compile/sample、输入隔离、奇点、乱序求值、独立模块品牌拒绝，以及全库测试与完整portable。原有field/slice工程示例用于新旧状态/Native像素等价检查，不新增作品艺术认可，也不把该技术示例升级为高质量风格参考。对于将来迁移真正被作品锁直接绑定的模块，必须先建立锁与导入的兼容证据；不能直接改已批准作品源码以消除校验失败。
