# 覆盖合成：只改变源alpha

alpha和luma是同一机制的模式。luma在encoded-sRGB字节域计算后乘mask alpha，invert对完整coverage取反；不宣称线性光或HDR。RGB原样保留，包括不可见RGB。

source与mask等尺寸，不自动对齐或缩放。两算子及draw共享单一快照WeakMap，输出继续能被另一算子或adapter消费；不得为目录化复制私有存储。

示例手算255×128/255=128及128×1=128；专属链式测试验证共享品牌和隔离副本。旧片只验证alpha非invert用途，工程模式不能扩大影片范围，见[合同](README.md)。
