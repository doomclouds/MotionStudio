# 五核心视频导演 · 原生 Canvas 候选

从 [SKILL](SKILL.md) 进入，命令与工作目录见 [引擎使用](references/engine-use.md)。这是指导工作版，不是最终成熟认证。

在本目录使用已有 Node.js、@napi-rs/canvas 0.1.100、FFmpeg/ffprobe：

```sh
node scripts/render-shot.mjs --work "/absolute/path/outside-repository/shot-one"
```

输出留在 Skill 外；默认技术夹具有意静音，不算新影片。该命令不下载或安装依赖。

核心：`SKILL.md`、`references/`、`ENVIRONMENT.md`、`NOTICE.md`、`RIGHTS.md`。运行：仓库 `engine/motion-render-core/` 与本目录 `scripts/render-shot.mjs`（可移植包中为 `runtime/motion-render-core/`）。通用知识工具与空默认库：`research/video-knowledge/`；音效目录校验器默认不带真实素材。实际研究、素材目录与生产案例留在自己的私有工作区，不随本工具集分发。生成截图、验证报告和历史过程产物不随源码分发。

可移植包解压后的只读清单检查：`python3 scripts/verify_package.py .`（源码目录不保存生成清单）。这检查文件字节与路径，不评价艺术、声音或平台。

`runtime-source.json` 指向唯一维护引擎。可移植 `runtime/` 由仓库 `scripts/build-skill.py` 生成，正式 Skill 源目录不维护引擎副本。
