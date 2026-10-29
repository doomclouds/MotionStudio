# 基础机制职责目录与旧路径兼容

目录整理不新增机制。当前为 **39基础＋7配方**（新增曲线/字格/尺寸换行机制另有真实作品证据；分类迁移本身仍不计数）；目录别名、辅助函数、适配器和重导出入口不计数。实验状态及每件作品原有的技术/用户反馈/视听检查状态不因迁移而升级。

## 当前已实施：field、两连杆几何与sticky布局小域

| 职责 | canonical 实现 | 保留的旧入口 |
|---|---|---|
| 解析方向场 `field.attractor-orientation` | `lib/foundations/field/attractor-field.mjs` | `lib/attractor-field.mjs` |
| 解析两连杆 IK（原ID不变） | `lib/foundations/geometry/two-link-ik.mjs` | `lib/two-link-ik.mjs` |
| 纵向sticky区间（原ID不变） | `lib/foundations/layout/sticky-interval.mjs` | `lib/sticky-interval.mjs` |

推荐新调用使用职责路径；原总入口 `lib/index.mjs` 与旧直接路径均继续可用。三个入口导出的函数是同一对象，每项内部只存在一份实现，不是复制三份代码。field保留同一计划品牌；IK与sticky是无plan品牌的纯函数。

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
| 静态悬链线弧长寻址 | `lib/foundations/geometry/catenary.mjs` | `geometry.catenary` |
| 固定三角网格等值折线 | `lib/foundations/geometry/iso-contour.mjs` | `geometry.iso-contour` |
| 固定半开区间最少轨道 | `lib/foundations/layout/interval-lanes.mjs` | `composition.interval-lanes` |
| 同宽不等高最短列布局 | `lib/foundations/layout/masonry.mjs` | `composition.masonry` |
| 有限候选锚点标签 | `lib/foundations/layout/anchored-labels.mjs` | `composition.anchored-labels` |
| 非负归一邻域卷积 | `lib/foundations/raster/convolution.mjs` | `raster.neighborhood-convolution` |
| 四角单应图像映射 | `lib/foundations/raster/projective-raster.mjs` | `raster.projective-quad` |

此处十一项均为新机制，没有需要兼容的旧平层路径；总入口显式re-export同一模块实例。
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

显式分阶段交接位于 `lib/recipes/staged-layout-handoff.mjs`，只增加配方数量，不放入foundations职责目录或复算旧handoff为新基础。

`raster/`新域只放本批新模块；既有matte/displacement旧入口与冻结源码不移动、不复制。别名和点映射helper不增加基础数量。

## 两连杆几何迁移范围

这次仅将两连杆solver归入已有geometry职责目录；旧入口显式re-export，index保持原路径，
源码主体仅相对validate导入路径变化。0新增机制/作品，计数仍39基础＋7配方。
三入口函数===，同输入输出/异常合同不变。旧wrapper加query不再创建独立solver函数，
需独立函数对象时使用canonical query URL；详见[two-link-ik.md](two-link-ik.md)。

Tessel锁13文件与Favorite52锁55文件均与本次迁移文件零交集，锁定字节未改。
角色影片自己的冻结runtime/manifest不被改写；迁移版hash不同，不沿用历史同字节说法。
用户否定角色作品的视觉设计，REJECTED_NOT_STYLE_REFERENCE不变；纯状态迁移验证不升级其艺术状态。

## Sticky布局迁移范围

此次只把既有纵向sticky约束归入layout职责目录，旧入口/index继续导出同一函数，0新增。
数学主体仅相对validator路径变化，原API、IEEE阈值与验证行为保留。
wrapper query与canonical query的身份差异见[sticky-interval.md](sticky-interval.md)。
Tessel13及Favorite52的55锁定文件零交集；原演出列表影片源码、runtime、manifest和媒体不变。
迁移不是原片重制；用户有限认可、NOT_DONE常速、NOT_LISTENED听审、NOT_RUN通用迁移状态均不升级。
