# design.geometric-marks.v1 · 几何标识语法

来源：`song-bauhaus-candidates/bauhaus/design/scene.mjs` 的网格、有限颜色、圆/方/三角/条纹关系。资产单位是“有共享网格/大小/色彩角色/标签的符号组”，不是把circle、rect等六个内部绘制函数算六块。

每个items元素含稳定id、label、motif(circle/semicircle/triangle/square/stripes/quarter-disc)、0/90/180/270度rotation与background/foreground/accent。columns决定1–6列，gap0–40，最多12符号；每格最小100×120，形状归一到可用区域，不随文案漂移。输出tile bounds与中心anchor，适合以后绑定转场，不含动画时钟。

标签建立语义，不声称任意圆形天然代表观察/水/音量。固定小accent点与有限原语形成同一家族感；调用者负责不同符号可区分、色彩对比和上下文。不是品牌商标生成器，不复制包豪斯标志，不替代经过测试的公共导向/安全图标。任意SVG pictogram路径仍是另一配方，不混为此族。

两内容组合：茶事三阶段（一行三项）与街巷笔记四个索引（二行两列），改变语义映射、格数、形状、旋转和色彩；配合竖排文本与横排说明。示例只为可组合性证据，不宣称新品牌审美已经获批。

稳定来源作品：`portfolio/works/bauhaus-theatre-study`。本地提取快照：`song-bauhaus-candidates/bauhaus`。这里是设计关系提取；原作品scene未改为调用本模块，真实新调用见`examples/b05-compositions.mjs`。
