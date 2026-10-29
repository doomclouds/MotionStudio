# 四项2D基础候选：合同与使用指南

> Historical pre-registration snapshot. Private/unregistered counts, old publication blocks and proposals below describe that earlier stage, not current status. Current catalog: 60 foundations + 7 recipes; expansion paused. See [current registration and runtime boundaries](../../registered-foundations.md).


状态：独立私有候选，不是正式目录新增。实现入口 `foundations.mjs`，运行 `node --test foundations.test.mjs`。无外部依赖。调用者负责时间与绘制；四项算法本身不碰Canvas或旧库。

## 通用合同

所有记录必须为普通对象、准确字段集合、数据属性，拒绝未知字段、symbol和getter；代理对象不属于支持输入。数组必须为稠密数据数组；不读取索引getter。点为 `{x,y}`，每轴有限且在[-10000,10000]；矩形 `{x,y,width,height}`，宽高[0.0001,10000]。不修改输入，不缓存调用者数组。浮点运算不是鲁棒精确计算几何内核。外部ID由输入顺序对应，算法不生成业务身份。验证器、矩阵求解、插值strength与示例时钟全部支持层，不另计基础。

### 1. `voronoiCells({sites,bounds})`

1–64个点，两点距离至少1e-6；返回各站点在矩形内的最近站点凸多边形 `{index,site,vertices}`。域外站点合法，空胞返回空顶点；共享边界可属于双方，但面积重叠仅在数值误差内。算法对每站点以垂直平分线逐次裁剪，确定性O(N³)最坏工作量，N≤64。

应用：城市服务范围、粒状材质分区、动态图形的空间归属；站点移动时重新求快照。不同于已有weighted-hierarchy：后者按树权重切面积，本项按欧氏最近关系切平面；也不同poisson-disc（放置点）或iso-contour（标量等值线）。半平面裁剪只作内部支持，不另算一项。

反例：非加权Voronoi，不是Lloyd松弛、Delaunay、破碎物理、无限域、任意多边形/孔洞域。不承诺站点连续移动时拓扑不变，极近点与远小域需要注意误差；不允许把胞数当基础数。

### 2. `minimumCostAssignment(costs)`

1–128方阵、成本[0,1e9]，返回 `{columns,totalCost}`；`columns[i]`为第i源匹配的唯一目标列。Hungarian算法O(N³)时间、O(N²)输入副本；支持浮点非负成本，相同输入固定tie策略，但不承诺所有等价最优解中字典序最小。没有遗漏/新增对象，不能传Infinity表示禁边。

应用：同数量对象从散落状态到目标位置、角色排位、物件搬运；调用者可把路线长度/颜色差/业务成本作为矩阵。区别layout-handoff：后者要求ID已对应，本项解未确定的一一对应；不同grid-transport的栅格场输运。匹配不等于轨迹，不保证运动途中无相撞。

### 3. `routeRectangles({start,end,obstacles,clearance=0})`

0–24轴对齐障碍矩形；clearance[0,1000]对四边等量膨胀。膨胀后矩形内部不能重叠（触边合法）；起终点不能落内部。通过起终点与矩形角构成可见图，Dijkstra求最短欧氏折线。返回 `{reachable,vertices,length}`；无法到达则空数组/null。相同起终点长度0。边界可走，clearance是L∞矩形膨胀，不是圆角欧氏距离偏置。无外部世界边界，路线可绕到场景外。最多98节点、测试每边24障碍，O(V²R)。

应用：地图导览、图解连线、有限障碍的配送路径。区别cubic-path/折线路径：它们沿已写路径寻址，本项解障碍约束下路径；区别visibility-fan是单点可见域，ray-chain是反射/折射链。复用现有路径采样可以但不能把其再计数。

反例：不是多人避碰、动态规划实时导航、曲线平滑、任意多边形布尔并集。膨胀障碍重叠直接拒绝而非假装可以绕；图最短结论限当前合法矩形域与双精度谓词，非精确算术证明。

### 4. `compileRadialWarp({source,target,radius}) → {sample(points,strength=1)}`

1–32对地标，radius[0.0001,10000]；高斯径向基函数插值**位移**，全局求系数。高斯消元带部分主元，主元小于1e-9、系数绝对值大于1e8或重建任一地标任一轴误差超过1e-7即拒绝。这个残差只保证地标，不保证任意点条件数/全域误差。每次0–8192点、strength[0,1]，返回新点数组；0为精确原样，1为完整变形。compile O(N³)，sample O(PN)。支持多次任意顺序求值，输入地标被复制。

应用：海报局部拉动、2D布面纹理、示意图校正。区别affine-skin：无骨架、权重或逆绑定，权重来自控制点之间的距离核与插值约束；区别projective-quad的全局单应，以及polygon-morph的逐点对应内插。本项给未显式对应的内部点提供空间延拓；样片将规则网格一起形变。

反例：不是弹性力学、不保长度/面积/方向、不保证无折叠；同源点、很宽核造成病态会拒绝。离控制点远时变形衰减到身份，不是全域刚体平移。目标可导致局部翻转，调用者需限制视觉输入。

## 验证与迁移

测试包括20组Voronoi面积和最近站点顶点证书、120随机成本矩阵的全排列oracle、单障碍解析最短路线、两障碍逐段内部排除、RBF地标/身份/衰减/强度；最大工作量与不变性/坏输入覆盖。测试通过不是正式入库资格，需继续独立去重审计、边界审计和真实消费验证。

`../render.mjs`三支8秒技术场景：第1支城市包裹投递组合Voronoi/配对/路由，第2支织物组合RBF/距离场，第3支印纹组合反应扩散/误差扩散。无原作品更改，不主张这些技术片达到最终艺术片水平；均静音，无听审。
