# Data Rollup — 静态帧设计与沉淀

## 实看来源与许可
实际查看固定仓库 nexu-io/open-design commit `12d970eacc8971150e3c76470d2a9afe16dc2ed1` 中 `plugins/_official/video-templates/frame-data-rollup/preview.png` 完整 1440×810 图，并读 DataRollup.tsx / Root.tsx。清单身份见 source-lock.json。预览PNG与固定Git blob逐字节一致；四份本地文本比上游各多一个末尾LF，去掉恰好一个LF后全部匹配固定blob，差异已记录而非伪称原字节。未启动浏览器或执行源 Remotion，候选不是原截图贴底。
模板 manifest 声明 Apache-2.0，并标原作者 nexu-io/html-video；保留 OpenDesign 仓库 Apache-2.0 文本。GitHub 名称是原例标题，不代表合作、认证或真实账号指标。Inter 为 OFL；DejaVu Mono 按其独立版权通知使用，不把所有字体称为 Apache/OFL。

## 内容、品牌与结构
标题先说明主题；五根等宽橙柱通过共同零基线给出周内强弱；柱顶等宽数字提供准确读数；灰色星期标签退后一层。大面积近黑不是装饰空白，而是压低辅助元素，使颜色只服务数值。橙色同时绑定数字和对应柱，避免多色暗示不存在的分类。没有轴刻度，故直接标值不可省。
原文 Mon–Fri=1200/2400/1800/4200/3600 是 Root.tsx 的 SAMPLE，不是实时 GitHub 活动。指标具体含义、单位和日期均未提供，不能称真实 stars/commits。算术和=13200、最高/最低=3.5，只是样例关系。五柱均按 value/4200 等比例高度；不是累计量、增长率或概率。

## 独立实现
完整 1440×810 Native Canvas。背景 #0e0e10、柱 #ff5a2c、主字 #f5f5f2；源码百分比布局移植后在实际画布绘制。原预览可能由1920×1080缩放，round先后导致约半像素的柱顶/基线残差。原字体为平台系统栈，具体宿主字体未知；采用已持许可 Inter800/500 与 DejaVu Sans Mono Bold，并将主标题横压0.955对齐参考，不称准确恢复原字体。数字基线-3px、标签+2px为实看校准。无 imagegen，无3D，无照片资产。

## 可组合代码：一个本地静态柱图配方，0新公共族
`design/bars.mjs` 的 planBars/drawBars 为同一配方的几何与绘制两层。主画真实调用一次；重组用不同内容 Batch A/B/C=10/100/1000，分别显式 linear 与 log-offset，两次真实调用，不计成两个新产品。
现有通用数据图形领域已有柱图思想，本例不重复注册公共族；沉淀重点是**比例尺语义必须显式**和**绘前校验**。源码极差≥50会自动切 log，并让最小正值25%高；本例不触发该分支。本地配方拒绝 auto，调用者必须显式选择 log-offset 并标注，这种高度不能解释为值的倍数。重组只是技术语义对照，不是新审美完整作品。
支持1–12项，非负安全整数，画布480–4096×320–4096，六位hex色。拒稀疏/无效项、负值、小数、不有限或精度不安全值；测完全部数字/标签 advance width 后再绘制，越槽拒绝并恢复明确文本状态。零值显示零高，与源2px最小高度规则有意不同；主样例全正值不受影响。
使用调用者提供的可信 Native Path2D，不清 current path；测试包含路径哨兵。只恢复声明样式/变换范围，不隔离已有clip/shadow/filter/alpha或病态变换，也不把任意恶意上下文/Path2D构造器失败称作事务安全。字体必须先注册，advance width不保证字形外伸/描边净距。图形输出不证明统计意义、实际业务结果、动画可读性或可访问性达标。

## 自检与差异
完整原/候选、叠图、差分及技术重组均生成。原数据关系、全幅尺寸、重复帧SHA、非法输入绘前零像素变化与路径保留均有可运行测试。保留平台替代字体、微小字距/笔画、圆角抗锯齿及基线半像素残差。此轮只交完整静态 settled 样例：没有弹簧过渡、数字滚动、错峰时序、响应式、视频输出或音频验证，不能称已完成原15秒动画。


## Engineering candidate boundary (2026-10-31)
Owner static retention approved by the latest explicit batch instruction; unified submission not yet performed. One case-local recipe, zero registered public families; no generic family dependency is claimed. All resources/output are external. No raw preview, private report or source fonts are in this overlay.
Labels are bounded ASCII single-line text (letters, digits, spaces, .,%+()/_-). LTR word/letter spacing is normalized and restored. Existing clip/shadow/filter/alpha remain caller-controlled and are not claimed isolated. Invalid basic inputs and measured overflow reject before paint; hostile context accessors/Path2D constructors are outside the contract.
