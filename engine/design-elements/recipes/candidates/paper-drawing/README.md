# Paper drawing · 受限静态素材候选

`index.mjs` 提供原创程序纸面和**以笔尖为锚**的马克笔。没有第三方图片、字体或影片代码，不加入设计族 catalog，不增加正式族数量。它是白板组合的绘制工具，不是整片模板、笔刷物理模拟或自动美术导演。

## 先去重再选

- `families/material-surfaces` 的 `paper` 已有阅读面、内容槽和硬偏移阴影；继续用它做纸卡容器。本候选只补静态表面纤维/颗粒/点格，不复制容器布局。
- 路径增长、沿线取点属于 motion-elements 的 polyline-sections / polyline-trail；本候选不拥有时钟。传给 `drawMarker` 的位置应来自同一条可见墨迹的末点。
- 印刷密度、套色和纸色可读 spot-ink-print 候选；这里不是印刷材质或其 WebGL 替身。
- 所有工具仅产生矢量/程序材质，不获取网络素材、不安装字体、不创建离屏 Canvas。需要缓存纸面时由调用者显式建一次不可变快照并复用。

## 调用

```js
import {compilePaperSurface,drawPaperSurface,drawMarker} from './index.mjs';
const paper=compilePaperSurface({width:1280,height:720,seed:42,strength:.10});
drawPaperSurface(ctx,paper);
// contact须与路径末点同一坐标系；画完墨迹再画笔。
drawMarker(ctx,{x:320,y:240,angle:-.7,ink:'#245681',lift:0});
```

`compilePaperSurface` 必需 `width,height,seed`；尺寸为16..4096整数，seed为0..2³²−1整数。可选 `paper/fiber` 六位十六进制色、`fiberCount/grainCount` 各0..20000整数、`strength` 0..0.35、`dotSpacing` 为0（关闭）或8..256整数。默认分别为面积/900和面积/500的四舍五入并各封顶20000、浅米纸/棕纤维、strength=.12、无格点。固定哈希独立生成线纤维与颗粒，无随机流/时间依赖；生成后深冻结。compile是O(纤维+颗粒)，绘制再加面积/格距²的格点成本（最大尺寸和8px格距时262144格点）。不负责字块对比度或排版。

`drawPaperSurface(ctx,plan)` 在当前局部原点绘制且限制在计划矩形内，返回尺寸/消费数量。它继承调用者alpha、composite和transform，恢复Canvas状态，但当前path会被替换；不是事务式绘制，后端异常可能已留下部分像素。只有本模块实例编译的plan可用。计划不能JSON还原后直接使用，须保存原输入重编译。

`drawMarker` 必需有限 `x,y`（±1e6）。默认angle=-.7弧度、length=92、width=14、ink=#243a55、body=#fafafa、lift=0。angle限±2π、length24..300、width4..40且≤length/3、lift0..1。返回 `contact`（caller-local纸面坐标，尚未施加ctx父变换）、`visibleTip`（lift时在画面Y方向上移18×lift）及lift。它只是明确的平面图标，不是3D笔/真人手；角度围绕可见笔尖，阴影是偏移轮廓。零lift时尖端是输入点，笔身沿局部正X方向延伸。笔画间不得拿笔的飞行轨迹画墨迹。一个笔图标会挡字，短注释可用，长段正文应及时退场。

所有输入为普通或null-prototype自有数据字段记录，拒未知字段/getter，普通调用者/Canvas为信任边界，不是恶意Proxy安全沙箱。Native Canvas部分版本在restore后样式getter保留缓存值，故测试使用之后的真实绘色验证恢复；不以getter相等宣称像素状态，也不强行写回可能陈旧的getter值。

## 已执行的范围与运行

`examples/contract.mjs` 的折信封步骤图与三站路径是两种实际消费者，不是两个换色版本；没有文字、素材或生产迁移声明。测试验证纸纹存在/复现/边界裁剪、笔尖锚和抬升、两内容输出不同、绘后实际style/clip/transform/alpha恢复，以及错误输入。`examples/held-annotation.mjs`另将同帧held-jitter输出重编译为保角前缀，并把唯一末点交给marker；Native测试核组内/组间像素及零态。技术检查不证明自然纸材、用户审美、跨后端逐像素相同或整片观看。

```sh
export MOTIONSTUDIO_CANVAS_MODULE=/absolute/path/to/installed/@napi-rs/canvas
node --test engine/design-elements/recipes/candidates/paper-drawing/test/*.test.mjs
```

需要Node24和已有Native Canvas；未提供依赖时清楚失败，不自动安装。portable内把engine替为runtime。只含原创MIT代码，参见仓库LICENSE；外部字体、笔顺数据及后续绘制内容的许可单列。
