# 折线路径、登记轮廓形变与条带包络

[返回入口](../../README.md) · [目录与公共 API](../registered-foundations.md)

本页保存对应机制的详细合同、合成示例和已有证据限定。历史批次数量不是当前目录数，已有测试描述不代表本次重新运行或艺术通过。代码片段中相对导入以本页所在目录为基准；shell 命令按各段注明的工作目录运行。

## 当前资产合同

- [折线路径与空间拖尾](../../lib/foundations/geometry/polyline-trail/README.md)：累计局部弧长采样。
- [登记多边形形变](../../lib/foundations/geometry/registered-polygon-morph/README.md)：显式身份对应与逐样本几何校验。
- [采样条带包络](../../lib/foundations/geometry/sampled-band/README.md)：垂直半宽与直线段轮廓。

各原API段、可调用场景与证据边界已迁到相应资产。这里保留组合导航，不建立旧实现wrapper；共享Canvas适配仍保留原职责。
