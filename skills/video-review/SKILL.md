---
name: video-review
description: 审核已有视频的内容、动作、读时、节奏、技术完整性和声画关系，定位问题并复验；用于单片、参考复刻或新旧版对照，不负责重新制作影片，也不把抽帧或指标当成完整观看。
---

# 视频审核 · 可复用仓库流程

直接视频审核委托从这里开始，无需先启动制作导演。输入为实际视频、目标/反证、需保留的已接受范围，以及可选的合法参考；输出为绑定版本和时间窗的问题、证据、修复建议及逐门状态。审核不是许可审定或用户接受，修片只在当前委托授权内进行。

本入口不复制审查算法、模型客户端或证据 schema。先定位含 `SOURCE-SCOPE.md`、`engine/`、`skills/` 的真实 MotionStudio 根，记录 commit；下面命令从该根执行。需要 Python 3、现有 FFmpeg/ffprobe，motion-check 另需 NumPy/Pillow。技能目录不是宿主自动注册；直接读取本页即可执行。只复制本目录不足以离线使用；完整仓库与四目录组合包的发现、依赖和运行位置见[安装与调用](../MEDIA-SKILLS.md)。便携模式由相邻 `motion-film-director/SKILL.md` 与 `runtime/` 定位共享根，不要求包中存在仓库的 `SOURCE-SCOPE.md`。

## 先分清技术检查与实际观看

1. 读[视听审查操作规程](../motion-film-director/references/audiovisual-review-sop.md)，冻结当前编码 hash、片长、流时间基、brief、范围与参考权利。源代码/脚本只解释意图，不代替成片。审核仅某窗口时保留未看区间，不外推全片。
2. 按[有引导的自审](../motion-film-director/references/guided-self-review.md)选择当前入口。仓库外项目走其“仓库外私有项目的当前路线”；不要为使用 `review_film.py` 把私有作品搬入源码库或放宽忽略门禁。
3. 实际常速完整观看当前视频，再到疑点取原生 PTS 邻帧。核目标尺寸下的文字/主次、对象身份、动作因果、转场与结尾。每项问题先记可观察事实与覆盖，再记解释/建议；不先给冷评者作者期望答案。
4. 有声片按[音频审核](../audio-review/SKILL.md)分出声音观察，再实际常速合看同版声画。稀疏图像＋真实音频模型不能认证连续运动或完整同步；播放器 ended、全量解码、接触表和 schema 有效也不代表实际看过。
5. 复刻/退步对照沿自审正文的同格式基准与事件对应方法，比较双方实际动作及相位，不用平均相似度或任意“最像帧”代替。修订后重新绑定新编码，回归问题窗、邻窗及未用于调参的控制窗；全局修改须重审全长。

## 当前可执行路径

仓库外单片本地技术诊断（输出目录须全新，路径替换为授权项目）：

```sh
python3 skills/motion-film-director/scripts/motion-check/motion_check.py /authorized/film.mp4 --out /authorized/check-new
```

它可解码、提取技术信号和诊断图，不理解剧情、不观看、不听审。参考诊断入口及显式窗口参数以[自审正文](../motion-film-director/references/guided-self-review.md)为准；不再造第二套 wrapper。需要模型辅助时读取[现有适配器合同](../../scripts/AUDIO-REVIEW.md)：本地 `prepare` 与收费 `call` 分开，默认不调用；模型意见须裁决，未选区间保持未审。

单 Motion portable 包可直接使用其 `references/audiovisual-review-sop.md` 和 `scripts/motion-check/motion_check.py`；组合包另携本独立入口。便携命令从共享 `motion-film-director/` 根执行，精确路径见[安装与调用](../MEDIA-SKILLS.md)。完整 benchmark 不随包分发，缺能力保持缺口。

## 收口与交接

在项目已有审查/决定记录中返回：媒体 hash/范围、实际工具/观察方法、发现与反证、时间窗/证据位置、修复后复验，以及技术、视觉、听觉、声画同步、用户接受各自原状态。无连续观看能力就明确 `NOT_REVIEWED`，不能让技术通过补门。

完整影片交付沿[既有交付合同](../motion-film-director/references/final-delivery-evidence.md)；单次问题诊断不强制扩成制作任务或整套交付。私有媒体/回执留在授权项目，公开源码只保留方法。到任务范围完成或缺必要能力/授权时停止，指出下一步，不用无穷重审代替决定。
