# 原生渲染合同

唯一生产核心位于 runtime/motion-render-core。Node.js + @napi-rs/canvas 绘制 PNG，FFmpeg 负责编码。旧浏览器代码已移出核心，历史记录不能被作为原生验收证据。

- prepareNative({scenePath,canvasModulePath,width,height,fps,duration}) 载入明确的本地 ES 场景与现有 Canvas 包，不自动安装。
- 场景导出 config、可选 dependencies 和 createScene({canvas,ctx,canvasApi,config})；返回 renderFrame(frame,time) 或 render(time)。资源实际使用与 dependencies 声明须一致。
- handle.renderFrame(frame) 限制整数范围 0..N-1，以 frame/fps 求时间并完整重绘；handle.png() 返回 PNG。close() 结束生命周期。
- prepare、生成结束与封装前核源码身份；输出报告保存引擎、场景、依赖与配置指纹，不把旧帧混入新版本。
- 默认配置为 1280×720、30fps、6秒，但内置技术夹具明示 320×180、30fps、1秒。场景明示配置优先；冲突覆盖须先修改场景。
- 不使用浏览器、网络端口、CDP、GSAP、HTML/CSS 或逐帧截图铺底。文字、矢量图形和图像在原生 Canvas 中绘制。
- 确定性需以顺序、乱序、重复帧和重新创建实例的实际输出核验。字体、合成与平台版本变化可能改变像素，不承诺跨平台完全一致。
- FFmpeg 临时输出经帧数、尺寸、帧率及全量解码检查后原子改名。艺术、音频听审和用户认可另外记录。
- 权限拒绝时停止该动作，不关闭安全边界、不更换协议规避；可继续独立获准的源码工作。

## Canvas 0.1.100 兼容性约束

@napi-rs/canvas 0.1.100 的 blur 半径不得序列化为科学记数法：当前环境独立复现 `blur(6e-7px)` 导致 SIGSEGV，同值普通十进制正常。半径必须有限、非负并使用普通十进制字符串；视觉可忽略的半径可按场景约定（例如 <0.01px）设为 `none`，但须回归过渡边界。不得重跑已知崩溃案例或把进程退出当成正常帧。详见[数值格式边界](engine-use.md#原生滤镜的数值格式边界)。这项约束不修改引擎核心或依赖版本，不代表其他滤镜已全量验证。
