# 动作对应诊断：先理解参考，再比较标注

这是人工观察标注的可重复比较器，**不是视频事件识别、艺术评分、自动听审或交付批准**。Python 标准库；真实视频还需已有 FFprobe，不安装依赖、不联网、不调用付费模型。

## 何时使用：制作前就触发，而非交付后找绿灯

指定参考复刻，或反馈指出动作对象、时序、因果不一致时，导演应把本方法显式加入计划：`review_film.py plan ... --reference --method event-correspondence`。默认 `review_film.py run` 行为不变，不自动运行 sidecar。

1. **先真实观察源片。** 正常速完整观看与精确原生 PTS 邻帧分开记录；标出预备→接触→结果→释放、相机/主体身份、声音职责。没看到的范围写 `NOT_ASSESSED`，不凭脚本、缩略图、模型解释补全。不能获取参考时停止声称已复刻，并保留缺口。
2. 制作前写 source observation 表：媒体 hash、观察范围、真实帧 PTS、证据文件/hash、观察者、对象/动作/目标、未知与反证。标注是人的主张，图像 hash 不证明解码来源或语义真实。
3. 分清 **point**（起始时刻的不确定括号）、**state**（已观察占据区间）、**sampled_state**（一帧看到的状态）。三张压缩状态图不是三次触地；一帧站在平台上不证明首次接触或持续乘坐。`sampled_state` 只能一个采样、零宽区间，无 onset lag、无容差通过、不得计入事件序列。
**接触后还要看停留。** 首次接触、支撑/停留持续、释放和后果分别检查；首次接触对齐仍可能过早弹走。当前 `state` 边界是声明的确切边界，不支持边界不确定度；拿不准时用独立 `first_contact` / `release` 点事件各自的时间括号，不把粗采样估计写成精确 state。需要更丰富区间合同可并用 [EVENT_INTERVALS.md](EVENT_INTERVALS.md)，但仍不能证明物理碰撞或艺术正确。

4. 候选同样独立观察，显式配对身份，不以最近时间自动匹配。重复动作各保留一次实例；多个可能候选保持歧义，不选择最好看的那个。
5. 运行诊断、查原始证据、修复、重新导出；**新媒体 hash、新观察、新标注、新回执**。比较前后同一局部，还要检查邻窗和一个未参与调参的控制事件。缺标注不回退成技术通过。

## 可运行的合成示例

仓库工具在 `tools/reference-benchmark/`，解压 Skill 则在 `runtime/review-tools/`。下面设 `T` 为前者；所有输入输出放在自己的临时目录，不进源码库。输出目录必须不存在，父目录必须存在。

```sh
T=tools/reference-benchmark
python3 "$T/example_event_correspondence.py" --out /tmp/my-new-synthetic-example
for CASE in bad corrected control; do
  python3 "$T/event_correspondence.py" \
    --annotations "/tmp/my-new-synthetic-example/$CASE.json" \
    --reference-media /tmp/my-new-synthetic-example/reference.txt \
    --candidate-media "/tmp/my-new-synthetic-example/$CASE.txt" \
    --evidence-root /tmp/my-new-synthetic-example --synthetic \
    --out "/tmp/my-new-synthetic-example/$CASE.result.json"
done
python3 "$T/test_event_correspondence.py"
```

这些文件只是文本字节，**不是媒体/真实观察**。bad 应报告错误目标与确定晚到；corrected 去掉这两项已声明差异；control 是另一个合成释放事件，检查无须全片重排也能保持它的声明一致。这演示回归合同，不证明现实修片有效。真实标注参考生成 JSON 的结构，将 `dataset_kind` 改为 `real`，换成实际媒体/证据 hash、实际观察和原生 PTS；去掉 `--synthetic`，不能把合成标签冒充观察。

## 输入与结果合同

