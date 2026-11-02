# recipe.unit-pictogram.v1 · 同尺寸单位图符

代码：[unit-pictogram.mjs](../recipes/unit-pictogram.mjs)。来源：B09 `vinyl-isotype-study`，原案例的 `unit-audit.mjs` 仅审计半枚与总量，本配方另实现可参数组合的绘制。原 scene 未迁移本配方。与 B07 unit-stack（特定票张审计）、semantic-data（圆面积映射）、geometric-marks（形状与品牌标签关系）不同；**不增加通用家族**。

## 使用逻辑
先定义同一计量单位，再定义一个符号代表多少；所有行的符号大小恒定，数量靠重复表达。整数枚＋末枚左半裁切，绝不把半枚缩小成一个小符号。行末显示真实数值，图顶明确一枚/半枚单位。零类留标签与0，不隐藏、不补装饰图符。适用于少数类别、适中数量、愿意花时间数图符的科普/视频信息帧。

## API 与边界
`draw(ctx,props)`、`validate(props)`。props包括bounds、unit、unitValue、symbol、iconSize、data、theme。完整示例见[briefs](../examples/briefs.mjs)。
- bounds宽600–1600、高240–1200，实际标签/全行/总量仍预检。
- unitValue为1–1,000,000正安全整数；每value为0–1,000,000,000整数。用整数底层单位（如分钟），不猜小数容差。`2*value % unitValue === 0`确保恰为全/半枚，非半单位拒绝；所有值总和必须正且安全。
- 1–8类，标签唯一、单行、有色值；所有色值须#RRGGBB。fontFamily由调用者提供已注册字体。
- symbol仅`disc`（中心孔圆片）或`ticket`（左右对称缺口票形），不是任意SVG/照片/行业图标库。只借用对称形状使左半确为半符号，不宣称用户一定理解图形语义。
- iconSize为20–40整数，同组相同；固定7px间距，超过槽容量/30枚上限拒绝，不自动缩小图符。图例17px、值20px、行高66px，有限静态布局。
- 返回total/unitValue、每行units及每枚x/y/size/fraction；同一数据驱动图符、数值和总量。

全部测量在绘制前完成。实际glyph bbox/advance和保留区域校验，失败不改目标像素。内部固定alpha1/source-over、无阴影/滤镜/虚线；恢复调用者样式、transform与clip（既有clip仍生效）。拥有bounds内背景。

## 不适用
连续测量的小数精度、负值、过多类别、数量差距巨大、异单位合计、会计对账或以图形大小暗示数量。不把虚构借阅或票证计划当销售/实际到场人数；一张邀请券不等于一个人真实出席。

`verify.mjs`含两内容组合、精确全/半/零像素、状态恢复、数量/容量/标签拒绝与同步总量检查；图符案例不计新族，静态验证不等于Motion或用户审美认可。
