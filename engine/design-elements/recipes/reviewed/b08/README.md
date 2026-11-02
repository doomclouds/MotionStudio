# B08：句法与份额的受限组合配方

这不是新家族注册。正式 UI 家族仍 **14**，本包增加 **2 个已通过有限技术审查的配方**；从已认可作品提取规律，新组合已过独立技术审阅，但未获用户审美认可。禁止把作品数、内部函数数和家族数混计。

- `recipe.manifesto-stack.v1`：显式句法行、同一墨色、字形边界预检。不是自动断行/自动版式。
- `recipe.partition-donut.v1`：同一整体的完整角度份额与全部外图例。不是独立目标进度、账户核算或统计推断。
- [五案例覆盖决定](docs/CASE-COVERAGE.md)
- [宣言指导](docs/manifesto-stack.md)
- [份额指导](docs/partition-donut.md)

## 原作品与新配方
原剧场 scene 真实调用 case-local `drawManifestoStack`；原金融 scene 真实调用 `auditPartition`。**这两个新配方并未反向迁移到原 scene**。源来源、数学问题与使用边界保留，不以新示例假装所有旧作品已经使用新接口。

## 运行
Node，`MOTION_ENGINE_ROOT` 指向安装了 `@napi-rs/canvas` **0.1.100** 的 Motion Studio native engine。
设置 `B08_DISPLAY_FONT` 为 Anton-Regular.ttf、`B08_BODY_FONT` 为 DejaVuSans.ttf，均须包外绝对路径。具体文件SHA、官方来源与许可见 `font-lock.json`，渲染前失败关闭验证；不静默替换字体。没有字体二进制随本包分发，不从网络自动下载。

```
B08_EVIDENCE_DIR=/absolute/new-empty-directory node verify.mjs
python build-report.py /absolute/new-empty-directory
```
环境变量需一并提供。验证输出必须包外新/空目录，检查真实祖先避免symlink写回源树；不会覆盖既有证据。独立模块测试入口见各设计卡。

## 组合与适用边界
两组合为修理工作坊与夜间文化节的**虚构计划**。同一数据驱动总量、圆环和全部图例，不假称真实活动；一组保留零值类，一组不同条目数与左右互换。仅固定1200×750：两个500px区域须在48px安全边距内，彼此至少40px间隔；越界/相交绘前拒绝，不做自动避碰。非响应式、自动跨字体系或Motion验证。它们是教学/技术表达验证，不宣称成熟品牌或创意突破。

源码、设计卡、明确数据和测试可以保留；图片与报告外置，仅供审阅。独立复跑通过组合13、宣言23、运行门7项及份额像素/拒绝专项；已修复独审发现的图表越界与覆盖宣言问题。B08来源已锁定正式commit `c9a57ca0228ab21dd84b700fbd505c6d24f7c4d1`，路径与SHA见 `source-provenance.json`；4项同候选，书衣scene因外置字体/锁调整不同，保留两SHA不假称相同。获得用户认可后再决定是否晋级通用资产；目前不修改14族注册表。
