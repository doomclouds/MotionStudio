# 局部揭示：固定圆角窗与移动条带求交

几何窗口边界不随progress缩小或重新圆角，实际可见域是固定圆角边界与方向条带交集。父矩阵由外层设置一次，局部clip不是屏幕空间遮罩。

起点不调用内容，终点仍保持完整窗口裁切。透明内容的孔不会补色；不是文字alpha mask或滤镜。内容重排、可读时间和减动中点cut都由调用者安排，API不新增时钟。

两个独立Path2D不改变调用者current path，save/finally restore恢复Canvas状态。但callback自己的path或外部副作用不能回滚，thenable拒绝也不是异步沙箱。

本资产实现本来就是绘制适配，现在完整搬到index，不增包装层。例子用记录式Path2D检查两次clip和144像素条带，原Native测试验证真实栅格，见[合同](README.md)。
