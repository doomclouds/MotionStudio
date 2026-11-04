# Sound Elements · 声音资产

与 Design Elements / Motion Elements 并列的声音资产层。它不是 Audio Core 的替代品，不是自动听审、作曲模型或音频工作站。先读[声音书架](../../knowledge/sound/INDEX.md)，再选[资产目录](INDEX.md)，最终调用现有 [Audio Core](../motion-audio-core/README.md)。

## 唯一真源与每资产目录

`assets/<kind>/<stable-id>/asset.json` 是每件声音的唯一事实合同；kind 层保留 SFX/BGM/voice 分类，目录名必须等于稳定 ID。每件配套 `design.md` 是由合同生成的可读设计说明，校验拒绝漂移；生成器/文件与许可证入口均在单件中明确链接。每份合同自带意图、适用/反例、类别/情绪、时长格式、循环、作者/来源、许可/分发条件、入口和验收边界。不用大 catalog 复制这些事实。`INDEX.md` 是同源生成的可读视图；`sound.py query` 直接读合同，返回完整描述，不把关键词排序当艺术推荐。标题变化不改变 ID；影响声音/用途/权利的变更升 version，旧证据不能沿用。

此版收录原创、无外部采样的生成代码候选：常用 SFX 与一个 BGM 节拍底床。不是拿测试正弦波冒称已接受作品，也不是“不错的 BGM”听审认证；其具体局限写在各合同内。所有听审、声画关系和用户接受仍未验。成品歌曲、人声、自然环境录音没有库存就留空。现有作品混合音轨不得改名成干净配乐或独立音效。

短材质候选与既有轻触、风声、低频落位各有不同职责：纸质摩擦联想、印刷短拍和非谐波共振点声只在对应画面动作需要时选择。固定合成参数/seed见单件合同，不增加任意代码或DSP入口；它们不是实录材质，也不将技术消费等同听审接受。

短键按压候选 `keyboard-press` 只用于实际键入或按键动作；52ms按压/键帽/释键结构不同于有音高轻触或共振重音。重复事件由消费者显式摆位，不为占位符或光标闪烁补声。两套通用合成时序测试检查事件覆盖、重叠与留白，不代表实际影片同步或听感验收。

## 本地调用

需要 Python 3.10+；生成器仅用标准库。默认不联网、下载、安装、播放或上传任何素材。运行于仓库根：

```sh
python3 engine/sound-elements/sound.py validate
python3 engine/sound-elements/sound.py query --kind sfx --category transition
python3 engine/sound-elements/sound.py query --kind bgm --mood minimal
python3 engine/sound-elements/sound.py render --id air-pass --output /authorized/new-air-pass
python3 engine/sound-elements/sound.py render --id quiet-pulse-bed --repeats 2 --output /authorized/new-bed
node engine/motion-audio-core/scripts/audio.mjs render --timeline /authorized/new-bed/timeline.json --source-root /authorized/new-bed --work /authorized/new-mix
```

输出父目录必须存在，目标目录必须全新并在源码包、输入库之外。输出包含 `source.wav`、MIT/来源许可、`timeline.json` 与 `receipt.json`，并附 `asset.json` 与 `design.md` 合同快照供追溯（快照的相对源码入口仍以原资产目录为上下文，不是独立可运行资产库）。不得提交输出。生成器不覆盖已有路径，失败留下的内容不算成功。技术回执包括合同/代码或源文件/输出 hash、实际采样数、sample peak、Python 运行时；不量响度/true peak，不归一化、不限幅、不假装听过。精确 PCM 可重复性只承诺同一 Python/libm 环境。

生成的 timeline 可由 Audio Core 直接消费，显式 stereo、48kHz、source hash、裁剪/摆位/声部。用户/导演仍需将它放入自己的时间线并决定增益。`--repeats` 只对声明的 loop 候选建立显式重复 clip，不调用未知 loop API；默认一次完整资产，重复时使用半开 loop sample 区间，最多32次且总长不超过600秒。周期算术连续不证明听感无缝。重复混音必须实际合听，长片/预算等仍受 Audio Core 自己的更严限制。

