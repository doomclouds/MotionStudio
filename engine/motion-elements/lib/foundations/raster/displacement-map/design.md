# 位移图：输出像素向源反查

RG128中性，正scale采更右/下的源，不等于图像向该方向移动。map alpha门控位移，蓝通道不用；8位map量化与滤波误差是两件事。

nearest遵循IEEE坐标floor(v+.5)，bilinear以预乘alpha混合后解预乘；精确整数位置保留hidden RGB。不能加epsilon伪装修复与精确有理数的边界差，也不承诺每通道1LSB上限。

快照存储只一份，与matte和draw共享canonical身份。例子验证透明map中性及双线性1/4像素手算，原跨realm/透明边/Native恢复测试保留。有限接受不是风格推荐，见[合同](README.md)。