- schema 为 `motionstudio.event-correspondence/0.2`。只接受精确字段。时间是十进制**字符串**；双方分别以首视频 PTS 为零，但不偏移配准、拉伸、DTW 或用 FPS 推算采样。首 PTS 必须非负且不超过 3600 秒，负原点暂不支持。
- evidence 路径相对 `--evidence-root`，不能越界/符号链接。真实路径由可信操作者指定；不是不可信媒体服务或文件系统沙箱。最多 1 MiB 标注、每侧 100 项、每项 100 个采样、每配对 4 个候选、单文件 2 GiB、3600 秒、216001 帧。
- FFprobe 校验 best-effort 解码时间戳与声明采样存在性，不意味着所有容器都等于原始展示 PTS；缺帧不插值。证据图片只绑定字节，不自动重新解码证明图片来源。保留解码 provenance。
- 点事件 lag 范围为 `[candidate.start-reference.end, candidate.end-reference.start]`。全部超出显式容差才确定早/晚，交叠不确定区为 `TIMING_INCONCLUSIVE`；容差是本次编辑输入，不是通用人类感知阈值。状态边界/长度仅描述，不套点事件 IoU。
- 序列插入/删除诊断只比较所提交、语义已建立的事件标签，不证明全片事件覆盖。未知语义保留不完整；纯采样状态输出 `NO_EVENT_OBSERVATIONS`、null 编辑数；混合样本/事件保留 `PARTIAL_EVENT_EVIDENCE`。
- 同时间但不同 target 是语义错误；先接触与稳定停留是不同动作。未配对、未知、未观察均保留；未标注不证明影片不存在该动作。多个最优序列对应不消歧。
- 输出始终 `DIAGNOSTIC_NOT_APPROVAL`，艺术分 null，音频 `NOT_PERFORMED`，标注真值 `NOT_VERIFIED`。退出 0 只代表采集成功；编辑距离 0 不是通过。输入/绑定错误退出 2，不写结果。新输出原子创建、拒绝覆盖。
- 回执绑定标注规范内容、实现源码、媒体和证据 hash。`check_receipt_annotation()` 仅校验标注/实现身份，不重验媒体；当前媒体/证据需重新 evaluate。改标签后不得只改旧回执 hash。

## 是引擎限制，还是设计/审查问题？做消融，不猜

|最小实验|能支持什么判断|不能推出什么|
|固定素材/镜头，只改时间曲线；测试越界弹簧参数与最终帧|曲线被作者 clamp 而底层能表现越界，优先修作者参数|源码支持不代表成片已实现|
|固定时间/构图，换一个正确目标与操作后果|错误来自语义映射/故事因果时先修映射|同帧号、同色块不等于同动作|
|将遮挡/阴影/相机拆成最小独立场景|最小例也无法表达才有具体引擎能力缺口|不能以纯代码目标降低美术标准|
|保留已知坏例、修正例和独立好例，盲看同条件片段|检测器是否对改正有响应、是否误伤好例|合成测试、静帧或指标不是艺术验收|

声音另核实际音轨、事件职责、正常速合听与音乐情绪；不能用视觉对应表、峰值、任意 BPM 或音轨存在替代听觉评价。未听保留未验。修复记录沉淀为「适用条件→反证→最小复现→修改→新版本回归→仍未知」，而不是“某参数万能”。

## 研究借鉴与边界

- [TCC，CVPR 2019](https://openaccess.thecvf.com/content_CVPR_2019/html/Dwibedi_Temporal_Cycle-Consistency_Learning_CVPR_2019_paper.html)：启发按动作阶段对应；本工具没有训练或实现 TCC embedding。
- [TCN，CVPR 2017](https://openaccess.thecvf.com/content_cvpr_2017/papers/Lea_Temporal_Convolutional_Networks_CVPR_2017_paper.pdf)：序列错误与帧级一致是不同问题；这里只借鉴区分序列错误，不实现论文网络，不把持续段 IoU 移植到瞬时接触。
- [PEAVS，ECCV 2024](https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/10198.pdf)：视听同步可单独评估，但同步不等于配乐选择/情绪适配；未集成该模型，当前工具不听音频。

论文指标不直接成为艺术门。先用已知坏例和好例验证适用性，报告漏检、误报与未验；最终保留实际连续观看、合听和用户接受三类独立证据。
