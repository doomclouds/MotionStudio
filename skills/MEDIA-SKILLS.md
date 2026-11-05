# 媒体 Skills：发现、安装和离线调用

三个独立任务入口：[视频审核](video-review/SKILL.md)、[音频审核](audio-review/SKILL.md)、[配乐生产](soundtrack-production/SKILL.md)。共享依赖是相邻 [Motion 导演](motion-film-director/SKILL.md) 的正文、工具和 runtime，不复制三套引擎/资产/证据 schema；读取专门入口即可工作，不需要执行整套制片流程。

## 完整仓库

从根 `AGENTS.md` 或以上路径发现入口。命令从实际仓库根执行；现有安全源码检查与许可不变。从审定的 Git 跟踪文件构建到仓库外新路径：

```sh
python3 scripts/build-skill.py --media-skills --output /authorized/media-skills.zip
```

不带 `--media-skills` 仍生成原有单 Motion 包，不改变其布局。builder 不提交、不下载依赖、不读私人 `.env`；新源文件必须先纳入所审定的 Git 索引。`bundle-manifest.json` 校验整个组合包的路径、大小及 hash，不是供应链签名或作品通过证明。

## 组合包安装

解压到全新暂存目录，核清单、许可与已有目录冲突。将 `video-review/`、`audio-review/`、`soundtrack-production/`、`motion-film-director/` **四个目录保持并列**放入宿主支持的同一 skills 根；保留包根的本说明、LICENSE 和清单用于追溯。已有同名安装先核版本，不自动覆盖，也不复制旧 `.env`。按宿主要求重新加载/发现，确认三个独立 name/description 可见；宿主未支持时直接读取对应 `SKILL.md`。本仓库不提供宿主注册 API，也不以目录存在冒称宿主安装已验证。

便携环境由相邻 `motion-film-director/SKILL.md` 和 `runtime/` 定位共享根，以组合包清单/工具 hash 记录版本；没有 Git 时不编造 commit，也不要求取得源码仓库才能执行包内能力。

不要只复制三个薄入口，或把它们嵌进另一层而丢掉相邻依赖。四个目录名不能单独改名。默认 Motion 包不包含完整数值 benchmark、仓库 wrapper `review_film.py`、UI/sound-director 独立入口或私有素材；缺项保持缺项，不执行不存在的命令。专门入口所引用的制作/审核正文与本地基础工具均包含在组合包。

## 便携运行位置与明确命令

把当前目录切到四个目录中的 **motion-film-director/**。Python、Node 24+、FFmpeg/ffprobe、NumPy/Pillow 等执行依赖由使用环境预先提供，不随包安装。本文仅列三个工作流需要的当前路径：

```sh
python3 scripts/motion-check/motion_check.py /authorized/film.mp4 --out /authorized/check-new
python3 runtime/review-tools/audio_review.py --audio /authorized/selected.wav
python3 runtime/review-tools/audiovisual_review.py prepare /authorized/film.mp4 --expected-sha256 ACTUAL_MOVIE_SHA256 --output /authorized/prepared-new
python3 runtime/sound-elements/sound.py query --kind bgm
python3 runtime/sound-elements/sound.py render --id quiet-pulse-bed --output /authorized/new-bed
node runtime/motion-audio-core/scripts/audio.mjs validate --timeline /authorized/new-bed/timeline.json
node runtime/motion-audio-core/scripts/audio.mjs render --timeline /authorized/new-bed/timeline.json --source-root /authorized/new-bed --work /authorized/new-mix --aac
```

路径、hash、范围均换成实际授权项目；示例不默认选择候选音乐作为最终方案。前三项分别是技术诊断、音频 dry-run、模型输入本地准备；没有真实观看/听审，也不联网。后三项生成/混音技术候选，不是成熟作曲或质量验收。读对应 Skill 和工具合同再用，不批量照抄执行。

组合包可选模型配置仍唯一位于 **motion-film-director/.env**，不是三个薄入口或媒体目录；不用 shell 参数/聊天传 key。现有文件保护、上传/预算授权、当前价格核查与失败停点继续按模型合同。无 key 可完整执行上述离线路径，无法据此声称在线审核或配乐生成服务可用。

## 验证边界

从源码运行 `python3 scripts/test_media_skill_package.py`：用独立临时索引构建、解压并检查四入口、全部清单字节、转换后链接、凭据/私有媒体排除，以及包内真实候选→混音、合成视频解码/准备与音频 dry-run。`scripts/test_media_workflows.py` 检查仓库路线。测试不需要原仓库中的媒体/私有配置，不认证主观质量、在线计费、跨平台或宿主自动注册。