## sound-asset/1 契约

精确字段和拒绝行为由 `sound.py validate` 与测试维护，不另设平行 schema：

- `schema / id / version / title / kind / category / moods / status`：SFX/BGM/voice 分类，状态为 candidate 或 retired；retired 默认查询隐藏且禁止生成。情绪是设计意图标签，不是感知结论。
- `design`：intent、use_when、avoid_when、mix_notes。可含音高、节拍、对齐、遮蔽风险；不能把参数描述当听感事实。
- `audio`：duration_seconds、duration_basis（recipe/measured）、format/codec/sample_rate/channels 与 loop。当前执行范围只支持 48kHz stereo PCM16 WAV、600秒以内；其他真实素材应先在授权项目转换并记录派生关系，不伪填支持格式。loop 的起止为半开源采样区间；one-shot 不接受 loop 区间。
- `source`：generated / local-file，entry 为资产目录相对入口，creator/provenance 必填。生成器只执行内置白名单 recipe，不运行合同中的任意命令；文件输入需实际 SHA-256，局部加载检查路径与边界，执行时重核文件身份。generated 的 sha256 为 null，实际代码和输出身份写本次回执。
- `rights`：license、license_entry、use、standalone_distribution、conditions、basis。两种权利单独为 allowed/unknown/prohibited；有来源和 hash 不等于有授权。分发为 prohibited 的文件可以在有使用权的私有项目使用，不能因为可生成就对外打包。代码不会替你验证法律事实或自动发布。
- `review`：技术留 RUN_REQUIRED，由每次回执给出相应技术结果；listening=NOT_LISTENED、av_sync/owner=NOT_RUN。当前公共候选合同不承接私人听审证据，也不支持把标签手改成 PASS；真实听审与用户接受走现有声音导演/项目证据。技术合同合格与作品准入完全分离。

`--library /authorized/private-sound-library` 可读同形状 `assets/<kind>/<id>/asset.json` 的私有库，允许实际授权本地 WAV+许可文件，不默认公开，不自动导入任何工作区。source/license 路径必须在该库内，无符号链接；本地资产需 measured 时长与 hash。外部库仍禁止任意生成代码。先通过真实测量和逐项授权核验填写合同，不能把示例虚构值当素材。

## 沉淀和维护

1. 制作项目先保留来源、授权、精确字节与取得方式。将下载候选留在原私有 SFX 寻源目录，它是采集入口，不是这个复用库的第二份目录。
2. 实际反复使用后选择保留：SFX 按动作职责，BGM 按结构职责分类。许可未知先不分发；缺独立声部分轨则仍记整条混音，不宣称拆分。
3. 提炼独立资产目录/合同或可复现代码，记录反例、修改与署名、循环边界、验证能力。媒体需单独审查现有 source-assets-allowlist，不因新合同自动获准进入 Git。
4. 技术检查、实际听审、A/V同步、用户接受分别做；至少听单件、重复、同片段全混音，小扬声器/耳机与首尾需要时分别覆盖。未具能力即保留未听，不按数量或技术 PASS 晋级。
5. 修改合同后用 `python3 engine/sound-elements/sound.py design --id <id> > engine/sound-elements/assets/<kind>/<id>/design.md` 同步设计说明（仅该命令允许设计说明暂未同步）。从合同生成 INDEX：`python3 engine/sound-elements/sound.py index > engine/sound-elements/INDEX.md`。`python3 -m unittest discover -s engine/sound-elements -p 'test_*.py'` 会检查视图未漂移、生成、拒绝边界及真实 Audio Core 接入。无运行环境必须显式报 skip，不算听审。

回滚只撤此模块、导航和打包增量；不重写作品来源、不删除私有素材、不改变 Audio Core API。便携包中路径为 `runtime/sound-elements/`，共享书架仍为 `knowledge/sound/`，命令相应替换 engine→runtime；无需完整仓库即能查询/生成/混音。
