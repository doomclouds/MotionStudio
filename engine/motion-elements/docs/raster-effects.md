# 图文像素机制：覆盖合成与二维位移图

**两项experimental基础机制，无新增配方。** 本批接入后目录25基础＋6配方（31项），不等于完成100基础目标。
本批先服务真实镜头：最终尺寸字形覆盖中显示双色纹理，局部压力场使纹理发生非刚性偏移，字边仍清晰。
仅两项：覆盖合成matte、二维位移图逆取样；alpha/luma、正负方向、nearest/bilinear不是新条目。
快照、像素复制、Canvas适配为配套helper，不算基础机制；不带入旧草稿其余六种滤镜。

## 最小接口

```js
import {createRasterSnapshot, copyRasterPixels, sampleRasterMatte,
  sampleRasterDisplacement} from '../lib/raster-effects.mjs';
import {drawRasterSnapshot} from '../adapters/raster-effects.mjs';
const source = createRasterSnapshot({width, height, pixels: imageData.data});
const map = createRasterSnapshot({width, height, pixels: displacementImageData.data});
const mask = createRasterSnapshot({width, height, pixels: glyphImageData.data});
const texture = sampleRasterDisplacement({source, map, scaleX:12, scaleY:8,
  edge:'clamp', filter:'bilinear'});
const result = sampleRasterMatte({source:texture, mask, mode:'alpha', invert:false});
drawRasterSnapshot(ctx, result, {x, y, width, height, smoothing:false},
  {createCanvas:canvasApi.createCanvas});
const detachedBytes = copyRasterPixels(result); // 可修改的副本，不是内部缓冲
```

示意变量由调用方提供，不是完整影片源码。直接API均不读取时间、不递增状态；
调用方使用绝对项目帧/时间生成当前参数和图像，不通过前一帧累积结果模拟seek。
像素算子不接收range/reducedMotion，也不自动缩短片长；减少动态时调用方可将位移scale置0、
选择静态coverage并保留原作品时段。影片是否舒适需另行观看，不能由此宣称无障碍通过。

## 快照与资源预算

- `createRasterSnapshot({width,height,pixels})`严格要求外层三个字段，width/height为1..4096整数，
  总像素最多2,097,152。可容纳1920×1080，但不是任意大图、自动缩图或低分辨率替代。
- pixels为长度恰好width×height×4的本realm `Uint8ClampedArray`或JSON Array。
  JSON Array每值须为0..255整数，拒绝洞、附加字段、Symbol。
  原始typedarray按内部长度和缓冲品牌读取字节；附加属性不是像素数据，会忽略，不调用其iterator/constructor。
  支持view偏移；拒绝SharedArrayBuffer（包括跨realm来源），不让其他worker竞态写入影响复制。
- 首次输入复制字节。返回仅暴露冻结`{width,height}`的opaque对象，像素存在私有WeakMap。
  同模块快照再次输入不重复复制；`copyRasterPixels`每次返回新Uint8ClampedArray，修改它不影响快照。
  没有公开可写typedarray伪装成不可变；创建与读取helper不独立计数。
- 快照不支持JSON往返、跨模块实例共享品牌或结构克隆后冒充已编译结果。
  需要运输时显式复制像素、传宽高，在目的runtime重新创建。不得把两份runtime快照/adapter混用。
- 预算内仍需考虑同时活跃图层和峰值内存。HD生产应首选typedarray和紧致ROI；
  JSON数组的严格属性验证比typedarray字节复制昂贵。没有自动cache、池或多进程共享。
  Native画布的原生内存回收不一定随每帧JS结束而立即触发，长期循环需实际量测RSS，不能只看单帧预算。

## matte：覆盖图不是几何clip

`sampleRasterMatte({source,mask,mode,invert})`要求source/mask尺寸相同，不自动缩放、对齐或推断密度。
可以传同模块快照或显式原始RGBA输入。

alpha模式coverage=mask.alpha/255；luma模式再乘
`(.2126R+.7152G+.0722B)/255`。invert在完整coverage后做`1−coverage`。
输出alpha为source.alpha×coverage，再钳位并四舍五入至byte；RGB沿用source（包括不可见RGB）。
输入不被修改，没有累计destination-in状态。

luma是在**encoded-sRGB字节域**的加权亮度近似，不是线性光、HDR、色彩管理或光学亮度。
一张半透明黑/白/灰mask都要同时考虑alpha；不能只拿RGB忽略透明度。
与旧矩形/圆/多边形clip不同，本机制接受逐像素连续覆盖；但文字排版、描边和遮罩生成仍是调用方工作。

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

## Canvas输出与状态

