# geometry.rectangle-obstacle-route

<!-- asset-self-description: geometry.rectangle-obstacle-route -->

## 当前资产入口

本页是`geometry.rectangle-obstacle-route`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/rectangle-obstacle-route.test.mjs)验证本资产独立数值合同；原seven-foundations跨项测试保留共享位置。旧guide、实现和测试位置不留wrapper。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


Shortest visibility-graph path around separated axis-aligned rectangular obstacles.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`routeRectangles`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[index.mjs](index.mjs)。

## 参数、用途与边界

## 通用合同

所有记录必须为普通对象、准确字段集合、数据属性，拒绝未知字段、symbol和getter；代理对象不属于支持输入。数组必须为稠密数据数组；不读取索引getter。点为 `{x,y}`，每轴有限且在[-10000,10000]；矩形 `{x,y,width,height}`，宽高[0.0001,10000]。不修改输入，不缓存调用者数组。浮点运算不是鲁棒精确计算几何内核。外部ID由输入顺序对应，算法不生成业务身份。验证器、矩阵求解、插值strength与示例时钟全部支持层，不另计基础。

### 3. `routeRectangles({start,end,obstacles,clearance=0})`

0–24轴对齐障碍矩形；clearance[0,1000]对四边等量膨胀。膨胀后矩形内部不能重叠（触边合法）；起终点不能落内部。通过起终点与矩形角构成可见图，Dijkstra求最短欧氏折线。返回 `{reachable,vertices,length}`；无法到达则空数组/null。相同起终点长度0。边界可走，clearance是L∞矩形膨胀，不是圆角欧氏距离偏置。无外部世界边界，路线可绕到场景外。最多98节点、测试每边24障碍，O(V²R)。

应用：地图导览、图解连线、有限障碍的配送路径。区别cubic-path/折线路径：它们沿已写路径寻址，本项解障碍约束下路径；区别visibility-fan是单点可见域，ray-chain是反射/折射链。复用现有路径采样可以但不能把其再计数。

反例：不是多人避碰、动态规划实时导航、曲线平滑、任意多边形布尔并集。膨胀障碍重叠直接拒绝而非假装可以绕；图最短结论限当前合法矩形域与双精度谓词，非精确算术证明。

## 可执行输入

按 [注册示例](../../../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

```json
{
  "start": {
    "x": 0,
    "y": 0
  },
  "end": {
    "x": 10,
    "y": 0
  },
  "obstacles": [
    {
      "x": 4,
      "y": -1,
      "width": 2,
      "height": 2
    }
  ],
  "clearance": 1
}
```

## 当前证据与来源边界

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[test/seven-foundations-geometry.test.mjs](../../../../test/seven-foundations-geometry.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../../../../docs/history/private-candidates/seven-foundations/geometry-GUIDE.zh-CN.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/geometry/rectangle-obstacle-route/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/geometry/rectangle-obstacle-route/test/*.test.mjs
```

保留共享[geometry-validation](../../../internal/geometry-validation.mjs)，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

接口返回独立结果，不修改输入。radial-warp使用复制地标的编译闭包，其余三项直接求值；不要臆造通用品牌或深冻结合同。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。

共享[注册示例](../../../../examples/registered-foundations.mjs)仍覆盖原setup/compile/sample流程；本目录contract另提供单资产可执行输入，不移除原跨项演示。
