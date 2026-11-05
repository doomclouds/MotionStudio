# 阿里云媒体 Skills：发现、分发、调用

四个专门入口：[视频审核](aliyun-video-review/SKILL.md)、[音频审核](aliyun-audio-review/SKILL.md)、[配乐](aliyun-music/SKILL.md)、[配音与旁白](aliyun-speech/SKILL.md)。统一[模型 API、安全和官方来源](../scripts/ALIYUN-MEDIA.md)，共享一份 [Motion 导演](motion-film-director/SKILL.md) runtime 与现有工艺/审核正文。通用本地工作流仍在 `MEDIA-SKILLS.md`，不混淆为阿里云模型已调用。

## 构建与安装

完整仓库从根 AGENTS 路由，直接读相应入口。把审定的新源码纳入 Git 索引后，在仓库根构建到全新仓库外路径：

```sh
python3 scripts/build-skill.py --aliyun-skills --output /authorized/aliyun-skills.zip
```

解压核 `bundle-manifest.json` 的每个路径/hash/大小与 LICENSE。将四个 `aliyun-*/` 和 `motion-film-director/` **五个目录保持相邻**放在宿主支持的同一 skills 根，保留根说明与清单。已有同名安装先核版本，不自动覆盖，不拷旧 `.env`。按宿主要求重新加载，检查四个 name/description；宿主自动注册未经本工程测试，可直接读 SKILL.md。单独复制薄入口不完整，移动 runtime 或改目录名会破坏定位。

`--media-skills --aliyun-skills` 可组合七个独立工作流与一份 Motion 依赖；不带选项仍是单 Motion 包，包含共享适配器而不包含四个独立入口。原 `--media-skills` 仍仅三个通用入口；不能从缺失的别包入口推断已安装。

## 实际便携命令

当前目录切到 **motion-film-director/**，只需现有 Python3.10+、FFmpeg/ffprobe（音频模型用标准库；原稀疏 AV 路线另需其既有依赖）。不自动安装依赖、不使用原仓库路径：

```sh
python3 runtime/review-tools/aliyun_video_review.py /authorized/clip.mp4 --expected-sha256 ACTUAL_SHA256
python3 runtime/review-tools/audio_review.py --audio /authorized/selected.wav
python3 runtime/review-tools/aliyun_audio_generation.py music --workspace-id WORKSPACE_ID --input-file /authorized/music-brief.txt
python3 runtime/review-tools/aliyun_audio_generation.py tts --input-file /authorized/narration.txt --voice Cherry --language Chinese
```

以上全为 dry-run，未核宿主权限/真实模型/计费/听感；live 条件和限制必须读共享合同。配置仅 `motion-film-director/.env`，不是四个薄入口、媒体目录或当前 cwd。不读取/写入聊天密钥。运行结果在安装目录外私有项目，不随 ZIP 发布。

## 可重复验证

`scripts/test_aliyun_video_review.py` 验真实合成 MP4 解码与模拟模型；`scripts/test_aliyun_audio_generation.py` 验请求/预算/下载/音频/不确定状态；`scripts/test_aliyun_skill_package.py` 真构建、解压，核四入口、路径、清单和离线 CLI。测试禁止真实网络/配置，模拟响应只是协议测试，不冒充真实调用、审核或作品通过。费用/限流/区域需按合同日期重新核官方文档。
