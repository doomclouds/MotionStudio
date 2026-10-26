# 环境与恢复约束

## 当前生产路线

Node.js + `@napi-rs/canvas 0.1.100` + FFmpeg/ffprobe；源码模式通过 `runtime-source.json` 定位 `../../engine/motion-render-core/`；可移植包的核心位于 `runtime/motion-render-core/`，不使用浏览器、CDP 或 GSAP。依赖具体要求以引擎的 `native-runtime.json` 和 README 为准。工作区模式通过 `runtime-source.json` 相对定位引擎；可移植包使用生成的 bundled 路径。

使用已有依赖，不自动安装、下载或回退旧浏览器。字体显式注册，合法字体和许可随项目保留；系统字体变化和跨平台像素一致性需独立验证。不要复制 node_modules、平台二进制或整个运行环境进源码包。

## 源码与证据

公开工具集仅保留通用指导、源码、必要配置与许可，不含私人项目和恢复资产；迁移账本、PNG/MP4 小样、冷启动及评审报告只留在本地忽略目录，不作为运行依赖。历史指导来源见 `upstream-provenance.json`，许可边界见 `NOTICE.md` 与 `RIGHTS.md`。更换运行核心不抹除原始指导和资产来源。

从脚本位置或明确项目根解析相对路径，含空格路径加引号。保留 UTF-8；Windows 优先短解压路径。Node、FFmpeg、ffprobe 是否在 PATH 先逐项检测。可选 Python 技术工具的依赖见 [技术检查](references/technical-checks.md)，不强迫只读 Skill 使用者安装。

## 完整性检查

Python 3.10+ 标准库，不联网、不安装、不写文件。以下命令仅在可移植包解压后的 Skill 目录运行（该目录含构建生成的 `manifest.json`）；源码目录不保存此清单：

```sh
python3 scripts/verify_package.py .
```

Windows 的等价入口为 `py -3 .\scripts\verify_package.py .`，不是 Windows 已验声明。校验字节、hash、未登记文件及路径边界，不验证声音、美术、授权或媒体播放。

## 每次新作品验收

记录实际依赖 → 代表性字体/图形静帧 → 短视频与音频封装 → 跳时/重复实例 → 独立目录恢复。报告放在项目 `output/` 或 `verification/`，每次绑定实际源码和输出。程序通过不等于正常速完整观看、实际合听或用户艺术认可；跨平台需另验。

若取得具体新片的外发授权，再按 [可选音画审查](references/optional-media-review.md) 核实模型与输入限制；指导文档不是调用授权或已听审结果。
