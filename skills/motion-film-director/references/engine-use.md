# 原生引擎使用

生产路线：Node.js + @napi-rs/canvas → PNG → FFmpeg。不需要 Chrome、CDP、GSAP 或本地 HTTP 服务。依赖现有 Node、原生 Canvas 包及 FFmpeg/ffprobe；缺项明确失败，不自动安装。

## 手动准备依赖（两条路线选一）

需要 Node.js >=24（当前验证版本 v24.22.1）。核心声明精确依赖 `@napi-rs/canvas` 0.1.100；当前没有 lockfile，不能据此宣称依赖树完全锁定或跨平台像素一致。FFmpeg、ffprobe 仍需已有安装，视频编码需支持 `libx264`。

- **新安装：** 在源码仓库根目录先 `cd engine/motion-render-core`；在解压后的可移植 Skill 根目录则 `cd runtime/motion-render-core`。然后由使用者明确执行 `npm install --ignore-scripts`，再执行 `node --test test/native.test.mjs`。安装命令会下载声明的包及平台可选依赖，并可能生成本地 lockfile；不要排除 optional dependencies，不要把 node_modules 或平台二进制提交进 Git。仅声明依赖不会在渲染时自动下载。
- **已有安装：** 无须运行 npm，给核心或 Skill 入口传入 `--canvas-module /absolute/path/to/node_modules/@napi-rs/canvas`，或设置 `MOTIONSTUDIO_CANVAS_MODULE`。使用已验版本 0.1.100；外部路径实际加载版本会被记录，但 loader 不会强制校验版本声明。

解析顺序：显式路径 → 环境变量 → 核心目录的普通 Node 模块解析 → 云环境既有 `/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas` 回退。指定的显式路径或环境变量无效时直接失败，不继续回退；外部机器不必具备这个云路径。下列命令从 Skill 根目录运行，安装后请回到该目录。

## 场景和配置

场景为 ES module，导出 config={width,height,fps,duration} 与 createScene({canvas,ctx,canvasApi,config})，返回 renderFrame(frame,time) 或 render(time)。每次定位均重绘完整状态，禁止累积上帧状态。合法字体须显式注册并加入 scene.dependencies；素材与音轨保留来源。

## 生成完整视频

从 Skill 目录运行：

```sh
node scripts/render-shot.mjs --work ../tmp/native-shot --scene /absolute/path/scene-native.mjs
```

--scene 可省略以使用一秒 320×180/30fps 技术夹具；它不是作品模板。--audio 可指定有权使用的冻结音轨；不指定时明确静音。--canvas-module、--ffmpeg、--ffprobe 只选择现有依赖。--work 须是 Skill 之外的新目录，输出目录不得已有渲染报告或成片，以免混合历史帧。

输出位于 output/frames、output/native-frame-report.json、output/shot.mp4 及 output/shot-report.json。先逐帧生成、核帧 hash，再编码临时 MP4，ffprobe 核尺寸/帧率/帧数并完整解码，成功后原子改名。音轨流存在不等于听审通过；声音落点、掩蔽与连续视听单独检查。

## 局部帧与配置

从源码仓库的 Skill 目录运行：

```sh
node ../../engine/motion-render-core/scripts/render.mjs --scene /absolute/path/scene-native.mjs --work ../tmp/native-frames --frames 0,15,29
```

从可移植包的 Skill 目录运行：

```sh
node runtime/motion-render-core/scripts/render.mjs --scene /absolute/path/scene-native.mjs --work ../tmp/native-frames --frames 0,15,29
```

该入口仅生成 PNG。支持 --width、--height、--fps、--duration；与场景明示配置冲突会拒绝，不能靠参数自动缩放既有画面。帧索引为 0..N-1，N=duration×fps 为整数。局部采样报告不得冒充完整片。

修改源码后使用新工作目录重渲并重新绑定源码/依赖/引擎指纹。不要复用旧后端帧。旧 HTML、浏览器快照和 Mac 验证仅作归档，不是此入口的依赖或回退路线。

## 原生滤镜的数值格式边界

已在 Node v24.22.1、@napi-rs/canvas 0.1.100 中独立复现：`ctx.filter = 'blur(6e-7px)'` 后进行绘制及读取像素会使进程 SIGSEGV；同值普通十进制 `blur(0.0000006px)` 与 `none` 在该最小案例中正常。这是具体版本的解析边界，不代表所有滤镜或所有版本均有相同行为。不要重复执行崩溃案例。

场景不要直接把浮点数用字符串插值写入 blur()，因为极小数可能自动转成科学记数法。先校验半径为有限非负数，再用足够精度的普通十进制序列化。若对当前画面可忽略，可将小于 0.01px 的模糊设为 `none`；此阈值是场景取舍，不是保留像素完全等价的保证，需检查过渡边界。相同方式检查时间插值产生的临界值及重复/乱序定位。不要通过改系统安全设置、重新启用浏览器或静默更新依赖来掩盖错误。