`drawRasterSnapshot`须注入同步`createCanvas(w,h)`，返回单独、尺寸一致的画布和context。
当前仅支持带可读`constructor.name`的常规函数对象；移除函数原型的特殊factory不支持并会抛错，
需要时用普通箭头函数包装，不承诺任意JavaScript callable都可作backend。
placement严格包含x/y（±1e6）、width/height（.001..1e6）与boolean smoothing；没有隐式父变换。
调用方可以在单个scene局部按固定尺寸复用独立scratch；每次完整putImageData覆盖且同步消费，
不要求每次重新分配。池应有明确大小上限及close释放，不返回目标canvas，不跨异步调用或项目无界共享。
必要的显式GC/分段进程属于制作方资源管理，不新增机制或改变像素合同。
本次Native长循环需要事件循环yield→GC→yield才能及时回收原生临时对象；仅GC的对照仍有RSS增长。
这是Canvas0.1.100在本场景的实测，不是通用Canvas保证，也不应在核心像素API里偷偷开启全局GC。
当前transform、clip、globalAlpha和composite按Canvas正常作用，函数finally恢复自设的smoothing及drawing state，
不创建/覆盖caller current path。callback/backend自身的外部副作用不是适配器的隔离保证。
Canvas的预乘/解预乘及缩放抗锯齿可能改低alpha字节；不可见RGB不保证经过绘制后保留。
不绘背景、不读取网络/媒体、不注册全局字体、不播放声音。

## 工程复现

在仓库根目录执行（Node24+，Native测试使用已安装的Canvas后端；不自动安装）：

```sh
node --test engine/motion-elements/test/raster-effects.test.mjs
node --test engine/motion-elements/test/*.test.mjs
node engine/motion-elements/scripts/query-catalog.mjs list --kind raster
python3 scripts/test-skill-package.py
```

最小完整的纯像素例，不需要字体、媒体或Canvas：

```js
import {sampleRasterDisplacement, sampleRasterMatte, copyRasterPixels}
  from './engine/motion-elements/lib/index.mjs';
const source={width:2,height:1,pixels:[240,20,10,255,10,80,160,128]};
const map={width:2,height:1,pixels:[160,128,0,255,128,128,0,255]};
const mask={width:2,height:1,pixels:[255,255,255,128,255,255,255,255]};
const shifted=sampleRasterDisplacement({source,map,scaleX:1,scaleY:0,edge:'clamp',filter:'bilinear'});
const covered=sampleRasterMatte({source:shifted,mask,mode:'alpha',invert:false});
console.log([...copyRasterPixels(covered)]);
```

工程测试覆盖strict参数/尺寸/预算、复制与伪造品牌、SAB与跨realm拒绝、alpha/luma、
双线性透明边、正负/中性/半值、独立像素oracle、乱序输入和新进程、Native真实像素及状态异常恢复。
19个raster测试组包括调用方复用独立scratch，不能由此声称所有后端或无限长循环资源安全。
可携包测试执行同一源码测试与离线目录查询；旧gallery视频回归不冒称重制本批私有影片。

## 实际作品、调用边界与验证状态

本批已有12秒、1920×1080、60fps、720帧有声原创图文候选，视觉用途是
红线进入纹理字标，局部压力场使字内条纹与同源红线弯曲，最后回到清晰静态字标。
不是滤镜菜单或颜色变体展板。实际影片与指导、源码冻结清单、输出SHA-256、
调用/绘制计数及复现命令留在私有交付，不把项目素材、字体、声音或私人路径写进公开包。

| 分类 | 真实调用和可见消费（输出帧，含首尾） | 不扩大为 |
|---|---|---|
| 新 `raster.matte` | f96–538，499次求值/绘制；其中f370–425有56次额外同源红线外溢覆盖 | luma或invert的影片验证 |
| 新 `raster.displacement-map` | f324–455，188次求值：132个纹理结果＋56个红线结果均绘制；紧致ROI、正scale、bilinear/clamp，map alpha=255 | nearest、transparent边缘、负scale、alpha门控或其他地图的影片验证 |
| 旧 `motion.transform` | f96–227调用，f144–227发生镜头缩放 | 新相机机制 |
| 旧 `motion.opacity` | f0–110与f184–538用于短标题淡入 | 新文字配方 |
| helper/项目创作 | 快照、复制、adapter、字形绘制、压力图生成、音频与时间编排 | 额外基础机制或配方 |

计数是实际执行与绘制标记；参数由冻结scene源码交叉核对，**不是每次调用的完整参数快照**。
算子、adapter和公共index与影片冻结字节一致；目录/离线query新增raster分类及指导是影片后的接入。
原影片manifest不改写，不声称整包字节都相同或元数据接入版已全长重渲。

全片解码、代表帧乱序/重复/新renderer重建与实际调用已检查；独立解码帧审查另行绑定同一影片hash。
这些不等于常速连续观看或实际听审：分别仍为NOT_DONE、NOT_LISTENED。
用户对本交付有限接受，视觉设计不作风格范例（LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT）；
原冻结影片及独评的PENDING状态保留，后续反馈由单独私有回执绑定，不篡改历史清单；
通用生产迁移为NOT_RUN，保持experimental，不默认推荐为优秀设计或风格锚点。
制作途中首次整片中断，单独池化＋GC的对照仍有RSS增长；有界局部scratch池与yield→GC→yield后完成720帧。
144连续帧窗口在warmup后RSS约449–500MiB；这只证明指定版本和该窗口，既不是长期耐久也不是实时性能保证。
失败尝试、成功窗口与最终输出分别保留，不能用单次完成抹去资源限制。

完整私有作品复现先核冻结源码/字体/音频身份，再运行其原创音频、场景QA与带`--expose-gc`的renderer，
最后probe/full-decode及比对实际trace。公共最小输入只复现算子合同，不冒称无需私有项目即可重制原片。
